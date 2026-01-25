sql_statements = [
    """CREATE TABLE IF NOT EXISTS person (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        is_available INTEGER NOT NULL DEFAULT 1,
        unavailable_since INTEGER,
        unavailable_until INTEGER
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
        temporary_worker_id INTEGER,
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
        temporary_owner_id INTEGER,
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
    );""",
    """CREATE TABLE IF NOT EXISTS push_subscription (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        person_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(person_id) REFERENCES person(id),
        UNIQUE(person_id, endpoint)
    );""",
    """CREATE TABLE IF NOT EXISTS one_time_task (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        assigned_to INTEGER NOT NULL,
        created_by INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        due_date INTEGER,
        priority TEXT DEFAULT 'medium',
        FOREIGN KEY(assigned_to) REFERENCES person(id),
        FOREIGN KEY(created_by) REFERENCES person(id)
    );""",
    """CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_type TEXT NOT NULL,
        task_id INTEGER NOT NULL,
        task_name TEXT NOT NULL,
        completed_at INTEGER NOT NULL,
        completed_by INTEGER NOT NULL,
        was_overdue INTEGER DEFAULT 0,
        points INTEGER DEFAULT 1,
        FOREIGN KEY(completed_by) REFERENCES person(id)
    );""",
    # Einkaufsliste

    """CREATE TABLE IF NOT EXISTS shopping_master_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        default_quantity REAL DEFAULT 1,
        default_unit TEXT DEFAULT 'x',
        sort_order INTEGER NOT NULL,
        created_at INTEGER NOT NULL
    );""",
    """CREATE TABLE IF NOT EXISTS shopping_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_by INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        FOREIGN KEY(completed_by) REFERENCES person(id)
    );""",
    """CREATE TABLE IF NOT EXISTS shopping_session_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        master_item_id INTEGER, -- NULL for spontaneous items due to not being inside master items table
        name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        category TEXT NOT NULL,
        is_checked BOOLEAN DEFAULT 1,
        notes TEXT,
        added_by INTEGER NOT NULL,
        recipe_id INTEGER, -- NULL if item is not from a recipe
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY(session_id) REFERENCES shopping_sessions(id),
        FOREIGN KEY(master_item_id) REFERENCES master_items(id),
        FOREIGN KEY(added_by) REFERENCES person(id),
        FOREIGN KEY(recipe_id) REFERENCES recipes(id)
    );""",
    """CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
        servings INTEGER DEFAULT 4,
        created_at INTEGER NOT NULL,
        created_by INTEGER NOT NULL,
        FOREIGN KEY(created_by) REFERENCES person(id)
    );""",
    """CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        category TEXT, -- for sorting
        FOREIGN KEY(recipe_id) REFERENCES recipes(id)
    );"""
]