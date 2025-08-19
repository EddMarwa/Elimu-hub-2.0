import express, { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import AIService from '../services/aiService';
import libraryService from '../services/libraryService';
import axios from 'axios';

const router = express.Router();

// Generate questions for a topic
router.post('/questions', asyncHandler(async (req: Request, res: Response) => {
  const { subject, grade, topic, numQuestions = 10, difficulty = 'mixed', questionTypes } = req.body || {};
  if (!subject || !grade || !topic) {
    return res.status(400).json({ success: false, message: 'subject, grade, and topic are required' });
  }

  const prompt = `
Generate ${numQuestions} ${difficulty} difficulty questions for the Kenyan CBC curriculum.
Subject: ${subject}
Grade: ${grade}
Topic: ${topic}
${Array.isArray(questionTypes) && questionTypes.length ? `Include types: ${questionTypes.join(', ')}.` : ''}

Return JSON with fields: questions: [ { number, type, question, options?, answer, markingScheme } ].`;

  const response = await AIService['callGrokAPI'](prompt);
  // Try to extract JSON
  let data: any = null;
  try {
    const m = response.match(/\{[\s\S]*\}/);
    data = m ? JSON.parse(m[0]) : null;
  } catch {}
  if (!data) data = { questions: [] };
  return res.json({ success: true, data });
}));

// Generate grading rubric
router.post('/grading-rubric', asyncHandler(async (req: Request, res: Response) => {
  const { subject, grade, topic, criteria } = req.body || {};
  if (!subject || !grade || !topic) {
    return res.status(400).json({ success: false, message: 'subject, grade, and topic are required' });
  }
  const prompt = `
Create an assessment grading rubric for CBC.
Subject: ${subject}
Grade: ${grade}
Topic: ${topic}
${criteria ? `Include criteria focus: ${criteria}` : ''}
Return JSON as: { rubric: [ { criterion, levels: [ { level: 'Exceeding', descriptors }, { level: 'Meeting', descriptors }, { level: 'Approaching', descriptors }, { level: 'Below', descriptors } ] } ] }.`;
  const response = await AIService['callGrokAPI'](prompt);
  let data: any = null;
  try {
    const m = response.match(/\{[\s\S]*\}/);
    data = m ? JSON.parse(m[0]) : null;
  } catch {}
  if (!data) data = { rubric: [] };
  return res.json({ success: true, data });
}));

// Assessment suggestions (methods and strategies)
router.post('/assessment', asyncHandler(async (req: Request, res: Response) => {
  const { subject, grade, topic, learningOutcomes } = req.body || {};
  if (!subject || !grade || !topic) {
    return res.status(400).json({ success: false, message: 'subject, grade, and topic are required' });
  }
  const prompt = `
Suggest assessment methods and grading strategies aligned to CBC.
Subject: ${subject}
Grade: ${grade}
Topic: ${topic}
${Array.isArray(learningOutcomes) && learningOutcomes.length ? `Learning outcomes: ${learningOutcomes.join('; ')}` : ''}
Return JSON: { formative: [ ... ], summative: [ ... ], gradingStrategies: [ ... ] }.`;
  const response = await AIService['callGrokAPI'](prompt);
  let data: any = null;
  try {
    const m = response.match(/\{[\s\S]*\}/);
    data = m ? JSON.parse(m[0]) : null;
  } catch {}
  if (!data) data = { formative: [], summative: [], gradingStrategies: [] };
  return res.json({ success: true, data });
}));

// References from library
router.get('/references', asyncHandler(async (req: Request, res: Response) => {
  const { q = '', tags, limit = '10' } = req.query;
  const userRole = 'TEACHER'; // default visibility (approved only)
  const tagArray = typeof tags === 'string' && tags.length > 0 ? (tags as string).split(',').map(t => t.trim()).filter(Boolean) : undefined;
  const limitNum = parseInt(limit as string);
  const { files } = await libraryService.getAllFiles(userRole, undefined, limitNum, 0, tagArray, typeof q === 'string' ? q : undefined);
  const items = files.map((f) => ({
    id: f.id,
    title: f.originalName,
    type: f.fileType,
    size: f.fileSize,
    url: `/uploads/library/${f.filename}`,
    description: f.description || '',
    section: f.section?.name,
    subfolder: f.subfolder?.name,
    uploadedAt: f.createdAt,
  }));
  return res.json({ success: true, data: items });
}));

// Generic chat endpoint for Elimu Hub AI
router.post('/chat', asyncHandler(async (req: Request, res: Response) => {
  console.log('AI /chat endpoint hit');
  const { messages, model, provider, max_tokens, temperature } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ success: false, message: 'messages array is required' });
  }
  try {
    const response = await AIService.chat({ messages, model, provider, max_tokens, temperature });
    return res.json({ success: true, data: response });
  } catch (error) {
    console.error('AI /chat error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    return res.status(500).json({ success: false, message: 'AI chat failed', error: error instanceof Error ? error.message : error });
  }
}));

// YouTube video search endpoint
router.get('/youtube/search', asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing query parameter q' });
  }
  // Only allow educational queries (simple keyword filter)
  const educationalKeywords = [
    'science', 'math', 'history', 'experiment', 'lesson', 'tutorial', 'education', 'cbc', 'curriculum', 'teacher', 'class', 'learning', 'demonstration', 'activity', 'explained', 'explainer', 'school', 'subject', 'topic', 'how to', 'explore', 'explain', 'study', 'revision', 'practice', 'exam', 'test', 'cbc', 'kenya', 'primary', 'secondary', 'grade', 'syllabus'
  ];
  const isEducational = educationalKeywords.some(kw => q.toLowerCase().includes(kw));
  if (!isEducational) {
    return res.status(200).json({ success: false, message: 'No educational video suggested for this topic.' });
  }
  try {
    const apiKey = 'AIzaSyAZk_pGC52sgHzFKdSD7FEDayAf636p-9Q';
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q,
        key: apiKey,
        maxResults: 1,
        type: 'video',
        videoCategoryId: 27, // Education
        relevanceLanguage: 'en',
        regionCode: 'US',
      },
    });
    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0];
      return res.json({
        success: true,
        video: {
          id: video.id,
          title: video.snippet.title,
          channelTitle: video.snippet.channelTitle,
          description: video.snippet.description,
          thumbnails: video.snippet.thumbnails,
        }
      });
    } else {
      return res.status(404).json({ success: false, message: 'No video found' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'YouTube API error', error });
  }
}));

export default router;


