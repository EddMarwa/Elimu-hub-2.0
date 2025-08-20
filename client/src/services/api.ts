import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { User, SchemeOfWork, CurriculumDocument, GenerationRequest } from '../../../shared/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Expose API base URL and server origin (useful for building non-API links like file downloads)
export const API_BASE_URL: string = api.defaults.baseURL || 'http://localhost:5000/api';
export const SERVER_BASE_ORIGIN: string = API_BASE_URL.replace(/\/?api\/?$/, '');

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
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      
      // Only redirect if not already on login page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    // Handle forbidden errors
    if (error.response?.status === 403) {
      console.warn('Access forbidden:', error.response.data?.message || 'Insufficient permissions');
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data?.message || 'Internal server error');
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

// Scheme Files API
export const schemeFilesAPI = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    subject?: string; 
    grade?: string; 
    term?: string;
    strand?: string;
    search?: string;
    sortBy?: string;
  }) => api.get('/scheme-files', { params }),
  
  getById: (id: string) => api.get(`/scheme-files/${id}`),
  
  upload: (file: File, metadata: {
    title: string;
    description?: string;
    subject: string;
    grade: string;
    term: string;
    strand?: string;
    subStrand?: string;
    isPublic?: boolean;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    formData.append('subject', metadata.subject);
    formData.append('grade', metadata.grade);
    formData.append('term', metadata.term);
    if (metadata.strand) formData.append('strand', metadata.strand);
    if (metadata.subStrand) formData.append('subStrand', metadata.subStrand);
    formData.append('isPublic', metadata.isPublic?.toString() || 'true');
    
    return api.post('/scheme-files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  download: (id: string) => api.get(`/scheme-files/${id}/download`, {
    responseType: 'blob'
  }),
  
  update: (id: string, data: {
    title?: string;
    description?: string;
    subject?: string;
    grade?: string;
    term?: string;
    strand?: string;
    subStrand?: string;
    isPublic?: boolean;
  }) => api.put(`/scheme-files/${id}`, data),
  
  delete: (id: string) => api.delete(`/scheme-files/${id}`),
  
  getStats: () => api.get('/scheme-files/stats/overview'),
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
  async getSections() {
    try {
      const res = await api.get('/library/sections');
      return { data: res.data.data };
    } catch (error) {
      console.error('Failed to fetch library sections:', error);
      return { data: [] };
    }
  },

  async getFiles(params?: { sectionId?: string; subfolderId?: string; status?: string }, admin?: { userId: string; role: string }) {
    try {
      const res = await api.get('/library/files', {
        params,
        headers: admin ? { 'x-user-id': admin.userId, 'x-user-role': admin.role } : undefined,
      });
      return { data: res.data.data };
    } catch (error) {
      console.error('Failed to fetch library files:', error);
      return { data: [] };
    }
  },

  async uploadFile(formData: FormData, onProgress?: (progress: number) => void, auth?: { userId: string; role: string }) {
    try {
      const res = await api.post('/library/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(auth ? { 'x-user-id': auth.userId, 'x-user-role': auth.role } : {}),
        },
        onUploadProgress: (evt) => {
          if (onProgress && evt.total) {
            onProgress(Math.round((evt.loaded * 100) / evt.total));
          }
        },
      });
      return { data: res.data.data };
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  },

  async approveFile(fileId: string, admin?: { userId: string; role: string }) {
    try {
      const headers = admin ? { 'x-user-id': admin.userId, 'x-user-role': admin.role } : undefined;
      const res = await api.post(`/library/files/${fileId}/approve`, undefined, { headers });
      return { data: res.data };
    } catch (error) {
      console.error('Failed to approve file:', error);
      throw error;
    }
  },
  
  async declineFile(fileId: string, admin?: { userId: string; role: string }) {
    try {
      const headers = admin ? { 'x-user-id': admin.userId, 'x-user-role': admin.role } : undefined;
      const res = await api.post(`/library/files/${fileId}/decline`, undefined, { headers });
      return { data: res.data };
    } catch (error) {
      console.error('Failed to decline file:', error);
      throw error;
    }
  },

  async getStats(admin?: { userId: string; role: string }) {
    try {
      const headers = admin ? { 'x-user-id': admin.userId, 'x-user-role': admin.role } : undefined;
      const res = await api.get('/library/stats', { headers });
      return { data: res.data.data };
    } catch (error) {
      console.error('Failed to fetch library stats:', error);
      return { data: {} };
    }
  },

  async createSection(data: { name: string; description?: string; order?: number }, admin: { userId: string; role: string }) {
    try {
      const headers = { 'x-user-id': admin.userId, 'x-user-role': admin.role };
      const res = await api.post('/library/sections', data, { headers });
      return { data: res.data.data };
    } catch (error) {
      console.error('Failed to create section:', error);
      throw error;
    }
  },

  async createSubfolder(data: { name: string; sectionId: string; metadata?: any; order?: number }, admin: { userId: string; role: string }) {
    try {
      const headers = { 'x-user-id': admin.userId, 'x-user-role': admin.role };
      const res = await api.post('/library/subfolders', data, { headers });
      return { data: res.data.data };
    } catch (error) {
      console.error('Failed to create subfolder:', error);
      throw error;
    }
  },

  async deleteFile(fileId: string, auth?: { userId: string; role: string }) {
    try {
      const headers = auth ? { 'x-user-id': auth.userId, 'x-user-role': auth.role } : undefined;
      const res = await api.delete(`/library/files/${fileId}`, { headers });
      return { data: res.data };
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }
};

// Past Papers API
export const pastPapersAPI = {
  upload: (formData: FormData) =>
    api.post('/library/past-papers/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (params?: { subject?: string; grade?: string; year?: string; q?: string; limit?: number; offset?: number }) =>
    api.get('/library/past-papers', { params }),
  extractQuestions: (fileId: string) =>
    api.post('/library/past-papers/extract-questions', { fileId }),
};

// Lesson Plans API
export const lessonPlansAPI = {
  getLessonPlans: (params?: string) => api.get(`/lesson-plans${params ? `?${params}` : ''}`),
  getLessonPlan: (id: string) => api.get(`/lesson-plans/${id}`),
  uploadLessonPlan: (formData: FormData) => api.post('/lesson-plans', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  updateLessonPlan: (id: string, data: any) => api.put(`/lesson-plans/${id}`, data),
  deleteLessonPlan: (id: string) => api.delete(`/lesson-plans/${id}`),
  downloadLessonPlan: (id: string) => api.get(`/lesson-plans/${id}/download`, {
    responseType: 'blob',
  }),
  
  // Folders
  getFolders: () => api.get('/lesson-plans/folders'),
  createFolder: (data: any) => api.post('/lesson-plans/folders', data),
  updateFolder: (id: string, data: any) => api.put(`/lesson-plans/folders/${id}`, data),
  deleteFolder: (id: string) => api.delete(`/lesson-plans/folders/${id}`),
  
  // Comments/Reviews
  getComments: (lessonPlanId: string) => api.get(`/lesson-plans/${lessonPlanId}/comments`),
  addComment: (lessonPlanId: string, data: any) => api.post(`/lesson-plans/${lessonPlanId}/comments`, data),
  updateComment: (commentId: string, data: any) => api.put(`/lesson-plans/comments/${commentId}`, data),
  deleteComment: (commentId: string) => api.delete(`/lesson-plans/comments/${commentId}`),
  
  // Sharing
  shareLessonPlan: (lessonPlanId: string, data: any) => api.post(`/lesson-plans/${lessonPlanId}/share`, data),
  getSharedLessonPlans: () => api.get('/lesson-plans/shared'),
};

// AI Lesson Plan and Lesson Notes API
export const aiLessonAPI = {
  generateLessonPlan: (data: { subject: string; grade: string; topic: string; objectives?: string; context?: string }) =>
    api.post('/ai/lesson-plan', data),
  generateLessonNotes: (data: { subject: string; grade: string; topic: string; scheme?: any; lessonPlan?: any; context?: string }) =>
    api.post('/ai/lesson-notes', data),
};

// Summarization API
export const aiSummarizeAPI = {
  summarize: (text: string, context?: string) =>
    api.post('/ai/summarize', { text, context }),
};

export default api;