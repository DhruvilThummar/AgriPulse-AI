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

// connectDB: Our custom function that connects to MongoDB (defined in src/config/db.js)
const connectDB = require('./src/config/db');

// ── Route Handlers ──
// Each route file handles a group of related API endpoints.
// They are imported here and "mounted" (attached) to URL prefixes below.
const authRoutes = require('./src/routes/authRoutes');      // /api/auth → signup, login, verify-otp
const commodityRoutes = require('./src/routes/commodityRoutes'); // /api/commodity-prices → live market prices
const predictRoutes = require('./src/routes/predictRoutes');   // /api/predict → ML prediction + history
const subscribeRoutes = require('./src/routes/subscribeRoutes'); // /api/subscribe → newsletter subscriptions
const inventoryRoutes = require('./src/routes/inventoryRoutes'); // /api/inventory → user stocks persistence

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

// ── DATABASE CONNECTION MIDDLEWARE ──
// Trigger connectDB asynchronously on serverless requests without blocking non-database endpoints
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    // Non-blocking: log warning, allow request to proceed so mock/fallback endpoints function
    console.warn('[DB Middleware Warning]: MongoDB unavailable, proceeding with request:', err.message);
  }
  next();
});

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

// Subscribe & Contact routes: handles POST /api/subscribe & POST /api/contact
app.use(['/api/subscribe', '/api/contact'], subscribeRoutes);

// Inventory routes: handles persistent user stock & cash reserves
app.use('/api/inventory', inventoryRoutes);

// ── HEALTH CHECK ENDPOINT ──
// GET /health or GET /api/v1/health → returns BFF server status
// Used by monitoring tools or the load balancer to verify this server is running.
// This is defined inline (not in a separate route file) since it's a simple status check.
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'AgriCast AI BFF Backend Gateway',
    version: '2.4.0',
    // DJANGO_SERVICE_URL: from .env — the URL of the Django predict microservice
    target_django_service: process.env.DJANGO_SERVICE_URL || 'http://127.0.0.1:8000',
    timestamp: new Date().toISOString()  // Current server time in ISO 8601 format
  });
});

// ── SERVER STARTUP ──
// PORT: The network port this server listens on (default: 5000)
// Configurable via the PORT environment variable in .env
const PORT = process.env.PORT || 5000;

// startServer(): Async function that boots the server in the correct order:
//   1. Connect to MongoDB first (without DB, auth and predictions won't work)
//   2. Start listening for HTTP requests
const startServer = async () => {
  try {
    // Connect to MongoDB (defined in src/config/db.js)
    await connectDB();
  } catch (error) {
    console.error('[STARTUP] MongoDB connection deferred or failed at startup:', error.message);
  }

  // Step 3: Start local Express HTTP server (in non-serverless mode)
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`  BFF Node.js server running on port ${PORT}      `);
      console.log(`  Target Django Predict service: ${process.env.DJANGO_SERVICE_URL || 'http://127.0.0.1:8000'}`);
      console.log(`=================================================`);
    });
  }
};

// Call the startup function — this kicks everything off
startServer();

module.exports = app;
