import { PrismaClient, DocumentType, ProcessingStatus } from '../generated/prisma';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateDocumentData {
  title: string;
  subject: string;
  grade: string;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  extractedContent?: string;
  uploadedBy: string;
}

export interface UpdateDocumentData {
  title?: string;
  subject?: string;
  grade?: string;
  documentType?: DocumentType;
  fileName?: string;
  filePath?: string;
  extractedContent?: string;
  processingStatus?: ProcessingStatus;
}

export class DocumentService {
  async createDocument(data: CreateDocumentData) {
    try {
      const document = await prisma.document.create({
        data: {
          title: data.title,
          subject: data.subject,
          grade: data.grade,
          documentType: data.documentType,
          fileName: data.fileName,
          filePath: data.filePath,
          extractedContent: data.extractedContent,
          uploadedBy: data.uploadedBy,
          processingStatus: ProcessingStatus.PENDING,
        },
        include: {
          user: true,
        },
      });

      logger.info(`Document created: ${document.title}`);
      return document;
    } catch (error) {
      logger.error('Error creating document:', error);
      throw error;
    }
  }

  async getDocumentById(id: string) {
    try {
      return await prisma.document.findUnique({
        where: { id },
        include: {
          user: true,
          chunks: true,
        },
      });
    } catch (error) {
      logger.error('Error getting document by ID:', error);
      throw error;
    }
  }

  async getDocumentsByUser(userId: string) {
    try {
      return await prisma.document.findMany({
        where: { uploadedBy: userId },
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting documents by user:', error);
      throw error;
    }
  }

  async getDocumentsBySubjectAndGrade(subject: string, grade: string) {
    try {
      return await prisma.document.findMany({
        where: {
          subject,
          grade,
          processingStatus: ProcessingStatus.COMPLETED,
        },
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting documents by subject and grade:', error);
      throw error;
    }
  }

  async getDocumentsByType(documentType: DocumentType) {
    try {
      return await prisma.document.findMany({
        where: {
          documentType,
          processingStatus: ProcessingStatus.COMPLETED,
        },
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting documents by type:', error);
      throw error;
    }
  }

  async updateDocument(id: string, updateData: UpdateDocumentData) {
    try {
      const document = await prisma.document.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
        },
      });

      logger.info(`Document updated: ${document.title}`);
      return document;
    } catch (error) {
      logger.error('Error updating document:', error);
      throw error;
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      await prisma.document.delete({
        where: { id },
      });
      logger.info(`Document deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  async searchDocuments(query: string, subject?: string, grade?: string, documentType?: DocumentType) {
    try {
      const where: any = {
        processingStatus: ProcessingStatus.COMPLETED,
        OR: [
          { title: { contains: query } },
          { extractedContent: { contains: query } },
        ],
      };

      if (subject) {
        where.subject = subject;
      }

      if (grade) {
        where.grade = grade;
      }

      if (documentType) {
        where.documentType = documentType;
      }

      return await prisma.document.findMany({
        where,
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error searching documents:', error);
      throw error;
    }
  }

  async getAllDocuments() {
    try {
      return await prisma.document.findMany({
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting all documents:', error);
      throw error;
    }
  }

  async updateProcessingStatus(id: string, status: ProcessingStatus) {
    try {
      return await this.updateDocument(id, { processingStatus: status });
    } catch (error) {
      logger.error('Error updating processing status:', error);
      throw error;
    }
  }

  async createDocumentChunk(documentId: string, content: string, metadata: any, chunkIndex: number) {
    try {
      const chunk = await prisma.documentChunk.create({
        data: {
          documentId,
          content,
          metadata: JSON.stringify(metadata),
          chunkIndex,
        },
      });

      logger.info(`Document chunk created for document: ${documentId}`);
      return chunk;
    } catch (error) {
      logger.error('Error creating document chunk:', error);
      throw error;
    }
  }

  async getDocumentChunks(documentId: string) {
    try {
      return await prisma.documentChunk.findMany({
        where: { documentId },
        orderBy: { chunkIndex: 'asc' },
      });
    } catch (error) {
      logger.error('Error getting document chunks:', error);
      throw error;
    }
  }
}

export default new DocumentService();
