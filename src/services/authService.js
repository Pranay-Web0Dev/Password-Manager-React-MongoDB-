import { authAPI } from './api';

export const authService = {
  register: async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  },

  login: async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      const errorMsg = error.response?.data?.message;
      
      // Handle locked account
      if (error.response?.status === 423) {
        return {
          success: false,
          error: errorMsg,
          locked: true
        };
      }
      
      return {
        success: false,
        error: errorMsg || 'Login failed',
        failedAttempts: error.response?.data?.failedAttempts
      };
    }
  },

  verifyMasterPassword: async (masterPassword) => {
    try {
      const response = await authAPI.verifyMaster({ masterPassword });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Verification failed'
      };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  getCurrentUser: async () => {
    try {
      const response = await authAPI.getCurrentUser();
      return { success: true, user: response.data.user };
    } catch (error) {
      return { success: false, error: 'Failed to get user' };
    }
  }
};