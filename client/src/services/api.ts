import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { User, LessonPlan, SchemeOfWork, CurriculumDocument, GenerationRequest } from '../../../shared/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    school?: string;
    county?: string;
    subjects?: string[];
  }) => api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/profile'),
  
  updateProfile: (userData: Partial<User>) =>
    api.put('/auth/profile', userData),
  
  refreshToken: () => api.post('/auth/refresh'),
};

// Documents API
export const documentsAPI = {
  upload: (formData: FormData) =>
    api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  getAll: (params?: { page?: number; limit?: number; subject?: string; grade?: string }) =>
    api.get('/documents', { params }),
  
  getById: (id: string) => api.get(`/documents/${id}`),
  
  delete: (id: string) => api.delete(`/documents/${id}`),
  
  process: (id: string) => api.post(`/documents/${id}/process`),
};

// Lesson Plans API
export const lessonPlansAPI = {
  generate: (request: GenerationRequest) =>
    api.post('/lesson-plans/generate', request),
  
  generateWithAI: (data: {
    subject: string;
    grade: string;
    topic: string;
    duration: number;
    context?: string;
  }) => api.post('/lesson-plans/generate', data),
  
  create: (lessonPlan: Partial<LessonPlan>) =>
    api.post('/lesson-plans', lessonPlan),
  
  getAll: (params?: { page?: number; limit?: number; subject?: string; grade?: string; search?: string }) =>
    api.get('/lesson-plans', { params }),
  
  getById: (id: string) => api.get(`/lesson-plans/${id}`),
  
  update: (id: string, lessonPlan: Partial<LessonPlan>) =>
    api.put(`/lesson-plans/${id}`, lessonPlan),
  
  delete: (id: string) => api.delete(`/lesson-plans/${id}`),

  export: (id: string, format: 'docx' | 'pdf') =>
    api.post(`/lesson-plans/${id}/export`, { format }, { responseType: 'blob' }),
};

// Schemes of Work API
export const schemesAPI = {
  generateWithAI: (data: {
    subject: string;
    grade: string;
    term: string;
    strand: string;
    subStrand?: string;
    weeks: number;
    duration: string;
    context?: string;
    templateContent?: any;
  }) => api.post('/schemes/generate', data),
  
  uploadTemplate: (file: File, metadata?: { subject?: string; grade?: string }) => {
    const formData = new FormData();
    formData.append('template', file);
    if (metadata?.subject) formData.append('subject', metadata.subject);
    if (metadata?.grade) formData.append('grade', metadata.grade);
    return api.post('/schemes/upload-template', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getTemplates: () => api.get('/schemes/templates'),
  
  getTemplate: (id: string) => api.get(`/schemes/templates/${id}`),
  
  deleteTemplate: (id: string) => api.delete(`/schemes/templates/${id}`),
  
  create: (scheme: any) => api.post('/schemes', scheme),
  
  getAll: (params?: { page?: number; limit?: number; subject?: string; grade?: string; term?: string }) =>
    api.get('/schemes', { params }),
  
  getById: (id: string) => api.get(`/schemes/${id}`),
  
  update: (id: string, scheme: any) => api.put(`/schemes/${id}`, scheme),
  
  delete: (id: string) => api.delete(`/schemes/${id}`),
};

// Templates API
export const templatesAPI = {
  getAll: () => api.get('/templates'),
  
  getById: (id: string) => api.get(`/templates/${id}`),
};

// Users API (Admin only)
export const usersAPI = {
  getAll: (params?: { page?: number; limit?: number; role?: string }) =>
    api.get('/users', { params }),
  
  getById: (id: string) => api.get(`/users/${id}`),
  
  update: (id: string, userData: Partial<User>) =>
    api.put(`/users/${id}`, userData),
  
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Admin User Management API
export const adminUsersAPI = {
  getUsers: (params?: { 
    page?: number; 
    limit?: number; 
    role?: string; 
    status?: string; 
    search?: string; 
  }) => api.get('/admin/users', { params }),
  
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  
  createUser: (userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    school?: string;
    county?: string;
    subjects?: string[];
  }) => api.post('/admin/users', userData),
  
  updateUser: (id: string, userData: any) => api.put(`/admin/users/${id}`, userData),
  
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  
  bulkUpdateUsers: (userIds: string[], updates: any) =>
    api.patch('/admin/users/bulk', { userIds, updates }),
  
  changeUserStatus: (id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') =>
    api.patch(`/admin/users/${id}/status`, { status }),
  
  resetUserPassword: (id: string) => api.post(`/admin/users/${id}/reset-password`),
  
  getAuditLogs: (params?: { 
    userId?: string; 
    action?: string; 
    page?: number; 
    limit?: number; 
  }) => api.get('/admin/users/audit-logs', { params }),
  
  exportUsers: (params?: { format?: 'csv' | 'excel'; filters?: any }) =>
    api.get('/admin/users/export', { params, responseType: 'blob' }),
  
  getUserStats: () => api.get('/admin/users/stats'),
};

// Library API
export const libraryAPI = {
  getSections: () => Promise.resolve({
    data: [
      {
        id: '1',
        name: 'Mathematics',
        description: 'Mathematical resources and teaching materials',
        order: 1,
        isActive: true,
        _count: { files: 25 },
        subfolders: [
          { id: '1a', name: 'Grade 1-3', sectionId: '1', order: 1, _count: { files: 8 } },
          { id: '1b', name: 'Grade 4-6', sectionId: '1', order: 2, _count: { files: 12 } },
          { id: '1c', name: 'Grade 7-8', sectionId: '1', order: 3, _count: { files: 5 } },
        ]
      },
      {
        id: '2',
        name: 'Science',
        description: 'Science curriculum and experiment guides',
        order: 2,
        isActive: true,
        _count: { files: 18 },
        subfolders: [
          { id: '2a', name: 'Physics', sectionId: '2', order: 1, _count: { files: 6 } },
          { id: '2b', name: 'Chemistry', sectionId: '2', order: 2, _count: { files: 7 } },
          { id: '2c', name: 'Biology', sectionId: '2', order: 3, _count: { files: 5 } },
        ]
      },
      {
        id: '3',
        name: 'Languages',
        description: 'English, Kiswahili and other language resources',
        order: 3,
        isActive: true,
        _count: { files: 32 },
        subfolders: [
          { id: '3a', name: 'English', sectionId: '3', order: 1, _count: { files: 20 } },
          { id: '3b', name: 'Kiswahili', sectionId: '3', order: 2, _count: { files: 12 } },
        ]
      },
      {
        id: '4',
        name: 'Social Studies',
        description: 'History, Geography, and Civic Education materials',
        order: 4,
        isActive: true,
        _count: { files: 15 },
        subfolders: []
      },
      {
        id: '5',
        name: 'Creative Arts',
        description: 'Music, Art, and Physical Education resources',
        order: 5,
        isActive: true,
        _count: { files: 12 },
        subfolders: [
          { id: '5a', name: 'Music', sectionId: '5', order: 1, _count: { files: 4 } },
          { id: '5b', name: 'Visual Arts', sectionId: '5', order: 2, _count: { files: 5 } },
          { id: '5c', name: 'Physical Education', sectionId: '5', order: 3, _count: { files: 3 } },
        ]
      }
    ]
  }),

  getFiles: (params?: { sectionId?: string; subfolderId?: string; status?: string }) => {
    const mockFiles = [
      {
        id: '1',
        filename: 'math_fractions_lesson.pdf',
        originalName: 'Understanding Fractions - Grade 4.pdf',
        fileType: 'PDF' as const,
        fileSize: 2450000,
        status: 'APPROVED' as const,
        description: 'Comprehensive lesson plan for teaching fractions to Grade 4 students',
        tags: ['fractions', 'grade4', 'mathematics'],
        createdAt: '2025-08-01T10:30:00Z',
        uploader: {
          firstName: 'Mary',
          lastName: 'Wanjiku',
          email: 'mary.wanjiku@school.ke'
        },
        section: { id: '1', name: 'Mathematics' },
        subfolder: { id: '1b', name: 'Grade 4-6' }
      },
      {
        id: '2',
        filename: 'science_experiment_video.mp4',
        originalName: 'Simple Chemistry Experiments.mp4',
        fileType: 'VIDEO' as const,
        fileSize: 15800000,
        status: 'PENDING' as const,
        description: 'Video demonstration of safe chemistry experiments for primary school',
        tags: ['chemistry', 'experiments', 'video'],
        createdAt: '2025-08-02T08:15:00Z',
        uploader: {
          firstName: 'John',
          lastName: 'Kimani',
          email: 'john.kimani@school.ke'
        },
        section: { id: '2', name: 'Science' },
        subfolder: { id: '2b', name: 'Chemistry' }
      },
      {
        id: '3',
        filename: 'english_pronunciation.mp3',
        originalName: 'Phonics and Pronunciation Guide.mp3',
        fileType: 'AUDIO' as const,
        fileSize: 8500000,
        status: 'APPROVED' as const,
        description: 'Audio guide for teaching English pronunciation and phonics',
        tags: ['english', 'phonics', 'pronunciation'],
        createdAt: '2025-07-30T14:20:00Z',
        uploader: {
          firstName: 'Grace',
          lastName: 'Achieng',
          email: 'grace.achieng@school.ke'
        },
        section: { id: '3', name: 'Languages' },
        subfolder: { id: '3a', name: 'English' }
      },
      {
        id: '4',
        filename: 'kenya_map.jpg',
        originalName: 'Physical Map of Kenya.jpg',
        fileType: 'IMAGE' as const,
        fileSize: 3200000,
        status: 'APPROVED' as const,
        description: 'High-resolution physical map of Kenya for geography lessons',
        tags: ['geography', 'kenya', 'map'],
        createdAt: '2025-07-28T11:45:00Z',
        uploader: {
          firstName: 'Peter',
          lastName: 'Muthui',
          email: 'peter.muthui@school.ke'
        },
        section: { id: '4', name: 'Social Studies' }
      },
      {
        id: '5',
        filename: 'art_activities.docx',
        originalName: 'Creative Art Activities for Children.docx',
        fileType: 'DOCUMENT' as const,
        fileSize: 1200000,
        status: 'DECLINED' as const,
        description: 'Collection of age-appropriate art activities and projects',
        tags: ['art', 'activities', 'creative'],
        createdAt: '2025-07-25T09:30:00Z',
        uploader: {
          firstName: 'Sarah',
          lastName: 'Njeri',
          email: 'sarah.njeri@school.ke'
        },
        section: { id: '5', name: 'Creative Arts' },
        subfolder: { id: '5b', name: 'Visual Arts' }
      }
    ];

    // Filter based on parameters
    let filteredFiles = mockFiles;
    
    if (params?.sectionId) {
      filteredFiles = filteredFiles.filter(file => file.section.id === params.sectionId);
    }
    
    if (params?.subfolderId) {
      filteredFiles = filteredFiles.filter(file => file.subfolder?.id === params.subfolderId);
    }
    
    if (params?.status) {
      filteredFiles = filteredFiles.filter(file => file.status === params.status);
    }

    return Promise.resolve({ data: filteredFiles });
  },

  uploadFile: (formData: FormData, onProgress?: (progress: number) => void) => {
    return new Promise((resolve) => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (onProgress) onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve({ data: { id: 'new-file-id', message: 'File uploaded successfully' } });
        }
      }, 200);
    });
  },

  approveFile: (fileId: string) => Promise.resolve({ data: { message: 'File approved' } }),
  
  declineFile: (fileId: string) => Promise.resolve({ data: { message: 'File declined' } }),

  getStats: () => Promise.resolve({
    data: {
      totalUploads: 102,
      pendingDocuments: 15,
      approvedDocuments: 78,
      declinedDocuments: 9,
      totalUsers: 45,
      activeUsers: 32,
      documentsThisMonth: 23,
      uploadsToday: 3
    }
  })
};

export default api;