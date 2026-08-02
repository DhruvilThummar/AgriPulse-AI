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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AgriPulse OTP Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f5; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f5; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" maxWidth="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 32px rgba(1, 45, 29, 0.08); border: 1px solid #e1e8e4;">
                
                <!-- Top Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #012d1d 0%, #1b4332 100%); padding: 36px 32px; text-align: center;">
                    <div style="display: inline-block; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 20px; padding: 6px 14px; margin-bottom: 12px;">
                      <span style="color: #34d399; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">🔒 Account Verification</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">AgriPulse AI Verification Code</h1>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 32px 32px 24px;">
                    <h2 style="color: #012d1d; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">Hello ${displayName},</h2>
                    <p style="color: #414844; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                      Please use the following 6-digit One-Time Password (OTP) code to authenticate your AgriPulse AI account session. This code is valid for <strong>5 minutes</strong>.
                    </p>

                    <!-- Glowing OTP Code Box -->
                    <div style="font-size: 36px; font-weight: 900; text-align: center; margin: 28px 0; color: #012d1d; letter-spacing: 12px; padding: 18px; background: #f0fdf4; border-radius: 14px; border: 2px dashed #86efac; font-family: monospace;">
                      ${otpCode}
                    </div>

                    <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
                      If you did not request this verification code, please ignore this email or notify security@agripulse.ai.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8faf9; border-top: 1px solid #e1e8e4; padding: 20px 32px; text-align: center;">
                    <p style="color: #717973; font-size: 12px; margin: 0 0 4px 0; font-weight: 600;">
                      AgriPulse AI Security &amp; Identity Gateway
                    </p>
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                      Automated System Dispatch — Do Not Reply Directly
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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
