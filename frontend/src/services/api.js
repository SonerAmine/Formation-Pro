import axios from 'axios';

// Base URL for the API
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
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

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access forbidden:', error.response?.data?.error);
      
      // Si l'utilisateur n'a plus les droits admin, on le redirige vers l'accueil
      // mais seulement si on est sur une page admin
      if (window.location.pathname.includes('/dashboard')) {
        console.warn('Admin access revoked, redirecting to home');
        window.location.href = '/';
      }
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response?.data?.message || 'Internal server error');
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  // Google OAuth
  googleAuth: (credential, clientId) => api.post('/auth/google', { credential, clientId }),
  linkGoogleAccount: (credential) => api.post('/auth/google/link', { credential }),
  verifyGoogleToken: (token) => api.post('/auth/google/verify', { token })
};

// Formations API
export const formationsAPI = {
  getAll: (params) => api.get('/formations', { params }),
  getById: (id) => api.get(`/formations/${id}`),
  create: (formationData) => api.post('/formations', formationData),
  update: (id, formationData) => api.put(`/formations/${id}`, formationData),
  delete: (id) => api.delete(`/formations/${id}`),
  search: (query) => api.get(`/formations/search`, { params: { q: query } }),
  getByCategory: (category) => api.get(`/formations/category/${category}`)
};

// Reservations API
export const reservationsAPI = {
  create: (reservationData) => api.post('/reservations', reservationData),
  getMyReservations: () => api.get('/reservations/my'),
  getById: (id) => api.get(`/reservations/${id}`),
  cancel: (id) => api.put(`/reservations/${id}/cancel`),
  getAll: () => api.get('/reservations'), // Admin only
  updateStatus: (id, status) => api.put(`/reservations/${id}/status`, { status })
};

// Comments API
export const commentsAPI = {
  getByFormation: (formationId) => api.get(`/comments/formation/${formationId}`),
  create: (commentData) => api.post('/comments', commentData),
  update: (id, commentData) => api.put(`/comments/${id}`, commentData),
  delete: (id) => api.delete(`/comments/${id}`),
  getAll: () => api.get('/comments') // Admin only
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'), // Admin only
  getById: (id) => api.get(`/users/${id}`),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  ban: (id) => api.put(`/users/${id}/ban`),
  unban: (id) => api.put(`/users/${id}/unban`),
  giveSpecialOffer: (id, offers) => api.put(`/users/${id}/special-offers`, { offers }),
  addToFavorites: (formationId) => api.post(`/users/favorites/${formationId}`),
  removeFromFavorites: (formationId) => api.delete(`/users/favorites/${formationId}`),
  getFavorites: () => api.get('/users/favorites')
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getFormations: (params) => api.get('/admin/formations', { params }),
  getReservations: (params) => api.get('/admin/reservations', { params }),
  banUser: (userId, reason) => api.put(`/admin/users/${userId}/ban`, { reason }),
  unbanUser: (userId) => api.put(`/admin/users/${userId}/unban`),
  giveSpecialOffer: (userId, data) => api.put(`/admin/users/${userId}/special-offer`, data),
  deleteComment: (commentId) => api.delete(`/admin/comments/${commentId}`)
};

// Utility functions for API calls
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'Une erreur est survenue';
    const status = error.response.status;
    
    return {
      message,
      status,
      isNetworkError: false
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
      status: null,
      isNetworkError: true
    };
  } else {
    // Something else happened
    return {
      message: 'Une erreur inattendue est survenue',
      status: null,
      isNetworkError: false
    };
  }
};

// Helper function to check if API is available
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export default api;
