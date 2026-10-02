import api from './api';

export const authService = {
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('spendiq_token', response.data.access_token);
      localStorage.setItem('spendiq_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data.access_token) {
      localStorage.setItem('spendiq_token', response.data.access_token);
      localStorage.setItem('spendiq_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('spendiq_token');
    localStorage.removeItem('spendiq_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('spendiq_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('spendiq_token');
  }
};
