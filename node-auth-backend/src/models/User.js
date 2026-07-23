/**
 * ════════════════════════════════════════════════════════════
 * FILE: User.js
 * WHERE IT IS: node-auth-backend/src/models/User.js
 * WHAT IT DOES: Defines the "User" data model (blueprint/schema) for
 *               storing user accounts in the MongoDB database.
 *               Think of this as the column definition for a users table.
 * WHEN TO USE: Imported wherever you need to create, find, or update users.
 *   - authRoutes.js → finding users during login, creating users at signup
 *   - server.js     → creating the default seed user at startup
 * HOW IT WORKS:
 *   - Mongoose.Schema defines the shape and rules of the data.
 *   - mongoose.model('User', UserSchema) creates a collection named "users"
 *     in MongoDB (Mongoose lowercases and pluralizes the name automatically).
 * ════════════════════════════════════════════════════════════
 */

// mongoose: The MongoDB ODM library — provides Schema and model functionality
const mongoose = require('mongoose');

/**
 * UserSchema: The blueprint for every user document stored in MongoDB.
 * Each field definition includes:
 *   type     → The JavaScript data type (String, Number, Boolean, Date, etc.)
 *   required → Whether the field MUST be provided (true = required, omitting throws error)
 *   unique   → Whether duplicate values are allowed (true = no duplicates)
 *   default  → The value used if the field is not provided when creating a document
 *   trim     → Automatically strips leading/trailing whitespace from strings
 *   lowercase → Automatically converts the value to lowercase before saving
 */
const UserSchema = new mongoose.Schema({

  // email: The user's email address — used as their unique login identifier.
  // unique: true → Two users cannot have the same email (enforced by MongoDB index).
  // lowercase: true → "User@Example.COM" is stored as "user@example.com" (normalized).
  // trim: true → Removes accidental spaces (e.g. " user@email.com " → "user@email.com").
  email: {
    type: String,
    required: true,   // Must be provided — cannot create a user without an email
    unique: true,     // No two users can share the same email address
    lowercase: true,  // Always stored in lowercase for consistent comparisons
    trim: true        // Removes leading/trailing whitespace before saving
  },

  // password: The bcrypt-hashed password string.
  // IMPORTANT: This is NEVER the plain-text password.
  // The plain password is hashed in authRoutes.js before being stored here.
  // A hashed password looks like: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
  password: {
    type: String,
    required: true   // Must always provide a password when creating a user
  },

  // isVerified: Whether the user has confirmed their email via OTP.
  // false = not verified (cannot login) | true = email confirmed (can login)
  // default: false → New users start as unverified until they complete OTP verification.
  isVerified: {
    type: Boolean,
    default: false  // By default, new accounts are created as unverified
  }

}, {
  // timestamps: true → Mongoose automatically adds two fields to every document:
  //   createdAt → The exact DateTime when this user document was created
  //   updatedAt → The exact DateTime when this user document was last modified
  // Useful for auditing (e.g. "when did this account first register?")
  timestamps: true
});

// mongoose.model('User', UserSchema):
//   - 'User' → The model name. Mongoose creates a MongoDB collection named "users" (pluralized).
//   - UserSchema → The schema defining what fields a user document can have.
// Returns a Model class — used to create, query, update, and delete user documents.
// Usage: User.findOne({ email }), new User({ email, password }), User.deleteMany(...)
module.exports = mongoose.model('User', UserSchema);
