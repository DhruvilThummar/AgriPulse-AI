/**
 * ════════════════════════════════════════════════════════════
 * FILE: db.js
 * WHERE IT IS: node-auth-backend/src/config/db.js
 * WHAT IT DOES: Creates and manages the connection between the
 *               Node.js server and the MongoDB database.
 *               All user accounts, OTPs, and prediction logs
 *               are stored in MongoDB — this file opens the
 *               connection to it.
 * WHEN IT RUNS: Once at server startup, called from server.js.
 * HOW IT WORKS: Uses Mongoose (an ODM — Object Document Mapper)
 *               to connect. Mongoose makes it easy to interact
 *               with MongoDB using JavaScript models (schemas).
 * ════════════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');

// Disable Mongoose buffering so operations fail immediately if DB is offline instead of hanging 10s
mongoose.set('bufferCommands', false);

// Cache the connection promise across serverless function invocations
let cachedPromise = null;

/**
 * FUNCTION: connectDB
 * TYPE: Async function (returns a Promise)
 * WHAT IT DOES: Connects to MongoDB with connection reuse for serverless.
 */
const connectDB = async () => {
  // If already connected (readyState 1 = connected), return existing connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  // If connection is in progress, return the cached promise
  if (cachedPromise) {
    return cachedPromise;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('[WARN] MONGO_URI environment variable is not defined. Database features require MONGO_URI.');
    return null;
  }

  cachedPromise = mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Fast timeout after 5s
  }).then((conn) => {
    console.log(`>>> MongoDB Connected: ${conn.connection.host} <<<`);
    return conn;
  }).catch((error) => {
    cachedPromise = null; // Reset cache on failure
    console.error(`[WARN] MongoDB Connection Error: ${error.message}`);
    return null;
  });

  return cachedPromise;
};

module.exports = connectDB;
