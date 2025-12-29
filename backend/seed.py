import sqlite3
import random
from db import connection, cursor

# --- Tabelle leeren und Autoincrement zurücksetzen ---
for table in ["plant", "chore"]:
    cursor.execute(f"DELETE FROM {table};")
    cursor.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}';")

# --- Sample Names ---
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

# --- Create 16 Plants ---
plants = []
for i, name in enumerate(plant_names, 1):
    interval = random.randint(1, 5)  # interval in days
    owner_id = random.randint(1, 4)
    image = f"{name.lower().replace(' ', '_')}.png"
    plants.append((name, interval, image, owner_id))

cursor.executemany(
    "INSERT INTO plant (name, interval, image, owner_id) VALUES (?, ?, ?, ?)",
    plants
)

# --- Create 16 Chores ---
chores = []
for i, name in enumerate(chore_names, 1):
    interval = random.randint(1, 7)  # interval in days
    worker_id = random.randint(1, 4)
    chores.append((name, interval, worker_id))

cursor.executemany(
    "INSERT INTO chore (name, interval, worker_id) VALUES (?, ?, ?)",
    chores
)

connection.commit()
connection.close()

print("Plants and Chores table reset and seeded with sample data successfully.")
