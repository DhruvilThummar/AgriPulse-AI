/**
 * ════════════════════════════════════════════════════════════
 * FILE: subscribeRoutes.js
 * WHERE IT IS: node-auth-backend/src/routes/subscribeRoutes.js
 * WHAT IT DOES: Handles the newsletter / market alert subscription endpoint.
 *   POST /api/subscribe → Sends a styled confirmation email to the subscriber.
 * WHEN TO USE: Called when a user submits their email on the Subscribe section.
 * HOW IT WORKS:
 *   1. Reads the subscriber's email from the request body.
 *   2. Creates a Nodemailer transporter (real SMTP or Ethereal test fallback).
 *   3. Sends a styled HTML confirmation email.
 *   4. Returns success + a preview URL (when using Ethereal test transport).
 * NOTE: Unlike auth emails (config/nodemailer.js), this uses its own transporter
 *       factory with a separate email account (EMAIL_USER / EMAIL_PASS in .env).
 * ════════════════════════════════════════════════════════════
 */

// express: Web framework — Router() creates a mini-app for this group of routes
const express = require('express');

// router: Sub-router that handles only the /api/subscribe/* routes
const router = express.Router();

// nodemailer: Email sending library — same library used in config/nodemailer.js
// but configured separately here with potentially different credentials
const nodemailer = require('nodemailer');

/**
 * FUNCTION: createTransporter
 * TYPE: Async factory function — creates and returns a Nodemailer transport object.
 * WHAT IT DOES: Builds an SMTP transporter using environment variables.
 *               If EMAIL_USER and EMAIL_PASS are set → uses real SMTP (e.g. Gmail).
 *               If NOT set → creates a temporary Ethereal test account automatically.
 * WHY ETHEREAL: Ethereal (https://ethereal.email) is a fake SMTP server for testing.
 *               Emails are "sent" but never actually delivered — you can view them
 *               via a preview URL returned in the response. Perfect for development.
 * RETURNS: A configured Nodemailer transporter object ready to call .sendMail() on.
 */
const createTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // ── Real SMTP Mode ──
    // Use the email credentials from .env to send actual emails.
    // EMAIL_SERVICE: The email provider (e.g. "gmail", "outlook", "yahoo").
    //                Nodemailer knows how to configure popular services automatically.
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',  // Defaults to Gmail if not specified
      auth: {
        user: process.env.EMAIL_USER,  // Your email address (e.g. "myapp@gmail.com")
        pass: process.env.EMAIL_PASS,  // Your email password or Gmail App Password
      },
    });
  } else {
    // ── Ethereal Test Mode ──
    // No real SMTP credentials → use a free test account from Ethereal.
    // nodemailer.createTestAccount(): Makes a real HTTP request to ethereal.email
    //   and returns a temporary { user, pass } pair for a disposable inbox.
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,      // Standard TLS port
      secure: false,  // false = use STARTTLS (not SSL)
      auth: {
        user: testAccount.user,  // Auto-generated temporary username
        pass: testAccount.pass   // Auto-generated temporary password
      },
    });
  }
};


// ════════════════════════════════════════════════════════════
// ROUTE: POST /api/subscribe
// ACCESS: Public (no login required)
// WHAT IT DOES: Sends a subscription confirmation email to the provided address.
// BODY: { email: "user@example.com" }
// RETURNS: { success: true, message: "...", previewUrl: "..." }
//   previewUrl is only populated when using Ethereal test transport.
// ════════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  // Extract the name and email from the JSON request body
  const { name, email } = req.body;

  // Validate: email must be provided
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  // Format recipient display name
  const recipientName = name ? name.trim() : email.split('@')[0];

  try {
    // Create a fresh transporter (real SMTP or Ethereal test depending on .env)
    const transporter = await createTransporter();

    // Format sender name and address
    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_USER || 'alerts@agripulse.ai';
    const formattedFrom = fromAddress.includes('<') ? fromAddress : `"AgriPulse AI" <${fromAddress}>`;

    // ── Build the Confirmation Email ──
    const mailOptions = {
      // from: The sender label "AgriPulse AI" and email shown in recipient's inbox
      from: formattedFrom,

      // to: The subscriber's email address
      to: email,

      // subject: Email subject line (shown in inbox preview)
      subject: `🌾 Welcome ${recipientName} to AgriPulse AI Mandi Volatility Alerts`,

      // html: The email body as styled HTML.
      // Uses a template literal to embed the subscriber's name and email dynamically.
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #191c1d; background-color: #f8f9fa;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #c1c8c2; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
              <h2 style="color: #012d1d; margin: 0; font-size: 22px;">🌾 AgriPulse AI Intelligence</h2>
            </div>
            <h3 style="color: #2c694e; margin-top: 0;">Welcome, ${recipientName}!</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #414844;">
              Thank you for subscribing to <strong>AgriPulse AI Volatility &amp; Mandi Rate Alerts</strong>.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #414844;">
              You will now receive daily AI price trend summaries, satellite telemetry crop health alerts, and real-time APMC Mandi exchange notifications.
            </p>
            <div style="background-color: #f3f4f3; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 12px; font-family: monospace; color: #012d1d;">
              <div>• Subscriber: ${recipientName} (${email})</div>
              <div>• Alert Frequency: Real-Time / Daily Digest</div>
              <div>• ML Models Active: CatBoost + Logistic Regression Ensemble</div>
            </div>
            <hr style="border: none; border-top: 1px solid #e1e3e4; margin: 24px 0;" />
            <p style="font-size: 11px; color: #717973; margin: 0;">
              AgriPulse AI Agricultural Intelligence Platform • APMC Exchange Telemetry Network
            </p>
          </div>
        </div>
      `
    };

    // transporter.sendMail(options): Sends the email via SMTP.
    // Returns an "info" object with metadata about the sent message.
    const info = await transporter.sendMail(mailOptions);
    console.log(`[NODEMAILER] Subscription email sent successfully to ${email}. Message ID: ${info.messageId}`);

    // nodemailer.getTestMessageUrl(info): Only works for Ethereal test transport.
    // Returns a URL where you can VIEW the sent email in the browser (for testing).
    // Returns false if using a real SMTP transport.
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      // Log the preview URL so developers can see the email during testing
      console.log(`[NODEMAILER] Ethereal Email Preview URL: ${previewUrl}`);
    }

    // Return success response with optional preview URL
    res.status(200).json({
      success: true,
      message: `Subscription confirmation sent to ${email}`,
      previewUrl: previewUrl || null  // null when using real SMTP (no preview available)
    });

  } catch (error) {
    console.error('[NODEMAILER] Error sending email:', error.message);
    res.status(500).json({ error: 'Failed to send subscription confirmation email' });
  }
});

// Export the router so server.js can mount it with app.use('/api/subscribe', subscribeRoutes)
module.exports = router;
