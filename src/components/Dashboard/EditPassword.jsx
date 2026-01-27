import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaCopy } from 'react-icons/fa';
import { checkPasswordStrength, generatePassword } from '../../utils/passwordStrength';

const EditPassword = ({ password, decryptedPassword, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    site: '',
    username: '',
    password: '',
    masterPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (password && decryptedPassword) {
      setFormData({
        site: password.site || '',
        username: password.username || '',
        password: decryptedPassword || '',
        masterPassword: '' // Start with empty master password
      });
      setPasswordStrength(checkPasswordStrength(decryptedPassword));
    }
  }, [password, decryptedPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.site || !formData.username || !formData.password || !formData.masterPassword) {
      toast.error('Please fill all fields');
      return;
    }

    // Check if master password is provided
    if (!formData.masterPassword) {
      toast.error('Master password is required to re-encrypt the password');
      return;
    }

    // Check password strength
    const strength = checkPasswordStrength(formData.password);
    if (strength.score < 2) {
      const shouldContinue = window.confirm(
        'This password is weak. Are you sure you want to update it?\n\n' +
        'Suggestions:\n' +
        (strength.suggestions?.join('\n') || 'Try adding numbers and special characters')
      );
      
      if (!shouldContinue) return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(password._id, formData);
      // Success is handled by parent component
    } catch (error) {
      // Error is handled by parent component
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePassword = () => {
    const generatedPassword = generatePassword(16, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true
    });
    
    setFormData(prev => ({ ...prev, password: generatedPassword }));
    setPasswordStrength(checkPasswordStrength(generatedPassword));
    toast.success('Strong password generated!');
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(formData.password);
    toast.success('Password copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-yellow-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Edit Password for <span className="text-yellow-600">{password?.site}</span>
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium"
        >
          Cancel Edit
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website/App
            </label>
            <input
              type="text"
              name="site"
              value={formData.site}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="https://example.com"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username/Email
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              placeholder="user@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="ml-2 text-sm text-green-600 hover:text-green-700"
              >
                Generate Strong
              </button>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 pr-20"
                placeholder="Enter new password"
                required
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                {formData.password && (
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Copy password"
                  >
                    <FaCopy size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-600 hover:text-gray-800"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>
            
            {/* Password Strength Meter */}
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className={`font-medium ${passwordStrength.textColor}`}>
                    {passwordStrength.label}
                  </span>
                  <span className="text-gray-600">
                    {passwordStrength.crackTime}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                  ></div>
                </div>
                {passwordStrength.suggestions.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    {passwordStrength.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Master Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Master Password
              <span className="text-xs text-gray-500 ml-1">
                (required to re-encrypt)
              </span>
            </label>
            <div className="relative">
              <input
                type={showMasterPassword ? 'text' : 'password'}
                name="masterPassword"
                value={formData.masterPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 pr-12"
                placeholder="Enter master password again"
                required
              />
              <button
                type="button"
                onClick={() => setShowMasterPassword(!showMasterPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                title={showMasterPassword ? 'Hide' : 'Show'}
              >
                {showMasterPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter your master password to encrypt the updated password
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPassword;