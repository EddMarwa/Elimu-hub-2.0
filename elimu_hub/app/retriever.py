"""
Text embedding and vector database retrieval for Elimu Hub
"""
import os
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import json

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import torch
from loguru import logger

from .db_models import Document, Chunk
from .crud import ChunkCRUD


class EmbeddingRetriever:
    """Handles text embedding and vector database operations"""
    
    def __init__(
        self,
        model_name: str = "BAAI/bge-small-en-v1.5",
        vector_db_path: str = "./embeddings/chroma_db",
        device: str = "cpu",
        collection_name: str = "elimu_hub_documents"
    ):
        """
        Initialize the embedding retriever
        
        Args:
            model_name: HuggingFace model name for embeddings
            vector_db_path: Path to ChromaDB storage
            device: Device for model inference (cpu/cuda)
            collection_name: Name of the vector collection
        """
        self.model_name = model_name
        self.vector_db_path = Path(vector_db_path)
        self.device = device
        self.collection_name = collection_name
        
        # Initialize embedding model
        logger.info(f"Loading embedding model: {model_name}")
        self.embedding_model = SentenceTransformer(model_name, device=device)
        self.embedding_dimension = self.embedding_model.get_sentence_embedding_dimension()
        logger.info(f"Embedding dimension: {self.embedding_dimension}")
        
        # Initialize ChromaDB
        self._init_vector_db()
    
    def _init_vector_db(self):
        """Initialize ChromaDB client and collection"""
        try:
            # Create directory if it doesn't exist
            self.vector_db_path.mkdir(parents=True, exist_ok=True)
            
            # Initialize ChromaDB client
            self.chroma_client = chromadb.PersistentClient(
                path=str(self.vector_db_path),
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Get or create collection
            try:
                self.collection = self.chroma_client.get_collection(
                    name=self.collection_name
                )
                logger.info(f"Loaded existing collection: {self.collection_name}")
            except Exception:
                # Collection doesn't exist, create it
                self.collection = self.chroma_client.create_collection(
                    name=self.collection_name,
                    metadata={
                        "description": "Elimu Hub educational documents",
                        "model": self.model_name,
                        "dimension": self.embedding_dimension
                    }
                )
                logger.info(f"Created new collection: {self.collection_name}")
            
            # Log collection info
            count = self.collection.count()
            logger.info(f"Collection contains {count} embeddings")
            
        except Exception as e:
            logger.error(f"Failed to initialize vector database: {e}")
            raise
    
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Create embeddings for a list of texts
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        try:
            logger.debug(f"Embedding {len(texts)} texts")
            embeddings = self.embedding_model.encode(
                texts,
                convert_to_numpy=True,
                show_progress_bar=len(texts) > 10
            )
            
            # Convert to list format for ChromaDB
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"Error creating embeddings: {e}")
            raise
    
    def add_chunks_to_vector_db(
        self,
        chunks: List[Chunk],
        batch_size: int = 100
    ) -> List[str]:
        """
        Add document chunks to vector database
        
        Args:
            chunks: List of Chunk objects to add
            batch_size: Number of chunks to process in each batch
            
        Returns:
            List of vector IDs assigned to chunks
        """
        if not chunks:
            return []
        
        logger.info(f"Adding {len(chunks)} chunks to vector database")
        vector_ids = []
        
        try:
            # Process in batches to avoid memory issues
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i:i + batch_size]
                
                # Prepare batch data
                texts = [chunk.content for chunk in batch]
                embeddings = self.embed_texts(texts)
                
                # Create unique IDs for this batch
                batch_ids = [str(chunk.id) for chunk in batch]
                vector_ids.extend(batch_ids)
                
                # Prepare metadata for each chunk
                metadatas = []
                for chunk in batch:
                    metadata = {
                        "chunk_id": str(chunk.id),
                        "document_id": str(chunk.document_id),
                        "page_number": chunk.page_number or 0,
                        "chunk_index": chunk.chunk_index,
                        "extraction_method": chunk.extraction_method or "text",
                        "character_count": chunk.character_count,
                        "token_count": chunk.token_count or 0
                    }
                    
                    # Add document metadata if available (try to avoid lazy loading)
                    try:
                        # Check for manually added document info first
                        if hasattr(chunk, '_document_info'):
                            metadata.update(chunk._document_info)
                        elif hasattr(chunk, 'document') and chunk.document:
                            metadata.update({
                                "education_level": chunk.document.education_level,
                                "subject": chunk.document.subject,
                                "language": chunk.document.language,
                                "filename": chunk.document.filename
                            })
                    except Exception:
                        # If lazy loading fails, we'll skip document metadata for now
                        # This can be improved by eager loading or separate queries
                        pass
                    
                    metadatas.append(metadata)
                
                # Add to ChromaDB
                self.collection.add(
                    ids=batch_ids,
                    embeddings=embeddings,
                    documents=texts,
                    metadatas=metadatas
                )
                
                logger.debug(f"Added batch {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1}")
            
            logger.info(f"Successfully added {len(vector_ids)} chunks to vector database")
            return vector_ids
            
        except Exception as e:
            logger.error(f"Error adding chunks to vector database: {e}")
            raise
    
    def search_similar_chunks(
        self,
        query: str,
        n_results: int = 10,
        education_level: Optional[str] = None,
        subject: Optional[str] = None,
        language: Optional[str] = None,
        min_score: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Search for similar chunks using semantic similarity
        
        Args:
            query: Search query text
            n_results: Number of results to return
            education_level: Filter by education level
            subject: Filter by subject
            language: Filter by language
            min_score: Minimum similarity score threshold
            
        Returns:
            List of search results with metadata and scores
        """
        try:
            logger.debug(f"Searching for: '{query[:100]}...' (n_results={n_results})")
            
            # Create query embedding
            query_embedding = self.embed_texts([query])[0]
            
            # Build metadata filter
            where_filter = {}
            if education_level:
                where_filter["education_level"] = {"$eq": education_level}
            if subject:
                where_filter["subject"] = {"$eq": subject}
            if language:
                where_filter["language"] = {"$eq": language}
            
            # If multiple filters, combine with $and
            if len(where_filter) > 1:
                where_filter = {"$and": [
                    {k: v for k, v in [(key, value) for key, value in where_filter.items()]}
                ]}
            elif len(where_filter) == 1:
                # Single filter can be used directly but need to restructure
                key, value = next(iter(where_filter.items()))
                where_filter = {key: value}
            
            # Search in ChromaDB
            search_kwargs = {
                "query_embeddings": [query_embedding],
                "n_results": min(n_results, 100),  # ChromaDB limit
                "include": ["documents", "metadatas", "distances"]
            }
            
            if where_filter:
                search_kwargs["where"] = where_filter
            
            results = self.collection.query(**search_kwargs)
            
            # Process results
            search_results = []
            if results["ids"] and results["ids"][0]:
                for i, chunk_id in enumerate(results["ids"][0]):
                    distance = results["distances"][0][i]
                    similarity_score = 1 - distance  # Convert distance to similarity
                    
                    if similarity_score >= min_score:
                        result = {
                            "chunk_id": chunk_id,
                            "content": results["documents"][0][i],
                            "metadata": results["metadatas"][0][i],
                            "similarity_score": similarity_score,
                            "distance": distance
                        }
                        search_results.append(result)
            
            logger.debug(f"Found {len(search_results)} relevant chunks")
            return search_results
            
        except Exception as e:
            logger.error(f"Error searching vector database: {e}")
            raise
    
    def get_chunk_by_id(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific chunk by its vector ID
        
        Args:
            chunk_id: Vector database ID of the chunk
            
        Returns:
            Chunk data or None if not found
        """
        try:
            results = self.collection.get(
                ids=[chunk_id],
                include=["documents", "metadatas"]
            )
            
            if results["ids"] and results["ids"][0]:
                return {
                    "chunk_id": chunk_id,
                    "content": results["documents"][0],
                    "metadata": results["metadatas"][0]
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving chunk {chunk_id}: {e}")
            return None
    
    def delete_document_chunks(self, document_id: str) -> bool:
        """
        Delete all chunks for a specific document
        
        Args:
            document_id: UUID of the document
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Find all chunks for this document
            results = self.collection.get(
                where={"document_id": document_id},
                include=["metadatas"]
            )
            
            if results["ids"]:
                chunk_ids = results["ids"]
                self.collection.delete(ids=chunk_ids)
                logger.info(f"Deleted {len(chunk_ids)} chunks for document {document_id}")
                return True
            
            logger.info(f"No chunks found for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting chunks for document {document_id}: {e}")
            return False
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the vector collection
        
        Returns:
            Dictionary with collection statistics
        """
        try:
            count = self.collection.count()
            
            # Get sample of metadata to analyze
            sample_size = min(1000, count)
            if count > 0:
                results = self.collection.get(
                    limit=sample_size,
                    include=["metadatas"]
                )
                
                # Analyze metadata
                education_levels = {}
                subjects = {}
                languages = {}
                
                for metadata in results["metadatas"]:
                    # Count education levels
                    level = metadata.get("education_level", "Unknown")
                    education_levels[level] = education_levels.get(level, 0) + 1
                    
                    # Count subjects
                    subject = metadata.get("subject", "Unknown")
                    subjects[subject] = subjects.get(subject, 0) + 1
                    
                    # Count languages
                    language = metadata.get("language", "Unknown")
                    languages[language] = languages.get(language, 0) + 1
                
                stats = {
                    "total_chunks": count,
                    "model_name": self.model_name,
                    "embedding_dimension": self.embedding_dimension,
                    "education_levels": education_levels,
                    "subjects": subjects,
                    "languages": languages,
                    "sample_size": sample_size
                }
            else:
                stats = {
                    "total_chunks": 0,
                    "model_name": self.model_name,
                    "embedding_dimension": self.embedding_dimension,
                    "education_levels": {},
                    "subjects": {},
                    "languages": {},
                    "sample_size": 0
                }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {"error": str(e)}
    
    def reset_collection(self) -> bool:
        """
        Reset the vector collection (delete all data)
        
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.warning("Resetting vector collection - all embeddings will be deleted")
            self.chroma_client.delete_collection(self.collection_name)
            
            # Recreate collection
            self.collection = self.chroma_client.create_collection(
                name=self.collection_name,
                metadata={
                    "description": "Elimu Hub educational documents",
                    "model": self.model_name,
                    "dimension": self.embedding_dimension
                }
            )
            
            logger.info("Vector collection reset successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error resetting collection: {e}")
            return False
