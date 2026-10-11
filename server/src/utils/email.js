import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!transporter && env.EMAIL_USER && env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Sends or logs an email.
 * If EMAIL_USER is not provided, logs the email clearly to the console for testing.
 */
async function sendMail({ to, subject, html, text }) {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.log('\n================== [EMAIL SIMULATION (LOCAL DEV)] ==================');
    console.log(`To:      ${to}`);
    console.log(`From:    ${env.EMAIL_FROM}`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------- Plaintext ---------------------------');
    console.log(text);
    console.log('====================================================================\n');
    return { simulated: true, to, subject };
  }

  try {
    const info = await mailTransporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
    throw err;
  }
}

/**
 * Sends an email verification link to the customer.
 */
export async function sendVerificationEmail({ email, name, token }) {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = 'Verify your email address - Fouzas Creation';

  const text = `Hello ${name || 'Customer'},\n\nThank you for registering with Fouzas Creation!\n\nPlease verify your email address to enable order placement by visiting the link below:\n${verifyUrl}\n\nThis verification link will expire in 24 hours.\n\nIf you did not create an account, you can safely ignore this email.\n\nWarm regards,\nFouzas Creation Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; color: #2c2523; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #f2e8e3; padding: 36px 32px; box-shadow: 0 4px 16px rgba(184, 115, 115, 0.08); }
    .logo { font-size: 20px; font-weight: bold; color: #8c4a4a; margin-bottom: 24px; font-family: Georgia, serif; }
    .heading { font-size: 22px; font-weight: bold; color: #2c2523; margin-top: 0; margin-bottom: 16px; }
    .text { font-size: 14px; line-height: 1.6; color: #5c524f; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #be5a65; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 12px; margin-bottom: 24px; }
    .footer { font-size: 12px; color: #9c918e; border-top: 1px solid #f5ede8; pt-4; margin-top: 24px; padding-top: 16px; }
    .url { word-break: break-all; color: #be5a65; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Fouzas Creation</div>
    <h1 class="heading">Verify your email address</h1>
    <p class="text">Hello ${name || 'Customer'},</p>
    <p class="text">Thank you for creating an account with Fouzas Creation! Please confirm your email address so you can submit custom gift enquiries and track your orders seamlessly.</p>
    <div>
      <a href="${verifyUrl}" class="btn" target="_blank">Verify Email Address</a>
    </div>
    <p class="text" style="font-size: 12px; color: #887d7a;">
      If the button above does not work, copy and paste this link into your browser:<br>
      <a href="${verifyUrl}" class="url">${verifyUrl}</a>
    </p>
    <div class="footer">
      This link will expire in 24 hours. If you did not create an account, no further action is required.
    </div>
  </div>
</body>
</html>
  `;

  return sendMail({ to: email, subject, text, html });
}

/**
 * Sends a password reset link to the customer.
 */
export async function sendPasswordResetEmail({ email, name, token }) {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Reset your password - Fouzas Creation';

  const text = `Hello ${name || 'Customer'},\n\nWe received a request to reset your password for your Fouzas Creation account.\n\nPlease click the link below to set a new password:\n${resetUrl}\n\nThis reset link is valid for 1 hour. For your security, choosing a new password will automatically end any active sign-in sessions.\n\nIf you did not request a password reset, you can safely ignore this email.\n\nWarm regards,\nFouzas Creation Team`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; color: #2c2523; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #f2e8e3; padding: 36px 32px; box-shadow: 0 4px 16px rgba(184, 115, 115, 0.08); }
    .logo { font-size: 20px; font-weight: bold; color: #8c4a4a; margin-bottom: 24px; font-family: Georgia, serif; }
    .heading { font-size: 22px; font-weight: bold; color: #2c2523; margin-top: 0; margin-bottom: 16px; }
    .text { font-size: 14px; line-height: 1.6; color: #5c524f; margin-bottom: 24px; }
    .btn { display: inline-block; background-color: #be5a65; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 12px; margin-bottom: 24px; }
    .footer { font-size: 12px; color: #9c918e; border-top: 1px solid #f5ede8; pt-4; margin-top: 24px; padding-top: 16px; }
    .url { word-break: break-all; color: #be5a65; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Fouzas Creation</div>
    <h1 class="heading">Reset your password</h1>
    <p class="text">Hello ${name || 'Customer'},</p>
    <p class="text">We received a request to reset your password. Click the button below to choose a new password for your account:</p>
    <div>
      <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
    </div>
    <p class="text" style="font-size: 12px; color: #887d7a;">
      If the button above does not work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" class="url">${resetUrl}</a>
    </p>
    <div class="footer">
      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email; your existing password will remain unchanged.
    </div>
  </div>
</body>
</html>
  `;

  return sendMail({ to: email, subject, text, html });
}
