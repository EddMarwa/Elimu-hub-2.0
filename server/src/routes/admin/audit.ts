import * as express from 'express';
import { Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { AuditAction } from '../../types/enums';
import logger from '../../utils/logger';
import { requireAdmin, requireSuperAdmin } from '../../middleware/adminMiddleware';
import adminService from '../../services/adminService';

const router = express.Router();

/**
 * @route   GET /api/admin/audit/logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Admin only
 */
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const { 
      action, 
      entityType, 
      userId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;

    const filters = {
      action: action as any,
      entityType: entityType as string,
      userId: userId as string,
      startDate: startDate as string,
      endDate: endDate as string
    };

    const result = await adminService.getAuditLogs(
      filters, 
      parseInt(page as string), 
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result,
      message: 'Audit logs retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/admin/audit/logs/:logId
 * @desc    Get specific audit log details
 * @access  Admin only
 */
router.get('/logs/:logId', requireAdmin, async (req, res) => {
  try {
    const { logId } = req.params;

    const { PrismaClient } = require('../../generated/prisma');
    const prisma = new PrismaClient();

    const auditLog = await prisma.auditLog.findUnique({
      where: { id: logId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, role: true }
        }
      }
    });

    await prisma.$disconnect();

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: auditLog,
      message: 'Audit log details retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting audit log details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit log details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/admin/audit/summary
 * @desc    Get audit summary and statistics
 * @access  Admin only
 */
router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const { PrismaClient, AuditAction } = require('../../generated/prisma');
    const prisma = new PrismaClient();

    const [
      totalLogs,
      actionDistribution,
      entityTypeDistribution,
      recentActivity,
      topUsers
    ] = await Promise.all([
      // Total audit logs
      prisma.auditLog.count(),
      
      // Action distribution
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true }
      }),
      
      // Entity type distribution
      prisma.auditLog.groupBy({
        by: ['entityType'],
        _count: { entityType: true }
      }),
      
      // Recent activity (last 24 hours)
      prisma.auditLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      
      // Top users by activity
      prisma.auditLog.groupBy({
        by: ['userId'],
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      })
    ]);

    await prisma.$disconnect();

    const summary = {
      totalLogs,
      actionDistribution: actionDistribution.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {} as Record<string, number>),
      entityTypeDistribution: entityTypeDistribution.reduce((acc, item) => {
        acc[item.entityType] = item._count.entityType;
        return acc;
      }, {} as Record<string, number>),
      recentActivity,
      topUsers: topUsers.length
    };

    res.json({
      success: true,
      data: summary,
      message: 'Audit summary retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting audit summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/admin/audit/export
 * @desc    Export audit logs to CSV (Super Admin only)
 * @access  Super Admin only
 */
router.get('/export', requireSuperAdmin, async (req, res) => {
  try {
    const { 
      action, 
      entityType, 
      userId, 
      startDate, 
      endDate 
    } = req.query;

    const filters = {
      action: action as any,
      entityType: entityType as string,
      userId: userId as string,
      startDate: startDate as string,
      endDate: endDate as string
    };

    const { PrismaClient } = require('../../generated/prisma');
    const prisma = new PrismaClient();

    // Get all matching audit logs
    const where: any = {};
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) };
    if (filters.endDate) where.createdAt = { lte: new Date(filters.endDate) };

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    await prisma.$disconnect();

    // Create CSV content
    const headers = [
      'ID',
      'Action',
      'Entity Type',
      'Entity ID',
      'User ID',
      'User Name',
      'User Email',
      'User Role',
      'Details',
      'IP Address',
      'User Agent',
      'Created At'
    ].join(',');

    const rows = auditLogs.map(log => [
      log.id,
      log.action,
      log.entityType,
      log.entityId,
      log.userId,
      `${log.user.firstName} ${log.user.lastName}`,
      log.user.email,
      log.user.role,
      log.details || '',
      log.ipAddress || '',
      log.userAgent || '',
      log.createdAt.toISOString()
    ].join(','));

    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   DELETE /api/admin/audit/logs
 * @desc    Clear old audit logs (Super Admin only)
 * @access  Super Admin only
 */
router.delete('/logs', requireSuperAdmin, async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

    const { PrismaClient } = require('../../generated/prisma');
    const prisma = new PrismaClient();

    // Count logs that will be deleted
    const logsToDelete = await prisma.auditLog.count({
      where: { createdAt: { lt: cutoffDate } }
    });

    // Delete old logs
    const deleteResult = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoffDate } }
    });

    await prisma.$disconnect();

    logger.info(`Audit logs cleanup: ${deleteResult.count} logs older than ${days} days deleted by ${req.user?.email}`);

    res.json({
      success: true,
      data: {
        deletedCount: deleteResult.count,
        cutoffDate: cutoffDate.toISOString(),
        days: parseInt(days as string)
      },
      message: `Successfully deleted ${deleteResult.count} audit logs older than ${days} days`
    });
  } catch (error) {
    logger.error('Error clearing audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear audit logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/admin/audit/user/:userId
 * @desc    Get audit logs for a specific user
 * @access  Admin only
 */
router.get('/user/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const { PrismaClient } = require('../../generated/prisma');
    const prisma = new PrismaClient();

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

    await prisma.$disconnect();

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        logs,
        total,
        page: parseInt(page as string),
        totalPages
      },
      message: 'User audit logs retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting user audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user audit logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/admin/audit/entity/:entityType/:entityId
 * @desc    Get audit logs for a specific entity
 * @access  Admin only
 */
router.get('/entity/:entityType/:entityId', requireAdmin, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const { PrismaClient } = require('../../generated/prisma');
    const prisma = new PrismaClient();

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { 
          entityType,
          entityId
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, role: true }
          }
        }
      }),
      prisma.auditLog.count({ 
        where: { 
          entityType,
          entityId
        } 
      })
    ]);

    await prisma.$disconnect();

    const totalPages = Math.ceil(total / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        logs,
        total,
        page: parseInt(page as string),
        totalPages,
        entityType,
        entityId
      },
      message: 'Entity audit logs retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting entity audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve entity audit logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
