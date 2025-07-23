"""
PDF ingestor for extracting text from PDFs and scanned documents
"""
import os
import io
import re
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from loguru import logger

from .db_models import Document, Chunk


class PDFIngestor:
    """Handles PDF text extraction and OCR processing"""
    
    def __init__(self, tesseract_cmd: Optional[str] = None, ocr_languages: str = "eng+swa"):
        """
        Initialize PDF ingestor
        
        Args:
            tesseract_cmd: Path to tesseract executable
            ocr_languages: Languages for OCR (e.g., 'eng+swa' for English and Swahili)
        """
        self.ocr_languages = ocr_languages
        
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        
        # Test OCR availability
        try:
            pytesseract.get_tesseract_version()
            self.ocr_available = True
            logger.info(f"OCR available with languages: {ocr_languages}")
        except Exception as e:
            self.ocr_available = False
            logger.warning(f"OCR not available: {e}")
    
    def extract_text_from_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Extract text from PDF file
        
        Args:
            pdf_path: Path to PDF file
            
        Returns:
            List of page dictionaries with content and metadata
        """
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        logger.info(f"Processing PDF: {pdf_path.name}")
        pages = []
        
        try:
            # Open PDF with PyMuPDF
            pdf_document = fitz.open(pdf_path)
            
            for page_num in range(len(pdf_document)):
                page = pdf_document[page_num]
                page_data = {
                    "page_number": page_num + 1,
                    "content": "",
                    "extraction_method": "text",
                    "confidence_score": None,
                    "has_images": False,
                    "word_count": 0,
                    "character_count": 0
                }
                
                # Try to extract text directly
                text = page.get_text()
                
                # Check if page has images or if text extraction failed
                image_list = page.get_images()
                page_data["has_images"] = len(image_list) > 0
                
                # If no text or minimal text, try OCR
                if len(text.strip()) < 50 and self.ocr_available and page_data["has_images"]:
                    logger.info(f"Attempting OCR for page {page_num + 1}")
                    ocr_text, confidence = self._extract_text_with_ocr(page)
                    if ocr_text and len(ocr_text.strip()) > len(text.strip()):
                        text = ocr_text
                        page_data["extraction_method"] = "ocr"
                        page_data["confidence_score"] = confidence
                
                # Clean and process text
                text = self._clean_text(text)
                page_data["content"] = text
                page_data["word_count"] = len(text.split())
                page_data["character_count"] = len(text)
                
                if text.strip():  # Only add pages with content
                    pages.append(page_data)
                    logger.debug(f"Page {page_num + 1}: {page_data['word_count']} words, "
                               f"method: {page_data['extraction_method']}")
            
            pdf_document.close()
            logger.info(f"Extracted text from {len(pages)} pages")
            
        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {e}")
            raise
        
        return pages
    
    def _extract_text_with_ocr(self, page) -> Tuple[str, float]:
        """
        Extract text from page using OCR
        
        Args:
            page: PyMuPDF page object
            
        Returns:
            Tuple of (extracted_text, confidence_score)
        """
        try:
            # Convert page to image
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
            img_data = pix.tobytes("png")
            pix = None  # Free memory
            
            # Convert to PIL Image
            img = Image.open(io.BytesIO(img_data))
            
            # Perform OCR with confidence scores
            ocr_data = pytesseract.image_to_data(
                img,
                lang=self.ocr_languages,
                output_type=pytesseract.Output.DICT
            )
            
            # Extract text and calculate average confidence
            words = []
            confidences = []
            
            for i, word in enumerate(ocr_data['text']):
                if word.strip():  # Skip empty words
                    words.append(word)
                    confidences.append(ocr_data['conf'][i])
            
            text = ' '.join(words)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            return text, avg_confidence
            
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            return "", 0
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove page numbers and common headers/footers
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Skip likely page numbers (single numbers or "Page X")
            if re.match(r'^\d+$', line) or re.match(r'^Page\s+\d+$', line, re.IGNORECASE):
                continue
            
            # Skip very short lines that are likely artifacts
            if len(line) < 3:
                continue
            
            cleaned_lines.append(line)
        
        # Rejoin lines with proper spacing
        text = ' '.join(cleaned_lines)
        
        # Fix common OCR errors for Swahili and English
        text = self._fix_ocr_errors(text)
        
        return text.strip()
    
    def _fix_ocr_errors(self, text: str) -> str:
        """
        Fix common OCR errors for English and Swahili text
        
        Args:
            text: Text with potential OCR errors
            
        Returns:
            Text with corrections applied
        """
        # Common OCR substitutions
        ocr_fixes = {
            # English common errors
            r'\bl\b': 'I',  # lowercase l mistaken for I
            r'\b1\b': 'I',  # number 1 mistaken for I
            r'\b0\b': 'O',  # number 0 mistaken for O
            r'rn': 'm',     # rn mistaken for m
            r'cl': 'd',     # cl mistaken for d
            
            # Swahili specific fixes
            r'sh(?=\s|$)': 'si',  # Common Swahili word
            r'wa(?=\s)': 'wa',    # Ensure proper spacing for Swahili prefixes
            
            # General cleanup
            r'[|]': 'l',    # Pipe character mistaken for l
            r'[¡]': 'i',    # Inverted exclamation mistaken for i
        }
        
        for pattern, replacement in ocr_fixes.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
        return text
    
    def chunk_text(
        self,
        pages: List[Dict[str, Any]],
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> List[Dict[str, Any]]:
        """
        Split text into chunks for embedding
        
        Args:
            pages: List of page dictionaries
            chunk_size: Maximum characters per chunk
            chunk_overlap: Characters to overlap between chunks
            
        Returns:
            List of chunk dictionaries
        """
        chunks = []
        chunk_index = 0
        
        for page in pages:
            text = page["content"]
            if not text:
                continue
            
            page_chunks = self._split_text_into_chunks(
                text, chunk_size, chunk_overlap
            )
            
            for i, chunk_text in enumerate(page_chunks):
                chunk = {
                    "content": chunk_text,
                    "chunk_index": chunk_index,
                    "page_number": page["page_number"],
                    "extraction_method": page["extraction_method"],
                    "confidence_score": page["confidence_score"],
                    "character_count": len(chunk_text),
                    "token_count": self._estimate_token_count(chunk_text)
                }
                
                chunks.append(chunk)
                chunk_index += 1
        
        logger.info(f"Created {len(chunks)} chunks from {len(pages)} pages")
        return chunks
    
    def _split_text_into_chunks(
        self,
        text: str,
        chunk_size: int,
        chunk_overlap: int
    ) -> List[str]:
        """
        Split text into overlapping chunks
        
        Args:
            text: Text to split
            chunk_size: Maximum characters per chunk
            chunk_overlap: Characters to overlap
            
        Returns:
            List of text chunks
        """
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            
            # Try to break at sentence boundaries
            if end < len(text):
                # Look for sentence endings near the chunk boundary
                sentence_endings = ['. ', '! ', '? ', '.\n', '!\n', '?\n']
                best_break = end
                
                # Search backwards for a good break point
                for i in range(end, max(start + chunk_size // 2, end - 200), -1):
                    for ending in sentence_endings:
                        if text[i:i+len(ending)] == ending:
                            best_break = i + len(ending)
                            break
                    if best_break != end:
                        break
                
                end = best_break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            start = max(start + 1, end - chunk_overlap)
            
            # Prevent infinite loop
            if start >= len(text):
                break
        
        return chunks
    
    def _estimate_token_count(self, text: str) -> int:
        """
        Estimate token count for text (rough approximation)
        
        Args:
            text: Input text
            
        Returns:
            Estimated token count
        """
        # Simple approximation: ~4 characters per token for English
        # Adjust for other languages as needed
        return max(1, len(text) // 4)
    
    def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """
        Get basic file information
        
        Args:
            file_path: Path to file
            
        Returns:
            Dictionary with file metadata
        """
        path = Path(file_path)
        
        info = {
            "filename": path.name,
            "file_size": path.stat().st_size,
            "file_extension": path.suffix.lower(),
            "exists": path.exists()
        }
        
        if info["file_extension"] == ".pdf":
            try:
                doc = fitz.open(file_path)
                info["total_pages"] = len(doc)
                info["is_encrypted"] = doc.is_encrypted
                doc.close()
            except Exception as e:
                logger.error(f"Error reading PDF info: {e}")
                info["total_pages"] = 0
                info["is_encrypted"] = False
        
        return info
