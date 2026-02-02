import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { toast } from 'react-hot-toast';

const useAutoLogout = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const checkMasterPasswordStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const result = await authService.getMasterPasswordStatus();
      
      if (result.success && result.status) {
        const { isLocked: lockedStatus, lockedUntil } = result.status;
        
        if (lockedStatus && lockedUntil) {
          const timeRemaining = Math.max(0, new Date(lockedUntil) - Date.now());
          const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));
          
          setIsLocked(true);
          setRemainingTime(minutesRemaining);
          
          // Auto logout if locked
          if (timeRemaining > 0) {
            toast.error(`Master password locked. Auto-logout in ${minutesRemaining} minutes.`);
            
            // Immediate logout for security
            if (minutesRemaining <= 1) {
              setTimeout(() => {
                authService.logout();
                toast.error('Auto-logout: Master password locked for security.');
              }, 10000); // 10 seconds warning
            }
          }
        } else {
          setIsLocked(false);
        }
      }
    } catch (error) {
      console.error('Error checking master password status:', error);
    }
  }, []);
  
  // Enhanced status polling with immediate check on mount
  useEffect(() => {
    // Check immediately
    checkMasterPasswordStatus();
    
    // Poll every 30 seconds
    const interval = setInterval(checkMasterPasswordStatus, 30000);
    
    // Check on window focus
    const handleFocus = () => checkMasterPasswordStatus();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkMasterPasswordStatus]);
  
  // Listen for master password errors from API calls
  useEffect(() => {
    const handleApiError = (event) => {
      const error = event.detail;
      
      if (error && error.status === 423 && error.data?.autoLogout) {
        // Master password lock detected - immediate logout
        toast.error('Master password locked. Auto-logout for security.');
        setTimeout(() => {
          authService.logout();
        }, 3000); // 3 seconds warning
      }
    };
    
    window.addEventListener('apiError', handleApiError);
    
    return () => {
      window.removeEventListener('apiError', handleApiError);
    };
  }, []);
  
  return { isLocked, remainingTime, checkMasterPasswordStatus };
};

export default useAutoLogout;