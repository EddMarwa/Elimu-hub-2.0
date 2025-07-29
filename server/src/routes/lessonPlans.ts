import { Router } from 'express';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import lessonPlanService from '../services/lessonPlanService';

const router = Router();

// @desc    Get all lesson plans
// @route   GET /api/lesson-plans
// @access  Public
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { subject, grade, search } = req.query;

  let lessonPlans;

  if (search) {
    lessonPlans = await lessonPlanService.searchLessonPlans(
      search as string,
      subject as string,
      grade as string
    );
  } else if (subject && grade) {
    lessonPlans = await lessonPlanService.getLessonPlansBySubjectAndGrade(
      subject as string,
      grade as string
    );
  } else {
    lessonPlans = await lessonPlanService.getAllLessonPlans();
  }

  res.status(200).json({
    success: true,
    data: lessonPlans
  });
}));

// @desc    Get lesson plan by ID
// @route   GET /api/lesson-plans/:id
// @access  Public
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const lessonPlan = await lessonPlanService.getLessonPlanById(id);

  if (!lessonPlan) {
    return res.status(404).json({
      success: false,
      message: 'Lesson plan not found'
    });
  }

  res.status(200).json({
    success: true,
    data: lessonPlan
  });
}));

// @desc    Create new lesson plan
// @route   POST /api/lesson-plans
// @access  Private
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const lessonPlanData = req.body;

  // In a real app, you'd get createdBy from the authenticated user
  // For now, we'll use a placeholder or require it in the request
  if (!lessonPlanData.createdBy) {
    return res.status(400).json({
      success: false,
      message: 'createdBy field is required'
    });
  }

  const lessonPlan = await lessonPlanService.createLessonPlan(lessonPlanData);

  res.status(201).json({
    success: true,
    message: 'Lesson plan created successfully',
    data: lessonPlan
  });
}));

// @desc    Generate AI lesson plan
// @route   POST /api/lesson-plans/generate
// @access  Private
router.post('/generate', asyncHandler(async (req: Request, res: Response) => {
  const { subject, grade, topic, duration, context } = req.body;
  
  // TODO: Get user ID from auth middleware
  const createdBy = 'system'; // Temporary until auth middleware is implemented

  if (!subject || !grade || !topic || !duration) {
    return res.status(400).json({
      success: false,
      message: 'Subject, grade, topic, and duration are required'
    });
  }

  const lessonPlan = await lessonPlanService.generateLessonPlanWithAI({
    subject,
    grade,
    topic,
    duration: parseInt(duration),
    createdBy,
    context
  });

  res.status(201).json({
    success: true,
    message: 'AI lesson plan generated successfully',
    data: lessonPlan
  });
}));

// @desc    Update lesson plan
// @route   PUT /api/lesson-plans/:id
// @access  Private
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const lessonPlan = await lessonPlanService.updateLessonPlan(id, updateData);

  res.status(200).json({
    success: true,
    message: 'Lesson plan updated successfully',
    data: lessonPlan
  });
}));

// @desc    Delete lesson plan
// @route   DELETE /api/lesson-plans/:id
// @access  Private
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await lessonPlanService.deleteLessonPlan(id);

  res.status(200).json({
    success: true,
    message: 'Lesson plan deleted successfully'
  });
}));

// @desc    Get user's lesson plans
// @route   GET /api/lesson-plans/user/:userId
// @access  Private
router.get('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const lessonPlans = await lessonPlanService.getLessonPlansByUser(userId);

  res.status(200).json({
    success: true,
    data: lessonPlans
  });
}));

export default router;
