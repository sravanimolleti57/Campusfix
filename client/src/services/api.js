import axios from 'axios';

// Normalize base API URL to work seamlessly in production (Vercel/Render) and local environments
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  let rawUrl = envUrl;

  if (!rawUrl) {
    // If in production build or running on remote host (e.g. vercel.app), default to production Render URL
    const isRemote = typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
    if (import.meta.env.PROD || isRemote) {
      rawUrl = 'https://campusfix-k3iu.onrender.com/api';
    } else {
      rawUrl = 'http://localhost:5001/api';
    }
  }

  const cleanUrl = rawUrl.trim().replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

// Create central Axios instance
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds to support Render free instance cold starts
});

// Request Interceptor: Attach JWT Bearer token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusfix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle authentication errors (401 / 403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // If 401 Unauthorized, token is expired or invalid
      if (error.response.status === 401) {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          localStorage.removeItem('campusfix_token');
          localStorage.removeItem('campusfix_user');
          // Optional redirect if needed
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service Endpoints
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// Complaint Service Endpoints
export const complaintService = {
  createComplaint: (complaintData) => {
    if (complaintData instanceof FormData) {
      return api.post('/complaints', complaintData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/complaints', complaintData);
  },
  getMyComplaints: (params = {}) => api.get('/complaints/my', { params }),
  getComplaintById: (id) => api.get(`/complaints/${id}`),
  updateComplaint: (id, updateData) => {
    if (updateData instanceof FormData) {
      return api.put(`/complaints/${id}`, updateData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/complaints/${id}`, updateData);
  },
  deleteComplaint: (id) => api.delete(`/complaints/${id}`),
  getTimeline: (id) => api.get(`/complaints/${id}/timeline`),
  verifyComplaint: (id, data = {}) => api.post(`/complaints/${id}/verify`, data),
  reopenComplaint: (id, data = {}) => api.post(`/complaints/${id}/reopen`, data),
  submitFeedback: (id, data) => api.post(`/complaints/${id}/feedback`, data),
  getFeedback: (id) => api.get(`/complaints/${id}/feedback`),
  uploadImages: (formData) =>
    api.post('/complaints/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Admin Service Endpoints
export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getComplaints: (params = {}) => api.get('/admin/complaints', { params }),
  getComplaintById: (id) => api.get(`/admin/complaints/${id}`),
  updateComplaint: (id, updateData) => api.put(`/admin/complaints/${id}`, updateData),
  deleteComplaint: (id) => api.delete(`/admin/complaints/${id}`),
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/status`),
  getStaff: () => api.get('/admin/staff'),
  createStaff: (data) => api.post('/admin/staff', data),
  updateStaff: (id, data) => api.put(`/admin/staff/${id}`, data),
  toggleStaffStatus: (id) => api.patch(`/admin/staff/${id}/status`),
  getCategories: () => api.get('/admin/categories'),
  getLocations: () => api.get('/admin/locations'),
  getFeedback: (params = {}) => api.get('/admin/feedback', { params }),
};

// Staff / Technician Service Endpoints
export const staffService = {
  getDashboard: () => api.get('/staff/dashboard'),
  getComplaints: (params = {}) => api.get('/staff/complaints', { params }),
  getComplaintById: (id) => api.get(`/staff/complaints/${id}`),
  startWork: (id, data = {}) => api.post(`/staff/complaints/${id}/start-work`, data),
  addProgressNotes: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/staff/complaints/${id}/progress`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post(`/staff/complaints/${id}/progress`, data);
  },
  uploadResolutionImages: (id, formData) =>
    api.post(`/staff/complaints/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  resolveComplaint: (id, data) => {
    if (data instanceof FormData) {
      return api.post(`/staff/complaints/${id}/resolve`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post(`/staff/complaints/${id}/resolve`, data);
  },
  updateComplaint: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/staff/complaints/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/staff/complaints/${id}`, data);
  },
};

// In-App Notification Service Endpoints
export const notificationService = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export default api;


