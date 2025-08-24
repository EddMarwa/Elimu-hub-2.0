import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../generated/prisma';
import adminService from '../services/adminService';
import logger from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        firstName: string;
        lastName: string;
      };
    }
  }
}

/**
 * Middleware to check if user has admin permissions (ADMIN or SUPER_ADMIN)
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const hasPermission = await adminService.hasAdminPermission(req.user.id);
    
    if (!hasPermission) {
      logger.warn(`Unauthorized admin access attempt by user: ${req.user.email} (${req.user.role})`);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    logger.info(`Admin access granted to user: ${req.user.email} (${req.user.role})`);
    next();
  } catch (error) {
    logger.error('Error in admin middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to check if user has super admin permissions (SUPER_ADMIN only)
 */
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const hasPermission = await adminService.hasSuperAdminPermission(req.user.id);
    
    if (!hasPermission) {
      logger.warn(`Unauthorized super admin access attempt by user: ${req.user.email} (${req.user.role})`);
      return res.status(403).json({
        success: false,
        message: 'Super Admin access required'
      });
    }

    logger.info(`Super admin access granted to user: ${req.user.email} (${req.user.role})`);
    next();
  } catch (error) {
    logger.error('Error in super admin middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to check if user can modify another user
 * ADMIN can modify TEACHER users
 * SUPER_ADMIN can modify ADMIN and TEACHER users
 */
export const canModifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID required'
      });
    }

    // Users can always modify themselves
    if (targetUserId === req.user.id) {
      return next();
    }

    // Check if user has admin permissions
    const hasAdminPermission = await adminService.hasAdminPermission(req.user.id);
    
    if (!hasAdminPermission) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to modify other users'
      });
    }

    // Get target user's role
    const { PrismaClient } = require('../generated/prisma');
    const prisma = new PrismaClient();
    
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true }
    });

    await prisma.$disconnect();

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // Check modification permissions
    if (req.user.role === UserRole.ADMIN) {
      // ADMIN can only modify TEACHER users
      if (targetUser.role !== UserRole.TEACHER) {
        return res.status(403).json({
          success: false,
          message: 'ADMIN users can only modify TEACHER users'
        });
      }
    }

    // SUPER_ADMIN can modify anyone except other SUPER_ADMIN users
    if (req.user.role === UserRole.SUPER_ADMIN && targetUser.role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify other SUPER_ADMIN users'
      });
    }

    next();
  } catch (error) {
    logger.error('Error in user modification middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to check if user can delete another user
 * Only SUPER_ADMIN can delete users
 */
export const canDeleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID required'
      });
    }

    // Prevent self-deletion
    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user has super admin permissions
    const hasSuperAdminPermission = await adminService.hasSuperAdminPermission(req.user.id);
    
    if (!hasSuperAdminPermission) {
      return res.status(403).json({
        success: false,
        message: 'Super Admin access required to delete users'
      });
    }

    // Get target user's role
    const { PrismaClient } = require('../generated/prisma');
    const prisma = new PrismaClient();
    
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { role: true }
    });

    await prisma.$disconnect();

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // Prevent deletion of other SUPER_ADMIN users
    if (targetUser.role === UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete other SUPER_ADMIN users'
      });
    }

    next();
  } catch (error) {
    logger.error('Error in user deletion middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to log admin actions
 */
export const logAdminAction = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        const { PrismaClient, AuditAction } = require('../generated/prisma');
        const prisma = new PrismaClient();
        
        await prisma.auditLog.create({
          data: {
            action: action as any,
            entityType: 'User',
            entityId: req.user.id,
            userId: req.user.id,
            details: JSON.stringify({
              action: action,
              endpoint: req.originalUrl,
              method: req.method,
              userEmail: req.user.email,
              userRole: req.user.role
            }),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
          },
        });

        await prisma.$disconnect();
      }
      
      next();
    } catch (error) {
      logger.error('Error logging admin action:', error);
      // Don't block the request if logging fails
      next();
    }
  };
};
