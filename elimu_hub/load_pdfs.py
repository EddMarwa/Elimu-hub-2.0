"""
Batch PDF loading script for Elimu Hub
Processes multiple PDF files and adds them to the system
"""
import os
import sys
import argparse
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional
import uuid

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from loguru import logger

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.db_models import Base, Document, Chunk
from app.crud import DocumentCRUD, ChunkCRUD
from app.pdf_ingestor import PDFIngestor
from app.retriever import EmbeddingRetriever

# Load environment variables
load_dotenv()

class PDFBatchLoader:
    """Batch loader for PDF documents"""
    
    def __init__(self):
        """Initialize the batch loader"""
        # Database setup
        self.database_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/elimu_hub")
        self.engine = create_engine(self.database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Create tables if they don't exist
        Base.metadata.create_all(bind=self.engine)
        
        # Initialize components
        self._init_components()
    
    def _init_components(self):
        """Initialize PDF ingestor and embedding retriever"""
        try:
            # Initialize PDF ingestor
            tesseract_cmd = os.getenv("TESSERACT_CMD")
            ocr_languages = os.getenv("OCR_LANGUAGES", "eng+swa")
            self.pdf_ingestor = PDFIngestor(tesseract_cmd=tesseract_cmd, ocr_languages=ocr_languages)
            
            # Initialize embedding retriever
            embedding_model = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
            vector_db_path = os.getenv("VECTOR_DB_PATH", "./embeddings/chroma_db")
            embedding_device = os.getenv("EMBEDDING_DEVICE", "cpu")
            
            self.embedding_retriever = EmbeddingRetriever(
                model_name=embedding_model,
                vector_db_path=vector_db_path,
                device=embedding_device
            )
            
            logger.info("Components initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize components: {e}")
            raise
    
    def load_directory(
        self,
        directory_path: str,
        education_level: str,
        subject: str,
        language: str = "en",
        recursive: bool = False,
        skip_existing: bool = True
    ) -> Dict[str, Any]:
        """
        Load all PDF files from a directory
        
        Args:
            directory_path: Path to directory containing PDFs
            education_level: Education level (Primary, Junior Secondary, Secondary)
            subject: Subject name
            language: Language code (en/sw)
            recursive: Whether to search subdirectories
            skip_existing: Whether to skip files that already exist
            
        Returns:
            Dictionary with processing results
        """
        directory = Path(directory_path)
        if not directory.exists():
            raise ValueError(f"Directory does not exist: {directory_path}")
        
        # Find PDF files
        if recursive:
            pdf_files = list(directory.rglob("*.pdf"))
        else:
            pdf_files = list(directory.glob("*.pdf"))
        
        if not pdf_files:
            logger.warning(f"No PDF files found in {directory_path}")
            return {"processed": 0, "skipped": 0, "failed": 0, "files": []}
        
        logger.info(f"Found {len(pdf_files)} PDF files to process")
        
        results = {
            "processed": 0,
            "skipped": 0,
            "failed": 0,
            "files": []
        }
        
        for pdf_file in pdf_files:
            try:
                result = self.load_single_file(
                    str(pdf_file),
                    education_level,
                    subject,
                    language,
                    skip_existing
                )
                
                results["files"].append(result)
                
                if result["status"] == "processed":
                    results["processed"] += 1
                elif result["status"] == "skipped":
                    results["skipped"] += 1
                else:
                    results["failed"] += 1
                    
            except Exception as e:
                logger.error(f"Error processing {pdf_file}: {e}")
                results["failed"] += 1
                results["files"].append({
                    "filename": pdf_file.name,
                    "status": "failed",
                    "error": str(e)
                })
        
        logger.info(f"Batch processing complete: {results['processed']} processed, "
                   f"{results['skipped']} skipped, {results['failed']} failed")
        
        return results
    
    def load_single_file(
        self,
        file_path: str,
        education_level: str,
        subject: str,
        language: str = "en",
        skip_existing: bool = True
    ) -> Dict[str, Any]:
        """
        Load a single PDF file
        
        Args:
            file_path: Path to PDF file
            education_level: Education level
            subject: Subject name
            language: Language code
            skip_existing: Whether to skip if file already exists
            
        Returns:
            Dictionary with processing result
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise ValueError(f"File does not exist: {file_path}")
        
        if not file_path.suffix.lower() == '.pdf':
            raise ValueError(f"File is not a PDF: {file_path}")
        
        logger.info(f"Processing: {file_path.name}")
        
        db = self.SessionLocal()
        try:
            # Read file and calculate hash
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            file_hash = DocumentCRUD.calculate_file_hash(file_content)
            
            # Check if document already exists
            if skip_existing:
                existing_doc = DocumentCRUD.get_by_hash(db, file_hash)
                if existing_doc:
                    logger.info(f"Skipping existing file: {file_path.name}")
                    return {
                        "filename": file_path.name,
                        "status": "skipped",
                        "reason": "already_exists",
                        "document_id": str(existing_doc.id)
                    }
            
            # Create models directory if it doesn't exist
            models_dir = Path("models")
            models_dir.mkdir(exist_ok=True)
            
            # Copy file to models directory
            new_filename = f"{uuid.uuid4()}_{file_path.name}"
            new_file_path = models_dir / new_filename
            
            with open(new_file_path, 'wb') as f:
                f.write(file_content)
            
            # Create document record
            document = DocumentCRUD.create(
                db,
                filename=new_filename,
                original_filename=file_path.name,
                file_path=str(new_file_path),
                file_size=len(file_content),
                file_hash=file_hash,
                education_level=education_level,
                subject=subject,
                language=language,
                processing_status="processing"
            )
            
            logger.info(f"Created document record: {document.id}")
            
            # Process PDF
            try:
                # Extract text
                pages = self.pdf_ingestor.extract_text_from_pdf(str(new_file_path))
                
                if not pages:
                    raise ValueError("No text could be extracted from PDF")
                
                # Update document with page count
                document.total_pages = len(pages)
                db.commit()
                
                # Chunk text
                chunk_size = int(os.getenv("CHUNK_SIZE", "1000"))
                chunk_overlap = int(os.getenv("CHUNK_OVERLAP", "200"))
                chunks_data = self.pdf_ingestor.chunk_text(pages, chunk_size, chunk_overlap)
                
                if not chunks_data:
                    raise ValueError("No chunks could be created from PDF")
                
                logger.info(f"Created {len(chunks_data)} chunks")
                
                # Create chunk records
                chunk_objects = []
                for chunk_data in chunks_data:
                    chunk = ChunkCRUD.create(
                        db,
                        document_id=document.id,
                        **chunk_data
                    )
                    chunk_objects.append(chunk)
                
                # Add to vector database
                logger.info("Adding chunks to vector database...")
                vector_ids = self.embedding_retriever.add_chunks_to_vector_db(chunk_objects)
                
                # Update chunks with vector IDs
                for i, chunk in enumerate(chunk_objects):
                    if i < len(vector_ids):
                        ChunkCRUD.update_vector_metadata(
                            db,
                            chunk.id,
                            vector_ids[i],
                            self.embedding_retriever.model_name
                        )
                
                # Update document status
                DocumentCRUD.update_processing_status(
                    db,
                    document.id,
                    "completed",
                    total_chunks=len(chunks_data)
                )
                
                logger.info(f"Successfully processed: {file_path.name}")
                
                return {
                    "filename": file_path.name,
                    "status": "processed",
                    "document_id": str(document.id),
                    "pages": len(pages),
                    "chunks": len(chunks_data)
                }
                
            except Exception as e:
                # Update document status to failed
                DocumentCRUD.update_processing_status(
                    db,
                    document.id,
                    "failed",
                    error=str(e)
                )
                raise
            
        except Exception as e:
            logger.error(f"Error processing {file_path.name}: {e}")
            return {
                "filename": file_path.name,
                "status": "failed",
                "error": str(e)
            }
        finally:
            db.close()
    
    def list_processed_documents(self) -> List[Dict[str, Any]]:
        """List all processed documents"""
        db = self.SessionLocal()
        try:
            documents = DocumentCRUD.get_by_filters(db, limit=1000)
            
            return [
                {
                    "id": str(doc.id),
                    "filename": doc.original_filename,
                    "education_level": doc.education_level,
                    "subject": doc.subject,
                    "language": doc.language,
                    "status": doc.processing_status,
                    "pages": doc.total_pages,
                    "chunks": doc.total_chunks,
                    "created_at": doc.created_at.isoformat() if doc.created_at else None,
                    "processed_at": doc.processed_at.isoformat() if doc.processed_at else None
                }
                for doc in documents
            ]
        finally:
            db.close()
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get processing statistics"""
        db = self.SessionLocal()
        try:
            documents = DocumentCRUD.get_by_filters(db, limit=1000)
            
            stats = {
                "total_documents": len(documents),
                "by_status": {},
                "by_education_level": {},
                "by_subject": {},
                "by_language": {},
                "total_pages": 0,
                "total_chunks": 0
            }
            
            for doc in documents:
                # Count by status
                status = doc.processing_status
                stats["by_status"][status] = stats["by_status"].get(status, 0) + 1
                
                # Count by education level
                level = doc.education_level
                stats["by_education_level"][level] = stats["by_education_level"].get(level, 0) + 1
                
                # Count by subject
                subject = doc.subject
                stats["by_subject"][subject] = stats["by_subject"].get(subject, 0) + 1
                
                # Count by language
                language = doc.language
                stats["by_language"][language] = stats["by_language"].get(language, 0) + 1
                
                # Sum totals
                stats["total_pages"] += doc.total_pages or 0
                stats["total_chunks"] += doc.total_chunks or 0
            
            # Get vector database stats
            vector_stats = self.embedding_retriever.get_collection_stats()
            stats["vector_database"] = vector_stats
            
            return stats
            
        finally:
            db.close()


def main():
    """Main function for command line usage"""
    parser = argparse.ArgumentParser(description="Batch load PDF documents into Elimu Hub")
    
    parser.add_argument("command", choices=["load", "list", "stats"], help="Command to execute")
    parser.add_argument("--directory", "-d", help="Directory containing PDF files")
    parser.add_argument("--file", "-f", help="Single PDF file to process")
    parser.add_argument("--education-level", "-e", 
                       choices=["Primary", "Junior Secondary", "Secondary"],
                       help="Education level")
    parser.add_argument("--subject", "-s", help="Subject name")
    parser.add_argument("--language", "-l", default="en", choices=["en", "sw"],
                       help="Language code (default: en)")
    parser.add_argument("--recursive", "-r", action="store_true",
                       help="Search subdirectories recursively")
    parser.add_argument("--overwrite", action="store_true",
                       help="Process files even if they already exist")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Verbose output")
    
    args = parser.parse_args()
    
    # Set up logging
    if args.verbose:
        logger.remove()
        logger.add(sys.stderr, level="DEBUG")
    
    # Initialize loader
    try:
        loader = PDFBatchLoader()
    except Exception as e:
        logger.error(f"Failed to initialize loader: {e}")
        sys.exit(1)
    
    # Execute command
    if args.command == "load":
        if args.directory:
            if not args.education_level or not args.subject:
                logger.error("Education level and subject are required for loading")
                sys.exit(1)
            
            try:
                results = loader.load_directory(
                    args.directory,
                    args.education_level,
                    args.subject,
                    args.language,
                    args.recursive,
                    not args.overwrite
                )
                
                print(f"\nResults:")
                print(f"Processed: {results['processed']}")
                print(f"Skipped: {results['skipped']}")
                print(f"Failed: {results['failed']}")
                
                if args.verbose:
                    print("\nFile details:")
                    for file_result in results['files']:
                        print(f"  {file_result['filename']}: {file_result['status']}")
                        if 'error' in file_result:
                            print(f"    Error: {file_result['error']}")
                
            except Exception as e:
                logger.error(f"Error loading directory: {e}")
                sys.exit(1)
        
        elif args.file:
            if not args.education_level or not args.subject:
                logger.error("Education level and subject are required for loading")
                sys.exit(1)
            
            try:
                result = loader.load_single_file(
                    args.file,
                    args.education_level,
                    args.subject,
                    args.language,
                    not args.overwrite
                )
                
                print(f"\nResult: {result['status']}")
                if result['status'] == "processed":
                    print(f"Document ID: {result['document_id']}")
                    print(f"Pages: {result['pages']}")
                    print(f"Chunks: {result['chunks']}")
                elif 'error' in result:
                    print(f"Error: {result['error']}")
                
            except Exception as e:
                logger.error(f"Error loading file: {e}")
                sys.exit(1)
        
        else:
            logger.error("Either --directory or --file must be specified for load command")
            sys.exit(1)
    
    elif args.command == "list":
        try:
            documents = loader.list_processed_documents()
            
            if not documents:
                print("No documents found.")
            else:
                print(f"\nFound {len(documents)} documents:")
                print("-" * 80)
                
                for doc in documents:
                    print(f"ID: {doc['id']}")
                    print(f"File: {doc['filename']}")
                    print(f"Level: {doc['education_level']}")
                    print(f"Subject: {doc['subject']}")
                    print(f"Language: {doc['language']}")
                    print(f"Status: {doc['status']}")
                    print(f"Pages: {doc['pages']}")
                    print(f"Chunks: {doc['chunks']}")
                    if doc['processed_at']:
                        print(f"Processed: {doc['processed_at']}")
                    print("-" * 40)
        
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            sys.exit(1)
    
    elif args.command == "stats":
        try:
            stats = loader.get_statistics()
            
            print("\nSystem Statistics:")
            print("=" * 50)
            print(f"Total Documents: {stats['total_documents']}")
            print(f"Total Pages: {stats['total_pages']}")
            print(f"Total Chunks: {stats['total_chunks']}")
            
            print("\nBy Status:")
            for status, count in stats['by_status'].items():
                print(f"  {status}: {count}")
            
            print("\nBy Education Level:")
            for level, count in stats['by_education_level'].items():
                print(f"  {level}: {count}")
            
            print("\nBy Subject:")
            for subject, count in stats['by_subject'].items():
                print(f"  {subject}: {count}")
            
            print("\nBy Language:")
            for language, count in stats['by_language'].items():
                print(f"  {language}: {count}")
            
            if 'vector_database' in stats:
                vector_stats = stats['vector_database']
                print(f"\nVector Database:")
                print(f"  Total Embeddings: {vector_stats.get('total_chunks', 0)}")
                print(f"  Model: {vector_stats.get('model_name', 'Unknown')}")
        
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
