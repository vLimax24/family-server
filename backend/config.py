import os
from pathlib import Path

# Determine environment
ENV = os.getenv('ENV', 'development')

# Determine data directory
if os.path.exists('/app'):  # Docker
    DATA_DIR = Path('/app/data')
else:  # Local Windows/Mac/Linux
    DATA_DIR = Path(__file__).parent / 'data'  # backend/data/

DATA_DIR.mkdir(exist_ok=True)

# Database configuration
DB_CONFIG = {
    'test': 'test.db',
    'development': str(DATA_DIR / 'dev.db'),
    'production': str(DATA_DIR / 'main.db')
}

DATABASE_NAME = DB_CONFIG.get(ENV, str(DATA_DIR / 'dev.db'))

print(f"Running in {ENV} environment, using database: {DATABASE_NAME}")