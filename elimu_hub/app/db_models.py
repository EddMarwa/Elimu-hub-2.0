"""
SQLAlchemy database models for Elimu Hub
"""
from datetime import datetime
from enum import Enum
from typing import Optional
import hashlib

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()


class UserRole(str, Enum):
    ADMIN = "admin"
    SUPER_USER = "super_user"
    USER = "user"


class User(Base):
    """User accounts and authentication"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    
    # User profile
    full_name = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False, default=UserRole.USER.value)
    is_active = Column(Boolean, default=True)
    
    # Account management
    last_login = Column(DateTime, nullable=True)
    login_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password: str):
        """Hash and set password"""
        self.password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    def check_password(self, password: str) -> bool:
        """Verify password"""
        return self.password_hash == hashlib.sha256(password.encode()).hexdigest()
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"


class EducationLevel(Base):
    """Dynamic education levels that can be managed by super users"""
    __tablename__ = "education_levels"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    name_swahili = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)  # For ordering in UI
    
    # Status and metadata
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<EducationLevel(id={self.id}, name={self.name})>"


class Document(Base):
    """Document metadata table"""
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    file_hash = Column(String(64), nullable=False, unique=True)  # SHA-256 hash
    
    # Educational metadata - now references dynamic education levels
    education_level_id = Column(Integer, ForeignKey("education_levels.id"), nullable=False)
    subject = Column(String(100), nullable=False)
    language = Column(String(10), default="en")  # ISO language code
    
    # Upload tracking
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Document processing metadata
    total_pages = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    processing_status = Column(String(20), default="pending")  # pending, processing, completed, failed
    processing_error = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    education_level = relationship("EducationLevel", foreign_keys=[education_level_id])
    uploader = relationship("User", foreign_keys=[uploaded_by])
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Document(id={self.id}, filename={self.filename}, subject={self.subject})>"
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Document(id={self.id}, filename={self.filename}, subject={self.subject})>"


class Chunk(Base):
    """Text chunk table with vector embeddings metadata"""
    __tablename__ = "chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    
    # Chunk content and metadata
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)  # Order within document
    page_number = Column(Integer, nullable=True)
    
    # Vector embedding metadata
    vector_id = Column(String(100), nullable=True)  # ID in vector database
    embedding_model = Column(String(100), nullable=True)
    embedding_created_at = Column(DateTime, nullable=True)
    
    # Chunk statistics
    token_count = Column(Integer, nullable=True)
    character_count = Column(Integer, nullable=False)
    
    # Processing metadata
    extraction_method = Column(String(20), default="text")  # text, ocr
    confidence_score = Column(Float, nullable=True)  # OCR confidence if applicable
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="chunks")
    
    def __repr__(self):
        return f"<Chunk(id={self.id}, document_id={self.document_id}, page={self.page_number})>"


class Subject(Base):
    """Subject reference table"""
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    name_swahili = Column(String(100), nullable=True)  # Swahili translation
    description = Column(Text, nullable=True)
    education_levels = Column(JSON, nullable=False)  # List of applicable education levels
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Subject(id={self.id}, name={self.name})>"


class QueryLog(Base):
    """Log of user queries for analytics and improvement"""
    __tablename__ = "query_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Query details
    query_text = Column(Text, nullable=False)
    education_level_filter = Column(String(50), nullable=True)
    subject_filter = Column(String(100), nullable=True)
    language_filter = Column(String(10), nullable=True)
    
    # Response details
    response_text = Column(Text, nullable=True)
    chunks_retrieved = Column(Integer, default=0)
    processing_time_ms = Column(Integer, nullable=True)
    
    # User feedback (if implemented)
    user_rating = Column(Integer, nullable=True)  # 1-5 stars
    user_feedback = Column(Text, nullable=True)
    
    # Session tracking
    session_id = Column(String(100), nullable=True)
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<QueryLog(id={self.id}, query={self.query_text[:50]}...)>"


class SystemMetrics(Base):
    """System performance and usage metrics"""
    __tablename__ = "system_metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Metric details
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    metric_unit = Column(String(20), nullable=True)
    
    # Context
    context = Column(JSON, nullable=True)  # Additional metric context
    
    # Timestamps
    recorded_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<SystemMetrics(name={self.metric_name}, value={self.metric_value})>"
