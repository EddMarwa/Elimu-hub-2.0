import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken, requireRole, AuthenticatedRequest, UserRole } from '../middleware/authMiddleware';
import logger from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadsDir = 'uploads/scheme-files';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${timestamp}-${originalName}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for scheme files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, and Text files are allowed.'));
    }
  },
});

// Get all scheme files (with filtering and pagination)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      subject, 
      grade, 
      term, 
      strand,
      search,
      sortBy = 'newest'
    } = req.query;

    // Build where clause
    const where: any = {};

    // If user is not admin, only show public files
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      where.isPublic = true;
    }

    if (subject) where.subject = subject;
    if (grade) where.grade = grade;
    if (term) where.term = term;
    if (strand) where.strand = strand;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { strand: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'oldest') orderBy = { createdAt: 'asc' };
    if (sortBy === 'downloads') orderBy = { downloads: 'desc' };
    if (sortBy === 'title') orderBy = { title: 'asc' };

    const [files, total] = await Promise.all([
      prisma.schemeOfWorkFile.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      }),
      prisma.schemeOfWorkFile.count({ where })
    ]);

    res.json({
      success: true,
      data: files,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching scheme files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheme files'
    });
  }
});

// Get a specific scheme file by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const file = await prisma.schemeOfWorkFile.findFirst({
      where: {
        id: id,
        OR: [
          { isPublic: true },
          { uploadedBy: userId }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Scheme file not found'
      });
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    logger.error('Error fetching scheme file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheme file'
    });
  }
});

// Upload a new scheme file (Admin only)
router.post('/upload', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const {
      title,
      description,
      subject,
      grade,
      term,
      strand,
      subStrand,
      isPublic = 'true'
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validation
    if (!title || !subject || !grade || !term) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, subject, grade, term'
      });
    }

    const file = await prisma.schemeOfWorkFile.create({
      data: {
        title,
        description: description || null,
        subject,
        grade,
        term,
        strand: strand || null,
        subStrand: subStrand || null,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        isPublic: isPublic === 'true',
        uploadedBy: userId!
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    logger.info(`Scheme file uploaded: ${file.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: file
    });
  } catch (error) {
    logger.error('Error uploading scheme file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload scheme file'
    });
  }
});

// Download a scheme file
router.get('/:id/download', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const file = await prisma.schemeOfWorkFile.findFirst({
      where: {
        id: id,
        OR: [
          { isPublic: true },
          { uploadedBy: userId }
        ]
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Scheme file not found'
      });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Increment download count
    await prisma.schemeOfWorkFile.update({
      where: { id: id },
      data: { downloads: { increment: 1 } }
    });

    // Set headers for file download
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Length', file.fileSize);

    // Stream the file
    const fileStream = fs.createReadStream(file.filePath);
    fileStream.pipe(res);

    logger.info(`Scheme file downloaded: ${file.id} by user ${userId}`);
  } catch (error) {
    logger.error('Error downloading scheme file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download scheme file'
    });
  }
});

// Update a scheme file (Admin only)
router.put('/:id', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      title,
      description,
      subject,
      grade,
      term,
      strand,
      subStrand,
      isPublic
    } = req.body;

    // Check if file exists and belongs to user
    const existingFile = await prisma.schemeOfWorkFile.findFirst({
      where: {
        id: id,
        uploadedBy: userId
      }
    });

    if (!existingFile) {
      return res.status(404).json({
        success: false,
        message: 'Scheme file not found'
      });
    }

    const updatedFile = await prisma.schemeOfWorkFile.update({
      where: { id: id },
      data: {
        title,
        description,
        subject,
        grade,
        term,
        strand,
        subStrand,
        isPublic,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    logger.info(`Scheme file updated: ${updatedFile.id} by user ${userId}`);

    res.json({
      success: true,
      data: updatedFile
    });
  } catch (error) {
    logger.error('Error updating scheme file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheme file'
    });
  }
});

// Delete a scheme file (Admin only)
router.delete('/:id', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check if file exists and belongs to user
    const existingFile = await prisma.schemeOfWorkFile.findFirst({
      where: {
        id: id,
        uploadedBy: userId
      }
    });

    if (!existingFile) {
      return res.status(404).json({
        success: false,
        message: 'Scheme file not found'
      });
    }

    // Delete file from disk
    if (fs.existsSync(existingFile.filePath)) {
      fs.unlinkSync(existingFile.filePath);
    }

    // Delete from database
    await prisma.schemeOfWorkFile.delete({
      where: { id: id }
    });

    logger.info(`Scheme file deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Scheme file deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting scheme file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheme file'
    });
  }
});

// Get scheme file statistics (Admin only)
router.get('/stats/overview', authenticateToken, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), async (req: AuthenticatedRequest, res) => {
  try {
    const [totalFiles, totalDownloads, recentUploads, topSubjects] = await Promise.all([
      prisma.schemeOfWorkFile.count(),
      prisma.schemeOfWorkFile.aggregate({
        _sum: { downloads: true }
      }),
      prisma.schemeOfWorkFile.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.schemeOfWorkFile.groupBy({
        by: ['subject'],
        _count: { subject: true },
        orderBy: { _count: { subject: 'desc' } },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        totalFiles,
        totalDownloads: totalDownloads._sum.downloads || 0,
        recentUploads,
        topSubjects
      }
    });
  } catch (error) {
    logger.error('Error fetching scheme file statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

export default router;
