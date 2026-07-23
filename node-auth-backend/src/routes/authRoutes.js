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

// router: An Express Router instance.
// Think of it as a sub-application that handles only /api/auth/* routes.
// Defined routes on `router` are relative to the mount path.
const router = express.Router();

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
  // Extract email and password from the request body (sent as JSON)
  const { email, password } = req.body;

  // Basic validation: both fields are required
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password' });
  }

  try {
    // ── Check if user already exists ──
    // User.findOne({ email }): MongoDB query — searches for a document with this email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // 400 Bad Request = the user made an invalid request (email already taken)
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // ── Hash the password ──
    // bcrypt.genSalt(10): Creates a random "salt" with 10 work factor rounds.
    // More rounds = more secure but slower. 10 is the industry standard.
    const salt = await bcrypt.genSalt(10);

    // bcrypt.hash(password, salt): Combines password + salt and runs the bcrypt algorithm.
    // The result is a long string like "$2a$10$..." — this is what we store in MongoDB.
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── Create and save the new User document ──
    // new User({...}): Creates a new MongoDB document in memory (not saved yet)
    const newUser = new User({
      email,
      password: hashedPassword,  // Only the hash is stored — never plain text
      isVerified: false           // Account starts as unverified until OTP is confirmed
    });
    await newUser.save();  // .save(): Actually writes the document to MongoDB

    // ── Generate a 6-digit OTP code ──
    // Math.floor(100000 + Math.random() * 900000): Generates a random integer between 100000 and 999999
    const otpCode  = Math.floor(100000 + Math.random() * 900000).toString();
    // OTP expires in 5 minutes from now (5 * 60 * 1000 milliseconds)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // ── Save OTP to MongoDB ──
    // Stored separately so it can be deleted after verification (clean up)
    const newOtp = new Otp({ email, otpCode, expiresAt });
    await newOtp.save();

    // ── Send OTP via email ──
    // sendOtpEmail(): Defined in config/nodemailer.js — uses Nodemailer to send the email
    await sendOtpEmail(email, otpCode);

    // 201 Created: Standard HTTP status for "resource was created successfully"
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password' });
  }

  try {
    // ── Find user by email ──
    const user = await User.findOne({ email });
    if (!user) {
      // Return same generic error for both "wrong email" and "wrong password"
      // (avoids telling attackers which part was wrong — security best practice)
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
      await sendOtpEmail(email, otpCode);  // Send the new OTP via email

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
    //   payload    → Data encoded inside the token (user ID and email)
    //   secret     → Used to sign (cryptographically validate) the token
    //   expiresIn  → How long the token is valid ('7d' = 7 days)
    const token = jwt.sign(
      { id: user._id, email: user.email },  // Token payload (decoded by authMiddleware on each request)
      jwtSecret,
      { expiresIn: '7d' }                   // Token expires after 7 days
    );

    // Return the token and basic user info to the frontend
    // The frontend stores this token and sends it as "Authorization: Bearer <token>" on future requests
    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Export the router so it can be mounted in server.js with app.use('/api/auth', authRoutes)
module.exports = router;
