import os

# Determine environment
ENV = os.getenv('ENV', 'development')  # default to development

# Database configuration based on environment
DB_CONFIG = {
    'test': 'test.db',
    'development': 'dev.db',
    'production': 'main.db'
}

DATABASE_NAME = DB_CONFIG.get(ENV, 'dev.db')

print(f"Running in {ENV} environment, using database: {DATABASE_NAME}")