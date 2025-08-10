import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { User, LessonPlan, SchemeOfWork, CurriculumDocument, GenerationRequest } from '../../../shared/types';

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
  async getSections() {
    try {
      const res = await api.get('/library/sections');
      return { data: res.data.data };
    } catch {
      // Fallback mock
      return Promise.resolve({ data: [] });
    }
  },

  async getFiles(params?: { sectionId?: string; subfolderId?: string; status?: string }, admin?: { userId: string; role: string }) {
    try {
      const res = await api.get('/library/files', {
        params,
        headers: admin ? { 'x-user-id': admin.userId, 'x-user-role': admin.role } : undefined,
      });
      return { data: res.data.data };
    } catch {
      return Promise.resolve({ data: [] });
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
    } catch {
      return Promise.resolve({ data: { id: 'new-file-id' } });
    }
  },

  async approveFile(fileId: string, admin?: { userId: string; role: string }) {
    const headers = admin ? { 'x-user-id': admin.userId, 'x-user-role': admin.role } : undefined;
    const res = await api.post(`/library/files/${fileId}/approve`, undefined, { headers });
    return { data: res.data };
  },
  
  async declineFile(fileId: string, admin?: { userId: string; role: string }) {
    const headers = admin ? { 'x-user-id': admin.userId, 'x-user-role': admin.role } : undefined;
    const res = await api.post(`/library/files/${fileId}/decline`, undefined, { headers });
    return { data: res.data };
  },

  async getStats(admin?: { userId: string; role: string }) {
    const headers = admin ? { 'x-user-id': admin.userId, 'x-user-role': admin.role } : undefined;
    const res = await api.get('/library/stats', { headers });
    return { data: res.data.data };
  },

  async createSection(data: { name: string; description?: string; order?: number }, admin: { userId: string; role: string }) {
    const headers = { 'x-user-id': admin.userId, 'x-user-role': admin.role };
    const res = await api.post('/library/sections', data, { headers });
    return { data: res.data.data };
  },

  async createSubfolder(data: { name: string; sectionId: string; metadata?: any; order?: number }, admin: { userId: string; role: string }) {
    const headers = { 'x-user-id': admin.userId, 'x-user-role': admin.role };
    const res = await api.post('/library/subfolders', data, { headers });
    return { data: res.data.data };
  },

  async deleteFile(fileId: string, auth?: { userId: string; role: string }) {
    const headers = auth ? { 'x-user-id': auth.userId, 'x-user-role': auth.role } : undefined;
    const res = await api.delete(`/library/files/${fileId}`, { headers });
    return { data: res.data };
  }
};

export default api;