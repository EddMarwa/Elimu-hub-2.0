import { Router } from 'express';
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import userManagementService from '../../services/userManagementService';
import { logger } from '../../utils/logger';

const router = Router();

// Helper function to check admin permissions
const requireAdmin = (req: Request, res: Response, next: any) => {
  const userRole = req.headers['x-user-role'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!userId || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Admin permissions required'
    });
  }

  req.body.currentUserId = userId;
  req.body.currentUserRole = userRole;
  next();
};

// Helper function to check super admin permissions
const requireSuperAdmin = (req: Request, res: Response, next: any) => {
  const userRole = req.headers['x-user-role'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!userId || userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Super admin permissions required'
    });
  }

  req.body.currentUserId = userId;
  req.body.currentUserRole = userRole;
  next();
};

// User CRUD Routes
// @desc    Create new user
// @route   POST /api/admin/users
// @access  Admin
router.post('/', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { 
    email, 
    firstName, 
    lastName, 
    password, 
    role, 
    school, 
    county, 
    subjects, 
    status,
    currentUserId 
  } = req.body;

  if (!email || !firstName || !lastName || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email, first name, last name, and password are required'
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  const userData = {
    email,
    firstName,
    lastName,
    password,
    role: role || 'TEACHER',
    school,
    county,
    subjects,
    status: status || 'ACTIVE'
  };

  const user = await userManagementService.createUser(userData, currentUserId);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user
  });
}));

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
router.get('/', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = '1', 
    limit = '10', 
    search, 
    role, 
    status 
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const result = await userManagementService.getAllUsers(
    pageNum,
    limitNum,
    search as string,
    role as string,
    status as string
  );

  res.json({
    success: true,
    data: result.users,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
}));

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Admin
router.get('/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await userManagementService.getUserById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
}));

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Admin
router.put('/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    email, 
    firstName, 
    lastName, 
    role, 
    school, 
    county, 
    subjects, 
    status, 
    password,
    currentUserId,
    currentUserRole
  } = req.body;

  // Super admin check for role changes
  if (role === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Only super admin can assign super admin role'
    });
  }

  const updateData: any = {};
  
  if (email) updateData.email = email;
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (role) updateData.role = role;
  if (school) updateData.school = school;
  if (county) updateData.county = county;
  if (subjects) updateData.subjects = subjects;
  if (status) updateData.status = status;
  if (password) updateData.password = password;

  const user = await userManagementService.updateUser(id, updateData, currentUserId);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
}));

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin (Super Admin for SUPER_ADMIN users)
router.delete('/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { currentUserId } = req.body;

  await userManagementService.deleteUser(id, currentUserId);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// User Statistics Routes
// @desc    Get user statistics
// @route   GET /api/admin/users/stats/overview
// @access  Admin
router.get('/stats/overview', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const stats = await userManagementService.getUserStats();

  res.json({
    success: true,
    data: stats
  });
}));

// Audit Log Routes
// @desc    Get audit logs
// @route   GET /api/admin/users/audit/logs
// @access  Admin
router.get('/audit/logs', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = '1', 
    limit = '20', 
    entityType, 
    action, 
    userId 
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const result = await userManagementService.getAuditLogs(
    pageNum,
    limitNum,
    entityType as string,
    action as string,
    userId as string
  );

  res.json({
    success: true,
    data: result.logs,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
}));

// Bulk Operations Routes
// @desc    Bulk update user status
// @route   POST /api/admin/users/bulk/status
// @access  Admin
router.post('/bulk/status', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { userIds, status, currentUserId } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User IDs array is required'
    });
  }

  if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED'
    });
  }

  const results: any[] = [];
  for (const userId of userIds) {
    try {
      const user = await userManagementService.updateUser(
        userId, 
        { status }, 
        currentUserId
      );
      results.push({ userId, success: true, user });
    } catch (error) {
      results.push({ 
        userId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  res.json({
    success: true,
    message: 'Bulk status update completed',
    data: results
  });
}));

// @desc    Bulk delete users
// @route   POST /api/admin/users/bulk/delete
// @access  Super Admin
router.post('/bulk/delete', requireSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { userIds, currentUserId } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User IDs array is required'
    });
  }

  const results: any[] = [];
  for (const userId of userIds) {
    try {
      await userManagementService.deleteUser(userId, currentUserId);
      results.push({ userId, success: true });
    } catch (error) {
      results.push({ 
        userId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  res.json({
    success: true,
    message: 'Bulk delete completed',
    data: results
  });
}));

// Export user data (for admin reporting)
// @desc    Export users to CSV
// @route   GET /api/admin/users/export/csv
// @access  Admin
router.get('/export/csv', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { role, status } = req.query;

  const result = await userManagementService.getAllUsers(
    1,
    10000, // Large limit to get all users
    undefined,
    role as string,
    status as string
  );

  // Create CSV content
  const headers = [
    'ID',
    'Email',
    'First Name',
    'Last Name',
    'Role',
    'School',
    'County',
    'Status',
    'Schemes of Work',
    'Library Files',
    'Created At'
  ].join(',');

  const rows = result.users.map(user => [
    user.id,
    user.email,
    user.firstName,
    user.lastName,
    user.role,
    user.school || '',
    user.county || '',
    user.status,
    user._count.schemesOfWork,
    user._count.libraryFiles || 0,
    user.createdAt.toISOString()
  ].join(','));

  const csv = [headers, ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
  res.send(csv);
}));

export default router;
