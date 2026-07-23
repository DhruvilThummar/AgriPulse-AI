/**
 * ════════════════════════════════════════════════════════════
 * FILE: server.js
 * WHERE IT IS: node-auth-backend/server.js
 * WHAT IT DOES: This is the main entry point (the "start" file) for the
 *               Node.js Backend-for-Frontend (BFF) gateway server.
 *               It sets up Express, connects to MongoDB, mounts all API
 *               route handlers, and starts listening for HTTP requests.
 * WHEN IT RUNS: Run via "npm start" — runs once at server startup.
 * HOW IT WORKS:
 *   1. Express app is created and middleware is attached.
 *   2. All API routes are mounted on their URL prefixes.
 *   3. MongoDB connection is established.
 *   4. A default seed user is created if it doesn't exist yet.
 *   5. Server starts listening on the configured PORT.
 * ════════════════════════════════════════════════════════════
 */

// express: The main Node.js web framework — handles HTTP routing and middleware
const express = require('express');

// cors: Cross-Origin Resource Sharing middleware.
// Allows the React frontend (running on port 5173) to call this API (running on port 5000)
// Without this, browsers would block the requests due to security restrictions.
const cors = require('cors');

// dotenv: Loads environment variables from the .env file into process.env
// Must be called before any code that reads from process.env
require('dotenv').config();

// bcryptjs: Library for hashing passwords securely.
// Used here specifically for the seed user creation at startup.
const bcrypt = require('bcryptjs');

// connectDB: Our custom function that connects to MongoDB (defined in src/config/db.js)
const connectDB = require('./src/config/db');

// User: The Mongoose model for the users collection in MongoDB
// Used here to check if the seed user already exists
const User = require('./src/models/User');

// ── Route Handlers ──
// Each route file handles a group of related API endpoints.
// They are imported here and "mounted" (attached) to URL prefixes below.
const authRoutes      = require('./src/routes/authRoutes');      // /api/auth → signup, login, verify-otp
const commodityRoutes = require('./src/routes/commodityRoutes'); // /api/commodity-prices → live market prices
const predictRoutes   = require('./src/routes/predictRoutes');   // /api/predict → ML prediction + history
const subscribeRoutes = require('./src/routes/subscribeRoutes'); // /api/subscribe → newsletter subscriptions

// Create the Express application instance
const app = express();

// ── MIDDLEWARE SETUP ──
// Middleware = functions that run on EVERY request before it reaches the route handler.
// They are chained together in order (top to bottom).

// CORS middleware: Must be added FIRST so headers are set before any response is sent.
// origin: '*' = allow requests from any domain (restrict this to the frontend URL in production)
// methods: which HTTP verbs are allowed
// allowedHeaders: which request headers are accepted
app.use(cors({
  origin: '*',  // In production: change to 'http://localhost:5173'
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// express.json(): Parses incoming request bodies as JSON.
// Without this, req.body would be undefined for POST/PUT requests.
app.use(express.json());

// ── ROUTE MOUNTING ──
// app.use([paths], router): Attaches the router to one or more URL prefixes.
// When a request comes in, Express checks the URL prefix and forwards it to the right router.
// The first matching prefix "wins".

// Predict routes: handles POST /api/predict (and /api/v1/predict)
// Both v1 and legacy paths go to the same predictRoutes handler
app.use(['/api/v1/predict', '/api/predict'], predictRoutes);

// Commodity routes: handles GET /api/commodity-prices (and /api/v1/commodities)
app.use(['/api/v1/commodities', '/api/commodity-prices'], commodityRoutes);

// Auth routes: handles POST /api/auth/signup, /api/auth/login, /api/auth/verify-otp
app.use('/api/auth', authRoutes);

// Subscribe routes: handles POST /api/subscribe (newsletter/email subscription)
app.use('/api/subscribe', subscribeRoutes);

// ── HEALTH CHECK ENDPOINT ──
// GET /health or GET /api/v1/health → returns BFF server status
// Used by monitoring tools or the load balancer to verify this server is running.
// This is defined inline (not in a separate route file) since it's a simple status check.
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'AgriPulse AI BFF Backend Gateway',
    version: '2.4.0',
    // DJANGO_SERVICE_URL: from .env — the URL of the Django predict microservice
    target_django_service: process.env.DJANGO_SERVICE_URL || 'http://127.0.0.1:8000',
    timestamp: new Date().toISOString()  // Current server time in ISO 8601 format
  });
});

// ── SEED DEFAULT USER ──
// seedDefaultUser(): Checks if a default admin/demo user exists in MongoDB.
// If NOT found → creates it automatically with a pre-set email and hashed password.
// WHY: Makes it easier to demo/test the app without manually registering first.
// WHEN IT RUNS: Once, right after MongoDB connects at startup.
const seedDefaultUser = async () => {
  const defaultEmail    = 'dhruvilthummar37@gmail.com';
  const defaultPassword = 'Dhruvil@1303';

  try {
    // Check if a user with this email already exists in MongoDB
    const user = await User.findOne({ email: defaultEmail });

    if (!user) {
      // User not found → create it
      console.log(`[SEED] Seeding default user: ${defaultEmail}...`);

      // bcrypt.genSalt(10): Generates a random "salt" with 10 rounds of processing
      // A salt is random data added to the password before hashing to prevent rainbow table attacks
      const salt = await bcrypt.genSalt(10);

      // bcrypt.hash(password, salt): Converts the plain-text password into a secure hash
      // The hash is what gets stored in the database — never the plain password
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      // Create a new User document (MongoDB record) with the hashed password
      const seededUser = new User({
        email: defaultEmail,
        password: hashedPassword,
        isVerified: true  // Pre-verified so they can log in immediately without OTP
      });

      // .save(): Writes the document to the MongoDB users collection
      await seededUser.save();
      console.log(`[SEED] Default user successfully seeded and verified!`);

    } else {
      // User already exists — skip creation
      console.log(`[SEED] Default user '${defaultEmail}' already exists in database.`);
    }
  } catch (error) {
    console.error(`[SEED] Error seeding default user:`, error.message);
  }
};

// ── SERVER STARTUP ──
// PORT: The network port this server listens on (default: 5000)
// Configurable via the PORT environment variable in .env
const PORT = process.env.PORT || 5000;

// startServer(): Async function that boots the server in the correct order:
//   1. Connect to MongoDB first (without DB, auth and predictions won't work)
//   2. Seed the default user
//   3. Start listening for HTTP requests
const startServer = async () => {
  // Step 1: Connect to MongoDB (defined in src/config/db.js)
  await connectDB();

  // Step 2: Create the default seed user if needed
  await seedDefaultUser();

  // Step 3: Start the Express HTTP server
  // app.listen(PORT, callback): Opens a TCP socket on the specified PORT.
  // The callback runs once the server is ready to accept requests.
  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`  BFF Node.js server running on port ${PORT}      `);
    console.log(`  Target Django Predict service: ${process.env.DJANGO_SERVICE_URL || 'http://127.0.0.1:8000'}`);
    console.log(`=================================================`);
  });
};

// Call the startup function — this kicks everything off
startServer();
