import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Could not access localStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =============================================
// FIXED: Response interceptor with PROPER auto-logout
// =============================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const status = error.response?.status;
    const data = error.response?.data;

    console.log('🔍 API Interceptor Triggered:', {
      url,
      status,
      hasAutoLogout: data?.autoLogout,
      message: data?.message
    });

    // =============================================
    // CRITICAL FIX: Handle ALL autoLogout cases
    // =============================================
    if (data?.autoLogout === true) {
      console.log('🚨 AUTO-LOGOUT DETECTED:', data?.message || 'Security lock');
      
      // Store logout info before clearing
      const logoutReason = data?.message || 'Security violation';
      const lockDuration = data?.lockDuration || 15;
      const remainingTime = data?.remainingTime || 0;
      
      // Show immediate toast warning
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error(`Security lock detected! Auto-logout in 3 seconds...`, {
          duration: 3000,
          icon: '🔒'
        });
      }
      
      // Auto-logout execution with 3 second delay
      setTimeout(() => {
        try {
          console.log('🔄 Performing auto-logout...');
          
          // Clear ALL authentication data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('masterPasswordVerified');
          sessionStorage.clear();
          
          // Build redirect URL with parameters
          const params = new URLSearchParams();
          params.append('autoLogout', 'true');
          params.append('reason', encodeURIComponent(logoutReason.substring(0, 100)));
          params.append('timestamp', Date.now().toString());
          
          if (remainingTime > 0) {
            params.append('lockTime', remainingTime.toString());
          }
          
          if (lockDuration > 0) {
            params.append('duration', lockDuration.toString());
          }
          
          const redirectUrl = `/login?${params.toString()}`;
          console.log('Redirecting to:', redirectUrl);
          
          // Force redirect
          window.location.href = redirectUrl;
          
        } catch (redirectError) {
          console.error('Auto-logout redirect failed:', redirectError);
          window.location.href = '/login?autoLogout=true';
        }
      }, 3000); // 3 second delay
      
      // IMPORTANT: Return resolved promise to prevent further error handling
      return Promise.resolve({
        data: {
          success: false,
          message: 'Auto-logout initiated',
          autoLogout: true
        }
      });
    }
    
    // =============================================
    // Handle 423 status (Locked) even without autoLogout flag
    // =============================================
    if (status === 423) {
      console.log('🔐 ACCOUNT LOCKED DETECTED');
      
      // Check if it's a master password related lock
      const isMasterPasswordLock = 
        url.includes('/verify-master') || 
        url.includes('/decrypt') || 
        url.includes('/copy') ||
        (data?.message && data.message.toLowerCase().includes('master'));
      
      if (isMasterPasswordLock) {
        console.log('Master password lock - triggering auto-logout');
        
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login?autoLogout=true&reason=master_password_lock';
        }, 3000);
        
        return Promise.resolve({
          data: {
            success: false,
            message: 'Security lock - auto logout',
            autoLogout: true
          }
        });
      }
    }
    
    // =============================================
    // Handle 401 errors (excluding master password errors)
    // =============================================
    if (status === 401) {
      const isMasterPasswordError = 
        url.includes('/decrypt') || 
        url.includes('/copy') ||
        url.includes('/verify-master') ||
        url.includes('/verify-master-token');
      
      const isLoginError = 
        url.includes('/login') || 
        url.includes('/register') ||
        url.includes('/forgot-password') ||
        url.includes('/reset-password');
      
      // Only auto-logout for non-master-password, non-login 401 errors
      if (!isMasterPasswordError && !isLoginError) {
        console.log('🔄 Token expired, redirecting to login');
        
        setTimeout(() => {
          try {
            localStorage.removeItem('token');
          } catch (e) {
            console.warn('Could not remove token:', e);
          }
          
          const currentPath = window.location.pathname;
          const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
          
          if (!authPaths.includes(currentPath)) {
            window.location.href = '/login?session=expired';
          }
        }, 1000);
      }
    }
    
    // =============================================
    // Default: Reject with error for component handling
    // =============================================
    return Promise.reject(error);
  }
);

// =============================================
// API Endpoints (Keep your existing endpoints)
// =============================================

// Auth API
export const authAPI = {
  // Basic Authentication
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),

  // Master Password
  verifyMaster: (data) => api.post('/auth/verify-master', data),
  verifyMasterToken: (data) => api.post('/auth/verify-master-token', data),

  // OTP & Account Recovery
  sendOTP: (email) => api.post('/auth/send-otp', { email }),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  unlockAccount: (data) => api.post('/auth/unlock-account', data),

  // Password Recovery
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),

  // User Profile
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  updateNotifications: (data) => api.put('/auth/update-notifications', data),
  updateSecurity: (data) => api.put('/auth/update-security', data),

  // Password Management
  changePassword: (data) => api.post('/auth/change-password', data),
  changeMasterPassword: (data) => api.post('/auth/change-master-password', data),

  // Account Activity
  getLoginHistory: () => api.get('/auth/login-history'),
  getMasterPasswordStatus: () => api.get('/auth/master-password-status'),
};

// Password API
export const passwordAPI = {
  // Basic CRUD
  getAll: () => api.get('/passwords'),
  getById: (id) => api.get(`/passwords/${id}`),
  create: (data) => api.post('/passwords', data),
  update: (id, data) => api.put(`/passwords/${id}`, data),
  delete: (id) => api.delete(`/passwords/${id}`),

  // Password Operations
  decrypt: (id, data) => api.post(`/passwords/${id}/decrypt`, data),
  copy: (id, data) => api.post(`/passwords/${id}/copy`, data),

  // Master password security endpoints
  verifyMasterWithOTP: (data) => api.post('/auth/verify-master-with-otp', data),

  // Bulk Operations
  bulkCreate: (data) => api.post('/passwords/bulk', data),

  // Password Analysis
  getStats: () => api.get('/passwords/stats'),
  checkWeak: () => api.post('/passwords/check-weak'),
  checkDuplicates: (data) => api.post('/passwords/check-duplicates', data),

  // Import/Export
  exportPasswords: (data) => api.post('/passwords/export', data, {
    responseType: 'blob'
  }),
  importPasswords: (data) => api.post('/passwords/import', data),

  // Favorites
  toggleFavorite: (id) => api.put(`/passwords/${id}/favorite`),

  // Password Generation
  generate: (params) => api.get('/passwords/generate', { params }),
};

// Email API
export const emailAPI = {
  testEmail: (data) => api.post('/email/test', data),
  getTemplates: () => api.get('/email/templates'),
  updateTemplate: (id, data) => api.put(`/email/templates/${id}`, data),
};

// Security API
export const securityAPI = {
  getSecurityLogs: (params) => api.get('/security/logs', { params }),
  getBreachAlerts: () => api.get('/security/breach-alerts'),
  setup2FA: () => api.post('/security/setup-2fa'),
  verify2FA: (data) => api.post('/security/verify-2fa', data),
  disable2FA: () => api.delete('/security/disable-2fa'),
  getActiveSessions: () => api.get('/security/sessions'),
  revokeSession: (sessionId) => api.delete(`/security/sessions/${sessionId}`),
  revokeAllSessions: () => api.delete('/security/sessions'),
  getSecurityReport: () => api.get('/security/report'),
};

// OTP API - Alias for backward compatibility
export const otpAPI = {
  sendOTP: authAPI.sendOTP,
  verifyOTP: authAPI.verifyOTP,
  unlockAccount: authAPI.unlockAccount,
};

// Enhanced utility functions
export const apiUtils = {
  downloadFile: (blob, filename) => {
    try {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  },

  parseError: (error) => {
    if (error.response) {
      const status = error.response.status;
      let message = error.response.data?.message || 'Server error';

      // Customize messages based on status
      switch (status) {
        case 401:
          if (error.config?.url?.includes('/decrypt') || error.config?.url?.includes('/copy')) {
            message = 'Invalid master password';
          } else {
            message = 'Session expired. Please login again.';
          }
          break;
        case 423:
          message = data?.autoLogout ? 
            'Security lock detected. Auto-logout initiated.' : 
            'Account locked. Please verify with OTP.';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
      }

      return {
        message,
        status,
        data: error.response.data,
        isMasterPasswordError: error.config?.url?.includes('/decrypt') || error.config?.url?.includes('/copy'),
        isAuthError: status === 401 || status === 403,
        autoLogout: error.response.data?.autoLogout || false
      };
    } else if (error.request) {
      return {
        message: 'Network error. Please check your internet connection.',
        status: 0,
        isNetworkError: true
      };
    } else {
      return {
        message: error.message || 'Unknown error occurred',
        status: -1
      };
    }
  },

  formatFormData: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        data[key].forEach(item => {
          formData.append(key, item);
        });
      } else if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  },

  // Helper to check if error is a master password error
  isMasterPasswordError: (error) => {
    const url = error.config?.url || '';
    return url.includes('/decrypt') || url.includes('/copy') || url.includes('/verify-master');
  },

  // Helper to check if error requires login redirect
  requiresLoginRedirect: (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Don't redirect for master password errors
    if (url.includes('/decrypt') || url.includes('/copy') || url.includes('/verify-master')) {
      return false;
    }

    // Don't redirect for login/register errors
    if (url.includes('/login') || url.includes('/register')) {
      return false;
    }

    // Only redirect for token expiration (401) on non-auth endpoints
    return status === 401;
  }
};

// Custom hook for consistent API calls
export const createApiHandler = () => {
  const callApi = async (apiFunction, options = {}) => {
    const {
      showError = true,
      onSuccess,
      onError,
      successMessage,
      errorMessage
    } = options;

    try {
      const response = await apiFunction();

      if (onSuccess) {
        onSuccess(response.data);
      }

      return response.data;

    } catch (error) {
      const parsedError = apiUtils.parseError(error);

      if (onError) {
        onError(parsedError);
      }

      // Don't throw for master password errors - let components handle them
      if (apiUtils.isMasterPasswordError(error)) {
        throw parsedError;
      }

      // For other errors, decide whether to throw or handle
      throw parsedError;
    }
  };

  return { callApi };
};

export default api;