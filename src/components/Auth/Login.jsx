import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import OTPVerification from './OTPVerification';
import AccountLocked from './AccountLocked';
import MasterPasswordLocked from './MasterPasswordLocked';
import useAutoLogout from '../../hooks/useAutoLogout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const [showMasterPasswordLocked, setShowMasterPasswordLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [masterPasswordLockInfo, setMasterPasswordLockInfo] = useState(null);
  const [isMasterPasswordLock, setIsMasterPasswordLock] = useState(false);
  
  // FIXED: Correct usage of useAutoLogout hook
  const { isLocked: isMasterPasswordLocked, remainingTime: lockRemainingTime } = useAutoLogout();
  
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  // NEW: Handle auto-logout when detected
  useEffect(() => {
    if (isMasterPasswordLocked && lockRemainingTime > 0) {
      // Don't show toast here - let the hook handle it
      console.log(`Master password locked. Auto-logout in ${lockRemainingTime} minutes.`);
    }
  }, [isMasterPasswordLocked, lockRemainingTime]);

  // NEW: Check URL for auto-logout parameter on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autoLogout = urlParams.get('autoLogout');
    const masterPasswordLocked = urlParams.get('masterPasswordLocked');
    
    if (autoLogout) {
      toast.error('Auto-logout: Master password was locked for security.');
      // Clear the parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (masterPasswordLocked) {
      toast.error('Master password locked. Please login and verify with OTP.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setShowOTP(false);
    setShowLocked(false);
    setShowMasterPasswordLocked(false);
    setIsMasterPasswordLock(false);

    // Store login data for retry after OTP
    setLoginData({ email, password });

    const result = await login(email, password);
    
    if (result.success) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      // FIXED LOGIC: Unified OTP handling for ALL OTP scenarios
      if (result.otpRequired || result.requiresOTP) {
        // Show OTP verification for ALL OTP-required scenarios
        setShowOTP(true);
        setRemainingTime(result.remainingTime || 15);
        
        if (result.masterPasswordLocked) {
          toast.error('Master password locked. OTP sent to your email.');
          setMasterPasswordLockInfo(result.attemptsInfo || {});
          setIsMasterPasswordLock(true);
        } else {
          toast.error('Account locked. OTP sent to your email.');
        }
      } 
      // Keep backward compatibility for old locked flag
      else if (result.locked) {
        setShowOTP(true);
        setRemainingTime(result.remainingTime || 15);
        toast.error('Account locked. OTP sent to your email.');
      } 
      // Handle master password lock specifically (deprecated - kept for safety)
      else if (result.masterPasswordLocked) {
        toast.error('Master password locked. Please verify with OTP.');
        setMasterPasswordLockInfo(result.attemptsInfo || {});
        setShowMasterPasswordLocked(true);
      } 
      // Regular errors
      else {
        toast.error(result.error);
        
        // Show remaining attempts
        if (result.remainingAttempts) {
          toast.error(`Remaining attempts: ${result.remainingAttempts}`);
        }
        
        // Check if we should warn about impending master password lock
        if (result.attemptsLeft !== undefined && result.attemptsLeft <= 2) {
          toast.error(`Warning: ${result.attemptsLeft} more failed attempt${result.attemptsLeft === 1 ? '' : 's'} will lock your master password.`);
        }
      }
    }
    
    setIsLoading(false);
  };

  const handleOTPVerify = async () => {
    setIsLoading(true);
    
    try {
      // If it's a master password lock, we need a different flow
      if (isMasterPasswordLock) {
        // For master password lock, user needs to login again after OTP verification
        // The OTPVerification component already handles this
        // Just show success message
        toast.success('OTP verified! You can now login with your credentials.');
        setShowOTP(false);
        setIsMasterPasswordLock(false);
      } else {
        // Try to login again after OTP verification for regular account lock
        const result = await login(loginData.email, loginData.password);
        
        if (result.success) {
          toast.success('Account unlocked and login successful!');
          navigate('/dashboard');
        } else {
          toast.error('Please try logging in again.');
          setShowOTP(false);
        }
      }
    } catch (error) {
      toast.error('Error during OTP verification');
      setShowOTP(false);
      setIsMasterPasswordLock(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    
    try {
      // Call API to resend OTP
      const response = await fetch('http://localhost:4000/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('New OTP sent to your email!');
      } else {
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleUnlockWithOTP = () => {
    setShowLocked(false);
    setShowOTP(true);
  };

  // FIXED: Removed duplicate auto-logout polling since we're using the hook
  // The useAutoLogout hook handles all auto-logout functionality

  // If master password is locked (deprecated path - kept for safety)
  if (showMasterPasswordLocked) {
    return (
      <MasterPasswordLocked
        email={email}
        lockInfo={masterPasswordLockInfo}
        onUnlock={() => {
          setShowMasterPasswordLocked(false);
          setShowOTP(true);
          setIsMasterPasswordLock(true);
        }}
        onBack={() => {
          setShowMasterPasswordLocked(false);
          setEmail('');
          setPassword('');
        }}
      />
    );
  }

  // If account is locked (deprecated path - kept for safety)
  if (showLocked) {
    return (
      <AccountLocked 
        email={email}
        remainingTime={remainingTime}
        onUnlock={handleUnlockWithOTP}
      />
    );
  }

  // If OTP verification is required - MAIN FIXED PATH
  if (showOTP) {
    return (
      <OTPVerification
        email={email}
        onVerify={handleOTPVerify}
        onResend={handleResendOTP}
        onBack={() => {
          setShowOTP(false);
          setEmail('');
          setPassword('');
          setIsMasterPasswordLock(false);
        }}
        isMasterPasswordLock={isMasterPasswordLock}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex justify-center">
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to PassOP
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Secure password management at your fingertips
          </p>
          
          {/* NEW: Auto-logout warning badge */}
          {isMasterPasswordLocked && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800 animate-pulse">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Master Password Locked - Auto-logout in {lockRemainingTime} min
              </div>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="you@example.com"
                disabled={isMasterPasswordLocked} // Disable if auto-logout is pending
              />
              {isMasterPasswordLocked && (
                <p className="mt-1 text-xs text-red-600">
                  Master password locked. Login disabled until verification.
                </p>
              )}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-green-600 hover:text-green-500 disabled:text-gray-400"
                  disabled={isMasterPasswordLocked}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:bg-gray-100"
                placeholder="Enter your password"
                disabled={isMasterPasswordLocked} // Disable if auto-logout is pending
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              disabled={isMasterPasswordLocked}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember this device
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || isMasterPasswordLocked}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-green-500 group-hover:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                )}
              </span>
              {isMasterPasswordLocked ? 'Auto-logout Pending...' : (isLoading ? 'Signing in...' : 'Sign in')}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-medium text-green-600 hover:text-green-500 disabled:text-gray-400"
              >
                Sign up now
              </Link>
            </p>
          </div>
        </form>

        {/* Security Tips */}
        <div className="mt-8">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Security Tip:</strong> Use a strong, unique master password. After 5 failed master password attempts, you'll be automatically logged out and require OTP for next login.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Attempts Warning */}
        {error && error.includes('attempts') && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Warning:</strong> Multiple failed attempts will lock your account. After 5 attempts, you'll need to verify with OTP.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* NEW: Auto-logout countdown display */}
        {isMasterPasswordLocked && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Auto-logout Active:</strong> Your master password has been locked due to security concerns. 
                  Auto-logout will occur in approximately <span className="font-bold">{lockRemainingTime}</span> minutes.
                </p>
                <p className="text-xs text-red-600 mt-1">
                  To prevent auto-logout, please verify your identity with OTP immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;