/**
 * ════════════════════════════════════════════════════════════
 * FILE: auth.js
 * WHERE IT IS: node-auth-backend/src/middleware/auth.js
 * WHAT IT DOES: This is the JWT authentication middleware.
 *               It "guards" protected API routes by checking
 *               whether the incoming request has a valid JWT token.
 *               If the token is valid → allows the request through.
 *               If not → immediately rejects with 401 Unauthorized.
 * WHEN TO USE: Add it as the 2nd argument to any route that requires login:
 *               router.post('/predict', authMiddleware, handlerFunction)
 * HOW IT WORKS:
 *   1. Reads the "Authorization" header from the HTTP request.
 *   2. Expects format: "Bearer <token>" (e.g. "Bearer eyJhbGciOiJIUzI1...")
 *   3. Extracts and verifies the token using the JWT secret key.
 *   4. If valid → attaches decoded user info to req.user and calls next().
 *   5. If invalid/missing → returns 401 error and STOPS the request.
 * ════════════════════════════════════════════════════════════
 */

// jsonwebtoken (imported as jwt): Library for working with JWT tokens.
// jwt.sign()   → creates a new token (used in authRoutes.js at login)
// jwt.verify() → validates and decodes a token (used HERE to check every request)
const jwt = require('jsonwebtoken');

/**
 * FUNCTION: authMiddleware
 * TYPE: Express Middleware Function
 * WHAT IT IS: Express middleware functions always have 3 parameters: (req, res, next)
 *   req  → The incoming HTTP request object (contains headers, body, params, etc.)
 *   res  → The outgoing HTTP response object (used to send back data or errors)
 *   next → A function that passes control to the NEXT middleware or route handler.
 *          Calling next() means "this middleware is done, continue processing the request".
 *          If you DON'T call next() → the request stops here (used when rejecting).
 */
const authMiddleware = (req, res, next) => {

  // ── Step 1: Read the Authorization Header ──
  // The frontend sends the JWT token in the Authorization header with every request.
  // Format: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  // req.header('Authorization'): Gets the value of the Authorization header.
  const authHeader = req.header('Authorization');

  // If the header is completely missing → reject immediately
  if (!authHeader) {
    // 401 Unauthorized: The request has no credentials at all.
    // Return here stops execution — next() is NOT called → route handler is skipped.
    return res.status(401).json({ error: 'Access denied. No authorization header provided.' });
  }

  // ── Step 2: Validate the "Bearer <token>" Format ──
  // authHeader.split(' '): Splits the string on spaces.
  // "Bearer eyJhb..." → ['Bearer', 'eyJhb...']
  // parts[0] should be "Bearer", parts[1] should be the token string.
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    // The format is wrong (e.g. just a plain token without "Bearer " prefix)
    return res.status(401).json({ error: 'Access denied. Invalid token format. Use Bearer <token>.' });
  }

  // Extract the actual token string (the part after "Bearer ")
  const token = parts[1];

  try {
    // ── Step 3: Verify and Decode the JWT Token ──
    // jwt.verify(token, secret): Does two things simultaneously:
    //   1. Checks the token's SIGNATURE using the secret key (is this token genuine?)
    //   2. Checks the token's EXPIRY (has it expired past its 7-day lifespan?)
    // If both pass → returns the decoded payload (the data that was signed into the token).
    // If either fails → throws a JsonWebTokenError (caught below).
    //
    // JWT_SECRET: The secret string used to sign the token when it was created at login.
    // MUST match exactly — if different, verification will fail.
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_agripulse_ai');

    // ── Step 4: Attach User Info to the Request ──
    // decoded = { id: '64c3...', email: 'user@example.com', iat: ..., exp: ... }
    // We attach the decoded payload to req.user so route handlers can access it.
    // e.g. In predictRoutes.js: req.user.id gives us the logged-in user's MongoDB ID.
    req.user = decoded;

    // ── Step 5: Pass Control to the Next Handler ──
    // next(): Tells Express "this middleware is done, proceed to the route handler".
    // Without this call, the request would hang forever.
    next();

  } catch (error) {
    // Token is invalid (tampered with), expired, or signed with a different secret
    // 401 Unauthorized: The credentials provided are wrong or expired.
    return res.status(401).json({ error: 'Access denied. Invalid or expired token.' });
  }
};

// Export the middleware function so routes can import and use it.
// Usage: const authMiddleware = require('../middleware/auth')
module.exports = authMiddleware;
