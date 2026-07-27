/**
 * ════════════════════════════════════════════════════════════
 * FILE: loadBalancer.js
 * WHERE IT IS: node-auth-backend/src/services/loadBalancer.js
 * WHAT IT DOES: Distributes incoming prediction requests across
 *               multiple Django ML worker server instances using
 *               the Round-Robin algorithm.
 *               Also pings each worker every 15 seconds to detect
 *               if any worker has gone offline (health monitoring).
 * WHEN TO USE: Used in predictRoutes.js → loadBalancer.executePredictRequest(...)
 * HOW IT WORKS:
 *   1. Maintains a list of Django worker URLs (WORKER_NODES array).
 *   2. Uses round-robin to pick the next healthy worker for each request.
 *   3. If the selected worker fails → automatically retries on the other worker.
 * ════════════════════════════════════════════════════════════
 */

// axios: HTTP client library for Node.js — used to make HTTP requests to Django workers
const axios = require('axios');

/**
 * WORKER_NODES: The list of all available Django ML worker server instances.
 * Each entry has:
 *   id      → Human-readable name (e.g. "Node-1") for logging
 *   url     → The base URL of the worker (read from .env or defaults to localhost)
 *   healthy → Whether this worker is currently responding to health pings
 *
 * In production, add more nodes here or configure them via environment variables
 * (DJANGO_WORKER_1, DJANGO_WORKER_2, etc.) in the .env file.
 */
const WORKER_NODES = [
  { id: 'Node-1', url: process.env.DJANGO_WORKER_1 || 'http://127.0.0.1:8000', healthy: true },
  { id: 'Node-2', url: process.env.DJANGO_WORKER_2 || 'http://127.0.0.1:8001', healthy: true }
];

// currentIndex: Tracks which worker to use NEXT in the round-robin rotation.
// Starts at 0 (first worker). Increments after each request and wraps back to 0.
let currentIndex = 0;

/**
 * FUNCTION: checkWorkerHealth
 * WHAT IT DOES: Sends a GET request to each worker's /health endpoint.
 *               If the worker responds with { status: 'HEALTHY' } → marks it as healthy.
 *               If the request fails (timeout or error) → marks it as unhealthy.
 * WHEN IT RUNS: Once at startup, then every 15 seconds (via setInterval below).
 * WHY: Ensures the load balancer never sends requests to a dead worker.
 */
async function checkWorkerHealth() {
  // DJANGO_HEALTH_ENDPOINT: The health check URL path (from .env, default: /api/v1/health)
  const healthEndpoint = process.env.DJANGO_HEALTH_ENDPOINT || '/api/v1/health';

  // Loop through every worker node and ping its health endpoint
  for (const node of WORKER_NODES) {
    try {
      // Make a GET request to the worker's health endpoint with a 2-second timeout
      const response = await axios.get(`${node.url}${healthEndpoint}`, { timeout: 2000 });

      // If the response is 200 OK and the status field says HEALTHY → mark as healthy
      if (response.status === 200 && response.data?.status === 'HEALTHY') {
        node.healthy = true;
      } else {
        node.healthy = false;  // Worker responded but not healthy
      }
    } catch (err) {
      // Request failed (timeout or connection refused)
      // Special case: Node-1 (port 8000) is always kept "alive" as a fallback.
      // This prevents total failure when only one Django instance is running locally.
      if (node.url.includes('8000')) {
        node.healthy = true;   // Keep primary worker as healthy (optimistic fallback)
      } else {
        node.healthy = false;  // Secondary workers → mark as down if unreachable
      }
    }
  }
}

// Run health check immediately when this module is first loaded
checkWorkerHealth();

// setInterval(fn, ms): Runs checkWorkerHealth() every 15,000ms (15 seconds) in the background.
// This keeps the health status always up-to-date without manual intervention.
setInterval(checkWorkerHealth, 15000);

/**
 * CLASS: LoadBalancer
 * WHAT IT IS: The main load balancer logic encapsulated in a class.
 * WHEN TO USE: Imported and used in predictRoutes.js:
 *   const loadBalancer = require('./loadBalancer');
 *   const result = await loadBalancer.executePredictRequest(payload);
 */
class LoadBalancer {

  /**
   * METHOD: getNextWorker
   * WHAT IT DOES: Uses the Round-Robin algorithm to pick the next available healthy worker.
   * HOW ROUND-ROBIN WORKS:
   *   Request 1 → Node-1
   *   Request 2 → Node-2
   *   Request 3 → Node-1 (back to start)
   *   Request 4 → Node-2 ...and so on
   * RETURNS: A worker node object { id, url, healthy }
   */
  getNextWorker() {
    // Filter the list to only include workers marked as healthy
    const healthyNodes = WORKER_NODES.filter(n => n.healthy);

    // If ALL workers are down → use the first worker anyway (last resort)
    if (healthyNodes.length === 0) {
      return WORKER_NODES[0];  // Fallback to Node-1 even if unhealthy
    }

    // Pick the next worker in rotation using the modulo (%) operator.
    // currentIndex % healthyNodes.length ensures we wrap around when we reach the end.
    const selectedNode = healthyNodes[currentIndex % healthyNodes.length];

    // Advance the index for next time, wrapping around with modulo
    currentIndex = (currentIndex + 1) % healthyNodes.length;

    return selectedNode;
  }

  /**
   * METHOD: executePredictRequest
   * WHAT IT DOES: Sends the prediction request payload to the next healthy Django worker.
   *               If that worker fails → automatically retries on the other worker (failover).
   * PARAMETERS:
   *   payload → Object with prediction inputs (previous_price, supply_volume, etc.)
   * RETURNS: The JSON response from the Django worker (prediction result)
   * THROWS: Error if BOTH workers fail to respond
   */
  async executePredictRequest(payload) {
    // Select the next available worker using round-robin
    const targetNode = this.getNextWorker();

    // Build the full predict endpoint URL from the worker's base URL + predict path
    const predictEndpoint = process.env.DJANGO_PREDICT_ENDPOINT || '/api/v1/predict';
    const endpointUrl     = `${targetNode.url}${predictEndpoint}`;

    console.log(`[LOAD BALANCER] Dispatching prediction request to ${targetNode.id} (${endpointUrl})`);

    try {
      // Send POST request to the Django worker with the prediction payload
      // timeout: 12000ms = 12 seconds max wait for ML model inference + live web scraping
      const response = await axios.post(endpointUrl, payload, { timeout: 12000 });

      // Attach which worker handled this request (for frontend display/debugging)
      response.data.worker_dispatched = targetNode.id;

      // Return the Django response data (prediction result)
      return response.data;

    } catch (err) {
      // ── FAILOVER LOGIC ──
      // Primary worker failed → try the other worker in the pool
      console.warn(`[LOAD BALANCER] Worker ${targetNode.id} failed (${err.message}). Attempting failover...`);

      // Find any other worker that is NOT the one that just failed
      const fallbackNode = WORKER_NODES.find(n => n.id !== targetNode.id && n.healthy) || WORKER_NODES[0];
      const fallbackUrl  = `${fallbackNode.url}${predictEndpoint}`;

      // Try the fallback worker — if this also fails, the error bubbles up to the route handler
      const fallbackResponse = await axios.post(fallbackUrl, payload, { timeout: 12000 });
      fallbackResponse.data.worker_dispatched = `${fallbackNode.id} (Failover)`;

      return fallbackResponse.data;
    }
  }
}

// Export a single shared instance of LoadBalancer (Singleton pattern).
// Every file that does require('./loadBalancer') gets the SAME instance,
// preserving the currentIndex counter across requests.
module.exports = new LoadBalancer();
