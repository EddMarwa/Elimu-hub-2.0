import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateSchemeOfWorkData {
  title: string;
  subject: string;
  grade: string;
  term: number;
  strand?: string;
  subStrand?: string;
  duration?: string;
  weeks: any[];
  overallObjectives: string[];
  coreCompetencies?: string[];
  values?: string[];
  resources?: string[];
  createdBy: string;
}

export interface UpdateSchemeOfWorkData {
  title?: string;
  subject?: string;
  grade?: string;
  term?: number;
  weeks?: any[];
  overallObjectives?: string[];
  coreCompetencies?: string[];
  values?: string[];
}

export class SchemeOfWorkService {
  async createSchemeOfWork(data: CreateSchemeOfWorkData) {
    try {
      const schemeOfWork = await prisma.schemeOfWork.create({
        data: {
          title: data.title,
          subject: data.subject,
          grade: data.grade,
          term: String(data.term),
          strand: data.strand || '',
          subStrand: data.subStrand,
          duration: data.duration || '1 term',
          weeks: typeof data.weeks === 'number' ? data.weeks : (Array.isArray(data.weeks) ? data.weeks.length : 12),
          generalObjectives: JSON.stringify(data.overallObjectives || []),
          weeklyPlans: JSON.stringify(data.weeks || []),
          resources: JSON.stringify(data.resources || []),
          createdBy: data.createdBy,
        },
        include: {
          user: true,
        },
      });

      logger.info(`Scheme of work created: ${schemeOfWork.title}`);
      return schemeOfWork;
    } catch (error) {
      logger.error('Error creating scheme of work:', error);
      throw error;
    }
  }

  async getSchemeOfWorkById(id: string) {
    try {
      return await prisma.schemeOfWork.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });
    } catch (error) {
      logger.error('Error getting scheme of work by ID:', error);
      throw error;
    }
  }

  async getSchemeOfWorksByUser(userId: string) {
    try {
      return await prisma.schemeOfWork.findMany({
        where: { createdBy: userId },
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting schemes of work by user:', error);
      throw error;
    }
  }

  async getSchemeOfWorksBySubjectAndGrade(subject: string, grade: string) {
    try {
      return await prisma.schemeOfWork.findMany({
        where: {
          subject,
          grade,
        },
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting schemes of work by subject and grade:', error);
      throw error;
    }
  }

  async updateSchemeOfWork(id: string, updateData: UpdateSchemeOfWorkData) {
    try {
      const data: any = { ...updateData };
      
      if (updateData.weeks) {
        data.weeks = JSON.stringify(updateData.weeks);
      }

      if (updateData.overallObjectives) {
        data.overallObjectives = JSON.stringify(updateData.overallObjectives);
      }

      if (updateData.coreCompetencies) {
        data.coreCompetencies = JSON.stringify(updateData.coreCompetencies);
      }

      if (updateData.values) {
        data.values = JSON.stringify(updateData.values);
      }

      const schemeOfWork = await prisma.schemeOfWork.update({
        where: { id },
        data,
        include: {
          user: true,
        },
      });

      logger.info(`Scheme of work updated: ${schemeOfWork.title}`);
      return schemeOfWork;
    } catch (error) {
      logger.error('Error updating scheme of work:', error);
      throw error;
    }
  }

  async deleteSchemeOfWork(id: string): Promise<void> {
    try {
      await prisma.schemeOfWork.delete({
        where: { id },
      });
      logger.info(`Scheme of work deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting scheme of work:', error);
      throw error;
    }
  }

  async searchSchemesOfWork(query: string, subject?: string, grade?: string) {
    try {
      const where: any = {
        OR: [
          { title: { contains: query } },
        ],
      };

      if (subject) {
        where.subject = subject;
      }

      if (grade) {
        where.grade = grade;
      }

      return await prisma.schemeOfWork.findMany({
        where,
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error searching schemes of work:', error);
      throw error;
    }
  }

  async getAllSchemesOfWork() {
    try {
      return await prisma.schemeOfWork.findMany({
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting all schemes of work:', error);
      throw error;
    }
  }
}

export default new SchemeOfWorkService();
