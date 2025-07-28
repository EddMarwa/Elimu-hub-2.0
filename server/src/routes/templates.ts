import { Router } from 'express';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Get templates endpoint - to be implemented'
  });
}));

// @desc    Get single template
// @route   GET /api/templates/:id
// @access  Private
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Get single template endpoint - to be implemented'
  });
}));

export default router;