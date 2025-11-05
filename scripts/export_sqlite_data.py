#!/usr/bin/env python3
"""
🔥 DIVINE CODEX - SQLite Export Script
Exports all data from local SQLite database to JSON
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime

def export_sqlite():
    """Export all tables from SQLite to JSON"""

    print("🔥 DIVINE CODEX - SQLite Export Starting...")
    print("=" * 60)

    # Find the database
    db_path = Path(__file__).parent.parent / "api" / "ava.db"

    if not db_path.exists():
        print(f"❌ Database not found at: {db_path}")
        print("\n💡 Make sure you're running this from the project root!")
        return False

    print(f"✅ Found database: {db_path}")
    print()

    # Connect to SQLite
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Tables to export
    tables = [
        'users',
        'assistants',
        'phone_numbers',
        'calls',
        'studio_config',
        'user_onboarding_state',
        'ava_profile',
        'tenants',
        'revoked_tokens'
    ]

    data = {}
    total_rows = 0

    # Export each table
    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            data[table] = [dict(row) for row in rows]

            row_count = len(rows)
            total_rows += row_count

            if row_count > 0:
                print(f"✅ {table:25} → {row_count:3} rows")
            else:
                print(f"⚠️  {table:25} → Empty")

        except Exception as e:
            print(f"❌ {table:25} → Error: {e}")
            data[table] = []

    conn.close()

    # Save to JSON
    output_file = Path(__file__).parent / "sqlite_export.json"

    export_data = {
        "exported_at": datetime.now().isoformat(),
        "source_db": str(db_path),
        "total_rows": total_rows,
        "data": data
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, default=str, ensure_ascii=False)

    print()
    print("=" * 60)
    print(f"✅ Export complete!")
    print(f"📊 Total rows exported: {total_rows}")
    print(f"💾 Saved to: {output_file}")
    print()

    # Show summary
    print("📋 Summary:")
    for table, rows in data.items():
        if rows:
            print(f"   - {table}: {len(rows)} rows")

    return True

if __name__ == "__main__":
    success = export_sqlite()
    exit(0 if success else 1)
