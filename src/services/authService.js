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
      const status = error.response?.status;
      
      // Handle master password lock
      if (status === 401 && error.response?.data?.masterPasswordLocked) {
        return {
          success: false,
          error: errorMsg,
          masterPasswordLocked: true,
          attemptsInfo: error.response?.data?.attemptsInfo
        };
      }
      
      // Handle locked account
      if (status === 423) {
        return {
          success: false,
          error: errorMsg,
          locked: true,
          remainingTime: error.response?.data?.remainingTime,
          otpRequired: error.response?.data?.otpRequired
        };
      }
      
      // Handle OTP required for next login
      if (status === 401 && error.response?.data?.requiresOTP) {
        return {
          success: false,
          error: errorMsg,
          otpRequired: true,
          requiresOTP: true,
          masterPasswordLocked: error.response?.data?.masterPasswordLocked,
          attemptsInfo: error.response?.data?.attemptsInfo
        };
      }
      
      return {
        success: false,
        error: errorMsg || 'Login failed',
        failedAttempts: error.response?.data?.failedAttempts,
        remainingAttempts: error.response?.data?.remainingAttempts
      };
    }
  },

  verifyMasterPassword: async (masterPassword) => {
    try {
      const response = await authAPI.verifyMaster({ masterPassword });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message;
      const status = error.response?.status;
      
      // Handle master password lock
      if (status === 423) {
        return {
          success: false,
          error: errorMsg,
          locked: true,
          requiresOTP: true,
          autoLogout: error.response?.data?.autoLogout,
          attempts: error.response?.data?.attempts,
          lockDuration: error.response?.data?.lockDuration,
          otpRequired: error.response?.data?.otpRequired
        };
      }
      
      // Handle too many attempts but not locked yet
      if (status === 401) {
        return {
          success: false,
          error: errorMsg,
          attemptsLeft: error.response?.data?.attemptsLeft,
          attempts: error.response?.data?.attempts,
          lockThreshold: error.response?.data?.lockThreshold
        };
      }
      
      return {
        success: false,
        error: errorMsg || 'Verification failed'
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
  },

  // New function to verify master password with OTP
  verifyMasterWithOTP: async (data) => {
    try {
      const response = await authAPI.verifyMasterWithOTP(data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Verification failed'
      };
    }
  },

  // New function to get master password status
  getMasterPasswordStatus: async () => {
    try {
      const response = await authAPI.getMasterPasswordStatus();
      return { success: true, status: response.data.status };
    } catch (error) {
      return { success: false, error: 'Failed to get status' };
    }
  }
};