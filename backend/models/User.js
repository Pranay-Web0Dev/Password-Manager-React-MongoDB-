const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  masterPassword: {
    type: String,
    required: [true, 'Please set a master password'],
    minlength: 8,
    select: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  
  // OTP Fields
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  otpAttempts: {
    type: Number,
    default: 0
  },
  lastOtpSent: {
    type: Date
  },
  
  // Email Notification Preferences
  emailNotifications: {
    passwordViewed: {
      type: Boolean,
      default: true
    },
    passwordCopied: {
      type: Boolean,
      default: true
    },
    failedAttempts: {
      type: Boolean,
      default: true
    },
    accountLocked: {
      type: Boolean,
      default: true
    },
    securityAlerts: {
      type: Boolean,
      default: true
    }
  },
  
  // Account Activity Tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    successful: Boolean
  }],
  
  // Security Settings
  securitySettings: {
    autoLock: {
      type: Number,
      default: 30, // minutes of inactivity
      min: 1,
      max: 240
    },
    requireMasterPassword: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: Number,
      default: 60, // minutes
      min: 5,
      max: 480
    }
  },
  
  // Profile
  profile: {
    name: {
      type: String,
      trim: true
    },
    avatar: String,
    phone: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  
  // Backup & Recovery
  backupEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  recoveryQuestions: [{
    question: String,
    answer: {
      type: String,
      select: false
    }
  }]
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Hash master password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('masterPassword')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.masterPassword = await bcrypt.hash(this.masterPassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare master password
UserSchema.methods.compareMasterPassword = async function(candidateMasterPassword) {
  return await bcrypt.compare(candidateMasterPassword, this.masterPassword);
};

// Check if account is locked
UserSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment failed attempts
UserSchema.methods.incrementFailedAttempts = function() {
  this.failedAttempts += 1;
  
  if (this.failedAttempts >= 5) {
    // Lock account for 15 minutes
    this.lockUntil = Date.now() + 15 * 60 * 1000;
  }
};

// Reset failed attempts on successful login
UserSchema.methods.resetFailedAttempts = function() {
  this.failedAttempts = 0;
  this.lockUntil = undefined;
};

// Generate and save OTP
UserSchema.methods.generateAndSaveOTP = async function() {
  const { generateOTP } = require('../utils/emailService');
  const otp = generateOTP();
  
  this.otp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  this.otpAttempts = 0;
  this.lastOtpSent = Date.now();
  
  await this.save();
  return otp;
};

// Verify OTP
UserSchema.methods.verifyOTP = function(enteredOtp) {
  // Check if OTP exists and not expired
  if (!this.otp || !this.otpExpires || this.otpExpires < Date.now()) {
    return { valid: false, reason: 'OTP expired or not found' };
  }
  
  // Check attempts
  if (this.otpAttempts >= 3) {
    return { valid: false, reason: 'Too many OTP attempts' };
  }
  
  // Verify OTP
  if (this.otp === enteredOtp) {
    this.otp = undefined;
    this.otpExpires = undefined;
    this.otpAttempts = 0;
    this.lockUntil = undefined; // Unlock account
    this.failedAttempts = 0;
    this.save();
    return { valid: true };
  } else {
    this.otpAttempts += 1;
    this.save();
    return { 
      valid: false, 
      reason: 'Invalid OTP',
      attemptsLeft: 3 - this.otpAttempts
    };
  }
};

// Reset OTP
UserSchema.methods.resetOTP = function() {
  this.otp = undefined;
  this.otpExpires = undefined;
  this.otpAttempts = 0;
  return this.save();
};

// Add login to history
UserSchema.methods.addLoginHistory = function(ipAddress, userAgent, successful) {
  this.loginHistory.unshift({
    timestamp: new Date(),
    ipAddress,
    userAgent,
    successful
  });
  
  // Keep only last 20 logins
  if (this.loginHistory.length > 20) {
    this.loginHistory = this.loginHistory.slice(0, 20);
  }
  
  if (successful) {
    this.lastLogin = new Date();
    this.lastActivity = new Date();
  }
  
  return this.save();
};

// Check if session is expired
UserSchema.methods.isSessionExpired = function() {
  if (!this.lastActivity) return true;
  
  const sessionTimeout = this.securitySettings?.sessionTimeout || 60;
  const expirationTime = new Date(this.lastActivity.getTime() + sessionTimeout * 60000);
  
  return Date.now() > expirationTime;
};

// Update last activity
UserSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Get user for response (exclude sensitive data)
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.masterPassword;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.otpAttempts;
  delete obj.verificationToken;
  delete obj.verificationTokenExpires;
  delete obj.recoveryQuestions;
  return obj;
};

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return this.profile?.name || this.email.split('@')[0];
});

// Index for better performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'loginHistory.timestamp': -1 });
UserSchema.index({ lastActivity: 1 });
UserSchema.index({ lockUntil: 1 });

module.exports = mongoose.model('User', UserSchema);