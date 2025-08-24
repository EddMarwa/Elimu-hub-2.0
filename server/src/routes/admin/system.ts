import express from 'express';
import { Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import logger from '../../utils/logger';
import adminService from '../../services/adminService';
import { requireAdmin, requireSuperAdmin } from '../../middleware/adminMiddleware';

const router = express.Router();

/**
 * @route   GET /api/admin/system/stats
 * @desc    Get system statistics and overview
 * @access  Admin only
 */
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await adminService.getSystemStats();

    res.json({
      success: true,
      data: stats,
      message: 'System statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting system stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health status
 * @access  Admin only
 */
router.get('/health', requireAdmin, async (req, res) => {
  try {
    const prisma = new PrismaClient();

    // Test database connection
    const dbHealth = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Get basic system info
    const [userCount, documentCount, schemeCount] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.schemeOfWork.count()
    ]);

    await prisma.$disconnect();

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'connected',
        test: dbHealth
      },
      // System information
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        loadAverage: null
      },
      data: {
        users: userCount,
        documents: documentCount,
        schemesOfWork: schemeCount
      }
    };

    res.json({
      success: true,
      data: healthStatus,
      message: 'System health check completed'
    });
  } catch (error) {
    logger.error('Error checking system health:', error);
    
    const healthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
      }
    };

    res.status(503).json({
      success: false,
      data: healthStatus,
      message: 'System health check failed'
    });
  }
});

/**
 * @route   GET /api/admin/system/performance
 * @desc    Get system performance metrics
 * @access  Admin only
 */
router.get('/performance', requireAdmin, async (req, res) => {
  try {
    const performanceMetrics = {
      timestamp: new Date().toISOString(),
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      cpu: {
        uptime: process.uptime(),
        loadAverage: null
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    res.json({
      success: true,
      data: performanceMetrics,
      message: 'Performance metrics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/admin/system/logs
 * @desc    Get recent system logs (if available)
 * @access  Admin only
 */
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const prisma = new PrismaClient();

    // Get recent audit logs
    const recentLogs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, role: true }
        }
      }
    });

    await prisma.$disconnect();

    res.json({
      success: true,
      data: {
        logs: recentLogs,
        total: recentLogs.length,
        message: 'Recent system logs retrieved successfully'
      }
    });
  } catch (error) {
    logger.error('Error getting system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/admin/system/maintenance
 * @desc    Enable/disable maintenance mode (Super Admin only)
 * @access  Super Admin only
 */
router.post('/maintenance', requireSuperAdmin, async (req, res) => {
  try {
    const { enabled, message } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Maintenance mode status (enabled) is required'
      });
    }

    // In a real application, you would set a global maintenance flag
    // For now, we'll just log the action
    logger.info(`Maintenance mode ${enabled ? 'enabled' : 'disabled'} by ${req.user?.email}`);

    res.json({
      success: true,
      data: {
        maintenanceMode: enabled,
        message: message || (enabled ? 'System is now in maintenance mode' : 'System is now operational'),
        timestamp: new Date().toISOString(),
        setBy: req.user?.email
      },
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    logger.error('Error setting maintenance mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set maintenance mode',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/admin/system/backup
 * @desc    Get backup information and status
 * @access  Super Admin only
 */
router.get('/backup', requireSuperAdmin, async (req, res) => {
  try {
    // In a real application, you would check actual backup status
    // For now, we'll return mock backup information
    const backupInfo = {
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
      nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      backupSize: '2.5 GB',
      status: 'scheduled',
      retention: '30 days',
      location: 'local-storage'
    };

    res.json({
      success: true,
      data: backupInfo,
      message: 'Backup information retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting backup information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve backup information',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   POST /api/admin/system/backup/trigger
 * @desc    Trigger manual backup (Super Admin only)
 * @access  Super Admin only
 */
router.post('/backup/trigger', requireSuperAdmin, async (req, res) => {
  try {
    // In a real application, you would trigger an actual backup process
    logger.info(`Manual backup triggered by ${req.user?.email}`);

    res.json({
      success: true,
      data: {
        backupId: `backup-${Date.now()}`,
        status: 'initiated',
        timestamp: new Date().toISOString(),
        triggeredBy: req.user?.email
      },
      message: 'Manual backup initiated successfully'
    });
  } catch (error) {
    logger.error('Error triggering backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger backup',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/admin/system/analytics
 * @desc    Get system analytics and trends
 * @access  Admin only
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const prisma = new PrismaClient();

    // Get analytics data for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      newUsers,
      newDocuments,
      newSchemes,
      newLessonPlans,
      userActivity
    ] = await Promise.all([
      // New users in last 30 days
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      // New documents in last 30 days
      prisma.document.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      // New schemes in last 30 days
      prisma.schemeOfWork.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      // New lesson plans in last 30 days
      prisma.lessonPlan.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      // User activity in last 30 days
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { userId: true }
      })
    ]);

    await prisma.$disconnect();

    const analytics = {
      period: 'Last 30 days',
      newUsers,
      newDocuments,
      newSchemes,
      newLessonPlans,
      activeUsers: userActivity.length,
      averageUserActivity: userActivity.length > 0 
        ? userActivity.reduce((sum, item) => sum + item._count.userId, 0) / userActivity.length 
        : 0
    };

    res.json({
      success: true,
      data: analytics,
      message: 'System analytics retrieved successfully'
    });
  } catch (error) {
    logger.error('Error getting system analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
