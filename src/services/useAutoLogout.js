import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from './authService';

export const useAutoLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkMasterPasswordLock = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const status = await authService.getMasterPasswordStatus();
        if (status.success && status.status?.isLocked) {
          // Auto logout if master password is locked
          localStorage.removeItem('token');
          navigate('/login?masterPasswordLocked=true');
        }
      } catch (error) {
        console.error('Error checking master password status:', error);
      }
    };

    // Check immediately
    checkMasterPasswordLock();

    // Check every 30 seconds
    const interval = setInterval(checkMasterPasswordLock, 30000);

    return () => clearInterval(interval);
  }, [navigate]);
};