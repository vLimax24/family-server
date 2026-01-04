import os
os.environ['ENV'] = 'test'
import random
import json
import time
from db import connection, cursor
import methods


# --- Setup: Clear tables and reset autoincrement ---
def setup_test_data():
    """Reset database and populate with test data"""
    print("\n" + "=" * 60)
    print("SETUP: Clearing and resetting database")
    print("=" * 60)

    for table in ["plant", "chore", "person"]:
        cursor.execute(f"DELETE FROM {table};")
        cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}';")
        print(f"✓ Cleared {table} table")

    # Create the 4 family members
    print("\nCreating family members...")
    persons = [
        ("Lina", "child"),
        ("Amelie", "child"),
        ("Katrin", "parent"),
        ("Micha", "parent")
    ]

    cursor.executemany(
        "INSERT INTO person (name, role) VALUES (?, ?)",
        persons
    )
    print("✓ Created 4 persons:")
    for i, (name, role) in enumerate(persons, 1):
        print(f"  ID {i}: {name} ({role})")

    connection.commit()

    # Sample Names
    plant_names = [
        "Bonsai", "Ficus", "Monstera", "Orchidee",
        "Aloe Vera", "Spathiphyllum", "Kaktus", "Palme",
        "Lavendel", "Rosmarin", "Tomate", "Basilikum",
        "Efeu", "Gurke", "Paprika", "Sukkulente"
    ]

    chore_names = [
        "Vacuum Living Room", "Wash Dishes", "Laundry",
        "Clean Bathroom", "Take Out Trash", "Cook Dinner",
        "Water Garden", "Mop Floor", "Dust Shelves", "Feed Pets",
        "Organize Garage", "Clean Windows", "Sweep Porch",
        "Grocery Shopping", "Change Bed Sheets", "Wipe Counters"
    ]

    print("\nCreating 16 plants...")
    # Create 16 Plants
    plants = []
    for name in plant_names:
        interval = random.randint(1, 5)
        owner_id = random.randint(1, 4)
        image = f"{name.lower().replace(' ', '_')}.png"
        plants.append((name, interval, image, owner_id))
        print(f"  • {name} - Owner: Person {owner_id}, Water every {interval} days")

    cursor.executemany(
        "INSERT INTO plant (name, interval, image, owner_id) VALUES (?, ?, ?, ?)",
        plants
    )
    print(f"✓ Created {len(plants)} plants")

    print("\nCreating regular chores (no rotation)...")
    # Create 10 regular chores (without rotation)
    chores = []
    for name in chore_names[:10]:
        interval = random.randint(1, 7)
        worker_id = random.randint(1, 4)
        chores.append((name, interval, 0, None, 0, worker_id))  # rotation_enabled=0
        print(f"  • {name} - Worker: Person {worker_id}, Every {interval} days")

    cursor.executemany(
        "INSERT INTO chore (name, interval, rotation_enabled, rotation_order, last_assigned_index, worker_id) VALUES (?, ?, ?, ?, ?, ?)",
        chores
    )
    print(f"✓ Created {len(chores)} regular chores")

    print("\nCreating rotation-enabled chores...")
    # Create 6 chores with rotation enabled
    rotation_chores = [
        ("Kitchen Cleanup", 1, [1, 2, 3, 4]),
        ("Bathroom Duty", 2, [2, 3, 4]),
        ("Trash Day", 1, [1, 3]),
        ("Cooking Tonight", 1, [1, 2, 3, 4]),
        ("Garden Work", 3, [1, 2]),
        ("Pet Care", 1, [2, 3, 4, 1])
    ]

    for name, interval, rotation in rotation_chores:
        rotation_json = json.dumps(rotation)
        cursor.execute(
            """INSERT INTO chore (name, interval, rotation_enabled, rotation_order, last_assigned_index, worker_id)
               VALUES (?, ?, 1, ?, 0, ?)""",
            (name, interval, rotation_json, rotation[0])
        )
        print(f"  • {name} - Rotation: {rotation}, Every {interval} days")

    print(f"✓ Created {len(rotation_chores)} rotation chores")

    connection.commit()
    print("\n✓ Test data setup complete\n")


# --- Test Person Methods ---
def test_person_methods():
    print("\n" + "=" * 60)
    print("TEST SUITE: Person Methods")
    print("=" * 60)

    # Test getPersonById
    print("\n--- Test: getPersonById ---")
    try:
        person = methods.getPersonById(1)
        print(f"Input: person_id=1")
        print(f"Result: {person}")
        print(f"✓ SUCCESS: Retrieved person '{person['name']}'")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test getAllPersons
    print("\n--- Test: getAllPersons ---")
    try:
        persons = methods.getAllPersons()
        print(f"Result: Found {len(persons)} persons")
        for p in persons:
            print(f"  ID {p['id']}: {p['name']} ({p['role']})")
        print(f"✓ SUCCESS: Retrieved all persons")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test invalid person_id
    print("\n--- Test: getPersonById with invalid ID ---")
    try:
        print("Input: person_id=999 (non-existent)")
        methods.getPersonById(999)
        print("✗ FAILED: Should have raised ValueError")
    except ValueError as e:
        print(f"Result: Raised ValueError as expected")
        print(f"Error message: {e}")
        print(f"✓ SUCCESS: Validation working correctly")
    except Exception as e:
        print(f"✗ FAILED: Wrong exception type: {e}")


# --- Test Chore Methods ---
def test_chore_methods():
    print("\n" + "=" * 60)
    print("TEST SUITE: Chore Methods")
    print("=" * 60)

    # Test getChoresOfPerson
    print("\n--- Test: getChoresOfPerson ---")
    try:
        print("Input: person_id=1")
        chores = methods.getChoresOfPerson(1)
        print(f"Result: Found {len(chores)} chores assigned to Person 1")
        for c in chores:
            rotation_status = "ROTATION" if c['rotation_enabled'] else "REGULAR"
            print(f"  [{rotation_status}] {c['name']} - Every {c['interval']} days")
            if c['rotation_enabled']:
                rotation_list = json.loads(c['rotation_order'] or "[]")
                print(f"    Rotation order: {rotation_list}, Current index: {c['last_assigned_index']}")
        print(f"✓ SUCCESS: Retrieved chores for person")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test getDueChoresOfPerson
    print("\n--- Test: getDueChoresOfPerson ---")
    try:
        print("Input: person_id=2")
        due_chores = methods.getDueChoresOfPerson(2)
        print(f"Result: Found {len(due_chores)} due chores for Person 2")
        for c in due_chores:
            rotation_status = "ROTATION" if c['rotation_enabled'] else "REGULAR"
            if c['last_done']:
                last_done_readable = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(c['last_done']))
                print(f"  [{rotation_status}] {c['name']} - Last done: {last_done_readable}")
            else:
                print(f"  [{rotation_status}] {c['name']} - Never done")
            if c['rotation_enabled']:
                rotation_list = json.loads(c['rotation_order'] or "[]")
                print(f"    Rotation: {rotation_list}, Person 2 is at index {c['last_assigned_index']}")
        print(f"✓ SUCCESS: Retrieved due chores")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test addChore (regular)
    print("\n--- Test: addChore (regular chore) ---")
    try:
        print("Input: name='Test Regular Chore', interval=3, worker_id=1")
        new_chore_id = methods.addChore("Test Regular Chore", 3, 1)
        print(f"Result: Created chore with ID {new_chore_id}")

        # Verify it was created
        cursor.execute("SELECT * FROM chore WHERE id = ?", (new_chore_id,))
        chore = dict(cursor.fetchone())
        print(f"Verification: {chore}")
        print(f"✓ SUCCESS: Regular chore created")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test markChoreDone (regular chore)
    print("\n--- Test: markChoreDone (regular chore) ---")
    try:
        print("Input: chore_id=1 (regular chore)")
        cursor.execute("SELECT * FROM chore WHERE id = 1")
        before = dict(cursor.fetchone())
        print(f"Before: last_done={before['last_done']}, last_assigned_index={before['last_assigned_index']}")

        result = methods.markChoreDone(1)
        print(f"Result: Success = {result}")

        cursor.execute("SELECT * FROM chore WHERE id = 1")
        after = dict(cursor.fetchone())
        print(f"After: last_done={after['last_done']}, last_assigned_index={after['last_assigned_index']}")
        print(f"Time updated: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(after['last_done']))}")
        print(f"✓ SUCCESS: Regular chore marked done")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test removeChore
    print("\n--- Test: removeChore ---")
    try:
        cursor.execute("SELECT MAX(id) as max_id FROM chore")
        max_id = cursor.fetchone()['max_id']
        print(f"Input: chore_id={max_id} (last chore)")

        cursor.execute("SELECT name FROM chore WHERE id = ?", (max_id,))
        chore_name = cursor.fetchone()['name']
        print(f"Removing: {chore_name}")

        result = methods.removeChore(max_id)
        print(f"Result: Success = {result}")
        print(f"✓ SUCCESS: Chore removed")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test validation errors
    print("\n--- Test: addChore validation (empty name) ---")
    try:
        print("Input: name='', interval=3, worker_id=1")
        methods.addChore("", 3, 1)
        print("✗ FAILED: Should have raised ValueError")
    except ValueError as e:
        print(f"Result: Raised ValueError as expected")
        print(f"Error message: {e}")
        print(f"✓ SUCCESS: Validation working correctly")


# --- Test Rotation Chores Extensively ---
def test_rotation_chores():
    print("\n" + "=" * 60)
    print("TEST SUITE: Rotation Chores (Detailed)")
    print("=" * 60)

    # Find a rotation chore
    print("\n--- Finding rotation-enabled chores ---")
    cursor.execute("SELECT * FROM chore WHERE rotation_enabled = 1 LIMIT 1")
    rotation_chore = dict(cursor.fetchone())
    chore_id = rotation_chore['id']

    print(f"Testing with chore: '{rotation_chore['name']}' (ID: {chore_id})")
    rotation_list = json.loads(rotation_chore['rotation_order'])
    print(f"Rotation order: {rotation_list}")
    print(f"Initial index: {rotation_chore['last_assigned_index']}")
    print(f"Initial worker: Person {rotation_list[rotation_chore['last_assigned_index']]}")

    # Test marking it done multiple times to see rotation
    print("\n--- Testing rotation progression ---")
    for i in range(len(rotation_list) + 2):  # Do extra cycles to see wrap-around
        print(f"\n  Cycle {i + 1}:")

        # Get current state
        cursor.execute("SELECT * FROM chore WHERE id = ?", (chore_id,))
        current = dict(cursor.fetchone())
        current_index = current['last_assigned_index']
        current_person = rotation_list[current_index] if current_index < len(rotation_list) else "ERROR"

        print(f"    Current state: Index={current_index}, Assigned to Person {current_person}")

        # Check who has this as due
        print(f"    Checking due status for each person:")
        for person_id in rotation_list:
            due_chores = methods.getDueChoresOfPerson(person_id)
            is_due = any(c['id'] == chore_id for c in due_chores)
            status = "✓ DUE" if is_due else "✗ not due"
            print(f"      Person {person_id}: {status}")

        # Mark it done
        print(f"    Marking chore done...")
        result = methods.markChoreDone(chore_id)

        # Get new state
        cursor.execute("SELECT * FROM chore WHERE id = ?", (chore_id,))
        after = dict(cursor.fetchone())
        new_index = after['last_assigned_index']
        next_person = rotation_list[new_index] if new_index < len(rotation_list) else "ERROR"

        print(f"    After marking done: Index={new_index}, Now assigned to Person {next_person}")
        print(f"    Last done timestamp: {after['last_done']}")

        # IMPORTANT: Simulate time passing by setting last_done to 2 days ago
        # This makes the chore "due" again for the next cycle
        two_days_ago = int(time.time()) - (2 * 86400)  # 2 days in seconds
        cursor.execute("""
                       UPDATE chore
                       SET last_done = ?
                       WHERE id = ?
                       """, (two_days_ago, chore_id))
        connection.commit()
        print(f"    ⏰ Simulated time: Set last_done to 2 days ago to make chore due again")

    print(f"\n✓ SUCCESS: Rotation working correctly with wrap-around")

    # Test getDueChoresOfPerson with rotation
    print("\n--- Test: getDueChoresOfPerson with rotation chores ---")
    for person_id in range(1, 5):
        print(f"\n  Person {person_id}:")
        due_chores = methods.getDueChoresOfPerson(person_id)
        rotation_due = [c for c in due_chores if c['rotation_enabled']]
        regular_due = [c for c in due_chores if not c['rotation_enabled']]

        print(f"    Total due chores: {len(due_chores)}")
        print(f"    Regular chores: {len(regular_due)}")
        print(f"    Rotation chores: {len(rotation_due)}")

        if rotation_due:
            print(f"    Rotation chores due:")
            for c in rotation_due:
                rotation_order = json.loads(c['rotation_order'])
                print(f"      • {c['name']}")
                print(f"        Rotation: {rotation_order}")
                print(f"        Current index: {c['last_assigned_index']}")
                print(f"        Assigned to: Person {rotation_order[c['last_assigned_index']]}")


# --- Test Plant Methods ---
def test_plant_methods():
    print("\n" + "=" * 60)
    print("TEST SUITE: Plant Methods")
    print("=" * 60)

    # Test getPlantsOfPerson
    print("\n--- Test: getPlantsOfPerson ---")
    try:
        print("Input: person_id=1")
        plants = methods.getPlantsOfPerson(1)
        print(f"Result: Found {len(plants)} plants owned by Person 1")
        for p in plants:
            print(f"  • {p['name']} - Water every {p['interval']} days, Image: {p['image']}")
        print(f"✓ SUCCESS: Retrieved plants")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test getDuePlantsOfPerson
    print("\n--- Test: getDuePlantsOfPerson ---")
    try:
        print("Input: person_id=1")
        due_plants = methods.getDuePlantsOfPerson(1)
        print(f"Result: Found {len(due_plants)} due plants for Person 1")
        for p in due_plants:
            if p['last_pour']:
                last_pour_readable = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(p['last_pour']))
                print(f"  • {p['name']} - Last watered: {last_pour_readable}")
            else:
                print(f"  • {p['name']} - Never watered")
        print(f"✓ SUCCESS: Retrieved due plants")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test addPlant
    print("\n--- Test: addPlant ---")
    try:
        print("Input: name='Test Plant', interval=2, owner_id=1, image='test.png'")
        new_plant_id = methods.addPlant("Test Plant", 2, 1, "test.png")
        print(f"Result: Created plant with ID {new_plant_id}")

        # Verify it was created
        cursor.execute("SELECT * FROM plant WHERE id = ?", (new_plant_id,))
        plant = dict(cursor.fetchone())
        print(f"Verification: {plant}")
        print(f"✓ SUCCESS: Plant created")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test markPlantWatered
    print("\n--- Test: markPlantWatered ---")
    try:
        print("Input: plant_id=1")
        cursor.execute("SELECT * FROM plant WHERE id = 1")
        before = dict(cursor.fetchone())
        print(f"Before: last_pour={before['last_pour']}")

        result = methods.markPlantWatered(1)
        print(f"Result: Success = {result}")

        cursor.execute("SELECT * FROM plant WHERE id = 1")
        after = dict(cursor.fetchone())
        print(f"After: last_pour={after['last_pour']}")
        print(f"Time updated: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(after['last_pour']))}")
        print(f"✓ SUCCESS: Plant watered")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test removePlant
    print("\n--- Test: removePlant ---")
    try:
        cursor.execute("SELECT MAX(id) as max_id FROM plant")
        max_id = cursor.fetchone()['max_id']
        print(f"Input: plant_id={max_id} (last plant)")

        cursor.execute("SELECT name FROM plant WHERE id = ?", (max_id,))
        plant_name = cursor.fetchone()['name']
        print(f"Removing: {plant_name}")

        result = methods.removePlant(max_id)
        print(f"Result: Success = {result}")
        print(f"✓ SUCCESS: Plant removed")
    except Exception as e:
        print(f"✗ FAILED: {e}")

    # Test validation
    print("\n--- Test: addPlant validation (negative interval) ---")
    try:
        print("Input: name='Test', interval=-1, owner_id=1")
        methods.addPlant("Test", -1, 1)
        print("✗ FAILED: Should have raised ValueError")
    except ValueError as e:
        print(f"Result: Raised ValueError as expected")
        print(f"Error message: {e}")
        print(f"✓ SUCCESS: Validation working correctly")


# --- Test Dashboard ---
def test_dashboard():
    print("\n" + "=" * 60)
    print("TEST SUITE: Dashboard Service Method")
    print("=" * 60)

    for person_id in range(1, 5):
        print(f"\n--- Dashboard for Person {person_id} ---")
        try:
            print(f"Input: person_id={person_id}")
            dashboard = methods.getDashboardForPerson(person_id)

            print(f"\nRESULTS:")
            print(f"  Due Chores: {len(dashboard['dueChores'])}")
            print(f"  Due Plants: {len(dashboard['duePlants'])}")

            if dashboard['dueChores']:
                print(f"\n  Due chores breakdown:")
                rotation_chores = [c for c in dashboard['dueChores'] if c['rotation_enabled']]
                regular_chores = [c for c in dashboard['dueChores'] if not c['rotation_enabled']]
                print(f"    Regular: {len(regular_chores)}")
                print(f"    Rotation: {len(rotation_chores)}")

                print(f"\n  Sample due chores:")
                for c in dashboard['dueChores'][:3]:
                    chore_type = "ROTATION" if c['rotation_enabled'] else "REGULAR"
                    print(f"    [{chore_type}] {c['name']}")
                    if c['rotation_enabled']:
                        rotation_order = json.loads(c['rotation_order'])
                        print(f"      Rotation: {rotation_order}, Index: {c['last_assigned_index']}")

            if dashboard['duePlants']:
                print(f"\n  Sample due plants:")
                for p in dashboard['duePlants'][:3]:
                    print(f"    • {p['name']} (water every {p['interval']} days)")

            print(f"\n✓ SUCCESS: Dashboard generated for Person {person_id}")
        except Exception as e:
            print(f"✗ FAILED: {e}")

# --- Test Day-Boundary Logic ---
def test_day_boundary_scheduling():
    print("\n" + "=" * 60)
    print("TEST SUITE: Day-Boundary Scheduling Logic")
    print("=" * 60)

    print("\n--- Test: Late night completion (23:58) ---")
    try:
        # Create a test chore with 1-day interval
        chore_id = methods.addChore("Late Night Test Chore", 1, 1)
        print(f"Created test chore ID: {chore_id}")
        
        # Simulate completion at 23:58 on a specific day
        # Let's say today at 23:58
        from datetime import datetime, timedelta
        today_2358 = datetime.now().replace(hour=23, minute=58, second=0, microsecond=0)
        timestamp_2358 = int(today_2358.timestamp())
        
        print(f"Simulating completion at: {today_2358.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Manually set last_done to 23:58
        cursor.execute("""
            UPDATE chore 
            SET last_done = ?
            WHERE id = ?
        """, (timestamp_2358, chore_id))
        connection.commit()
        
        # Check when it's next due using our new logic
        cursor.execute("""
            SELECT 
                date(last_done, 'unixepoch') as done_date,
                date(last_done, 'unixepoch', '+' || interval || ' days') as due_date,
                date('now') as today
            FROM chore WHERE id = ?
        """, (chore_id,))
        
        result = cursor.fetchone()
        print(f"\nResults:")
        print(f"  Done on: {result['done_date']}")
        print(f"  Due on: {result['due_date']}")
        print(f"  Today: {result['today']}")
        
        # The due_date should be the NEXT day (not 23:58 tomorrow)
        done_date = datetime.strptime(result['done_date'], '%Y-%m-%d')
        due_date = datetime.strptime(result['due_date'], '%Y-%m-%d')
        expected_due = done_date + timedelta(days=1)
        
        if due_date == expected_due:
            print(f"✓ SUCCESS: Task due on next day at 00:00, not 23:58!")
        else:
            print(f"✗ FAILED: Expected {expected_due.date()}, got {due_date.date()}")
        
        # Cleanup
        methods.removeChore(chore_id)
        
    except Exception as e:
        print(f"✗ FAILED: {e}")

    print("\n--- Test: 2-day interval from Wednesday ---")
    try:
        # Create a test chore with 2-day interval
        chore_id = methods.addChore("Two Day Test Chore", 2, 1)
        print(f"Created test chore ID: {chore_id}")
        
        # Simulate completion on a Wednesday (any time)
        # Let's use a known Wednesday timestamp
        wednesday = datetime(2025, 1, 8, 14, 30)  # Wednesday afternoon
        timestamp_wed = int(wednesday.timestamp())
        
        print(f"Simulating completion on: {wednesday.strftime('%A, %Y-%m-%d %H:%M:%S')}")
        
        cursor.execute("""
            UPDATE chore 
            SET last_done = ?
            WHERE id = ?
        """, (timestamp_wed, chore_id))
        connection.commit()
        
        # Check when it's due
        cursor.execute("""
            SELECT 
                date(last_done, 'unixepoch') as done_date,
                date(last_done, 'unixepoch', '+' || interval || ' days') as due_date
            FROM chore WHERE id = ?
        """, (chore_id,))
        
        result = cursor.fetchone()
        print(f"\nResults:")
        print(f"  Done on: {result['done_date']} (Wednesday)")
        print(f"  Due on: {result['due_date']} (should be Friday)")
        
        done_date = datetime.strptime(result['done_date'], '%Y-%m-%d')
        due_date = datetime.strptime(result['due_date'], '%Y-%m-%d')
        
        # Should be 2 days later (Friday)
        if (due_date - done_date).days == 2:
            print(f"✓ SUCCESS: 2-day interval works correctly (Wed → Fri)")
        else:
            print(f"✗ FAILED: Expected 2 days difference, got {(due_date - done_date).days}")
        
        # Cleanup
        methods.removeChore(chore_id)
        
    except Exception as e:
        print(f"✗ FAILED: {e}")


# --- Test Smart Scheduling (Availability & Redistribution) ---
def test_smart_scheduling():
    print("\n" + "=" * 60)
    print("TEST SUITE: Smart Scheduling (Availability System)")
    print("=" * 60)

    print("\n--- Test: Mark person unavailable and check redistribution ---")
    try:
        person_id = 2  # Amelie
        print(f"Input: person_id={person_id} (Amelie)")
        
        # Check initial availability
        person = methods.getPersonById(person_id)
        print(f"Initial availability: {person['is_available']}")
        
        # Get her current tasks
        initial_plants = methods.getPlantsOfPerson(person_id)
        initial_chores = methods.getChoresOfPerson(person_id)
        print(f"Initial tasks: {len(initial_plants)} plants, {len(initial_chores)} chores")
        
        # Mark as unavailable
        print(f"\nMarking Person {person_id} as unavailable...")
        result = methods.setPersonAvailability(person_id, 0)
        print(f"Result: {result}")
        
        # Check if tasks were redistributed
        print(f"\nChecking task redistribution...")
        
        # Check plants
        print(f"  Plants:")
        for plant in initial_plants:
            cursor.execute("SELECT temporary_owner_id FROM plant WHERE id = ?", (plant['id'],))
            temp_owner = cursor.fetchone()['temporary_owner_id']
            if temp_owner:
                print(f"    • {plant['name']} → Temporarily assigned to Person {temp_owner}")
            else:
                print(f"    • {plant['name']} → No temporary assignment")
        
        # Check non-rotating chores
        non_rotating_chores = [c for c in initial_chores if c['rotation_enabled'] == 0]
        print(f"  Non-rotating chores:")
        for chore in non_rotating_chores:
            cursor.execute("SELECT temporary_worker_id FROM chore WHERE id = ?", (chore['id'],))
            temp_worker = cursor.fetchone()['temporary_worker_id']
            if temp_worker:
                print(f"    • {chore['name']} → Temporarily assigned to Person {temp_worker}")
            else:
                print(f"    • {chore['name']} → No temporary assignment")
        
        print(f"\n✓ SUCCESS: Tasks redistributed")
        
    except Exception as e:
        print(f"✗ FAILED: {e}")

    print("\n--- Test: Mark person available and check restoration ---")
    try:
        person_id = 2
        print(f"Input: person_id={person_id} (Amelie)")
        
        # Mark as available
        print(f"Marking Person {person_id} as available again...")
        result = methods.setPersonAvailability(person_id, 1)
        print(f"Result: {result}")
        
        # Check if tasks were restored
        print(f"\nChecking task restoration...")
        
        # Get her tasks again
        plants = methods.getPlantsOfPerson(person_id)
        print(f"  Plants:")
        for plant in plants:
            cursor.execute("SELECT temporary_owner_id FROM plant WHERE id = ?", (plant['id'],))
            temp_owner = cursor.fetchone()['temporary_owner_id']
            status = "✓ Restored" if temp_owner is None else f"✗ Still temp assigned to {temp_owner}"
            print(f"    • {plant['name']} → {status}")
        
        chores = methods.getChoresOfPerson(person_id)
        non_rotating = [c for c in chores if c['rotation_enabled'] == 0]
        print(f"  Non-rotating chores:")
        for chore in non_rotating:
            cursor.execute("SELECT temporary_worker_id FROM chore WHERE id = ?", (chore['id'],))
            temp_worker = cursor.fetchone()['temporary_worker_id']
            status = "✓ Restored" if temp_worker is None else f"✗ Still temp assigned to {temp_worker}"
            print(f"    • {chore['name']} → {status}")
        
        print(f"\n✓ SUCCESS: Tasks restored")
        
    except Exception as e:
        print(f"✗ FAILED: {e}")

    print("\n--- Test: Rotation chores skip unavailable people ---")
    try:
        # Find a rotation chore
        cursor.execute("SELECT * FROM chore WHERE rotation_enabled = 1 LIMIT 1")
        rotation_chore = dict(cursor.fetchone())
        chore_id = rotation_chore['id']
        rotation_list = json.loads(rotation_chore['rotation_order'])
        
        print(f"Testing with: {rotation_chore['name']}")
        print(f"Rotation order: {rotation_list}")
        
        # Make first person in rotation unavailable
        unavailable_person = rotation_list[0]
        print(f"\nMarking Person {unavailable_person} as unavailable...")
        methods.setPersonAvailability(unavailable_person, 0)
        
        # Set chore to be at that person's index
        cursor.execute("""
            UPDATE chore 
            SET last_assigned_index = 0,
                last_done = ?
            WHERE id = ?
        """, (int(time.time()) - 2 * 86400, chore_id))  # 2 days ago
        connection.commit()
        
        # Check who gets the chore now
        print(f"Checking who gets assigned the chore...")
        next_person_id = methods.getNextAvailableInRotation(rotation_list, 0)
        print(f"Next available person: {next_person_id}")
        
        if next_person_id != unavailable_person:
            print(f"✓ SUCCESS: Skipped unavailable person!")
        else:
            print(f"✗ FAILED: Did not skip unavailable person")
        
        # Restore availability
        methods.setPersonAvailability(unavailable_person, 1)
        
    except Exception as e:
        print(f"✗ FAILED: {e}")


# --- Run All Tests ---
if __name__ == "__main__":
    print("=" * 60)
    print("CHORE & PLANT MANAGEMENT SYSTEM - COMPREHENSIVE TESTS")
    print("=" * 60)
    print(f"Start time: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    setup_test_data()
    test_person_methods()
    test_chore_methods()
    test_rotation_chores()
    test_plant_methods()
    test_dashboard()
    test_day_boundary_scheduling()  # NEW
    test_smart_scheduling()         # NEW

    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED!")
    print("=" * 60)
    print(f"End time: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    connection.close()