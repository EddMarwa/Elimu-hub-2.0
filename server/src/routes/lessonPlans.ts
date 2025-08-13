import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, requireRole, AuthenticatedRequest, optionalAuth } from '../middleware/authMiddleware';
import { PrismaClient } from '../generated/prisma';
import { logger } from '../utils/logger';
import lessonPlanService from '../services/lessonPlanService';

const prisma = new PrismaClient();
const router = Router();

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

// Role-based middleware
const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);

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

// GET /lesson-plans/:id - Public access
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const lessonPlan = await lessonPlanService.getLessonPlanById(id);
  
  if (!lessonPlan) {
    return res.status(404).json({ success: false, message: 'Lesson plan not found' });
  }
  
  // Check if lesson plan is public or user has access
  if (!lessonPlan.isPublic && (!req.user || req.user.role === 'TEACHER')) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  
  res.json({ success: true, data: lessonPlan });
}));

// POST /lesson-plans (admin only, with file upload)
router.post('/', authenticateToken, requireAdmin, upload.single('file'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { title, description, grade, subject, tags, folderId } = req.body;
  if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
  
  const fileType = req.file.mimetype;
  const fileUrl = req.file.path;
  const tagArr = tags ? JSON.parse(tags) : [];
  
  const lessonPlan = await lessonPlanService.createLessonPlan({
    title,
    description,
    grade,
    subject,
    tags: JSON.stringify(tagArr),
    fileUrl,
    fileType,
    uploadedBy: req.user.userId,
    folderId: folderId || undefined
  });
  
  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'UPLOAD_FILE',
      entityType: 'LessonPlan',
      entityId: lessonPlan.id,
      userId: req.user.userId,
      details: JSON.stringify({ title, fileUrl })
    }
  });
  
  logger.info(`Lesson plan uploaded by ${req.user.email}: ${title}`);
  res.status(201).json({ success: true, data: lessonPlan });
}));

// PUT /lesson-plans/:id (admin only)
router.put('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { id } = req.params;
  const { title, description, grade, subject, tags } = req.body;
  const tagArr = tags ? JSON.parse(tags) : undefined;
  
  const lessonPlan = await lessonPlanService.updateLessonPlan(id, { 
    title, 
    description, 
    grade, 
    subject, 
    tags: tagArr ? JSON.stringify(tagArr) : undefined 
  });
  
  logger.info(`Lesson plan updated by ${req.user.email}: ${title}`);
  res.json({ success: true, data: lessonPlan });
}));

// DELETE /lesson-plans/:id (admin only)
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { id } = req.params;
  await lessonPlanService.deleteLessonPlan(id);
  
  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'DELETE_FILE',
      entityType: 'LessonPlan',
      entityId: id,
      userId: req.user.userId
    }
  });
  
  logger.info(`Lesson plan deleted by ${req.user.email}: ${id}`);
  res.json({ success: true, message: 'Lesson plan deleted' });
}));

// DELETE /lesson-plans (bulk, admin only)
router.delete('/', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { ids } = req.body; // expects { ids: [id1, id2, ...] }
  if (!Array.isArray(ids)) return res.status(400).json({ success: false, message: 'ids array required' });
  
  await lessonPlanService.bulkDeleteLessonPlans(ids);
  
  // Audit log
  for (const id of ids) {
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_FILE',
        entityType: 'LessonPlan',
        entityId: id,
        userId: req.user.userId
      }
    });
  }
  
  logger.info(`Bulk lesson plans deleted by ${req.user.email}: ${ids.length} items`);
  res.json({ success: true, message: 'Lesson plans deleted' });
}));

// GET /lesson-plans/folders - Public access
router.get('/folders', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const folders = await lessonPlanService.getFolders();
  res.json({ success: true, data: folders });
}));

// POST /lesson-plans/folders (admin only)
router.post('/folders', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { name, description, parentId } = req.body;
  const folder = await lessonPlanService.createFolder({ name, description, userId: req.user.userId, parentId });
  
  logger.info(`Folder created by ${req.user.email}: ${name}`);
  res.status(201).json({ success: true, data: folder });
}));

// PUT /lesson-plans/folders/:id (admin only)
router.put('/folders/:id', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
router.delete('/folders/:id', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  const { id } = req.params;
  const lessonPlan = await lessonPlanService.getLessonPlanById(id);
  
  if (!lessonPlan) {
    return res.status(404).json({ success: false, message: 'Lesson plan not found' });
  }
  
  // Check if lesson plan is public or user has access
  if (!lessonPlan.isPublic && (!req.user || req.user.role === 'TEACHER')) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  
  // Increment download count
  await lessonPlanService.incrementDownloads(id);
  
  // Send file
  res.download(lessonPlan.fileUrl, lessonPlan.title);
}));

// GET /lesson-plans/:id/comments - Public access
router.get('/:id/comments', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
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
    userId: req.user.userId,
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
