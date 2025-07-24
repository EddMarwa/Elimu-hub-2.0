#!/usr/bin/env python3
"""
Simple validation script to test core Elimu Hub components
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

def validate_environment():
    """Validate environment configuration"""
    print("🔍 Validating Environment Configuration...")
    
    load_dotenv()
    
    required_vars = [
        "DATABASE_URL",
        "OLLAMA_BASE_URL", 
        "OLLAMA_MODEL",
        "EMBEDDING_MODEL",
        "VECTOR_DB_PATH"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    print("✅ Environment configuration is valid")
    return True

def validate_database():
    """Validate database connection"""
    print("🔍 Validating Database Connection...")
    
    try:
        from sqlalchemy import create_engine
        from app.db_models import Base
        
        database_url = os.getenv("DATABASE_URL")
        engine = create_engine(database_url)
        
        # Test connection
        with engine.connect() as conn:
            pass
        
        print("✅ Database connection successful")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def validate_ollama():
    """Validate Ollama connection"""
    print("🔍 Validating Ollama Connection...")
    
    try:
        import requests
        
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model_name = os.getenv("OLLAMA_MODEL", "mistral:7b-instruct")
        
        # Test connection
        response = requests.get(f"{ollama_url}/api/tags", timeout=10)
        if response.status_code != 200:
            print(f"❌ Ollama not responding at {ollama_url}")
            return False
        
        # Check model availability
        models = response.json().get("models", [])
        model_names = [model["name"] for model in models]
        
        if model_name not in model_names:
            print(f"❌ Model '{model_name}' not found. Available: {model_names}")
            print(f"💡 Run: ollama pull {model_name}")
            return False
        
        print("✅ Ollama connection and model availability confirmed")
        return True
        
    except Exception as e:
        print(f"❌ Ollama validation failed: {e}")
        return False

def validate_embedding_model():
    """Validate embedding model"""
    print("🔍 Validating Embedding Model...")
    
    try:
        from sentence_transformers import SentenceTransformer
        
        model_name = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
        device = os.getenv("EMBEDDING_DEVICE", "cpu")
        
        # Load model
        model = SentenceTransformer(model_name, device=device)
        
        # Test embedding
        test_embedding = model.encode(["test sentence"])
        
        if len(test_embedding[0]) > 0:
            print(f"✅ Embedding model '{model_name}' loaded successfully")
            print(f"   Dimension: {len(test_embedding[0])}")
            return True
        
        print("❌ Embedding model produced empty embeddings")
        return False
        
    except Exception as e:
        print(f"❌ Embedding model validation failed: {e}")
        return False

def validate_vector_db():
    """Validate vector database"""
    print("🔍 Validating Vector Database...")
    
    try:
        from app.retriever import EmbeddingRetriever
        
        embedding_model = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
        vector_db_path = os.getenv("VECTOR_DB_PATH", "./embeddings/chroma_db")
        
        retriever = EmbeddingRetriever(
            model_name=embedding_model,
            vector_db_path=vector_db_path,
            device="cpu"
        )
        
        # Test collection stats
        stats = retriever.get_collection_stats()
        
        if "error" in stats:
            print(f"❌ Vector database error: {stats['error']}")
            return False
        
        print(f"✅ Vector database accessible")
        print(f"   Total chunks: {stats.get('total_chunks', 0)}")
        return True
        
    except Exception as e:
        print(f"❌ Vector database validation failed: {e}")
        return False

def validate_api_imports():
    """Validate that API can be imported"""
    print("🔍 Validating API Imports...")
    
    try:
        from app.main import app
        print("✅ FastAPI app imported successfully")
        return True
        
    except Exception as e:
        print(f"❌ API import failed: {e}")
        return False

def main():
    """Run all validations"""
    print("🚀 Elimu Hub System Validation")
    print("=" * 50)
    
    validations = [
        ("Environment", validate_environment),
        ("Database", validate_database),
        ("Ollama", validate_ollama),
        ("Embedding Model", validate_embedding_model),
        ("Vector Database", validate_vector_db),
        ("API Imports", validate_api_imports)
    ]
    
    results = {}
    
    for name, validator in validations:
        try:
            results[name] = validator()
        except Exception as e:
            print(f"❌ {name} validation crashed: {e}")
            results[name] = False
        print()
    
    # Summary
    print("📊 Validation Summary")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{name:20} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} validations passed")
    
    if passed == total:
        print("\n🎉 All validations passed! Elimu Hub is ready to use.")
        print("\n📝 Next steps:")
        print("1. Start the server: python start_server.py")
        print("2. Visit http://localhost:8000/docs")
        print("3. Upload documents and start querying!")
    else:
        print(f"\n⚠️  {total - passed} validations failed. Please fix the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
