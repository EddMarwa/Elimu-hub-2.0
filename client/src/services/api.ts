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
  generate: (request: GenerationRequest) =>
    api.post('/schemes/generate', request),
  
  create: (scheme: Partial<SchemeOfWork>) =>
    api.post('/schemes', scheme),
  
  getAll: (params?: { page?: number; limit?: number; subject?: string; grade?: string }) =>
    api.get('/schemes', { params }),
  
  getById: (id: string) => api.get(`/schemes/${id}`),
  
  update: (id: string, scheme: Partial<SchemeOfWork>) =>
    api.put(`/schemes/${id}`, scheme),
  
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

export default api;