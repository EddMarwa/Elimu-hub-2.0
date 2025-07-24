#!/usr/bin/env python3
"""
Simple server starter for backend testing
"""
import sys
import os

# Add current directory to Python path
sys.path.insert(0, '.')

# Set environment
os.environ.setdefault('PYTHONPATH', '.')

try:
    from app.main import app
    import uvicorn
    
    print("🚀 Starting Elimu Hub Backend Server...")
    print("📡 Server will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop")
    
    uvicorn.run(
        app, 
        host="127.0.0.1", 
        port=8000,
        log_level="info"
    )
    
except Exception as e:
    print(f"❌ Failed to start server: {e}")
    sys.exit(1)
