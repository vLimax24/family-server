import sqlite3
from pathlib import Path
from models import sql_statements
from config import DATABASE_NAME

# Check if database needs initialization
db_path = Path(DATABASE_NAME)
needs_init = not db_path.exists()

# Create connection
connection = sqlite3.connect(DATABASE_NAME, check_same_thread=False)
connection.row_factory = sqlite3.Row
cursor = connection.cursor()

if needs_init:
    print(f"Initializing new database: {DATABASE_NAME}")
    for statement in sql_statements:
        cursor.execute(statement)
    connection.commit()
    print("✓ Database initialized!")
else:
    print(f"Using existing database: {DATABASE_NAME}")