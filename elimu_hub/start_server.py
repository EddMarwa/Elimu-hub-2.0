#!/usr/bin/env python3
"""
Startup script for Elimu Hub development server
"""
import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def check_ollama():
    """Check if Ollama is running and has required model"""
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            model_names = [model["name"] for model in models]
            
            if "mistral:7b-instruct" in model_names:
                print("✅ Ollama is running with mistral:7b-instruct")
                return True
            else:
                print("⚠️  Ollama is running but mistral:7b-instruct not found")
                print("   Run: ollama pull mistral:7b-instruct")
                return False
        else:
            print("❌ Ollama API not responding")
            return False
    except requests.exceptions.RequestException:
        print("❌ Ollama not running")
        print("   Start with: ollama serve")
        return False

def check_database():
    """Check if database is accessible"""
    try:
        from sqlalchemy import create_engine
        from dotenv import load_dotenv
        
        load_dotenv()
        database_url = os.getenv("DATABASE_URL")
        
        if not database_url:
            print("❌ DATABASE_URL not set in .env")
            return False
        
        engine = create_engine(database_url)
        conn = engine.connect()
        conn.close()
        print("✅ Database connection successful")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def check_tesseract():
    """Check if Tesseract OCR is available"""
    try:
        result = subprocess.run(["tesseract", "--version"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.split('\n')[0]
            print(f"✅ Tesseract OCR available: {version}")
            return True
        else:
            print("❌ Tesseract OCR not found")
            return False
    except FileNotFoundError:
        print("❌ Tesseract OCR not found")
        print("   Install with: choco install tesseract (Windows)")
        return False

def main():
    """Main startup function"""
    print("🚀 Starting Elimu Hub Development Server")
    print("=" * 50)
    
    # Check environment file
    env_file = Path('.env')
    if not env_file.exists():
        print("❌ .env file not found")
        print("   Copy .env.example to .env and configure")
        sys.exit(1)
    else:
        print("✅ Environment file found")
    
    # Check dependencies
    ollama_ok = check_ollama()
    db_ok = check_database()
    ocr_ok = check_tesseract()
    
    if not ollama_ok:
        print("\n⚠️  Ollama issues detected. Some features may not work.")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    if not db_ok:
        print("\n❌ Database issues detected. Cannot continue.")
        sys.exit(1)
    
    if not ocr_ok:
        print("\n⚠️  OCR not available. Scanned PDFs won't be processed.")
    
    print("\n🎯 All systems ready!")
    print("=" * 50)
    
    # Start the server
    print("Starting FastAPI server...")
    print("API will be available at: http://localhost:8000")
    print("Documentation at: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        os.system("python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
    except KeyboardInterrupt:
        print("\n👋 Server stopped")

if __name__ == "__main__":
    main()
