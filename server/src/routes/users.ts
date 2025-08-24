import { Router } from 'express';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest, requireRole, UserRole } from '../middleware/authMiddleware';
import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page = 1, limit = 10, search, role, status } = req.query;
  
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  // Build where clause
  const where: any = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { school: { contains: search as string, mode: 'insensitive' } }
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit as string),
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
            lessonPlans: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  // Users can only access their own profile unless they're admin
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN' && req.user!.id !== id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

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
          documents: true,
          schemesOfWork: true,
          lessonPlans: true
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

  res.status(200).json({
    success: true,
    data: user
  });
}));

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // Users can only update their own profile unless they're admin
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN' && req.user!.id !== id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Remove sensitive fields that shouldn't be updated via this endpoint
  delete updateData.password;
  delete updateData.email; // Email changes should be handled separately
  delete updateData.role; // Role changes require admin privileges

  // Hash password if provided
  if (updateData.newPassword) {
    updateData.password = await bcrypt.hash(updateData.newPassword, 12);
    delete updateData.newPassword;
  }

  // Convert subjects array to JSON string if provided
  if (updateData.subjects && Array.isArray(updateData.subjects)) {
    updateData.subjects = JSON.stringify(updateData.subjects);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
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
      updatedAt: true
    }
  });

  res.status(200).json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully'
  });
}));

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', authenticateToken, requireRole([UserRole.SUPER_ADMIN]), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  // Prevent self-deletion
  if (req.user!.id === id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete your own account'
    });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Super admin can delete anyone, regular admin can only delete teachers
  if (req.user!.role === 'ADMIN' && user.role !== 'TEACHER') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to delete this user'
    });
  }

  await prisma.user.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// @desc    Get current user profile
// @route   GET /api/users/profile/me
// @access  Private
router.get('/profile/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
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
      updatedAt: true
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
}));

// @desc    Change password
// @route   POST /api/users/change-password
// @access  Private
router.post('/change-password', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 8 characters long'
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { password: true }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { password: hashedPassword }
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
}));

export default router;