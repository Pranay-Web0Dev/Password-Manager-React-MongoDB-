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
      const data = error.response?.data;
      
      // FIXED: Unified OTP handling for ALL scenarios
      // Check for any OTP requirement (regular lock OR master password lock)
      if ((status === 423 || status === 401) && (data?.otpRequired || data?.requiresOTP)) {
        return {
          success: false,
          error: errorMsg,
          otpRequired: true,
          requiresOTP: data?.requiresOTP || false,
          locked: data?.locked || false,
          masterPasswordLocked: data?.masterPasswordLocked || false,
          remainingTime: data?.remainingTime,
          attemptsInfo: data?.attemptsInfo,
          attempts: data?.attempts,
          failedAttempts: data?.failedAttempts,
          remainingAttempts: data?.remainingAttempts
        };
      }
      
      // Handle other error cases
      return {
        success: false,
        error: errorMsg || 'Login failed',
        failedAttempts: data?.failedAttempts,
        remainingAttempts: data?.remainingAttempts
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
      const data = error.response?.data;
      
      // FIXED: Consistent OTP flag handling
      if (status === 423) {
        return {
          success: false,
          error: errorMsg,
          locked: true,
          otpRequired: true,
          requiresOTP: data?.requiresOTP || true,
          autoLogout: data?.autoLogout,
          attempts: data?.attempts,
          lockDuration: data?.lockDuration,
          remainingTime: data?.remainingTime
        };
      }
      
      // Handle too many attempts but not locked yet
      if (status === 401) {
        return {
          success: false,
          error: errorMsg,
          attemptsLeft: data?.attemptsLeft,
          attempts: data?.attempts,
          lockThreshold: data?.lockThreshold
        };
      }
      
      return {
        success: false,
        error: errorMsg || 'Verification failed'
      };
    }
  },

  // NEW: Token-based master password verification
  verifyMasterToken: async (masterPassword) => {
    try {
      const response = await authAPI.verifyMasterToken({ masterPassword });
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.data.message };
    } catch (error) {
      const errorMsg = error.response?.data?.message;
      const status = error.response?.status;
      const data = error.response?.data;
      
      // Handle master password lock (423)
      if (status === 423) {
        return {
          success: false,
          error: errorMsg,
          locked: true,
          otpRequired: true,
          autoLogout: data?.autoLogout || false,
          attempts: data?.attempts,
          lockDuration: data?.lockDuration,
          remainingTime: data?.remainingTime,
          requiresOTP: data?.requiresOTP || true
        };
      }
      
      // Handle too many attempts but not locked yet (401)
      if (status === 401) {
        return {
          success: false,
          error: errorMsg,
          attemptsLeft: data?.attemptsLeft,
          attempts: data?.attempts,
          lockThreshold: data?.lockThreshold,
          autoLogout: data?.autoLogout || false
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

  verifyMasterWithOTP: async (data) => {
    try {
      const response = await authAPI.verifyMasterWithOTP(data);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMsg = error.response?.data?.message;
      const status = error.response?.status;
      const data = error.response?.data;
      
      // FIXED: Also handle OTP requirements in this endpoint
      if ((status === 423 || status === 401) && (data?.otpRequired || data?.requiresOTP)) {
        return {
          success: false,
          error: errorMsg,
          otpRequired: true,
          requiresOTP: data?.requiresOTP || true,
          locked: data?.locked || false,
          autoLogout: data?.autoLogout
        };
      }
      
      return {
        success: false,
        error: errorMsg || 'Verification failed'
      };
    }
  },

  getMasterPasswordStatus: async () => {
    try {
      const response = await authAPI.getMasterPasswordStatus();
      return { success: true, status: response.data.status };
    } catch (error) {
      return { success: false, error: 'Failed to get status' };
    }
  },

  // NEW: Send OTP for master password unlock
  sendMasterPasswordOTP: async (email) => {
    try {
      const response = await authAPI.sendOTP({ email });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send OTP'
      };
    }
  },

  // NEW: Unlock master password with OTP
  unlockMasterPassword: async (email, otp) => {
    try {
      const response = await authAPI.unlockAccount({ email, otp });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to unlock'
      };
    }
  }
};