const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const PasswordEntry = require('../models/PasswordEntry');
const User = require('../models/User');
const { checkPasswordStrength, generatePassword } = require('../utils/validation');
const { generateEncryptionKey, encrypt, decrypt } = require('../utils/encryption');
const { sendPasswordAccessedEmail, sendPasswordUpdatedEmail } = require('../utils/emailService');
const { getClientIp } = require('../utils/helpers');

// All routes require authentication
router.use(protect);

// @route   GET /api/passwords
// @desc    Get all passwords for user
router.get('/', async (req, res) => {
  try {
    const passwords = await PasswordEntry.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('-encryptedPassword -iv');

    res.json({
      success: true,
      count: passwords.length,
      data: passwords
    });

  } catch (error) {
    console.error('Get passwords error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching passwords' 
    });
  }
});

// @route   GET /api/passwords/stats
// @desc    Get password statistics
router.get('/stats', async (req, res) => {
  try {
    const passwords = await PasswordEntry.find({ userId: req.user.id });
    
    const stats = {
      total: passwords.length,
      weak: passwords.filter(p => p.isWeak).length,
      strong: passwords.filter(p => p.strengthScore >= 3).length,
      averageStrength: passwords.reduce((sum, p) => sum + p.strengthScore, 0) / passwords.length || 0,
      recentlyAdded: passwords.filter(p => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return p.createdAt > sevenDaysAgo;
      }).length,
      recentlyAccessed: passwords.filter(p => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return p.lastAccessed > thirtyDaysAgo;
      }).length
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error fetching stats' 
    });
  }
});

// @route   POST /api/passwords
// @desc    Create new password entry
router.post('/', async (req, res) => {
  try {
    const { site, username, password, masterPassword, skipWarning = false } = req.body;

    // Validation
    if (!site || !username || !password || !masterPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    // Check password strength
    const strength = checkPasswordStrength(password);
    
    // Check if password is weak and user hasn't chosen to skip warning
    if (strength.score < 2 && !skipWarning) {
      return res.status(422).json({
        success: false,
        message: 'Password is weak',
        strength: strength,
        requiresConfirmation: true,
        warning: 'This password is weak. Are you sure you want to save it?'
      });
    }
    
    // Generate encryption key from master password
    const encryptionKey = generateEncryptionKey(masterPassword);
    
    // Encrypt the password
    const encrypted = encrypt(password, encryptionKey);

    // Create password entry
    const passwordEntry = await PasswordEntry.create({
      userId: req.user.id,
      site,
      username,
      encryptedPassword: encrypted.encryptedData,
      iv: encrypted.iv,
      strengthScore: strength.score,
      isWeak: strength.score < 2
    });

    res.status(201).json({
      success: true,
      message: 'Password saved successfully',
      data: {
        id: passwordEntry._id,
        site: passwordEntry.site,
        username: passwordEntry.username,
        strengthScore: passwordEntry.strengthScore,
        isWeak: passwordEntry.isWeak,
        createdAt: passwordEntry.createdAt
      }
    });

  } catch (error) {
    console.error('Create password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error creating password' 
    });
  }
});

// @route   POST /api/passwords/bulk
// @desc    Create multiple password entries
router.post('/bulk', async (req, res) => {
  try {
    const { passwords, masterPassword } = req.body;

    if (!passwords || !Array.isArray(passwords) || !masterPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request format' 
      });
    }

    const encryptionKey = generateEncryptionKey(masterPassword);
    const savedPasswords = [];
    const weakPasswords = [];

    for (const item of passwords) {
      const { site, username, password } = item;
      
      if (!site || !username || !password) continue;

      const strength = checkPasswordStrength(password);
      const encrypted = encrypt(password, encryptionKey);

      const passwordEntry = await PasswordEntry.create({
        userId: req.user.id,
        site,
        username,
        encryptedPassword: encrypted.encryptedData,
        iv: encrypted.iv,
        strengthScore: strength.score,
        isWeak: strength.score < 2
      });

      savedPasswords.push(passwordEntry);
      
      if (strength.score < 2) {
        weakPasswords.push({
          site,
          strength: strength.label
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `${savedPasswords.length} passwords saved successfully`,
      count: savedPasswords.length,
      weakCount: weakPasswords.length,
      weakPasswords: weakPasswords.length > 0 ? weakPasswords : undefined
    });

  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error saving passwords' 
    });
  }
});

// @route   GET /api/passwords/generate
// @desc    Generate random password
router.get('/generate', (req, res) => {
  try {
    const { length = 16, uppercase = true, lowercase = true, numbers = true, symbols = true } = req.query;

    const password = generatePassword(parseInt(length), {
      uppercase: uppercase === 'true',
      lowercase: lowercase === 'true',
      numbers: numbers === 'true',
      symbols: symbols === 'true'
    });

    const strength = checkPasswordStrength(password);

    res.json({
      success: true,
      password,
      strength
    });

  } catch (error) {
    console.error('Generate password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error generating password' 
    });
  }
});

// @route   POST /api/passwords/:id/decrypt
// @desc    Decrypt and get password (requires master password)
router.post('/:id/decrypt', async (req, res) => {
  try {
    const { masterPassword } = req.body;
    const { id } = req.params;
    const ipAddress = getClientIp(req);

    if (!masterPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Master password is required' 
      });
    }

    // Find password entry
    const passwordEntry = await PasswordEntry.findOne({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!passwordEntry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Password not found' 
      });
    }

    // Generate encryption key
    const encryptionKey = generateEncryptionKey(masterPassword);
    
    // Decrypt password
    const decryptedPassword = decrypt(
      passwordEntry.encryptedPassword,
      passwordEntry.iv,
      encryptionKey
    );

    // Update last accessed time
    passwordEntry.lastAccessed = Date.now();
    await passwordEntry.save();

    // Get user to check notification preferences
    const user = await User.findById(req.user.id);

    // Send email notification if enabled
    if (user.emailNotifications?.passwordViewed) {
      await sendPasswordAccessedEmail(
        user.email,
        passwordEntry.site,
        passwordEntry.username,
        'Viewed',
        ipAddress
      );
    }

    res.json({
      success: true,
      data: {
        site: passwordEntry.site,
        username: passwordEntry.username,
        password: decryptedPassword,
        strengthScore: passwordEntry.strengthScore,
        lastAccessed: passwordEntry.lastAccessed
      },
      notificationSent: user.emailNotifications?.passwordViewed || false
    });

  } catch (error) {
    console.error('Decrypt password error:', error);
    
    if (error.message.includes('bad decrypt')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid master password' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error decrypting password' 
    });
  }
});

// @route   POST /api/passwords/:id/copy
// @desc    Copy password and send notification
router.post('/:id/copy', async (req, res) => {
  try {
    const { masterPassword } = req.body;
    const { id } = req.params;
    const ipAddress = getClientIp(req);

    if (!masterPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Master password is required' 
      });
    }

    // Find password entry
    const passwordEntry = await PasswordEntry.findOne({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!passwordEntry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Password not found' 
      });
    }

    // Generate encryption key
    const encryptionKey = generateEncryptionKey(masterPassword);
    
    // Decrypt password
    const decryptedPassword = decrypt(
      passwordEntry.encryptedPassword,
      passwordEntry.iv,
      encryptionKey
    );

    // Update last accessed time
    passwordEntry.lastAccessed = Date.now();
    await passwordEntry.save();

    // Get user to check notification preferences
    const user = await User.findById(req.user.id);

    // Send email notification if enabled
    if (user.emailNotifications?.passwordCopied) {
      await sendPasswordAccessedEmail(
        user.email,
        passwordEntry.site,
        passwordEntry.username,
        'Copied',
        ipAddress
      );
    }

    res.json({
      success: true,
      message: 'Password ready to copy',
      data: {
        site: passwordEntry.site,
        username: passwordEntry.username,
        password: decryptedPassword,
        strengthScore: passwordEntry.strengthScore,
        lastAccessed: passwordEntry.lastAccessed
      },
      notificationSent: user.emailNotifications?.passwordCopied || false
    });

  } catch (error) {
    console.error('Copy password error:', error);
    
    if (error.message.includes('bad decrypt')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid master password' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error copying password' 
    });
  }
});

// @route   PUT /api/passwords/:id
// @desc    Update password entry
router.put('/:id', async (req, res) => {
  try {
    const { site, username, password, masterPassword, skipWarning = false } = req.body;
    const { id } = req.params;
    const ipAddress = getClientIp(req);

    // Find password entry
    const passwordEntry = await PasswordEntry.findOne({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!passwordEntry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Password not found' 
      });
    }

    // Track changes for notification
    const changes = {
      site: site && site !== passwordEntry.site,
      username: username && username !== passwordEntry.username,
      password: !!password
    };

    // Check password strength if updating password
    let strength = passwordEntry.strengthScore;
    if (password && !skipWarning) {
      strength = checkPasswordStrength(password);
      
      if (strength.score < 2) {
        return res.status(422).json({
          success: false,
          message: 'Password is weak',
          strength: strength,
          requiresConfirmation: true,
          warning: 'This password is weak. Are you sure you want to update it?'
        });
      }
    }

    // Update fields
    if (site) passwordEntry.site = site;
    if (username) passwordEntry.username = username;

    // If password is being updated
    if (password && masterPassword) {
      const encryptionKey = generateEncryptionKey(masterPassword);
      const encrypted = encrypt(password, encryptionKey);
      
      passwordEntry.encryptedPassword = encrypted.encryptedData;
      passwordEntry.iv = encrypted.iv;
      passwordEntry.strengthScore = strength.score || passwordEntry.strengthScore;
      passwordEntry.isWeak = (strength.score || passwordEntry.strengthScore) < 2;
    }

    await passwordEntry.save();

    // Get user to check notification preferences
    const user = await User.findById(req.user.id);

    // Send email notification if enabled and changes were made
    if (Object.values(changes).some(change => change) && user.emailNotifications?.securityAlerts) {
      await sendPasswordUpdatedEmail(
        user.email,
        passwordEntry.site,
        passwordEntry.username,
        changes,
        ipAddress
      );
    }

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: passwordEntry,
      changes,
      notificationSent: user.emailNotifications?.securityAlerts || false
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating password' 
    });
  }
});

// @route   PUT /api/passwords/:id/favorite
// @desc    Toggle favorite status
router.put('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;

    const passwordEntry = await PasswordEntry.findOne({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!passwordEntry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Password not found' 
      });
    }

    passwordEntry.isFavorite = !passwordEntry.isFavorite;
    await passwordEntry.save();

    res.json({
      success: true,
      message: passwordEntry.isFavorite ? 'Added to favorites' : 'Removed from favorites',
      isFavorite: passwordEntry.isFavorite
    });

  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error updating favorite status' 
    });
  }
});

// @route   DELETE /api/passwords/:id
// @desc    Delete password entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const passwordEntry = await PasswordEntry.findOneAndDelete({ 
      _id: id, 
      userId: req.user.id 
    });

    if (!passwordEntry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Password not found' 
      });
    }

    res.json({
      success: true,
      message: 'Password deleted successfully',
      deletedPassword: {
        site: passwordEntry.site,
        username: passwordEntry.username,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Delete password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting password' 
    });
  }
});

// @route   POST /api/passwords/check-weak
// @desc    Check for weak passwords
router.post('/check-weak', async (req, res) => {
  try {
    const passwords = await PasswordEntry.find({ 
      userId: req.user.id,
      isWeak: true 
    }).select('site username strengthScore');

    res.json({
      success: true,
      count: passwords.length,
      weakPasswords: passwords,
      recommendations: passwords.length > 0 ? [
        'Consider updating weak passwords for better security',
        'Use the password generator to create strong passwords',
        'Avoid using the same password across multiple sites'
      ] : []
    });

  } catch (error) {
    console.error('Check weak passwords error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error checking weak passwords' 
    });
  }
});

// @route   POST /api/passwords/check-duplicates
// @desc    Check for duplicate passwords
router.post('/check-duplicates', async (req, res) => {
  try {
    const { masterPassword } = req.body;

    if (!masterPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Master password is required' 
      });
    }

    const passwords = await PasswordEntry.find({ userId: req.user.id });
    const encryptionKey = generateEncryptionKey(masterPassword);
    
    const decryptedPasswords = [];
    const duplicates = {};

    // Decrypt all passwords
    for (const entry of passwords) {
      try {
        const decrypted = decrypt(
          entry.encryptedPassword,
          entry.iv,
          encryptionKey
        );
        
        decryptedPasswords.push({
          id: entry._id,
          site: entry.site,
          username: entry.username,
          password: decrypted
        });
      } catch (error) {
        // Skip if decryption fails
        continue;
      }
    }

    // Find duplicates
    decryptedPasswords.forEach(entry => {
      if (!duplicates[entry.password]) {
        duplicates[entry.password] = [];
      }
      duplicates[entry.password].push({
        site: entry.site,
        username: entry.username,
        id: entry.id
      });
    });

    // Filter to only passwords used multiple times
    const duplicateEntries = Object.entries(duplicates)
      .filter(([_, entries]) => entries.length > 1)
      .map(([password, entries]) => ({
        password: '•'.repeat(password.length), // Don't expose actual password
        count: entries.length,
        entries
      }));

    res.json({
      success: true,
      duplicates: duplicateEntries,
      totalUnique: Object.keys(duplicates).length,
      duplicateCount: duplicateEntries.length
    });

  } catch (error) {
    console.error('Check duplicates error:', error);
    
    if (error.message.includes('bad decrypt')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid master password' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error checking duplicates' 
    });
  }
});

// @route   POST /api/passwords/export
// @desc    Export passwords (requires master password)
router.post('/export', async (req, res) => {
  try {
    const { masterPassword, format = 'json' } = req.body;

    if (!masterPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Master password is required' 
      });
    }

    const passwords = await PasswordEntry.find({ userId: req.user.id });
    const encryptionKey = generateEncryptionKey(masterPassword);
    
    const decryptedData = [];

    // Decrypt all passwords
    for (const entry of passwords) {
      try {
        const decrypted = decrypt(
          entry.encryptedPassword,
          entry.iv,
          encryptionKey
        );
        
        decryptedData.push({
          site: entry.site,
          username: entry.username,
          password: decrypted,
          strength: entry.strengthScore,
          created: entry.createdAt,
          lastAccessed: entry.lastAccessed
        });
      } catch (error) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid master password' 
        });
      }
    }

    let exportData;
    let contentType;
    let filename;

    if (format === 'csv') {
      const csv = [
        ['Site', 'Username', 'Password', 'Strength', 'Created', 'Last Accessed'],
        ...decryptedData.map(item => [
          item.site,
          item.username,
          item.password,
          item.strength,
          item.created.toISOString(),
          item.lastAccessed.toISOString()
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      exportData = csv;
      contentType = 'text/csv';
      filename = `passwords_export_${Date.now()}.csv`;
    } else {
      exportData = JSON.stringify(decryptedData, null, 2);
      contentType = 'application/json';
      filename = `passwords_export_${Date.now()}.json`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error exporting passwords' 
    });
  }
});

// @route   POST /api/passwords/import
// @desc    Import passwords
router.post('/import', async (req, res) => {
  try {
    const { passwords, masterPassword, format = 'json' } = req.body;

    if (!passwords || !masterPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request format' 
      });
    }

    let importData;
    
    if (format === 'csv' && typeof passwords === 'string') {
      const rows = passwords.split('\n').map(row => row.split(',').map(cell => cell.replace(/^"|"$/g, '')));
      const headers = rows[0];
      importData = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header.toLowerCase().replace(' ', '_')] = row[index];
        });
        return obj;
      });
    } else if (format === 'json') {
      importData = Array.isArray(passwords) ? passwords : JSON.parse(passwords);
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Unsupported format' 
      });
    }

    const encryptionKey = generateEncryptionKey(masterPassword);
    const savedCount = 0;
    const skippedCount = 0;

    for (const item of importData) {
      try {
        const { site, username, password } = item;
        
        if (!site || !username || !password) {
          skippedCount++;
          continue;
        }

        const strength = checkPasswordStrength(password);
        const encrypted = encrypt(password, encryptionKey);

        await PasswordEntry.create({
          userId: req.user.id,
          site,
          username,
          encryptedPassword: encrypted.encryptedData,
          iv: encrypted.iv,
          strengthScore: strength.score,
          isWeak: strength.score < 2
        });

        savedCount++;
      } catch (error) {
        skippedCount++;
        console.error('Import item error:', error);
      }
    }

    res.json({
      success: true,
      message: `Import completed: ${savedCount} saved, ${skippedCount} skipped`,
      savedCount,
      skippedCount
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error importing passwords' 
    });
  }
});

module.exports = router;