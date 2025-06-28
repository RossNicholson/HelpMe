import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
            refresh_token: refreshToken,
          });

          const { token, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (userData: any) => api.put('/auth/profile', userData),
  changePassword: (passwords: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', passwords),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
};

export const ticketsAPI = {
  getAll: (params?: any) => api.get('/tickets', { params }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  create: (ticketData: any) => api.post('/tickets', ticketData),
  update: (id: string, ticketData: any) => api.put(`/tickets/${id}`, ticketData),
  delete: (id: string) => api.delete(`/tickets/${id}`),
  addComment: (id: string, commentData: any) =>
    api.post(`/tickets/${id}/comments`, commentData),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tickets/${id}/status`, { status }),
  assign: (id: string, userId: string) =>
    api.patch(`/tickets/${id}/assign`, { assigned_to: userId }),
};

export const clientsAPI = {
  getAll: (params?: any) => api.get('/clients', { params }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (clientData: any) => api.post('/clients', clientData),
  update: (id: string, clientData: any) => api.put(`/clients/${id}`, clientData),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

export const clientUsersAPI = {
  getClientUsers: (clientId: string) => api.get(`/client-users/clients/${clientId}/users`),
  addUserToClient: (clientId: string, userData: any) => api.post(`/client-users/clients/${clientId}/users`, userData),
  updateClientUser: (clientUserId: string, userData: any) => api.put(`/client-users/${clientUserId}`, userData),
  removeUserFromClient: (clientId: string, userId: string) => api.delete(`/client-users/clients/${clientId}/users/${userId}`),
  getClientPrimaryContact: (clientId: string) => api.get(`/client-users/clients/${clientId}/primary-contact`),
  checkUserPermissions: (clientId: string) => api.get(`/client-users/clients/${clientId}/permissions`),
};

export const assetsAPI = {
  getAll: (params?: any) => api.get('/assets', { params }),
  getById: (id: string) => api.get(`/assets/${id}`),
  create: (assetData: any) => api.post('/assets', assetData),
  update: (id: string, assetData: any) => api.put(`/assets/${id}`, assetData),
  delete: (id: string) => api.delete(`/assets/${id}`),
};

export const knowledgeBaseAPI = {
  getAll: (params?: any) => api.get('/knowledge-base', { params }),
  getById: (id: string) => api.get(`/knowledge-base/${id}`),
  create: (articleData: any) => api.post('/knowledge-base', articleData),
  update: (id: string, articleData: any) =>
    api.put(`/knowledge-base/${id}`, articleData),
  delete: (id: string) => api.delete(`/knowledge-base/${id}`),
};

export const reportsAPI = {
  getDashboardStats: () => api.get('/reports/dashboard'),
  getTicketStats: (params?: any) => api.get('/reports/tickets', { params }),
  getClientStats: (params?: any) => api.get('/reports/clients', { params }),
  getTimeStats: (params?: any) => api.get('/reports/time', { params }),
};

export default api; 