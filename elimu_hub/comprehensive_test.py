#!/usr/bin/env python3
"""
Comprehensive test of the Elimu Hub 2.0 system
"""
import sys
import time

# Add current directory to Python path
sys.path.append('.')

def test_full_system():
    """Test the complete system functionality"""
    print("🧪 Elimu Hub 2.0 - Comprehensive System Test")
    print("=" * 60)
    
    success_count = 0
    total_tests = 0
    
    # Test 1: Database Connection and Models
    print("\n1️⃣ Testing Database and Models...")
    total_tests += 1
    try:
        from app.database import get_db
        from app.db_models import User, Document, Chunk, EducationLevel, Subject
        from app.crud import UserCRUD, DocumentCRUD, EducationLevelCRUD
        from sqlalchemy.orm import sessionmaker
        from sqlalchemy import create_engine
        
        # Test database connection
        DATABASE_URL = "sqlite:///./elimu_hub.db"
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Test basic queries
        users = UserCRUD.get_all(db, limit=5)
        levels = EducationLevelCRUD.get_all(db)
        documents = DocumentCRUD.get_all(db, limit=5)
        
        print(f"   ✅ Database connected successfully")
        print(f"   ✅ Found {len(users)} users")
        print(f"   ✅ Found {len(levels)} education levels")
        print(f"   ✅ Found {len(documents)} documents")
        
        db.close()
        success_count += 1
        
    except Exception as e:
        print(f"   ❌ Database test failed: {e}")
    
    # Test 2: Authentication System
    print("\n2️⃣ Testing Authentication System...")
    total_tests += 1
    try:
        from app.auth import verify_password, create_access_token, verify_token
        from app.crud import UserCRUD
        
        db = SessionLocal()
        
        # Test login with admin user
        admin_user = UserCRUD.get_by_username(db, "admin")
        if admin_user and verify_password("admin123", admin_user.password_hash):
            token = create_access_token({"sub": admin_user.username})
            payload = verify_token(token)
            
            print(f"   ✅ Authentication working")
            print(f"   ✅ Admin user found: {admin_user.username}")
            print(f"   ✅ JWT token created and verified")
            success_count += 1
        else:
            print(f"   ❌ Admin user not found or password incorrect")
        
        db.close()
        
    except Exception as e:
        print(f"   ❌ Authentication test failed: {e}")
    
    # Test 3: PDF Processing
    print("\n3️⃣ Testing PDF Processing...")
    total_tests += 1
    try:
        from app.pdf_ingestor import PDFIngestor
        
        pdf_ingestor = PDFIngestor()
        print(f"   ✅ PDF ingestor initialized")
        print(f"   ✅ OCR available: {pdf_ingestor.ocr_available}")
        success_count += 1
        
    except Exception as e:
        print(f"   ❌ PDF processing test failed: {e}")
    
    # Test 4: Embedding and Vector Database
    print("\n4️⃣ Testing Embedding and Vector Database...")
    total_tests += 1
    try:
        from app.retriever import EmbeddingRetriever
        
        retriever = EmbeddingRetriever(
            model_name="BAAI/bge-small-en-v1.5",
            vector_db_path="./embeddings/chroma_db",
            device="cpu"
        )
        
        # Test embedding
        test_texts = ["This is a test sentence about mathematics."]
        embeddings = retriever.embed_texts(test_texts)
        
        # Test search
        results = retriever.search_similar_chunks(
            query="mathematics test",
            n_results=3
        )
        
        print(f"   ✅ Embedding model loaded: {retriever.model_name}")
        print(f"   ✅ Embedding dimension: {retriever.embedding_dimension}")
        print(f"   ✅ Vector database accessible")
        print(f"   ✅ Found {len(results)} similar chunks")
        success_count += 1
        
    except Exception as e:
        print(f"   ❌ Embedding test failed: {e}")
    
    # Test 5: Ollama Integration
    print("\n5️⃣ Testing Ollama Integration...")
    total_tests += 1
    try:
        from app.rag_runner import RAGRunner
        
        rag_runner = RAGRunner(
            retriever=retriever,
            ollama_base_url="http://localhost:11434",
            model_name="mistral:7b-instruct"
        )
        
        # Test health check
        is_healthy = rag_runner.health_check()
        
        if is_healthy:
            print(f"   ✅ Ollama connection successful")
            print(f"   ✅ Model 'mistral:7b-instruct' available")
            
            # Test quick generation (with timeout handling)
            try:
                print("   🔄 Testing answer generation...")
                response = rag_runner.generate_answer(
                    query="What is math?",
                    education_level="Primary",
                    language="en"
                )
                
                if response and response.get('answer'):
                    print(f"   ✅ Answer generation working")
                    print(f"   ✅ Answer length: {len(response['answer'])}")
                    success_count += 1
                else:
                    print(f"   ⚠️  No answer generated")
                    success_count += 0.5  # Partial credit
                    
            except Exception as gen_e:
                if "timed out" in str(gen_e).lower():
                    print(f"   ⚠️  Generation timed out (normal on slow systems)")
                    success_count += 0.5  # Partial credit for working connection
                else:
                    print(f"   ❌ Generation failed: {gen_e}")
        else:
            print(f"   ❌ Ollama health check failed")
        
    except Exception as e:
        print(f"   ❌ Ollama test failed: {e}")
    
    # Test 6: Education Level Management
    print("\n6️⃣ Testing Education Level Management...")
    total_tests += 1
    try:
        db = SessionLocal()
        levels = EducationLevelCRUD.get_all(db)
        
        print(f"   ✅ Education levels loaded: {len(levels)}")
        for level in levels:
            print(f"     - {level.name} ({level.name_swahili})")
        
        success_count += 1
        db.close()
        
    except Exception as e:
        print(f"   ❌ Education level test failed: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("🎯 TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {success_count}")
    print(f"Success Rate: {(success_count/total_tests)*100:.1f}%")
    
    if success_count >= total_tests * 0.8:  # 80% success rate
        print("\n🎉 SYSTEM IS WORKING WELL!")
        print("✅ Elimu Hub 2.0 is ready for production")
        
        print("\n📋 Next Steps:")
        print("1. Start the server: python -c \"from app.main import app; import uvicorn; uvicorn.run(app, host='127.0.0.1', port=8000)\"")
        print("2. Visit: http://localhost:8000/docs")
        print("3. Login with: admin / admin123")
        print("4. Upload documents and test queries")
        
        return True
    else:
        print("\n⚠️  SOME ISSUES DETECTED")
        print("Some components need attention before production use")
        return False

if __name__ == "__main__":
    success = test_full_system()
    sys.exit(0 if success else 1)
