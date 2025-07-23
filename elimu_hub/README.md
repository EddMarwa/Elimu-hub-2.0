# Elimu Hub - Offline-First AI Assistant for Kenyan Education

Elimu Hub is an intelligent educational assistant built specifically for the Kenyan curriculum. It uses Retrieval-Augmented Generation (RAG) architecture with local LLM inference through Ollama to provide citation-based answers from educational documents while working completely offline.

## 🌟 Features

- **Offline-First**: Works completely offline using local LLM through Ollama
- **Kenyan Curriculum**: Specialized for Primary, Junior Secondary, and Secondary education levels
- **Multilingual**: Supports both English and Kiswahili
- **RAG Architecture**: Combines vector similarity search with large language model generation
- **Citation-Based**: Provides source references for all answers
- **OCR Support**: Extracts text from both regular PDFs and scanned documents
- **Fast API**: RESTful API built with FastAPI for easy integration
- **Scalable Storage**: Uses PostgreSQL for metadata and ChromaDB for vector embeddings

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PDF Documents │────│   Text Extraction │────│   Text Chunking │
│   (English/KSW) │    │   (PyMuPDF + OCR) │    │   (Smart Split) │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
                                    │
                                    ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Query    │────│   Vector Search  │────│  Context Build  │
│                 │    │   (ChromaDB)     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                    │
                                    ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Final Answer  │────│  LLM Generation  │────│  Prompt + RAG   │
│  + Citations    │    │    (Ollama)      │    │    Context      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

Before running Elimu Hub, ensure you have:

### System Requirements
- Python 3.8 or higher
- PostgreSQL 12 or higher
- At least 4GB RAM (8GB recommended)
- 10GB free disk space (for models and documents)

### Required Software
- **Ollama**: For local LLM inference
- **Tesseract OCR**: For scanned document processing
- **PostgreSQL**: For metadata storage

## 🚀 Quick Start

### 1. Install Ollama

```bash
# On Windows (PowerShell)
winget install Ollama.Ollama

# On macOS
brew install ollama

# On Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

Start Ollama and pull a model:
```bash
ollama serve
ollama pull mistral:7b-instruct
```

### 2. Install PostgreSQL

Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/).

Create a database:
```sql
CREATE DATABASE elimu_hub;
CREATE USER elimu_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE elimu_hub TO elimu_user;
```

### 3. Install Tesseract OCR

```bash
# Windows (using Chocolatey)
choco install tesseract

# macOS
brew install tesseract tesseract-lang

# Ubuntu/Debian
sudo apt-get install tesseract-ocr tesseract-ocr-eng tesseract-ocr-swa
```

### 4. Clone and Setup Elimu Hub

```bash
git clone <repository-url>
cd elimu_hub

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and preferences
```

### 5. Configure Environment

Edit the `.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql://elimu_user:your_password@localhost:5432/elimu_hub

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b-instruct

# Other settings...
```

### 6. Start the API

```bash
# Development mode
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Production mode
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## 📚 Usage

### Loading Documents

Use the batch loading script to add PDF documents:

```bash
# Load all PDFs from a directory
python load_pdfs.py load --directory ./sample_docs --education-level "Primary" --subject "Mathematics" --language en

# Load a single PDF
python load_pdfs.py load --file ./my_textbook.pdf --education-level "Secondary" --subject "Biology" --language en

# List processed documents
python load_pdfs.py list

# View statistics
python load_pdfs.py stats
```

### API Usage

#### Ask a Question

```bash
curl -X POST \"http://localhost:8000/query\" \
-H \"Content-Type: application/json\" \
-d '{
  \"query\": \"What is photosynthesis?\",
  \"education_level\": \"Primary\",
  \"subject\": \"Science\",
  \"language\": \"en\"
}'
```

#### Upload a Document

```bash
curl -X POST \"http://localhost:8000/upload\" \
-F \"file=@textbook.pdf\" \
-F \"education_level=Primary\" \
-F \"subject=Science\" \
-F \"language=en\"
```

#### Health Check

```bash
curl http://localhost:8000/health
```

### Python Client Example

```python
import requests

# Ask a question
response = requests.post('http://localhost:8000/query', json={
    'query': 'Explain the water cycle',
    'education_level': 'Primary',
    'subject': 'Science',
    'language': 'en'
})

result = response.json()
print(\"Answer:\", result['answer'])
print(\"Sources:\", len(result['sources']))
```

## 🎯 Supported Education Levels & Subjects

### Primary Level
- Mathematics (Hisabati)
- English (Kiingereza)
- Kiswahili
- Science (Sayansi)
- Social Studies (Utafiti wa Kijamii)
- Religious Education (Elimu ya Kidini)

### Junior Secondary Level
- Mathematics (Hisabati)
- English (Kiingereza)
- Kiswahili
- Science (Sayansi)
- Geography (Jiografia)
- History (Historia)
- Religious Education (Elimu ya Kidini)

### Secondary Level
- Mathematics (Hisabati)
- English (Kiingereza)
- Kiswahili
- Biology (Biolojia)
- Chemistry (Kemia)
- Physics (Fizikia)
- Geography (Jiografia)
- History (Historia)
- Religious Education (Elimu ya Kidini)

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `OLLAMA_BASE_URL` | Ollama API base URL | http://localhost:11434 |
| `OLLAMA_MODEL` | Ollama model name | mistral:7b-instruct |
| `EMBEDDING_MODEL` | HuggingFace embedding model | BAAI/bge-small-en-v1.5 |
| `VECTOR_DB_PATH` | ChromaDB storage path | ./embeddings/chroma_db |
| `CHUNK_SIZE` | Text chunk size | 1000 |
| `CHUNK_OVERLAP` | Text chunk overlap | 200 |
| `OCR_LANGUAGES` | Tesseract OCR languages | eng+swa |

### Recommended Ollama Models

| Model | Size | Use Case |
|-------|------|----------|
| `mistral:7b-instruct` | ~4GB | General purpose, good for most queries |
| `llama3:8b-instruct` | ~4.7GB | Alternative general purpose model |
| `codellama:7b-instruct` | ~3.8GB | Good for technical subjects |
| `neural-chat:7b` | ~4.1GB | Conversational responses |

## 📊 API Endpoints

### Core Endpoints

- `POST /query` - Ask a question
- `POST /upload` - Upload a document
- `GET /documents` - List documents
- `GET /documents/{id}` - Get document details
- `DELETE /documents/{id}` - Delete a document

### System Endpoints

- `GET /health` - Health check
- `GET /stats` - System statistics
- `GET /subjects` - List available subjects

### Documentation

- `GET /docs` - Swagger UI documentation
- `GET /redoc` - ReDoc documentation

## 🧪 Testing

```bash
# Run basic tests
python -m pytest tests/

# Test API endpoints
python -m pytest tests/test_api.py

# Test document processing
python -m pytest tests/test_processing.py
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t elimu-hub .

# Run with docker-compose
docker-compose up -d
```

### Production Considerations

1. **Database**: Use managed PostgreSQL service
2. **Vector Storage**: Consider Qdrant for better scalability
3. **Load Balancing**: Use nginx or similar
4. **Monitoring**: Set up logging and metrics
5. **Security**: Configure authentication and HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run linting
flake8 app/
black app/

# Run type checking
mypy app/
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Kenyan Ministry of Education** for curriculum guidelines
- **Ollama** for local LLM infrastructure
- **ChromaDB** for vector database
- **FastAPI** for the web framework
- **Sentence Transformers** for embeddings

## 🐛 Troubleshooting

### Common Issues

**1. Ollama Connection Failed**
```bash
# Check if Ollama is running
ollama list

# Start Ollama if not running
ollama serve
```

**2. OCR Not Working**
```bash
# Test Tesseract installation
tesseract --version

# Install language packs
# Ubuntu: sudo apt-get install tesseract-ocr-swa
# Windows: Download from UB Mannheim
```

**3. Database Connection Issues**
```bash
# Test PostgreSQL connection
psql -U elimu_user -d elimu_hub -h localhost

# Check if database exists
\\l
```

**4. Out of Memory**
- Reduce `CHUNK_SIZE` in .env
- Use smaller Ollama model
- Increase system RAM or swap

### Getting Help

- 📧 Email: support@elimuhub.ke
- 💬 Discord: [Join our community](https://discord.gg/elimuhub)
- 🐛 Issues: [GitHub Issues](https://github.com/elimuhub/issues)
- 📖 Docs: [Full Documentation](https://docs.elimuhub.ke)

---

**Made with ❤️ for Kenyan Education**
