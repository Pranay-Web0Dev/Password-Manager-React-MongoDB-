import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FaCopy, FaRedo, FaCheck, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import { checkPasswordStrength, generatePassword } from '../../utils/passwordStrength';

const PasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [strength, setStrength] = useState(null);
  const [history, setHistory] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const historyRef = useRef(null);

  const generateNewPassword = () => {
    const newPassword = generatePassword(length, options);
    setPassword(newPassword);
    setStrength(checkPasswordStrength(newPassword));
    
    // Add to history (limit to 10)
    setHistory(prev => {
      const newHistory = [{
        password: newPassword,
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, ...prev];
      return newHistory.slice(0, 10);
    });
  };

  const handleOptionChange = (option) => {
    const newOptions = {
      ...options,
      [option]: !options[option]
    };
    
    // Ensure at least one option is selected
    if (Object.values(newOptions).every(v => !v)) {
      toast.error('At least one character type must be selected');
      return;
    }
    
    setOptions(newOptions);
  };

  const handleCopy = () => {
    if (!password) {
      toast.error('Generate a password first');
      return;
    }
    
    navigator.clipboard.writeText(password);
    toast.success('Password copied to clipboard!');
  };

  const handleUsePassword = () => {
    if (!password) {
      toast.error('Generate a password first');
      return;
    }
    
    navigator.clipboard.writeText(password);
    toast.success('Password copied! You can now paste it in your form.');
  };

  const handleSaveToHistory = (savedPassword) => {
    setPassword(savedPassword);
    setStrength(checkPasswordStrength(savedPassword));
    toast.success('Password loaded from history!');
  };

  const removeFromHistory = (id, e) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
    toast.success('Removed from history');
  };

  // Generate initial password on mount
  useEffect(() => {
    generateNewPassword();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Password Generator</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
            Create strong, secure passwords with custom options. All passwords are generated locally in your browser.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Generator (70% width) */}
          <div className="lg:w-7/12">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 h-full">
              {/* Generated Password Display */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Generated Password
                </label>
                <div className="relative">
                  <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 pr-32">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1 min-w-0">
                        <div className="font-mono text-base md:text-lg tracking-wider break-all truncate">
                          {showPassword ? password : '•'.repeat(password.length || 16)}
                        </div>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="ml-3 text-gray-500 hover:text-gray-700 flex-shrink-0"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
                        <button
                          onClick={handleCopy}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                          title="Copy to clipboard"
                        >
                          <FaCopy size={18} />
                        </button>
                        <button
                          onClick={generateNewPassword}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Generate new"
                        >
                          <FaRedo size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strength Indicator */}
              {strength && (
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Password Strength: <span className={strength.textColor}>{strength.label}</span>
                    </span>
                    <span className="text-sm text-gray-600">{strength.crackTime}</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-500`}
                      style={{ width: `${(strength.score + 1) * 20}%` }}
                    ></div>
                  </div>
                  {strength.suggestions.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium mb-1">Suggestions:</p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {strength.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <FaCheck className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Length Slider */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    Password Length: <span className="text-green-600 font-bold text-lg">{length}</span>
                  </label>
                  <div className="flex space-x-2">
                    {[8, 12, 16, 20, 24].map((len) => (
                      <button
                        key={len}
                        onClick={() => setLength(len)}
                        className={`px-3 py-1 text-sm rounded-lg ${length === len ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-2">
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={length}
                    onChange={(e) => setLength(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span>8</span>
                    <span>16</span>
                    <span>24</span>
                    <span>32</span>
                  </div>
                </div>
              </div>

              {/* Character Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Character Types
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'uppercase', label: 'Uppercase', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
                    { key: 'lowercase', label: 'Lowercase', chars: 'abcdefghijklmnopqrstuvwxyz' },
                    { key: 'numbers', label: 'Numbers', chars: '0123456789' },
                    { key: 'symbols', label: 'Symbols', chars: '!@#$%^&*()' }
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleOptionChange(option.key)}
                      className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                        options[option.key]
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center ${
                          options[option.key] ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}>
                          {options[option.key] && (
                            <FaCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-mono hidden sm:block">
                          {option.chars.substring(0, 3)}...
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 text-center sm:text-left">
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={generateNewPassword}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 sm:px-6 rounded-xl font-medium transition-colors flex items-center justify-center"
                >
                  <FaRedo className="mr-2" />
                  <span className="text-sm sm:text-base">Generate New</span>
                </button>
                <button
                  onClick={handleUsePassword}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 sm:px-6 rounded-xl font-medium transition-colors flex items-center justify-center"
                >
                  <FaCopy className="mr-2" />
                  <span className="text-sm sm:text-base">Use Password</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - History & Tips (30% width) */}
          <div className="lg:w-5/12">
            <div className="sticky top-8 space-y-6">
              {/* History Panel */}
              <div className="bg-white rounded-2xl shadow-xl p-6 max-h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Passwords</h3>
                  {history.length > 0 && (
                    <button
                      onClick={() => {
                        setHistory([]);
                        toast.success('History cleared');
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Last 10 generated passwords (stored locally)
                </p>
                
                {history.length === 0 ? (
                  <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
                    <div className="text-gray-400 mb-2">No history yet</div>
                    <div className="text-sm text-gray-500">Generate passwords to see them here</div>
                  </div>
                ) : (
                  <div 
                    ref={historyRef}
                    className="space-y-3 flex-1 overflow-y-auto pr-2 max-h-[300px]"
                  >
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="group p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                        onClick={() => handleSaveToHistory(item.password)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-mono text-sm truncate pr-2">
                                {item.password.substring(0, 14)}...
                              </div>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {item.timestamp}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              <span className={`px-2 py-0.5 rounded ${
                                checkPasswordStrength(item.password).score >= 3
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {checkPasswordStrength(item.password).label}
                              </span>
                              <span className="ml-2">{item.password.length} chars</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(item.password);
                                toast.success('Copied to clipboard!');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy"
                            >
                              <FaCopy size={12} />
                            </button>
                            <button
                              onClick={(e) => removeFromHistory(item.id, e)}
                              className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tips Panel */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Tips</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <div className="bg-green-100 text-green-600 rounded-full p-1 mr-3 mt-0.5 flex-shrink-0">
                      <FaCheck className="w-3 h-3" />
                    </div>
                    <span>Use at least 16 characters for maximum security</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-green-100 text-green-600 rounded-full p-1 mr-3 mt-0.5 flex-shrink-0">
                      <FaCheck className="w-3 h-3" />
                    </div>
                    <span>Include a mix of character types</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-green-100 text-green-600 rounded-full p-1 mr-3 mt-0.5 flex-shrink-0">
                      <FaCheck className="w-3 h-3" />
                    </div>
                    <span>Avoid dictionary words and personal info</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-green-100 text-green-600 rounded-full p-1 mr-3 mt-0.5 flex-shrink-0">
                      <FaCheck className="w-3 h-3" />
                    </div>
                    <span>Use unique passwords for each account</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-green-100 text-green-600 rounded-full p-1 mr-3 mt-0.5 flex-shrink-0">
                      <FaCheck className="w-3 h-3" />
                    </div>
                    <span>Update passwords every 3-6 months</span>
                  </li>
                </ul>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{history.length}</div>
                    <div className="text-sm text-blue-800">Generated</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {history.filter(h => checkPasswordStrength(h.password).score >= 3).length}
                    </div>
                    <div className="text-sm text-green-800">Strong</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{length}</div>
                    <div className="text-sm text-purple-800">Current Length</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Object.values(options).filter(v => v).length}
                    </div>
                    <div className="text-sm text-yellow-800">Options Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">🔒 Security Notice</h4>
              <p className="text-sm text-gray-600 mt-1">
                All passwords are generated locally in your browser. No passwords are sent to our servers.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={handleCopy}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Copy Current Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;