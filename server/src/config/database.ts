import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('✅ Connected to SQLite database successfully');
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('🔍 Database connection test passed');
    
  } catch (error) {
    logger.error('Failed to connect to SQLite database:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Disconnected from SQLite database');
  } catch (error) {
    logger.error('Error disconnecting from SQLite database:', error);
    throw error;
  }
};

export { prisma };
export default prisma;