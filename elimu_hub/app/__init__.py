"""
Elimu Hub - Offline-first AI assistant for Kenyan educational content

This package provides RAG-based question answering using local LLM inference
through Ollama, with vector similarity search and citation-based responses.
"""

__version__ = "1.0.0"
__author__ = "Elimu Hub Team"
__email__ = "support@elimuhub.ke"

from .main import app

__all__ = ["app"]
