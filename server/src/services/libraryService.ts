import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export interface CreateLibrarySectionData {
  name: string;
  description?: string;
  order?: number;
}

export interface CreateLibrarySubfolderData {
  name: string;
  sectionId: string;
  metadata?: any;
  order?: number;
}

export interface CreateLibraryFileData {
  filename: string;
  originalName: string;
  filePath: string;
  fileType: 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOCUMENT';
  fileSize: number;
  mimeType: string;
  sectionId: string;
  subfolderId?: string;
  uploadedBy: string;
  description?: string;
  tags?: string[];
  metadata?: any;
}

export interface LibraryStats {
  totalUploads: number;
  pendingDocuments: number;
  approvedDocuments: number;
  totalUsers: number;
  adminUsers: number;
  teacherUsers: number;
}

export class LibraryService {
  async getSectionById(id: string) {
    try {
      return await prisma.librarySection.findUnique({ where: { id } });
    } catch (error) {
      logger.error('Error fetching library section by id:', error);
      throw error;
    }
  }

  async getSubfolderById(id: string) {
    try {
      return await prisma.librarySubfolder.findUnique({ where: { id } });
    } catch (error) {
      logger.error('Error fetching library subfolder by id:', error);
      throw error;
    }
  }
  // Section Management
  async createSection(data: CreateLibrarySectionData) {
    try {
      const section = await prisma.librarySection.create({
        data: {
          name: data.name,
          description: data.description,
          order: data.order || 0,
        },
      });
      logger.info(`Library section created: ${section.name}`);
      return section;
    } catch (error) {
      logger.error('Error creating library section:', error);
      throw error;
    }
  }

  async getAllSections() {
    try {
      return await prisma.librarySection.findMany({
        where: { isActive: true },
        include: {
          subfolders: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              files: {
                where: { status: 'APPROVED' },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      logger.error('Error getting library sections:', error);
      throw error;
    }
  }

  async updateSection(id: string, data: Partial<CreateLibrarySectionData>) {
    try {
      return await prisma.librarySection.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Error updating library section:', error);
      throw error;
    }
  }

  async deleteSection(id: string) {
    try {
      // Soft delete by setting isActive to false
      await prisma.librarySection.update({
        where: { id },
        data: { isActive: false },
      });
      logger.info(`Library section deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting library section:', error);
      throw error;
    }
  }

  // Subfolder Management
  async createSubfolder(data: CreateLibrarySubfolderData) {
    try {
      const subfolder = await prisma.librarySubfolder.create({
        data: {
          name: data.name,
          sectionId: data.sectionId,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          order: data.order || 0,
        },
      });
      logger.info(`Library subfolder created: ${subfolder.name}`);
      return subfolder;
    } catch (error) {
      logger.error('Error creating library subfolder:', error);
      throw error;
    }
  }

  async getSubfoldersBySection(sectionId: string) {
    try {
      return await prisma.librarySubfolder.findMany({
        where: { sectionId, isActive: true },
        include: {
          _count: {
            select: {
              files: {
                where: { status: 'APPROVED' },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      });
    } catch (error) {
      logger.error('Error getting subfolders by section:', error);
      throw error;
    }
  }

  async updateSubfolder(id: string, data: Partial<CreateLibrarySubfolderData>) {
    try {
      const updateData: any = { ...data };
      if (data.metadata) {
        updateData.metadata = JSON.stringify(data.metadata);
      }
      return await prisma.librarySubfolder.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      logger.error('Error updating library subfolder:', error);
      throw error;
    }
  }

  async deleteSubfolder(id: string) {
    try {
      await prisma.librarySubfolder.update({
        where: { id },
        data: { isActive: false },
      });
      logger.info(`Library subfolder deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting library subfolder:', error);
      throw error;
    }
  }

  // File Management
  async uploadFile(data: CreateLibraryFileData) {
    try {
      const file = await prisma.libraryFile.create({
        data: {
          filename: data.filename,
          originalName: data.originalName,
          filePath: data.filePath,
          fileType: data.fileType,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          sectionId: data.sectionId,
          subfolderId: data.subfolderId,
          uploadedBy: data.uploadedBy,
          description: data.description,
          tags: data.tags ? JSON.stringify(data.tags) : null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          section: true,
          subfolder: true,
        },
      });
      logger.info(`Library file uploaded: ${file.originalName}`);
      return file;
    } catch (error) {
      logger.error('Error uploading library file:', error);
      throw error;
    }
  }

  async getFilesBySection(
    sectionId: string,
    subfolderId?: string,
    userRole?: string,
    limit?: number,
    offset?: number,
    tags?: string[],
    searchQuery?: string
  ) {
    try {
      const where: any = { sectionId };
      
      if (subfolderId) {
        where.subfolderId = subfolderId;
      }

      // Normal users can only see approved files
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        where.status = 'APPROVED';
      }

      // Filter by tags (stored as JSON string); use substring contains for each tag
      if (tags && tags.length > 0) {
        where.AND = (where.AND || []).concat(tags.map((tag) => ({
          tags: { contains: `"${tag}"` }
        })));
      }

      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.trim();
        where.AND = (where.AND || []).concat({
          OR: [
            { originalName: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { tags: { contains: q } },
          ]
        });
      }

      const files = await prisma.libraryFile.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          section: true,
          subfolder: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.libraryFile.count({ where });

      return { files, total };
    } catch (error) {
      logger.error('Error getting files by section:', error);
      throw error;
    }
  }

  async getAllFiles(
    userRole?: string,
    status?: string,
    limit?: number,
    offset?: number,
    tags?: string[],
    searchQuery?: string
  ) {
    try {
      const where: any = {};

      if (status) {
        where.status = status;
      } else if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        where.status = 'APPROVED';
      }

      if (tags && tags.length > 0) {
        where.AND = (where.AND || []).concat(tags.map((tag) => ({
          tags: { contains: `"${tag}"` }
        })));
      }

      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.trim();
        where.AND = (where.AND || []).concat({
          OR: [
            { originalName: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { tags: { contains: q } },
          ]
        });
      }

      const files = await prisma.libraryFile.findMany({
        where,
        include: {
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          section: true,
          subfolder: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await prisma.libraryFile.count({ where });

      return { files, total };
    } catch (error) {
      logger.error('Error getting all files:', error);
      throw error;
    }
  }

  async approveFile(fileId: string, approvedBy: string) {
    try {
      const file = await prisma.libraryFile.update({
        where: { id: fileId },
        data: {
          status: 'APPROVED',
          approvedBy,
        },
        include: {
          uploader: true,
          section: true,
        },
      });
      logger.info(`File approved: ${file.originalName} by ${approvedBy}`);
      return file;
    } catch (error) {
      logger.error('Error approving file:', error);
      throw error;
    }
  }

  async declineFile(fileId: string, approvedBy: string) {
    try {
      const file = await prisma.libraryFile.update({
        where: { id: fileId },
        data: {
          status: 'DECLINED',
          approvedBy,
        },
        include: {
          uploader: true,
          section: true,
        },
      });
      logger.info(`File declined: ${file.originalName} by ${approvedBy}`);
      return file;
    } catch (error) {
      logger.error('Error declining file:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string) {
    try {
      const file = await prisma.libraryFile.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new Error('File not found');
      }

      // Delete physical file
      try {
        await fs.unlink(file.filePath);
      } catch (error) {
        logger.warn(`Could not delete physical file: ${file.filePath}`);
      }

      // Delete database record
      await prisma.libraryFile.delete({
        where: { id: fileId },
      });

      logger.info(`File deleted: ${file.originalName}`);
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }

  // Analytics
  async getLibraryStats(): Promise<LibraryStats> {
    try {
      const [totalUploads, pendingDocuments, approvedDocuments, userCounts] = await Promise.all([
        prisma.libraryFile.count(),
        prisma.libraryFile.count({ where: { status: 'PENDING' } }),
        prisma.libraryFile.count({ where: { status: 'APPROVED' } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
      ]);

      const totalUsers = userCounts.reduce((sum, group) => sum + group._count, 0);
      const adminUsers = userCounts.find(g => g.role === 'ADMIN')?._count || 0;
      const superAdminUsers = userCounts.find(g => g.role === 'SUPER_ADMIN')?._count || 0;
      const teacherUsers = userCounts.find(g => g.role === 'TEACHER')?._count || 0;

      return {
        totalUploads,
        pendingDocuments,
        approvedDocuments,
        totalUsers,
        adminUsers: adminUsers + superAdminUsers,
        teacherUsers,
      };
    } catch (error) {
      logger.error('Error getting library stats:', error);
      throw error;
    }
  }

  async getRecentActivity(limit: number = 10) {
    try {
      return await prisma.libraryFile.findMany({
        include: {
          uploader: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          section: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      throw error;
    }
  }
}

export default new LibraryService();
