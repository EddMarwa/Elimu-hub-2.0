import { Router } from 'express';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import searchService from '../services/searchService';
import logger from '../utils/logger';

const router = Router();

// @desc    Perform semantic search
// @route   POST /api/search
// @access  Private
router.post('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    query,
    filters,
    sortBy,
    sortOrder,
    page = 1,
    limit = 10
  } = req.body;

  try {
    const searchQuery = {
      query: query || '',
      filters,
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await searchService.semanticSearch(searchQuery);

    // Log search activity
    logger.info('Search performed', {
      userId: req.user!.id,
      query: searchQuery.query,
      filters: searchQuery.filters,
      resultsCount: result.results.length,
      queryTime: result.stats.queryTime
    });

    res.status(200).json({
      success: true,
      data: result.results,
      stats: result.stats,
      message: `Found ${result.stats.totalResults} results`
    });

  } catch (error) {
    logger.error('Search failed', { error, userId: req.user!.id, query });
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Private
router.get('/suggestions', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string' || query.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Query must be at least 2 characters long'
    });
  }

  try {
    const suggestions = await searchService.getSearchSuggestions(query);

    res.status(200).json({
      success: true,
      data: suggestions,
      message: 'Search suggestions retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get search suggestions', { error, query });
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get popular searches
// @route   GET /api/search/popular
// @access  Private
router.get('/popular', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const popularSearches = await searchService.getPopularSearches();

    res.status(200).json({
      success: true,
      data: popularSearches,
      message: 'Popular searches retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get popular searches', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to get popular searches',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Advanced search with filters
// @route   POST /api/search/advanced
// @access  Private
router.post('/advanced', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const {
    query,
    filters,
    sortBy,
    sortOrder,
    page = 1,
    limit = 20
  } = req.body;

  try {
    // Validate filters
    const validatedFilters = validateFilters(filters);

    const searchQuery = {
      query: query || '',
      filters: validatedFilters,
      sortBy,
      sortOrder,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await searchService.semanticSearch(searchQuery);

    // Log advanced search
    logger.info('Advanced search performed', {
      userId: req.user!.id,
      query: searchQuery.query,
      filters: searchQuery.filters,
      resultsCount: result.results.length,
      queryTime: result.stats.queryTime
    });

    res.status(200).json({
      success: true,
      data: result.results,
      stats: result.stats,
      message: `Found ${result.stats.totalResults} results with advanced filters`
    });

  } catch (error) {
    logger.error('Advanced search failed', { error, userId: req.user!.id, query, filters });
    res.status(500).json({
      success: false,
      message: 'Advanced search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Search within specific subject
// @route   GET /api/search/subject/:subject
// @access  Private
router.get('/subject/:subject', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { subject } = req.params;
  const { query, grade, page = 1, limit = 10 } = req.query;

  try {
    const filters: any = { subject };
    
    if (grade) {
      filters.grade = grade;
    }

    const searchQuery = {
      query: query as string || '',
      filters,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await searchService.semanticSearch(searchQuery);

    res.status(200).json({
      success: true,
      data: result.results,
      stats: result.stats,
      message: `Found ${result.stats.totalResults} results in ${subject}`
    });

  } catch (error) {
    logger.error('Subject search failed', { error, subject, userId: req.user!.id });
    res.status(500).json({
      success: false,
      message: 'Subject search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Search within specific grade
// @route   GET /api/search/grade/:grade
// @access  Private
router.get('/grade/:grade', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { grade } = req.params;
  const { query, subject, page = 1, limit = 10 } = req.query;

  try {
    const filters: any = { grade };
    
    if (subject) {
      filters.subject = subject;
    }

    const searchQuery = {
      query: query as string || '',
      filters,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await searchService.semanticSearch(searchQuery);

    res.status(200).json({
      success: true,
      data: result.results,
      stats: result.stats,
      message: `Found ${result.stats.totalResults} results for grade ${grade}`
    });

  } catch (error) {
    logger.error('Grade search failed', { error, grade, userId: req.user!.id });
    res.status(500).json({
      success: false,
      message: 'Grade search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Search by date range
// @route   POST /api/search/date-range
// @access  Private
router.post('/date-range', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate, query, filters, page = 1, limit = 10 } = req.body;

  try {
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    const searchFilters = {
      ...filters,
      dateRange: { start, end }
    };

    const searchQuery = {
      query: query || '',
      filters: searchFilters,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await searchService.semanticSearch(searchQuery);

    res.status(200).json({
      success: true,
      data: result.results,
      stats: result.stats,
      message: `Found ${result.stats.totalResults} results between ${startDate} and ${endDate}`
    });

  } catch (error) {
    logger.error('Date range search failed', { error, userId: req.user!.id, startDate, endDate });
    res.status(500).json({
      success: false,
      message: 'Date range search failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Get search statistics
// @route   GET /api/search/stats
// @access  Private
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get search statistics for the user
    const userSearchStats = await getUserSearchStats(req.user!.id);

    res.status(200).json({
      success: true,
      data: userSearchStats,
      message: 'Search statistics retrieved successfully'
    });

  } catch (error) {
    logger.error('Failed to get search statistics', { error, userId: req.user!.id });
    res.status(500).json({
      success: false,
      message: 'Failed to get search statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// @desc    Save search query for analytics
// @route   POST /api/search/save-query
// @access  Private
router.post('/save-query', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { query, filters, resultsCount, queryTime } = req.body;

  try {
    // TODO: Implement search analytics storage
    // For now, just log the search
    logger.info('Search query saved for analytics', {
      userId: req.user!.id,
      query,
      filters,
      resultsCount,
      queryTime
    });

    res.status(200).json({
      success: true,
      message: 'Search query saved successfully'
    });

  } catch (error) {
    logger.error('Failed to save search query', { error, userId: req.user!.id });
    res.status(500).json({
      success: false,
      message: 'Failed to save search query',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Helper method to validate search filters
function validateFilters(filters: any): any {
  const validated: any = {};

  if (filters?.subject && typeof filters.subject === 'string') {
    validated.subject = filters.subject.trim();
  }

  if (filters?.grade && typeof filters.grade === 'string') {
    validated.grade = filters.grade.trim();
  }

  if (filters?.documentType && typeof filters.documentType === 'string') {
    validated.documentType = filters.documentType.trim();
  }

  if (filters?.uploadedBy && typeof filters.uploadedBy === 'string') {
    validated.uploadedBy = filters.uploadedBy.trim();
  }

  if (filters?.tags && Array.isArray(filters.tags)) {
    validated.tags = filters.tags.filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0);
  }

  return validated;
}

// Helper method to get user search statistics
async function getUserSearchStats(userId: string): Promise<any> {
  // TODO: Implement actual search analytics
  // For now, return mock data
  return {
    totalSearches: 0,
    averageQueryTime: 0,
    mostSearchedTerms: [],
    favoriteSubjects: [],
    searchHistory: []
  };
}

export default router;
