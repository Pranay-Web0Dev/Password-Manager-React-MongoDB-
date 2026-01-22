import zxcvbn from 'zxcvbn';

export const checkPasswordStrength = (password) => {
  if (!password) return null;
  
  const result = zxcvbn(password);
  
  const strengthLevels = [
    { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-500' },
    { label: 'Weak', color: 'bg-red-400', textColor: 'text-red-400' },
    { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    { label: 'Good', color: 'bg-green-400', textColor: 'text-green-400' },
    { label: 'Strong', color: 'bg-green-600', textColor: 'text-green-600' }
  ];
  
  const level = strengthLevels[result.score];
  
  return {
    score: result.score,
    label: level.label,
    color: level.color,
    textColor: level.textColor,
    feedback: result.feedback.suggestions,
    warning: result.feedback.warning,
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
    suggestions: result.feedback.suggestions || []
  };
};

export const generatePassword = (length = 16, options = {}) => {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options;

  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let allChars = '';
  let password = '';
  
  if (uppercase) allChars += upperChars;
  if (lowercase) allChars += lowerChars;
  if (numbers) allChars += numberChars;
  if (symbols) allChars += symbolChars;

  // Ensure at least one character from each selected type
  if (uppercase) password += upperChars[Math.floor(Math.random() * upperChars.length)];
  if (lowercase) password += lowerChars[Math.floor(Math.random() * lowerChars.length)];
  if (numbers) password += numberChars[Math.floor(Math.random() * numberChars.length)];
  if (symbols) password += symbolChars[Math.floor(Math.random() * symbolChars.length)];

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  password = password.split('').sort(() => Math.random() - 0.5).join('');

  return password;
};

export const getStrengthMeter = (score) => {
  const width = (score + 1) * 25; // 0-4 score to 0-100%
  
  const colors = [
    'bg-red-500', // 0
    'bg-red-400', // 1
    'bg-yellow-500', // 2
    'bg-green-400', // 3
    'bg-green-600' // 4
  ];
  
  const labels = [
    'Very Weak',
    'Weak',
    'Fair',
    'Good',
    'Strong'
  ];
  
  return {
    width: `${width}%`,
    color: colors[score] || 'bg-gray-300',
    label: labels[score] || 'No Password'
  };
};