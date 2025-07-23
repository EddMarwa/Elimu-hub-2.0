"""
Logging configuration for Elimu Hub
"""
import logging
import sys
from pathlib import Path
from loguru import logger

# Remove default logger
logger.remove()

# Create logs directory
logs_dir = Path("logs")
logs_dir.mkdir(exist_ok=True)

# Configure console logging
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)

# Configure file logging
logger.add(
    logs_dir / "elimu_hub.log",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="DEBUG",
    rotation="10 MB",
    retention="7 days",
    compression="zip"
)

# Configure error logging
logger.add(
    logs_dir / "errors.log",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="ERROR",
    rotation="5 MB",
    retention="30 days"
)

# Export logger for use in other modules
__all__ = ["logger"]
