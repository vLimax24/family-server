from db import cursor, connection


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


def ensure_person_exists(person_id): ensure_exists("person", person_id, "Person")
def ensure_plant_exists(plant_id):   ensure_exists("plant", plant_id, "Plant")
def ensure_chore_exists(chore_id):   ensure_exists("chore", chore_id, "Chore")


# ---------- PERSON METHODS ----------

def getPersonById(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    cursor.execute("SELECT * FROM person WHERE id = ?", (person_id,))
    return cursor.fetchone()   # always one row


def getAllPersons():
    cursor.execute("SELECT * FROM person")
    return cursor.fetchall()


# ---------- CHORE METHODS ----------

def getChoresOfPerson(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    cursor.execute("SELECT * FROM chore WHERE worker_id = ?", (person_id,))
    return cursor.fetchall()


def getDueChoresOfPerson(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    cursor.execute("""
        SELECT * FROM chore
        WHERE worker_id = ?
        AND (last_done IS NULL OR last_done + interval*86400 <= CAST(strftime('%s','now') AS INTEGER))
    """, (person_id,))
    return cursor.fetchall()


def markChoreDone(chore_id):
    ensure_positive_int(chore_id, "chore_id")
    ensure_chore_exists(chore_id)

    cursor.execute("""
        UPDATE chore
        SET last_done = CAST(strftime('%s','now') AS INTEGER)
        WHERE id = ?
    """, (chore_id,))

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
    return cursor.fetchall()


def getDuePlantsOfPerson(person_id):
    ensure_positive_int(person_id, "person_id")
    ensure_person_exists(person_id)

    cursor.execute("""
        SELECT * FROM plant
        WHERE owner_id = ?
        AND (last_pour IS NULL OR last_pour + interval*86400 <= CAST(strftime('%s','now') AS INTEGER))
    """, (person_id,))
    return cursor.fetchall()


def markPlantWatered(plant_id):
    ensure_positive_int(plant_id, "plant_id")
    ensure_plant_exists(plant_id)

    cursor.execute("""
        UPDATE plant
        SET last_pour = CAST(strftime('%s','now') AS INTEGER)
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
