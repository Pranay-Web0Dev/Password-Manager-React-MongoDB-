const crypto = require('crypto');

// Generate encryption key from master password
const generateEncryptionKey = (masterPassword) => {
  return crypto.createHash('sha256').update(masterPassword).digest('hex').substring(0, 32);
};

// Encrypt data
const encrypt = (text, encryptionKey) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex')
  };
};

// Decrypt data
const decrypt = (encryptedData, iv, encryptionKey) => {
  const ivBuffer = Buffer.from(iv, 'hex');
  const encryptedText = Buffer.from(encryptedData, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), ivBuffer);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = {
  generateEncryptionKey,
  encrypt,
  decrypt
};