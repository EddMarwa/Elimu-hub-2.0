import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';
import OpenAI from 'openai';
import { DocumentProcessor } from '../services/documentProcessor';

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting for AI generation
const aiGenerationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute per user
  message: {
    success: false,
    message: 'Too many AI generation requests. Please wait a minute before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/schemes/');
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${timestamp}-${originalName}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Text, and Excel files are allowed.'));
    }
  },
});

// Initialize OpenAI (if available)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Get all schemes of work for the authenticated user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { 
      page = 1, 
      limit = 10, 
      subject, 
      grade, 
      term, 
      search 
    } = req.query;

    // Build where clause
    const where: any = {
      createdBy: userId
    };

    if (subject) where.subject = subject;
    if (grade) where.grade = grade;
    if (term) where.term = term;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { strand: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [schemes, total] = await Promise.all([
      prisma.schemeOfWork.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take,
        select: {
          id: true,
          title: true,
          subject: true,
          grade: true,
          term: true,
          strand: true,
          subStrand: true,
          duration: true,
          weeks: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.schemeOfWork.count({ where })
    ]);

    res.json({
      success: true,
      data: schemes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching schemes of work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schemes of work'
    });
  }
});

// Get a specific scheme of work by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const scheme = await prisma.schemeOfWork.findFirst({
      where: {
        id: id,
        createdBy: userId
      }
    });

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme of work not found'
      });
    }

    res.json({
      success: true,
      data: scheme
    });
  } catch (error) {
    logger.error('Error fetching scheme of work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheme of work'
    });
  }
});

// Create a new scheme of work
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const {
      title,
      subject,
      grade,
      term,
      strand,
      subStrand,
      duration,
      weeks,
      generalObjectives,
      weeklyPlans,
      resources
    } = req.body;

    // Validation
    if (!title || !subject || !grade || !term || !strand || !duration || !weeks) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, subject, grade, term, strand, duration, weeks'
      });
    }

    if (isNaN(parseInt(weeks)) || parseInt(weeks) < 1 || parseInt(weeks) > 20) {
      return res.status(400).json({
        success: false,
        message: 'Weeks must be a number between 1 and 20'
      });
    }

    const scheme = await prisma.schemeOfWork.create({
      data: {
        title,
        subject,
        grade,
        term,
        strand,
        subStrand,
        duration,
        weeks: parseInt(weeks),
        generalObjectives: JSON.stringify(generalObjectives),
        weeklyPlans: JSON.stringify(weeklyPlans),
        resources: JSON.stringify(resources),
        createdBy: userId!
      }
    });

    logger.info(`Scheme of work created: ${scheme.id} by user ${userId}`);

    res.status(201).json({
      success: true,
      data: {
        ...scheme,
        generalObjectives: JSON.parse(scheme.generalObjectives || '[]'),
        weeklyPlans: JSON.parse(scheme.weeklyPlans || '[]'),
        resources: JSON.parse(scheme.resources || '[]')
      }
    });
  } catch (error) {
    logger.error('Error creating scheme of work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scheme of work'
    });
  }
});

// Update a scheme of work
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const {
      title,
      subject,
      grade,
      term,
      strand,
      subStrand,
      duration,
      weeks,
      generalObjectives,
      weeklyPlans,
      resources
    } = req.body;

    // Check if scheme exists and belongs to user
    const existingScheme = await prisma.schemeOfWork.findFirst({
      where: {
        id: id,
        createdBy: userId
      }
    });

    if (!existingScheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme of work not found'
      });
    }

    const updatedScheme = await prisma.schemeOfWork.update({
      where: { id: id },
      data: {
        title,
        subject,
        grade,
        term,
        strand,
        subStrand,
        duration,
        weeks: parseInt(weeks),
        generalObjectives: JSON.stringify(generalObjectives),
        weeklyPlans: JSON.stringify(weeklyPlans),
        resources: JSON.stringify(resources),
        updatedAt: new Date()
      }
    });

    logger.info(`Scheme of work updated: ${updatedScheme.id} by user ${userId}`);

    res.json({
      success: true,
      data: {
        ...updatedScheme,
        generalObjectives: JSON.parse(updatedScheme.generalObjectives || '[]'),
        weeklyPlans: JSON.parse(updatedScheme.weeklyPlans || '[]'),
        resources: JSON.parse(updatedScheme.resources || '[]')
      }
    });
  } catch (error) {
    logger.error('Error updating scheme of work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheme of work'
    });
  }
});

// Delete a scheme of work
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Check if scheme exists and belongs to user
    const existingScheme = await prisma.schemeOfWork.findFirst({
      where: {
        id: id,
        createdBy: userId
      }
    });

    if (!existingScheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme of work not found'
      });
    }

    await prisma.schemeOfWork.delete({
      where: { id: id }
    });

    logger.info(`Scheme of work deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Scheme of work deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting scheme of work:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheme of work'
    });
  }
});

// Upload template for scheme of work generation
router.post('/upload-template', authenticateToken, upload.single('template'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No template file uploaded'
      });
    }

    const userId = req.user?.userId;
    const { subject, grade } = req.body; // Optional metadata
    
    // Process the uploaded document
    const documentProcessor = DocumentProcessor.getInstance();
    const processingResult = await documentProcessor.processDocument(req.file.path);

    // Save template to database
    const template = await prisma.schemeTemplate.create({
      data: {
        filename: `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        originalName: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        extractedText: processingResult.extractedText || '',
        subject: subject || null,
        grade: grade || null,
        uploadedBy: userId!
      }
    });

    logger.info(`Template uploaded and saved: ${req.file.originalname} by user ${userId}`);

    res.json({
      success: true,
      message: 'Template uploaded successfully',
      data: {
        id: template.id,
        filename: template.originalName,
        size: template.fileSize,
        subject: template.subject,
        grade: template.grade,
        uploadedAt: template.createdAt
      }
    });

  } catch (error) {
    logger.error('Error uploading template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload template'
    });
  }
});

// Get user's templates
router.get('/templates', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    
    const templates = await prisma.schemeTemplate.findMany({
      where: {
        uploadedBy: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        originalName: true,
        subject: true,
        grade: true,
        fileSize: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    logger.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates'
    });
  }
});

// Get template by ID (for generation)
router.get('/templates/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const template = await prisma.schemeTemplate.findFirst({
      where: {
        id: id,
        uploadedBy: userId
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    logger.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template'
    });
  }
});

// Delete template
router.delete('/templates/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const template = await prisma.schemeTemplate.findFirst({
      where: {
        id: id,
        uploadedBy: userId
      }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Delete file from filesystem
    const fs = require('fs');
    if (fs.existsSync(template.filePath)) {
      fs.unlinkSync(template.filePath);
    }

    // Delete from database
    await prisma.schemeTemplate.delete({
      where: { id: id }
    });

    logger.info(`Template deleted: ${template.originalName} by user ${userId}`);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template'
    });
  }
});

// Generate scheme of work with AI
router.post('/generate', authenticateToken, aiGenerationLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      subject,
      grade,
      term,
      strand,
      subStrand,
      weeks,
      duration,
      context,
      templateContent // Add template content parameter
    } = req.body;

    if (!openai) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please configure OpenAI API key.'
      });
    }

    // Enhanced prompt with template integration
    let prompt = `
Generate a comprehensive CBC (Competency Based Curriculum) scheme of work with the following details:

Subject: ${subject}
Grade: ${grade}
Term: ${term}
Strand: ${strand}
Sub-Strand: ${subStrand}
Duration: ${duration}
Number of Weeks: ${weeks}

${context ? `Additional Context: ${context}` : ''}

${templateContent ? `
TEMPLATE REFERENCE:
Use the following template content as a guide for structure, format, and style:
${templateContent.extractedText || ''}

Please follow the formatting patterns, section organization, and content depth shown in the template.
` : ''}

Please structure the scheme of work as follows:

1. Title
2. General Objectives (3-5 broad objectives)
3. Weekly breakdown for ${weeks} weeks, each including:
   - Week number
   - Topic/Theme
   - Specific objectives (2-3 per week)
   - Key inquiry questions (2-3 per week)
   - Learning experiences/activities (3-4 per week)
   - Core competencies (select from: Communication, Critical Thinking, Creativity, Collaboration, Citizenship, Digital Literacy)
   - Values (select from: Love, Unity, Responsibility, Respect, Integrity, Peace)
   - Resources needed
   - Assessment methods

Ensure the content is:
- Age-appropriate for ${grade}
- Aligned with CBC curriculum
- Progressive from week 1 to week ${weeks}
- Includes variety in learning experiences
- Has clear assessment strategies

Return the response in JSON format with the structure:
{
  "title": "...",
  "subject": "...",
  "grade": "...",
  "term": "...",
  "strand": "...",
  "subStrand": "...",
  "duration": "...",
  "weeks": ${weeks},
  "generalObjectives": ["...", "..."],
  "weeklyPlans": [
    {
      "week": 1,
      "topic": "...",
      "specificObjectives": ["...", "..."],
      "keyInquiryQuestions": ["...", "..."],
      "learningExperiences": ["...", "..."],
      "coreCompetencies": ["...", "..."],
      "values": ["...", "..."],
      "resources": ["...", "..."],
      "assessmentMethods": ["...", "..."]
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert CBC curriculum designer specializing in creating comprehensive schemes of work for Kenyan schools. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse the AI response as JSON
    let generatedScheme;
    try {
      generatedScheme = JSON.parse(aiResponse);
    } catch (parseError) {
      logger.error('Error parsing AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    logger.info(`AI scheme of work generated for ${subject} - ${grade} - ${term}`);

    res.json({
      success: true,
      data: generatedScheme
    });

  } catch (error) {
    logger.error('Error generating scheme of work with AI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate scheme of work. Please try again.'
    });
  }
});

export default router;
