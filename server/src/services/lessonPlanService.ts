import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateLessonPlanData {
  title: string;
  subject: string;
  grade: string;
  duration: number;
  learningOutcomes: string[];
  coreCompetencies: string[];
  values: string[];
  keyInquiryQuestions: string[];
  learningExperiences: any[];
  assessmentCriteria: any[];
  resources: string[];
  reflection?: string;
  createdBy: string;
}

export interface UpdateLessonPlanData {
  title?: string;
  subject?: string;
  grade?: string;
  duration?: number;
  learningOutcomes?: string[];
  coreCompetencies?: string[];
  values?: string[];
  keyInquiryQuestions?: string[];
  learningExperiences?: any[];
  assessmentCriteria?: any[];
  resources?: string[];
  reflection?: string;
}

export class LessonPlanService {
  async createLessonPlan(data: CreateLessonPlanData) {
    try {
      const lessonPlan = await prisma.lessonPlan.create({
        data: {
          title: data.title,
          subject: data.subject,
          grade: data.grade,
          duration: data.duration,
          learningOutcomes: JSON.stringify(data.learningOutcomes),
          coreCompetencies: JSON.stringify(data.coreCompetencies),
          values: JSON.stringify(data.values),
          keyInquiryQuestions: JSON.stringify(data.keyInquiryQuestions),
          learningExperiences: JSON.stringify(data.learningExperiences),
          assessmentCriteria: JSON.stringify(data.assessmentCriteria),
          resources: JSON.stringify(data.resources),
          reflection: data.reflection,
          createdBy: data.createdBy,
        },
        include: {
          user: true,
        },
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
      return await prisma.lessonPlan.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });
    } catch (error) {
      logger.error('Error getting lesson plan by ID:', error);
      throw error;
    }
  }

  async getLessonPlansByUser(userId: string) {
    try {
      return await prisma.lessonPlan.findMany({
        where: { createdBy: userId },
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting lesson plans by user:', error);
      throw error;
    }
  }

  async getLessonPlansBySubjectAndGrade(subject: string, grade: string) {
    try {
      return await prisma.lessonPlan.findMany({
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
      logger.error('Error getting lesson plans by subject and grade:', error);
      throw error;
    }
  }

  async updateLessonPlan(id: string, updateData: UpdateLessonPlanData) {
    try {
      const data: any = { ...updateData };
      
      if (updateData.learningOutcomes) {
        data.learningOutcomes = JSON.stringify(updateData.learningOutcomes);
      }
      
      if (updateData.coreCompetencies) {
        data.coreCompetencies = JSON.stringify(updateData.coreCompetencies);
      }
      
      if (updateData.values) {
        data.values = JSON.stringify(updateData.values);
      }

      if (updateData.keyInquiryQuestions) {
        data.keyInquiryQuestions = JSON.stringify(updateData.keyInquiryQuestions);
      }

      if (updateData.learningExperiences) {
        data.learningExperiences = JSON.stringify(updateData.learningExperiences);
      }

      if (updateData.assessmentCriteria) {
        data.assessmentCriteria = JSON.stringify(updateData.assessmentCriteria);
      }

      if (updateData.resources) {
        data.resources = JSON.stringify(updateData.resources);
      }

      const lessonPlan = await prisma.lessonPlan.update({
        where: { id },
        data,
        include: {
          user: true,
        },
      });

      logger.info(`Lesson plan updated: ${lessonPlan.title}`);
      return lessonPlan;
    } catch (error) {
      logger.error('Error updating lesson plan:', error);
      throw error;
    }
  }

  async deleteLessonPlan(id: string): Promise<void> {
    try {
      await prisma.lessonPlan.delete({
        where: { id },
      });
      logger.info(`Lesson plan deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting lesson plan:', error);
      throw error;
    }
  }

  async searchLessonPlans(query: string, subject?: string, grade?: string) {
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

      return await prisma.lessonPlan.findMany({
        where,
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error searching lesson plans:', error);
      throw error;
    }
  }

  async getAllLessonPlans() {
    try {
      return await prisma.lessonPlan.findMany({
        include: {
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting all lesson plans:', error);
      throw error;
    }
  }
}

export default new LessonPlanService();
