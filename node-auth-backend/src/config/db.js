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

// mongoose: The main library for connecting to MongoDB from Node.js.
const mongoose = require('mongoose');

// Cache the connection promise across serverless function invocations
let cachedPromise = null;

/**
 * FUNCTION: connectDB
 * TYPE: Async function (returns a Promise)
 * WHAT IT DOES: Connects to MongoDB with connection reuse for serverless.
 */
const connectDB = async () => {
  // If already connected (readyState 1 = connected), return existing connection immediately
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  // If connection is already in progress, await the pending promise
  if (cachedPromise) {
    return cachedPromise;
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agripulse';

  cachedPromise = mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of buffering indefinitely
  }).then((conn) => {
    console.log(`>>> MongoDB Connected: ${conn.connection.host} <<<`);
    return conn;
  }).catch((error) => {
    cachedPromise = null; // Reset cache on failure so future requests can retry
    console.error(`[WARN] MongoDB Connection Error: ${error.message}`);
    throw error;
  });

  return cachedPromise;
};

module.exports = connectDB;
