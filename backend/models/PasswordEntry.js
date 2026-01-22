const mongoose = require('mongoose');
const crypto = require('crypto');

const PasswordEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  site: {
    type: String,
    required: [true, 'Please provide site name'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Please provide username'],
    trim: true
  },
  // Encrypted password
  encryptedPassword: {
    type: String,
    required: true
  },
  // Password strength score (0-4)
  strengthScore: {
    type: Number,
    min: 0,
    max: 4,
    default: 0
  },
  // IV for encryption
  iv: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  isWeak: {
    type: Boolean,
    default: false
  }
});

// Method to encrypt password
PasswordEntrySchema.methods.encryptPassword = function(password, encryptionKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
  let encrypted = cipher.update(password);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex')
  };
};

// Method to decrypt password
PasswordEntrySchema.methods.decryptPassword = function(encryptionKey) {
  const iv = Buffer.from(this.iv, 'hex');
  const encryptedText = Buffer.from(this.encryptedPassword, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = mongoose.model('PasswordEntry', PasswordEntrySchema);