const zxcvbn = require('zxcvbn');

// Password strength checker
const checkPasswordStrength = (password) => {
  const result = zxcvbn(password);
  
  return {
    score: result.score, // 0-4
    feedback: result.feedback.suggestions,
    warning: result.feedback.warning,
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second
  };
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate random password
const generatePassword = (length = 16, options = {}) => {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options;

  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const nums = '0123456789';
  const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let chars = '';
  if (uppercase) chars += upper;
  if (lowercase) chars += lower;
  if (numbers) chars += nums;
  if (symbols) chars += syms;

  if (chars.length === 0) {
    chars = upper + lower + nums + syms;
  }

  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }

  return password;
};

module.exports = {
  checkPasswordStrength,
  isValidEmail,
  generatePassword
};