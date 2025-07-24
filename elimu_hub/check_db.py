#!/usr/bin/env python3
import sqlite3

conn = sqlite3.connect('elimu_hub.db')
cursor = conn.cursor()

print("📊 Database Schema Check")
print("=" * 30)

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(f"Tables: {[t[0] for t in tables]}")

# Check documents table schema
if ('documents',) in tables:
    cursor.execute("PRAGMA table_info(documents)")
    columns = cursor.fetchall()
    print(f"\nDocuments table columns:")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")

conn.close()
