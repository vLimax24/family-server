import sqlite3
from models import sql_statements
from config import DATABASE_NAME

with sqlite3.connect(DATABASE_NAME) as connection:

    connection.row_factory = sqlite3.Row

    cursor = connection.cursor()

    for i in sql_statements:
        cursor.execute(i)

    connection.commit()