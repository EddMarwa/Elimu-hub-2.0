# ElimuHub 2.0 - CBC Lesson Planning System

A comprehensive web application for Kenyan teachers to generate CBC-compliant lesson plans and schemes of work with AI-powered curriculum reference integration.

## 🌟 Features

### 📤 PDF Upload & OCR Processing
- **Smart Document Processing**: Upload curriculum PDFs (text-based or scanned)
- **OCR Technology**: Automatic text extraction from scanned documents using Tesseract.js
- **Content Indexing**: Extracted content is automatically indexed for semantic search
- **Multi-format Support**: Handles both digital and scanned PDF documents

### 🔍 Semantic Search Engine
- **AI-Powered Search**: Find relevant curriculum content using natural language queries
- **Context-Aware Results**: Semantic search understands meaning, not just keywords
- **Smart Filtering**: Filter by subject, grade, topic, and document type
- **Reference Integration**: Search results directly inform lesson planning

### 🧠 CBC Lesson Plan Generator
- **Curriculum-Aware Generation**: Uses uploaded curriculum documents as reference
- **CBC Compliance**: Automatically includes core competencies and values
- **Interactive Builder**: Step-by-step guided lesson plan creation
- **Smart Suggestions**: AI-generated learning outcomes, activities, and resources
- **Export Options**: Generate professional DOCX and PDF documents

### 📊 Scheme of Work Editor
- **Table-Based Interface**: Visual weekly planning with drag-and-drop functionality
- **Template System**: Pre-built templates for different subjects and grades
- **Collaborative Features**: Edit and refine weekly plans with rich content
- **CBC Integration**: Automatic inclusion of competencies, values, and assessment methods

### 📄 Professional Document Export
- **Multiple Formats**: Export to DOCX and PDF with professional formatting
- **CBC Branding**: Green-gold-white theme with "Generated via ElimuHub 2.0 | CBC Compliant"
- **Print-Ready**: Optimized layouts for classroom and administrative use
- **Batch Export**: Export multiple documents simultaneously

### 🔄 CBC Transition Guide
- **Comprehensive Comparison**: Side-by-side comparison of 8-4-4 vs CBC systems
- **Implementation Timeline**: Track CBC rollout progress across grades
- **Core Competencies Guide**: Detailed breakdown of all 7 CBC competencies
- **Values Integration**: Understanding and implementing CBC values
- **Teacher Resources**: Practical guidance for curriculum transition

## 🏗️ System Architecture

### Backend (Node.js/TypeScript)
```
server/
├── src/
│   ├── services/
│   │   ├── pdfProcessor.ts      # PDF upload & OCR processing
│   │   ├── embeddingService.ts  # Text chunking & semantic search
│   │   └── exportService.ts     # DOCX/PDF document generation
│   ├── routes/
│   │   ├── documents.ts         # PDF upload & search endpoints
│   │   ├── lessonPlans.ts       # Lesson plan generation & export
│   │   └── schemes.ts           # Scheme of work management
│   └── index.ts                 # Express server setup
```

### Frontend (React/TypeScript)
```
client/
├── src/
│   ├── pages/
│   │   ├── Upload/              # PDF upload interface
│   │   ├── Reference/           # Semantic search interface
│   │   ├── LessonPlanGenerator/ # Interactive lesson builder
│   │   ├── SchemeOfWorkEditor/  # Weekly planning interface
│   │   └── CBCTransition/       # CBC guidance & comparison
│   ├── components/              # Reusable UI components
│   └── theme.ts                 # Green-gold-white branding
```

### Key Technologies
- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Frontend**: React, Material-UI, TypeScript
- **AI/ML**: ChromaDB, Transformers.js, Sentence Transformers
- **Document Processing**: Tesseract.js, PDF-parse, Sharp
- **Export**: Puppeteer, DOCX library, HTML-to-PDF
- **Search**: Vector embeddings, semantic similarity

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB database
- Python 3.8+ (for some ML dependencies)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/elimuhub-2.0.git
cd elimuhub-2.0
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Environment Setup**
```bash
# Copy environment template
cp server/.env.example server/.env

# Configure your environment variables
# - MongoDB connection string
# - ChromaDB settings
# - File upload paths
```

4. **Start Development Servers**
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server:dev  # Backend on :5000
npm run client:dev  # Frontend on :3000
```

5. **Initialize Services**
```bash
# The system will automatically:
# - Initialize ChromaDB collection
# - Set up OCR workers
# - Create upload directories
```

## 📚 Usage Guide

### 1. Upload Curriculum Documents
- Navigate to `/upload`
- Select subject, grade, and document type
- Drag and drop PDF files or click to browse
- Monitor processing progress (text extraction + OCR)
- View processing results and confidence scores

### 2. Search Curriculum Content
- Go to `/reference`
- Enter natural language queries
- Apply filters (subject, grade, topic)
- Review semantic search results with similarity scores
- Use results to inform lesson planning

### 3. Generate Lesson Plans

- Fill in basic information (subject, grade, topic)
- Click "Generate CBC-Compliant Lesson Plan"
- Review and edit generated content
- Select core competencies and values
- Export to DOCX or PDF

### 4. Create Schemes of Work
- Access `/scheme-of-work-editor`
- Set scheme details (subject, grade, term)
- Generate template or add weeks manually
- Edit weekly plans with detailed content
- Include competencies, values, and assessments
- Export complete scheme

### 5. CBC Transition Support
- Explore `/cbc-transition`
- Compare 8-4-4 vs CBC systems
- Review core competencies and values
- Check implementation timeline
- Access teacher guidance resources

## 🎨 Design System

### Color Palette
- **Primary Green**: `#0A8754` - Main brand color
- **Accent Gold**: `#FFD700` - Highlights and accents
- **Background White**: `#FFFFFF` - Clean, professional base
- **Text Green**: `#2E7D32` - Readable text color

### Typography
- **Primary Font**: Calibri (matching TSC documents)
- **Fallbacks**: Roboto, Helvetica, Arial, sans-serif
- **Sizes**: Responsive scale from 11pt (body) to 32pt (headings)

### Components
- **Cards**: Subtle shadows with green borders
- **Buttons**: Rounded corners, green primary, gold secondary
- **Forms**: Clean inputs with green focus states
- **Tables**: Alternating rows, green headers

## 🔧 Configuration

### Backend Configuration
```typescript
// server/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/elimuhub
CHROMA_DB_PATH=http://localhost:8000
UPLOAD_MAX_SIZE=50MB
OCR_LANGUAGE=eng
EXPORT_OUTPUT_DIR=./outputs
```

### Frontend Configuration
```typescript
// client/src/config.ts
export const API_BASE_URL = 'http://localhost:5000/api';
export const UPLOAD_MAX_SIZE = 50 * 1024 * 1024; // 50MB
export const SUPPORTED_FORMATS = ['application/pdf'];
```

## 📊 API Documentation

### Document Upload
```http
POST /api/documents/upload
Content-Type: multipart/form-data

{
  "document": File,
  "subject": "Mathematics",
  "grade": "Grade 3",
  "documentType": "Curriculum Design"
}
```

### Semantic Search
```http
GET /api/documents/search?query=fractions&subject=Mathematics&grade=Grade 3&limit=10
```

### Lesson Plan Generation
```http
POST /api/lesson-plans/generate
{
  "subject": "Mathematics",
  "grade": "Grade 3",
  "topic": "Introduction to Fractions",
  "duration": 40
}
```

### Document Export
```http
POST /api/lesson-plans/{id}/export
{
  "format": "docx",
  "lessonPlan": { ... }
}
```

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test

# Integration tests
npm run test:integration
```

### Test Coverage
- Unit tests for all services
- Integration tests for API endpoints
- Component tests for React pages
- End-to-end tests for user workflows

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run client:build

# Build backend
cd server && npm run build

# Start production server
npm run server:start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Services included:
# - Node.js backend
# - React frontend (served by Nginx)
# - MongoDB database
# - ChromaDB vector store
```

### Environment Variables
```bash
# Production environment
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongo:27017/elimuhub
CHROMA_DB_PATH=http://chromadb:8000
CORS_ORIGIN=https://your-domain.com
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality

### Project Structure
```
elimuhub-2.0/
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared TypeScript types
├── docs/            # Documentation
├── docker-compose.yml
└── package.json     # Root package with scripts
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ministry of Education, Kenya** - CBC curriculum standards
- **Teachers Service Commission** - Document formatting guidelines
- **Open Source Community** - Amazing libraries and tools
- **Kenyan Educators** - Feedback and requirements gathering

## 📞 Support

### Documentation
- [API Documentation](docs/api.md)
- [User Guide](docs/user-guide.md)
- [Developer Guide](docs/developer-guide.md)

### Community
- [GitHub Issues](https://github.com/your-org/elimuhub-2.0/issues)
- [Discussions](https://github.com/your-org/elimuhub-2.0/discussions)
- [Wiki](https://github.com/your-org/elimuhub-2.0/wiki)

### Contact
- **Email**: support@elimuhub.co.ke
- **Website**: https://elimuhub.co.ke
- **Twitter**: @ElimuHubKE

---

**Generated via ElimuHub 2.0 | CBC Compliant** 🇰🇪

*Empowering Kenyan educators with AI-powered curriculum tools for the digital age.*