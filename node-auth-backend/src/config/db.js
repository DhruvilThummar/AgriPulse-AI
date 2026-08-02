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
// Think of it as a translator between JavaScript objects and MongoDB documents.
// It also lets you define "schemas" (blueprints) for your data.
const mongoose = require('mongoose');

/**
 * FUNCTION: connectDB
 * TYPE: Async function (returns a Promise)
 * WHAT IT DOES: Connects to the MongoDB database.
 *               If connection fails → logs the error and shuts down the server.
 * WHEN TO USE: Called once at server startup in server.js → `await connectDB()`
 * WHY ASYNC: mongoose.connect() is a network operation — it takes time.
 *            Using async/await means we wait for it to finish before starting the server.
 */
const connectDB = async () => {
  try {
    // mongoose.connect(uri, options): Opens the connection to MongoDB.
    //   uri      → The MongoDB connection string (from .env → MONGO_URI)
    //              Format: mongodb://host:port/databaseName
    //              e.g.  : mongodb://127.0.0.1:27017/agripulse
    //   options  → Configuration flags for the connection (explained below)
    //
    // process.env.MONGO_URI: Reads the MONGO_URI variable from the .env file.
    // If not set, defaults to a local MongoDB instance on port 27017.
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agripulse', {
      // useNewUrlParser: true → Use the new MongoDB URL string parser (avoids deprecation warnings)
      useNewUrlParser: true,
      // useUnifiedTopology: true → Use the new unified server discovery and monitoring engine
      useUnifiedTopology: true,
    });

    // conn.connection.host: The host name of the MongoDB server we connected to.
    // e.g. "127.0.0.1" for local MongoDB or a cloud host like "cluster0.mongodb.net"
    console.log(`>>> MongoDB Connected: ${conn.connection.host} <<<`);

  } catch (error) {
    // If MongoDB connection fails, log a warning but allow the Node server to keep running
    console.error(`[WARN] MongoDB Connection Error: ${error.message}`);
    console.warn(`[WARN] Node backend will operate with fallback/in-memory handlers for predictions & market data.`);
  }
};

// module.exports: Makes the connectDB function available to other files.
// server.js does: const connectDB = require('./src/config/db') to import it.
module.exports = connectDB;
