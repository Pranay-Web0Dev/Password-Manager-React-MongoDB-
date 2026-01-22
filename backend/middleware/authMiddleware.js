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

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password -masterPassword');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
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

const requireMasterPassword = (req, res, next) => {
  if (!req.session || !req.session.masterPasswordVerified) {
    return res.status(403).json({ 
      success: false, 
      message: 'Master password verification required' 
    });
  }
  next();
};

module.exports = { protect, requireMasterPassword };