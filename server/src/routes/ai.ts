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

// Generate lesson plan
router.post('/lesson-plan', asyncHandler(async (req: Request, res: Response) => {
  const { subject, grade, topic, objectives, context } = req.body || {};
  if (!subject || !grade || !topic) {
    return res.status(400).json({ success: false, message: 'subject, grade, and topic are required' });
  }
  const prompt = `Generate a detailed CBC-compliant lesson plan for:\nSubject: ${subject}\nGrade: ${grade}\nTopic: ${topic}\nObjectives: ${objectives || ''}\n${context ? `Context: ${context}` : ''}\n\nReturn JSON with fields: lessonPlan: { subject, grade, topic, objectives, introduction, lessonDevelopment, activities, assessment, resources, conclusion }.`;
  const response = await AIService['callGrokAPI'](prompt);
  let data: any = null;
  try {
    const m = response.match(/\{[\s\S]*\}/);
    data = m ? JSON.parse(m[0]) : null;
  } catch {}
  if (!data) data = { lessonPlan: {} };
  return res.json({ success: true, data });
}));

// Generate lesson notes
router.post('/lesson-notes', asyncHandler(async (req: Request, res: Response) => {
  const { subject, grade, topic, scheme, lessonPlan, context } = req.body || {};
  if (!subject || !grade || !topic) {
    return res.status(400).json({ success: false, message: 'subject, grade, and topic are required' });
  }
  const prompt = `Generate concise CBC lesson notes for:\nSubject: ${subject}\nGrade: ${grade}\nTopic: ${topic}\n${scheme ? `Scheme of Work: ${JSON.stringify(scheme)}` : ''}\n${lessonPlan ? `Lesson Plan: ${JSON.stringify(lessonPlan)}` : ''}\n${context ? `Context: ${context}` : ''}\n\nReturn JSON with fields: lessonNotes: { subject, grade, topic, summary, keyPoints, activities, assessment, conclusion }.`;
  const response = await AIService['callGrokAPI'](prompt);
  let data: any = null;
  try {
    const m = response.match(/\{[\s\S]*\}/);
    data = m ? JSON.parse(m[0]) : null;
  } catch {}
  if (!data) data = { lessonNotes: {} };
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

// Summarize any document or text
router.post('/summarize', asyncHandler(async (req: Request, res: Response) => {
  const { text, context } = req.body || {};
  if (!text) {
    return res.status(400).json({ success: false, message: 'text is required' });
  }
  const prompt = `Summarize the following educational content for a teacher. Provide a concise summary and 3-5 key points.\n\n${text}\n\nReturn JSON: { summary: string, keyPoints: string[] }.`;
  const response = await AIService['callGrokAPI'](prompt);
  let data: any = null;
  try {
    const m = response.match(/\{[\s\S]*\}/);
    data = m ? JSON.parse(m[0]) : null;
  } catch {}
  if (!data) data = { summary: '', keyPoints: [] };
  return res.json({ success: true, data });
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
    // Safe error serialization to avoid circular references
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Provide helpful error message for missing API keys
    if (errorMessage.includes('No AI API keys configured')) {
      return res.status(500).json({ 
        success: false, 
        message: 'AI service not configured', 
        error: 'Please configure GROQ_API_KEY or OPENROUTER_API_KEY environment variables to use AI features.',
        setupInstructions: 'Add your API keys to the server/.env file. See env.example for the required format.'
      });
    }
    
    return res.status(500).json({ success: false, message: 'AI chat failed', error: errorMessage });
  }
}));

// YouTube video search endpoint
router.get('/youtube/search', asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing query parameter q' });
  }
  // For now, allow all queries to pass through for testing
  // TODO: Implement proper educational content filtering
  console.log('Processing YouTube search for query:', q);
  try {
    const apiKey = process.env.YOUTUBE_API_KEY || 'AIzaSyAZk_pGC52sgHzFKdSD7FEDayAf636p-9Q';
    console.log('YouTube search query:', q);
    console.log('Using YouTube API key:', apiKey ? '[set]' : '[missing]');
    
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
    console.error('YouTube API error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    
    // Check if it's an API key issue
    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(500).json({ 
        success: false, 
        message: 'YouTube API key error', 
        error: 'Please configure YOUTUBE_API_KEY environment variable for video search features.',
        setupInstructions: 'Add your YouTube Data API v3 key to the server/.env file.'
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'YouTube API error', 
      error: error instanceof Error ? error.message : String(error)
    });
  }
}));

export default router;


