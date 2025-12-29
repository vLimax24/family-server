import sqlite3
from models import sql_statements

with sqlite3.connect('main.db') as connection:
    cursor = connection.cursor()

    for i in sql_statements:
        cursor.execute(i)

    connection.commit()
