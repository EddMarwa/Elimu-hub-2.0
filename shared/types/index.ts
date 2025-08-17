// Shared TypeScript types for ElimuHub 2.0

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  school?: string;
  county?: string;
  bio?: string;
  avatar?: string;
  subjects?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}





export interface SchemeOfWork {
  id: string;
  title: string;
  subject: string;
  grade: string;
  term: number;
  weeks: WeeklyPlan[];
  overallObjectives: string[];
  coreCompetencies: string[];
  values: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyPlan {
  week: number;
  topic: string;
  subTopics: string[];
  learningOutcomes: string[];
  keyInquiryQuestions: string[];
  learningExperiences: string[];
  coreCompetencies: string[];
  values: string[];
  assessmentMethods: string[];
  resources: string[];
}

export interface CurriculumDocument {
  id: string;
  title: string;
  subject: string;
  grade: string;
  documentType: DocumentType;
  filePath: string;
  extractedContent: string;
  processingStatus: ProcessingStatus;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  CURRICULUM_DESIGN = 'curriculum_design',
  TEACHERS_GUIDE = 'teachers_guide',
  LEARNERS_BOOK = 'learners_book',
  ASSESSMENT_RUBRIC = 'assessment_rubric'
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface CBCStandards {
  subjects: Subject[];
  grades: Grade[];
  coreCompetencies: CoreCompetency[];
  values: Value[];
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  grades: string[];
}

export interface Grade {
  id: string;
  name: string;
  level: string;
  ageRange: string;
}

export interface CoreCompetency {
  id: string;
  name: string;
  description: string;
  indicators: string[];
}

export interface Value {
  id: string;
  name: string;
  description: string;
  indicators: string[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GenerationRequest {
  documentId: string;
  type: 'scheme_of_work';
  subject: string;
  grade: string;
  topic?: string;
  duration?: number;
  term?: number;
  customInstructions?: string;
}

export interface GenerationResponse {
  id: string;
  content: SchemeOfWork;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
  estimatedTime?: number;
}

export interface LessonPlan {
  id: string;
  title: string;
  description: string;
  grade: string;
  subject: string;
  tags: string[];
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  folderId?: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    firstName: string;
    lastName: string;
  };
  folder?: {
    id: string;
    name: string;
  };
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  lessonPlanCount?: number;
}

export interface Comment {
  id: string;
  content: string;
  rating: number;
  userId: string;
  lessonPlanId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    firstName: string;
    lastName: string;
  };
}