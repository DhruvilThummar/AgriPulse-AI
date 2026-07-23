/**
 * ════════════════════════════════════════════════════════════
 * FILE: Prediction.js
 * WHERE IT IS: node-auth-backend/src/models/Prediction.js
 * WHAT IT DOES: Defines the schema for prediction audit log documents
 *               stored in MongoDB. Every time a user runs a prediction,
 *               the inputs and outputs are saved here permanently.
 * WHEN TO USE: Imported in predictRoutes.js for:
 *   - Creating a new prediction log after each POST /predict call
 *   - Fetching a user's history on GET /predict/history
 *   - Deleting records on DELETE /predict/history (or /history/:id)
 * WHY STORE PREDICTIONS: Allows users to review their prediction history,
 *                        track accuracy over time, and re-use past inputs.
 * ════════════════════════════════════════════════════════════
 */

// mongoose: The MongoDB ODM library — provides Schema and model functionality
const mongoose = require('mongoose');

/**
 * PredictionSchema: Blueprint for each prediction audit log document.
 * Contains all input parameters the user provided + the ML model's output.
 * Linked to a specific user so only they can see/delete their own records.
 */
const PredictionSchema = new mongoose.Schema({

  // user: A reference (foreign key) to the User document that made this prediction.
  // mongoose.Schema.Types.ObjectId → The type used for MongoDB document IDs (24-character hex strings)
  // ref: 'User' → Tells Mongoose this links to the "User" collection.
  //               Enables .populate('user') to fetch the full user document if needed.
  // required: true → Every prediction MUST belong to a user (no anonymous predictions)
  user: {
    type: mongoose.Schema.Types.ObjectId,  // MongoDB's built-in ID type
    ref: 'User',                           // Foreign key reference to the User model
    required: true
  },

  // crop: Which commodity this prediction was for (e.g. "wheat", "rice", "cotton").
  // lowercase: true → ensures consistent storage ("Wheat" and "wheat" → both become "wheat")
  // trim: true → removes accidental whitespace
  crop: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },

  // previousPrice: The "previous_price" input the user provided (INR per Quintal).
  // Number type in Mongoose maps to a 64-bit float in MongoDB.
  previousPrice: {
    type: Number,
    required: true
  },

  // supplyVolume: The "supply_volume" input the user provided (in Tons).
  supplyVolume: {
    type: Number,
    required: true
  },

  // transportCostIndex: The freight cost index the user provided (baseline = 100).
  transportCostIndex: {
    type: Number,
    required: true
  },

  // marketDemandScore: The demand score input (1.0 to 10.0).
  // min: 1, max: 10 → MongoDB-level validation (extra safety net on top of serializer validation)
  marketDemandScore: {
    type: Number,
    required: true,
    min: 1,   // Cannot be less than 1
    max: 10   // Cannot be more than 10
  },

  // prediction: The ML model's final output — either "UP" (price going up) or "DOWN".
  // enum: ['UP', 'DOWN'] → Only these two values are allowed (schema-enforced).
  // Attempting to save any other value (e.g. "NEUTRAL") will throw a validation error.
  prediction: {
    type: String,
    required: true,
    enum: ['UP', 'DOWN']  // Strict whitelist — only 'UP' or 'DOWN' are valid values
  },

  // confidence: The ML model's confidence percentage (e.g. 73.52 means 73.52% confident).
  // Stored as a Number (float) for potential mathematical analysis later.
  confidence: {
    type: Number,
    required: true
  },

  // probabilityUp: The raw probability that the price will go UP (e.g. 73.52%).
  // Different from confidence: when prediction is DOWN, confidence = 100 - probabilityUp.
  // Stored separately for statistical analysis and charting purposes.
  probabilityUp: {
    type: Number,
    required: true
  }

}, {
  // timestamps: true → Mongoose automatically adds:
  //   createdAt → When this prediction was made (useful for sorting history by date)
  //   updatedAt → When this record was last modified
  timestamps: true
});

// mongoose.model('Prediction', PredictionSchema):
//   - 'Prediction' → Mongoose creates a collection named "predictions" in MongoDB.
//   - PredictionSchema → Defines all fields for each prediction document.
// Usage examples:
//   new Prediction({ user: req.user.id, crop: 'wheat', ... }) → create a log entry
//   Prediction.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20) → fetch history
//   Prediction.deleteMany({ user: req.user.id }) → clear all history for a user
module.exports = mongoose.model('Prediction', PredictionSchema);
