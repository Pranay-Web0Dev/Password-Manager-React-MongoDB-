// const express = require('express');
// const router = express.Router();
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const { checkPasswordStrength, isValidEmail } = require('../utils/validation');
// const { sendOTPEmail, sendFailedLoginEmail, sendWelcomeEmail } = require('../utils/emailService');
// const { getClientIp } = require('../utils/helpers');

// // Generate JWT Token
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE
//   });
// };

// // @route   POST /api/auth/register
// // @desc    Register user
// router.post('/register', async (req, res) => {
//   try {
//     const { email, password, masterPassword, name } = req.body;

//     // Validation
//     if (!email || !password || !masterPassword) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Please provide all required fields' 
//       });
//     }

//     if (!isValidEmail(email)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Please provide a valid email' 
//       });
//     }

//     // Check password strength
//     const passwordStrength = checkPasswordStrength(password);
//     if (passwordStrength.score < 2) {
//       return res.status(400).json({
//         success: false,
//         message: 'Password is too weak',
//         strength: passwordStrength
//       });
//     }

//     // Check master password strength
//     const masterStrength = checkPasswordStrength(masterPassword);
//     if (masterStrength.score < 3) {
//       return res.status(400).json({
//         success: false,
//         message: 'Master password should be stronger',
//         strength: masterStrength
//       });
//     }

//     // Check if user exists
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'User already exists' 
//       });
//     }

//     // Create user
//     const user = await User.create({
//       email,
//       password,
//       masterPassword,
//       profile: { name }
//     });

//     // Generate token
//     const token = generateToken(user._id);

//     // Send welcome email
//     await sendWelcomeEmail(email, name || email.split('@')[0]);

//     res.status(201).json({
//       success: true,
//       message: 'User registered successfully',
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         twoFactorEnabled: user.twoFactorEnabled,
//         profile: user.profile
//       }
//     });

//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error during registration' 
//     });
//   }
// });

// // @route   POST /api/auth/login
// // @desc    Login user
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const ipAddress = getClientIp(req);
//     const userAgent = req.headers['user-agent'];

//     // Validation
//     if (!email || !password) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Please provide email and password' 
//       });
//     }

//     // Find user
//     const user = await User.findOne({ email }).select('+password');
    
//     if (!user) {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Invalid credentials' 
//       });
//     }

//     // Check if account is locked
//     if (user.isLocked()) {
//       const remainingTime = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      
//       // Send OTP email if not already sent or expired
//       if (!user.otp || user.otpExpires < Date.now()) {
//         const otp = await user.generateAndSaveOTP();
//         await sendOTPEmail(user.email, otp);
//       }
      
//       return res.status(423).json({
//         success: false,
//         message: `Account is locked. An OTP has been sent to your email.`,
//         locked: true,
//         remainingTime,
//         otpRequired: true
//       });
//     }

//     // Check password
//     const isPasswordMatch = await user.comparePassword(password);
    
//     if (!isPasswordMatch) {
//       // Add to login history
//       await user.addLoginHistory(ipAddress, userAgent, false);
      
//       // Increment failed attempts
//       user.incrementFailedAttempts();
//       await user.save();

//       // Send email notification for multiple failed attempts
//       if (user.failedAttempts >= 3 && user.emailNotifications?.failedAttempts) {
//         await sendFailedLoginEmail(user.email, user.failedAttempts, ipAddress);
//       }

//       // Check if account is now locked after this attempt
//       if (user.failedAttempts >= 5) {
//         const otp = await user.generateAndSaveOTP();
//         await sendOTPEmail(user.email, otp);
        
//         return res.status(423).json({
//           success: false,
//           message: 'Account locked due to too many failed attempts. OTP sent to email.',
//           locked: true,
//           otpRequired: true
//         });
//       }

//       return res.status(401).json({ 
//         success: false, 
//         message: 'Invalid credentials',
//         failedAttempts: user.failedAttempts,
//         remainingAttempts: 5 - user.failedAttempts
//       });
//     }

//     // Reset failed attempts on successful login
//     user.resetFailedAttempts();
//     user.lastLogin = Date.now();
//     user.lastActivity = Date.now();
//     await user.addLoginHistory(ipAddress, userAgent, true);
//     await user.save();

//     // Generate token
//     const token = generateToken(user._id);

//     res.json({
//       success: true,
//       message: 'Login successful',
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         profile: user.profile,
//         twoFactorEnabled: user.twoFactorEnabled,
//         emailNotifications: user.emailNotifications
//       }
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error during login' 
//     });
//   }
// });

// // @route   POST /api/auth/verify-master
// // @desc    Verify master password
// router.post('/verify-master', async (req, res) => {
//   try {
//     const { masterPassword } = req.body;
//     const userId = req.user.id;

//     const user = await User.findById(userId).select('+masterPassword');
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     const isMatch = await user.compareMasterPassword(masterPassword);
    
//     if (!isMatch) {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Invalid master password' 
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Master password verified'
//     });

//   } catch (error) {
//     console.error('Master password verification error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error' 
//     });
//   }
// });

// // @route   POST /api/auth/send-otp
// // @desc    Send OTP to email
// router.post('/send-otp', async (req, res) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Check if OTP was recently sent (rate limiting)
//     if (user.lastOtpSent && (Date.now() - user.lastOtpSent < 60000)) {
//       return res.status(429).json({
//         success: false,
//         message: 'Please wait 1 minute before requesting another OTP'
//       });
//     }

//     // Generate and save OTP
//     const otp = await user.generateAndSaveOTP();
    
//     // Send OTP email
//     const emailResult = await sendOTPEmail(email, otp);
    
//     if (!emailResult.success) {
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send OTP email'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'OTP sent to your email'
//     });

//   } catch (error) {
//     console.error('Send OTP error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error sending OTP' 
//     });
//   }
// });

// // @route   POST /api/auth/verify-otp
// // @desc    Verify OTP to unlock account
// router.post('/verify-otp', async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     const user = await User.findOne({ email });
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Verify OTP
//     const result = user.verifyOTP(otp);
    
//     if (!result.valid) {
//       return res.status(400).json({
//         success: false,
//         message: result.reason,
//         attemptsLeft: result.attemptsLeft
//       });
//     }

//     res.json({
//       success: true,
//       message: 'OTP verified successfully. Account unlocked.'
//     });

//   } catch (error) {
//     console.error('Verify OTP error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error verifying OTP' 
//     });
//   }
// });

// // @route   POST /api/auth/unlock-account
// // @desc    Unlock account with OTP
// router.post('/unlock-account', async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     const user = await User.findOne({ email });
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Check if account is locked
//     if (!user.isLocked()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Account is not locked'
//       });
//     }

//     // Verify OTP
//     const result = user.verifyOTP(otp);
    
//     if (!result.valid) {
//       return res.status(400).json({
//         success: false,
//         message: result.reason,
//         attemptsLeft: result.attemptsLeft
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Account unlocked successfully'
//     });

//   } catch (error) {
//     console.error('Unlock account error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error unlocking account' 
//     });
//   }
// });

// // @route   POST /api/auth/forgot-password
// // @desc    Request password reset
// router.post('/forgot-password', async (req, res) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });
    
//     if (!user) {
//       // Don't reveal that user doesn't exist
//       return res.json({
//         success: true,
//         message: 'If an account exists with this email, reset instructions will be sent'
//       });
//     }

//     // Generate and save OTP
//     const otp = await user.generateAndSaveOTP();
    
//     // Send password reset email with OTP
//     const emailResult = await sendOTPEmail(email, otp, 'password-reset');
    
//     if (!emailResult.success) {
//       return res.status(500).json({
//         success: false,
//         message: 'Failed to send reset email'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Password reset instructions sent to your email'
//     });

//   } catch (error) {
//     console.error('Forgot password error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error processing request' 
//     });
//   }
// });

// // @route   POST /api/auth/reset-password
// // @desc    Reset password with OTP
// router.post('/reset-password', async (req, res) => {
//   try {
//     const { email, otp, newPassword } = req.body;

//     const user = await User.findOne({ email }).select('+password');
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Verify OTP first
//     const otpResult = user.verifyOTP(otp);
    
//     if (!otpResult.valid) {
//       return res.status(400).json({
//         success: false,
//         message: otpResult.reason,
//         attemptsLeft: otpResult.attemptsLeft
//       });
//     }

//     // Check password strength
//     const passwordStrength = checkPasswordStrength(newPassword);
//     if (passwordStrength.score < 2) {
//       return res.status(400).json({
//         success: false,
//         message: 'New password is too weak',
//         strength: passwordStrength
//       });
//     }

//     // Update password
//     user.password = newPassword;
//     await user.save();

//     res.json({
//       success: true,
//       message: 'Password reset successful'
//     });

//   } catch (error) {
//     console.error('Reset password error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error resetting password' 
//     });
//   }
// });

// // @route   GET /api/auth/me
// // @desc    Get current user
// router.get('/me', async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .select('-password -masterPassword -otp -otpExpires -otpAttempts');
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     res.json({
//       success: true,
//       user
//     });

//   } catch (error) {
//     console.error('Get user error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error' 
//     });
//   }
// });

// // @route   PUT /api/auth/update-profile
// // @desc    Update user profile
// router.put('/update-profile', async (req, res) => {
//   try {
//     const { name, backupEmail, timezone, language } = req.body;
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Update profile fields
//     if (name !== undefined) user.profile.name = name;
//     if (backupEmail !== undefined) user.backupEmail = backupEmail;
//     if (timezone !== undefined) user.profile.timezone = timezone;
//     if (language !== undefined) user.profile.language = language;

//     await user.save();

//     res.json({
//       success: true,
//       message: 'Profile updated successfully',
//       user: user.toJSON()
//     });

//   } catch (error) {
//     console.error('Update profile error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error updating profile' 
//     });
//   }
// });

// // @route   PUT /api/auth/update-notifications
// // @desc    Update email notification preferences
// router.put('/update-notifications', async (req, res) => {
//   try {
//     const { passwordViewed, passwordCopied, failedAttempts, accountLocked, securityAlerts } = req.body;
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Update notification preferences
//     if (passwordViewed !== undefined) user.emailNotifications.passwordViewed = passwordViewed;
//     if (passwordCopied !== undefined) user.emailNotifications.passwordCopied = passwordCopied;
//     if (failedAttempts !== undefined) user.emailNotifications.failedAttempts = failedAttempts;
//     if (accountLocked !== undefined) user.emailNotifications.accountLocked = accountLocked;
//     if (securityAlerts !== undefined) user.emailNotifications.securityAlerts = securityAlerts;

//     await user.save();

//     res.json({
//       success: true,
//       message: 'Notification preferences updated',
//       emailNotifications: user.emailNotifications
//     });

//   } catch (error) {
//     console.error('Update notifications error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error updating notifications' 
//     });
//   }
// });

// // @route   PUT /api/auth/update-security
// // @desc    Update security settings
// router.put('/update-security', async (req, res) => {
//   try {
//     const { autoLock, requireMasterPassword, sessionTimeout } = req.body;
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Update security settings
//     if (autoLock !== undefined) user.securitySettings.autoLock = autoLock;
//     if (requireMasterPassword !== undefined) user.securitySettings.requireMasterPassword = requireMasterPassword;
//     if (sessionTimeout !== undefined) user.securitySettings.sessionTimeout = sessionTimeout;

//     await user.save();

//     res.json({
//       success: true,
//       message: 'Security settings updated',
//       securitySettings: user.securitySettings
//     });

//   } catch (error) {
//     console.error('Update security error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error updating security settings' 
//     });
//   }
// });

// // @route   POST /api/auth/change-password
// // @desc    Change password (requires current password)
// router.post('/change-password', async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
//     const userId = req.user.id;

//     const user = await User.findById(userId).select('+password');
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Verify current password
//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Current password is incorrect' 
//       });
//     }

//     // Check new password strength
//     const passwordStrength = checkPasswordStrength(newPassword);
//     if (passwordStrength.score < 2) {
//       return res.status(400).json({
//         success: false,
//         message: 'New password is too weak',
//         strength: passwordStrength
//       });
//     }

//     // Update password
//     user.password = newPassword;
//     await user.save();

//     res.json({
//       success: true,
//       message: 'Password changed successfully'
//     });

//   } catch (error) {
//     console.error('Change password error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error changing password' 
//     });
//   }
// });

// // @route   POST /api/auth/change-master-password
// // @desc    Change master password (requires current master password)
// router.post('/change-master-password', async (req, res) => {
//   try {
//     const { currentMasterPassword, newMasterPassword } = req.body;
//     const userId = req.user.id;

//     const user = await User.findById(userId).select('+masterPassword');
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     // Verify current master password
//     const isMatch = await user.compareMasterPassword(currentMasterPassword);
//     if (!isMatch) {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Current master password is incorrect' 
//       });
//     }

//     // Check new master password strength
//     const passwordStrength = checkPasswordStrength(newMasterPassword);
//     if (passwordStrength.score < 3) {
//       return res.status(400).json({
//         success: false,
//         message: 'New master password should be stronger',
//         strength: passwordStrength
//       });
//     }

//     // Update master password
//     user.masterPassword = newMasterPassword;
//     await user.save();

//     res.json({
//       success: true,
//       message: 'Master password changed successfully'
//     });

//   } catch (error) {
//     console.error('Change master password error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error changing master password' 
//     });
//   }
// });

// // @route   GET /api/auth/login-history
// // @desc    Get user login history
// router.get('/login-history', async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('loginHistory');
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     res.json({
//       success: true,
//       loginHistory: user.loginHistory
//     });

//   } catch (error) {
//     console.error('Get login history error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error fetching login history' 
//     });
//   }
// });

// // @route   POST /api/auth/logout
// // @desc    Logout user (server-side session cleanup)
// router.post('/logout', async (req, res) => {
//   try {
//     // Update last activity
//     const user = await User.findById(req.user.id);
//     if (user) {
//       user.lastActivity = Date.now();
//       await user.save();
//     }

//     res.json({
//       success: true,
//       message: 'Logged out successfully'
//     });

//   } catch (error) {
//     console.error('Logout error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error during logout' 
//     });
//   }
// });

// // @route   POST /api/auth/verify-email
// // @desc    Send email verification
// router.post('/verify-email', async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
    
//     if (!user) {
//       return res.status(404).json({ 
//         success: false, 
//         message: 'User not found' 
//       });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email is already verified'
//       });
//     }

//     // Generate verification token
//     const verificationToken = require('crypto').randomBytes(32).toString('hex');
//     user.verificationToken = verificationToken;
//     user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
//     await user.save();

//     // Send verification email (implement this in emailService)
//     // await sendVerificationEmail(user.email, verificationToken);

//     res.json({
//       success: true,
//       message: 'Verification email sent'
//     });

//   } catch (error) {
//     console.error('Verify email error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Server error sending verification email' 
//     });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { checkPasswordStrength, isValidEmail } = require('../utils/validation');
const { sendOTPEmail, sendFailedLoginEmail, sendWelcomeEmail, sendMasterPasswordLockedEmail } = require('../utils/emailService');
const { getClientIp } = require('../utils/helpers');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, masterPassword, name } = req.body;

    // Validation
    if (!email || !password || !masterPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email' 
      });
    }

    // Check password strength
    const passwordStrength = checkPasswordStrength(password);
    if (passwordStrength.score < 2) {
      return res.status(400).json({
        success: false,
        message: 'Password is too weak',
        strength: passwordStrength
      });
    }

    // Check master password strength
    const masterStrength = checkPasswordStrength(masterPassword);
    if (masterStrength.score < 3) {
      return res.status(400).json({
        success: false,
        message: 'Master password should be stronger',
        strength: masterStrength
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      masterPassword,
      profile: { name }
    });

    // Generate token
    const token = generateToken(user._id);

    // Send welcome email
    await sendWelcomeEmail(email, name || email.split('@')[0]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user with OTP check for master password lock
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if account is locked (regular login)
    if (user.isLocked()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
      
      // Send OTP email if not already sent or expired
      if (!user.otp || user.otpExpires < Date.now()) {
        const otp = await user.generateAndSaveOTP();
        await sendOTPEmail(user.email, otp);
      }
      
      return res.status(423).json({
        success: false,
        message: `Account is locked. An OTP has been sent to your email.`,
        locked: true,
        remainingTime,
        otpRequired: true
      });
    }

    // CHECK FOR MASTER PASSWORD LOCK (NEW)
    if (user.requiresOTPForNextLogin) {
      // Generate OTP if not already available
      if (!user.otp || user.otpExpires < Date.now()) {
        const otp = await user.generateAndSaveOTP();
        await sendOTPEmail(user.email, otp);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Account requires OTP verification due to master password security lock',
        otpRequired: true,
        requiresOTP: true,
        masterPasswordLocked: true,
        attemptsInfo: user.getMasterPasswordAttemptsInfo()
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      // Add to login history
      await user.addLoginHistory(ipAddress, userAgent, false);
      
      // Increment failed attempts
      user.incrementFailedAttempts();
      await user.save();

      // Send email notification for multiple failed attempts
      if (user.failedAttempts >= 3 && user.emailNotifications?.failedAttempts) {
        await sendFailedLoginEmail(user.email, user.failedAttempts, ipAddress);
      }

      // Check if account is now locked after this attempt
      if (user.failedAttempts >= 5) {
        const otp = await user.generateAndSaveOTP();
        await sendOTPEmail(user.email, otp);
        
        return res.status(423).json({
          success: false,
          message: 'Account locked due to too many failed attempts. OTP sent to email.',
          locked: true,
          otpRequired: true
        });
      }

      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials',
        failedAttempts: user.failedAttempts,
        remainingAttempts: 5 - user.failedAttempts
      });
    }

    // Reset failed attempts on successful login
    user.resetFailedAttempts();
    user.lastLogin = Date.now();
    user.lastActivity = Date.now();
    await user.addLoginHistory(ipAddress, userAgent, true);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        twoFactorEnabled: user.twoFactorEnabled,
        emailNotifications: user.emailNotifications
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// @route   POST /api/auth/verify-master
// @desc    Verify master password with security tracking
router.post('/verify-master', async (req, res) => {
  try {
    const { masterPassword } = req.body;
    const userId = req.user.id;
    const ipAddress = getClientIp(req);

    const user = await User.findById(userId).select('+masterPassword');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if master password is locked
    if (user.isMasterPasswordLocked()) {
      const remainingTime = Math.ceil(user.getMasterPasswordLockRemaining() / (1000 * 60));
      
      // Generate OTP if not already sent
      if (!user.otp || user.otpExpires < Date.now()) {
        const otp = await user.generateAndSaveOTP();
        await sendOTPEmail(user.email, otp);
      }
      
      // Send notification email
      if (user.emailNotifications?.masterPasswordLocked) {
        await sendMasterPasswordLockedEmail(
          user.email,
          user.masterPasswordFailedAttempts,
          remainingTime,
          ipAddress
        );
      }
      
      return res.status(423).json({
        success: false,
        message: `Master password is locked due to ${user.masterPasswordFailedAttempts} failed attempts. OTP sent to email.`,
        locked: true,
        remainingTime,
        requiresOTP: true,
        attempts: user.masterPasswordFailedAttempts,
        autoLogout: true
      });
    }

    const isMatch = await user.compareMasterPassword(masterPassword);
    
    if (!isMatch) {
      // Increment master password attempts
      const lockOccurred = user.incrementMasterPasswordAttempts();
      await user.save();
      
      const lockThreshold = user.securitySettings?.masterPasswordLockThreshold || 5;
      const attemptsLeft = lockThreshold - user.masterPasswordFailedAttempts;
      
      if (lockOccurred) {
        // Generate OTP for next login
        const otp = await user.generateAndSaveOTP();
        await sendOTPEmail(user.email, otp);
        
        // Send notification email
        if (user.emailNotifications?.masterPasswordLocked) {
          await sendMasterPasswordLockedEmail(
            user.email,
            user.masterPasswordFailedAttempts,
            user.securitySettings?.masterPasswordLockDuration || 15,
            ipAddress
          );
        }
        
        return res.status(423).json({
          success: false,
          message: 'Master password locked due to too many failed attempts. OTP sent to email. You will be logged out.',
          locked: true,
          requiresOTP: true,
          attemptsLeft: 0,
          autoLogout: true,
          lockDuration: user.securitySettings?.masterPasswordLockDuration || 15
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid master password',
        attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0,
        attempts: user.masterPasswordFailedAttempts,
        lockThreshold: lockThreshold
      });
    }

    // SUCCESS: Reset master password attempts
    user.resetMasterPasswordAttempts();
    await user.save();

    res.json({
      success: true,
      message: 'Master password verified successfully'
    });

  } catch (error) {
    console.error('Master password verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/auth/verify-master-with-otp
// @desc    Verify master password with OTP (for locked accounts)
router.post('/verify-master-with-otp', async (req, res) => {
  try {
    const { masterPassword, otp } = req.body;
    const userId = req.user.id;
    const ipAddress = getClientIp(req);

    const user = await User.findById(userId).select('+masterPassword');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify OTP first
    const otpResult = user.verifyOTP(otp);
    
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.reason,
        attemptsLeft: otpResult.attemptsLeft
      });
    }

    // Now verify master password
    const isMatch = await user.compareMasterPassword(masterPassword);
    
    if (!isMatch) {
      // Even with OTP, wrong master password should still increment attempts
      const lockOccurred = user.incrementMasterPasswordAttempts();
      await user.save();
      
      if (lockOccurred) {
        // Generate new OTP for next attempt
        const newOtp = await user.generateAndSaveOTP();
        await sendOTPEmail(user.email, newOtp);
        
        return res.status(423).json({
          success: false,
          message: 'Master password still incorrect. New OTP sent.',
          locked: true,
          requiresOTP: true,
          autoLogout: true
        });
      }
      
      const lockThreshold = user.securitySettings?.masterPasswordLockThreshold || 5;
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid master password',
        attemptsLeft: lockThreshold - user.masterPasswordFailedAttempts,
        attempts: user.masterPasswordFailedAttempts
      });
    }

    // SUCCESS - reset everything
    user.resetMasterPasswordAttempts();
    user.requiresOTPForNextLogin = false;
    await user.save();

    res.json({
      success: true,
      message: 'Master password verified successfully. Account unlocked.'
    });

  } catch (error) {
    console.error('Master password with OTP verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP to email
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if OTP was recently sent (rate limiting)
    if (user.lastOtpSent && (Date.now() - user.lastOtpSent < 60000)) {
      return res.status(429).json({
        success: false,
        message: 'Please wait 1 minute before requesting another OTP'
      });
    }

    // Generate and save OTP
    const otp = await user.generateAndSaveOTP();
    
    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your email'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error sending OTP' 
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP to unlock account
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify OTP
    const result = user.verifyOTP(otp);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.reason,
        attemptsLeft: result.attemptsLeft
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully. Account unlocked.'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error verifying OTP' 
    });
  }
});

// @route   POST /api/auth/unlock-account
// @desc    Unlock account with OTP
router.post('/unlock-account', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if account is locked
    if (!user.isLocked() && !user.requiresOTPForNextLogin) {
      return res.status(400).json({
        success: false,
        message: 'Account is not locked'
      });
    }

    // Verify OTP
    const result = user.verifyOTP(otp);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.reason,
        attemptsLeft: result.attemptsLeft
      });
    }

    res.json({
      success: true,
      message: 'Account unlocked successfully'
    });

  } catch (error) {
    console.error('Unlock account error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error unlocking account' 
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal that user doesn't exist
      return res.json({
        success: true,
        message: 'If an account exists with this email, reset instructions will be sent'
      });
    }

    // Generate and save OTP
    const otp = await user.generateAndSaveOTP();
    
    // Send password reset email with OTP
    const emailResult = await sendOTPEmail(email, otp, 'password-reset');
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email'
      });
    }

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error processing request' 
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify OTP first
    const otpResult = user.verifyOTP(otp);
    
    if (!otpResult.valid) {
      return res.status(400).json({
        success: false,
        message: otpResult.reason,
        attemptsLeft: otpResult.attemptsLeft
      });
    }

    // Check password strength
    const passwordStrength = checkPasswordStrength(newPassword);
    if (passwordStrength.score < 2) {
      return res.status(400).json({
        success: false,
        message: 'New password is too weak',
        strength: passwordStrength
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error resetting password' 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -masterPassword -otp -otpExpires -otpAttempts');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
router.put('/update-profile', async (req, res) => {
  try {
    const { name, backupEmail, timezone, language } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update profile fields
    if (name !== undefined) user.profile.name = name;
    if (backupEmail !== undefined) user.backupEmail = backupEmail;
    if (timezone !== undefined) user.profile.timezone = timezone;
    if (language !== undefined) user.profile.language = language;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating profile' 
    });
  }
});

// @route   PUT /api/auth/update-notifications
// @desc    Update email notification preferences
router.put('/update-notifications', async (req, res) => {
  try {
    const { passwordViewed, passwordCopied, failedAttempts, accountLocked, securityAlerts, masterPasswordLocked } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update notification preferences
    if (passwordViewed !== undefined) user.emailNotifications.passwordViewed = passwordViewed;
    if (passwordCopied !== undefined) user.emailNotifications.passwordCopied = passwordCopied;
    if (failedAttempts !== undefined) user.emailNotifications.failedAttempts = failedAttempts;
    if (accountLocked !== undefined) user.emailNotifications.accountLocked = accountLocked;
    if (securityAlerts !== undefined) user.emailNotifications.securityAlerts = securityAlerts;
    if (masterPasswordLocked !== undefined) user.emailNotifications.masterPasswordLocked = masterPasswordLocked;

    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated',
      emailNotifications: user.emailNotifications
    });

  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating notifications' 
    });
  }
});

// @route   PUT /api/auth/update-security
// @desc    Update security settings
router.put('/update-security', async (req, res) => {
  try {
    const { autoLock, requireMasterPassword, sessionTimeout, masterPasswordLockThreshold, masterPasswordLockDuration } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update security settings
    if (autoLock !== undefined) user.securitySettings.autoLock = autoLock;
    if (requireMasterPassword !== undefined) user.securitySettings.requireMasterPassword = requireMasterPassword;
    if (sessionTimeout !== undefined) user.securitySettings.sessionTimeout = sessionTimeout;
    if (masterPasswordLockThreshold !== undefined) user.securitySettings.masterPasswordLockThreshold = masterPasswordLockThreshold;
    if (masterPasswordLockDuration !== undefined) user.securitySettings.masterPasswordLockDuration = masterPasswordLockDuration;

    await user.save();

    res.json({
      success: true,
      message: 'Security settings updated',
      securitySettings: user.securitySettings
    });

  } catch (error) {
    console.error('Update security error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating security settings' 
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change password (requires current password)
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Check new password strength
    const passwordStrength = checkPasswordStrength(newPassword);
    if (passwordStrength.score < 2) {
      return res.status(400).json({
        success: false,
        message: 'New password is too weak',
        strength: passwordStrength
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error changing password' 
    });
  }
});

// @route   POST /api/auth/change-master-password
// @desc    Change master password (requires current master password)
router.post('/change-master-password', async (req, res) => {
  try {
    const { currentMasterPassword, newMasterPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId).select('+masterPassword');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify current master password
    const isMatch = await user.compareMasterPassword(currentMasterPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current master password is incorrect' 
      });
    }

    // Check new master password strength
    const passwordStrength = checkPasswordStrength(newMasterPassword);
    if (passwordStrength.score < 3) {
      return res.status(400).json({
        success: false,
        message: 'New master password should be stronger',
        strength: passwordStrength
      });
    }

    // Update master password
    user.masterPassword = newMasterPassword;
    // Reset master password attempts when changing password
    user.resetMasterPasswordAttempts();
    await user.save();

    res.json({
      success: true,
      message: 'Master password changed successfully'
    });

  } catch (error) {
    console.error('Change master password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error changing master password' 
    });
  }
});

// @route   GET /api/auth/login-history
// @desc    Get user login history
router.get('/login-history', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('loginHistory');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      loginHistory: user.loginHistory
    });

  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching login history' 
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (server-side session cleanup)
router.post('/logout', async (req, res) => {
  try {
    // Update last activity
    const user = await User.findById(req.user.id);
    if (user) {
      user.lastActivity = Date.now();
      await user.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during logout' 
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Send email verification
router.post('/verify-email', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate verification token
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email (implement this in emailService)
    // await sendVerificationEmail(user.email, verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error sending verification email' 
    });
  }
});

// @route   GET /api/auth/master-password-status
// @desc    Get master password security status
router.get('/master-password-status', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      status: user.getMasterPasswordAttemptsInfo()
    });

  } catch (error) {
    console.error('Get master password status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;