const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailSender {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: `"FinMate" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { messageId: info.messageId, to, subject });
      return true;
    } catch (error) {
      logger.error('Failed to send email', { error: error.message, to, subject });
      return false;
    }
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to FinMate!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Welcome to FinMate, ${user.first_name}!</h2>
        <p>Your account has been successfully created.</p>
        <p>You can now start managing your finances with our powerful tools.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL}/auth/login" 
             style="background-color: #667eea; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Get Started
          </a>
        </div>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user, resetToken) {
    const subject = 'Password Reset Request - FinMate';
    const resetLink = `${process.env.APP_URL}/auth/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #667eea; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendExpenseNotification(user, expense) {
    const subject = 'Expense Status Update - FinMate';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Expense Status Updated</h2>
        <p>Your expense submission has been <strong>${expense.status}</strong>.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Amount:</strong> $${expense.amount}</p>
          <p><strong>Description:</strong> ${expense.description}</p>
          <p><strong>Category:</strong> ${expense.category}</p>
          <p><strong>Date:</strong> ${new Date(expense.date).toLocaleDateString()}</p>
        </div>
        <p>You can view the details in your FinMate dashboard.</p>
      </div>
    `;

    return await this.sendEmail(user.email, subject, html);
  }
}

module.exports = new EmailSender();