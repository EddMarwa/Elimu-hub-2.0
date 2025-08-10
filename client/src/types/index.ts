// Shared TypeScript types for ElimuHub 2.0

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



export interface LearningExperience {
  id: string;
  activity: string;
  duration: number;
  methodology: string;
  resources: string[];
  assessment: string;
}

export interface AssessmentCriteria {
  id: string;
  criteria: string;
  exceeds: string;
  meets: string;
  approaches: string;
  below: string;
}

export interface SchemeOfWork {
  id: string;
  title: string;
  subject: string;
  grade: string;
  term: string;
  year: number;
  weeks: WeeklyPlan[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyPlan {
  id: string;
  weekNumber: number;
  topic: string;
  subtopics: string[];
  learningOutcomes: string[];
  coreCompetencies: string[];
  values: string[];
  keyInquiryQuestions: string[];
  suggestedActivities: string[];
  assessmentMethods: string[];
  resources: string[];
}

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
  tags: string[];
  subject?: string;
  grade?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  CURRICULUM = 'curriculum',
  GUIDELINE = 'guideline',
  TEMPLATE = 'template',
  REFERENCE = 'reference'
}

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  content: string;
  subject?: string;
  grade?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TemplateType {
  SCHEME_OF_WORK = 'scheme_of_work',
  ASSESSMENT = 'assessment'
}

export interface CBCTransition {
  id: string;
  currentCurriculum: string;
  targetGrade: string;
  subjects: string[];
  transitionPlan: TransitionStep[];
  timeline: string;
  resources: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransitionStep {
  id: string;
  phase: string;
  description: string;
  duration: string;
  activities: string[];
  deliverables: string[];
  responsible: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  school?: string;
  county?: string;
  subjects?: string[];
}

export interface DashboardStats {
  schemesOfWork: number;
  documents: number;
  collaborations: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Date;
}
