import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
  school?: string;
  county?: string;
  subjects?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN';
  school?: string;
  county?: string;
  subjects?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  password?: string;
}

export interface AuditLogData {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class UserManagementService {
  // User CRUD Operations
  async createUser(data: CreateUserData, createdBy: string) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          password: hashedPassword,
          role: data.role || 'TEACHER',
          school: data.school,
          county: data.county,
          subjects: data.subjects ? JSON.stringify(data.subjects) : null,
          status: data.status || 'ACTIVE',
        },
      });

      // Log the action
      await this.createAuditLog({
        action: 'CREATE_USER',
        entityType: 'User',
        entityId: user.id,
        userId: createdBy,
        details: {
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });

      logger.info(`User created: ${user.email} by ${createdBy}`);
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
    status?: string
  ) {
    try {
      const offset = (page - 1) * limit;
      const where: any = {};

      if (search) {
        where.OR = [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { school: { contains: search } },
        ];
      }

      if (role) {
        where.role = role;
      }

      if (status) {
        where.status = status;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            school: true,
            county: true,
            subjects: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                lessonPlans: true,
                schemesOfWork: true,
                libraryFiles: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users: users.map(user => ({
          ...user,
          subjects: user.subjects ? JSON.parse(user.subjects) : [],
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async getUserById(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          school: true,
          county: true,
          subjects: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              lessonPlans: true,
              schemesOfWork: true,
              libraryFiles: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        ...user,
        subjects: user.subjects ? JSON.parse(user.subjects) : [],
      };
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserData, updatedBy: string) {
    try {
      const updateData: any = { ...data };

      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 12);
      }

      if (data.subjects) {
        updateData.subjects = JSON.stringify(data.subjects);
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      // Log the action
      await this.createAuditLog({
        action: 'UPDATE_USER',
        entityType: 'User',
        entityId: user.id,
        userId: updatedBy,
        details: {
          changes: data,
        },
      });

      logger.info(`User updated: ${user.email} by ${updatedBy}`);
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string, deletedBy: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { email: true, role: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Prevent deletion of SUPER_ADMIN users by non-SUPER_ADMIN users
      const deletingUser = await prisma.user.findUnique({
        where: { id: deletedBy },
        select: { role: true },
      });

      if (user.role === 'SUPER_ADMIN' && deletingUser?.role !== 'SUPER_ADMIN') {
        throw new Error('Only SUPER_ADMIN can delete SUPER_ADMIN users');
      }

      await prisma.user.delete({
        where: { id },
      });

      // Log the action
      await this.createAuditLog({
        action: 'DELETE_USER',
        entityType: 'User',
        entityId: id,
        userId: deletedBy,
        details: {
          email: user.email,
          role: user.role,
        },
      });

      logger.info(`User deleted: ${user.email} by ${deletedBy}`);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // Audit Log Management
  async createAuditLog(data: AuditLogData) {
    try {
      return await prisma.auditLog.create({
        data: {
          action: data.action as any,
          entityType: data.entityType,
          entityId: data.entityId,
          userId: data.userId,
          details: data.details ? JSON.stringify(data.details) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      logger.error('Error creating audit log:', error);
      throw error;
    }
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 20,
    entityType?: string,
    action?: string,
    userId?: string
  ) {
    try {
      const offset = (page - 1) * limit;
      const where: any = {};

      if (entityType) {
        where.entityType = entityType;
      }

      if (action) {
        where.action = action;
      }

      if (userId) {
        where.userId = userId;
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.auditLog.count({ where }),
      ]);

      return {
        logs: logs.map(log => ({
          ...log,
          details: log.details ? JSON.parse(log.details) : null,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  // User Statistics
  async getUserStats() {
    try {
      const [totalUsers, activeUsers, usersByRole, recentUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
        prisma.user.findMany({
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      return {
        totalUsers,
        activeUsers,
        suspendedUsers: await prisma.user.count({ where: { status: 'SUSPENDED' } }),
        inactiveUsers: await prisma.user.count({ where: { status: 'INACTIVE' } }),
        usersByRole: usersByRole.reduce((acc, group) => {
          acc[group.role] = group._count;
          return acc;
        }, {} as Record<string, number>),
        recentUsers,
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Utility Methods
  private sanitizeUser(user: any) {
    const { password, ...sanitizedUser } = user;
    return {
      ...sanitizedUser,
      subjects: user.subjects ? JSON.parse(user.subjects) : [],
    };
  }

  async validateAdminPermissions(userId: string, requiredRole: string = 'ADMIN') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, status: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== 'ACTIVE') {
        throw new Error('User account is not active');
      }

      if (requiredRole === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new Error('Super admin permissions required');
      }

      if (requiredRole === 'ADMIN' && !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        throw new Error('Admin permissions required');
      }

      return true;
    } catch (error) {
      logger.error('Error validating admin permissions:', error);
      throw error;
    }
  }
}

export default new UserManagementService();
