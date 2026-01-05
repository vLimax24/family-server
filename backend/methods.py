from db import cursor, connection
import json


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


# ---------- CHORE METHODS ----------

def getChoresOfPerson(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    cursor.execute("SELECT * FROM chore WHERE worker_id = ?", (person_id,))
    return [dict(row) for row in cursor.fetchall()]


def getDueChoresOfPerson(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    # Get ALL due chores
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

    cursor.execute("""SELECT rotation_enabled, rotation_order, last_assigned_index
                      FROM chore
                      WHERE id = ?""", (chore_id,))
    chore = cursor.fetchone()

    if not chore:
        return False

    if chore['rotation_enabled'] == 1:
        rotation_list = json.loads(chore['rotation_order'] or "[]")
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
                   UPDATE plant
                   SET last_pour = CAST(strftime('%s', 'now') AS INTEGER)
                   WHERE id = ?
                   """, (plant_id,))

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
        "duePlants": getDuePlantsOfPerson(person_id)
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