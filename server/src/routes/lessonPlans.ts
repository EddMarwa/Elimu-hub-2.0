import express from 'express';
import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole, AuthenticatedRequest, optionalAuth, UserRole } from '../middleware/authMiddleware';
import lessonPlanService from '../services/lessonPlanService';
import logger from '../utils/logger';

const router = express.Router();

// Multer config for lesson plan uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/lesson-plans');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error instanceof Error ? error : new Error(String(error)), uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Accept PDF, DOCX, PPTX, images
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// GET /lesson-plans (paginated, filter, search) - Public access
router.get('/', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { grade, subject, q, page = '1', pageSize = '20', folderId, sortBy = 'newest' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  const take = parseInt(pageSize as string);
  const where: any = {};
  
  if (grade) where.grade = grade;
  if (subject) where.subject = subject;
  if (folderId) where.folderId = folderId;
  if (q) where.title = { contains: q };
  
  // If user is authenticated, show all lesson plans
  // If not authenticated, only show public ones
  if (!req.user) {
    where.isPublic = true;
  }
  
  const result = await lessonPlanService.getLessonPlans(where, skip, take, sortBy as string);
  res.json({ 
    success: true, 
    data: result.lessonPlans, 
    pagination: { 
      total: result.total, 
      page: parseInt(page as string), 
      pageSize: take 
    } 
  });
}));

// GET /lesson-plans/:id (with optional auth for public access)
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lessonPlan = await lessonPlanService.getLessonPlanById(id);
    
    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: 'Lesson plan not found'
      });
    }

    // Check if lesson plan is public or user has access
    if (!lessonPlan.isPublic && (!req.user || req.user.role === UserRole.TEACHER)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: lessonPlan
    });
  } catch (error) {
    logger.error('Error getting lesson plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lesson plan'
    });
  }
}));

// POST /lesson-plans (admin only, with file upload)
router.post('/', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), upload.single('file'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      subject,
      grade,
      tags,
      folderId
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const lessonPlan = await lessonPlanService.createLessonPlan({
      title,
      description: description || '',
      subject,
      grade,
      tags: tags ? JSON.stringify(JSON.parse(tags)) : '[]',
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      uploadedBy: req.user!.id,
      folderId: folderId || undefined
    });

    logger.info(`Lesson plan created: ${lessonPlan.id} by user ${req.user!.id}`);

    res.status(201).json({
      success: true,
      data: lessonPlan
    });
  } catch (error) {
    logger.error('Error creating lesson plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lesson plan'
    });
  }
}));

// PUT /lesson-plans/:id (admin only)
router.put('/:id', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      subject,
      grade,
      tags
    } = req.body;

    const lessonPlan = await lessonPlanService.updateLessonPlan(id, {
      title,
      description: description || '',
      subject,
      grade,
      tags: tags ? JSON.stringify(JSON.parse(tags)) : undefined
    });

    logger.info(`Lesson plan updated: ${id} by user ${req.user!.id}`);

    res.json({
      success: true,
      data: lessonPlan
    });
  } catch (error) {
    logger.error('Error updating lesson plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lesson plan'
    });
  }
}));

// DELETE /lesson-plans/:id (admin only)
router.delete('/:id', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { id } = req.params;
  await lessonPlanService.deleteLessonPlan(id);
  
  // Audit log
  // The original code had prisma.auditLog.create, but prisma is not imported.
  // Assuming this was intended to be removed or replaced with a placeholder.
  // For now, removing the line as per the new_code.
  // await prisma.auditLog.create({
  //   data: {
  //     action: 'DELETE_FILE',
  //     entityType: 'LessonPlan',
  //     entityId: id,
  //     userId: req.user.id
  //   }
  // });
  
  logger.info(`Lesson plan deleted by ${req.user.email}: ${id}`);
  res.json({ success: true, message: 'Lesson plan deleted' });
}));

// DELETE /lesson-plans (bulk, admin only)
router.delete('/', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { ids } = req.body; // expects { ids: [id1, id2, ...] }
  if (!Array.isArray(ids)) return res.status(400).json({ success: false, message: 'ids array required' });
  
  await lessonPlanService.bulkDeleteLessonPlans(ids);
  
  // Audit log
  // The original code had prisma.auditLog.create, but prisma is not imported.
  // Assuming this was intended to be removed or replaced with a placeholder.
  // For now, removing the line as per the new_code.
  // for (const id of ids) {
  //   await prisma.auditLog.create({
  //     data: {
  //       action: 'DELETE_FILE',
  //       entityType: 'LessonPlan',
  //       entityId: id,
  //       userId: req.user.id
  //     }
  //   });
  // }
  
  logger.info(`Bulk lesson plans deleted by ${req.user.email}: ${ids.length} items`);
  res.json({ success: true, message: 'Lesson plans deleted' });
}));

// GET /lesson-plans/folders - Public access
router.get('/folders', optionalAuth, asyncHandler(async (req: express.Request, res: Response) => {
  const folders = await lessonPlanService.getFolders();
  res.json({ success: true, data: folders });
}));

// POST /lesson-plans/folders (admin only)
router.post('/folders', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, parentId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    const folder = await lessonPlanService.createFolder({ name, description, userId: req.user!.id, parentId });
    
    logger.info(`Folder created: ${folder.id} by user ${req.user!.id}`);

    res.status(201).json({
      success: true,
      data: folder
    });
  } catch (error) {
    logger.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder'
    });
  }
}));

// PUT /lesson-plans/folders/:id (admin only)
router.put('/folders/:id', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { id } = req.params;
  const { name, description, parentId } = req.body;
  const folder = await lessonPlanService.updateFolder(id, { name, description, parentId });
  
  logger.info(`Folder updated by ${req.user.email}: ${name}`);
  res.json({ success: true, data: folder });
}));

// DELETE /lesson-plans/folders/:id (admin only)
router.delete('/folders/:id', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { id } = req.params;
  await lessonPlanService.deleteFolder(id);
  
  logger.info(`Folder deleted by ${req.user.email}: ${id}`);
  res.json({ success: true, message: 'Folder deleted' });
}));

// GET /lesson-plans/:id/download - Public access
router.get('/:id/download', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const lessonPlan = await lessonPlanService.getLessonPlanById(id);
    
    if (!lessonPlan) {
      return res.status(404).json({
        success: false,
        message: 'Lesson plan not found'
      });
    }

    // Check access permissions
    if (lessonPlan.isPublic === false && (!userId || lessonPlan.uploadedBy !== userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment download count
    await lessonPlanService.incrementDownloads(id);
    
    // Send file
    res.download(lessonPlan.fileUrl, lessonPlan.title);
  } catch (error) {
    logger.error('Error downloading lesson plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download lesson plan'
    });
  }
}));

// GET /lesson-plans/:id/comments - Public access
router.get('/:id/comments', optionalAuth, asyncHandler(async (req: express.Request, res: Response) => {
  const { id } = req.params;
  const comments = await lessonPlanService.getComments(id);
  res.json({ success: true, data: comments });
}));

// POST /lesson-plans/:id/comments - Authenticated users only
router.post('/:id/comments', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { id } = req.params;
  const { content, rating } = req.body;
  
  const comment = await lessonPlanService.addComment({
    content,
    rating,
    userId: req.user.id,
    lessonPlanId: id
  });
  
  logger.info(`Comment added by ${req.user.email} on lesson plan ${id}`);
  res.status(201).json({ success: true, data: comment });
}));

// PUT /lesson-plans/comments/:id - Authenticated users only
router.put('/comments/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { id } = req.params;
  const { content, rating } = req.body;
  
  const comment = await lessonPlanService.updateComment(id, { content, rating });
  
  logger.info(`Comment updated by ${req.user.email}: ${id}`);
  res.json({ success: true, data: comment });
}));

// DELETE /lesson-plans/comments/:id - Authenticated users only
router.delete('/comments/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { id } = req.params;
  await lessonPlanService.deleteComment(id);
  
  logger.info(`Comment deleted by ${req.user.email}: ${id}`);
  res.json({ success: true, message: 'Comment deleted' });
}));

export default router;
