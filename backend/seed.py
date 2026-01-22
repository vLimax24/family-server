import json
from db import connection, cursor

print("Starting database seeding...")

# DB leeren - IN THE CORRECT ORDER (respecting foreign keys)
print("Clearing existing data...")

# Clear tables that reference other tables first
cursor.execute("DELETE FROM history")           # References person
cursor.execute("DELETE FROM task_reassignment") # References person
cursor.execute("DELETE FROM push_subscription") # References person
cursor.execute("DELETE FROM one_time_task")     # References person
cursor.execute("DELETE FROM plant")             # References person
cursor.execute("DELETE FROM chore")             # References person
cursor.execute("DELETE FROM person")            # Base table

# Reset autoincrement counters
cursor.execute("DELETE FROM sqlite_sequence WHERE name='history'")
cursor.execute("DELETE FROM sqlite_sequence WHERE name='task_reassignment'")
cursor.execute("DELETE FROM sqlite_sequence WHERE name='push_subscription'")
cursor.execute("DELETE FROM sqlite_sequence WHERE name='one_time_task'")
cursor.execute("DELETE FROM sqlite_sequence WHERE name='plant'")
cursor.execute("DELETE FROM sqlite_sequence WHERE name='chore'")
cursor.execute("DELETE FROM sqlite_sequence WHERE name='person'")

connection.commit()
print("✓ Cleared all tables and reset autoincrement")

# ---------- Personen ----------
print("\nCreating persons...")
persons = [
    ("Linas", "child", 1, None, None),      # (name, role, is_available, unavailable_since, unavailable_until)
    ("Amelie", "child", 1, None, None),
    ("Katrin", "parent", 1, None, None),
    ("Micha", "parent", 1, None, None),
]

for name, role, is_available, unavailable_since, unavailable_until in persons:
    cursor.execute(
        "INSERT INTO person (name, role, is_available, unavailable_since, unavailable_until) VALUES (?, ?, ?, ?, ?)",
        (name, role, is_available, unavailable_since, unavailable_until)
    )
connection.commit()

# IDs der Personen
cursor.execute("SELECT id, name FROM person")
person_map = {name: pid for pid, name in cursor.fetchall()}
print(f"✓ Created {len(person_map)} persons: {list(person_map.keys())}")

# ---------- Chores ----------
print("\nCreating chores...")
chores = [
    # Name, Intervall, Rotation enabled, Rotation order, Last assigned index, worker_id
    ("Geschirrspüler", 1, True, [person_map["Linas"], person_map["Amelie"], person_map["Katrin"], person_map["Micha"]], 3),
    ("Müll wegschaffen", 2, True, [person_map["Linas"], person_map["Amelie"], person_map["Katrin"], person_map["Micha"]], 1),
    ("Wäsche Waschen", 2, True, [person_map["Linas"], person_map["Amelie"], person_map["Katrin"], person_map["Micha"]], 0),
    ("Amelie Zimmer aufräumen", 7, False, [], None, person_map["Amelie"]),
    ("Linas Zimmer aufräumen", 7, False, [], None, person_map["Linas"]),
    ("Bad putzen", 14, True, [person_map["Linas"], person_map["Amelie"], person_map["Katrin"], person_map["Micha"]], 2),
    ("Küche putzen", 3, False, [], None, person_map["Katrin"]),
    ("Staubsaugen", 4, True, [person_map["Linas"], person_map["Micha"]], 0),
]

for chore in chores:
    name, interval, rotation_enabled, rotation_order, last_assigned_index = chore[:5]
    worker_id = None if rotation_enabled else chore[5]
    cursor.execute(
        """
        INSERT INTO chore (name, interval, rotation_enabled, rotation_order, last_assigned_index, worker_id)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            name,
            interval,
            int(rotation_enabled),
            json.dumps(rotation_order) if rotation_enabled else None,
            last_assigned_index if rotation_enabled else None,
            worker_id,
        ),
    )
print(f"✓ Created {len(chores)} chores")
connection.commit()

# ---------- Pflanzen ----------
print("\nCreating plants...")
plants = [
    ("Linas Hängepflanze", 4, None, person_map["Linas"]),
    ("Linas Bettpflanze groß", 4, None, person_map["Linas"]),
    ("Linas Bettpflanze klein", 4, None, person_map["Linas"]),
    ("Amelie Fensterpflanze", 3, None, person_map["Amelie"]),
    ("Katrin Küchenkräuter", 2, None, person_map["Katrin"]),
    ("Wohnzimmer Monstera", 7, None, person_map["Katrin"]),
]

for name, interval, image, owner_id in plants:
    cursor.execute(
        "INSERT INTO plant (name, interval, image, owner_id) VALUES (?, ?, ?, ?)",
        (name, interval, image, owner_id),
    )
print(f"✓ Created {len(plants)} plants")
connection.commit()

print("\n" + "="*50)
print("✓ Database seeded successfully!")
print("="*50)
print(f"\nSummary:")
print(f"  - {len(person_map)} persons")
print(f"  - {len(chores)} chores ({sum(1 for c in chores if c[2])} rotating, {sum(1 for c in chores if not c[2])} regular)")
print(f"  - {len(plants)} plants")
print()

connection.close()