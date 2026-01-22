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

  const handleChange = (index, value) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      toast.error('Please enter 6-digit OTP');
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
        onVerify();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

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
        inputRefs.current[0].focus();
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
            We've sent a 6-digit OTP to {email}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* OTP Inputs */}
          <div className="flex justify-center space-x-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors"
                disabled={isLoading}
              />
            ))}
          </div>
          
          {/* Timer */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {canResend ? (
                <span>Didn't receive OTP?</span>
              ) : (
                <span>Resend OTP in {timer}s</span>
              )}
            </p>
            
            {canResend && (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="mt-2 text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
              >
                Resend OTP
              </button>
            )}
          </div>
          
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
          
          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Back to Login
            </button>
          </div>
        </form>
        
        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📧 Check these places:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Your email inbox (check spam folder too)</li>
            <li>• The OTP is valid for 10 minutes</li>
            <li>• Enter the 6-digit code exactly as shown</li>
            <li>• After 3 failed attempts, you'll need to request a new OTP</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;