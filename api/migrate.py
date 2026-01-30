#!/usr/bin/env python3
"""
Run database migrations to add new columns to proxy_tunnels table.
Execute this script once to update your database schema.
"""

from database import engine
from sqlalchemy import text

def migrate():
    print("Running migrations...")
    
    with engine.connect() as conn:
        # Add columns one by one (MySQL doesn't support IF NOT EXISTS for columns)
        columns_to_add = [
            ("default_min_latency", "INT DEFAULT 0"),
            ("default_max_latency", "INT DEFAULT 0"),
            ("default_fail_rate", "INT DEFAULT 0"),
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE proxy_tunnels ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"✓ Added column: {col_name}")
            except Exception as e:
                if "Duplicate column name" in str(e):
                    print(f"  Column {col_name} already exists, skipping")
                else:
                    print(f"  Error adding {col_name}: {e}")
    
    print("\nMigration complete!")

if __name__ == "__main__":
    migrate()
