#!/usr/bin/env python3
"""
Initialize Elimu Hub 2.0 with sample data and users
Run this script after the first installation to set up demo data
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

from app.db_models import Base, User, EducationLevel, UserRole
from app.crud import UserCRUD, EducationLevelCRUD

# Load environment variables
load_dotenv()

def initialize_sample_data():
    """Initialize the system with sample users and education levels"""
    
    # Database setup
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./elimu_hub.db")
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("🚀 Initializing Elimu Hub 2.0...")
        
        # Create sample users
        print("\n👥 Creating sample users...")
        
        users_to_create = [
            {
                "username": "admin",
                "email": "admin@elimuhub.co.ke",
                "password": "admin123",
                "full_name": "System Administrator",
                "role": UserRole.ADMIN.value
            },
            {
                "username": "teacher_mary",
                "email": "mary@elimuhub.co.ke", 
                "password": "teacher123",
                "full_name": "Mary Wanjiku",
                "role": UserRole.SUPER_USER.value
            },
            {
                "username": "teacher_john",
                "email": "john@elimuhub.co.ke",
                "password": "teacher123", 
                "full_name": "John Kimani",
                "role": UserRole.SUPER_USER.value
            },
            {
                "username": "student",
                "email": "student@elimuhub.co.ke",
                "password": "student123",
                "full_name": "Student User",
                "role": UserRole.USER.value
            }
        ]
        
        for user_data in users_to_create:
            existing_user = UserCRUD.get_by_username(db, user_data["username"])
            if not existing_user:
                new_user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    role=user_data["role"]
                )
                new_user.set_password(user_data["password"])
                
                UserCRUD.create(
                    db,
                    username=new_user.username,
                    email=new_user.email,
                    password_hash=new_user.password_hash,
                    full_name=new_user.full_name,
                    role=new_user.role
                )
                print(f"   ✅ Created user: {user_data['username']} ({user_data['role']})")
            else:
                print(f"   ⚠️  User already exists: {user_data['username']}")
        
        # Create education levels
        print("\n🎓 Creating education levels...")
        
        education_levels = [
            {
                "name": "Pre-Primary",
                "name_swahili": "Awali",
                "description": "Early childhood development and education (Ages 4-5)",
                "display_order": 0
            },
            {
                "name": "Primary",
                "name_swahili": "Msingi",
                "description": "Primary education (Grades 1-6)",
                "display_order": 1
            },
            {
                "name": "Junior Secondary",
                "name_swahili": "Sekondari ya Chini",
                "description": "Junior Secondary School (Grades 7-9)",
                "display_order": 2
            },
            {
                "name": "Secondary",
                "name_swahili": "Sekondari",
                "description": "Senior Secondary School (Grades 10-12)",
                "display_order": 3
            },
            {
                "name": "TVET",
                "name_swahili": "Mafunzo ya Ufundi",
                "description": "Technical and Vocational Education and Training",
                "display_order": 4
            }
        ]
        
        for level_data in education_levels:
            existing_level = EducationLevelCRUD.get_by_name(db, level_data["name"])
            if not existing_level:
                EducationLevelCRUD.create(db, **level_data)
                print(f"   ✅ Created education level: {level_data['name']}")
            else:
                print(f"   ⚠️  Education level already exists: {level_data['name']}")
        
        print("\n✨ Initialization complete!")
        print("\n📋 Sample Accounts Created:")
        print("   👨‍💼 Admin: admin / admin123")
        print("   👩‍🏫 Super User: teacher_mary / teacher123")
        print("   👨‍🏫 Super User: teacher_john / teacher123") 
        print("   👨‍🎓 Regular User: student / student123")
        
        print("\n🔗 API Endpoints:")
        print("   📖 API Docs: http://localhost:8000/docs")
        print("   🔐 Login: POST /auth/login")
        print("   📤 Upload: POST /upload (requires auth)")
        print("   🎓 Education Levels: GET /education-levels")
        print("   💬 Query: POST /query")
        
        print("\n⚠️  SECURITY WARNING:")
        print("   🔑 Change default passwords in production!")
        print("   🔐 Update JWT_SECRET in your .env file!")
        
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        return False
    finally:
        db.close()
    
    return True

if __name__ == "__main__":
    success = initialize_sample_data()
    sys.exit(0 if success else 1)
