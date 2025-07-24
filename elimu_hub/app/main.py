"""
FastAPI main application for Elimu Hub
"""
import os
import time
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from loguru import logger

# Local imports
from .db_models import Base, Document, Chunk, Subject, QueryLog, User, EducationLevel, UserRole
from .crud import DocumentCRUD, ChunkCRUD, SubjectCRUD, QueryLogCRUD, SystemMetricsCRUD, UserCRUD, EducationLevelCRUD
from .pdf_ingestor import PDFIngestor
from .retriever import EmbeddingRetriever
from .rag_runner import RAGRunner
from . import auth
from .auth import create_access_token, get_current_user, require_super_user, require_admin

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Elimu Hub API",
    description="Offline-first AI assistant for Kenyan educational content using RAG architecture",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/elimu_hub")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize components (will be set up in startup event)
pdf_ingestor = None
embedding_retriever = None
rag_runner = None

# Pydantic models for API
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    role: str

class UserRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: str = UserRole.USER.value

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

class EducationLevelRequest(BaseModel):
    name: str
    name_swahili: Optional[str] = None
    description: Optional[str] = None
    display_order: int = 0

class EducationLevelResponse(BaseModel):
    id: int
    name: str
    name_swahili: Optional[str]
    description: Optional[str]
    display_order: int
    is_active: bool
    created_at: datetime

class QueryRequest(BaseModel):
    query: str = Field(..., description="The question to ask")
    education_level: Optional[str] = Field(None, description="Filter by education level")
    subject: Optional[str] = Field(None, description="Filter by subject")
    language: Optional[str] = Field("en", description="Response language (en/sw)")
    include_citations: bool = Field(True, description="Include source citations")

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    query: str
    filters: Dict[str, Any]
    processing_time_ms: int
    chunks_used: int
    confidence: str
    average_similarity: Optional[float] = None

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    status: str
    message: str

class HealthResponse(BaseModel):
    status: str
    components: Dict[str, bool]
    timestamp: datetime
    version: str

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Set up auth module references to avoid circular imports
auth.get_db = get_db
auth.UserCRUD = UserCRUD  
auth.User = User
auth.UserRole = UserRole

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    global pdf_ingestor, embedding_retriever, rag_runner
    
    logger.info("Starting Elimu Hub API...")
    
    try:
        # Initialize PDF ingestor
        tesseract_cmd = os.getenv("TESSERACT_CMD")
        ocr_languages = os.getenv("OCR_LANGUAGES", "eng+swa")
        pdf_ingestor = PDFIngestor(tesseract_cmd=tesseract_cmd, ocr_languages=ocr_languages)
        
        # Initialize embedding retriever
        embedding_model = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
        vector_db_path = os.getenv("VECTOR_DB_PATH", "./embeddings/chroma_db")
        embedding_device = os.getenv("EMBEDDING_DEVICE", "cpu")
        
        embedding_retriever = EmbeddingRetriever(
            model_name=embedding_model,
            vector_db_path=vector_db_path,
            device=embedding_device
        )
        
        # Initialize RAG runner
        ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        ollama_model = os.getenv("OLLAMA_MODEL", "mistral:7b-instruct")
        
        rag_runner = RAGRunner(
            retriever=embedding_retriever,
            ollama_base_url=ollama_base_url,
            model_name=ollama_model
        )
        
        # Initialize default subjects and education levels
        await _initialize_default_subjects()
        await _initialize_default_education_levels()
        await _initialize_default_admin_user()
        
        logger.info("Elimu Hub API started successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize Elimu Hub API: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Elimu Hub API...")

# Main query endpoint
@app.post("/query", response_model=QueryResponse, summary="Ask a question")
async def query_documents(
    request: QueryRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Ask a question and get an AI-generated answer based on uploaded documents
    """
    start_time = time.time()
    
    try:
        # Generate answer using RAG
        result = rag_runner.generate_answer(
            query=request.query,
            education_level=request.education_level,
            subject=request.subject,
            language=request.language,
            include_citations=request.include_citations
        )
        
        # Log query in background
        background_tasks.add_task(
            _log_query,
            db,
            request,
            result,
            int((time.time() - start_time) * 1000)
        )
        
        return QueryResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

# Document upload endpoint
@app.post("/upload", response_model=DocumentUploadResponse, summary="Upload a document")
async def upload_document(
    file: UploadFile = File(...),
    education_level: str = Form(...),
    subject: str = Form(...),
    language: str = Form("en"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a PDF document for processing and indexing
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Validate education level exists
        education_level_obj = EducationLevelCRUD.get_by_name(db, education_level)
        if not education_level_obj or not education_level_obj.is_active:
            raise HTTPException(status_code=400, detail="Invalid or inactive education level")
        
        # Check file size
        max_size_mb = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
        file_content = await file.read()
        if len(file_content) > max_size_mb * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {max_size_mb}MB")
        
        # Calculate file hash
        file_hash = DocumentCRUD.calculate_file_hash(file_content)
        
        # Check if document already exists
        existing_doc = DocumentCRUD.get_by_hash(db, file_hash)
        if existing_doc:
            return DocumentUploadResponse(
                document_id=str(existing_doc.id),
                filename=existing_doc.filename,
                status="exists",
                message="Document already exists in the system"
            )
        
        # Save file
        models_dir = Path("models")
        models_dir.mkdir(exist_ok=True)
        
        file_path = models_dir / f"{uuid.uuid4()}_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Create document record with education level ID and uploader
        document = DocumentCRUD.create(
            db,
            filename=file_path.name,
            original_filename=file.filename,
            file_path=str(file_path),
            file_size=len(file_content),
            file_hash=file_hash,
            education_level_id=education_level_obj.id,
            subject=subject,
            language=language,
            uploaded_by=current_user.id,
            processing_status="pending"
        )
        
        # Process document in background
        if background_tasks:
            background_tasks.add_task(
                _process_document_background,
                str(document.id),
                str(file_path)
            )
        
        return DocumentUploadResponse(
            document_id=str(document.id),
            filename=file.filename,
            status="uploaded",
            message="Document uploaded successfully and is being processed"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

# Get document status
@app.get("/documents/{document_id}", summary="Get document status")
async def get_document_status(document_id: str, db: Session = Depends(get_db)):
    """Get the processing status and details of a document"""
    try:
        document = DocumentCRUD.get_by_id(db, uuid.UUID(document_id))
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "document_id": str(document.id),
            "filename": document.original_filename,
            "education_level": document.education_level,
            "subject": document.subject,
            "language": document.language,
            "processing_status": document.processing_status,
            "total_pages": document.total_pages,
            "total_chunks": document.total_chunks,
            "created_at": document.created_at,
            "processed_at": document.processed_at,
            "processing_error": document.processing_error
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID")
    except Exception as e:
        logger.error(f"Error getting document status: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting document status: {str(e)}")

# List documents
@app.get("/documents", summary="List documents")
async def list_documents(
    education_level: Optional[str] = None,
    subject: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """List documents with optional filters"""
    try:
        documents = DocumentCRUD.get_by_filters(
            db,
            education_level=education_level,
            subject=subject,
            processing_status=status,
            limit=limit,
            offset=offset
        )
        
        return [
            {
                "document_id": str(doc.id),
                "filename": doc.original_filename,
                "education_level": doc.education_level,
                "subject": doc.subject,
                "language": doc.language,
                "processing_status": doc.processing_status,
                "total_chunks": doc.total_chunks,
                "created_at": doc.created_at
            }
            for doc in documents
        ]
        
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")

# Delete document
@app.delete("/documents/{document_id}", summary="Delete document")
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document and all its associated data"""
    try:
        # Get document first
        document = DocumentCRUD.get_by_id(db, uuid.UUID(document_id))
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete from vector database
        embedding_retriever.delete_document_chunks(document_id)
        
        # Delete file
        try:
            if Path(document.file_path).exists():
                Path(document.file_path).unlink()
        except Exception as e:
            logger.warning(f"Could not delete file {document.file_path}: {e}")
        
        # Delete from database (cascades to chunks)
        DocumentCRUD.delete(db, uuid.UUID(document_id))
        
        return {"message": "Document deleted successfully"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document ID")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

# Get subjects
@app.get("/subjects", summary="List available subjects")
async def get_subjects(education_level: Optional[str] = None, db: Session = Depends(get_db)):
    """Get list of available subjects, optionally filtered by education level"""
    try:
        if education_level:
            subjects = SubjectCRUD.get_by_education_level(db, education_level)
        else:
            subjects = SubjectCRUD.get_all(db)
        
        return [
            {
                "id": subject.id,
                "name": subject.name,
                "name_swahili": subject.name_swahili,
                "education_levels": subject.education_levels,
                "description": subject.description
            }
            for subject in subjects
        ]
        
    except Exception as e:
        logger.error(f"Error getting subjects: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting subjects: {str(e)}")

# Health check endpoint
@app.get("/health", response_model=HealthResponse, summary="Health check")
async def health_check():
    """Check the health status of the API and its components"""
    try:
        # Check RAG components
        health_status = rag_runner.health_check()
        
        # Check vector database stats
        vector_stats = embedding_retriever.get_collection_stats()
        health_status["vector_db_stats"] = vector_stats
        
        # Determine overall status
        critical_checks = ["ollama_connection", "model_available", "vector_db_accessible"]
        is_healthy = all(health_status.get(check, False) for check in critical_checks)
        
        return HealthResponse(
            status="healthy" if is_healthy else "degraded",
            components=health_status,
            timestamp=datetime.utcnow(),
            version="1.0.0"
        )
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return HealthResponse(
            status="unhealthy",
            components={"error": str(e)},
            timestamp=datetime.utcnow(),
            version="1.0.0"
        )

# Statistics endpoint
@app.get("/stats", summary="Get system statistics")
async def get_statistics(db: Session = Depends(get_db)):
    """Get system usage statistics"""
    try:
        # Get query statistics
        query_stats = QueryLogCRUD.get_query_stats(db, days=7)
        
        # Get vector database statistics
        vector_stats = embedding_retriever.get_collection_stats()
        
        # Get document statistics
        documents = DocumentCRUD.get_by_filters(db, limit=1000)
        doc_stats = {
            "total_documents": len(documents),
            "by_status": {},
            "by_education_level": {},
            "by_subject": {}
        }
        
        for doc in documents:
            # Count by status
            status = doc.processing_status
            doc_stats["by_status"][status] = doc_stats["by_status"].get(status, 0) + 1
            
            # Count by education level
            level = doc.education_level
            doc_stats["by_education_level"][level] = doc_stats["by_education_level"].get(level, 0) + 1
            
            # Count by subject
            subject = doc.subject
            doc_stats["by_subject"][subject] = doc_stats["by_subject"].get(subject, 0) + 1
        
        return {
            "query_statistics": query_stats,
            "document_statistics": doc_stats,
            "vector_database": vector_stats,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")

# Helper functions
async def _log_query(db: Session, request: QueryRequest, result: Dict[str, Any], processing_time: int):
    """Log query for analytics"""
    try:
        QueryLogCRUD.create(
            db,
            query_text=request.query,
            education_level_filter=request.education_level,
            subject_filter=request.subject,
            language_filter=request.language,
            response_text=result.get("answer", ""),
            chunks_retrieved=result.get("chunks_used", 0),
            processing_time_ms=processing_time
        )
    except Exception as e:
        logger.error(f"Error logging query: {e}")

async def _process_document_background(document_id: str, file_path: str):
    """Process document in background"""
    db = SessionLocal()
    try:
        # Update status to processing
        DocumentCRUD.update_processing_status(db, uuid.UUID(document_id), "processing")
        
        # Extract text from PDF
        pages = pdf_ingestor.extract_text_from_pdf(file_path)
        
        # Chunk text
        chunk_size = int(os.getenv("CHUNK_SIZE", "1000"))
        chunk_overlap = int(os.getenv("CHUNK_OVERLAP", "200"))
        chunks_data = pdf_ingestor.chunk_text(pages, chunk_size, chunk_overlap)
        
        # Create chunk records in database
        chunk_objects = []
        for chunk_data in chunks_data:
            chunk = ChunkCRUD.create(
                db,
                document_id=uuid.UUID(document_id),
                **chunk_data
            )
            chunk_objects.append(chunk)
        
        # Add chunks to vector database
        vector_ids = embedding_retriever.add_chunks_to_vector_db(chunk_objects)
        
        # Update chunk records with vector IDs
        for i, chunk in enumerate(chunk_objects):
            if i < len(vector_ids):
                ChunkCRUD.update_vector_metadata(
                    db,
                    chunk.id,
                    vector_ids[i],
                    embedding_retriever.model_name
                )
        
        # Update document status
        DocumentCRUD.update_processing_status(
            db,
            uuid.UUID(document_id),
            "completed",
            total_chunks=len(chunks_data)
        )
        
        logger.info(f"Successfully processed document {document_id} with {len(chunks_data)} chunks")
        
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {e}")
        DocumentCRUD.update_processing_status(
            db,
            uuid.UUID(document_id),
            "failed",
            error=str(e)
        )
    finally:
        db.close()

async def _initialize_default_subjects():
    """Initialize default subjects if they don't exist"""
    db = SessionLocal()
    try:
        # Default subjects for Kenyan curriculum
        default_subjects = [
            {
                "name": "Mathematics",
                "name_swahili": "Hisabati",
                "education_levels": ["Primary", "Junior Secondary", "Secondary"],
                "description": "Mathematics and numerical skills"
            },
            {
                "name": "English",
                "name_swahili": "Kiingereza",
                "education_levels": ["Primary", "Junior Secondary", "Secondary"],
                "description": "English language and literature"
            },
            {
                "name": "Kiswahili",
                "name_swahili": "Kiswahili",
                "education_levels": ["Primary", "Junior Secondary", "Secondary"],
                "description": "Kiswahili language and literature"
            },
            {
                "name": "Science",
                "name_swahili": "Sayansi",
                "education_levels": ["Primary", "Junior Secondary"],
                "description": "General science and scientific inquiry"
            },
            {
                "name": "Social Studies",
                "name_swahili": "Utafiti wa Kijamii",
                "education_levels": ["Primary"],
                "description": "Social studies and citizenship"
            },
            {
                "name": "Biology",
                "name_swahili": "Biolojia",
                "education_levels": ["Secondary"],
                "description": "Biological sciences"
            },
            {
                "name": "Chemistry",
                "name_swahili": "Kemia",
                "education_levels": ["Secondary"],
                "description": "Chemical sciences"
            },
            {
                "name": "Physics",
                "name_swahili": "Fizikia",
                "education_levels": ["Secondary"],
                "description": "Physical sciences"
            },
            {
                "name": "Geography",
                "name_swahili": "Jiografia",
                "education_levels": ["Junior Secondary", "Secondary"],
                "description": "Geography and environmental studies"
            },
            {
                "name": "History",
                "name_swahili": "Historia",
                "education_levels": ["Junior Secondary", "Secondary"],
                "description": "History and government"
            },
            {
                "name": "Religious Education",
                "name_swahili": "Elimu ya Kidini",
                "education_levels": ["Primary", "Junior Secondary", "Secondary"],
                "description": "Christian and Islamic religious education"
            }
        ]
        
        for subject_data in default_subjects:
            existing_subject = SubjectCRUD.get_by_name(db, subject_data["name"])
            if not existing_subject:
                SubjectCRUD.create(db, **subject_data)
        
        logger.info("Initialized default subjects")
        
    except Exception as e:
        logger.error(f"Error initializing subjects: {e}")
    finally:
        db.close()


async def _initialize_default_education_levels():
    """Initialize default education levels"""
    db = SessionLocal()
    try:
        default_levels = [
            {
                "name": "Primary",
                "name_swahili": "Msingi",
                "description": "Primary education levels (Grades 1-6)",
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
            }
        ]
        
        for level_data in default_levels:
            existing_level = EducationLevelCRUD.get_by_name(db, level_data["name"])
            if not existing_level:
                EducationLevelCRUD.create(db, **level_data)
        
        logger.info("Initialized default education levels")
        
    except Exception as e:
        logger.error(f"Error initializing education levels: {e}")
    finally:
        db.close()


async def _initialize_default_admin_user():
    """Initialize default admin user"""
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin_user = UserCRUD.get_by_username(db, "admin")
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@elimuhub.co.ke",
                full_name="System Administrator",
                role=UserRole.ADMIN.value
            )
            admin_user.set_password("admin123")  # Change this in production!
            
            UserCRUD.create(
                db,
                username=admin_user.username,
                email=admin_user.email,
                password_hash=admin_user.password_hash,
                full_name=admin_user.full_name,
                role=admin_user.role
            )
            
            logger.warning("Created default admin user - CHANGE PASSWORD IN PRODUCTION!")
        
        logger.info("Admin user initialization complete")
        
    except Exception as e:
        logger.error(f"Error initializing admin user: {e}")
    finally:
        db.close()


# Authentication Endpoints
@app.post("/auth/login", response_model=LoginResponse, summary="User login")
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate user and return access token"""
    user = UserCRUD.authenticate(db, request.username, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    access_token = create_access_token(
        user_id=str(user.id),
        username=user.username,
        role=user.role
    )
    
    return LoginResponse(
        access_token=access_token,
        user_id=str(user.id),
        username=user.username,
        role=user.role
    )


@app.post("/auth/register", response_model=UserResponse, summary="Register new user")
async def register_user(
    request: UserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Register a new user (Admin only)"""
    # Check if username or email already exists
    if UserCRUD.get_by_username(db, request.username):
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )
    
    if UserCRUD.get_by_email(db, request.email):
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )
    
    # Create new user
    new_user = User(
        username=request.username,
        email=request.email,
        full_name=request.full_name,
        role=request.role
    )
    new_user.set_password(request.password)
    
    user = UserCRUD.create(
        db,
        username=new_user.username,
        email=new_user.email,
        password_hash=new_user.password_hash,
        full_name=new_user.full_name,
        role=new_user.role
    )
    
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )


# Education Level Management Endpoints
@app.get("/education-levels", response_model=List[EducationLevelResponse], summary="Get all education levels")
async def get_education_levels(
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """Get all education levels"""
    levels = EducationLevelCRUD.get_all(db, include_inactive=include_inactive)
    return [
        EducationLevelResponse(
            id=level.id,
            name=level.name,
            name_swahili=level.name_swahili,
            description=level.description,
            display_order=level.display_order,
            is_active=level.is_active,
            created_at=level.created_at
        )
        for level in levels
    ]


@app.post("/education-levels", response_model=EducationLevelResponse, summary="Create education level")
async def create_education_level(
    request: EducationLevelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_user)
):
    """Create a new education level (Super User only)"""
    # Check if name already exists
    if EducationLevelCRUD.get_by_name(db, request.name):
        raise HTTPException(
            status_code=400,
            detail="Education level with this name already exists"
        )
    
    level = EducationLevelCRUD.create(
        db,
        name=request.name,
        name_swahili=request.name_swahili,
        description=request.description,
        display_order=request.display_order,
        created_by=current_user.id
    )
    
    return EducationLevelResponse(
        id=level.id,
        name=level.name,
        name_swahili=level.name_swahili,
        description=level.description,
        display_order=level.display_order,
        is_active=level.is_active,
        created_at=level.created_at
    )


@app.put("/education-levels/{level_id}", response_model=EducationLevelResponse, summary="Update education level")
async def update_education_level(
    level_id: int,
    request: EducationLevelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_user)
):
    """Update an education level (Super User only)"""
    level = EducationLevelCRUD.get_by_id(db, level_id)
    if not level:
        raise HTTPException(status_code=404, detail="Education level not found")
    
    # Check if new name conflicts with existing level
    existing_level = EducationLevelCRUD.get_by_name(db, request.name)
    if existing_level and existing_level.id != level_id:
        raise HTTPException(
            status_code=400,
            detail="Education level with this name already exists"
        )
    
    updated_level = EducationLevelCRUD.update(
        db,
        level_id,
        name=request.name,
        name_swahili=request.name_swahili,
        description=request.description,
        display_order=request.display_order
    )
    
    return EducationLevelResponse(
        id=updated_level.id,
        name=updated_level.name,
        name_swahili=updated_level.name_swahili,
        description=updated_level.description,
        display_order=updated_level.display_order,
        is_active=updated_level.is_active,
        created_at=updated_level.created_at
    )


@app.delete("/education-levels/{level_id}", summary="Delete education level")
async def delete_education_level(
    level_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_super_user)
):
    """Soft delete an education level (Super User only)"""
    level = EducationLevelCRUD.get_by_id(db, level_id)
    if not level:
        raise HTTPException(status_code=404, detail="Education level not found")
    
    # Check if any documents are using this level
    documents_using_level = DocumentCRUD.get_by_filters(
        db, education_level_id=level_id, limit=1
    )
    
    if documents_using_level:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete education level that is used by documents"
        )
    
    success = EducationLevelCRUD.delete(db, level_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete education level")
    
    return {"message": "Education level deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
