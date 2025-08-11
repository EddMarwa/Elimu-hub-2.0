import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

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
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Accept PDF, DOCX, PPTX, images
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/png', 'image/jpeg', 'image/jpg', 'image/gif'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'), false);
  }
});

// Role-based middleware
const requireAdmin = (req: Request, res: Response, next: any) => {
  const userRole = req.headers['x-user-role'] as string;
  const userId = req.headers['x-user-id'] as string;
  if (!userId || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({ success: false, message: 'Admin permissions required' });
  }
  req.body.currentUserId = userId;
  req.body.currentUserRole = userRole;
  next();
};

// GET /lesson-plans (paginated, filter, search)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { grade, subject, q, page = '1', pageSize = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
  const take = parseInt(pageSize as string);
  const where: any = {};
  if (grade) where.grade = grade;
  if (subject) where.subject = subject;
  if (q) where.title = { contains: q };
  const [total, lessonPlans] = await Promise.all([
    prisma.lessonPlan.count({ where }),
    prisma.lessonPlan.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } })
  ]);
  res.json({ success: true, data: lessonPlans, pagination: { total, page: parseInt(page as string), pageSize: take } });
}));

// GET /lesson-plans/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const lessonPlan = await prisma.lessonPlan.findUnique({ where: { id } });
  if (!lessonPlan) return res.status(404).json({ success: false, message: 'Lesson plan not found' });
  res.json({ success: true, data: lessonPlan });
}));

// POST /lesson-plans (admin only, with file upload)
router.post('/', requireAdmin, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  const { title, description, grade, subject, tags } = req.body;
  if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
  const fileType = req.file.mimetype;
  const fileUrl = req.file.path;
  const tagArr = tags ? JSON.parse(tags) : [];
  const lessonPlan = await prisma.lessonPlan.create({
    data: {
      title,
      description,
      grade,
      subject,
      tags: tagArr,
      fileUrl,
      fileType,
      uploadedBy: req.body.currentUserId
    }
  });
  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'UPLOAD_FILE',
      entityType: 'LessonPlan',
      entityId: lessonPlan.id,
      userId: req.body.currentUserId,
      details: JSON.stringify({ title, fileUrl })
    }
  });
  res.status(201).json({ success: true, data: lessonPlan });
}));

// PUT /lesson-plans/:id (admin only)
router.put('/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, grade, subject, tags } = req.body;
  const tagArr = tags ? JSON.parse(tags) : undefined;
  const lessonPlan = await prisma.lessonPlan.update({
    where: { id },
    data: { title, description, grade, subject, tags: tagArr }
  });
  res.json({ success: true, data: lessonPlan });
}));

// DELETE /lesson-plans/:id (admin only)
router.delete('/:id', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.lessonPlan.delete({ where: { id } });
  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'DELETE_FILE',
      entityType: 'LessonPlan',
      entityId: id,
      userId: req.body.currentUserId
    }
  });
  res.json({ success: true, message: 'Lesson plan deleted' });
}));

// DELETE /lesson-plans (bulk, admin only)
router.delete('/', requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body; // expects { ids: [id1, id2, ...] }
  if (!Array.isArray(ids)) return res.status(400).json({ success: false, message: 'ids array required' });
  await prisma.lessonPlan.deleteMany({ where: { id: { in: ids } } });
  // Audit log
  for (const id of ids) {
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_FILE',
        entityType: 'LessonPlan',
        entityId: id,
        userId: req.body.currentUserId
      }
    });
  }
  res.json({ success: true, message: 'Lesson plans deleted' });
}));

export default router;
