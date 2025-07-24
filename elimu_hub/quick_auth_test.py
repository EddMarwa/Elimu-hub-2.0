#!/usr/bin/env python3
"""
Quick authentication test for Elimu Hub
"""
import sys
sys.path.append('.')

from app.main import app
from fastapi.testclient import TestClient

def quick_auth_test():
    client = TestClient(app)
    
    print("🔐 Quick Authentication Test")
    print("=" * 40)
    
    # Test login
    response = client.post("/auth/login", json={
        "username": "teacher_mary",
        "password": "teacher123"
    })
    
    if response.status_code == 200:
        auth_data = response.json()
        print(f"✅ Login successful!")
        print(f"   User: {auth_data['username']}")
        print(f"   Role: {auth_data['role']}")
        
        # Test authenticated request
        token = auth_data['access_token']
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get education levels
        response = client.get("/education-levels", headers=headers)
        if response.status_code == 200:
            levels = response.json()
            print(f"✅ Authentication working - {len(levels)} education levels found")
            
            # Try to create a new education level (super user should be able to)
            new_level = {
                "name": "Vocational Training",
                "name_swahili": "Mafunzo ya Stadi",
                "description": "Vocational and technical training programs",
                "display_order": 10
            }
            
            response = client.post("/education-levels", json=new_level, headers=headers)
            if response.status_code == 200:
                print("✅ Super user can create education levels")
                created_level = response.json()
                print(f"   Created: {created_level['name']}")
            else:
                print(f"❌ Failed to create education level: {response.status_code}")
        else:
            print(f"❌ Failed to get education levels: {response.status_code}")
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    quick_auth_test()
