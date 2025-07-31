import express from 'express';
import { PrismaClient } from '../generated/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';
import OpenAI from 'openai';

const router = express.Router();
const prisma = new PrismaClient();

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
    
    const schemes = await prisma.schemeOfWork.findMany({
      where: {
        createdBy: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: schemes
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

// Generate scheme of work with AI
router.post('/generate', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      subject,
      grade,
      term,
      strand,
      subStrand,
      weeks,
      duration,
      context
    } = req.body;

    if (!openai) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please configure OpenAI API key.'
      });
    }

    const prompt = `
Generate a comprehensive CBC (Competency Based Curriculum) scheme of work with the following details:

Subject: ${subject}
Grade: ${grade}
Term: ${term}
Strand: ${strand}
Sub-Strand: ${subStrand}
Duration: ${duration}
Number of Weeks: ${weeks}

${context ? `Additional Context: ${context}` : ''}

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
