const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token WITH master password fields
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      // FIX: Create session object if it doesn't exist
      if (!req.session) {
        req.session = {};
      }
      
      // FIX: Set master password status in session based on user's actual state
      if (req.user.isMasterPasswordLocked()) {
        req.session.masterPasswordVerified = false;
        req.session.masterPasswordLocked = true;
      } else {
        req.session.masterPasswordVerified = req.session.masterPasswordVerified || false;
        req.session.masterPasswordLocked = false;
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const requireMasterPassword = async (req, res, next) => {
  try {
    // FIX: Don't rely on session, check user's actual state
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if master password is locked
    if (user.isMasterPasswordLocked()) {
      return res.status(423).json({ 
        success: false, 
        message: 'Master password is locked. Please verify with OTP.',
        locked: true,
        requiresOTP: true,
        autoLogout: true
      });
    }

    // FIX: Use token-based verification instead of session
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token has master password verification flag
      // We'll add this to the token when master password is verified
      if (decoded.masterPasswordVerified) {
        next();
        return;
      }
    }

    // If no token verification, check session (fallback)
    if (!req.session || !req.session.masterPasswordVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Master password verification required' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Master password middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error verifying master password' 
    });
  }
};

// NEW: Generate token with master password verification flag
const generateMasterPasswordToken = (userId, originalToken) => {
  const decoded = jwt.verify(originalToken, process.env.JWT_SECRET, { ignoreExpiration: true });
  
  const newToken = jwt.sign(
    { 
      id: userId,
      masterPasswordVerified: true,
      originalExp: decoded.exp 
    }, 
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // Shorter expiry for master password sessions
  );
  
  return newToken;  
};

module.exports = { protect, requireMasterPassword, generateMasterPasswordToken };