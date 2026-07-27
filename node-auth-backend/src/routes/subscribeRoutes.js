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
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const port = parseInt(process.env.SMTP_PORT, 10) || 465;

  if (user && pass) {
    // ── Real Gmail / SMTP Mode ──
    return nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: port,
      secure: port === 465, // true for 465 (SSL), false for 587 (STARTTLS)
      auth: { user, pass }
    });
  } else {
    // ── Ethereal Test Fallback Mode ──
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
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
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'dhruvilthummar37@gmail.com';
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
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AgriPulse AI Welcome</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f5; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" maxWidth="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 32px rgba(1, 45, 29, 0.08); border: 1px solid #e1e8e4;">
                  
                  <!-- Top Gradient Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #012d1d 0%, #1b4332 100%); padding: 36px 32px; text-align: center;">
                      <div style="display: inline-block; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 20px; padding: 6px 14px; margin-bottom: 12px;">
                        <span style="color: #34d399; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">🌾 AgriPulse AI Volatility Network</span>
                      </div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">Welcome to Mandi AI Alerts</h1>
                      <p style="color: #aeeecb; margin: 6px 0 0 0; font-size: 14px;">Real-Time Spot Prices &amp; Satellite Telemetry Intelligence</p>
                    </td>
                  </tr>

                  <!-- Main Content Area -->
                  <tr>
                    <td style="padding: 32px 32px 24px;">
                      <h2 style="color: #012d1d; margin: 0 0 12px 0; font-size: 20px; font-weight: 700;">Hello ${recipientName},</h2>
                      <p style="color: #414844; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                        Thank you for subscribing to <strong>AgriPulse AI Mandi Volatility Alerts</strong>. You are now connected to India's premier agricultural spot market machine learning network.
                      </p>
                      <p style="color: #414844; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                        You will receive daily automated price trend summaries, satellite vegetation scans (Sentinel-2 NDVI), and APMC Mandi exchange volatility warnings.
                      </p>

                      <!-- Summary Data Box -->
                      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <div style="color: #166534; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">
                          📋 Subscription Details &amp; Active Sensors
                        </div>
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #166534;">
                          <tr>
                            <td style="padding: 4px 0; font-weight: 600;">Subscriber:</td>
                            <td style="padding: 4px 0; text-align: right; color: #012d1d;">${recipientName} (${email})</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; font-weight: 600;">Alert Digest:</td>
                            <td style="padding: 4px 0; text-align: right; color: #012d1d;">Real-Time / Daily Briefing</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; font-weight: 600;">ML Model Pipeline:</td>
                            <td style="padding: 4px 0; text-align: right; color: #012d1d;">Scikit-Learn GBDT Ensemble</td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; font-weight: 600;">Exchange Status:</td>
                            <td style="padding: 4px 0; text-align: right;"><span style="background: #22c55e; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700;">18 APMC Mandis Active</span></td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer Bar -->
                  <tr>
                    <td style="background-color: #f8faf9; border-top: 1px solid #e1e8e4; padding: 20px 32px; text-align: center;">
                      <p style="color: #717973; font-size: 12px; margin: 0 0 6px 0; font-weight: 600;">
                        AgriPulse AI Agricultural Intelligence Platform
                      </p>
                      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                        APMC Mandi Spot Exchange Network • Sentinel-2 Orbit Telemetry
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`[NODEMAILER] Subscription email sent successfully to ${email}. Message ID: ${info.messageId}`);

    const previewUrl = nodemailer.getTestMessageUrl(info);

    res.status(200).json({
      success: true,
      message: `Subscription confirmation sent to ${email}`,
      previewUrl: previewUrl || null
    });

  } catch (error) {
    console.error('[NODEMAILER] Error sending email:', error.message);
    res.status(500).json({ error: 'Failed to send subscription confirmation email' });
  }
});


// ════════════════════════════════════════════════════════════
// ROUTE: POST /api/contact (and /api/subscribe/contact)
// ACCESS: Public (no login required)
// WHAT IT DOES: Sends a Contact Us inquiry notification via Nodemailer.
// BODY: { name, email, subject, message }
// ════════════════════════════════════════════════════════════
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email address and message content are required' });
  }

  const senderName = name ? name.trim() : email.split('@')[0];
  const msgSubject = subject ? subject.trim() : 'AgriPulse AI General Inquiry';

  try {
    const transporter = await createTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'dhruvilthummar37@gmail.com';
    const formattedFrom = fromAddress.includes('<') ? fromAddress : `"AgriPulse Support" <${fromAddress}>`;

    const mailOptions = {
      from: formattedFrom,
      to: email,
      subject: `📩 [Received] ${msgSubject} - AgriPulse AI Support`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AgriPulse Inquiry Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f6f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f5; padding: 40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" maxWidth="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 32px rgba(1, 45, 29, 0.08); border: 1px solid #e1e8e4;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #012d1d 0%, #1b4332 100%); padding: 36px 32px; text-align: center;">
                      <div style="display: inline-block; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 20px; padding: 6px 14px; margin-bottom: 12px;">
                        <span style="color: #34d399; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">🌿 Technical Support Desk</span>
                      </div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Inquiry Received</h1>
                      <p style="color: #aeeecb; margin: 6px 0 0 0; font-size: 14px;">Ticket Subject: "${msgSubject}"</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px 32px 24px;">
                      <h2 style="color: #012d1d; margin: 0 0 12px 0; font-size: 18px; font-weight: 700;">Hello ${senderName},</h2>
                      <p style="color: #414844; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                        Thank you for reaching out to AgriPulse AI Technical Support. We have logged your request regarding <strong>"${msgSubject}"</strong> and routed it to our engineering and Mandi telemetry team.
                      </p>

                      <!-- Message Copy Box -->
                      <div style="background-color: #f8faf9; border-left: 4px solid #10b981; border-radius: 6px; padding: 18px; margin-bottom: 24px;">
                        <div style="color: #012d1d; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">
                          💬 Submitted Message Content:
                        </div>
                        <div style="color: #334155; font-size: 13px; line-height: 1.6; font-style: italic; white-space: pre-wrap;">
                          "${message}"
                        </div>
                      </div>

                      <p style="color: #414844; font-size: 13px; line-height: 1.6; margin: 0;">
                        Our support desk typically responds within 24 hours. If your request is urgent regarding APMC API integration, please mention your client ID in follow-up communications.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8faf9; border-top: 1px solid #e1e8e4; padding: 20px 32px; text-align: center;">
                      <p style="color: #717973; font-size: 12px; margin: 0 0 4px 0; font-weight: 600;">
                        AgriPulse AI Engineering Support Desk
                      </p>
                      <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                        APMC Commodity Telemetry • Node.js BFF Gateway
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`[NODEMAILER] Contact inquiry email dispatched to ${email}. Message ID: ${info.messageId}`);

    const previewUrl = nodemailer.getTestMessageUrl(info);

    res.status(200).json({
      success: true,
      message: `Your inquiry has been received! Confirmation email sent to ${email}`,
      previewUrl: previewUrl || null
    });

  } catch (error) {
    console.error('[NODEMAILER] Contact email error:', error.message);
    res.status(500).json({ error: 'Failed to send contact inquiry email' });
  }
});

// Export the router so server.js can mount it with app.use('/api/subscribe', subscribeRoutes)
module.exports = router;

