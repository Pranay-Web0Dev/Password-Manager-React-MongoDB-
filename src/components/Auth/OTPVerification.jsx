import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const OTPVerification = ({ email, onVerify, onResend }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }

    // Timer countdown
    const countdown = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  // Simple handleChange function
  const handleChange = (index, value) => {
    // Remove non-numeric characters
    value = value.replace(/\D/g, '');
    
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input
    if (value && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous input if current is empty
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 10);
      } else if (otp[index]) {
        // Clear current input if it has value
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pasteData.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      pasteData.split('').forEach((digit, index) => {
        if (index < 6) newOtp[index] = digit;
      });
      setOtp(newOtp);
      
      // Focus the last filled input
      const lastFilledIndex = Math.min(pasteData.length - 1, 5);
      setTimeout(() => {
        inputRefs.current[lastFilledIndex]?.focus();
      }, 10);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter a complete 6-digit OTP');
      // Find first empty input and focus it
      const emptyIndex = otp.findIndex(digit => !digit);
      if (emptyIndex !== -1 && inputRefs.current[emptyIndex]) {
        inputRefs.current[emptyIndex].focus();
      }
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:4000/api/auth/verify-otp', {
        email,
        otp: otpString
      });
      
      if (response.data.success) {
        toast.success('OTP verified successfully!');
        if (onVerify) {
          onVerify();
        }
      } else {
        toast.error(response.data.message || 'Verification failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Verification failed. Please try again.';
      toast.error(errorMessage);
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:4000/api/auth/send-otp', { email });
      
      if (response.data.success) {
        toast.success('New OTP sent to your email!');
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        
        // Start timer again
        const newTimer = setInterval(() => {
          setTimer(prev => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(newTimer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Focus first input
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }, 100);
      } else {
        toast.error(response.data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Identity
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit OTP to <span className="font-semibold">{email}</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* OTP Inputs - SIMPLIFIED VERSION */}
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                maxLength="1"
                className="w-12 h-12 sm:w-14 sm:h-14 text-center text-3xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors text-black bg-white shadow-sm"
                disabled={isLoading}
                autoFocus={index === 0}
              />
            ))}
          </div>
          
          {/* Timer */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {canResend ? (
                <span>OTP expired. Click below to resend</span>
              ) : (
                <span>Resend OTP in <span className="font-bold">{timer}s</span></span>
              )}
            </p>
            
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend || isLoading}
              className={`mt-2 text-sm font-medium ${canResend ? 'text-green-600 hover:text-green-700' : 'text-gray-400'} disabled:cursor-not-allowed`}
            >
              Resend OTP
            </button>
          </div>
          
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
          
          {/* Back Button */}
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
            >
              ← Back to Login
            </button>
          </div>
        </form>
        
        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📧 Check these places:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Check your email inbox and spam folder</li>
            <li>• OTP is valid for 10 minutes</li>
            <li>• Enter the 6-digit code you received</li>
            <li>• You have 3 attempts before OTP expires</li>
          </ul>
        </div>
        
        {/* Debug Info - Remove in production */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <p>Debug: OTP value: {otp.join('')}</p>
          <p>Debug: OTP length: {otp.join('').length}</p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;