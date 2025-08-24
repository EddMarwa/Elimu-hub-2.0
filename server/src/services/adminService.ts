import { PrismaClient, User } from '../generated/prisma';
import { UserRole, UserStatus, AuditAction } from '../types/enums';
import logger from '../utils/logger';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface CreateAdminUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole.ADMIN | UserRole.SUPER_ADMIN;
  school?: string;
  county?: string;
  subjects?: string[];
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  school?: string;
  county?: string;
  subjects?: string[];
  status?: UserStatus;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  school?: string | null;
  county?: string | null;
  subjects?: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    documents: number;
    schemesOfWork: number;
    lessonPlans: number;
    libraryFiles: number;
  };
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  school?: string;
  county?: string;
  search?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalDocuments: number;
  totalSchemesOfWork: number;
  totalLessonPlans: number;
  totalLibraryFiles: number;
  roleDistribution: Record<UserRole, number>;
  statusDistribution: Record<UserStatus, number>;
  recentActivity: any[];
}

export class AdminService {
  /**
   * Create a new admin user (only SUPER_ADMIN can create ADMIN users)
   */
  async createAdminUser(data: CreateAdminUserData, createdBy: string): Promise<User> {
    try {
      // Verify the creator has permission
      const creator = await prisma.user.findUnique({
        where: { id: createdBy },
        select: { role: true }
      });

      if (!creator) {
        throw new Error('Creator not found');
      }

      if (creator.role === UserRole.TEACHER) {
        throw new Error('Teachers cannot create admin users');
      }

      if (creator.role === UserRole.ADMIN && data.role === UserRole.SUPER_ADMIN) {
        throw new Error('ADMIN users cannot create SUPER_ADMIN users');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      const adminUser = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          school: data.school,
          county: data.county,
          subjects: data.subjects ? JSON.stringify(data.subjects) : null,
          status: UserStatus.ACTIVE,
        },
      });

      // Log the action
      await this.logAuditAction(createdBy, AuditAction.CREATE_USER, 'User', adminUser.id, {
        action: 'Created admin user',
        userRole: data.role,
        userEmail: data.email
      });

      logger.info(`Admin user created: ${adminUser.email} by ${createdBy}`);
      return adminUser;
    } catch (error) {
      logger.error('Error creating admin user:', error);
      throw error;
    }
  }

  /**
   * Get all users with filtering and pagination
   */
  async getAllUsers(filters: UserFilters = {}, page = 1, limit = 20): Promise<{ users: UserWithoutPassword[], total: number, page: number, totalPages: number }> {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where: any = {};
      
      if (filters.role) where.role = filters.role;
      if (filters.status) where.status = filters.status;
      if (filters.school) where.school = { contains: filters.school, mode: 'insensitive' };
      if (filters.county) where.county = { contains: filters.county, mode: 'insensitive' };
      
      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { school: { contains: filters.search, mode: 'insensitive' } },
        ];
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
                documents: true,
                schemesOfWork: true,
                lessonPlans: true,
                libraryFiles: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Update user information (admin only)
   */
  async updateUser(userId: string, updateData: UpdateUserData, updatedBy: string): Promise<User> {
    try {
      // Verify the updater has permission
      const updater = await prisma.user.findUnique({
        where: { id: updatedBy },
        select: { role: true }
      });

      if (!updater) {
        throw new Error('Updater not found');
      }

      if (updater.role === UserRole.TEACHER) {
        throw new Error('Teachers cannot update other users');
      }

      // Prevent role escalation
      if (updateData.role) {
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });

        if (targetUser && updater.role === UserRole.ADMIN) {
          if (updateData.role === UserRole.SUPER_ADMIN || targetUser.role === UserRole.SUPER_ADMIN) {
            throw new Error('ADMIN users cannot modify SUPER_ADMIN roles');
          }
        }
      }

      const data: any = { ...updateData };
      
      if (updateData.subjects) {
        data.subjects = JSON.stringify(updateData.subjects);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
      });

      // Log the action
      await this.logAuditAction(updatedBy, AuditAction.UPDATE_USER, 'User', userId, {
        action: 'Updated user',
        updatedFields: Object.keys(updateData),
        userEmail: updatedUser.email
      });

      logger.info(`User updated: ${updatedUser.email} by ${updatedBy}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Change user status (activate/deactivate/suspend)
   */
  async changeUserStatus(userId: string, status: UserStatus, changedBy: string): Promise<User> {
    try {
      // Verify the changer has permission
      const changer = await prisma.user.findUnique({
        where: { id: changedBy },
        select: { role: true }
      });

      if (!changer) {
        throw new Error('Changer not found');
      }

      if (changer.role === UserRole.TEACHER) {
        throw new Error('Teachers cannot change user status');
      }

      // Prevent status changes on SUPER_ADMIN users by ADMIN users
      if (changer.role === UserRole.ADMIN) {
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });

        if (targetUser?.role === UserRole.SUPER_ADMIN) {
          throw new Error('ADMIN users cannot change SUPER_ADMIN status');
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status },
      });

      // Log the action
      await this.logAuditAction(changedBy, AuditAction.UPDATE_USER, 'User', userId, {
        action: 'Changed user status',
        newStatus: status,
        userEmail: updatedUser.email
      });

      logger.info(`User status changed: ${updatedUser.email} to ${status} by ${changedBy}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error changing user status:', error);
      throw error;
    }
  }

  /**
   * Delete user (only SUPER_ADMIN can delete users)
   */
  async deleteUser(userId: string, deletedBy: string): Promise<void> {
    try {
      // Verify the deleter has permission
      const deleter = await prisma.user.findUnique({
        where: { id: deletedBy },
        select: { role: true }
      });

      if (!deleter) {
        throw new Error('Deleter not found');
      }

      if (deleter.role !== UserRole.SUPER_ADMIN) {
        throw new Error('Only SUPER_ADMIN users can delete users');
      }

      // Prevent self-deletion
      if (userId === deletedBy) {
        throw new Error('Cannot delete your own account');
      }

      // Get user info before deletion for audit log
      const userToDelete = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, role: true }
      });

      if (!userToDelete) {
        throw new Error('User to delete not found');
      }

      // Prevent deletion of other SUPER_ADMIN users
      if (userToDelete.role === UserRole.SUPER_ADMIN) {
        throw new Error('Cannot delete other SUPER_ADMIN users');
      }

      // Log the action before deletion
      await this.logAuditAction(deletedBy, AuditAction.DELETE_USER, 'User', userId, {
        action: 'Deleted user',
        userEmail: userToDelete.email,
        userRole: userToDelete.role
      });

      // Delete the user (this will cascade to related records)
      await prisma.user.delete({
        where: { id: userId },
      });

      logger.info(`User deleted: ${userToDelete.email} by ${deletedBy}`);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get system statistics and overview
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      const [
        totalUsers,
        totalDocuments,
        totalSchemesOfWork,
        totalLessonPlans,
        totalLibraryFiles,
        roleDistribution,
        statusDistribution,
        recentActivity
      ] = await Promise.all([
        prisma.user.count(),
        prisma.document.count(),
        prisma.schemeOfWork.count(),
        prisma.lessonPlan.count(),
        prisma.libraryFile.count(),
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true }
        }),
        prisma.user.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        prisma.auditLog.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        })
      ]);

      const roleCounts = roleDistribution.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<UserRole, number>);

      const statusCounts = statusDistribution.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<UserStatus, number>);

      return {
        totalUsers,
        totalDocuments,
        totalSchemesOfWork,
        totalLessonPlans,
        totalLibraryFiles,
        roleDistribution: roleCounts,
        statusDistribution: statusCounts,
        recentActivity
      };
    } catch (error) {
      logger.error('Error getting system stats:', error);
      throw error;
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: any = {}, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {};
      if (filters.action) where.action = filters.action;
      if (filters.entityType) where.entityType = filters.entityType;
      if (filters.userId) where.userId = filters.userId;
      if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
      if (filters.endDate) where.createdAt = { lte: new Date(filters.endDate) };

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        logs,
        total,
        page,
        totalPages
      };
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Log audit actions
   */
  private async logAuditAction(
    userId: string,
    action: AuditAction,
    entityType: string,
    entityId: string,
    details?: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          userId,
          details: details ? JSON.stringify(details) : null,
          ipAddress: null, // Could be added from request context
          userAgent: null, // Could be added from request context
        },
      });
    } catch (error) {
      logger.error('Error logging audit action:', error);
      // Don't throw here as it's not critical for the main operation
    }
  }

  /**
   * Check if user has admin permissions
   */
  async hasAdminPermission(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      return user ? [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role as UserRole) : false;
    } catch (error) {
      logger.error('Error checking admin permission:', error);
      return false;
    }
  }

  /**
   * Check if user has super admin permissions
   */
  async hasSuperAdminPermission(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      return user ? user.role === UserRole.SUPER_ADMIN : false;
    } catch (error) {
      logger.error('Error checking super admin permission:', error);
      return false;
    }
  }
}

export default new AdminService();
