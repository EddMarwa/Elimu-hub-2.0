// Server TypeScript types for ElimuHub 2.0

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  school?: string;
  county?: string;
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

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[];
  createdAt: Date;
}

export interface ChunkMetadata {
  page?: number;
  section?: string;
  subsection?: string;
  source: string;
  [key: string]: any;
}

export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
  rank: number;
}

export interface EmbeddingResponse {
  chunks: DocumentChunk[];
  embedding: number[];
}

export interface GenerateRequest {
  subject: string;
  grade: string;
  topic: string;
  duration?: number;
  specificRequirements?: string[];
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  school?: string;
  county?: string;
  subjects?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
