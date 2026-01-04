sql_statements = [
    """CREATE TABLE IF NOT EXISTS person (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        is_available INTEGER NOT NULL DEFAULT 1,
        unavailble_since INTEGER,
        unavailble_until INTEGER
    );""",
    """CREATE TABLE IF NOT EXISTS chore (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        interval INTEGER NOT NULL,
        last_done INTEGER,
        rotation_enabled INTEGER NOT NULL DEFAULT 0,
        rotation_order TEXT,
        last_assigned_index INTEGER,
        worker_id INTEGER,
        temporary_worker_id INTEGER NOT NULL,
        FOREIGN KEY(worker_id) REFERENCES person(id),
        FOREIGN KEY(temporary_worker_id) REFERENCES person(id)
    );""",
    """CREATE TABLE IF NOT EXISTS plant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image TEXT,
        last_pour INTEGER,
        interval INTEGER NOT NULL,
        owner_id INTEGER,
        temporary_owner_id INTEGER NOT NULL,
        FOREIGN KEY(temporary_owner_id) REFERENCES person(id),
        FOREIGN KEY(owner_id) REFERENCES person(id)
    );""",
    """CREATE TABLE IF NOT EXISTS task_reassignment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_type TEXT NOT NULL,
        task_id INTEGER NOT NULL,
        original_owner_id INTEGER NOT NULL,
        temporary_owner_id INTEGER NOT NULL,
        reassigned_at INTEGER NOT NULL,
        reason TEXT,
        FOREIGN KEY(original_owner_id) REFERENCES person(id),
        FOREIGN KEY(temporary_owner_id) REFERENCES person(id)
    );"""
]