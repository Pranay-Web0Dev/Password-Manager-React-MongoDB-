import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    masterPassword: '',
    confirmMasterPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [masterPasswordStrength, setMasterPasswordStrength] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Check password strength in real-time
    if (name === 'password') {
      // Simple strength check (you can use zxcvbn library here)
      checkStrength(value, setPasswordStrength);
    }
    
    if (name === 'masterPassword') {
      checkStrength(value, setMasterPasswordStrength);
    }
  };

  const checkStrength = (password, setStrength) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    setStrength(score);
  };

  const getStrengthColor = (strength) => {
    if (!strength) return 'bg-gray-200';
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-orange-500';
    if (strength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (formData.masterPassword !== formData.confirmMasterPassword) {
      toast.error('Master passwords do not match');
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 2) {
      toast.error('Please use a stronger password');
      setIsLoading(false);
      return;
    }

    if (masterPasswordStrength < 3) {
      toast.error('Master password should be stronger');
      setIsLoading(false);
      return;
    }

    const result = await register(formData.email, formData.password, formData.masterPassword);
    
    if (result.success) {
      toast.success('Registration successful!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
              sign in to existing account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {passwordStrength !== null && (
                <div className="mt-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded ${i <= passwordStrength ? getStrengthColor(passwordStrength) : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {passwordStrength <= 1 && 'Weak password'}
                    {passwordStrength === 2 && 'Fair password'}
                    {passwordStrength === 3 && 'Good password'}
                    {passwordStrength === 4 && 'Strong password'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="masterPassword" className="block text-sm font-medium text-gray-700">
                Master Password
              </label>
              <p className="text-xs text-gray-500 mb-1">
                This password will be used to encrypt/decrypt your stored passwords
              </p>
              <div className="mt-1 relative">
                <input
                  id="masterPassword"
                  name="masterPassword"
                  type={showMasterPassword ? 'text' : 'password'}
                  required
                  value={formData.masterPassword}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Create master password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowMasterPassword(!showMasterPassword)}
                >
                  {showMasterPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {masterPasswordStrength !== null && (
                <div className="mt-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded ${i <= masterPasswordStrength ? getStrengthColor(masterPasswordStrength) : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {masterPasswordStrength < 3 && 'Master password should be stronger'}
                    {masterPasswordStrength >= 3 && 'Strong master password'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmMasterPassword" className="block text-sm font-medium text-gray-700">
                Confirm Master Password
              </label>
              <input
                id="confirmMasterPassword"
                name="confirmMasterPassword"
                type="password"
                required
                value={formData.confirmMasterPassword}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Confirm master password"
              />
              {formData.masterPassword && formData.confirmMasterPassword && 
               formData.masterPassword !== formData.confirmMasterPassword && (
                <p className="text-red-500 text-xs mt-1">Master passwords do not match</p>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;