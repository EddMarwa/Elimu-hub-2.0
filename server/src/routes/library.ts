import { Router } from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler } from '../middleware/errorHandler';
import libraryService from '../services/libraryService';
import userManagementService from '../services/userManagementService';
import { logger } from '../utils/logger';
import AIService from '../services/aiService';

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

  // Determine default tags by section name (if available)
  let defaultTags: string[] = [];
  try {
    const section = await libraryService.getSectionById(sectionId);
    const sectionName = section?.name?.toLowerCase() || '';
    if (sectionName.includes('scheme')) defaultTags.push('scheme');
    if (sectionName.includes('lesson')) defaultTags.push('lesson-plan');
    if (sectionName.includes('library')) defaultTags.push('library');
  } catch {}

  let parsedTags: string[] | undefined;
  try {
    if (tags) {
      const t = JSON.parse(tags);
      if (Array.isArray(t)) parsedTags = t.map((x) => String(x));
    }
  } catch {}

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
    tags: Array.from(new Set([...(parsedTags || []), ...defaultTags])),
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

// POST /library/past-papers/upload
router.post('/past-papers/upload', upload.single('file'), asyncHandler(async (req, res) => {
  const { subject, grade, year, tags, uploadedBy } = req.body;
  if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
  // Save file info in DB with fileType: 'PDF' and metadata for past paper
  const fileData = await libraryService.uploadFile({
    filename: req.file.filename,
    originalName: req.file.originalname,
    filePath: req.file.path,
    fileType: 'PDF',
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    sectionId: '', // You may want to set this appropriately
    uploadedBy: uploadedBy || 'system', // Set to actual user if available
    description: `Past paper for ${subject} ${grade} ${year}`,
    tags: tags ? JSON.parse(tags) : [],
    metadata: { subject, grade, year, type: 'past-paper' },
  });
  res.status(201).json({ success: true, data: fileData });
}));

// GET /library/past-papers
router.get('/past-papers', asyncHandler(async (req, res) => {
  const { subject, grade, year, q, limit = 20, offset = 0 } = req.query;
  const filesResult = await libraryService.getAllFiles(
    undefined,
    undefined,
    Number(limit),
    Number(offset),
    undefined,
    q as string
  );
  // Filter for past papers in metadata
  const files = (filesResult.files || []).filter(f => {
    try {
      const meta = typeof f.metadata === 'string' ? JSON.parse(f.metadata) : f.metadata;
      return meta && meta.type === 'past-paper' &&
        (!subject || meta.subject === subject) &&
        (!grade || meta.grade === grade) &&
        (!year || meta.year === year);
    } catch {
      return false;
    }
  });
  res.json({ success: true, data: files });
}));

// GET /library/past-papers/extract-questions
router.get('/past-papers/extract-questions', asyncHandler(async (req, res) => {
  const { fileId } = req.query;
  const file = await libraryService.getFileById(fileId as string);
  if (!file) return res.status(404).json({ success: false, message: 'File not found' });
  res.json({ success: true, data: file });
}));

// POST /library/past-papers/extract-questions
router.post('/past-papers/extract-questions', asyncHandler(async (req, res) => {
  const { fileId } = req.body;
  const file = await libraryService.getFileById(fileId);
  if (!file) return res.status(404).json({ success: false, message: 'File not found' });
  // Extract text from metadata if present
  let meta: any = {};
  try {
    meta = typeof file.metadata === 'string' ? JSON.parse(file.metadata) : file.metadata;
  } catch {}
  const fileText = meta?.extractedText || '';
  const prompt = `Extract exam questions from the following past paper text. Return as JSON: { questions: [ { number, question, options?, answer? } ] }\n\n${fileText}`;
  const response = await AIService['callGrokAPI'](prompt);
  let data: any = null;
  try {
    const m = response.match(/\{[\s\S]*\}/);
    data = m ? JSON.parse(m[0]) : null;
  } catch {}
  if (!data) data = { questions: [] };
  res.json({ success: true, data });
}));

// @desc    Get files by section/subfolder
// @route   GET /api/library/files
// @access  Public (filtered by user role)
router.get('/files', asyncHandler(async (req: Request, res: Response) => {
  const { sectionId, subfolderId, status, limit = '20', offset = '0', tags, q } = req.query;
  const userRole = req.headers['x-user-role'] as string;

  const limitNum = parseInt(limit as string);
  const offsetNum = parseInt(offset as string);
  const tagArray = typeof tags === 'string' && tags.length > 0 ? (tags as string).split(',').map(t => t.trim()).filter(Boolean) : undefined;
  const searchQuery = typeof q === 'string' ? q : undefined;

  let result;

  if (sectionId) {
    result = await libraryService.getFilesBySection(
      sectionId as string,
      subfolderId as string,
      userRole,
      limitNum,
      offsetNum,
      tagArray,
      searchQuery
    );
  } else {
    result = await libraryService.getAllFiles(
      userRole,
      status as string,
      limitNum,
      offsetNum,
      tagArray,
      searchQuery
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
