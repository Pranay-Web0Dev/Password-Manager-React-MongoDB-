import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import OTPVerification from './OTPVerification';
import AccountLocked from './AccountLocked';
import MasterPasswordLocked from './MasterPasswordLocked'; // We'll create this

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
  
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setShowOTP(false);
    setShowLocked(false);
    setShowMasterPasswordLocked(false);

    // Store login data for retry after OTP
    setLoginData({ email, password });

    const result = await login(email, password);
    
    if (result.success) {
      toast.success('Login successful!');
      navigate('/dashboard');
    } else {
      // Check for master password lock
      if (result.masterPasswordLocked) {
        setMasterPasswordLockInfo(result.attemptsInfo || {});
        setShowMasterPasswordLocked(true);
        toast.error('Master password locked. OTP required for login.');
      } else if (result.locked) {
        // Show OTP verification screen
        setShowOTP(true);
        setRemainingTime(result.remainingTime || 15);
        toast.error('Account locked. OTP sent to your email.');
      } else if (result.otpRequired) {
        // Show account locked screen with OTP option
        setShowLocked(true);
        toast.error('Account locked. Please verify with OTP.');
      } else {
        toast.error(result.error);
        
        // Show remaining attempts
        if (result.remainingAttempts) {
          toast.error(`Remaining attempts: ${result.remainingAttempts}`);
        }
      }
    }
    
    setIsLoading(false);
  };

  const handleOTPVerify = async () => {
    setIsLoading(true);
    
    try {
      // Try to login again after OTP verification
      const result = await login(loginData.email, loginData.password);
      
      if (result.success) {
        toast.success('Account unlocked and login successful!');
        navigate('/dashboard');
      } else {
        toast.error('Please try logging in again.');
        setShowOTP(false);
        setShowMasterPasswordLocked(false);
      }
    } catch (error) {
      toast.error('Error logging in after OTP verification');
      setShowOTP(false);
      setShowMasterPasswordLocked(false);
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

  // Auto-logout handler when master password is locked
  useEffect(() => {
    const checkMasterPasswordStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('http://localhost:4000/api/auth/master-password-status', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.status && data.status.isLocked) {
              // Auto logout if master password is locked
              localStorage.removeItem('token');
              window.location.href = '/login?masterPasswordLocked=true';
            }
          }
        }
      } catch (error) {
        console.error('Error checking master password status:', error);
      }
    };

    // Check on mount and every 30 seconds
    checkMasterPasswordStatus();
    const interval = setInterval(checkMasterPasswordStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // If master password is locked, show special screen
  if (showMasterPasswordLocked) {
    return (
      <MasterPasswordLocked
        email={email}
        lockInfo={masterPasswordLockInfo}
        onUnlock={handleUnlockWithOTP}
        onBack={() => {
          setShowMasterPasswordLocked(false);
          setEmail('');
          setPassword('');
        }}
      />
    );
  }

  // If account is locked, show special locked screen
  if (showLocked) {
    return (
      <AccountLocked 
        email={email}
        remainingTime={remainingTime}
        onUnlock={handleUnlockWithOTP}
      />
    );
  }

  // If OTP verification is required
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
        }}
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
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-green-600 hover:text-green-500"
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
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Enter your password"
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
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember this device
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
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
      </div>
    </div>
  );
};

export default Login;