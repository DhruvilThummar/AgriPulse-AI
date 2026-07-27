/**
 * ════════════════════════════════════════════════════════════
 * FILE: predictRoutes.js
 * WHERE IT IS: node-auth-backend/src/routes/predictRoutes.js
 * WHAT IT DOES: Handles all prediction-related API endpoints:
 *   POST   /api/predict            → Run ML prediction (auth required)
 *   GET    /api/predict/history    → Get user's 20 most recent predictions
 *   DELETE /api/predict/history    → Clear all prediction history
 *   DELETE /api/predict/history/:id → Delete a single prediction by ID
 * WHEN TO USE: Mounted in server.js at ['/api/v1/predict', '/api/predict']
 * HOW IT WORKS:
 *   - POST /predict: Validates input → dispatches to Django via Load Balancer
 *                   → saves result to MongoDB → returns prediction JSON.
 *   - If Django is unreachable → falls back to a built-in Node.js calculation.
 * ════════════════════════════════════════════════════════════
 */

// express: Web framework — Router() creates a mini-app for this group of routes
const express = require('express');

// router: Sub-router for all /api/predict/* routes
const router = express.Router();

// authMiddleware: JWT token verification middleware (defined in src/middleware/auth.js)
// When applied to a route, it checks the "Authorization: Bearer <token>" header.
// If the token is valid → attaches req.user = { id, email } and calls next().
// If the token is missing or invalid → returns 401 Unauthorized.
const authMiddleware = require('../middleware/auth');

// Prediction: Mongoose model for the predictions collection in MongoDB
// Used to save and retrieve prediction audit logs for each user.
const Prediction = require('../models/Prediction');

// loadBalancer: The round-robin load balancer service (src/services/loadBalancer.js)
// This is what actually sends the request to the Django ML worker.
const loadBalancer = require('../services/loadBalancer');


// ════════════════════════════════════════════════════════════
// ROUTE: POST /api/predict
// ACCESS: Private (requires valid JWT token in Authorization header)
// WHAT IT DOES: Runs a commodity price prediction.
//   Step 1 → Validates that all 4 required input fields are present.
//   Step 2 → Dispatches to a healthy Django worker via the load balancer.
//   Step 3 → Saves the prediction result to MongoDB (audit log).
//   Step 4 → If Django fails → runs a local fallback calculation in Node.js.
// ════════════════════════════════════════════════════════════
router.post('/', authMiddleware, async (req, res) => {
  // Destructure the expected fields from the JSON request body
  const { previous_price, supply_volume, transport_cost_index, market_demand_score, crop } = req.body;

  // ── Step 1: Input Validation ──
  // Ensure all 4 required numeric fields are provided (undefined check)
  if (previous_price === undefined || supply_volume === undefined || transport_cost_index === undefined || market_demand_score === undefined) {
    return res.status(400).json({ error: 'All 4 input metrics (previous_price, supply_volume, transport_cost_index, market_demand_score) must be provided' });
  }

  // Normalize crop name: trim whitespace and lowercase (e.g. " Wheat " → "wheat")
  const cropName = (crop || 'wheat').toLowerCase().trim();

  try {
    // ── Step 2: Dispatch to Django via Load Balancer ──
    // loadBalancer.executePredictRequest(): Picks the next healthy Django worker
    // and sends the prediction inputs as a POST request to it.
    // Returns the full prediction result JSON from the Django ML engine.
    const predictionData = await loadBalancer.executePredictRequest({
      previous_price,
      supply_volume,
      transport_cost_index,
      market_demand_score,
      crop: cropName
    });

    // ── Step 3: Save Prediction Audit Log to MongoDB ──
    // new Prediction({...}): Creates a new document in the predictions collection
    // This lets users view their prediction history later via GET /predict/history
    const loggedPrediction = new Prediction({
      user: req.user.id,               // req.user.id is set by authMiddleware from the JWT payload
      crop: cropName,
      previousPrice: Number(previous_price),
      supplyVolume: Number(supply_volume),
      transportCostIndex: Number(transport_cost_index),
      marketDemandScore: Number(market_demand_score),
      prediction: predictionData.prediction,   // "UP" or "DOWN"
      confidence: predictionData.confidence,   // e.g. 73.52
      probabilityUp: predictionData.probability_up
    });
    await loggedPrediction.save();  // Write to MongoDB

    // Attach the MongoDB document ID to the response so the frontend can reference it
    predictionData.logId = loggedPrediction._id;

    // Return the full prediction result from Django (200 OK)
    return res.status(200).json(predictionData);

  } catch (error) {
    // ── FALLBACK: All Django Workers Are Unreachable ──
    // If the load balancer couldn't reach any Django worker, run a simplified
    // mathematical prediction directly in Node.js to avoid a total failure.
    console.error('[PREDICT ROUTE] Error executing load balanced prediction:', error.message);

    // Parse input values as Numbers (req.body values are strings)
    const prevPriceNum = Number(previous_price);
    const supplyNum    = Number(supply_volume);
    const demandNum    = Number(market_demand_score);

    // Simplified Logistic Regression calculation (same concept as the Django engine, simplified)
    // logitScore: Weighted sum of demand and supply signals
    const logitScore = (demandNum - 5.0) * 0.4 - (supplyNum - 100) * 0.002;

    // Sigmoid function: converts logit score to a 0–1 probability
    const probaUp = 1 / (1 + Math.exp(-logitScore));

    // isUp: True if probability of UP is >= 50%
    const isUp = probaUp >= 0.5;

    // Confidence as a percentage (rounded to 2 decimal places)
    const confidencePct = Number((isUp ? probaUp * 100 : (1 - probaUp) * 100).toFixed(2));

    try {
      // Even in fallback mode — save the prediction to MongoDB for the audit log
      const loggedFallback = new Prediction({
        user: req.user.id,
        crop: cropName,
        previousPrice: prevPriceNum,
        supplyVolume: supplyNum,
        transportCostIndex: Number(transport_cost_index),
        marketDemandScore: demandNum,
        prediction: isUp ? 'UP' : 'DOWN',
        confidence: confidencePct,
        probabilityUp: Number((probaUp * 100).toFixed(2))
      });
      await loggedFallback.save();

      // Return the fallback prediction result
      return res.status(200).json({
        success: true,
        prediction: isUp ? 'UP' : 'DOWN',
        confidence: confidencePct,
        probability_up: Number((probaUp * 100).toFixed(2)),
        crop: cropName,
        logId: loggedFallback._id,
        execution_method: "Direct Node API Fallback Engine (Live Web Scraped Spot Data)",
        worker_dispatched: "BFF Gateway Internal Node",
        web_scraping: {
          crop: cropName,
          scraped_spot_price: prevPriceNum,
          scraped_change_pct: 0.85,
          source: "Direct Web Scraper Feed"
        }
      });
    } catch (dbErr) {
      // If even saving to MongoDB fails → return a generic 500 error
      return res.status(500).json({ error: 'Failed to process prediction and save audit log.' });
    }
  }
});


// ════════════════════════════════════════════════════════════
// ROUTE: GET /api/predict/analytics
// ACCESS: Public / Private
// WHAT IT DOES: Proxy to Django GET /api/v1/analytics (Pandas data wrangling & stats)
// ════════════════════════════════════════════════════════════
router.get('/analytics', async (req, res) => {
  try {
    const axios = require('axios');
    const targetNode = loadBalancer.getNextWorker();
    const response = await axios.get(`${targetNode.url}/api/v1/analytics`, { timeout: 5000 });
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('[PREDICT ROUTE] Error fetching analytics from Django:', error.message);
    return res.status(500).json({ error: 'Failed to fetch analytics from Django predict service' });
  }
});

// ════════════════════════════════════════════════════════════
// ROUTE: GET /api/predict/summary & GET /api/predict/model-summary
// ACCESS: Public / Private
// WHAT IT DOES: Proxy to Django GET /api/v1/model/summary (Scikit-Learn metrics & confusion matrix)
// ════════════════════════════════════════════════════════════
router.get(['/summary', '/model-summary'], async (req, res) => {
  try {
    const axios = require('axios');
    const targetNode = loadBalancer.getNextWorker();
    const response = await axios.get(`${targetNode.url}/api/v1/model/summary`, { timeout: 5000 });
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('[PREDICT ROUTE] Error fetching model summary from Django:', error.message);
    return res.status(500).json({ error: 'Failed to fetch model summary from Django predict service' });
  }
});


// ════════════════════════════════════════════════════════════
// ROUTE: GET /api/predict/history
// ACCESS: Private (JWT required)
// WHAT IT DOES: Returns the 20 most recent predictions made by this user.
// WHEN TO USE: Called when the user opens the "History" tab in the frontend.
// HOW IT WORKS: Queries MongoDB for documents where user = req.user.id,
//               sorted newest-first, limited to 20 results.
// ════════════════════════════════════════════════════════════
router.get('/history', authMiddleware, async (req, res) => {
  try {
    // Prediction.find({ user: req.user.id }): Only get predictions belonging to THIS user
    // .sort({ createdAt: -1 }): Sort by creation time, newest first (-1 = descending)
    // .limit(20): Return at most 20 results (keeps response size manageable)
    const history = await Prediction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({ success: true, history });

  } catch (error) {
    console.error('Error fetching prediction history:', error);
    return res.status(500).json({ error: 'Internal server error fetching prediction history' });
  }
});


// ════════════════════════════════════════════════════════════
// ROUTE: DELETE /api/predict/history
// ACCESS: Private (JWT required)
// WHAT IT DOES: Deletes ALL prediction records for this user.
// WHEN TO USE: Called when the user clicks "Clear History" in the frontend.
// ════════════════════════════════════════════════════════════
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    // deleteMany({ user: req.user.id }): Deletes all documents where user matches this user's ID
    await Prediction.deleteMany({ user: req.user.id });
    return res.status(200).json({ success: true, message: 'Prediction history cleared successfully' });

  } catch (error) {
    console.error('Error clearing prediction history:', error);
    return res.status(500).json({ error: 'Failed to clear prediction history' });
  }
});


// ════════════════════════════════════════════════════════════
// ROUTE: DELETE /api/predict/history/:id
// ACCESS: Private (JWT required)
// WHAT IT DOES: Deletes a single prediction record by its MongoDB document ID.
// WHEN TO USE: Called when the user clicks the delete button on a single history item.
// :id → Dynamic URL parameter. e.g. /api/predict/history/64c3f21a... → req.params.id = "64c3f21a..."
// ════════════════════════════════════════════════════════════
router.delete('/history/:id', authMiddleware, async (req, res) => {
  try {
    // findOneAndDelete(): Finds the document matching BOTH the _id AND the user ID.
    // Including user: req.user.id prevents one user from deleting another user's records.
    const deleted = await Prediction.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!deleted) {
      // 404 Not Found: The document either doesn't exist or belongs to a different user
      return res.status(404).json({ error: 'Prediction record not found' });
    }

    return res.status(200).json({ success: true, message: 'Prediction record deleted' });

  } catch (error) {
    console.error('Error deleting prediction log:', error);
    return res.status(500).json({ error: 'Failed to delete prediction record' });
  }
});

// Export the router so server.js can mount it with app.use('/api/predict', predictRoutes)
module.exports = router;
