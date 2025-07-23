"""
RAG (Retrieval-Augmented Generation) runner for Elimu Hub
Interfaces with Ollama for local LLM inference
"""
import json
import time
from typing import List, Dict, Any, Optional, Tuple
import subprocess
import requests
from loguru import logger

from .retriever import EmbeddingRetriever


class RAGRunner:
    """Handles RAG pipeline: retrieval + generation using Ollama"""
    
    def __init__(
        self,
        retriever: EmbeddingRetriever,
        ollama_base_url: str = "http://localhost:11434",
        model_name: str = "mistral:7b-instruct",
        max_context_chunks: int = 5,
        max_tokens: int = 2048
    ):
        """
        Initialize RAG runner
        
        Args:
            retriever: EmbeddingRetriever instance for vector search
            ollama_base_url: Base URL for Ollama API
            model_name: Name of the Ollama model to use
            max_context_chunks: Maximum number of chunks to include in context
            max_tokens: Maximum tokens for LLM response
        """
        self.retriever = retriever
        self.ollama_base_url = ollama_base_url.rstrip('/')
        self.model_name = model_name
        self.max_context_chunks = max_context_chunks
        self.max_tokens = max_tokens
        
        # Test Ollama connection
        self._test_ollama_connection()
    
    def _test_ollama_connection(self) -> bool:
        """Test connection to Ollama service"""
        try:
            response = requests.get(f"{self.ollama_base_url}/api/tags", timeout=10)
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = [model["name"] for model in models]
                
                if self.model_name in model_names:
                    logger.info(f"Ollama connection successful, model '{self.model_name}' available")
                    return True
                else:
                    logger.warning(f"Model '{self.model_name}' not found. Available models: {model_names}")
                    logger.info(f"Attempting to pull model '{self.model_name}'...")
                    return self._pull_model()
            else:
                logger.error(f"Ollama API returned status {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Cannot connect to Ollama at {self.ollama_base_url}: {e}")
            logger.info("Make sure Ollama is running: ollama serve")
            return False
    
    def _pull_model(self) -> bool:
        """Pull the specified model if not available"""
        try:
            logger.info(f"Pulling model {self.model_name}...")
            response = requests.post(
                f"{self.ollama_base_url}/api/pull",
                json={"name": self.model_name},
                stream=True,
                timeout=300
            )
            
            if response.status_code == 200:
                # Stream the pull progress
                for line in response.iter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if "status" in data:
                                logger.info(f"Pull status: {data['status']}")
                        except json.JSONDecodeError:
                            continue
                
                logger.info(f"Model {self.model_name} pulled successfully")
                return True
            else:
                logger.error(f"Failed to pull model: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error pulling model: {e}")
            return False
    
    def generate_answer(
        self,
        query: str,
        education_level: Optional[str] = None,
        subject: Optional[str] = None,
        language: Optional[str] = None,
        include_citations: bool = True
    ) -> Dict[str, Any]:
        """
        Generate answer using RAG pipeline
        
        Args:
            query: User question
            education_level: Filter by education level
            subject: Filter by subject
            language: Filter by language (en/sw)
            include_citations: Whether to include source citations
            
        Returns:
            Dictionary with answer, sources, and metadata
        """
        start_time = time.time()
        
        try:
            logger.info(f"Processing query: '{query[:100]}...'")
            
            # Step 1: Retrieve relevant chunks
            relevant_chunks = self.retriever.search_similar_chunks(
                query=query,
                n_results=self.max_context_chunks * 2,  # Get more to filter
                education_level=education_level,
                subject=subject,
                language=language,
                min_score=0.3  # Minimum similarity threshold
            )
            
            if not relevant_chunks:
                return {
                    "answer": "I couldn't find relevant information to answer your question. Please try rephrasing or check if documents for your topic have been uploaded.",
                    "sources": [],
                    "query": query,
                    "processing_time_ms": int((time.time() - start_time) * 1000),
                    "chunks_used": 0,
                    "confidence": "low"
                }
            
            # Step 2: Select best chunks and build context
            selected_chunks = relevant_chunks[:self.max_context_chunks]
            context = self._build_context(selected_chunks)
            
            # Step 3: Build prompt
            prompt = self._build_prompt(query, context, language)
            
            # Step 4: Generate answer using Ollama
            answer = self._call_ollama(prompt)
            
            # Step 5: Prepare sources/citations
            sources = []
            if include_citations:
                sources = self._prepare_citations(selected_chunks)
            
            # Calculate processing time
            processing_time = int((time.time() - start_time) * 1000)
            
            # Determine confidence based on chunk scores
            avg_score = sum(chunk["similarity_score"] for chunk in selected_chunks) / len(selected_chunks)
            confidence = "high" if avg_score > 0.7 else "medium" if avg_score > 0.5 else "low"
            
            result = {
                "answer": answer,
                "sources": sources,
                "query": query,
                "filters": {
                    "education_level": education_level,
                    "subject": subject,
                    "language": language
                },
                "processing_time_ms": processing_time,
                "chunks_used": len(selected_chunks),
                "confidence": confidence,
                "average_similarity": round(avg_score, 3)
            }
            
            logger.info(f"Generated answer in {processing_time}ms using {len(selected_chunks)} chunks")
            return result
            
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return {
                "answer": f"Sorry, I encountered an error while processing your question: {str(e)}",
                "sources": [],
                "query": query,
                "processing_time_ms": int((time.time() - start_time) * 1000),
                "chunks_used": 0,
                "confidence": "error",
                "error": str(e)
            }
    
    def _build_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Build context string from relevant chunks"""
        context_parts = []
        
        for i, chunk in enumerate(chunks):
            metadata = chunk["metadata"]
            content = chunk["content"]
            
            # Format chunk with metadata
            source_info = f"Source {i+1}"
            if "filename" in metadata:
                source_info += f" ({metadata['filename']}"
                if "page_number" in metadata and metadata["page_number"]:
                    source_info += f", page {metadata['page_number']}"
                source_info += ")"
            
            chunk_text = f"[{source_info}]\n{content}\n"
            context_parts.append(chunk_text)
        
        return "\n".join(context_parts)
    
    def _build_prompt(self, query: str, context: str, language: Optional[str] = None) -> str:
        """Build prompt for the LLM"""
        
        # Determine response language
        lang_instruction = ""
        if language == "sw":
            lang_instruction = "Please respond in Kiswahili (Swahili)."
        elif language == "en":
            lang_instruction = "Please respond in English."
        else:
            lang_instruction = "Please respond in English unless the question is asked in Kiswahili."
        
        prompt = f"""You are Elimu Hub, an AI assistant specialized in Kenyan educational content. You help students, teachers, and parents with questions about Primary, Junior Secondary, and Secondary education curricula.

Context Information:
{context}

Instructions:
1. Answer the question based ONLY on the provided context information
2. Be accurate and educational in your response
3. If the context doesn't contain enough information, say so clearly
4. Provide specific examples when possible
5. {lang_instruction}
6. Structure your answer clearly with proper formatting
7. If referring to specific sources, mention them naturally in your response

Question: {query}

Answer:"""

        return prompt
    
    def _call_ollama(self, prompt: str) -> str:
        """Call Ollama API to generate response"""
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "options": {
                    "temperature": 0.1,  # Low temperature for more consistent answers
                    "top_p": 0.9,
                    "max_tokens": self.max_tokens,
                    "stop": ["Question:", "Context Information:"]
                },
                "stream": False
            }
            
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json=payload,
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                answer = result.get("response", "").strip()
                
                if not answer:
                    return "I apologize, but I couldn't generate a proper response. Please try rephrasing your question."
                
                return answer
            else:
                logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                return "I'm having trouble connecting to the language model. Please try again later."
                
        except requests.exceptions.Timeout:
            logger.error("Ollama request timed out")
            return "The request took too long to process. Please try with a simpler question."
        except Exception as e:
            logger.error(f"Error calling Ollama: {e}")
            return f"I encountered an error while generating the response: {str(e)}"
    
    def _prepare_citations(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prepare citation information from chunks"""
        citations = []
        
        for i, chunk in enumerate(chunks):
            metadata = chunk["metadata"]
            
            citation = {
                "id": i + 1,
                "filename": metadata.get("filename", "Unknown"),
                "page": metadata.get("page_number"),
                "education_level": metadata.get("education_level"),
                "subject": metadata.get("subject"),
                "similarity_score": round(chunk["similarity_score"], 3),
                "excerpt": chunk["content"][:200] + "..." if len(chunk["content"]) > 200 else chunk["content"]
            }
            
            citations.append(citation)
        
        return citations
    
    def chat_with_context(
        self,
        conversation_history: List[Dict[str, str]],
        current_query: str,
        education_level: Optional[str] = None,
        subject: Optional[str] = None,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Handle multi-turn conversation with context awareness
        
        Args:
            conversation_history: List of previous exchanges [{"role": "user/assistant", "content": "..."}]
            current_query: Current user question
            education_level: Filter by education level
            subject: Filter by subject
            language: Response language
            
        Returns:
            Response dictionary similar to generate_answer
        """
        # For now, treat each query independently
        # Future enhancement: maintain conversation context
        return self.generate_answer(
            query=current_query,
            education_level=education_level,
            subject=subject,
            language=language
        )
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current Ollama model"""
        try:
            response = requests.post(
                f"{self.ollama_base_url}/api/show",
                json={"name": self.model_name},
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Could not get model info: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Error getting model info: {str(e)}"}
    
    def health_check(self) -> Dict[str, Any]:
        """Check the health of RAG components"""
        health = {
            "ollama_connection": False,
            "model_available": False,
            "vector_db_accessible": False,
            "embedding_model_loaded": False
        }
        
        try:
            # Check Ollama connection
            response = requests.get(f"{self.ollama_base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                health["ollama_connection"] = True
                
                # Check if model is available
                models = response.json().get("models", [])
                model_names = [model["name"] for model in models]
                health["model_available"] = self.model_name in model_names
            
        except Exception as e:
            logger.debug(f"Ollama health check failed: {e}")
        
        try:
            # Check vector database
            stats = self.retriever.get_collection_stats()
            health["vector_db_accessible"] = "error" not in stats
        except Exception as e:
            logger.debug(f"Vector DB health check failed: {e}")
        
        try:
            # Check embedding model
            test_embedding = self.retriever.embed_texts(["test"])
            health["embedding_model_loaded"] = len(test_embedding) > 0
        except Exception as e:
            logger.debug(f"Embedding model health check failed: {e}")
        
        return health
