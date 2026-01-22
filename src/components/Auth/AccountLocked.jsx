import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { otpAPI } from '../../services/api'; // Now this import will work
import { FaLock, FaEnvelope, FaKey, FaCheck, FaRedo } from 'react-icons/fa';

const AccountLocked = ({ email, remainingTime }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('locked'); // 'locked' or 'otp'
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const handleOTPChange = (index, value) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }
    
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d*$/.test(pasteData)) return;
    
    const newOtp = [...otp];
    pasteData.split('').forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    setOtp(newOtp);
    
    // Focus last input
    const lastIndex = Math.min(pasteData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await otpAPI.unlockAccount({ email, otp: otpString });
      
      if (response.data.success) {
        toast.success('Account unlocked successfully!');
        navigate('/login');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid OTP';
      const attemptsLeft = error.response?.data?.attemptsLeft;
      
      if (attemptsLeft) {
        toast.error(`${errorMsg}. Attempts left: ${attemptsLeft}`);
      } else {
        toast.error(errorMsg);
      }
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!canResend && step === 'locked') {
      setStep('otp');
      return;
    }
    
    if (!canResend) {
      toast.error(`Please wait ${timer} seconds before resending`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await otpAPI.sendOTP(email);
      
      if (response.data.success) {
        toast.success('New OTP sent to your email!');
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const OTPVerificationForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Enter Verification Code
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          We've sent a 6-digit OTP to <strong>{email}</strong>
        </p>
        
        <form onSubmit={handleOTPSubmit} className="space-y-4">
          <div className="flex justify-center space-x-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors"
                disabled={isLoading}
              />
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {canResend ? (
                <span>Didn't receive the code?</span>
              ) : (
                <span>Resend code in {timer}s</span>
              )}
            </p>
            
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={!canResend || isLoading}
              className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaRedo className="mr-1" size={12} />
              Resend OTP
            </button>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : (
              <>
                <FaCheck className="mr-2" />
                Verify & Unlock Account
              </>
            )}
          </button>
        </form>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> The OTP is valid for 10 minutes. Check your spam folder if you don't see the email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {step === 'locked' ? (
          <>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <FaLock className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Account Locked
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Too many failed login attempts. Your account is temporarily locked for security.
              </p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaKey className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>Lock Duration:</strong> {remainingTime} minutes remaining
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    <strong>Solution:</strong> Verify with OTP sent to your email
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setStep('otp')}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              >
                <FaEnvelope className="mr-2" />
                {isLoading ? 'Processing...' : 'Verify with OTP'}
              </button>

              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Back to Login
              </button>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Why was my account locked?</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li className="flex items-start">
                  <span className="inline-block h-1.5 w-1.5 bg-yellow-400 rounded-full mt-1 mr-2"></span>
                  5 or more consecutive failed login attempts
                </li>
                <li className="flex items-start">
                  <span className="inline-block h-1.5 w-1.5 bg-yellow-400 rounded-full mt-1 mr-2"></span>
                  Security measure to prevent unauthorized access
                </li>
                <li className="flex items-start">
                  <span className="inline-block h-1.5 w-1.5 bg-yellow-400 rounded-full mt-1 mr-2"></span>
                  OTP verification required to unlock
                </li>
              </ul>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Need help? <a href="mailto:support@passop.com" className="text-green-600 hover:text-green-500">Contact Support</a>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <FaEnvelope className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Verify Your Identity
              </h2>
              <button
                onClick={() => setStep('locked')}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to locked account info
              </button>
            </div>
            
            <OTPVerificationForm />
          </>
        )}
      </div>
    </div>
  );
};

export default AccountLocked;