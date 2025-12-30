sql_statements = [
    """CREATE TABLE IF NOT EXISTS person (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL
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
        FOREIGN KEY(worker_id) REFERENCES person(id)
    );""",
    """CREATE TABLE IF NOT EXISTS plant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image TEXT,
        last_pour INTEGER,
        interval INTEGER NOT NULL,
        owner_id INTEGER,
        FOREIGN KEY(owner_id) REFERENCES person(id)
    );"""
]