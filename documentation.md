# 🌾 AgriPulse AI — End-to-End System Documentation

> **Comprehensive Technical Specification & Architecture Manual**  
> *Real-time agricultural commodity price intelligence powered by live web scraping, ensemble ML prediction, and a three-tier microservice architecture.*

---

## 📋 Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Architecture & Features (`react-frontend`)](#4-frontend-architecture--features-react-frontend)
   - [UI Design System & Aesthetics](#ui-design-system--aesthetics)
   - [Views & Component Breakdown](#views--component-breakdown)
   - [Client Services Layer](#client-services-layer)
   - [State Management & Flow](#state-management--flow)
5. [Backend BFF Gateway Architecture (`node-auth-backend`)](#5-backend-bff-gateway-architecture-node-auth-backend)
   - [Express Gateway & Middleware](#express-gateway--middleware)
   - [Load Balancer & Failover Mechanism](#load-balancer--failover-mechanism)
   - [Email & Notification Infrastructure](#email--notification-infrastructure)
   - [MongoDB Data Persistence](#mongodb-data-persistence)
6. [Django ML Microservice & Model Infrastructure (`django-predict-service`)](#6-django-ml-microservice--model-infrastructure-django-predict-service)
   - [ML Model Engine Architecture](#ml-model-engine-architecture)
   - [Feature Engineering Pipeline](#feature-engineering-pipeline)
   - [Mathematical Ensemble Formulation](#mathematical-ensemble-formulation)
   - [Web Scraping Engine Architecture](#web-scraping-engine-architecture)
7. [Complete End-to-End API Reference](#7-complete-end-to-end-api-reference)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Prediction & History Endpoints](#prediction--history-endpoints)
   - [Commodity & Market Data Endpoints](#commodity--market-data-endpoints)
   - [Subscription Endpoints](#subscription-endpoints)
   - [System Health Check Endpoints](#system-health-check-endpoints)
   - [Direct Django Microservice Endpoints](#direct-django-microservice-endpoints)
8. [Database Schema & Models](#8-database-schema--models)
9. [Supported Commodities Reference](#9-supported-commodities-reference)
10. [Environment Variables & Configuration](#10-environment-variables--configuration)
11. [Setup & Local Execution Guide](#11-setup--local-execution-guide)
12. [Security, Resiliency & Production Considerations](#12-security-resiliency--production-considerations)

---

## 1. System Overview

**AgriPulse AI** is an enterprise-grade agricultural intelligence and commodity market prediction platform designed specifically for Indian farmers, agricultural traders, APMC Mandi stakeholders, and agribusiness managers.

### Core Value Proposition
Agricultural commodity prices in India fluctuate rapidly based on local supply arrivals, freight inflation, consumer demand shifts, and international market trends. AgriPulse AI solves market information asymmetry by providing:
- **Live Spot Price Scraping**: Real-time aggregation of APMC Mandi prices and international commodity benchmarks.
- **Directional Trend Prediction**: Binary prediction (**UP** or **DOWN**) with confidence percentages and projected target prices for the next market session.
- **Ensemble Machine Learning**: Pure Python-driven mathematical ensemble model eliminating serialized binary weights dependencies (`.pkl` / `joblib`).
- **Resilient Microservices**: Round-robin load-balanced Django inference workers backed by a Node.js Backend-for-Frontend (BFF) and MongoDB audit storage.

---

## 2. High-Level System Architecture

The AgriPulse AI platform is structured around a **Three-Tier Microservices Architecture**:

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │                  React 18 Frontend                      │
                                  │              (Vite Dev Server, Port 5173)              │
                                  │  Hero │ Markets │ Analytics │ Orders │ Account │ FAQ    │
                                  └────────────────────────────┬────────────────────────────┘
                                                               │  HTTP / REST
                                                               │  Bearer JWT Header
                                                               ▼
                                  ┌─────────────────────────────────────────────────────────┐
                                  │          Node.js BFF Gateway (Express, Port 5000)       │
                                  │                                                         │
                                  │  • Auth Controller (JWT, bcrypt, 6-Digit Email OTP)     │
                                  │  • Commodity Controller (12-Sec Scraper Refresh Loop)    │
                                  │  • History Controller (MongoDB Audit Log Engine)        │
                                  │  • Round-Robin Load Balancer Service                    │
                                  │  • Nodemailer Alert Dispatcher                          │
                                  └──────────────┬──────────────────────────┬───────────────┘
                                                 │                          │
                        MongoDB Database         │                          │ Active Health Checks (15s)
               ┌─────────────────────────────────┴──┐                       │ Round-Robin Dispatch (5s timeout)
               │ User Accounts │ OTPs │ Predictions │                       ▼
               └────────────────────────────────────┘         ┌───────────────────────────┐
                                                              │   Round-Robin Load        │
                                                              │   Balancer Service        │
                                                              └─────────────┬─────────────┘
                                                                            │
                                                     ┌──────────────────────┴──────────────────────┐
                                                     ▼                                             ▼
                                      ┌─────────────────────────────┐               ┌─────────────────────────────┐
                                      │ Django ML Worker Node 1     │               │ Django ML Worker Node 2     │
                                      │ (Port 8000)                 │               │ (Port 8001 - Secondary)     │
                                      │                             │               │                             │
                                      │ • Direct API ML Engine      │               │ • Direct API ML Engine      │
                                      │ • Web Scraper Engine        │               │ • Web Scraper Engine        │
                                      │   (BS4 + Yahoo Finance API) │               │   (BS4 + Yahoo Finance API) │
                                      └──────────────┬──────────────┘               └──────────────┬──────────────┘
                                                     │                                             │
                                                     └──────────────────────┬──────────────────────┘
                                                                            │ HTTP On-Demand Requests
                                                                            ▼
                                                           ┌─────────────────────────────────┐
                                                           │  External Data Sources          │
                                                           │  • Yahoo Finance API (JSON)     │
                                                           │  • APMC Mandi Webpages (BS4)    │
                                                           └─────────────────────────────────┘
```

### Request Lifecycle Sequence
1. **User Request**: Client sends a request from the React SPA (e.g., predict price movement for `wheat`).
2. **Authentication**: Node.js BFF validates the JWT passed in `Authorization: Bearer <token>`.
3. **Dispatch & Load Balancing**: Node.js load balancer checks healthy Django workers and dispatches payload via HTTP POST to worker node (e.g. `http://127.0.0.1:8000/api/v1/predict`).
4. **Scraping & ML Inference**: Django worker executes `CommodityWebScraper` to retrieve live spot prices and 7-day historical benchmarks, feeds enriched features into `AgriPulseMLPredictor`, and computes ensemble predictions.
5. **Persistence & Response**: Django returns the prediction payload to Node.js BFF. Node.js logs the prediction into MongoDB (`predictions` collection) attached to the authenticated user's ID, and returns the response to React.

---

## 3. Technology Stack

| Layer | Technology | Version | Description & Role |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React | 18.2.0 | Single-page application framework |
| **Build Tooling** | Vite | 4.4.5 | Modern fast asset bundler and dev server |
| **Design System** | Custom Vanilla CSS | CSS3 | Dark-mode glassmorphic design system with standard CSS variables |
| **Iconography** | Google Material Icons | Outlined | Scalable vector glyphs |
| **BFF Framework** | Node.js / Express | 4.18.2 | Gateway server handling Auth, API proxy, and state persistence |
| **Database & ODM** | MongoDB & Mongoose | 7.3.1 | Document database storing users, OTPs, and prediction audit logs |
| **Auth & Security** | JWT & Bcrypt.js | 9.0 / 2.4 | Token authentication (7-day TTL) and password encryption |
| **Email Service** | Nodemailer | 6.9.3 | SMTP integration with automated Ethereal fallback in dev mode |
| **ML Microservice**| Python / Django | 3.10+ / 4.2.3 | REST microservice exposing prediction & scraping endpoints |
| **API Framework** | Django REST Framework| 3.14.0 | Serialization, input validation, and HTTP request routing |
| **Web Scraping** | BeautifulSoup4 / Requests | 4.12.2 / 2.31 | Live DOM parsing and HTTP endpoint scraping |
| **ML Mathematics**| Pure Python (`math`) | Standard | Mathematical ensemble (Logistic Regression + Gradient Boosted Tree) |

---

## 4. Frontend Architecture & Features (`react-frontend`)

Located in [`react-frontend/`](react-frontend/), the client interface is built with React 18 and Vite.

### UI Design System & Aesthetics
- **Theme**: Dark-mode glassmorphism palette using tailored CSS variables (`--bg-primary: #0a0d14`, `--card-bg: rgba(18, 24, 38, 0.75)`, `--accent-green: #10b981`).
- **Typography**: Inter / System sans-serif with clear visual hierarchy.
- **Interactions**: Smooth CSS transitions, active tab highlights, hover micro-animations, loading spinners, and modal dialog overlays.

### Views & Component Breakdown

#### 1. `Hero.jsx` — Public Landing Page
- Highlights platform capabilities, live trading stats ticker, model accuracy indicator (`94.7%`), and commodity coverage.
- Integrated newsletter subscription input form connected to `POST /api/subscribe`.
- Quick action CTA button launching `AuthModal.jsx`.

#### 2. `AuthModal.jsx` — Authentication Dialog
- **Dual Tab Interface**: User Login & Account Registration.
- **Interactive OTP Stage**: When signing up or attempting to log into an unverified account, transitions seamlessly to a 6-digit OTP input step.
- **Feedback & Validation**: Inline error messaging, loading state overlays, auto-login upon verification.

#### 3. `Dashboard.jsx` — Core Application Shell
- Maintains global active view state (`markets`, `analytics`, `orders`, `account`, `help`).
- Layout structure consisting of a collapsible `Sidebar.jsx` navigation bar and top `Navbar.jsx`.
- Automatically fetches and refreshes market data every 12 seconds when active.

#### 4. `MarketsView.jsx` — Real-Time Ticker & Price Board
- Displays grid cards and table rows for all 10 supported commodities.
- **Metrics Shown**: Current spot price (₹/Quintal), percentage change, trend direction (bullish vs. bearish tag), price range bounds, and volume estimates.
- Search filter by commodity name and tab switching between Grid and List layouts.

#### 5. `AnalyticsView.jsx` — Market Intelligence & Charts
- Dynamic SVG line charts displaying historical price trends and confidence distributions.
- Feature importance breakdown visualization (Demand Score impact, Freight Cost Index impact, Supply Volume weight).
- Commodity breakdown comparison tables with model prediction summary indicators.

#### 6. `OrdersView.jsx` — Interactive ML Prediction Portal & History
- **Prediction Input Form**:
  - Select target commodity crop (`wheat`, `rice`, `corn`, etc.).
  - Input `Previous Price` (₹/Quintal).
  - Input `Supply Volume` (Tons).
  - Input `Transport Cost Index` (baseline 100).
  - Input `Market Demand Score` (range 1.0 - 10.0).
- **Prediction Output Card**:
  - Result Badge: **UP** (green) or **DOWN** (red).
  - Confidence metric (%) & Probability score.
  - Calculated Target Price forecast.
  - Sub-model probability breakdown (Logistic Regression vs. Gradient Boosting).
  - Scraped live APMC spot price and 7-day average metrics attached to output.
- **Historical Audit Log Table**:
  - Displays last 20 predictions made by the user.
  - Search/filter capability.
  - Delete individual prediction record (`DELETE /api/predict/history/:id`) or clear all history (`DELETE /api/predict/history`).

#### 7. `AccountView.jsx` — User Profile & Session Dashboard
- Shows authenticated user details (Email, Account Verification Status, User ID, Registration Date).
- System connection status indicators (BFF API Gateway status, Django Worker Node status, Database connection status).
- Logout action trigger clearing `localStorage` tokens.

#### 8. `HelpCenter.jsx` — Documentation & Support FAQ
- Frequently Asked Questions regarding ML model metrics, scrapers, APMC Mandis, and API usage.
- Architecture explanation breakdown for platform users.

### Client Services Layer
- [`apiClient.js`](react-frontend/src/services/apiClient.js): Axios/Fetch abstraction wrapping HTTP calls. Automatically retrieves `token` from `localStorage` and appends `Authorization: Bearer <token>` header.
- [`predictService.js`](react-frontend/src/services/predictService.js): Wraps prediction execution, history retrieval, and record deletion calls.
- [`marketService.js`](react-frontend/src/services/marketService.js): Wraps market prices fetch, platform statistics fetch, and subscription requests.

---

## 5. Backend BFF Gateway Architecture (`node-auth-backend`)

Located in [`node-auth-backend/`](node-auth-backend/), the BFF layer isolates the frontend from ML microservices while providing authentication, logging, rate protection, and worker orchestration.

### Express Gateway & Middleware
- **Entry Point**: [`server.js`](node-auth-backend/server.js) initializes Express, connects to MongoDB, starts the load balancer health monitor, mounts routes, and seeds the default administrator account (`dhruvilthummar37@gmail.com`).
- **Auth Guard Middleware**: [`auth.js`](node-auth-backend/src/middleware/auth.js) intercepts protected requests, verifies the incoming JWT token against `JWT_SECRET`, decodes user claims, and injects `req.user`.

### Load Balancer & Failover Mechanism
Implemented in [`loadBalancer.js`](node-auth-backend/src/services/loadBalancer.js):
- **Round-Robin Queue**: Alternates dispatches across registered worker nodes (`DJANGO_WORKER_1`, `DJANGO_WORKER_2`).
- **Active Health Checks**: Sends `GET /api/v1/health` requests to all configured nodes every 15 seconds. Unresponsive nodes are marked inactive.
- **Request Timeout & Failover**: Each prediction request is executed with a 5,000ms timeout. If a worker node times out or throws a server error, the gateway automatically retries the request on an alternate healthy node.
- **Node Tagging**: Appends `"worker_dispatched": "Node-1"` or `"Node-2"` to response payloads for end-to-end telemetry.
- **BFF Built-In Fallback Engine**: If *all* Django workers are unreachable, the Node.js backend executes a fallback prediction engine locally so the user experience is never broken.

### Email & Notification Infrastructure
Implemented in [`nodemailer.js`](node-auth-backend/src/config/nodemailer.js):
- Configures SMTP transport using `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS`.
- **Ethereal Development Fallback**: If SMTP credentials are missing, automatically provisions an Ethereal test inbox and outputs preview URLs to the console.
- **Templates**: Generates styled HTML email templates for 6-digit OTP verification codes and subscription confirmations.

---

## 6. Django ML Microservice & Model Infrastructure (`django-predict-service`)

Located in [`django-predict-service/`](django-predict-service/), this stateless microservice provides machine learning prediction and live web scraping endpoints.

### ML Model Engine Architecture
Implemented in [`predictor_engine.py`](django-predict-service/model/predictor_engine.py):
- **Zero `.pkl` / `.joblib` Dependency**: Standard machine learning microservices rely on pickled binary files, which introduce security risks, version incompatibility, and memory bloat. AgriPulse AI implements explicit mathematical formulas directly in Python.
- **Stateless Execution**: Pure functions execute predictions instantly without loading heavy C-extension libraries.

### Feature Engineering Pipeline
Given inputs: `previous_price`, `supply_volume`, `transport_cost_index`, `market_demand_score`, and scraped spot data (`scraped_spot_price`, `historical_7d_avg`), the model computes normalized feature indicators:

| Feature Indicator | Mathematical Formula | Economic Interpretation |
| :--- | :--- | :--- |
| `spot_momentum` | $\frac{P_{spot} - P_{prev}}{P_{prev}}$ | Measures current spot price velocity |
| `historical_diff` | $\frac{P_{spot} - \bar{P}_{7d}}{\bar{P}_{7d}}$ | Quantifies deviation from weekly baseline |
| `demand_weight` | $(D_{score} - 5.0) \times 0.38$ | Demand above baseline drives price upward |
| `supply_pressure` | $-\left(\frac{S_{vol} - 100}{200}\right) \times 0.28$ | Over-supply suppresses market price |
| `freight_penalty` | $-\left(\frac{T_{index} - 100}{100}\right) \times 0.14$ | High transport costs reduce net mandi realization |
| `momentum_score` | $(M_{spot} \times 2.5) + (D_{hist} \times 1.5)$ | Blended short-term momentum coefficient |

### Mathematical Ensemble Formulation

The overall prediction probability $P(\text{UP})$ is derived from the arithmetic mean of two sub-models:

#### Sub-Model 1: Feature-Weighted Logistic Regression
Logit formula:
$$\text{logit}_{LR} = 0.15 + \text{demand\_weight} + \text{supply\_pressure} + \text{freight\_penalty} + \text{momentum\_score}$$

Sigmoid activation:
$$P_{LR}(\text{UP}) = \frac{1}{1 + e^{-\text{logit}_{LR}}}$$

#### Sub-Model 2: Simulated Gradient Boosting Decision Tree
Simulated decision path score:
$$\text{score}_{GBDT} = 0.20 + (D_{score} \times 0.08) - (S_{vol} \times 0.001) + (\text{momentum\_score} \times 2.2)$$

Sigmoid mapping:
$$P_{GBDT}(\text{UP}) = \frac{1}{1 + e^{-\text{score}_{GBDT}}}$$

#### Final Ensemble Output
$$P_{Ensemble}(\text{UP}) = \frac{P_{LR}(\text{UP}) + P_{GBDT}(\text{UP})}{2}$$

- **Classification Boundary**:
  - If $P_{Ensemble}(\text{UP}) \ge 0.50 \implies \mathbf{UP}$
  - If $P_{Ensemble}(\text{UP}) < 0.50 \implies \mathbf{DOWN}$
- **Confidence Metric**:
  $$\text{Confidence} = \begin{cases} P_{Ensemble}(\text{UP}) \times 100 & \text{if UP} \\ (1 - P_{Ensemble}(\text{UP})) \times 100 & \text{if DOWN} \end{cases}$$
- **Target Price Forecast**:
  - If $\mathbf{UP}: P_{target} = P_{prev} \times 1.038$ (+3.8%)
  - If $\mathbf{DOWN}: P_{target} = P_{prev} \times 0.970$ (-3.0%)

---

### Web Scraping Engine Architecture
Implemented in [`scraper.py`](django-predict-service/model/scraper.py):

#### Dual-Mode Scraping Strategy

```
                                  ┌─────────────────────────────┐
                                  │   Scraper Request Invoked   │
                                  └──────────────┬──────────────┘
                                                 │
                                ┌────────────────┴────────────────┐
                                ▼                                 ▼
                     International Commodity?           Domestic Indian Crop?
                     (wheat, rice, corn, etc.)          (mustard, groundnut, etc.)
                                │                                 │
                                ▼                                 ▼
                   ┌──────────────────────────┐      ┌──────────────────────────┐
                   │ Yahoo Finance JSON API   │      ┌ BeautifulSoup4 HTML DOM  │
                   │ Chart Endpoint Query     │      │ Class/Tag Regex Parser   │
                   └────────────┬─────────────┘      └────────────┬─────────────┘
                                │                                 │
                                └────────────────┬────────────────┘
                                                 │
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │ Data Normalization &        │
                                  │ Fallback Safeguard          │
                                  └─────────────────────────────┘
```

1. **Mode A — Yahoo Finance API Scraping**:
   - Queries `https://query1.financeapp.com/v8/finance/chart/{symbol}?interval=1d&range=7d`
   - Map: Wheat (`ZW=F`), Rice (`ZR=F`), Corn (`ZC=F`), Cotton (`CT=F`), Soybean (`ZS=F`), Sugarcane (`SB=F`).
   - Extracts current price, previous close, and historical array to compute relative price changes.
2. **Mode B — BeautifulSoup4 HTML DOM Scraping**:
   - Scrapes domestic Indian mandis for mustard, groundnut, turmeric, and chilli.
   - Parses target web elements using case-insensitive regex patterns matching price indicators.
3. **Resilience & Fallback**:
   - If network calls fail or remote structures change, the scraper triggers an automatic fallback returning baseline reference bounds (`min_bound = base * 0.72`, `max_bound = base * 1.32`) and logs status `SCRAPE_WARNING`.

---

## 7. Complete End-to-End API Reference

### Base URLs
- **Node.js BFF Gateway (Primary API)**: `http://localhost:5000/api`
- **Django ML Microservice (Direct / Worker)**: `http://localhost:8000/api/v1`

---

### Authentication Endpoints

#### `POST /api/auth/signup`
Registers a new user, hashes password, creates unverified user record with full name, and sends a personalized 6-digit OTP via email.

- **Request Body**:
```json
{
  "name": "Dhruvil Thummar",
  "email": "farmer@agripulse.ai",
  "password": "SecurePassword123"
}
```
- **Response `201 Created`**:
```json
{
  "message": "User registered. OTP sent to your email."
}
```
- **Errors**: `400 Bad Request` (Missing fields / Email already exists), `500 Internal Server Error`.

---

#### `POST /api/auth/verify-otp`
Verifies the 6-digit code sent to user email and marks account as verified.

- **Request Body**:
```json
{
  "email": "farmer@agripulse.ai",
  "otp": "482910"
}
```
- **Response `200 OK`**:
```json
{
  "message": "Account verified successfully"
}
```
- **Errors**: `400 Bad Request` (Invalid or expired OTP), `404 Not Found` (User not found).

---

#### `POST /api/auth/login`
Authenticates email and password. Returns JWT token valid for 7 days.

- **Request Body**:
```json
{
  "email": "farmer@agripulse.ai",
  "password": "SecurePassword123"
}
```
- **Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64c3f21a9b3e7c001a2b3d4e",
    "email": "farmer@agripulse.ai",
    "isVerified": true
  }
}
```
- **Errors**: `400 Bad Request` (Invalid credentials), `403 Forbidden` (Account unverified — auto-triggers new OTP email).

---

### Prediction & History Endpoints

#### `POST /api/predict` 🔒
Dispatches input parameters to ML load balancer, enriches with scraped data, computes ensemble prediction, and logs result to MongoDB.

- **Headers**: `Authorization: Bearer <jwt_token>`
- **Request Body**:
```json
{
  "crop": "wheat",
  "previous_price": 2450.0,
  "supply_volume": 120.5,
  "transport_cost_index": 105.0,
  "market_demand_score": 7.5
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "prediction": "UP",
  "confidence": 73.52,
  "probability_up": 73.52,
  "target_price": 2543,
  "crop": "wheat",
  "execution_method": "Direct API ML Model Engine (model/predictor_engine.py)",
  "worker_dispatched": "Node-1",
  "models": {
    "logistic_regression": {
      "prediction": "UP",
      "probability_up": 71.24
    },
    "gradient_boosting_tree": {
      "prediction": "UP",
      "probability_up": 75.80
    }
  },
  "web_scraping": {
    "crop": "wheat",
    "scraped_spot_price": 2465,
    "scraped_change_pct": 0.61,
    "min_bound": 1775,
    "max_bound": 3254,
    "historical_7d_avg": 2440,
    "source": "Live Web Scraper (BeautifulSoup4: ACTIVE)",
    "scrape_status": "SUCCESS"
  },
  "logId": "64c3f21a9b3e7c001a2b3d4e",
  "timestamp": "2026-07-27T13:30:00.000Z"
}
```

---

#### `GET /api/predict/history` 🔒
Fetches last 20 saved prediction records for the authenticated user.

- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "history": [
    {
      "_id": "64c3f21a9b3e7c001a2b3d4e",
      "crop": "wheat",
      "previousPrice": 2450,
      "supplyVolume": 120.5,
      "transportCostIndex": 105,
      "marketDemandScore": 7.5,
      "prediction": "UP",
      "confidence": 73.52,
      "probabilityUp": 73.52,
      "createdAt": "2026-07-27T13:30:00.000Z"
    }
  ]
}
```

---

#### `DELETE /api/predict/history` 🔒
Deletes all prediction audit records owned by the authenticated user.

- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Prediction history cleared successfully"
}
```

---

#### `DELETE /api/predict/history/:id` 🔒
Deletes a single prediction audit record by ID.

- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Prediction record deleted"
}
```

---

### Commodity & Market Data Endpoints

#### `GET /api/commodity-prices` 🔒
Returns live scraped APMC spot prices for all 10 commodities.

- **Headers**: `Authorization: Bearer <jwt_token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "commodities": [
    {
      "name": "Wheat (Premium)",
      "crop": "wheat",
      "price": "₹2,465",
      "priceNumeric": 2465,
      "unit": "Quintal",
      "change": "+0.61%",
      "bullish": true,
      "range": "₹2,000 - ₹3,500",
      "volume": "12,000 Tons",
      "icon": "eco",
      "source": "Live APMC Web Scraper"
    }
  ]
}
```

---

#### `GET /api/commodity-prices/platform-stats` 🌐 Public
Returns public aggregated platform metrics.

- **Response `200 OK`**:
```json
{
  "success": true,
  "modelAccuracy": "94.7%",
  "commoditiesCount": 10,
  "dailyVolume": "₹18.42B",
  "statesCovered": 18
}
```

---

### Subscription Endpoints

#### `POST /api/subscribe` 🌐 Public
Subscribes an email to volatility alerts and dispatches a personalized HTML confirmation email.

- **Request Body**:
```json
{
  "name": "Dhruvil Thummar",
  "email": "subscriber@example.com"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Subscription confirmation sent to subscriber@example.com",
  "previewUrl": "https://ethereal.email/message/..."
}
```

---

### System Health Check Endpoints

#### `GET /health` 🌐 Public (BFF Gateway)
- **Response `200 OK`**:
```json
{
  "status": "HEALTHY",
  "service": "AgriPulse AI BFF Backend Gateway",
  "version": "2.4.0",
  "target_django_service": "http://127.0.0.1:8000",
  "timestamp": "2026-07-27T13:30:00.000Z"
}
```

#### `GET /api/v1/health` 🌐 Public (Django ML Worker)
- **Response `200 OK`**:
```json
{
  "status": "HEALTHY",
  "service": "Django ML Predict Microservice",
  "version": "2.4.0",
  "worker_node": "Worker-Node-127.0.0.1:8000",
  "uptime_seconds": 3742.5,
  "active_engine": "Direct API ML Model Engine (model/package, Zero .pkl dependency)",
  "timestamp": "2026-07-27T13:30:00.000Z"
}
```

---

### Direct Django Microservice Endpoints

#### `POST /api/v1/predict` 🌐 Public (Internal worker endpoint)
Direct prediction endpoint on Django worker. Bypasses JWT validation (intended for backend-to-backend communication).

#### `GET /api/v1/commodities` 🌐 Public (Internal worker endpoint)
Returns live dynamically scraped crop benchmark definitions directly from Python scraper engine.

---

## 8. Database Schema & Models

MongoDB is used for persistence via Mongoose. The database name is `agripulse`.

### 1. `User` Schema ([`User.js`](node-auth-backend/src/models/User.js))
Stores user credentials, full name, and verification status.

```javascript
{
  name: { type: String, trim: true, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}
```

### 2. `Otp` Schema ([`Otp.js`](node-auth-backend/src/models/Otp.js))
Stores ephemeral 6-digit email verification codes. Uses MongoDB TTL index to auto-delete expired records.

```javascript
{
  email: { type: String, required: true },
  otpCode: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } } // Auto-deletes after 5 minutes
}
```

### 3. `Prediction` Schema ([`Prediction.js`](node-auth-backend/src/models/Prediction.js))
Stores historical prediction records tied to specific users for auditing.

```javascript
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  crop: { type: String, required: true },
  previousPrice: { type: Number, required: true },
  supplyVolume: { type: Number, required: true },
  transportCostIndex: { type: Number, required: true },
  marketDemandScore: { type: Number, required: true },
  prediction: { type: String, required: true }, // "UP" or "DOWN"
  confidence: { type: Number, required: true },
  probabilityUp: { type: Number, required: true },
  targetPrice: { type: Number },
  executionMethod: { type: String },
  workerDispatched: { type: String },
  createdAt: { type: Date, default: Date.now }
}
```

---

## 9. Supported Commodities Reference

| Commodity | Code Key | Scraper Mode | Benchmark Symbol / Source | Typical Spot Price Range | Trading Unit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wheat** | `wheat` | Yahoo Finance API | `ZW=F` | ₹2,000 - ₹3,500 | Quintal (100 kg) |
| **Rice** | `rice` | Yahoo Finance API | `ZR=F` | ₹3,000 - ₹5,000 | Quintal (100 kg) |
| **Corn (Maize)** | `corn` | Yahoo Finance API | `ZC=F` | ₹1,800 - ₹2,800 | Quintal (100 kg) |
| **Cotton** | `cotton` | Yahoo Finance API | `CT=F` | ₹5,500 - ₹8,500 | Quintal (100 kg) |
| **Soybean** | `soybean` | Yahoo Finance API | `ZS=F` | ₹4,000 - ₹6,500 | Quintal (100 kg) |
| **Sugarcane** | `sugarcane` | Yahoo Finance API | `SB=F` | ₹300 - ₹450 | Quintal (100 kg) |
| **Mustard** | `mustard` | BeautifulSoup4 | APMC Mandis DOM | ₹5,000 - ₹7,500 | Quintal (100 kg) |
| **Groundnut** | `groundnut` | BeautifulSoup4 | APMC Mandis DOM | ₹6,000 - ₹8,500 | Quintal (100 kg) |
| **Turmeric** | `turmeric` | BeautifulSoup4 | APMC Mandis DOM | ₹12,000 - ₹18,000 | Quintal (100 kg) |
| **Chilli** | `chilli` | BeautifulSoup4 | APMC Mandis DOM | ₹15,000 - ₹25,000 | Quintal (100 kg) |

---

## 10. Environment Variables & Configuration

### 1. Node.js BFF Gateway — [`node-auth-backend/.env`](node-auth-backend/.env)

```env
# Server Port Configuration
PORT=5000

# MongoDB Database Connection String
MONGO_URI=mongodb://127.0.0.1:27017/agripulse

# JSON Web Token Encryption Secret Key
JWT_SECRET=super_secret_jwt_key_agripulse_ai

# Django ML Service Target Routes
DJANGO_SERVICE_URL=http://127.0.0.1:8000
DJANGO_PREDICT_ENDPOINT=/api/v1/predict
DJANGO_HEALTH_ENDPOINT=/api/v1/health
DJANGO_COMMODITIES_ENDPOINT=/api/v1/commodities

# Load Balancer Django Worker Worker Pools
DJANGO_WORKER_1=http://127.0.0.1:8000
DJANGO_WORKER_2=http://127.0.0.1:8001

# SMTP Email Transport Credentials (OTP & Subscriptions)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=noreply@agripulse.ai
```

### 2. Django ML Microservice — [`django-predict-service/.env`](django-predict-service/.env)

```env
# Django Server Host and Port
PORT=8000
HOST=127.0.0.1

# API V1 Route Registration
API_V1_PREDICT_ROUTE=/api/v1/predict
API_V1_HEALTH_ROUTE=/api/v1/health
API_V1_COMMODITIES_ROUTE=/api/v1/commodities

# Public Scraper Mode (Leave empty for BeautifulSoup4 + Yahoo mode)
COMMODITY_API_KEY=
```

---

## 11. Setup & Local Execution Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **Python**: v3.10 or higher
- **MongoDB**: Community Edition v6.x (running locally on port `27017` or via MongoDB Atlas connection string)

### Terminal 1: Django ML Microservice

```bash
cd "django-predict-service"

# Install Python requirements
pip install -r requirements.txt

# Start Django development worker on Port 8000
python manage.py runserver 8000
```

### Terminal 2: Node.js BFF Gateway

```bash
cd "node-auth-backend"

# Install Node dependencies
npm install

# Start Gateway server on Port 5000
npm run dev
```

### Terminal 3: React Frontend

```bash
cd "react-frontend"

# Install Node dependencies
npm install

# Launch Vite Dev Server on Port 5173
npm run dev
```

Access application UI at: **`http://localhost:5173`**

### Pre-configured Seed Credentials
Upon startup, the BFF automatically registers a seed administrator user:
- **Email**: `dhruvilthummar37@gmail.com`
- **Password**: `Dhruvil@1303`

---

## 12. Security, Resiliency & Production Considerations

1. **Authentication & Password Security**:
   - Password hashing uses `bcryptjs` with 10 salt rounds.
   - OTP codes are generated via `crypto.randomInt` and expire automatically in 5 minutes via MongoDB TTL indexes.
2. **Stateless ML Execution**:
   - Zero `.pkl` dependency prevents binary object injection vulnerabilities.
3. **High Availability & Fault Tolerance**:
   - Round-robin load balancer guarantees zero downtime if a Django worker node crashes.
   - Local BFF fallback prediction engine ensures uptime even if all Django nodes fail.
4. **Scraping Safeguards**:
   - Resilient exception handlers wrap web scraping routines. If Yahoo Finance or APMC web sources throttle requests, baseline pricing safety bounds prevent system failures.
5. **Production Readiness Roadmap**:
   - Enable HTTPS via Nginx reverse proxy.
   - Implement rate limiting (`express-rate-limit` for Node.js, Django REST Framework Throttling).
   - Set `DEBUG = False` in Django `settings.py` and restrict `ALLOWED_HOSTS` and CORS origin domains.
