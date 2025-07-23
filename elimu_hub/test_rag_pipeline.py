#!/usr/bin/env python3
"""
Test script to demonstrate the complete RAG pipeline for Elimu Hub 2.0
"""
import os
import sys
import asyncio
import json
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.main import app
from app.db_models import Base, Document, Chunk
from app.crud import DocumentCRUD, ChunkCRUD
from app.pdf_ingestor import PDFIngestor
from app.retriever import EmbeddingRetriever
from app.rag_runner import RAGRunner
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from loguru import logger

# Load environment variables
load_dotenv()

class RAGPipelineDemo:
    """Demonstrates the complete RAG pipeline"""
    
    def __init__(self):
        """Initialize the demo"""
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./elimu_hub.db")
        self.engine = create_engine(self.database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Create tables
        Base.metadata.create_all(bind=self.engine)
        
        logger.info("RAG Pipeline Demo initialized")
    
    def create_sample_data(self):
        """Create sample educational content for testing"""
        
        # Create a sample text file to simulate PDF content
        sample_content = """
# Grade 6 Mathematics - Fractions

## What are Fractions?
A fraction represents a part of a whole. It consists of two numbers:
- The numerator (top number) - tells us how many parts we have
- The denominator (bottom number) - tells us how many equal parts the whole is divided into

## Types of Fractions
1. **Proper Fractions**: The numerator is smaller than the denominator (e.g., 3/4)
2. **Improper Fractions**: The numerator is larger than or equal to the denominator (e.g., 5/3)
3. **Mixed Numbers**: A whole number combined with a proper fraction (e.g., 2 1/3)

## Adding Fractions
To add fractions with the same denominator:
1. Add the numerators
2. Keep the same denominator
3. Simplify if possible

Example: 1/4 + 2/4 = 3/4

## Real-world Applications
Fractions are used in:
- Cooking (measuring ingredients)
- Sports (tracking scores)
- Money (counting coins)
- Time (parts of an hour)
"""
        
        # Create models directory if it doesn't exist
        models_dir = Path("models")
        models_dir.mkdir(exist_ok=True)
        
        # Write sample content to a text file (simulating extracted PDF content)
        sample_file = models_dir / "grade6_math_fractions.txt"
        with open(sample_file, "w", encoding="utf-8") as f:
            f.write(sample_content)
        
        logger.info(f"Created sample content file: {sample_file}")
        return sample_file
    
    def simulate_pdf_processing(self, content_file: Path):
        """Simulate PDF processing and chunking"""
        
        # Read the content
        with open(content_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Simulate chunking (split by sections)
        sections = content.split("##")
        chunks = []
        
        for i, section in enumerate(sections[1:], 1):  # Skip first empty section
            chunk_content = f"##{section.strip()}"
            if len(chunk_content) > 50:  # Only include substantial chunks
                chunk_data = {
                    "content": chunk_content,
                    "chunk_index": i,
                    "page_number": 1,
                    "character_count": len(chunk_content),
                    "token_count": len(chunk_content.split()),
                    "extraction_method": "text"
                }
                chunks.append(chunk_data)
        
        logger.info(f"Created {len(chunks)} chunks from content")
        return chunks
    
    def test_database_operations(self, chunks_data):
        """Test database CRUD operations"""
        
        with self.SessionLocal() as db:
            # Check if document already exists
            existing_doc = DocumentCRUD.get_by_hash(db, "sample_hash_123")
            if existing_doc:
                logger.info(f"Using existing document: {existing_doc.id}")
                # Get existing chunks
                chunks = ChunkCRUD.get_by_document(db, existing_doc.id)
                logger.info(f"Found {len(chunks)} existing chunks")
                return existing_doc, chunks
            
            # Create a document record
            document = DocumentCRUD.create(
                db,
                filename="grade6_math_fractions.txt",
                original_filename="Grade 6 Mathematics - Fractions.pdf",
                file_path="models/grade6_math_fractions.txt",
                file_size=1024,
                file_hash="sample_hash_123",
                education_level="Primary",
                subject="Mathematics",
                language="en",
                processing_status="completed",
                total_pages=1,
                total_chunks=len(chunks_data)
            )
            
            logger.info(f"Created document: {document.id}")
            
            # Create chunk records
            chunks = []
            for chunk_data in chunks_data:
                chunk_data["document_id"] = document.id
                chunk = ChunkCRUD.create(db, **chunk_data)
                chunks.append(chunk)
            
            logger.info(f"Created {len(chunks)} chunk records in database")
            return document, chunks
    
    def test_embedding_and_retrieval(self, document, chunks):
        """Test embedding generation and vector storage"""
        
        try:
            # Initialize embedding retriever
            embedding_model = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
            vector_db_path = os.getenv("VECTOR_DB_PATH", "./embeddings/chroma_db")
            
            retriever = EmbeddingRetriever(
                model_name=embedding_model,
                vector_db_path=vector_db_path,
                device="cpu"
            )
            
            logger.info("Embedding retriever initialized")
            
            # Manually add document metadata to chunks for embedding
            for chunk in chunks:
                # Manually set document info to avoid lazy loading issues
                if not hasattr(chunk, '_document_info'):
                    chunk._document_info = {
                        'education_level': document.education_level,
                        'subject': document.subject,
                        'language': document.language,
                        'filename': document.filename
                    }
            
            # Add chunks to vector database
            vector_ids = retriever.add_chunks_to_vector_db(chunks)
            logger.info(f"Added {len(vector_ids)} chunks to vector database")
            
            # Test retrieval
            test_queries = [
                "What are the types of fractions?",
                "How do you add fractions?",
                "What is a proper fraction?"
            ]
            
            for query in test_queries:
                logger.info(f"\nTesting query: '{query}'")
                results = retriever.search_similar_chunks(
                    query=query,
                    n_results=3
                    # education_level="Primary",
                    # subject="Mathematics"
                )
                
                for i, result in enumerate(results, 1):
                    logger.info(f"  Result {i}: Score {result['similarity_score']:.3f}")
                    logger.info(f"    Content: {result['content'][:100]}...")
            
            return retriever
            
        except Exception as e:
            logger.error(f"Error in embedding/retrieval test: {e}")
            return None
    
    def test_rag_generation(self, retriever):
        """Test the complete RAG generation pipeline"""
        
        if not retriever:
            logger.warning("Skipping RAG generation test - no retriever available")
            return
        
        try:
            # Initialize RAG runner
            rag_runner = RAGRunner(
                retriever=retriever,
                ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
                model_name=os.getenv("OLLAMA_MODEL", "mistral:7b-instruct")
            )
            
            logger.info("RAG runner initialized")
            
            # Test questions
            test_questions = [
                {
                    "question": "What are the different types of fractions?",
                    "education_level": "Primary",
                    "subject": "Mathematics"
                },
                {
                    "question": "How do you add fractions with the same denominator?",
                    "education_level": "Primary", 
                    "subject": "Mathematics"
                },
                {
                    "question": "Give me examples of where fractions are used in real life",
                    "education_level": "Primary",
                    "subject": "Mathematics"
                }
            ]
            
            for test in test_questions:
                logger.info(f"\n{'='*60}")
                logger.info(f"Question: {test['question']}")
                logger.info(f"Filters: {test['education_level']}, {test['subject']}")
                logger.info(f"{'='*60}")
                
                # Generate answer
                result = rag_runner.generate_answer(
                    query=test["question"],
                    education_level=test["education_level"],
                    subject=test["subject"],
                    language="en",
                    include_citations=True
                )
                
                # Display results
                logger.info(f"Answer: {result['answer']}")
                logger.info(f"Processing time: {result['processing_time_ms']}ms")
                logger.info(f"Chunks used: {result['chunks_used']}")
                logger.info(f"Confidence: {result['confidence']}")
                
                if result['sources']:
                    logger.info("Sources:")
                    for source in result['sources']:
                        logger.info(f"  - {source}")
                
        except Exception as e:
            logger.error(f"Error in RAG generation test: {e}")
            logger.info("Note: Make sure Ollama is running with 'ollama serve' and the specified model is available")
    
    def run_demo(self):
        """Run the complete RAG pipeline demonstration"""
        
        logger.info("🚀 Starting Elimu Hub RAG Pipeline Demo")
        logger.info("="*60)
        
        # Step 1: Create sample data
        logger.info("Step 1: Creating sample educational content...")
        content_file = self.create_sample_data()
        
        # Step 2: Simulate PDF processing
        logger.info("Step 2: Simulating PDF text extraction and chunking...")
        chunks_data = self.simulate_pdf_processing(content_file)
        
        # Step 3: Test database operations
        logger.info("Step 3: Testing database operations...")
        document, chunks = self.test_database_operations(chunks_data)
        
        # Step 4: Test embedding and retrieval
        logger.info("Step 4: Testing embedding generation and vector retrieval...")
        retriever = self.test_embedding_and_retrieval(document, chunks)
        
        # Step 5: Test RAG generation
        logger.info("Step 5: Testing complete RAG generation pipeline...")
        self.test_rag_generation(retriever)
        
        logger.info("✅ RAG Pipeline Demo completed!")
        logger.info("\nNext steps:")
        logger.info("1. Start the FastAPI server: python -m uvicorn app.main:app --reload")
        logger.info("2. Visit http://localhost:8000/docs to see the API documentation")
        logger.info("3. Use the /query endpoint to ask questions about the educational content")

def main():
    """Main function to run the demo"""
    demo = RAGPipelineDemo()
    demo.run_demo()

if __name__ == "__main__":
    main()
