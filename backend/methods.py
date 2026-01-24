from pathlib import Path
from db import cursor, connection
import json
from pywebpush import webpush, WebPushException
import os
import time
from pydantic import BaseModel

class Plant(BaseModel):
    id: int
    name: str
    interval: int
    last_pour: int
    owner_id: int
    temporary_owner_id: int
    image: str | None = None


# ---------- Helper Validation Utilities ----------

def ensure_positive_int(value, name="value"):
    if not isinstance(value, int) or value < 1:
        raise ValueError(f"{name} must be a positive integer (>= 1).")


def ensure_not_empty(text, name="value"):
    if text is None or not str(text).strip():
        raise ValueError(f"{name} must not be empty.")


def ensure_exists(table, item_id, label):
    cursor.execute(f"SELECT id FROM {table} WHERE id = ?", (item_id,))
    if cursor.fetchone() is None:
        raise ValueError(f"{label} with id={item_id} does not exist.")


def ensure_person_exists(person_id): 
    ensure_exists("person", person_id, "Person")


def ensure_plant_exists(plant_id):   
    ensure_exists("plant", plant_id, "Plant")


def ensure_chore_exists(chore_id):   
    ensure_exists("chore", chore_id, "Chore")


# ---------- PERSON METHODS ----------

def getPersonById(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    cursor.execute("SELECT * FROM person WHERE id = ?", (person_id,))
    row = cursor.fetchone()
    return dict(row) if row else None


def getAllPersons():
    cursor.execute("SELECT * FROM person")
    return [dict(row) for row in cursor.fetchall()]


def getAvailablePersons():
    """Get all available persons"""
    cursor.execute("SELECT * FROM person WHERE is_available = 1")
    return [dict(row) for row in cursor.fetchall()]


def getUnavailablePersons():
    """Get all unavailable persons"""
    cursor.execute("SELECT * FROM person WHERE is_available = 0")
    return [dict(row) for row in cursor.fetchall()]


# ---------- AVAILABILITY MANAGEMENT ----------

def setPersonAvailability(person_id, is_available, until_timestamp=None, since_timestamp=None):
    """
    Set person availability and trigger task redistribution/restoration
    """
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)
    
    # Get current availability status
    cursor.execute("SELECT is_available FROM person WHERE id = ?", (person_id,))
    current_status = cursor.fetchone()['is_available']
    
    # Case 1: Becoming unavailable (first time)
    if current_status == 1 and is_available == 0:
        cursor.execute("""
            UPDATE person 
            SET is_available = ?,
                unavailable_since = COALESCE(?, CAST(strftime('%s', 'now') AS INTEGER)),
                unavailable_until = ?
            WHERE id = ?
        """, (is_available, since_timestamp, until_timestamp, person_id))
        connection.commit()
        result = redistributeTasks(person_id)
        return {"status": "unavailable", "redistribution": result}
    
    # Case 2: Becoming available (returning)
    elif current_status == 0 and is_available == 1:
        cursor.execute("""
            UPDATE person 
            SET is_available = ?,
                unavailable_since = NULL,
                unavailable_until = NULL
            WHERE id = ?
        """, (is_available, person_id))
        connection.commit()
        result = restoreTasks(person_id)
        return {"status": "available", "restoration": result}
    
    # Case 3: Already unavailable, just updating dates
    elif current_status == 0 and is_available == 0:
        cursor.execute("""
            UPDATE person 
            SET unavailable_until = ?
            WHERE id = ?
        """, (until_timestamp, person_id))
        connection.commit()
        return {"status": "dates_updated"}
    
    # Case 4: Already available, no change
    else:
        return {"status": "no_change"}


# ---------- ROTATION HELPER FUNCTIONS ----------

def getNextAvailableInRotation(rotation_list, current_index):
    """
    Find the next available person in the rotation list.
    Skips unavailable people automatically.
    Returns the person_id of the next available person.
    """
    if not rotation_list:
        return None
    
    rotation_len = len(rotation_list)
    
    # Start from current position
    for i in range(rotation_len):
        check_index = (current_index + i) % rotation_len
        person_id = rotation_list[check_index]
        
        # Check if this person is available
        cursor.execute("SELECT is_available FROM person WHERE id = ?", (person_id,))
        result = cursor.fetchone()
        
        if result and result['is_available'] == 1:
            return person_id
    
    # If no one is available, return the current person anyway
    return rotation_list[current_index % rotation_len] if rotation_list else None


def findNextAvailableIndexInRotation(rotation_list, current_index):
    """
    Find the INDEX of the next available person in rotation.
    Skips unavailable people.
    """
    if not rotation_list:
        return 0
    
    rotation_len = len(rotation_list)
    
    # Try to find next available person
    for i in range(1, rotation_len + 1):  # Start from 1 to skip current
        check_index = (current_index + i) % rotation_len
        person_id = rotation_list[check_index]
        
        # Check if this person is available
        cursor.execute("SELECT is_available FROM person WHERE id = ?", (person_id,))
        result = cursor.fetchone()
        
        if result and result['is_available'] == 1:
            return check_index
    
    # If no one is available, just go to next in rotation anyway
    return (current_index + 1) % rotation_len


# ---------- TASK REDISTRIBUTION ----------

def redistributeTasks(unavailable_person_id):
    """
    Redistribute only NON-ROTATING chores and plants.
    Rotating chores automatically skip unavailable people.
    """
    # Only get NON-ROTATING chores assigned to this person
    cursor.execute("""
        SELECT * FROM chore 
        WHERE worker_id = ? 
        AND rotation_enabled = 0
    """, (unavailable_person_id,))
    chores = cursor.fetchall()
    
    cursor.execute("""SELECT * FROM plant WHERE owner_id = ?""", (unavailable_person_id,))
    plants = cursor.fetchall()
    
    cursor.execute("""SELECT * FROM person WHERE is_available = 1""")
    available_persons = cursor.fetchall()
    
    # Check if there are any available persons
    if not available_persons:
        raise ValueError("No available persons to redistribute tasks to.")
    
    available_persons = [dict(p) for p in available_persons]
    num_available = len(available_persons)
    
    # Redistribute NON-ROTATING chores using round-robin
    for i, chore in enumerate(chores):
        chore_dict = dict(chore)
        assignee = available_persons[i % num_available]
        
        cursor.execute("""
            UPDATE chore
            SET temporary_worker_id = ?
            WHERE id = ?
        """, (assignee['id'], chore_dict['id']))
        
        cursor.execute("""
            INSERT INTO task_reassignment 
            (task_type, task_id, original_owner_id, temporary_owner_id, reassigned_at, reason)
            VALUES (?, ?, ?, ?, CAST(strftime('%s', 'now') AS INTEGER), ?)
        """, ('chore', chore_dict['id'], unavailable_person_id, assignee['id'], 'Person unavailable'))
    
    # Redistribute plants using round-robin
    for i, plant in enumerate(plants):
        plant_dict = dict(plant)
        assignee = available_persons[i % num_available]
        
        cursor.execute("""
            UPDATE plant
            SET temporary_owner_id = ?
            WHERE id = ?
        """, (assignee['id'], plant_dict['id']))
        
        cursor.execute("""
            INSERT INTO task_reassignment 
            (task_type, task_id, original_owner_id, temporary_owner_id, reassigned_at, reason)
            VALUES (?, ?, ?, ?, CAST(strftime('%s', 'now') AS INTEGER), ?)
        """, ('plant', plant_dict['id'], unavailable_person_id, assignee['id'], 'Person unavailable'))
    
    connection.commit()
    
    return {
        'redistributed_chores': len(chores),
        'redistributed_plants': len(plants),
        'assigned_to': [p['id'] for p in available_persons]
    }


def restoreTasks(now_available_person_id):
    """
    Restore only NON-ROTATING chores and plants.
    Rotating chores will automatically include this person again.
    """
    ensure_positive_int(now_available_person_id, "person_id")
    ensure_person_exists(now_available_person_id)
    
    # Find NON-ROTATING chores that belong to this person but are temporarily assigned
    cursor.execute("""
        SELECT * FROM chore 
        WHERE worker_id = ? 
        AND temporary_worker_id IS NOT NULL
        AND rotation_enabled = 0
    """, (now_available_person_id,))
    chores = cursor.fetchall()
    
    # Find all plants that belong to this person but are temporarily assigned to others
    cursor.execute("""
        SELECT * FROM plant 
        WHERE owner_id = ? 
        AND temporary_owner_id IS NOT NULL
    """, (now_available_person_id,))
    plants = cursor.fetchall()
    
    # Restore chores
    for chore in chores:
        chore_dict = dict(chore)
        
        cursor.execute("""
            INSERT INTO task_reassignment 
            (task_type, task_id, original_owner_id, temporary_owner_id, reassigned_at, reason)
            VALUES (?, ?, ?, ?, CAST(strftime('%s', 'now') AS INTEGER), ?)
        """, ('chore', chore_dict['id'], chore_dict['temporary_worker_id'], 
              now_available_person_id, 'Task restored - person available'))
        
        cursor.execute("""
            UPDATE chore
            SET temporary_worker_id = NULL
            WHERE id = ?
        """, (chore_dict['id'],))
    
    # Restore plants
    for plant in plants:
        plant_dict = dict(plant)
        
        cursor.execute("""
            INSERT INTO task_reassignment 
            (task_type, task_id, original_owner_id, temporary_owner_id, reassigned_at, reason)
            VALUES (?, ?, ?, ?, CAST(strftime('%s', 'now') AS INTEGER), ?)
        """, ('plant', plant_dict['id'], plant_dict['temporary_owner_id'], 
              now_available_person_id, 'Task restored - person available'))
        
        cursor.execute("""
            UPDATE plant
            SET temporary_owner_id = NULL
            WHERE id = ?
        """, (plant_dict['id'],))
    
    connection.commit()
    
    return {
        'restored_chores': len(chores),
        'restored_plants': len(plants),
        'total_restored': len(chores) + len(plants)
    }


def getReassignmentHistory(person_id=None):
    """Get task reassignment history, optionally filtered by person"""
    if person_id:
        ensure_positive_int(person_id, "person_id")
        ensure_person_exists(person_id)
        
        cursor.execute("""
            SELECT tr.*, 
                   p1.name as original_owner_name,
                   p2.name as temporary_owner_name
            FROM task_reassignment tr
            JOIN person p1 ON tr.original_owner_id = p1.id
            JOIN person p2 ON tr.temporary_owner_id = p2.id
            WHERE tr.original_owner_id = ? OR tr.temporary_owner_id = ?
            ORDER BY tr.reassigned_at DESC
        """, (person_id, person_id))
    else:
        cursor.execute("""
            SELECT tr.*, 
                   p1.name as original_owner_name,
                   p2.name as temporary_owner_name
            FROM task_reassignment tr
            JOIN person p1 ON tr.original_owner_id = p1.id
            JOIN person p2 ON tr.temporary_owner_id = p2.id
            ORDER BY tr.reassigned_at DESC
        """)
    
    return [dict(row) for row in cursor.fetchall()]


# ---------- COMPLETION HISTORY ----------

def getTodayCompletionHistory(person_id):
    """Get today's completed tasks for a person"""
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)
    
    # Get chores completed today by this person
    cursor.execute("""
        SELECT 
            c.id,
            c.name,
            c.last_done as completed_at,
            'chore' as task_type,
            c.rotation_enabled
        FROM chore c
        WHERE c.last_done IS NOT NULL
          AND date(c.last_done, 'unixepoch') = date('now')
          AND (
              c.worker_id = ? 
              OR c.temporary_worker_id = ?
              OR (c.rotation_enabled = 1 AND c.rotation_order LIKE '%' || ? || '%')
          )
    """, (person_id, person_id, person_id))
    
    chores = [dict(row) for row in cursor.fetchall()]
    
    # Get plants watered today by this person
    cursor.execute("""
        SELECT 
            p.id,
            p.name,
            p.last_pour as completed_at,
            'plant' as task_type,
            0 as rotation_enabled
        FROM plant p
        WHERE p.last_pour IS NOT NULL
          AND date(p.last_pour, 'unixepoch') = date('now')
          AND (p.owner_id = ? OR p.temporary_owner_id = ?)
    """, (person_id, person_id))
    
    plants = [dict(row) for row in cursor.fetchall()]
    
    # Get one-time tasks completed today by this person
    cursor.execute("""
        SELECT 
            ott.id,
            ott.name,
            ott.completed_at,
            'one_time' as task_type,
            0 as rotation_enabled
        FROM one_time_task ott
        WHERE ott.completed_at IS NOT NULL
          AND date(ott.completed_at, 'unixepoch') = date('now')
          AND ott.assigned_to = ?
    """, (person_id,))
    
    one_time_tasks = [dict(row) for row in cursor.fetchall()]
    
    # Combine and sort by completion time (most recent first)
    all_completions = chores + plants + one_time_tasks
    all_completions.sort(key=lambda x: x['completed_at'], reverse=True)
    
    return all_completions


# ---------- CHORE METHODS ----------

def getChoresOfPerson(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    cursor.execute("SELECT * FROM chore WHERE worker_id = ?", (person_id,))
    return [dict(row) for row in cursor.fetchall()]


def getDueChoresOfPerson(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    # Get ALL due chores (NOT completed today)
    cursor.execute("""
                   SELECT *
                   FROM chore
                   WHERE (last_done IS NULL OR date(last_done, 'unixepoch', '+' || interval || ' days') <= date('now'))
                   """)
    chores = cursor.fetchall()

    finalChores = []

    for c in chores:
        chore_dict = dict(c)
        
        # PRIORITY 1: If temporarily assigned to this person, always include
        if chore_dict['temporary_worker_id'] == person_id:
            finalChores.append(chore_dict)
            continue
        
        # PRIORITY 2: Check if this chore is rotation-enabled
        if chore_dict['rotation_enabled'] == 1:
            rotation_list = json.loads(chore_dict['rotation_order'] or "[]")
            
            if not rotation_list:
                continue
            
            # Find the next available person in rotation
            current_index = chore_dict['last_assigned_index'] if chore_dict['last_assigned_index'] is not None else 0
            next_person_id = getNextAvailableInRotation(rotation_list, current_index)
            
            # Check if it's this person's turn
            if next_person_id == person_id:
                finalChores.append(chore_dict)
        
        # PRIORITY 3: Regular non-rotating chores
        else:
            if chore_dict['worker_id'] == person_id:
                # Skip if this chore is temporarily assigned to someone else
                if chore_dict['temporary_worker_id'] is None:
                    finalChores.append(chore_dict)

    return finalChores


def markChoreDone(chore_id):
    ensure_positive_int(chore_id, "chore_id")
    ensure_chore_exists(chore_id)

    cursor.execute("""SELECT *
                      FROM chore
                      WHERE id = ?""", (chore_id,))
    chore = dict(cursor.fetchone())

    if not chore:
        return False
    
    was_overdue = 0

    if chore['last_done'] is not None:
        due_date = chore['last_done'] + (chore['interval'] * (24 * 60 * 60))
        overdueThreshold = due_date + (24 * 60 * 60)

        if int(time.time()) > overdueThreshold:
            was_overdue = 1

    rotation_enabled = chore["rotation_enabled"] == 1

    rotation_list = json.loads(chore['rotation_order'] or "[]") if rotation_enabled is True else None

    completed_by = rotation_list[chore['last_assigned_index'] if chore['last_assigned_index'] is not None else 0] if rotation_enabled is True else chore['temporary_worker_id'] if chore['temporary_worker_id'] is not None else chore["worker_id"]

    cursor.execute("""
        INSERT INTO history (task_type, task_id, task_name, completed_at, completed_by, was_overdue, points)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ('chore', chore_id, chore['name'], int(time.time()), completed_by, was_overdue, 7))

    if chore['rotation_enabled'] == 1:
        rotation_len = len(rotation_list)

        if rotation_len == 0:
            next_index = 0
        else:
            # Handle NULL last_assigned_index
            current_index = chore['last_assigned_index'] if chore['last_assigned_index'] is not None else 0
            
            # Find next available person's index
            next_index = findNextAvailableIndexInRotation(rotation_list, current_index)
    else:
        # For non-rotation chores, keep the same index (or 0 if NULL)
        next_index = chore['last_assigned_index'] if chore['last_assigned_index'] is not None else 0

    cursor.execute("""
                   UPDATE chore
                   SET last_done           = CAST(strftime('%s', 'now') AS INTEGER),
                       last_assigned_index = ?
                   WHERE id = ?
                   """, (next_index, chore_id,))

    connection.commit()
    return cursor.rowcount > 0


def addChore(name, interval, worker_id):
    ensure_not_empty(name, "chore name")
    ensure_positive_int(interval, "interval")
    ensure_positive_int(worker_id, "worker_id")
    ensure_person_exists(worker_id)

    cursor.execute("""
                   INSERT INTO chore (name, interval, worker_id)
                   VALUES (?, ?, ?)
                   """, (name.strip(), interval, worker_id))

    connection.commit()
    return cursor.lastrowid


def removeChore(chore_id):
    ensure_positive_int(chore_id, "chore_id")
    ensure_chore_exists(chore_id)

    cursor.execute("DELETE FROM chore WHERE id = ?", (chore_id,))
    connection.commit()

    return cursor.rowcount > 0


# ---------- PLANT METHODS ----------

def getPlantsOfPerson(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    cursor.execute("SELECT * FROM plant WHERE owner_id = ?", (person_id,))
    return [dict(row) for row in cursor.fetchall()]


def getDuePlantsOfPerson(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    # Get plants where person is either the owner OR temporarily assigned
    # Do NOT include plants watered today - those go to history only
    cursor.execute("""
                   SELECT *
                   FROM plant
                   WHERE (owner_id = ? OR temporary_owner_id = ?)
                     AND (last_pour IS NULL OR date(last_pour, 'unixepoch', '+' || interval || ' days') <= date('now'))
                   """, (person_id, person_id))
    return [dict(row) for row in cursor.fetchall()]


def markPlantWatered(plant_id):
    ensure_positive_int(plant_id, "plant_id")
    ensure_plant_exists(plant_id)

    cursor.execute("""
        SELECT * FROM plant WHERE id = ?
    """, (plant_id, ))

    plant: Plant = dict(cursor.fetchone())

    was_overdue = 0

    if plant['last_pour'] is not None:
        due_date = plant['last_pour'] + (plant['interval'] * (24 * 60 * 60))
        overdueThreshold = due_date + (24 * 60 * 60)

        if int(time.time()) > overdueThreshold:
            was_overdue = 1

    completed_by = plant['temporary_owner_id'] if plant['temporary_owner_id'] is not None else plant['owner_id']

    cursor.execute("""
                   UPDATE plant
                   SET last_pour = CAST(strftime('%s', 'now') AS INTEGER)
                   WHERE id = ?
                   """, (plant_id,))
    
    cursor.execute("""
        INSERT INTO history (task_type, task_id, task_name, completed_at, completed_by, was_overdue, points)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ('plant', plant_id, plant['name'], int(time.time()), completed_by, was_overdue, 10))

    connection.commit()
    return cursor.rowcount > 0


def addPlant(name, interval, owner_id, image=None):
    ensure_not_empty(name, "plant name")
    ensure_positive_int(interval, "interval")
    ensure_positive_int(owner_id, "owner_id")
    ensure_person_exists(owner_id)

    cursor.execute("""
                   INSERT INTO plant (name, interval, image, owner_id)
                   VALUES (?, ?, ?, ?)
                   """, (name.strip(), interval, image, owner_id))

    connection.commit()
    return cursor.lastrowid


def removePlant(plant_id):
    ensure_positive_int(plant_id, "plant_id")
    ensure_plant_exists(plant_id)

    cursor.execute("DELETE FROM plant WHERE id = ?", (plant_id,))
    connection.commit()

    return cursor.rowcount > 0


# ---------- SERVICE METHOD ----------

def getDashboardForPerson(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    return {
        "dueChores": getDueChoresOfPerson(person_id),
        "duePlants": getDuePlantsOfPerson(person_id),
        "oneTimeTasks": getOneTimeTasksForPerson(person_id)
    }

def updatePlant(plant_id, name, interval, owner_id):
    ensure_positive_int(plant_id, "plant_id")
    ensure_plant_exists(plant_id)
    ensure_not_empty(name, "plant name")
    ensure_positive_int(interval, "interval")
    ensure_positive_int(owner_id, "owner_id")
    ensure_person_exists(owner_id)
    
    cursor.execute("""
        UPDATE plant
        SET name = ?, interval = ?, owner_id = ?
        WHERE id = ?
    """, (name.strip(), interval, owner_id, plant_id))
    
    connection.commit()
    return cursor.rowcount > 0


def addChoreWithRotation(name, interval, rotation_enabled, rotation_order, worker_id):
    ensure_not_empty(name, "chore name")
    ensure_positive_int(interval, "interval")
    
    if rotation_enabled:
        # Validate rotation_order is valid JSON
        if rotation_order:
            try:
                rotation_list = json.loads(rotation_order)
                if not rotation_list:
                    raise ValueError("Rotation list cannot be empty")
            except json.JSONDecodeError:
                raise ValueError("Invalid rotation order JSON")
    else:
        if worker_id is None:
            raise ValueError("worker_id required when rotation is disabled")
        ensure_positive_int(worker_id, "worker_id")
        ensure_person_exists(worker_id)
    
    cursor.execute("""
        INSERT INTO chore (name, interval, rotation_enabled, rotation_order, last_assigned_index, worker_id)
        VALUES (?, ?, ?, ?, 0, ?)
    """, (name.strip(), interval, rotation_enabled, rotation_order, worker_id))
    
    connection.commit()
    return cursor.lastrowid


def updateChore(chore_id, name, interval, rotation_enabled, rotation_order, worker_id):
    ensure_positive_int(chore_id, "chore_id")
    ensure_chore_exists(chore_id)
    ensure_not_empty(name, "chore name")
    ensure_positive_int(interval, "interval")
    
    if rotation_enabled:
        if rotation_order:
            try:
                rotation_list = json.loads(rotation_order)
                if not rotation_list:
                    raise ValueError("Rotation list cannot be empty")
            except json.JSONDecodeError:
                raise ValueError("Invalid rotation order JSON")
    else:
        if worker_id is None:
            raise ValueError("worker_id required when rotation is disabled")
        ensure_positive_int(worker_id, "worker_id")
        ensure_person_exists(worker_id)
    
    cursor.execute("""
        UPDATE chore
        SET name = ?, interval = ?, rotation_enabled = ?, rotation_order = ?, worker_id = ?
        WHERE id = ?
    """, (name.strip(), interval, rotation_enabled, rotation_order, worker_id, chore_id))
    
    connection.commit()
    return cursor.rowcount > 0


# ------------ NOTIFICATION SYSTEM ---------------

def addPushSubscription(person_id, endpoint, p256dh, auth):
    """Store a push subscription for a person"""
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)
    ensure_not_empty(endpoint, "endpoint")
    ensure_not_empty(p256dh, "p256dh")
    ensure_not_empty(auth, "auth")
    
    cursor.execute("""
        INSERT OR REPLACE INTO push_subscription (person_id, endpoint, p256dh, auth, created_at)
        VALUES (?, ?, ?, ?, CAST(strftime('%s', 'now') AS INTEGER))
    """, (person_id, endpoint, p256dh, auth))
    
    connection.commit()
    return cursor.lastrowid


def getPushSubscriptions(person_id):
    """Get all push subscriptions for a person"""
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)
    
    cursor.execute("""
        SELECT * FROM push_subscription WHERE person_id = ?
    """, (person_id,))
    
    return [dict(row) for row in cursor.fetchall()]


def sendPushNotification(person_id, title, body):
    """Send a push notification to a person"""
    from pywebpush import webpush, WebPushException
    import logging
    
    logger = logging.getLogger(__name__)
    
    subscriptions = getPushSubscriptions(person_id)
    
    if not subscriptions:
        raise ValueError(f"No push subscriptions found for person {person_id}")
    
    if os.path.exists('/app'):
        vapid_key_path = "/app/private_key.pem"
    else:
        vapid_key_path = str(Path(__file__).parent / 'private_key.pem')
    
    vapid_claims = {"sub": "mailto:linas.gierga@gmail.com"}
    
    payload = json.dumps({
        "title": title,
        "body": body,
        "icon": "/icon.png",
    })
    
    success_count = 0
    
    for sub in subscriptions:
        try:
            logger.info(f"Sending notification to subscription {sub['id']} for person {person_id}")
            webpush(
                subscription_info={
                    "endpoint": sub['endpoint'],
                    "keys": {
                        "p256dh": sub['p256dh'],
                        "auth": sub['auth']
                    }
                },
                data=payload,
                vapid_private_key=vapid_key_path,
                vapid_claims=vapid_claims
            )
            success_count += 1
            logger.info(f"✓ Notification sent successfully to subscription {sub['id']}")
        except WebPushException as ex:
            logger.error(f"WebPushException for subscription {sub['id']}: {ex}")
            if ex.response and ex.response.status_code in [404, 410]:
                logger.info(f"Deleting expired subscription {sub['id']}")
                cursor.execute("DELETE FROM push_subscription WHERE id = ?", (sub['id'],))
                connection.commit()
            # Continue to next subscription even if this one failed
            continue
        except Exception as ex:
            logger.error(f"Unexpected error sending to subscription {sub['id']}: {ex}")
            # Continue to next subscription
            continue
    
    logger.info(f"Sent notifications to {success_count}/{len(subscriptions)} subscriptions for person {person_id}")
    
    if success_count == 0:
        raise ValueError(f"Failed to send to any subscriptions for person {person_id}")

# ---------- ONE-TIME TASK METHODS ----------

def getOneTimeTasksForPerson(person_id):
    """Get all incomplete one-time tasks assigned to a person"""
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)
    
    cursor.execute("""
        SELECT ott.*, 
               p1.name as assigned_to_name,
               p2.name as created_by_name
        FROM one_time_task ott
        JOIN person p1 ON ott.assigned_to = p1.id
        JOIN person p2 ON ott.created_by = p2.id
        WHERE ott.assigned_to = ?
          AND ott.completed_at IS NULL
        ORDER BY 
            CASE ott.priority
                WHEN 'high' THEN 1
                WHEN 'medium' THEN 2
                WHEN 'low' THEN 3
            END,
            ott.due_date ASC NULLS LAST,
            ott.created_at ASC
    """, (person_id,))
    
    return [dict(row) for row in cursor.fetchall()]


def getAllOneTimeTasks():
    """Get all one-time tasks (for management view)"""
    cursor.execute("""
        SELECT ott.*, 
               p1.name as assigned_to_name,
               p2.name as created_by_name
        FROM one_time_task ott
        JOIN person p1 ON ott.assigned_to = p1.id
        JOIN person p2 ON ott.created_by = p2.id
        ORDER BY ott.completed_at IS NULL DESC, ott.created_at DESC
    """)
    
    return [dict(row) for row in cursor.fetchall()]


def createOneTimeTask(name, assigned_to, created_by, description=None, due_date=None, priority='medium'):
    """Create a new one-time task"""
    ensure_not_empty(name, "task name")
    ensure_positive_int(assigned_to, "assigned_to")
    ensure_positive_int(created_by, "created_by")
    ensure_person_exists(assigned_to)
    ensure_person_exists(created_by)
    
    if priority not in ['low', 'medium', 'high']:
        raise ValueError("Priority must be 'low', 'medium', or 'high'")
    
    cursor.execute("""
        INSERT INTO one_time_task 
        (name, description, assigned_to, created_by, created_at, due_date, priority)
        VALUES (?, ?, ?, ?, CAST(strftime('%s', 'now') AS INTEGER), ?, ?)
    """, (name.strip(), description, assigned_to, created_by, due_date, priority))
    
    connection.commit()
    return cursor.lastrowid


def completeOneTimeTask(task_id):
    """Mark a one-time task as completed"""
    ensure_positive_int(task_id, "task_id")
    
    cursor.execute("SELECT * FROM one_time_task WHERE id = ?", (task_id,))
    ott = cursor.fetchone()
    if ott is None:
        raise ValueError(f"One-time task with id={task_id} does not exist")
    ott = dict(ott)
    
    cursor.execute("""
        INSERT INTO history (task_type, task_id, task_name, completed_at, completed_by, was_overdue, points)
        VALUES (?, ?, ?, ?, ?, ?, ?)                   
""", ('one_time', task_id, ott['name'], int(time.time()), ott['assigned_to'],0, 10 if ott['priority'] == 'high' else 7 if ott['priority'] == 'medium' else 5))
    
    cursor.execute("""
        UPDATE one_time_task
        SET completed_at = CAST(strftime('%s', 'now') AS INTEGER)
        WHERE id = ?
    """, (task_id,))
    
    connection.commit()
    return cursor.rowcount > 0


def deleteOneTimeTask(task_id):
    """Delete a one-time task"""
    ensure_positive_int(task_id, "task_id")
    
    cursor.execute("SELECT id FROM one_time_task WHERE id = ?", (task_id,))
    if cursor.fetchone() is None:
        raise ValueError(f"One-time task with id={task_id} does not exist")
    
    cursor.execute("DELETE FROM one_time_task WHERE id = ?", (task_id,))
    connection.commit()
    
    return cursor.rowcount > 0


def updateOneTimeTask(task_id, name, description, assigned_to, due_date, priority):
    """Update a one-time task"""
    ensure_positive_int(task_id, "task_id")
    ensure_not_empty(name, "task name")
    ensure_positive_int(assigned_to, "assigned_to")
    ensure_person_exists(assigned_to)
    
    if priority not in ['low', 'medium', 'high']:
        raise ValueError("Priority must be 'low', 'medium', or 'high'")
    
    cursor.execute("""
        UPDATE one_time_task
        SET name = ?, description = ?, assigned_to = ?, due_date = ?, priority = ?
        WHERE id = ?
    """, (name.strip(), description, assigned_to, due_date, priority, task_id))
    
    connection.commit()
    return cursor.rowcount > 0


# --------------- STATISTIC METHODS ----------------

def getTotalTaskMetric():
    cursor.execute("""
        SELECT person.name, COUNT(*) as total_tasks 
        FROM history 
        JOIN person ON person.id = history.completed_by
        GROUP BY person.id
    """)

    return [dict(row) for row in cursor.fetchall()]

def getTasksByTypeRatio():
    cursor.execute("""
        SELECT task_type, COUNT(*) as total_tasks
        FROM history
        GROUP BY history.task_type
    """)

    return [dict(row) for row in cursor.fetchall()]

# def getTasksLastWeek():
#     one_week_ago = int(time.time()) - (7 * 24 * 60 * 60)

#     cursor.execute("""
#         SELECT task_type, COUNT(*) as total_tasks
#         FROM history
#         WHERE completed_at >= ?
#         GROUP BY history.task_type
#     """, (one_week_ago,))

#     return [dict(row) for row in cursor.fetchall()]


def getPersonalCompletionStreak(person_id):
    """
    Calculate current streak and longest streak for a person.
    Streak = consecutive days with at least one completed task.
    """
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)
    
    # Get all completion dates for this person (UTC dates only)
    cursor.execute("""
        SELECT DISTINCT DATE(completed_at, 'unixepoch') as completion_date
        FROM history
        WHERE completed_by = ?
        ORDER BY completion_date DESC
    """, (person_id,))
    
    rows = cursor.fetchall()
    
    if not rows:
        return {
            "person_id": person_id,
            "current_streak": 0,
            "longest_streak": 0,
            "last_completion_date": None
        }
    
    from datetime import datetime, timedelta
    
    dates = [datetime.strptime(row['completion_date'], '%Y-%m-%d').date() for row in rows]
    today = datetime.utcnow().date()
    
    # Calculate current streak
    current_streak = 0
    check_date = today
    
    for date in dates:
        if date == check_date:
            current_streak += 1
            check_date -= timedelta(days=1)
        elif date < check_date:
            break
    
    # Calculate longest streak
    longest_streak = 0
    temp_streak = 1
    
    for i in range(len(dates) - 1):
        diff = (dates[i] - dates[i + 1]).days
        if diff == 1:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 1
    
    longest_streak = max(longest_streak, temp_streak, current_streak)
    
    return {
        "person_id": person_id,
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_completion_date": dates[0].isoformat() if dates else None
    }


def getWeeklyCompletionTrend(person_id=None):
    """
    Get task completions grouped by week for the last 12 weeks.
    If person_id is provided, get personal trend. Otherwise, get family trend.
    """
    if person_id:
        ensure_positive_int(person_id, "person_id")
        ensure_person_exists(person_id)
    
    # Calculate timestamp for 12 weeks ago
    twelve_weeks_ago = int(time.time()) - (12 * 7 * 24 * 60 * 60)
    
    if person_id:
        # Personal trend
        cursor.execute("""
            SELECT 
                strftime('%Y-W%W', completed_at, 'unixepoch') as week,
                COUNT(*) as task_count
            FROM history
            WHERE completed_by = ?
              AND completed_at >= ?
            GROUP BY week
            ORDER BY week ASC
        """, (person_id, twelve_weeks_ago))
    else:
        # Family trend
        cursor.execute("""
            SELECT 
                strftime('%Y-W%W', completed_at, 'unixepoch') as week,
                COUNT(*) as task_count
            FROM history
            WHERE completed_at >= ?
            GROUP BY week
            ORDER BY week ASC
        """, (twelve_weeks_ago,))
    
    return [dict(row) for row in cursor.fetchall()]


def getCompletionRate(person_id):
    """
    Calculate completion rate: on-time vs overdue completions.
    """
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)
    
    # Get total completed tasks
    cursor.execute("""
        SELECT COUNT(*) as total_completed
        FROM history
        WHERE completed_by = ?
    """, (person_id,))
    
    total = cursor.fetchone()['total_completed']
    
    if total == 0:
        return {
            "person_id": person_id,
            "total_completed": 0,
            "on_time": 0,
            "overdue": 0,
            "on_time_percentage": 0,
            "overdue_percentage": 0
        }
    
    # Get overdue count
    cursor.execute("""
        SELECT COUNT(*) as overdue_count
        FROM history
        WHERE completed_by = ?
          AND was_overdue = 1
    """, (person_id,))
    
    overdue = cursor.fetchone()['overdue_count']
    on_time = total - overdue
    
    return {
        "person_id": person_id,
        "total_completed": total,
        "on_time": on_time,
        "overdue": overdue,
        "on_time_percentage": round((on_time / total) * 100, 1),
        "overdue_percentage": round((overdue / total) * 100, 1)
    }