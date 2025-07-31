import { Router } from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../middleware/errorHandler';
import PDFProcessor from '../services/pdfProcessor';
import DocumentProcessor from '../services/documentProcessor';
import EmbeddingService from '../services/embeddingService';
import { logger } from '../utils/logger';

const router = Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word, text, and Excel files are allowed'));
    }
  }
});

// @desc    Upload curriculum document
// @route   POST /api/documents/upload
// @access  Private
router.post('/upload', upload.single('document'), asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { subject, grade, documentType } = req.body;
    const filePath = req.file.path;
    const filename = req.file.originalname;

    logger.info(`Processing uploaded document: ${filename}`);

    // Initialize services
    const documentProcessor = DocumentProcessor.getInstance();
    const embeddingService = EmbeddingService.getInstance();

    // Process the document (supports PDF, Word, text, Excel)
    const processedDoc = await documentProcessor.processDocument(filePath);

    if (!processedDoc.success) {
      return res.status(400).json({
        success: false,
        message: `Failed to process ${processedDoc.fileType || 'document'}`,
        error: processedDoc.error
      });
    }

    // Process and store in embedding database
    await embeddingService.processDocument(filePath, {
      filename,
      subject,
      grade,
      documentType,
      content: processedDoc.extractedText,
      uploadDate: new Date().toISOString()
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'Document uploaded and processed successfully',
      data: {
        filename,
        subject,
        grade,
        documentType,
        fileType: processedDoc.fileType,
        pages: processedDoc.pages || 1,
        extractedTextLength: processedDoc.extractedText?.length || 0
      }
    });

  } catch (error) {
    logger.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process document',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Search curriculum documents
// @route   GET /api/documents/search
// @access  Private
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { query, limit = '10' } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const embeddingService = EmbeddingService.getInstance();
    const results = await embeddingService.searchSimilar(
      query as string,
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      data: {
        query,
        results: results.map(result => ({
          content: result.chunk.content.substring(0, 300) + '...',
          similarity: result.similarity,
          metadata: result.chunk.metadata
        }))
      }
    });

  } catch (error) {
    logger.error('Document search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search documents',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get document statistics
// @route   GET /api/documents/stats
// @access  Private
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const embeddingService = EmbeddingService.getInstance();
    const documents = await embeddingService.getAllDocuments();

    const stats = {
      totalDocuments: documents.length,
      subjects: [...new Set(documents.map((doc: any) => doc.subject))],
      grades: [...new Set(documents.map((doc: any) => doc.grade))],
      documentTypes: [...new Set(documents.map((doc: any) => doc.documentType))]
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Document stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get document statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const embeddingService = EmbeddingService.getInstance();
    const documents = await embeddingService.getAllDocuments();

    res.status(200).json({
      success: true,
      data: documents
    });

  } catch (error) {
    logger.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Delete document
// @route   DELETE /api/documents/:filename
// @access  Private
router.delete('/:filename', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    const embeddingService = EmbeddingService.getInstance();
    await embeddingService.deleteDocument(filename);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    logger.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;