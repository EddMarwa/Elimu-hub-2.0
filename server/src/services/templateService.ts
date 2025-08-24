import { PrismaClient, TemplateType } from '../generated/prisma';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateTemplateData {
  name: string;
  type: TemplateType;
  subject?: string;
  grade?: string;
  content: any;
  isDefault?: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  type?: TemplateType;
  subject?: string;
  grade?: string;
  content?: any;
  isDefault?: boolean;
}

export class TemplateService {
  async createTemplate(data: CreateTemplateData) {
    try {
      const template = await prisma.template.create({
        data: {
          name: data.name,
          type: data.type,
          subject: data.subject,
          grade: data.grade,
          content: JSON.stringify(data.content),
          isDefault: data.isDefault || false,
        },
      });

      logger.info(`Template created: ${template.name}`);
      return template;
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  }

  async getTemplateById(id: string) {
    try {
      return await prisma.template.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Error getting template by ID:', error);
      throw error;
    }
  }

  async getTemplatesByType(type: TemplateType) {
    try {
      return await prisma.template.findMany({
        where: { type },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting templates by type:', error);
      throw error;
    }
  }

  async getTemplatesBySubjectAndGrade(subject: string, grade: string, type?: TemplateType) {
    try {
      const where: any = {
        subject,
        grade,
      };

      if (type) {
        where.type = type;
      }

      return await prisma.template.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting templates by subject and grade:', error);
      throw error;
    }
  }

  async getDefaultTemplates(type?: TemplateType) {
    try {
      const where: any = {
        isDefault: true,
      };

      if (type) {
        where.type = type;
      }

      return await prisma.template.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting default templates:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, updateData: UpdateTemplateData) {
    try {
      const data: any = { ...updateData };
      
      if (updateData.content) {
        data.content = JSON.stringify(updateData.content);
      }

      const template = await prisma.template.update({
        where: { id },
        data,
      });

      logger.info(`Template updated: ${template.name}`);
      return template;
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      await prisma.template.delete({
        where: { id },
      });
      logger.info(`Template deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting template:', error);
      throw error;
    }
  }

  async searchTemplates(query: string, type?: TemplateType) {
    try {
      const where: any = {
        OR: [
          { name: { contains: query } },
        ],
      };

      if (type) {
        where.type = type;
      }

      return await prisma.template.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error searching templates:', error);
      throw error;
    }
  }

  async getAllTemplates() {
    try {
      return await prisma.template.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting all templates:', error);
      throw error;
    }
  }
}

export default new TemplateService();
