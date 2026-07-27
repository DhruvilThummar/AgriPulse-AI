/**
 * ════════════════════════════════════════════════════════════
 * FILE: nodemailer.js
 * WHERE IT IS: node-auth-backend/src/config/nodemailer.js
 * WHAT IT DOES: Sets up the email sending system (SMTP transporter)
 *               and provides the `sendOtpEmail()` function that
 *               sends the 6-digit verification OTP to users.
 * WHEN IT RUNS: Loaded at startup. sendOtpEmail() is called during
 *               signup and login (for unverified users).
 * HOW IT WORKS:
 *   - If SMTP credentials are set in .env → sends real emails via SMTP.
 *   - If NOT set → prints the OTP to the console (dev/test mode).
 * ════════════════════════════════════════════════════════════
 */

// nodemailer: A popular Node.js library for sending emails via SMTP.
// SMTP = Simple Mail Transfer Protocol — the standard for sending emails.
// It works with Gmail, Outlook, SendGrid, Mailgun, and any custom mail server.
const nodemailer = require('nodemailer');

// transporter: Holds the active email sending connection.
// Starts as null — is assigned when SMTP credentials are available in .env.
// If null → app falls back to console logging the OTP (useful during development).
let transporter = null;

// ── SMTP Transporter Setup ──
// Only creates the transporter if all 3 required SMTP settings are present in .env:
//   SMTP_HOST → e.g. "smtp.gmail.com"
//   SMTP_USER → e.g. "youremail@gmail.com"
//   SMTP_PASS → Your email password or app password
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {

  // nodemailer.createTransport(config): Creates a reusable email connection.
  // This does NOT send any email yet — it just sets up the "pipe" to the mail server.
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,  // SMTP server hostname (e.g. "smtp.gmail.com")

    // SMTP_PORT: Usually 587 (TLS/STARTTLS) or 465 (SSL).
    // parseInt(..., 10): Converts the string from .env to a number (base 10).
    port: parseInt(process.env.SMTP_PORT, 10) || 587,

    // secure: true means use SSL (port 465). false means use STARTTLS (port 587).
    // Only true when SMTP_PORT is exactly "465".
    secure: process.env.SMTP_PORT === '465',

    // auth: The login credentials for your email account.
    auth: {
      user: process.env.SMTP_USER,  // Your email address
      pass: process.env.SMTP_PASS   // Your email password or Gmail App Password
    }
  });

  console.log('>>> Mail Transporter configured successfully <<<');
}


/**
 * FUNCTION: sendOtpEmail
 * TYPE: Async function (network operation — sends an email)
 * WHAT IT DOES: Sends a styled HTML email containing the 6-digit OTP code to the user.
 * WHEN TO USE: Called in authRoutes.js after a user registers or requests a new OTP.
 * HOW TO USE: await sendOtpEmail('user@email.com', '847291')
 * PARAMETERS:
 *   email   → The recipient's email address (where the OTP will be sent)
 *   otpCode → The 6-digit verification code to include in the email
 *   name    → Optional recipient name for personalized greeting
 * RETURNS: { success: true } on success, { success: false, error: '...' } on failure
 */
const sendOtpEmail = async (email, otpCode, name = '') => {

  // Format recipient display name
  const displayName = name ? name.trim() : email.split('@')[0];

  // Format sender name and email
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@agripulse.ai';
  const formattedFrom = fromEmail.includes('<') ? fromEmail : `"AgriPulse AI" <${fromEmail}>`;

  // ── Build the Email Content ──
  // mailOptions: The full configuration for the email to be sent.
  const mailOptions = {
    // from: The sender name "AgriPulse AI" and email address shown in the recipient's inbox
    from: formattedFrom,

    // to: The recipient's email address (the user who just registered)
    to: email,

    // subject: The subject line of the email
    subject: `AgriPulse AI — Verification Code for ${displayName}`,

    // html: The email body as HTML markup.
    // Using a template literal (`...`) so we can embed the otpCode and displayName variables directly.
    // The styling is inline CSS — email clients don't support external CSS files.
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #059669; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">AgriPulse AI</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Smarter Commodity Trading</p>
        </div>
        <p style="color: #334155; font-size: 16px; line-height: 1.5; font-weight: 600;">Hello ${displayName},</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">Thank you for signing up for AgriPulse AI. Please use the following 6-digit One-Time Password (OTP) to verify your account. This code is valid for 5 minutes.</p>
        <div style="font-size: 32px; font-weight: 800; text-align: center; margin: 36px 0; color: #0f172a; letter-spacing: 8px; padding: 12px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
          ${otpCode}
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.5;">If you did not request this verification, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 28px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">This is an automated message, please do not reply directly.</p>
      </div>
    `
  };

  // ── Attempt to Send the Email ──
  if (transporter) {
    // transporter is configured → actually send the email via SMTP
    try {
      // transporter.sendMail(options): Sends the email.
      // This is an async operation — it connects to the mail server and delivers the message.
      await transporter.sendMail(mailOptions);
      console.log(`Verification OTP email sent to ${email}`);
      return { success: true };

    } catch (error) {
      // Email sending failed (wrong credentials, network issue, rate limit, etc.)
      console.error(`Error sending email to ${email}:`, error);

      // Fallback: Print the OTP code directly to the server console.
      // This allows developers to still test the flow even when email fails.
      console.log(`\n======================================\n[FALLBACK] Email sending failed. Here is the verification code:\nTo: ${email}\nOTP Code: ${otpCode}\n======================================\n`);
      return { success: false, error: error.message };
    }

  } else {
    // ── DEV MODE: No SMTP configured ──
    // If SMTP credentials are not in .env → just print the OTP to the terminal.
    // This makes local development easy — no email setup needed.
    // Just look at the server console output to find the OTP code.
    console.log(`\n======================================\n[DEV MODE] SMTP not configured. Here is the verification code:\nTo: ${email}\nOTP Code: ${otpCode}\n======================================\n`);
    return { success: true, devMode: true };  // devMode: true signals the caller this was a console fallback
  }
};

// Export only sendOtpEmail — transporter is an internal detail, not needed outside this file.
module.exports = { sendOtpEmail };
