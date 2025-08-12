import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';
import fs from 'fs/promises';

const prisma = new PrismaClient();

export interface CreateLessonPlanData {
  title: string;
  description: string;
  grade: string;
  subject: string;
  tags: string; // JSON string for storing tags array
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  folderId?: string;
}

export interface CreateFolderData {
  name: string;
  description?: string;
  parentId?: string;
}

export interface CreateCommentData {
  content: string;
  rating: number;
  userId: string;
  lessonPlanId: string;
}

export class LessonPlanService {
  async createLessonPlan(data: CreateLessonPlanData) {
    try {
      const lessonPlan = await prisma.lessonPlan.create({
        data,
        include: { user: true },
      });
      logger.info(`Lesson plan created: ${lessonPlan.title}`);
      return lessonPlan;
    } catch (error) {
      logger.error('Error creating lesson plan:', error);
      throw error;
    }
  }

  async getLessonPlanById(id: string) {
    try {
      return await prisma.lessonPlan.findUnique({ where: { id }, include: { user: true } });
    } catch (error) {
      logger.error('Error getting lesson plan by ID:', error);
      throw error;
    }
  }

  async getLessonPlans(filter: any = {}, skip = 0, take = 20, sortBy = 'newest') {
    try {
      let orderBy: any = { createdAt: 'desc' };
      
      switch (sortBy) {
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'title':
          orderBy = { title: 'asc' };
          break;
        case 'downloads':
          orderBy = { downloads: 'desc' };
          break;
        case 'rating':
          orderBy = { rating: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      const [total, lessonPlans] = await Promise.all([
        prisma.lessonPlan.count({ where: filter }),
        prisma.lessonPlan.findMany({ 
          where: filter, 
          skip, 
          take, 
          orderBy,
          include: { 
            user: true,
            folder: true,
            _count: {
              select: { comments: true }
            }
          }
        })
      ]);
      
      // Calculate average rating and review count
      const lessonPlansWithStats = await Promise.all(
        lessonPlans.map(async (lp) => {
          const comments = await prisma.comment.findMany({
            where: { lessonPlanId: lp.id },
            select: { rating: true }
          });
          
          const avgRating = comments.length > 0 
            ? comments.reduce((sum, c) => sum + c.rating, 0) / comments.length 
            : 0;
          
          return {
            ...lp,
            rating: avgRating,
            reviewCount: comments.length
          };
        })
      );
      
      return { total, lessonPlans: lessonPlansWithStats };
    } catch (error) {
      logger.error('Error getting lesson plans:', error);
      throw error;
    }
  }

  async updateLessonPlan(id: string, updateData: Partial<CreateLessonPlanData>) {
    try {
      const lessonPlan = await prisma.lessonPlan.update({
        where: { id },
        data: updateData,
        include: { user: true },
      });
      logger.info(`Lesson plan updated: ${lessonPlan.title}`);
      return lessonPlan;
    } catch (error) {
      logger.error('Error updating lesson plan:', error);
      throw error;
    }
  }

  async deleteLessonPlan(id: string) {
    try {
      const lessonPlan = await prisma.lessonPlan.findUnique({ where: { id } });
      if (!lessonPlan) throw new Error('Lesson plan not found');
      // Delete physical file
      try {
        await fs.unlink(lessonPlan.fileUrl);
      } catch (error) {
        logger.warn(`Could not delete physical file: ${lessonPlan.fileUrl}`);
      }
      await prisma.lessonPlan.delete({ where: { id } });
      logger.info(`Lesson plan deleted: ${lessonPlan.title}`);
    } catch (error) {
      logger.error('Error deleting lesson plan:', error);
      throw error;
    }
  }

  async bulkDeleteLessonPlans(ids: string[]) {
    try {
      const lessonPlans = await prisma.lessonPlan.findMany({ where: { id: { in: ids } } });
      for (const lp of lessonPlans) {
        try {
          await fs.unlink(lp.fileUrl);
        } catch (error) {
          logger.warn(`Could not delete physical file: ${lp.fileUrl}`);
        }
      }
      await prisma.lessonPlan.deleteMany({ where: { id: { in: ids } } });
      logger.info(`Bulk deleted lesson plans: ${ids.join(', ')}`);
    } catch (error) {
      logger.error('Error bulk deleting lesson plans:', error);
      throw error;
    }
  }

  // Folder methods
  async createFolder(data: CreateFolderData) {
    try {
      const folder = await prisma.folder.create({ data });
      logger.info(`Folder created: ${folder.name}`);
      return folder;
    } catch (error) {
      logger.error('Error creating folder:', error);
      throw error;
    }
  }

  async getFolders() {
    try {
      const folders = await prisma.folder.findMany({
        include: {
          _count: {
            select: { lessonPlans: true }
          }
        }
      });
      
      return folders.map(folder => ({
        ...folder,
        lessonPlanCount: folder._count.lessonPlans
      }));
    } catch (error) {
      logger.error('Error getting folders:', error);
      throw error;
    }
  }

  async updateFolder(id: string, data: Partial<CreateFolderData>) {
    try {
      const folder = await prisma.folder.update({
        where: { id },
        data
      });
      logger.info(`Folder updated: ${folder.name}`);
      return folder;
    } catch (error) {
      logger.error('Error updating folder:', error);
      throw error;
    }
  }

  async deleteFolder(id: string) {
    try {
      // Check if folder has lesson plans
      const lessonPlans = await prisma.lessonPlan.findMany({ where: { folderId: id } });
      if (lessonPlans.length > 0) {
        throw new Error('Cannot delete folder with lesson plans');
      }
      
      await prisma.folder.delete({ where: { id } });
      logger.info(`Folder deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting folder:', error);
      throw error;
    }
  }

  // Comment methods
  async addComment(data: CreateCommentData) {
    try {
      const comment = await prisma.comment.create({
        data,
        include: { user: true }
      });
      logger.info(`Comment added to lesson plan: ${data.lessonPlanId}`);
      return comment;
    } catch (error) {
      logger.error('Error adding comment:', error);
      throw error;
    }
  }

  async getComments(lessonPlanId: string) {
    try {
      return await prisma.comment.findMany({
        where: { lessonPlanId },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Error getting comments:', error);
      throw error;
    }
  }

  async updateComment(id: string, data: Partial<CreateCommentData>) {
    try {
      const comment = await prisma.comment.update({
        where: { id },
        data,
        include: { user: true }
      });
      logger.info(`Comment updated: ${id}`);
      return comment;
    } catch (error) {
      logger.error('Error updating comment:', error);
      throw error;
    }
  }

  async deleteComment(id: string) {
    try {
      await prisma.comment.delete({ where: { id } });
      logger.info(`Comment deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting comment:', error);
      throw error;
    }
  }

  // Download tracking
  async incrementDownloads(id: string) {
    try {
      await prisma.lessonPlan.update({
        where: { id },
        data: { downloads: { increment: 1 } }
      });
    } catch (error) {
      logger.error('Error incrementing downloads:', error);
    }
  }
}

export default new LessonPlanService();
