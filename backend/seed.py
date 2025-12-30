import sqlite3
import json
from db import connection, cursor

# DB leeren
cursor.execute("DELETE FROM plant")
cursor.execute("DELETE FROM chore")
cursor.execute("DELETE FROM person")
connection.commit()

# ---------- Personen ----------
persons = [
    ("Linas", "child"),
    ("Amelie", "child"),
    ("Katrin", "parent"),
    ("Micha", "parent"),
]

for name, role in persons:
    cursor.execute("INSERT INTO person (name, role) VALUES (?, ?)", (name, role))
connection.commit()

# IDs der Personen
cursor.execute("SELECT id, name FROM person")
person_map = {name: pid for pid, name in cursor.fetchall()}  # z.B. {"Linas":1, ...}

# ---------- Chores ----------
chores = [
    # Name, Intervall in Tagen, Rotation enabled, Rotation order, Last assigned index, worker_id (irrelevant bei rotation)
    ("Geschirrspüler", 1, True, [person_map["Linas"], person_map["Amelie"], person_map["Katrin"], person_map["Micha"]], 3),
    ("Müll wegschaffen", 2, True, [person_map["Linas"], person_map["Amelie"], person_map["Katrin"], person_map["Micha"]], 1),
    ("Wäsche Waschen", 2, True, [person_map["Linas"], person_map["Amelie"], person_map["Katrin"], person_map["Micha"]], 0),
    ("Amelie Zimmer aufräumen", 7, False, [], None, person_map["Amelie"]),
    ("Linas Zimmer aufräumen", 7, False, [], None, person_map["Linas"]),
    ("Bad putzen", 14, True, [person_map["Linas"], person_map["Amelie"], person_map["Katrin"], person_map["Micha"]], 2),
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
connection.commit()

# ---------- Pflanzen ----------
plants = [
    ("Linas Hängepflanze", 4, None, person_map["Linas"]),
    ("Linas Bettpflanze groß", 4, None, person_map["Linas"]),
    ("Linas Bettpflanze klein", 4, None, person_map["Linas"]),
]

for name, interval, image, owner_id in plants:
    cursor.execute(
        "INSERT INTO plant (name, interval, image, owner_id) VALUES (?, ?, ?, ?)",
        (name, interval, image, owner_id),
    )
connection.commit()

print("Seeded database successfully.")
connection.close()
