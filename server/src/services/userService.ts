import { PrismaClient, User, UserRole } from '../generated/prisma';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  school?: string;
  county?: string;
  subjects?: string[];
}

export interface LoginData {
  email: string;
  password: string;
}

export class UserService {
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || UserRole.TEACHER,
          school: userData.school,
          county: userData.county,
          subjects: userData.subjects ? JSON.stringify(userData.subjects) : null,
        },
      });

      logger.info(`User created: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('Error validating password:', error);
      throw error;
    }
  }

  async updateUser(id: string, updateData: Partial<CreateUserData>): Promise<User> {
    try {
      const data: any = { ...updateData };
      
      if (updateData.password) {
        data.password = await bcrypt.hash(updateData.password, 10);
      }
      
      if (updateData.subjects) {
        data.subjects = JSON.stringify(updateData.subjects);
      }

      const user = await prisma.user.update({
        where: { id },
        data,
      });

      logger.info(`User updated: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      logger.info(`User deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }
}

export default new UserService();
