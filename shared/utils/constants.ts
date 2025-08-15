// Shared constants for ElimuHub 2.0

export const CBC_SUBJECTS = {
  MATHEMATICS: 'Mathematics',
  ENGLISH: 'English',
  KISWAHILI: 'Kiswahili',
  SCIENCE: 'Science and Technology',
  SOCIAL_STUDIES: 'Social Studies',
  CRE: 'Christian Religious Education',
  IRE: 'Islamic Religious Education',
  HRE: 'Hindu Religious Education',
  CREATIVE_ARTS: 'Creative Arts',
  PHYSICAL_EDUCATION: 'Physical and Health Education'
} as const;

export const CBC_GRADES = {
  PP1: 'Pre-Primary 1',
  PP2: 'Pre-Primary 2',
  GRADE_1: 'Grade 1',
  GRADE_2: 'Grade 2',
  GRADE_3: 'Grade 3',
  GRADE_4: 'Grade 4',
  GRADE_5: 'Grade 5',
  GRADE_6: 'Grade 6',
  GRADE_7: 'Grade 7',
  GRADE_8: 'Grade 8',
  GRADE_9: 'Grade 9'
} as const;

export const CORE_COMPETENCIES = [
  'Communication and Collaboration',
  'Critical Thinking and Problem Solving',
  'Creativity and Imagination',
  'Citizenship',
  'Digital Literacy',
  'Learning to Learn',
  'Self-Efficacy'
] as const;

export const CBC_VALUES = [
  'Love',
  'Responsibility',
  'Respect',
  'Unity',
  'Peace',
  'Patriotism',
  'Social Justice'
] as const;

export const LIFE_SKILLS = [
  'Self-Awareness',
  'Self-Esteem',
  'Assertiveness',
  'Decision Making',
  'Friendship Formation',
  'Negotiation Skills',
  'Effective Communication',
  'Coping with Emotions',
  'Coping with Stress'
] as const;

export const ASSESSMENT_LEVELS = {
  EXCEEDING: 'Exceeding Expectations',
  MEETING: 'Meeting Expectations',
  APPROACHING: 'Approaching Expectations',
  BELOW: 'Below Expectations'
} as const;

export const LESSON_DURATION_OPTIONS = [
  30, 35, 40, 45, 60, 70, 80, 90, 120
] as const;

export const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
  'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui',
  'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
] as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile'
  },
  DOCUMENTS: {
    UPLOAD: '/api/documents/upload',
    LIST: '/api/documents',
    GET: '/api/documents/:id',
    DELETE: '/api/documents/:id',
    PROCESS: '/api/documents/:id/process'
  },

  SCHEMES: {
    CREATE: '/api/schemes',
    LIST: '/api/schemes',
    GET: '/api/schemes/:id',
    UPDATE: '/api/schemes/:id',
    DELETE: '/api/schemes/:id',
    GENERATE: '/api/schemes/generate'
  },
  LESSON_PLANS: {
    CREATE: '/api/lesson-plans',
    LIST: '/api/lesson-plans',
    GET: '/api/lesson-plans/:id',
    UPDATE: '/api/lesson-plans/:id',
    DELETE: '/api/lesson-plans/:id',
    DOWNLOAD: '/api/lesson-plans/:id/download',
    FOLDERS: '/api/lesson-plans/folders',
    COMMENTS: '/api/lesson-plans/:id/comments',
    SHARE: '/api/lesson-plans/:id/share'
  },
  TEMPLATES: {
    LIST: '/api/templates',
    GET: '/api/templates/:id'
  }
} as const;

export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['application/pdf'],
  MAX_FILES: 5
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
} as const;

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d'
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  PROCESSING_FAILED: 'Document processing failed'
} as const;