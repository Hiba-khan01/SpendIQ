import sys
import os
from pathlib import Path

# Add root directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.database import check_db_health, engine
from backend.app.config import settings

def main():
    print(f"Checking SpendIQ Database connection...")
    health = check_db_health()
    print(f"Health Status: {health}")
    if health.get("connected"):
        print(f"Successfully connected to MySQL database: '{health.get('database')}' via {health.get('dialect')}")
    else:
        print(f"Failed to connect: {health.get('error')}")

if __name__ == "__main__":
    main()
