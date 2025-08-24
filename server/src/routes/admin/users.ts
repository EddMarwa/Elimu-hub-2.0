import { Router } from 'express';
import adminService from '../../services/adminService';
import { 
  requireAdmin, 
  requireSuperAdmin, 
  canModifyUser, 
  canDeleteUser,
  logAdminAction 
} from '../../middleware/adminMiddleware';
import { logger } from '../../utils/logger';
import { UserRole } from '../../generated/prisma';

const router = Router();

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filtering and pagination
 * @access  Admin only
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { 
      role, 
      status, 
      school, 
      county, 
      search, 
      page = 1, 
      limit = 20 
    } = req.query;

    const filters = {
      role: role as any,
      status: status as any,
      school: school as string,
      county: county as string,
      search: search as string
    };

    const result = await adminService.getAllUsers(
      filters, 
      parseInt(page as string), 
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get specific user details
 * @access  Admin only
 */
router.get('/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const { PrismaClient } = require('../../generated/prisma');
    const prisma = new PrismaClient();

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
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
              auditLogs: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user,
        message: 'User details retrieved successfully'
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    logger.error('Error getting user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Create new admin user
 * @access  Admin only (ADMIN can create ADMIN, SUPER_ADMIN can create both)
 */
router.post('/', requireAdmin, logAdminAction('CREATE_USER'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, school, county, subjects } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, firstName, lastName, and role are required'
      });
    }

    if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be ADMIN or SUPER_ADMIN'
      });
    }

    const adminUser = await adminService.createAdminUser(
      { email, password, firstName, lastName, role, school, county, subjects },
      req.user!.id
    );

    res.status(201).json({
      success: true,
      data: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
        school: adminUser.school,
        county: adminUser.county,
        status: adminUser.status
      },
      message: 'Admin user created successfully'
    });
  } catch (error) {
    logger.error('Error creating admin user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user information
 * @access  Admin only (with permission checks)
 */
router.put('/:userId', requireAdmin, canModifyUser, logAdminAction('UPDATE_USER'), async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.email; // Email changes should be handled separately

    const updatedUser = await adminService.updateUser(userId, updateData, req.user!.id);

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        school: updatedUser.school,
        county: updatedUser.county,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt
      },
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   PATCH /api/admin/users/:userId/status
 * @desc    Change user status (activate/deactivate/suspend)
 * @access  Admin only (with permission checks)
 */
router.patch('/:userId/status', requireAdmin, canModifyUser, logAdminAction('UPDATE_USER'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (ACTIVE, INACTIVE, SUSPENDED) is required'
      });
    }

    const updatedUser = await adminService.changeUserStatus(userId, status, req.user!.id);

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt
      },
      message: `User status changed to ${status} successfully`
    });
  } catch (error) {
    logger.error('Error changing user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change user status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user (only SUPER_ADMIN)
 * @access  Super Admin only
 */
router.delete('/:userId', requireSuperAdmin, canDeleteUser, logAdminAction('DELETE_USER'), async (req, res) => {
  try {
    const { userId } = req.params;

    await adminService.deleteUser(userId, req.user!.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/admin/users/:userId/activity
 * @desc    Get user activity and audit logs
 * @access  Admin only
 */
router.get('/:userId/activity', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const { PrismaClient } = require('../../generated/prisma');
    const prisma = new PrismaClient();

    try {
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (parseInt(page as string) - 1) * parseInt(limit as string),
          take: parseInt(limit as string),
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, role: true }
            }
          }
        }),
        prisma.auditLog.count({ where: { userId } })
      ]);

      const totalPages = Math.ceil(total / parseInt(limit as string));

      res.json({
        success: true,
        data: {
          logs,
          total,
          page: parseInt(page as string),
          totalPages
        },
        message: 'User activity retrieved successfully'
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    logger.error('Error getting user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activity',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/admin/users/bulk-action
 * @desc    Perform bulk actions on users (status change, role assignment)
 * @access  Admin only
 */
router.post('/bulk-action', requireAdmin, logAdminAction('UPDATE_USER'), async (req, res) => {
  try {
    const { action, userIds, data } = req.body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Action, userIds array, and data are required'
      });
    }

    const { PrismaClient } = require('../../generated/prisma');
    const prisma = new PrismaClient();

    try {
      let results: any[] = [];
      let errors: any[] = [];

      for (const userId of userIds) {
        try {
          let result;
          
          switch (action) {
            case 'changeStatus':
              if (!data.status) {
                errors.push({ userId, error: 'Status is required for changeStatus action' });
                continue;
              }
              result = await adminService.changeUserStatus(userId, data.status, req.user!.id);
              break;
            
            case 'updateRole':
              if (!data.role) {
                errors.push({ userId, error: 'Role is required for updateRole action' });
                continue;
              }
              result = await adminService.updateUser(userId, { role: data.role }, req.user!.id);
              break;
            
            default:
              errors.push({ userId, error: `Unknown action: ${action}` });
              continue;
          }
          
          results.push({ userId, success: true, data: result });
        } catch (error) {
          errors.push({ 
            userId, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      res.json({
        success: true,
        data: {
          action,
          totalProcessed: userIds.length,
          successful: results.length,
          failed: errors.length,
          results,
          errors
        },
        message: `Bulk action '${action}' completed`
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    logger.error('Error performing bulk action:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk action',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
