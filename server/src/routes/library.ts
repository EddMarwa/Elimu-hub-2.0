import { Router } from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler } from '../middleware/errorHandler';
import libraryService from '../services/libraryService';
import userManagementService from '../services/userManagementService';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/library');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now - we'll categorize them
    cb(null, true);
  },
});

// Helper function to determine file type
const getFileType = (mimeType: string): 'PDF' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' => {
  if (mimeType.startsWith('image/')) return 'IMAGE';
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (mimeType === 'application/pdf') return 'PDF';
  return 'DOCUMENT';
};

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

// Section Management Routes (Admin only)
// @desc    Create library section
// @route   POST /api/library/sections
// @access  Admin
router.post('/sections', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { name, description, order } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Section name is required'
    });
  }

  const section = await libraryService.createSection({
    name,
    description,
    order
  });

  res.status(201).json({
    success: true,
    message: 'Library section created successfully',
    data: section
  });
}));

// @desc    Get all library sections
// @route   GET /api/library/sections
// @access  Public
router.get('/sections', asyncHandler(async (req: Request, res: Response) => {
  const sections = await libraryService.getAllSections();

  res.json({
    success: true,
    data: sections
  });
}));

// @desc    Update library section
// @route   PUT /api/library/sections/:id
// @access  Admin
router.put('/sections/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, order } = req.body;

  const section = await libraryService.updateSection(id, {
    name,
    description,
    order
  });

  res.json({
    success: true,
    message: 'Section updated successfully',
    data: section
  });
}));

// @desc    Delete library section
// @route   DELETE /api/library/sections/:id
// @access  Admin
router.delete('/sections/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await libraryService.deleteSection(id);

  res.json({
    success: true,
    message: 'Section deleted successfully'
  });
}));

// Subfolder Management Routes (Admin only)
// @desc    Create library subfolder
// @route   POST /api/library/subfolders
// @access  Admin
router.post('/subfolders', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { name, sectionId, metadata, order } = req.body;

  if (!name || !sectionId) {
    return res.status(400).json({
      success: false,
      message: 'Name and section ID are required'
    });
  }

  const subfolder = await libraryService.createSubfolder({
    name,
    sectionId,
    metadata,
    order
  });

  res.status(201).json({
    success: true,
    message: 'Subfolder created successfully',
    data: subfolder
  });
}));

// @desc    Get subfolders by section
// @route   GET /api/library/sections/:sectionId/subfolders
// @access  Public
router.get('/sections/:sectionId/subfolders', asyncHandler(async (req: Request, res: Response) => {
  const { sectionId } = req.params;

  const subfolders = await libraryService.getSubfoldersBySection(sectionId);

  res.json({
    success: true,
    data: subfolders
  });
}));

// @desc    Update subfolder
// @route   PUT /api/library/subfolders/:id
// @access  Admin
router.put('/subfolders/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, metadata, order } = req.body;

  const subfolder = await libraryService.updateSubfolder(id, {
    name,
    metadata,
    order
  });

  res.json({
    success: true,
    message: 'Subfolder updated successfully',
    data: subfolder
  });
}));

// @desc    Delete subfolder
// @route   DELETE /api/library/subfolders/:id
// @access  Admin
router.delete('/subfolders/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await libraryService.deleteSubfolder(id);

  res.json({
    success: true,
    message: 'Subfolder deleted successfully'
  });
}));

// File Management Routes
// @desc    Upload file to library
// @route   POST /api/library/upload
// @access  Private
router.post('/upload', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  const { sectionId, subfolderId, description, tags } = req.body;
  const userRole = req.headers['x-user-role'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  if (!sectionId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'Section ID and user authentication required'
    });
  }

  const fileType = getFileType(req.file.mimetype);
  
  // Auto-approve for admins, pending for regular users
  const initialStatus = ['ADMIN', 'SUPER_ADMIN'].includes(userRole) ? 'APPROVED' : 'PENDING';

  const fileData = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    filePath: req.file.path,
    fileType,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    sectionId,
    subfolderId: subfolderId || undefined,
    uploadedBy: userId,
    description,
    tags: tags ? JSON.parse(tags) : undefined,
  };

  const uploadedFile = await libraryService.uploadFile(fileData);

  // If auto-approved, also set approval info
  if (initialStatus === 'APPROVED') {
    await libraryService.approveFile(uploadedFile.id, userId);
  }

  res.status(201).json({
    success: true,
    message: initialStatus === 'APPROVED' ? 'File uploaded and approved' : 'File uploaded and pending approval',
    data: uploadedFile
  });
}));

// @desc    Get files by section/subfolder
// @route   GET /api/library/files
// @access  Public (filtered by user role)
router.get('/files', asyncHandler(async (req: Request, res: Response) => {
  const { sectionId, subfolderId, status, limit = '20', offset = '0' } = req.query;
  const userRole = req.headers['x-user-role'] as string;

  const limitNum = parseInt(limit as string);
  const offsetNum = parseInt(offset as string);

  let result;

  if (sectionId) {
    result = await libraryService.getFilesBySection(
      sectionId as string,
      subfolderId as string,
      userRole,
      limitNum,
      offsetNum
    );
  } else {
    result = await libraryService.getAllFiles(
      userRole,
      status as string,
      limitNum,
      offsetNum
    );
  }

  res.json({
    success: true,
    data: result.files,
    pagination: {
      total: result.total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: result.total > offsetNum + limitNum
    }
  });
}));

// @desc    Approve file
// @route   POST /api/library/files/:id/approve
// @access  Admin
router.post('/files/:id/approve', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { currentUserId } = req.body;

  const file = await libraryService.approveFile(id, currentUserId);

  res.json({
    success: true,
    message: 'File approved successfully',
    data: file
  });
}));

// @desc    Decline file
// @route   POST /api/library/files/:id/decline
// @access  Admin
router.post('/files/:id/decline', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { currentUserId } = req.body;

  const file = await libraryService.declineFile(id, currentUserId);

  res.json({
    success: true,
    message: 'File declined successfully',
    data: file
  });
}));

// @desc    Delete file
// @route   DELETE /api/library/files/:id
// @access  Admin or File Owner
router.delete('/files/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.headers['x-user-role'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user is admin or file owner
  const { files } = await libraryService.getAllFiles('ADMIN', undefined, 1, 0); // Get with admin privileges to check ownership
  const file = files.find(f => f.id === id);

  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
  const isOwner = file.uploadedBy === userId;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Permission denied'
    });
  }

  await libraryService.deleteFile(id);

  res.json({
    success: true,
    message: 'File deleted successfully'
  });
}));

// Analytics Routes (Admin only)
// @desc    Get library statistics
// @route   GET /api/library/stats
// @access  Admin
router.get('/stats', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const stats = await libraryService.getLibraryStats();

  res.json({
    success: true,
    data: stats
  });
}));

// @desc    Get recent activity
// @route   GET /api/library/activity
// @access  Admin
router.get('/activity', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { limit = '10' } = req.query;
  const activity = await libraryService.getRecentActivity(parseInt(limit as string));

  res.json({
    success: true,
    data: activity
  });
}));

export default router;
