const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send OTP Email
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"PassOP Security" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Your PassOP Security OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">PassOP Security</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #111827;">Account Security Verification</h2>
            <p style="color: #4b5563; font-size: 16px;">
              You've requested to unlock your account. Please use the following OTP to verify your identity:
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <div style="display: inline-block; background: white; padding: 20px 40px; border-radius: 10px; border: 2px dashed #10b981;">
                <h1 style="color: #111827; letter-spacing: 10px; font-size: 36px; margin: 0;">${otp}</h1>
              </div>
            </div>
            <p style="color: #4b5563; font-size: 14px;">
              This OTP will expire in 10 minutes. If you didn't request this, please ignore this email or contact support.
            </p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p>This is an automated message from PassOP Password Manager.</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send Password Accessed Notification
const sendPasswordAccessedEmail = async (email, site, username, action, ipAddress) => {
  try {
    const currentTime = new Date().toLocaleString();
    
    const mailOptions = {
      from: `"PassOP Security" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `Password ${action} Notification - ${site}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔒 PassOP Security Alert</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #111827;">Password ${action}</h2>
            <p style="color: #4b5563; font-size: 16px;">
              Your password for <strong>${site}</strong> was ${action.toLowerCase()} at ${currentTime}.
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #111827; margin-top: 0;">Activity Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Website/App:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${site}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Username:</td>
                  <td style="padding: 8px 0;">${username}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Action:</td>
                  <td style="padding: 8px 0;">
                    <span style="background-color: ${action === 'Viewed' ? '#fef3c7' : '#d1fae5'}; 
                               color: ${action === 'Viewed' ? '#92400e' : '#065f46'};
                               padding: 4px 12px; border-radius: 20px; font-size: 12px;">
                      ${action}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Time:</td>
                  <td style="padding: 8px 0;">${currentTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">IP Address:</td>
                  <td style="padding: 8px 0;">${ipAddress || 'Not available'}</td>
                </tr>
              </table>
            </div>
            
            ${action === 'Copied' ? `
            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0;">⚠️ Security Notice</h4>
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                Your password has been copied to clipboard. Please ensure you're on a trusted device and clear clipboard after use.
              </p>
            </div>
            ` : ''}
            
            <p style="color: #4b5563; font-size: 14px;">
              If you didn't perform this action, please:
            </p>
            <ol style="color: #4b5563; font-size: 14px; padding-left: 20px;">
              <li>Change your master password immediately</li>
              <li>Review your account activity</li>
              <li>Contact support if you suspect unauthorized access</li>
            </ol>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <a href="http://localhost:5173/dashboard" 
                 style="display: inline-block; background-color: #10b981; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                        font-weight: bold;">
                Review Account Activity
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p>This is an automated security notification from PassOP Password Manager.</p>
              <p>You can manage notification preferences in your account settings.</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Notification email error:', error);
    return { success: false, error: error.message };
  }
};

// Send Failed Login Attempt Email
const sendFailedLoginEmail = async (email, failedAttempts, ipAddress) => {
  try {
    const mailOptions = {
      from: `"PassOP Security" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Suspicious Login Attempts Detected',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">⚠️ Security Alert</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #111827;">Multiple Failed Login Attempts</h2>
            <p style="color: #4b5563; font-size: 16px;">
              We detected ${failedAttempts} failed login attempts on your PassOP account.
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #111827; margin-top: 0;">Security Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Failed Attempts:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #ef4444;">${failedAttempts}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">IP Address:</td>
                  <td style="padding: 8px 0;">${ipAddress || 'Not available'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Time:</td>
                  <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #991b1b; margin: 0 0 10px 0;">❗ Immediate Action Required</h4>
              <p style="color: #991b1b; font-size: 14px; margin: 0;">
                After 5 failed attempts, your account will be temporarily locked for security.
              </p>
            </div>
            
            <p style="color: #4b5563; font-size: 14px;">
              <strong>If this was you:</strong> You can ignore this email or reset your password if you've forgotten it.
            </p>
            <p style="color: #4b5563; font-size: 14px;">
              <strong>If this wasn't you:</strong> Please change your password immediately and review your account security.
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <a href="http://localhost:5173/login" 
                 style="display: inline-block; background-color: #10b981; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                        font-weight: bold; margin-right: 10px;">
                Go to Login
              </a>
              <a href="http://localhost:5173/reset-password" 
                 style="display: inline-block; background-color: #ef4444; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                        font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p>This is an automated security notification from PassOP Password Manager.</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Failed login email error:', error);
    return { success: false, error: error.message };
  }
};


// Add this function to emailService.js
const sendWelcomeEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: `"PassOP Team" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Welcome to PassOP - Your Secure Password Manager',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🎉 Welcome to PassOP!</h1>
          </div>
          <div style="padding: 30px; background-color: #f9fafb;">
            <h2 style="color: #111827;">Hello ${name},</h2>
            <p style="color: #4b5563; font-size: 16px;">
              Thank you for creating your PassOP account. Your journey to secure password management starts now!
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="color: #111827; margin-top: 0;">Getting Started:</h3>
              <ol style="color: #4b5563; font-size: 14px; padding-left: 20px;">
                <li>Add your first password using the "Add Password" button</li>
                <li>Use the password generator for strong passwords</li>
                <li>Enable email notifications in your account settings</li>
                <li>Remember your master password - it encrypts all your data</li>
              </ol>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <a href="http://localhost:5173/dashboard" 
                 style="display: inline-block; background-color: #10b981; color: white; 
                        padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                        font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p>This is an automated welcome email from PassOP Password Manager.</p>
              <p>If you didn't create this account, please contact support immediately.</p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false, error: error.message };
  }
};



module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordAccessedEmail,
  sendFailedLoginEmail,
  sendWelcomeEmail
};