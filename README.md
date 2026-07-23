# 🌾 AgriPulse AI

> **Real-time agricultural commodity price intelligence powered by live web scraping, ensemble ML prediction, and a three-tier microservice architecture.**

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js&logoColor=white)
![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat-square&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [API Reference](#-api-reference)
  - [Authentication](#-authentication)
  - [Predictions](#-predictions)
  - [Commodity Prices](#-commodity-prices)
  - [Subscriptions](#-subscriptions)
  - [Health Checks](#-health-checks)
  - [Django Direct Endpoints](#-django-direct-endpoints)
- [ML Model](#-ml-model)
- [Web Scraping Engine](#-web-scraping-engine)
- [Load Balancer](#-load-balancer)
- [Authentication Flow](#-authentication-flow)
- [Frontend Views](#-frontend-views)
- [Implementation Status](#-implementation-status)
- [Known Limitations](#-known-limitations)

---

## 🌾 Overview

**AgriPulse AI** is a full-stack agricultural intelligence platform built for Indian farmers and commodity traders. It predicts short-term price direction (UP or DOWN) for 10 major Indian commodities using live market data and a mathematical ML ensemble.

**Key capabilities:**

| Capability | Detail |
| :--- | :--- |
| 🤖 ML Prediction | Ensemble of Logistic Regression + Gradient Boosting, zero `.pkl` dependency |
| 🌐 Live Scraping | BeautifulSoup4 HTML + Yahoo Finance JSON API — all data on-demand |
| ⚖️ Load Balancing | Round-robin across multiple Django workers with auto-failover |
| 🔐 Auth | OTP email verification + JWT session tokens (7-day) |
| 📊 Markets | 10 commodity tickers updated every 12 seconds |
| 📜 History | MongoDB audit log of all predictions per user |

**Supported commodities:** `wheat` · `rice` · `corn` · `cotton` · `soybean` · `sugarcane` · `mustard` · `groundnut` · `turmeric` · `chilli`

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     React Frontend                            │
│              (Vite + React, Port 5173)                       │
│   Dashboard │ Markets │ Predictions │ Analytics │ Orders     │
└──────────────────────┬───────────────────────────────────────┘
                        │  HTTP  ·  JWT Bearer Token
                        ▼
┌──────────────────────────────────────────────────────────────┐
│           Node.js BFF Gateway (Express, Port 5000)           │
│                                                              │
│  /api/auth/*            → Auth Routes   (Signup/Login/OTP)   │
│  /api/predict/*         → Predict Routes → Load Balancer     │
│  /api/commodity-prices  → Commodity Routes (Live Scraper)    │
│  /api/subscribe         → Subscribe Routes (Email)           │
│                                                              │
│  MongoDB ← User · OTP · Prediction Models (Mongoose)         │
└───────────────────────┬──────────────────────────────────────┘
                         │  Round-Robin HTTP Dispatch (5s timeout)
             ┌───────────┴────────────┐
             ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐
│  Django Worker 1    │  │  Django Worker 2    │
│  Port 8000          │  │  Port 8001          │
│                     │  │                     │
│  POST /api/v1/predict│  │  POST /api/v1/predict│
│  GET  /api/v1/health │  │  GET  /api/v1/health │
│  GET  /api/v1/commo… │  │  GET  /api/v1/commo… │
│                     │  │                     │
│  ┌───────────────┐  │  │  ┌───────────────┐  │
│  │  Web Scraper  │  │  │  │  Web Scraper  │  │
│  │  ML Engine    │  │  │  │  ML Engine    │  │
│  └───────────────┘  │  │  └───────────────┘  │
└─────────────────────┘  └─────────────────────┘
          │                          │
          └────────────┬─────────────┘
                       ▼
       Yahoo Finance API · APMC Mandi Websites
            (On-demand · BeautifulSoup4)
```

---

## 🛠 Tech Stack

### Frontend — [`react-frontend/`](react-frontend/)

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| [React](https://react.dev) | 18.x | UI framework |
| [Vite](https://vitejs.dev) | 4.x | Build tool & dev server |
| Vanilla CSS | — | Design system & animations |
| Google Material Icons | — | Icon library |

### Node.js BFF — [`node-auth-backend/`](node-auth-backend/)

| Package | Version | Purpose |
| :--- | :--- | :--- |
| [Express](https://expressjs.com) | 4.18 | HTTP server & routing |
| [Mongoose](https://mongoosejs.com) | 7.3 | MongoDB ODM |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9.0 | JWT signing & verification |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 2.4 | Password hashing |
| [nodemailer](https://nodemailer.com) | 6.9 | SMTP email sending |
| [axios](https://axios-http.com) | 1.4 | HTTP client (Django dispatch) |
| [dotenv](https://github.com/motdotla/dotenv) | 16.3 | `.env` loader |
| [cors](https://github.com/expressjs/cors) | 2.8 | CORS headers |

### Django Microservice — [`django-predict-service/`](django-predict-service/)

| Package | Version | Purpose |
| :--- | :--- | :--- |
| [Django](https://djangoproject.com) | 4.2 | Web framework |
| [djangorestframework](https://www.django-rest-framework.org) | 3.x | REST API serializers & views |
| [django-cors-headers](https://github.com/adamchainz/django-cors-headers) | 3.x | CORS support |
| [beautifulsoup4](https://www.crummy.com/software/BeautifulSoup) | 4.x | HTML DOM scraping |

### Database

| Technology | Role |
| :--- | :--- |
| [MongoDB](https://www.mongodb.com) | User accounts · OTP codes · Prediction logs |

---

## ✨ Features

### 🔐 Authentication & Security

Source: [authRoutes.js](node-auth-backend/src/routes/authRoutes.js) · [auth.js](node-auth-backend/src/middleware/auth.js)

- **User Registration** with bcrypt password hashing (10 salt rounds)
- **OTP Email Verification** — 6-digit code, 5-minute TTL, auto-deleted from MongoDB after use
- **JWT Session Tokens** — 7-day validity, signed with a configurable secret
- **Protected Routes** — all prediction and market endpoints require `Authorization: Bearer <token>`
- **Seed User** — default account auto-created at Node.js startup

### 📊 ML Prediction Engine

Source: [predictor_engine.py](django-predict-service/model/predictor_engine.py)

- **Ensemble Model** combining two sub-models:
  - Logistic Regression (feature-weighted sigmoid probability)
  - Gradient Boosting Decision Tree (simulated tree score)
- **Zero `.pkl` dependency** — all math implemented directly in Python, no scikit-learn or joblib
- **Live-data enrichment** — scraped spot prices and 7-day averages are fed into the model before inference
- **UP / DOWN forecast** with confidence %, probability %, and target price

### 🌐 Live Web Scraping

Source: [scraper.py](django-predict-service/model/scraper.py)

- **BeautifulSoup4 HTML DOM parser** for domestic Indian crops (mustard, groundnut, turmeric, chilli)
- **Yahoo Finance JSON API** for internationally traded symbols (`ZW=F` `ZR=F` `ZC=F` `CT=F` `ZS=F` `SB=F`)
- **Zero static data** — all 10 commodities scraped on-demand per request
- **Graceful fallback** — if scraping fails, the ML engine runs with baseline reference prices
- **Background scraper loop** in Node.js commodity routes — refreshes every 12 seconds

### ⚖️ Round-Robin Load Balancer

Source: [loadBalancer.js](node-auth-backend/src/services/loadBalancer.js)

- **Configurable worker pool** — add as many Django workers as needed via `.env`
- **Active health monitoring** — pings each worker's `/api/v1/health` every 15 seconds
- **Automatic failover** — if the selected worker times out, retries on another node
- **Node tagging** — every response includes `worker_dispatched` for traceability

### 📈 Real-Time Market Data

Source: [commodityRoutes.js](node-auth-backend/src/routes/commodityRoutes.js)

- **10 commodity tickers** with live price, percentage change, and trend direction (bullish/bearish)
- **Platform statistics** endpoint — total INR trading volume, model accuracy, states covered
- **12-second background scrape cycle** — prices auto-refresh without any client request

### 📧 Subscription Alerts

Source: [subscribeRoutes.js](node-auth-backend/src/routes/subscribeRoutes.js) · [nodemailer.js](node-auth-backend/src/config/nodemailer.js)

- **Email subscription** with styled HTML confirmation email
- **Nodemailer SMTP** — works with Gmail, Outlook, SendGrid, or any custom SMTP server
- **Ethereal test fallback** — auto-creates a free test inbox when SMTP is not configured (dev mode)

### 📜 Prediction History

Source: [predictRoutes.js](node-auth-backend/src/routes/predictRoutes.js) · [Prediction.js](node-auth-backend/src/models/Prediction.js)

- **MongoDB audit log** — every prediction is saved with full inputs and outputs
- **Per-user isolation** — users can only see and delete their own records
- **Last 20 results** returned on history fetch
- **DELETE single** or **DELETE all** history entries

---

## 📁 Project Structure

```
d:/Code/SEM 4/
├── README.md
│
├── react-frontend/                    ← Port 5173
│   └── src/
│       ├── App.jsx                    ← Root · auth state · routing
│       ├── main.jsx                   ← Vite entry
│       ├── index.css                  ← Design system · CSS variables
│       ├── components/
│       │   ├── Dashboard.jsx          ← App shell · sidebar layout
│       │   ├── Hero.jsx               ← Landing page
│       │   ├── AuthModal.jsx          ← Login · Signup · OTP forms
│       │   ├── Sidebar.jsx            ← Navigation sidebar
│       │   ├── Navbar.jsx             ← Top bar
│       │   ├── MarketsView.jsx        ← Live price tickers
│       │   ├── AnalyticsView.jsx      ← Charts · analytics
│       │   ├── OrdersView.jsx         ← Prediction form · history table
│       │   ├── AccountView.jsx        ← User profile
│       │   └── HelpCenter.jsx         ← FAQ
│       └── services/
│           ├── apiClient.js           ← Base fetch wrapper · JWT injection
│           ├── predictService.js      ← Prediction API calls
│           └── marketService.js       ← Market · subscription API calls
│
├── node-auth-backend/                 ← Port 5000
│   ├── server.js                      ← Express entry · route mounting · seed user
│   ├── .env                           ← ⚠ Environment variables
│   └── src/
│       ├── config/
│       │   ├── db.js                  ← MongoDB connection (Mongoose)
│       │   └── nodemailer.js          ← SMTP setup · sendOtpEmail()
│       ├── middleware/
│       │   └── auth.js                ← JWT guard middleware
│       ├── models/
│       │   ├── User.js                ← Schema: email · password · isVerified
│       │   ├── Otp.js                 ← Schema: email · code · TTL auto-expire
│       │   └── Prediction.js          ← Schema: inputs · prediction · confidence
│       ├── routes/
│       │   ├── authRoutes.js          ← /api/auth/*
│       │   ├── predictRoutes.js       ← /api/predict/*
│       │   ├── commodityRoutes.js     ← /api/commodity-prices/*
│       │   └── subscribeRoutes.js     ← /api/subscribe
│       └── services/
│           └── loadBalancer.js        ← Round-robin · health checks · failover
│
└── django-predict-service/            ← Port 8000
    ├── manage.py                      ← Django CLI
    ├── requirements.txt               ← django · drf · corsheaders · bs4
    ├── .env                           ← ⚠ Environment variables
    ├── predict_service/
    │   ├── settings.py                ← Django configuration (no DB, no admin)
    │   └── urls.py                    ← Root URL router → api/
    └── api/
        ├── apps.py                    ← AppConfig · startup banner
        ├── urls.py                    ← v1/predict · v1/health · v1/commodities
        ├── views.py                   ← PredictView · HealthCheckView · CommodityListView
        ├── serializers.py             ← DRF input validation · response serializers
        └── model/
            ├── __init__.py            ← Package exports
            ├── scraper.py             ← BeautifulSoup4 · Yahoo Finance scraper
            └── predictor_engine.py    ← Ensemble ML engine (pure Python math)
```

---

## ⚙️ Prerequisites

| Tool | Minimum Version | Install |
| :--- | :--- | :--- |
| Node.js | 18.x | <https://nodejs.org> |
| Python | 3.10+ | <https://python.org> |
| MongoDB Community | 6.x | <https://www.mongodb.com/try/download/community> |
| pip | Latest | Bundled with Python |
| npm | 9.x | Bundled with Node.js |

> **MongoDB must be running** before starting the Node.js server.  
> Start with `mongod` in a terminal or use [MongoDB Compass](https://www.mongodb.com/products/compass).

---

## 🔑 Environment Variables

### Node.js BFF — [`node-auth-backend/.env`](node-auth-backend/.env)

```env
# ── Server ──────────────────────────────────────
PORT=5000

# ── MongoDB ─────────────────────────────────────
# Local: mongodb://127.0.0.1:27017/agripulse
# Cloud: mongodb+srv://user:pass@cluster.mongodb.net/agripulse
MONGO_URI=mongodb://127.0.0.1:27017/agripulse

# ── JWT ─────────────────────────────────────────
# Replace with a long random string in production
JWT_SECRET=super_secret_jwt_key_agripulse_ai

# ── Django Microservice ──────────────────────────
DJANGO_SERVICE_URL=http://127.0.0.1:8000
DJANGO_PREDICT_ENDPOINT=/api/v1/predict
DJANGO_HEALTH_ENDPOINT=/api/v1/health
DJANGO_COMMODITIES_ENDPOINT=/api/v1/commodities

# ── Load Balancer Worker Nodes ───────────────────
DJANGO_WORKER_1=http://127.0.0.1:8000
DJANGO_WORKER_2=http://127.0.0.1:8001

# ── SMTP (OTP + Subscription emails) ────────────
# Gmail: generate an App Password at myaccount.google.com → Security → App Passwords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=noreply@agripulse.ai

# Optional: separate account for subscription emails
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password_here
# EMAIL_SERVICE=gmail
```

> **No SMTP?** Leave the SMTP fields empty. OTP codes will be printed to the server console instead — perfect for development.

---

### Django Microservice — [`django-predict-service/.env`](django-predict-service/.env)

```env
# ── Server ──────────────────────────────────────
PORT=8000
HOST=127.0.0.1

# ── API Route Reference ──────────────────────────
API_V1_PREDICT_ROUTE=/api/v1/predict
API_V1_HEALTH_ROUTE=/api/v1/health
API_V1_COMMODITIES_ROUTE=/api/v1/commodities

# ── Commodity API Key (optional) ─────────────────
# Leave empty to use public BeautifulSoup4 scraper mode (recommended for dev)
COMMODITY_API_KEY=
```

---

## 🚀 Running the Project

Open **three separate terminal windows** and run one command in each.

### Step 1 — Django ML Microservice

```bash
cd "d:/Code/SEM 4/django-predict-service"

# First time only — install Python dependencies
pip install -r requirements.txt

# Start Django on port 8000
python manage.py runserver
```

**Expected output:**

```
=====================================================================
 🌾 AGRI-PULSE AI — DIRECT ML ENGINE ONLINE
 🌐 Real-Time Web Scraping Pipeline Active: ON DEMAND
 🔑 API Key Reference: PUBLIC_SCRAPER_MODE (No Key Required)
=====================================================================
Starting development server at http://127.0.0.1:8000/
```

---

### Step 2 — Node.js BFF Gateway

```bash
cd "d:/Code/SEM 4/node-auth-backend"

# First time only — install Node dependencies
npm install

# Production start
npm start

# Development start (auto-reload on file save)
npm run dev
```

**Expected output:**

```
>>> MongoDB Connected: 127.0.0.1 <<<
[SEED] Default user 'dhruvilthummar37@gmail.com' already exists in database.
=================================================
  BFF Node.js server running on port 5000
  Target Django Predict service: http://127.0.0.1:8000
=================================================
[LOAD BALANCER] Health check ping → Node-1 ✓
[LIVE MANDI SCRAPER] Scraping real-time spot price updates...
```

---

### Step 3 — React Frontend

```bash
cd "d:/Code/SEM 4/react-frontend"

# First time only
npm install

# Start Vite dev server
npm run dev
```

Open **<http://localhost:5173>** in your browser.

---

### Default Login Credentials

A seed user is automatically created at first startup:

| Field | Value |
| :--- | :--- |
| Email | `dhruvilthummar37@gmail.com` |
| Password | `Dhruvil@1303` |

---

## 📡 API Reference

### Base URLs

| Service | Base URL |
| :--- | :--- |
| Node.js BFF (all frontend traffic) | `http://localhost:5000/api` |
| Django Microservice (direct / internal) | `http://localhost:8000/api/v1` |

**Authentication header** (required on all 🔒 endpoints):

```
Authorization: Bearer <jwt_token>
```

---

### 🔑 Authentication

Source: [authRoutes.js](node-auth-backend/src/routes/authRoutes.js)

---

#### `POST /api/auth/signup`

Register a new user. Hashes the password, creates an unverified account, and emails a 6-digit OTP.

**Request**

```json
{
  "email": "user@example.com",
  "password": "YourPassword123"
}
```

**Response `201 Created`**

```json
{
  "message": "User registered. OTP sent to your email."
}
```

**Error codes**

| Code | Reason |
| :--- | :--- |
| `400` | Missing `email` / `password`, or email already registered |
| `500` | Internal server error |

---

#### `POST /api/auth/verify-otp`

Verify the 6-digit OTP sent to the user's email. Marks the account as verified and deletes the OTP.

**Request**

```json
{
  "email": "user@example.com",
  "otp": "847291"
}
```

**Response `200 OK`**

```json
{
  "message": "Account verified successfully"
}
```

**Error codes**

| Code | Reason |
| :--- | :--- |
| `400` | Missing fields, or invalid / expired OTP code |
| `404` | User not found |

---

#### `POST /api/auth/login`

Login with credentials. Returns a signed JWT token valid for **7 days**.

**Request**

```json
{
  "email": "user@example.com",
  "password": "YourPassword123"
}
```

**Response `200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64c3f21a9b3e7c001a2b3d4e",
    "email": "user@example.com",
    "isVerified": true
  }
}
```

**Error codes**

| Code | Reason |
| :--- | :--- |
| `400` | Wrong email or password |
| `403` | Account not verified — a fresh OTP has been sent |
| `500` | Internal server error |

---

### 📊 Predictions

Source: [predictRoutes.js](node-auth-backend/src/routes/predictRoutes.js) · [views.py](django-predict-service/api/views.py)

---

#### `POST /api/predict` · `POST /api/v1/predict`  🔒

Run a commodity price direction prediction. The request is forwarded via the load balancer to a healthy Django worker, enriched with live scraped data, and processed through the ML ensemble engine.

**Request**

```json
{
  "previous_price": 2450,
  "supply_volume": 120.5,
  "transport_cost_index": 105.0,
  "market_demand_score": 7.5,
  "crop": "wheat"
}
```

**Parameters**

| Field | Type | Required | Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `previous_price` | `float` | ✅ | `> 1` | Last market closing price (INR / Quintal) |
| `supply_volume` | `float` | ✅ | `> 1` | Available supply volume (Tons) |
| `transport_cost_index` | `float` | ✅ | `≥ 10` | Freight cost index — 100 = baseline |
| `market_demand_score` | `float` | ✅ | `1–10` | Consumer demand rating |
| `crop` | `string` | ❌ | — | Commodity key (default: `wheat`) |

**Valid crop values**

```
wheat  rice  corn  cotton  soybean  sugarcane  mustard  groundnut  turmeric  chilli
```

**Response `200 OK`**

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
  "timestamp": "2026-07-23T13:30:00.000Z"
}
```

**Error codes**

| Code | Reason |
| :--- | :--- |
| `400` | Missing required fields or invalid `crop` name |
| `401` | Missing or expired JWT token |
| `500` | Both Django workers unreachable (Node.js fallback engine activates) |

---

#### `GET /api/predict/history`  🔒

Fetch the 20 most recent prediction audit log entries for the authenticated user.

**Response `200 OK`**

```json
{
  "success": true,
  "history": [
    {
      "_id": "64c3f21a...",
      "crop": "wheat",
      "previousPrice": 2450,
      "supplyVolume": 120.5,
      "transportCostIndex": 105.0,
      "marketDemandScore": 7.5,
      "prediction": "UP",
      "confidence": 73.52,
      "probabilityUp": 73.52,
      "createdAt": "2026-07-23T13:30:00.000Z"
    }
  ]
}
```

---

#### `DELETE /api/predict/history`  🔒

Delete **all** prediction history entries for the authenticated user.

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Prediction history cleared successfully"
}
```

---

#### `DELETE /api/predict/history/:id`  🔒

Delete a **single** prediction record by its MongoDB document ID.

**URL parameter:** `:id` — the `_id` string from the history response

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Prediction record deleted"
}
```

**Error codes**

| Code | Reason |
| :--- | :--- |
| `404` | Record not found or belongs to a different user |

---

### 📈 Commodity Prices

Source: [commodityRoutes.js](node-auth-backend/src/routes/commodityRoutes.js)

---

#### `GET /api/commodity-prices` · `GET /api/v1/commodities`  🔒

Fetch live scraped APMC Mandi spot prices for all 10 commodities. Prices refresh in the background every 12 seconds.

**Response `200 OK`**

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

#### `GET /api/commodity-prices/platform-stats`  🌐 Public

Returns platform-wide statistics — no JWT required.

**Response `200 OK`**

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

### 📧 Subscriptions

Source: [subscribeRoutes.js](node-auth-backend/src/routes/subscribeRoutes.js)

---

#### `POST /api/subscribe`  🌐 Public

Subscribe an email address to market volatility alerts. Sends a styled HTML confirmation email.

**Request**

```json
{
  "email": "farmer@example.com"
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "message": "Subscription confirmation sent to farmer@example.com",
  "previewUrl": "https://ethereal.email/message/..."
}
```

> `previewUrl` is only included when Ethereal test transport is used (no real SMTP configured). Click the URL to preview the email in your browser.

---

### ❤️ Health Checks

---

#### `GET /health` · `GET /api/v1/health`  🌐 Public — BFF Gateway

**Response `200 OK`**

```json
{
  "status": "HEALTHY",
  "service": "AgriPulse AI BFF Backend Gateway",
  "version": "2.4.0",
  "target_django_service": "http://127.0.0.1:8000",
  "timestamp": "2026-07-23T13:30:00.000Z"
}
```

---

### 🐍 Django Direct Endpoints

These are the raw Django microservice endpoints on **port 8000**.  
In normal usage, all traffic is routed here automatically by the Node.js load balancer.  
You can hit these directly for debugging or integration testing.

---

#### `POST /api/v1/predict` · `POST /api/predict`

Same request / response format as the [BFF predict endpoint](#post-apipredict--post-apiv1predict--). No JWT — auth is handled by the BFF layer.

---

#### `GET /api/v1/health`  🌐 Public

Django worker health status — polled by the load balancer every 15 seconds.

**Response `200 OK`**

```json
{
  "status": "HEALTHY",
  "service": "Django ML Predict Microservice",
  "version": "2.4.0",
  "worker_node": "Worker-Node-127.0.0.1:8000",
  "uptime_seconds": 3742.5,
  "active_engine": "Direct API ML Model Engine (model/package, Zero .pkl dependency)",
  "timestamp": "2026-07-23T13:30:00.000Z"
}
```

---

#### `GET /api/v1/commodities`  🌐 Public

Dynamically scraped commodity registry for all 10 crops.

**Response `200 OK`**

```json
{
  "success": true,
  "commodities": [
    {
      "code": 42,
      "crop": "wheat",
      "name": "Wheat (Premium Spot Market)",
      "base_price": 2465,
      "min_bound": 1775,
      "max_bound": 3254,
      "symbol": "ZW=F"
    }
  ]
}
```

---

## 🤖 ML Model

Source: [predictor_engine.py](django-predict-service/model/predictor_engine.py)

**Class:** `AgriPulseMLPredictor`  
**Type:** Direct API Ensemble — pure Python math, no `.pkl`, no scikit-learn  

### Feature Engineering

| Feature Variable | Formula | Effect |
| :--- | :--- | :--- |
| `spot_momentum` | `(scraped_spot − prev_price) / prev_price` | Captures live price movement direction |
| `historical_diff` | `(scraped_spot − 7d_avg) / 7d_avg` | Measures deviation from recent trend |
| `demand_weight` | `(demand_score − 5.0) × 0.38` | High demand → pushes UP |
| `supply_pressure` | `−((supply − 100) / 200) × 0.28` | Excess supply → pushes DOWN |
| `freight_penalty` | `−((freight − 100) / 100) × 0.14` | Higher freight costs → small DOWN |
| `momentum_score` | `(spot_momentum × 2.5) + (hist_diff × 1.5)` | Combined momentum signal |

### Sub-Model 1: Logistic Regression

```python
lr_logit  = 0.15 + demand_weight + supply_pressure + freight_penalty + momentum_score
lr_prob_up = 1 / (1 + exp(−lr_logit))   # Sigmoid activation
```

### Sub-Model 2: Gradient Boosting Decision Tree

```python
tree_score = 0.20 + (demand × 0.08) − (supply × 0.001) + (momentum × 2.2)
cb_prob_up = 1 / (1 + exp(−tree_score))
```

### Ensemble Average

```python
final_prob = (lr_prob_up + cb_prob_up) / 2.0
prediction = "UP" if final_prob >= 0.50 else "DOWN"
confidence = final_prob if prediction == "UP" else (1 - final_prob)
```

### Target Price Forecast

| Direction | Formula | Change |
| :--- | :--- | :--- |
| UP | `previous_price × 1.038` | +3.8% |
| DOWN | `previous_price × 0.970` | −3.0% |

---

## 🌐 Web Scraping Engine

Source: [scraper.py](django-predict-service/model/scraper.py)

**Class:** `CommodityWebScraper`  
All methods are `@staticmethod` — call directly without instantiation.

### Scraping Modes

#### Mode A — Yahoo Finance JSON API

**Used for:** wheat · rice · corn · cotton · soybean · sugarcane

| Crop | Symbol |
| :--- | :--- |
| Wheat | `ZW=F` |
| Rice | `ZR=F` |
| Corn | `ZC=F` |
| Cotton | `CT=F` |
| Soybean | `ZS=F` |
| Sugarcane | `SB=F` |

**Endpoint:**
```
GET https://query1.financeapp.com/v8/finance/chart/{symbol}?interval=1d&range=7d
```

**Extracts from JSON:**

- `regularMarketPrice` — current live price
- `previousClose` — yesterday's closing price
- `close[]` — 7-day close series for historical average

**Calculates:**

- Spot price = `base_ref × (current / previousClose)`
- 7-day avg = `base_ref × (avg(close[]) / previousClose)`
- Change % = `(current − prev) / prev × 100`

---

#### Mode B — BeautifulSoup4 HTML DOM

**Used for:** mustard · groundnut · turmeric · chilli

**Website:** `https://markets.business-standard.com`

Searches for `<span>`, `<div>`, `<td>` elements whose CSS class contains:

```regex
(price|last|quote|rate)   [case-insensitive]
```

Extracts the first numeric value `> 10` using: `\d+(\.\d+)?`

---

#### Fallback Behaviour

When scraping fails for any reason:

- `scrape_status` is set to `"SCRAPE_WARNING (reason)"`
- Price bounds fall back to `base_ref × 0.72` (min) and `base_ref × 1.32` (max)
- The ML model still runs — just with less accurate reference data

---

## ⚖️ Load Balancer

Source: [loadBalancer.js](node-auth-backend/src/services/loadBalancer.js)

**Class:** `LoadBalancer` (exported as a singleton)  
**Algorithm:** Round-Robin  

| Setting | Value |
| :--- | :--- |
| Health check interval | 15 seconds |
| Health endpoint | `GET /api/v1/health` |
| Request timeout | 5,000 ms |
| Failover strategy | Single retry on any other available node |

### Worker Pool

| Node | Default URL | `.env` Variable |
| :--- | :--- | :--- |
| Node-1 (Primary) | `http://127.0.0.1:8000` | `DJANGO_WORKER_1` |
| Node-2 (Secondary) | `http://127.0.0.1:8001` | `DJANGO_WORKER_2` |

> **Single-worker mode:** Running only one Django instance locally is fine. Node-2 will be marked unhealthy but Node-1 is kept alive as a permanent fallback. All traffic routes to Node-1 automatically.

### Request Flow

```
Client Request
      │
      ▼
getNextWorker()            → picks next healthy node (round-robin)
      │
      ▼
axios.post(worker, payload, { timeout: 5000 })
      │
  ┌───┴──────────────────────┐
  │ Success                  │ Timeout / Error
  ▼                          ▼
Return response         findFallbackNode()
+ worker_dispatched tag       │
                              ▼
                    axios.post(fallback, payload, { timeout: 5000 })
                              │
                        ┌─────┴──────────┐
                        │ Success        │ Error
                        ▼                ▼
                   Return response   throw Error
                   + "(Failover)" tag  → Node.js built-in
                                         fallback engine
```

---

## 🔐 Authentication Flow

Source: [authRoutes.js](node-auth-backend/src/routes/authRoutes.js) · [auth.js](node-auth-backend/src/middleware/auth.js)

```
REGISTRATION
─────────────────────────────────────────────────────────
POST /api/auth/signup
  → bcrypt.hash(password, salt=10)
  → User.save({ isVerified: false })
  → OTP = random 6-digit · expiresAt = now + 5 min
  → Otp.save()
  → sendOtpEmail(email, OTP)
  → 201 Created

POST /api/auth/verify-otp
  → Otp.findOne({ email, otpCode })
  → User.isVerified = true · User.save()
  → Otp.deleteOne()                  ← one-time use
  → 200 OK

LOGIN
─────────────────────────────────────────────────────────
POST /api/auth/login
  → User.findOne({ email })
  → bcrypt.compare(password, user.password)
  → if !user.isVerified → new OTP → sendOtpEmail → 403
  → jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' })
  → 200 { token, user }

PROTECTED REQUEST
─────────────────────────────────────────────────────────
Authorization: Bearer <token>
  → authMiddleware
  → jwt.verify(token, JWT_SECRET)    ← checks signature + expiry
  → req.user = { id, email }
  → next()  →  route handler
```

---

## 🖥 Frontend Views

Source: [`react-frontend/src/components/`](react-frontend/src/components/)

| View | Description |
| :--- | :--- |
| [Hero.jsx](react-frontend/src/components/Hero.jsx) | Public landing page with subscription form |
| [AuthModal.jsx](react-frontend/src/components/AuthModal.jsx) | Login · Signup · OTP verification modal |
| [Dashboard.jsx](react-frontend/src/components/Dashboard.jsx) | App shell — sidebar layout, navigation state |
| [MarketsView.jsx](react-frontend/src/components/MarketsView.jsx) | Live commodity price tickers with trend indicators |
| [AnalyticsView.jsx](react-frontend/src/components/AnalyticsView.jsx) | Charts, price trends, model performance metrics |
| [OrdersView.jsx](react-frontend/src/components/OrdersView.jsx) | Prediction input form + history table |
| [AccountView.jsx](react-frontend/src/components/AccountView.jsx) | User profile & session management |
| [HelpCenter.jsx](react-frontend/src/components/HelpCenter.jsx) | FAQ & documentation page |

---

## ✅ Implementation Status

| Feature | Status | Source File |
| :--- | :---: | :--- |
| User signup + bcrypt hashing | ✅ | [authRoutes.js](node-auth-backend/src/routes/authRoutes.js) |
| OTP email verification (5-min TTL) | ✅ | [authRoutes.js](node-auth-backend/src/routes/authRoutes.js) · [Otp.js](node-auth-backend/src/models/Otp.js) |
| JWT login (7-day session) | ✅ | [authRoutes.js](node-auth-backend/src/routes/authRoutes.js) |
| JWT guard middleware | ✅ | [auth.js](node-auth-backend/src/middleware/auth.js) |
| ML ensemble prediction (UP/DOWN) | ✅ | [predictor_engine.py](django-predict-service/model/predictor_engine.py) |
| Yahoo Finance JSON scraping | ✅ | [scraper.py](django-predict-service/model/scraper.py) |
| BeautifulSoup4 HTML DOM scraping | ✅ | [scraper.py](django-predict-service/model/scraper.py) |
| Zero `.pkl` ML model | ✅ | [predictor_engine.py](django-predict-service/model/predictor_engine.py) |
| Round-robin load balancer | ✅ | [loadBalancer.js](node-auth-backend/src/services/loadBalancer.js) |
| Worker health monitoring (15s) | ✅ | [loadBalancer.js](node-auth-backend/src/services/loadBalancer.js) |
| Auto-failover to backup worker | ✅ | [loadBalancer.js](node-auth-backend/src/services/loadBalancer.js) |
| Prediction audit log (MongoDB) | ✅ | [predictRoutes.js](node-auth-backend/src/routes/predictRoutes.js) |
| Prediction history GET/DELETE | ✅ | [predictRoutes.js](node-auth-backend/src/routes/predictRoutes.js) |
| Live commodity tickers (12s loop) | ✅ | [commodityRoutes.js](node-auth-backend/src/routes/commodityRoutes.js) |
| Platform statistics endpoint | ✅ | [commodityRoutes.js](node-auth-backend/src/routes/commodityRoutes.js) |
| Email subscription + confirmation | ✅ | [subscribeRoutes.js](node-auth-backend/src/routes/subscribeRoutes.js) |
| Nodemailer SMTP + Ethereal fallback | ✅ | [nodemailer.js](node-auth-backend/src/config/nodemailer.js) |
| MongoDB auto-expiry OTP (TTL index) | ✅ | [Otp.js](node-auth-backend/src/models/Otp.js) |
| Seed default user on startup | ✅ | [server.js](node-auth-backend/server.js) |
| Django startup banner | ✅ | [apps.py](django-predict-service/api/apps.py) |
| DRF input serializer validation | ✅ | [serializers.py](django-predict-service/api/serializers.py) |
| CORS (Node.js + Django) | ✅ | [server.js](node-auth-backend/server.js) · [settings.py](django-predict-service/predict_service/settings.py) |
| Node.js built-in fallback engine | ✅ | [predictRoutes.js](node-auth-backend/src/routes/predictRoutes.js) |
| Beginner-friendly code comments | ✅ | All files |

---

## ⚠️ Known Limitations

| Limitation | Detail |
| :--- | :--- |
| Yahoo Finance rate limits | `query1.financeapp.com` is an unofficial endpoint that may throttle or change format. The scraper falls back to baseline prices when this happens. |
| Single local worker | Running one `manage.py runserver` is normal. Node-2 (port 8001) is flagged unhealthy but Node-1 handles all traffic gracefully. |
| No HTTPS | The project runs over HTTP. Use Nginx or Caddy as a reverse proxy with SSL for production. |
| CORS wildcard | `origin: '*'` and `CORS_ALLOW_ALL_ORIGINS = True` are set for development. Restrict to the frontend origin in production. |
| DEBUG mode | Django runs with `DEBUG = True`. Set to `False` and configure `ALLOWED_HOSTS` before deploying. |
| JWT secret | The default secret in `.env` must be replaced with a cryptographically random string in production. |
| No rate limiting | No request throttling is implemented. Add `express-rate-limit` (Node.js) and DRF throttling (Django) for production. |

---

## 📜 License

This project is developed for academic purposes.

---

*Made with ❤️ — AgriPulse AI Agricultural Intelligence Platform*
"# AgriPulse-AI" 
"# AgriPulse-AI" 
