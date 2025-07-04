const nodemailer = require("nodemailer");
const logger = require("../utils/logger");

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    // Configure based on environment
    if (process.env.NODE_ENV === "production") {
      // Production email configuration (using real SMTP)
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    } else {
      // Development - using Ethereal Email (fake SMTP)
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: {
          user: "ethereal.user@ethereal.email",
          pass: "ethereal.pass",
        },
      });
    }
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || "Billing App <noreply@billingapp.com>",
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      if (process.env.NODE_ENV !== "production") {
        console.log(
          "Email sent - Preview URL:",
          nodemailer.getTestMessageUrl(info)
        );
      }

      logger.info("Email sent successfully", {
        to: options.email,
        subject: options.subject,
        messageId: info.messageId,
      });

      return info;
    } catch (error) {
      logger.error("Failed to send email", {
        error: error.message,
        to: options.email,
        subject: options.subject,
      });
      throw new Error("Email could not be sent");
    }
  }

  async sendVerificationEmail(email, token) {
    const verificationURL = `${
      process.env.VITE_FRONTEND_URL || "http://localhost:5173"
    }/verify-email/${token}`;

    const message = `
      Welcome to Billing App!

      Please click the link below to verify your email address:
      ${verificationURL}

      This link will expire in 24 hours.

      If you didn't create an account with us, please ignore this email.
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Billing App!</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for creating an account with us. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${verificationURL}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${verificationURL}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Billing App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      email,
      subject: "Please verify your email address",
      message,
      html,
    });
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetURL = `${process.env.VITE_FRONTEND_URL || "http://localhost:5173"}/auth/reset-password/${resetToken}`;

    const message = `
      Forgot your password?

      Click the link below to reset your password:
      ${resetURL}

      This link will expire in 10 minutes.

      If you didn't request this, please ignore this email.
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>You have requested to reset your password.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetURL}" class="button">Reset Password</a>
            <p>This link will expire in 10 minutes.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Billing App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      email,
      subject: "Password Reset Request",
      message,
      html,
    });
  }

  async sendPasswordChangeNotification(email) {
    const message = `
      Password Changed Successfully

      This email confirms that your password has been changed successfully.

      If you didn't make this change, please contact our support team immediately.

      For security, you have been logged out of all devices and will need to log in again.
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Changed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed Successfully</h1>
          </div>
          <div class="content">
            <div class="success">
              <p><strong>✅ Your password has been changed successfully.</strong></p>
            </div>
            <p>This email confirms that your account password has been updated.</p>
            <p>For security purposes, you have been logged out of all devices and will need to log in again with your new password.</p>
            <p><strong>If you didn't make this change, please contact our support team immediately.</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 Billing App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      email,
      subject: "Password Changed Successfully",
      message,
      html,
    });
  }
}

module.exports = new EmailService();
