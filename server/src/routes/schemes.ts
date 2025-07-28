import { Router } from 'express';
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../middleware/errorHandler';
import { EmbeddingService } from '../services/embeddingService';
import { ExportService } from '../services/exportService';
import { logger } from '../utils/logger';

const router = Router();

// CBC Standards for Scheme of Work
const CBC_CORE_COMPETENCIES = [
  'Communication and Collaboration',
  'Critical Thinking and Problem Solving',
  'Imagination and Creativity',
  'Citizenship',
  'Digital Literacy',
  'Learning to Learn',
  'Self-Efficacy'
];

const CBC_VALUES = [
  'Love',
  'Responsibility',
  'Respect',
  'Unity',
  'Peace',
  'Patriotism',
  'Social Justice'
];

// @desc    Generate scheme of work using curriculum references
// @route   POST /api/schemes/generate
// @access  Private
router.post('/generate', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { subject, grade, term, weeks = 12, topics } = req.body;

    if (!subject || !grade || !term) {
      return res.status(400).json({
        success: false,
        message: 'Subject, grade, and term are required'
      });
    }

    // Search for relevant curriculum content
    const embeddingService = EmbeddingService.getInstance();
    const searchQuery = `${subject} ${grade} term ${term} topics learning outcomes activities`;
    
    const curriculumReferences = await embeddingService.searchSimilar(
      searchQuery,
      10
    );

    // Generate weekly plans
    const weeklyPlans = await generateWeeklyPlans(
      subject,
      grade,
      term,
      weeks,
      topics,
      curriculumReferences
    );

    // Generate CBC-compliant scheme of work
    const schemeOfWork = {
      id: `scheme_${Date.now()}`,
      title: `${subject} - Grade ${grade} - Term ${term}`,
      subject,
      grade,
      term,
      weeks: weeklyPlans,
      overallObjectives: await generateOverallObjectives(subject, grade, curriculumReferences),
      coreCompetencies: CBC_CORE_COMPETENCIES,
      values: CBC_VALUES,
      createdBy: 'system', // TODO: Get from auth
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(200).json({
      success: true,
      data: {
        schemeOfWork,
        curriculumReferences: curriculumReferences.map(ref => ({
          content: ref.chunk.content.substring(0, 200) + '...',
          similarity: ref.similarity,
          source: ref.chunk.metadata.source
        }))
      }
    });

  } catch (error) {
    logger.error('Scheme of work generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate scheme of work',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Export scheme of work to DOCX or PDF
// @route   POST /api/schemes/:id/export
// @access  Private
router.post('/:id/export', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { format = 'docx', schemeOfWork } = req.body;

    if (!schemeOfWork) {
      return res.status(400).json({
        success: false,
        message: 'Scheme of work data is required'
      });
    }

    const exportService = ExportService.getInstance();
    const filePath = await exportService.exportSchemeOfWork(schemeOfWork, { format });

    res.status(200).json({
      success: true,
      data: {
        filePath,
        downloadUrl: `/api/schemes/download/${path.basename(filePath)}`
      }
    });

  } catch (error) {
    logger.error('Scheme of work export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export scheme of work',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Download exported scheme of work
// @route   GET /api/schemes/download/:filename
// @access  Private
router.get('/download/:filename', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'backend', 'outputs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.download(filePath, filename);

  } catch (error) {
    logger.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get scheme template for subject and grade
// @route   GET /api/schemes/template
// @access  Private
router.get('/template', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { subject, grade, term } = req.query;

    if (!subject || !grade || !term) {
      return res.status(400).json({
        success: false,
        message: 'Subject, grade, and term are required'
      });
    }

    // Generate a template with common topics for the subject/grade
    const template = await generateSchemeTemplate(
      subject as string,
      grade as string,
      parseInt(term as string)
    );

    res.status(200).json({
      success: true,
      data: template
    });

  } catch (error) {
    logger.error('Template generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Create scheme of work
// @route   POST /api/schemes
// @access  Private
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const schemeOfWork = {
      id: `scheme_${Date.now()}`,
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // TODO: Save to database
    
    res.status(201).json({
      success: true,
      data: schemeOfWork
    });

  } catch (error) {
    logger.error('Create scheme of work error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scheme of work',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get all schemes of work
// @route   GET /api/schemes
// @access  Private
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    // TODO: Get from database
    const schemes: any[] = [];

    res.status(200).json({
      success: true,
      data: schemes
    });

  } catch (error) {
    logger.error('Get schemes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schemes of work',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get single scheme of work
// @route   GET /api/schemes/:id
// @access  Private
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Get from database
    const scheme = null;

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme of work not found'
      });
    }

    res.status(200).json({
      success: true,
      data: scheme
    });

  } catch (error) {
    logger.error('Get scheme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheme of work',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Update scheme of work
// @route   PUT /api/schemes/:id
// @access  Private
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Update in database
    const updatedScheme = {
      id,
      ...req.body,
      updatedAt: new Date()
    };

    res.status(200).json({
      success: true,
      data: updatedScheme
    });

  } catch (error) {
    logger.error('Update scheme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheme of work',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Delete scheme of work
// @route   DELETE /api/schemes/:id
// @access  Private
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // TODO: Delete from database

    res.status(200).json({
      success: true,
      message: 'Scheme of work deleted successfully'
    });

  } catch (error) {
    logger.error('Delete scheme error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheme of work',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Helper functions
async function generateWeeklyPlans(
  subject: string,
  grade: string,
  term: number,
  totalWeeks: number,
  providedTopics: string[] = [],
  references: any[]
): Promise<any[]> {
  const weeklyPlans: any[] = [];
  
  // Default topics by subject if not provided
  const defaultTopics = getDefaultTopics(subject, grade, term);
  const topics = providedTopics.length > 0 ? providedTopics : defaultTopics;
  
  for (let week = 1; week <= totalWeeks; week++) {
    const topicIndex = Math.floor((week - 1) / Math.ceil(totalWeeks / topics.length));
    const topic = topics[topicIndex] || `${subject} Topic ${week}`;
    
    const weeklyPlan = {
      week,
      topic,
      subTopics: await generateSubTopics(topic, subject),
      learningOutcomes: await generateWeeklyLearningOutcomes(topic, subject, references),
      keyInquiryQuestions: await generateWeeklyInquiryQuestions(topic),
      learningExperiences: await generateWeeklyLearningExperiences(topic, subject),
      coreCompetencies: selectWeeklyCompetencies(subject, topic),
      values: selectWeeklyValues(topic),
      assessmentMethods: await generateAssessmentMethods(topic, subject),
      resources: await generateWeeklyResources(topic, subject, references)
    };
    
    weeklyPlans.push(weeklyPlan);
  }
  
  return weeklyPlans;
}

function getDefaultTopics(subject: string, grade: string, term: number): string[] {
  const subjectLower = subject.toLowerCase();
  
  if (subjectLower.includes('math')) {
    return [
      'Numbers and Number Operations',
      'Measurement',
      'Geometry',
      'Data Handling',
      'Patterns and Algebra'
    ];
  } else if (subjectLower.includes('english')) {
    return [
      'Listening and Speaking',
      'Reading',
      'Writing',
      'Language Use',
      'Literature'
    ];
  } else if (subjectLower.includes('science')) {
    return [
      'Living and Non-living Things',
      'Materials and Their Properties',
      'Energy',
      'Forces and Motion',
      'Environment and Conservation'
    ];
  } else if (subjectLower.includes('social')) {
    return [
      'Our Community',
      'Our Country Kenya',
      'Our Environment',
      'Our Culture and Heritage',
      'Citizenship and Leadership'
    ];
  }
  
  return [`${subject} Topic 1`, `${subject} Topic 2`, `${subject} Topic 3`];
}

async function generateSubTopics(topic: string, subject: string): Promise<string[]> {
  return [
    `Introduction to ${topic}`,
    `Key concepts in ${topic}`,
    `Applications of ${topic}`,
    `Assessment and evaluation`
  ];
}

async function generateWeeklyLearningOutcomes(topic: string, subject: string, references: any[]): Promise<string[]> {
  return [
    `Learners will understand the basic concepts of ${topic}`,
    `Learners will be able to apply ${topic} knowledge in practical situations`,
    `Learners will demonstrate skills related to ${topic}`
  ];
}

async function generateWeeklyInquiryQuestions(topic: string): Promise<string[]> {
  return [
    `What do you know about ${topic}?`,
    `How is ${topic} used in daily life?`,
    `What problems can ${topic} help us solve?`
  ];
}

async function generateWeeklyLearningExperiences(topic: string, subject: string): Promise<string[]> {
  return [
    `Interactive discussion on ${topic}`,
    `Hands-on activities related to ${topic}`,
    `Group work and presentations`,
    `Individual practice and reflection`
  ];
}

function selectWeeklyCompetencies(subject: string, topic: string): string[] {
  return CBC_CORE_COMPETENCIES.slice(0, 3);
}

function selectWeeklyValues(topic: string): string[] {
  return CBC_VALUES.slice(0, 2);
}

async function generateAssessmentMethods(topic: string, subject: string): Promise<string[]> {
  return [
    'Observation',
    'Oral questioning',
    'Practical activities',
    'Written exercises',
    'Peer assessment'
  ];
}

async function generateWeeklyResources(topic: string, subject: string, references: any[]): Promise<string[]> {
  return [
    'Textbooks and reference materials',
    'Visual aids and charts',
    'Learning materials and manipulatives',
    'Digital resources',
    'Community resources'
  ];
}

async function generateOverallObjectives(subject: string, grade: string, references: any[]): Promise<string[]> {
  return [
    `Develop comprehensive understanding of ${subject} concepts appropriate for ${grade}`,
    `Apply ${subject} knowledge and skills in real-life situations`,
    `Demonstrate critical thinking and problem-solving abilities in ${subject}`,
    `Show appreciation for the importance of ${subject} in daily life`
  ];
}

async function generateSchemeTemplate(subject: string, grade: string, term: number): Promise<any> {
  const topics = getDefaultTopics(subject, grade, term);
  const weeks = 12; // Standard term length
  
  return {
    subject,
    grade,
    term,
    suggestedWeeks: weeks,
    suggestedTopics: topics,
    coreCompetencies: CBC_CORE_COMPETENCIES,
    values: CBC_VALUES,
    assessmentMethods: [
      'Formative Assessment',
      'Summative Assessment',
      'Peer Assessment',
      'Self Assessment',
      'Portfolio Assessment'
    ]
  };
}

export default router;