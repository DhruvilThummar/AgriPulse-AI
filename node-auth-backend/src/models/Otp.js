/**
 * ════════════════════════════════════════════════════════════
 * FILE: Otp.js
 * WHERE IT IS: node-auth-backend/src/models/Otp.js
 * WHAT IT DOES: Defines the schema for One-Time Password (OTP) records
 *               stored temporarily in MongoDB.
 *               Each time a user registers or needs re-verification,
 *               a new OTP document is created. After verification
 *               is complete, the document is deleted.
 * WHEN TO USE: Imported in authRoutes.js for:
 *   - Creating an OTP record on signup
 *   - Looking up an OTP record on verify-otp
 *   - Deleting an OTP record after it's used
 * HOW AUTO-EXPIRY WORKS:
 *   MongoDB has a built-in TTL (Time-To-Live) index feature.
 *   Setting index: { expires: 0 } on a Date field tells MongoDB to
 *   automatically delete the document when that date/time is reached.
 *   So OTPs expire and clean themselves up without any manual code.
 * ════════════════════════════════════════════════════════════
 */

// mongoose: The MongoDB ODM library — provides Schema and model functionality
const mongoose = require('mongoose');

/**
 * OtpSchema: The blueprint for OTP verification documents.
 * Each OTP document links an email address to a temporary 6-digit code.
 * The document auto-deletes from MongoDB when the expiresAt time passes.
 */
const OtpSchema = new mongoose.Schema({

  // email: The email address this OTP was generated for.
  // trim: true → removes accidental whitespace.
  // Used when verifying: Otp.findOne({ email, otpCode: inputCode })
  email: {
    type: String,
    required: true,  // Always required — OTP must belong to an email
    trim: true       // Remove accidental spaces from the email string
  },

  // otpCode: The 6-digit verification code string (e.g. "847291").
  // Stored as a String (not Number) to preserve leading zeros (e.g. "012345").
  // Compared during verification: does req.body.otp === otpRecord.otpCode?
  otpCode: {
    type: String,
    required: true  // Always required — an OTP without a code is useless
  },

  // expiresAt: The exact Date/Time when this OTP expires.
  // Set to "now + 5 minutes" when the OTP is created.
  // MongoDB automatically deletes this document when this time is reached.
  // { index: { expires: 0 } } → This is the TTL index config:
  //   expires: 0 means "delete the document at exactly the expiresAt datetime".
  //   (expires: 3600 would mean "delete 3600 seconds AFTER expiresAt")
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }  // MongoDB auto-deletes this document at expiresAt — no manual cleanup needed!
  }

}, {
  // timestamps: true → Adds createdAt and updatedAt fields automatically.
  // createdAt is useful to know exactly when the OTP was generated.
  timestamps: true
});

// mongoose.model('Otp', OtpSchema):
//   - 'Otp'     → Mongoose creates a collection named "otps" in MongoDB.
//   - OtpSchema → Defines the fields for each OTP document.
// Usage: new Otp({ email, otpCode, expiresAt }), Otp.findOne({ email, otpCode }), Otp.deleteOne(...)
module.exports = mongoose.model('Otp', OtpSchema);
