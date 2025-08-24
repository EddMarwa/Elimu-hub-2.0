import { PrismaClient, DocumentType, ProcessingStatus } from '../generated/prisma';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import OpenAI from 'openai';

const prisma = new PrismaClient();

export interface FileUploadData {
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  subject: string;
  grade: string;
  documentType: DocumentType;
  description?: string;
  uploadedBy: string;
}

export interface ProcessingResult {
  success: boolean;
  extractedContent: string;
  processingStatus: ProcessingStatus;
  error?: string;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    language?: string;
    confidence?: number;
    processingTime?: number;
  };
}

export interface ContentAnalysis {
  summary: string;
  keywords: string[];
  topics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadingTime: number;
  cbcAlignment: {
    competencies: string[];
    values: string[];
    subjects: string[];
  };
}

export class FileProcessingService {
  private openai: OpenAI | null = null;
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || 'uploads';
    
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Configure multer for file uploads
   */
  configureMulter() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(this.uploadDir, this.getUploadSubdirectory(file.mimetype));
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,docx,doc,xlsx,xls,txt').split(',');
      const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
      
      if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${fileExtension} not allowed. Allowed types: ${allowedTypes.join(', ')}`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
        files: 1
      }
    });
  }

  /**
   * Process uploaded file and extract content
   */
  async processFile(fileData: FileUploadData): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting file processing', { fileName: fileData.fileName, type: fileData.documentType });

      let extractedContent = '';
      let metadata: any = {};

      // Process based on file type
      switch (fileData.documentType) {
        case 'PDF':
          const pdfResult = await this.processPDF(fileData.filePath);
          extractedContent = pdfResult.content;
          metadata = pdfResult.metadata;
          break;

        case 'WORD':
          const wordResult = await this.processWord(fileData.filePath);
          extractedContent = wordResult.content;
          metadata = wordResult.metadata;
          break;

        case 'EXCEL':
          const excelResult = await this.processExcel(fileData.filePath);
          extractedContent = excelResult.content;
          metadata = excelResult.metadata;
          break;

        case 'TEXT':
          const textResult = await this.processText(fileData.filePath);
          extractedContent = textResult.content;
          metadata = textResult.metadata;
          break;

        default:
          throw new Error(`Unsupported document type: ${fileData.documentType}`);
      }

      // Analyze content if OpenAI is available
      let contentAnalysis: ContentAnalysis | null = null;
      if (this.openai && extractedContent.length > 100) {
        try {
          contentAnalysis = await this.analyzeContent(extractedContent, fileData.subject, fileData.grade);
        } catch (error) {
          logger.warn('Content analysis failed, continuing without analysis', { error });
        }
      }

      // Create document chunks for search
      const chunks = this.createContentChunks(extractedContent);

      // Save to database
      const document = await prisma.document.create({
        data: {
          title: fileData.originalName,
          subject: fileData.subject,
          grade: fileData.grade,
          documentType: fileData.documentType,
          fileName: fileData.fileName,
          filePath: fileData.filePath,
          extractedContent,
          processingStatus: 'COMPLETED',
          uploadedBy: fileData.uploadedBy,
          chunks: {
            create: chunks.map((chunk, index) => ({
              content: chunk.content,
              metadata: JSON.stringify(chunk.metadata),
              chunkIndex: index
            }))
          }
        }
      });

      // Update metadata with analysis results
      if (contentAnalysis) {
        await prisma.document.update({
          where: { id: document.id },
          data: {
            extractedContent: JSON.stringify({
              content: extractedContent,
              analysis: contentAnalysis,
              metadata: {
                ...metadata,
                processingTime: Date.now() - startTime
              }
            })
          }
        });
      }

      logger.info('File processing completed successfully', {
        fileName: fileData.fileName,
        documentId: document.id,
        processingTime: Date.now() - startTime
      });

      return {
        success: true,
        extractedContent,
        processingStatus: 'COMPLETED',
        metadata: {
          ...metadata,
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('File processing failed', { error, fileName: fileData.fileName });
      
      return {
        success: false,
        extractedContent: '',
        processingStatus: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process PDF files
   */
  private async processPDF(filePath: string): Promise<{ content: string; metadata: any }> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      
      return {
        content: data.text,
        metadata: {
          pageCount: data.numpages,
          wordCount: data.text.split(/\s+/).length,
          language: this.detectLanguage(data.text),
          confidence: 1.0
        }
      };
    } catch (error) {
      // Fallback to OCR if PDF parsing fails
      logger.warn('PDF parsing failed, attempting OCR', { error, filePath });
      return this.processPDFWithOCR(filePath);
    }
  }

  /**
   * Process PDF with OCR for scanned documents
   */
  private async processPDFWithOCR(filePath: string): Promise<{ content: string; metadata: any }> {
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();

      return {
        content: text,
        metadata: {
          pageCount: 1, // OCR processes one page at a time
          wordCount: text.split(/\s+/).length,
          language: 'en',
          confidence: 0.8,
          processingMethod: 'OCR'
        }
      };
    } catch (error) {
      throw new Error(`OCR processing failed: ${error}`);
    }
  }

  /**
   * Process Word documents
   */
  private async processWord(filePath: string): Promise<{ content: string; metadata: any }> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      
      return {
        content: result.value,
        metadata: {
          wordCount: result.value.split(/\s+/).length,
          language: this.detectLanguage(result.value),
          confidence: 1.0,
          processingMethod: 'mammoth'
        }
      };
    } catch (error) {
      throw new Error(`Word document processing failed: ${error}`);
    }
  }

  /**
   * Process Excel files
   */
  private async processExcel(filePath: string): Promise<{ content: string; metadata: any }> {
    try {
      const workbook = XLSX.readFile(filePath);
      let content = '';

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        content += `Sheet: ${sheetName}\n`;
        jsonData.forEach((row: any) => {
          content += row.join('\t') + '\n';
        });
        content += '\n';
      });

      return {
        content: content.trim(),
        metadata: {
          sheetCount: workbook.SheetNames.length,
          wordCount: content.split(/\s+/).length,
          language: 'en',
          confidence: 1.0,
          processingMethod: 'xlsx'
        }
      };
    } catch (error) {
      throw new Error(`Excel file processing failed: ${error}`);
    }
  }

  /**
   * Process text files
   */
  private async processText(filePath: string): Promise<{ content: string; metadata: any }> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      return {
        content,
        metadata: {
          wordCount: content.split(/\s+/).length,
          language: this.detectLanguage(content),
          confidence: 1.0,
          processingMethod: 'text'
        }
      };
    } catch (error) {
      throw new Error(`Text file processing failed: ${error}`);
    }
  }

  /**
   * Analyze content using OpenAI
   */
  private async analyzeContent(content: string, subject: string, grade: string): Promise<ContentAnalysis> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const prompt = `
Analyze the following educational content and provide:
1. A concise summary (2-3 sentences)
2. Key keywords and topics
3. Difficulty level assessment
4. Estimated reading time
5. CBC curriculum alignment

Content: ${content.substring(0, 3000)}...
Subject: ${subject}
Grade: ${grade}

Respond in JSON format:
{
  "summary": "brief summary",
  "keywords": ["keyword1", "keyword2"],
  "topics": ["topic1", "topic2"],
  "difficulty": "beginner|intermediate|advanced",
  "estimatedReadingTime": 5,
  "cbcAlignment": {
    "competencies": ["competency1", "competency2"],
    "values": ["value1", "value2"],
    "subjects": ["subject1", "subject2"]
  }
}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI');
      }

      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from OpenAI');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.error('OpenAI content analysis failed', { error });
      throw error;
    }
  }

  /**
   * Create content chunks for search indexing
   */
  private createContentChunks(content: string, chunkSize: number = 1000): Array<{ content: string; metadata: any }> {
    const chunks: Array<{ content: string; metadata: any }> = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    let currentChunk = '';
    let chunkIndex = 0;

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            chunkIndex,
            wordCount: currentChunk.split(/\s+/).length,
            startSentence: currentChunk.split(/[.!?]+/)[0].trim()
          }
        });
        
        currentChunk = sentence;
        chunkIndex++;
      } else {
        currentChunk += sentence + '. ';
      }
    }

    // Add the last chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          chunkIndex,
          wordCount: currentChunk.split(/\s+/).length,
          startSentence: currentChunk.split(/[.!?]+/)[0].trim()
        }
      });
    }

    return chunks;
  }

  /**
   * Detect language of text content
   */
  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const englishWords = ['the', 'and', 'of', 'to', 'in', 'is', 'that', 'it', 'with', 'as'];
    const swahiliWords = ['na', 'ya', 'wa', 'kwa', 'ni', 'kama', 'hii', 'hiyo', 'kuna', 'pia'];
    
    const textLower = text.toLowerCase();
    const englishCount = englishWords.filter(word => textLower.includes(word)).length;
    const swahiliCount = swahiliWords.filter(word => textLower.includes(word)).length;
    
    if (swahiliCount > englishCount) return 'sw';
    return 'en';
  }

  /**
   * Get upload subdirectory based on file type
   */
  private getUploadSubdirectory(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'documents';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'documents';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'documents';
    if (mimeType.includes('text')) return 'documents';
    return 'documents';
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('Temporary file cleaned up', { filePath });
      }
    } catch (error) {
      logger.warn('Failed to cleanup temporary file', { error, filePath });
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(): Promise<any> {
    try {
      const [total, completed, failed, processing] = await Promise.all([
        prisma.document.count(),
        prisma.document.count({ where: { processingStatus: 'COMPLETED' } }),
        prisma.document.count({ where: { processingStatus: 'FAILED' } }),
        prisma.document.count({ where: { processingStatus: 'PENDING' } })
      ]);

      return {
        total,
        completed,
        failed,
        processing,
        successRate: total > 0 ? (completed / total) * 100 : 0
      };
    } catch (error) {
      logger.error('Failed to get processing stats', { error });
      throw error;
    }
  }

  /**
   * Retry failed processing
   */
  async retryFailedProcessing(documentId: string): Promise<ProcessingResult> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: { user: true }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      if (document.processingStatus !== 'FAILED') {
        throw new Error('Document is not in failed status');
      }

      // Reset status and retry
      await prisma.document.update({
        where: { id: documentId },
        data: { processingStatus: 'PENDING' }
      });

      const fileData: FileUploadData = {
        originalName: document.title,
        fileName: document.fileName,
        filePath: document.filePath,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        subject: document.subject,
        grade: document.grade,
        documentType: document.documentType,
        description: document.description,
        uploadedBy: document.uploadedBy
      };

      return this.processFile(fileData);
    } catch (error) {
      logger.error('Failed to retry processing', { error, documentId });
      throw error;
    }
  }
}

export default new FileProcessingService();
