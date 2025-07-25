"""
CRUD operations for Elimu Hub database models
"""
import hashlib
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from .db_models import Document, Chunk, Subject, QueryLog, SystemMetrics, User, EducationLevel


class UserCRUD:
    """CRUD operations for User model"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> User:
        """Create a new user"""
        user = User(**kwargs)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_by_id(db: Session, user_id: UUID) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        """Get user by username"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def authenticate(db: Session, username: str, password: str) -> Optional[User]:
        """Authenticate user with username/password"""
        user = UserCRUD.get_by_username(db, username)
        if user and user.check_password(password) and user.is_active:
            # Update login tracking
            user.last_login = datetime.utcnow()
            user.login_count += 1
            db.commit()
            return user
        return None
    
    @staticmethod
    def update_role(db: Session, user_id: UUID, new_role: str) -> Optional[User]:
        """Update user role"""
        user = UserCRUD.get_by_id(db, user_id)
        if user:
            user.role = new_role
            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def get_all(db: Session, limit: int = 100, offset: int = 0) -> List[User]:
        """Get all users with pagination"""
        return db.query(User).offset(offset).limit(limit).all()


class EducationLevelCRUD:
    """CRUD operations for EducationLevel model"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> EducationLevel:
        """Create a new education level"""
        education_level = EducationLevel(**kwargs)
        db.add(education_level)
        db.commit()
        db.refresh(education_level)
        return education_level
    
    @staticmethod
    def get_by_id(db: Session, level_id: int) -> Optional[EducationLevel]:
        """Get education level by ID"""
        return db.query(EducationLevel).filter(EducationLevel.id == level_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[EducationLevel]:
        """Get education level by name"""
        return db.query(EducationLevel).filter(EducationLevel.name == name).first()
    
    @staticmethod
    def get_all_active(db: Session) -> List[EducationLevel]:
        """Get all active education levels ordered by display_order"""
        return db.query(EducationLevel).filter(
            EducationLevel.is_active == True
        ).order_by(EducationLevel.display_order, EducationLevel.name).all()
    
    @staticmethod
    def get_all(db: Session, include_inactive: bool = False) -> List[EducationLevel]:
        """Get all education levels"""
        query = db.query(EducationLevel)
        if not include_inactive:
            query = query.filter(EducationLevel.is_active == True)
        return query.order_by(EducationLevel.display_order, EducationLevel.name).all()
    
    @staticmethod
    def update(db: Session, level_id: int, **kwargs) -> Optional[EducationLevel]:
        """Update education level"""
        level = EducationLevelCRUD.get_by_id(db, level_id)
        if level:
            for key, value in kwargs.items():
                if hasattr(level, key):
                    setattr(level, key, value)
            level.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(level)
        return level
    
    @staticmethod
    def delete(db: Session, level_id: int) -> bool:
        """Soft delete education level (set inactive)"""
        level = EducationLevelCRUD.get_by_id(db, level_id)
        if level:
            level.is_active = False
            level.updated_at = datetime.utcnow()
            db.commit()
            return True
        return False


class DocumentCRUD:
    """CRUD operations for Document model"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> Document:
        """Create a new document"""
        document = Document(**kwargs)
        db.add(document)
        db.commit()
        db.refresh(document)
        return document
    
    @staticmethod
    def get_by_id(db: Session, document_id: UUID) -> Optional[Document]:
        """Get document by ID"""
        return db.query(Document).filter(Document.id == document_id).first()
    
    @staticmethod
    def get_by_hash(db: Session, file_hash: str) -> Optional[Document]:
        """Get document by file hash"""
        return db.query(Document).filter(Document.file_hash == file_hash).first()
    
    @staticmethod
    def get_by_filters(
        db: Session,
        education_level_id: Optional[int] = None,
        education_level_name: Optional[str] = None,
        subject: Optional[str] = None,
        language: Optional[str] = None,
        processing_status: Optional[str] = None,
        uploaded_by: Optional[UUID] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Document]:
        """Get documents with filters"""
        query = db.query(Document).join(EducationLevel)
        
        if education_level_id:
            query = query.filter(Document.education_level_id == education_level_id)
        if education_level_name:
            query = query.filter(EducationLevel.name == education_level_name)
        if subject:
            query = query.filter(Document.subject == subject)
        if language:
            query = query.filter(Document.language == language)
        if processing_status:
            query = query.filter(Document.processing_status == processing_status)
        if uploaded_by:
            query = query.filter(Document.uploaded_by == uploaded_by)
        
        return query.offset(offset).limit(limit).all()
    
    @staticmethod
    def update_processing_status(
        db: Session,
        document_id: UUID,
        status: str,
        error: Optional[str] = None,
        total_chunks: Optional[int] = None
    ) -> Optional[Document]:
        """Update document processing status"""
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.processing_status = status
            document.updated_at = datetime.utcnow()
            
            if error:
                document.processing_error = error
            if total_chunks is not None:
                document.total_chunks = total_chunks
            if status == "completed":
                document.processed_at = datetime.utcnow()
            
            db.commit()
            db.refresh(document)
        return document
    
    @staticmethod
    def delete(db: Session, document_id: UUID) -> bool:
        """Delete document and all associated chunks"""
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            db.delete(document)
            db.commit()
            return True
        return False
    
    @staticmethod
    def calculate_file_hash(file_content: bytes) -> str:
        """Calculate SHA-256 hash of file content"""
        return hashlib.sha256(file_content).hexdigest()


class ChunkCRUD:
    """CRUD operations for Chunk model"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> Chunk:
        """Create a new chunk"""
        chunk = Chunk(**kwargs)
        db.add(chunk)
        db.commit()
        db.refresh(chunk)
        return chunk
    
    @staticmethod
    def create_batch(db: Session, chunks_data: List[Dict[str, Any]]) -> List[Chunk]:
        """Create multiple chunks in batch"""
        chunks = [Chunk(**chunk_data) for chunk_data in chunks_data]
        db.add_all(chunks)
        db.commit()
        for chunk in chunks:
            db.refresh(chunk)
        return chunks
    
    @staticmethod
    def get_by_document(db: Session, document_id: UUID) -> List[Chunk]:
        """Get all chunks for a document"""
        return db.query(Chunk).filter(
            Chunk.document_id == document_id
        ).order_by(Chunk.chunk_index).all()
    
    @staticmethod
    def get_by_filters(
        db: Session,
        education_level: Optional[str] = None,
        subject: Optional[str] = None,
        language: Optional[str] = None,
        limit: int = 100
    ) -> List[Chunk]:
        """Get chunks with filters via document join"""
        query = db.query(Chunk).join(Document)
        
        if education_level:
            query = query.filter(Document.education_level == education_level)
        if subject:
            query = query.filter(Document.subject == subject)
        if language:
            query = query.filter(Document.language == language)
        
    @staticmethod
    def update_vector_metadata(
        db: Session,
        chunk_id: UUID,
        vector_id: str,
        embedding_model: str
    ) -> Optional[Chunk]:
        """Update chunk with vector database metadata"""
        chunk = db.query(Chunk).filter(Chunk.id == chunk_id).first()
        if chunk:
            chunk.vector_id = vector_id
            chunk.embedding_model = embedding_model
            chunk.embedding_created_at = datetime.utcnow()
            chunk.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(chunk)
        return chunk
    
    @staticmethod
    def update_vector_metadata(
        db: Session,
        chunk_id: UUID,
        vector_id: str,
        embedding_model: str
    ) -> Optional[Chunk]:
        """Update chunk vector embedding metadata"""
        chunk = db.query(Chunk).filter(Chunk.id == chunk_id).first()
        if chunk:
            chunk.vector_id = vector_id
            chunk.embedding_model = embedding_model
            chunk.embedding_created_at = datetime.utcnow()
            chunk.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(chunk)
        return chunk
    
    @staticmethod
    def get_chunks_by_vector_ids(db: Session, vector_ids: List[str]) -> List[Chunk]:
        """Get chunks by their vector database IDs"""
        return db.query(Chunk).filter(Chunk.vector_id.in_(vector_ids)).all()


class SubjectCRUD:
    """CRUD operations for Subject model"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> Subject:
        """Create a new subject"""
        subject = Subject(**kwargs)
        db.add(subject)
        db.commit()
        db.refresh(subject)
        return subject
    
    @staticmethod
    def get_all(db: Session, active_only: bool = True) -> List[Subject]:
        """Get all subjects"""
        query = db.query(Subject)
        if active_only:
            query = query.filter(Subject.is_active == True)
        return query.order_by(Subject.name).all()
    
    @staticmethod
    def get_by_education_level(db: Session, education_level: str) -> List[Subject]:
        """Get subjects for specific education level"""
        return db.query(Subject).filter(
            Subject.education_levels.contains([education_level]),
            Subject.is_active == True
        ).order_by(Subject.name).all()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Subject]:
        """Get subject by name"""
        return db.query(Subject).filter(Subject.name == name).first()


class QueryLogCRUD:
    """CRUD operations for QueryLog model"""
    
    @staticmethod
    def create(db: Session, **kwargs) -> QueryLog:
        """Create a new query log entry"""
        query_log = QueryLog(**kwargs)
        db.add(query_log)
        db.commit()
        db.refresh(query_log)
        return query_log
    
    @staticmethod
    def get_recent_queries(
        db: Session,
        limit: int = 100,
        hours: int = 24
    ) -> List[QueryLog]:
        """Get recent queries within specified hours"""
        since = datetime.utcnow() - datetime.timedelta(hours=hours)
        return db.query(QueryLog).filter(
            QueryLog.created_at >= since
        ).order_by(QueryLog.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_query_stats(db: Session, days: int = 7) -> Dict[str, Any]:
        """Get query statistics for the last N days"""
        since = datetime.utcnow() - datetime.timedelta(days=days)
        
        total_queries = db.query(func.count(QueryLog.id)).filter(
            QueryLog.created_at >= since
        ).scalar()
        
        avg_processing_time = db.query(func.avg(QueryLog.processing_time_ms)).filter(
            QueryLog.created_at >= since,
            QueryLog.processing_time_ms.isnot(None)
        ).scalar()
        
        popular_subjects = db.query(
            QueryLog.subject_filter,
            func.count(QueryLog.id).label('count')
        ).filter(
            QueryLog.created_at >= since,
            QueryLog.subject_filter.isnot(None)
        ).group_by(QueryLog.subject_filter).order_by(
            func.count(QueryLog.id).desc()
        ).limit(10).all()
        
        return {
            "total_queries": total_queries or 0,
            "avg_processing_time_ms": float(avg_processing_time) if avg_processing_time else 0,
            "popular_subjects": [{"subject": s[0], "count": s[1]} for s in popular_subjects]
        }


class SystemMetricsCRUD:
    """CRUD operations for SystemMetrics model"""
    
    @staticmethod
    def record_metric(
        db: Session,
        metric_name: str,
        metric_value: float,
        metric_unit: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> SystemMetrics:
        """Record a system metric"""
        metric = SystemMetrics(
            metric_name=metric_name,
            metric_value=metric_value,
            metric_unit=metric_unit,
            context=context
        )
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric
    
    @staticmethod
    def get_metrics(
        db: Session,
        metric_name: str,
        hours: int = 24,
        limit: int = 1000
    ) -> List[SystemMetrics]:
        """Get metrics for a specific metric name"""
        since = datetime.utcnow() - datetime.timedelta(hours=hours)
        return db.query(SystemMetrics).filter(
            SystemMetrics.metric_name == metric_name,
            SystemMetrics.recorded_at >= since
        ).order_by(SystemMetrics.recorded_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_latest_metrics(db: Session, limit: int = 50) -> List[SystemMetrics]:
        """Get latest system metrics"""
        return db.query(SystemMetrics).order_by(
            SystemMetrics.recorded_at.desc()
        ).limit(limit).all()
