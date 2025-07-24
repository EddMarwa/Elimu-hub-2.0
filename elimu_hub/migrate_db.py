#!/usr/bin/env python3
"""
Database migration script to update documents table for super user features
"""
import sys
import sqlite3
import uuid
from datetime import datetime

sys.path.append('.')

def migrate_database():
    """Migrate database to new schema with super user features"""
    
    print("🔄 Migrating Elimu Hub Database...")
    print("=" * 40)
    
    conn = sqlite3.connect('elimu_hub.db')
    cursor = conn.cursor()
    
    try:
        # Step 1: Check if migration is needed
        cursor.execute("PRAGMA table_info(documents)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'education_level_id' in columns:
            print("✅ Database already migrated!")
            return
        
        print("📋 Migration needed - updating documents table...")
        
        # Step 2: Add new columns to documents table
        print("   Adding education_level_id column...")
        cursor.execute("ALTER TABLE documents ADD COLUMN education_level_id INTEGER")
        
        print("   Adding uploaded_by column...")
        cursor.execute("ALTER TABLE documents ADD COLUMN uploaded_by UUID")
        
        # Step 3: Get education levels mapping
        cursor.execute("SELECT id, name FROM education_levels")
        level_mapping = {name: level_id for level_id, name in cursor.fetchall()}
        print(f"   Education level mapping: {level_mapping}")
        
        # Step 4: Update existing documents
        cursor.execute("SELECT id, education_level FROM documents")
        documents = cursor.fetchall()
        
        print(f"   Updating {len(documents)} existing documents...")
        for doc_id, old_level in documents:
            # Map old education level to new ID
            new_level_id = level_mapping.get(old_level)
            if new_level_id:
                cursor.execute(
                    "UPDATE documents SET education_level_id = ? WHERE id = ?",
                    (new_level_id, doc_id)
                )
                print(f"     ✅ Updated document {doc_id}: {old_level} -> {new_level_id}")
            else:
                # Default to Primary if unknown level
                primary_id = level_mapping.get('Primary', 2)
                cursor.execute(
                    "UPDATE documents SET education_level_id = ? WHERE id = ?",
                    (primary_id, doc_id)
                )
                print(f"     ⚠️  Unknown level '{old_level}' -> defaulted to Primary")
        
        # Step 5: We can't drop columns in SQLite easily, so leave the old column
        print("   Note: Old 'education_level' column kept for compatibility")
        
        # Commit changes
        conn.commit()
        print("✅ Migration completed successfully!")
        
        # Verify migration
        cursor.execute("SELECT COUNT(*) FROM documents WHERE education_level_id IS NOT NULL")
        updated_count = cursor.fetchone()[0]
        print(f"   📊 {updated_count} documents now have education_level_id")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()
    
    return True

def verify_migration():
    """Verify the migration worked correctly"""
    print("\n🔍 Verifying Migration...")
    print("=" * 30)
    
    conn = sqlite3.connect('elimu_hub.db')
    cursor = conn.cursor()
    
    try:
        # Test the new query
        cursor.execute("""
            SELECT d.id, d.filename, d.subject, e.name as education_level 
            FROM documents d 
            JOIN education_levels e ON e.id = d.education_level_id 
            LIMIT 3
        """)
        
        results = cursor.fetchall()
        print(f"✅ Query test successful - {len(results)} results")
        
        for doc_id, filename, subject, level in results:
            print(f"   - {filename}: {subject} ({level})")
            
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False
    finally:
        conn.close()
    
    return True

if __name__ == "__main__":
    if migrate_database():
        verify_migration()
        print("\n🎉 Database migration complete!")
        print("   The system now supports super user features!")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
