/**
 * ════════════════════════════════════════════════════════════
 * FILE: authRoutes.js
 * WHERE IT IS: node-auth-backend/src/routes/authRoutes.js
 * WHAT IT DOES: Handles all user authentication API endpoints:
 *   POST /api/auth/signup      → Register a new user, send OTP email
 *   POST /api/auth/verify-otp  → Verify the 6-digit OTP code
 *   POST /api/auth/login       → Login with email+password, get JWT token
 * WHEN TO USE: Mounted in server.js at the /api/auth prefix.
 * HOW IT WORKS:
 *   - Signup: Creates user, hashes password, generates OTP, sends email.
 *   - Verify OTP: Marks user as verified after checking OTP code.
 *   - Login: Checks credentials, issues a signed JWT token if valid.
 * ════════════════════════════════════════════════════════════
 */

// express: Web framework — Router() creates a mini-app for this group of routes
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// bcryptjs: Library for hashing and comparing passwords securely.
// Never store plain-text passwords — always hash them first.
const bcrypt = require('bcryptjs');

// jsonwebtoken (jwt): Library for creating and verifying JWT tokens.
// JWT = JSON Web Token — a signed string that proves the user is logged in.
// The token is sent to the frontend and included in future requests as proof of identity.
const jwt = require('jsonwebtoken');

// User: Mongoose model for the users collection in MongoDB
const User = require('../models/User');

// Otp: Mongoose model for the OTP codes collection in MongoDB
const Otp = require('../models/Otp');

// sendOtpEmail: Custom function from config/nodemailer.js that sends an email with the OTP code
const { sendOtpEmail } = require('../config/nodemailer');


// ════════════════════════════════════════════════════════════
// ROUTE: POST /api/auth/signup
// ACCESS: Public (no login required)
// WHAT IT DOES: Registers a brand new user account.
//   1. Validates that email and password are provided.
//   2. Checks the user doesn't already exist.
//   3. Hashes the password and saves the user to MongoDB.
//   4. Generates a 6-digit OTP and sends it to the user's email.
// ════════════════════════════════════════════════════════════
router.post('/signup', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database Connection Unavailable',
      message: 'MongoDB Atlas is not connected. Please configure MONGO_URI in Vercel Environment Variables.'
    });
  }

  // Extract name, email and password from the request body (sent as JSON)
  const { name, email, password } = req.body;

  // Basic validation: email and password are required
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // ── Check if user already exists (case-insensitive) ──
    const existingUser = await User.findOne({ email: new RegExp(`^${cleanEmail}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // ── Hash the password ──
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── Create and save the new User document ──
    const newUser = new User({
      name: name ? name.trim() : '',
      email: cleanEmail,
      password: hashedPassword,
      isVerified: false
    });
    await newUser.save();

    // ── Generate a 6-digit OTP code ──
    const otpCode  = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const newOtp = new Otp({ email: cleanEmail, otpCode, expiresAt });
    await newOtp.save();

    // ── Send OTP via email ──
    await sendOtpEmail(cleanEmail, otpCode, name || '');

    return res.status(201).json({ message: 'User registered. OTP sent to your email.' });

  } catch (error) {
    console.error('Error during signup:', error);
    // 500 Internal Server Error: Something unexpected went wrong on the server side
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});


// ════════════════════════════════════════════════════════════
// ROUTE: POST /api/auth/verify-otp
// ACCESS: Public
// WHAT IT DOES: Verifies the 6-digit OTP code sent to the user's email.
//   1. Finds the OTP record in MongoDB.
//   2. Marks the user as verified (isVerified = true).
//   3. Deletes the used OTP record (one-time use only).
// ════════════════════════════════════════════════════════════
router.post('/verify-otp', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database Connection Unavailable',
      message: 'MongoDB Atlas is not connected. Please configure MONGO_URI in Vercel Environment Variables.'
    });
  }

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Please provide email and OTP code' });
  }

  try {
    // ── Find the OTP record ──
    // Otp.findOne({ email, otpCode: otp }): Looks for an OTP matching both the email AND the code
    const otpRecord = await Otp.findOne({ email, otpCode: otp });
    if (!otpRecord) {
      // No matching OTP found → either invalid code or it has expired
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    // ── Find the associated user ──
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User associated with this OTP not found' });
    }

    // ── Mark user as verified ──
    user.isVerified = true;
    await user.save();  // Save the updated document back to MongoDB

    // ── Delete the used OTP (one-time use) ──
    // deleteOne(): Removes the OTP document so it can't be reused
    await Otp.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({ message: 'Account verified successfully' });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ error: 'Internal server error during verification' });
  }
});


// ════════════════════════════════════════════════════════════
// ROUTE: POST /api/auth/login
// ACCESS: Public
// WHAT IT DOES: Authenticates a user and returns a JWT token.
//   1. Finds the user by email.
//   2. Compares the provided password with the stored hash.
//   3. If account is unverified → sends a new OTP and returns 403.
//   4. If credentials are valid → signs and returns a 7-day JWT token.
// ════════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database Connection Unavailable',
      message: 'MongoDB Atlas is not connected. Please configure MONGO_URI in Vercel Environment Variables.'
    });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // ── Find user by email (case-insensitive) ──
    const user = await User.findOne({ email: new RegExp(`^${cleanEmail}$`, 'i') });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // ── Verify password ──
    // bcrypt.compare(plain, hash): Runs the same bcrypt algorithm on the input and compares
    // Returns true if they match, false if they don't.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // ── Block unverified accounts ──
    // If the user never verified their OTP → reject login and send a fresh OTP
    if (!user.isVerified) {
      await Otp.deleteMany({ email });  // Clear any old unused OTPs for this email

      // Generate a fresh 6-digit OTP
      const otpCode  = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);  // Expires in 5 minutes

      const newOtp = new Otp({ email, otpCode, expiresAt });
      await newOtp.save();
      await sendOtpEmail(email, otpCode, user.name || '');  // Send the new OTP via email with user's name

      // 403 Forbidden: User exists but is not allowed in yet (unverified)
      return res.status(403).json({
        unverified: true,
        error: 'Your account is not verified. A new verification OTP code has been sent to your email.'
      });
    }

    // ── Issue JWT Token ──
    // JWT_SECRET: Secret string used to sign the token (from .env)
    // NEVER share this secret — anyone with it can generate valid tokens
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_agripulse_ai';

    // jwt.sign(payload, secret, options):
    //   payload    → Data encoded inside the token (user ID, name and email)
    //   secret     → Used to sign (cryptographically validate) the token
    //   expiresIn  → How long the token is valid ('7d' = 7 days)
    const token = jwt.sign(
      { id: user._id, name: user.name || '', email: user.email },  // Token payload (decoded by authMiddleware on each request)
      jwtSecret,
      { expiresIn: '7d' }                   // Token expires after 7 days
    );

    // Return the token and basic user info to the frontend
    // The frontend stores this token and sends it as "Authorization: Bearer <token>" on future requests
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// ════════════════════════════════════════════════════════════
// ROUTE: POST /api/auth/forgot-password
// ACCESS: Public
// WHAT IT DOES: Sends a 6-digit password reset OTP to the user's email.
// ════════════════════════════════════════════════════════════
router.post('/forgot-password', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database Connection Unavailable',
      message: 'MongoDB Atlas is not connected. Please configure MONGO_URI in Vercel Environment Variables.'
    });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please provide your email address' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({ email: new RegExp(`^${cleanEmail}$`, 'i') });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    // Delete any previous pending OTPs for this email
    await Otp.deleteMany({ email: cleanEmail });

    // Generate new 6-digit OTP code (expires in 5 minutes)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const newOtp = new Otp({ email: cleanEmail, otpCode, expiresAt });
    await newOtp.save();

    // Send OTP via email
    await sendOtpEmail(cleanEmail, otpCode, user.name || '');

    return res.status(200).json({ message: 'Password reset OTP code sent to your email.' });

  } catch (error) {
    console.error('Error requesting password reset:', error);
    return res.status(500).json({ error: 'Internal server error during password reset request' });
  }
});


// ════════════════════════════════════════════════════════════
// ROUTE: POST /api/auth/reset-password
// ACCESS: Public
// WHAT IT DOES: Verifies the 6-digit OTP and sets a new password for the user.
// ════════════════════════════════════════════════════════════
router.post('/reset-password', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database Connection Unavailable',
      message: 'MongoDB Atlas is not connected. Please configure MONGO_URI in Vercel Environment Variables.'
    });
  }

  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'Please provide email, OTP code, and new password' });
  }

  try {
    // Find matching OTP record
    const otpRecord = await Otp.findOne({ email, otpCode: otp });
    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    // Find target user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User associated with this email not found' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and ensure account is verified
    user.password = hashedPassword;
    user.isVerified = true;
    await user.save();

    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({ message: 'Password reset successfully! You can now log in with your new password.' });

  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: 'Internal server error during password reset' });
  }
});

// Export the router so it can be mounted in server.js with app.use('/api/auth', authRoutes)
module.exports = router;
