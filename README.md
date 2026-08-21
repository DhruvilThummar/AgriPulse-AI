# 🌾 AgricastAI — Precision Agricultural Intelligence & Mandi Forecast Platform

> **Enterprise-grade agricultural market intelligence platform combining real-time APMC Mandi web scraping, live OpenWeatherMap telemetry, Round-Robin load-balanced Django worker nodes, a 10-feature Scikit-Learn GBDT machine learning engine, Skeleton Shimmer UI, and a native-feeling PWA React frontend.**

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=github-actions)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-4.2-092E20?style=for-the-badge&logo=django&logoColor=white)
![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.3+-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![PWA Ready](https://img.shields.io/badge/PWA-Workbox%20Offline%20Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![Load Balancer](https://img.shields.io/badge/Load%20Balancer-Round%20Robin-FF6F00?style=for-the-badge&logo=nginx&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## ⚡ Feel the live demo here!

[![Live Demo](https://img.shields.io/badge/Live_Demo-AgriCast_AI-059669?style=for-the-badge&logo=vercel&logoColor=white)](https://agricastai.vercel.app/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Local Setup & Installation](#-local-setup--installation)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Machine Learning & Load Balancer Pipeline](#-machine-learning--load-balancer-pipeline)
- [License & Authors](#-license--authors)

---

## 🌾 Overview

**AgricastAI** ([agricastai.vercel.app](https://agricastai.vercel.app/)) is an end-to-end agritech intelligence platform engineered for Indian farmers, APMC Mandi traders, and agricultural supply chain decision-makers.

Agricultural markets in India suffer from severe price opacity, localized freight vulnerabilities, and sudden weather-induced supply shocks. AgricastAI solves this by providing:
1. **Short-Term Mandi Price Forecasting**: Predicts next-day market price direction (**UP** or **DOWN**) with confidence scores (%) and target prices ($\text{₹}/\text{Quintal}$).
2. **Domain-Specific Agricultural Telemetry**: Incorporates regional monsoon anomaly scoring (`weather_impact_score`), freight transport indices, and Government Minimum Support Price (MSP) variance (`msp_difference_pct`).
3. **High-Readability Outdoor Mobile UX**: High-contrast theme tokens designed for direct sunlight legibility, $\ge 48\text{px}$ touch targets, native bottom navigation, Skeleton Shimmer loading placeholders, and full PWA offline operation in low-connectivity rural zones.

---

## 🏗️ System Architecture

AgricastAI uses a modular, decoupled three-tier microservice architecture with **Round-Robin Load Balancing**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      React 18 Vite PWA Client                            │
│           (React.lazy Code Splitting + Skeleton Shimmers)               │
│   Dashboard │ Mandi Feed │ ML Predictor │ Analytics Hub │ AgriChatbot    │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │  HTTP REST / Bearer JWT Token
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                  Node.js BFF Gateway (Express, Port 5000)                │
│                                                                          │
│  /api/auth/*            ➔ Auth Routes (Signup / Login / 6-Digit OTP)    │
│  /api/predict/*         ➔ Predict & Analytics → Round-Robin Balancer   │
│  /api/commodity-prices  ➔ Live APMC Commodity Ticker Feed                │
│  /api/chat/query        ➔ AgriChatbot Intelligence Endpoint             │
│  /api/subscribe         ➔ Nodemailer Email Alert Gateway                 │
│                                                                          │
│  MongoDB Database 🔒 User Accounts · OTP Tokens · Prediction Logs        │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │  Round-Robin Dispatch (15s Health Check)
                         ┌───────────┴───────────┐
                         ▼                       ▼
            ┌────────────────────────┐  ┌────────────────────────┐
            │   Django Worker Node 1 │  │   Django Worker Node 2 │
            │   Port 8000            │  │   Port 8001            │
            │                        │  │                        │
            │  POST /api/v1/predict  │  │  POST /api/v1/predict  │
            │  GET  /api/v1/analytics│  │  GET  /api/v1/analytics│
            │  GET  /api/v1/health   │  │  GET  /api/v1/health   │
            │                        │  │                        │
            │  ┌──────────────────┐  │  │  ┌──────────────────┐  │
            │  │ Scikit-Learn ML  │  │  │  │ Scikit-Learn ML  │  │
            │  │ OpenWeather API  │  │  │  │ OpenWeather API  │  │
            │  │ Mandi Scraper    │  │  │  │ Mandi Scraper    │  │
            │  └──────────────────┘  │  │  └──────────────────┘  │
            └────────────────────────┘  └────────────────────────┘
```

### End-to-End Request Lifecycle
1. **User Input & Lazy Loading**: Client uses `React.lazy()` and `React.Suspense` to code-split routes with `SkeletonLoader` shimmer placeholders.
2. **Round-Robin Balancing**: Node.js BFF gateway `LoadBalancer` intercepts request, selects the next healthy Django worker node (`Node-1` on port 8000 or `Node-2` on port 8001) using round-robin rotation, and auto-retries if a node is down.
3. **Telemetry Enrichment**: Django worker extracts location (e.g. `Khanna`), queries `AgriWeatherService` via OpenWeatherMap API, and scrapes live APMC Mandi rates using BeautifulSoup4.
4. **ML Inference**: `AgriPulseMLPredictor` constructs a **10-feature vector** and evaluates trained Scikit-Learn GBDT pipelines (`HistGradientBoostingClassifier`/`Regressor`).
5. **Resilient Response**: Returns predictions (**UP**/**DOWN**), confidence percentages, and target prices. If ML model artifacts are missing, the system engages a **Mathematical Heuristic Fallback Engine** ensuring 100% availability.

---

## ✨ Key Features

- ⚖️ **Round-Robin Load Balancer**: Multi-worker dispatch across Django ML instances with automated 15-second health check background pinging and failover retry.
- 🤖 **10-Feature Scikit-Learn GBDT Engine**: Dual-model ensemble using `HistGradientBoostingClassifier` and `HistGradientBoostingRegressor` trained on 100,000 multi-variate records (81.09% accuracy).
- 🔄 **Hot-Reloading ML Artifacts**: `AgriPulseMLPredictor` monitors file modification timestamps (`mtime`) of `.joblib` model packages and reloads them dynamically without server downtime.
- 🛡️ **Dual-Tier AI Fallback Engine**: If machine learning models fail or are uninitialized, a mathematical logit/tree heuristic engine guarantees zero-downtime predictions.
- ⚡ **Skeleton Shimmer UI & Lazy Loading**: Custom CSS shimmer loading components (`SkeletonCard`, `SkeletonTable`, `SkeletonChart`, `PageSkeleton`) combined with `React.lazy()` route code-splitting for zero layout shift.
- 🌤️ **Live OpenWeatherMap Telemetry**: Converts real-time temperature, humidity, and storm condition codes into an agricultural weather score (`0.0` drought/storm to `1.0` ideal harvest).
- 🌐 **BeautifulSoup4 APMC Web Scraper**: Scrapes live spot prices from domestic commodity portals and Yahoo Finance, with robust Indian Rupee regex parsing (`₹ 5,420.50/Qtl`).
- 📱 **Native Mobile App UX**: Bottom navigation bar (`MobileBottomBar.jsx`), minimum $48\times 48\text{px}$ touch targets, and touch-scroll chips.
- ☀️ **Outdoor Sunlight High-Contrast Mode**: Dedicated high-contrast color scheme (`body.high-contrast`) and color-coded trend badges for outdoor sunlight legibility.
- 📶 **Progressive Web App (PWA)**: Powered by `vite-plugin-pwa` with 24-hour Workbox `NetworkFirst` API caching and custom Add to Home Screen install prompt (`PwaInstallPrompt.jsx`).
- 💬 **Interactive AgriChatbot Assistant**: Floating AI Q&A chatbot widget (`POST /api/chat/query`) offering specialized guidance on crop protection, fertilizer schedules, mandi price timing, and weather advisories.

---

## 💻 Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Client** | [React](https://react.dev) | 18.2 | Component-driven Single Page Application |
| | [Vite](https://vitejs.dev) | 4.4 | Ultra-fast asset bundler & dev server |
| | [Vite PWA Plugin](https://vite-pwa-org.netlify.app/) | 0.16 | Workbox service worker & PWA manifest generator |
| | Skeleton Shimmer Library | Custom | Shimmer placeholder UI for lazy loading states |
| | Vanilla CSS3 | CSS3 | High-contrast design tokens & glassmorphic UI system |
| **BFF Gateway** | [Node.js](https://nodejs.org) | 18.x | Server runtime environment |
| | [Express](https://expressjs.com) | 4.18 | API routing, CORS management & proxy dispatcher |
| | Round-Robin Balancer | Custom | Multi-worker load distribution & health monitoring |
| | [MongoDB & Mongoose](https://mongoosejs.com) | 7.3 | Database storage for users, OTPs, and audit logs |
| | [Nodemailer](https://nodemailer.com) | 6.9 | Transactional email delivery for 6-digit OTP codes |
| **Django ML Engine** | [Django](https://djangoproject.com) | 4.2 | Core Python REST API microservice |
| | [Django REST Framework](https://www.django-rest-framework.org) | 3.14 | Serializers, API views & request validation |
| | [Scikit-Learn](https://scikit-learn.org) | 1.3+ | `HistGradientBoosting`, `RandomForest`, `StandardScaler` |
| | [Pandas](https://pandas.pydata.org) | 2.0+ | Data wrangling, `describe()`, `corr()`, IQR outlier bounds |
| | [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/) | 4.12 | HTML DOM web scraper for Indian mandi prices |
| **Data Telemetry** | [OpenWeatherMap API](https://openweathermap.org/api) | v2.5 | Real-time weather telemetry & condition scoring |

---

## 🛠️ Local Setup & Installation

Follow these steps to set up and run AgricastAI on your local machine:

### Prerequisites
- **Python**: `v3.10` or higher
- **Node.js**: `v18.x` or higher (`npm` included)
- **Git**: Installed on your system

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/DhruvilThummar/AgriPulse-AI.git
cd AgriPulse-AI
```

---

### Step 2: Set Up Django ML Worker Nodes (Port 8000 & 8001)
```bash
# Navigate to Django service
cd django-predict-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train Scikit-Learn 10-feature GBDT model & export .joblib artifact
python model/train_model.py

# Start Django Primary Worker Node (Port 8000)
python manage.py runserver 8000

# (Optional) Start Django Secondary Worker Node (Port 8001 in another terminal)
# python manage.py runserver 8001
```

---

### Step 3: Set Up Node.js BFF Gateway (Port 5000)
Open a **new terminal window**:
```bash
# Navigate to Node.js backend
cd node-auth-backend

# Install NPM dependencies
npm install

# Start Node.js Express server with Round-Robin Load Balancer
npm start
```

---

### Step 4: Set Up React Vite Frontend (Port 5173)
Open a **third terminal window**:
```bash
# Navigate to React frontend
cd react-frontend

# Install NPM dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## 🔑 Environment Variables

Create a `.env` file in each component directory based on the configuration below:

### `django-predict-service/.env`
```env
DJANGO_SECRET_KEY=django-insecure-agricast-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=*
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### `node-auth-backend/.env`
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/agricast_db
JWT_SECRET=agricast_jwt_secret_token_key_2026
DJANGO_WORKER_1=http://127.0.0.1:8000
DJANGO_WORKER_2=http://127.0.0.1:8001
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### `react-frontend/.env`
```env
VITE_API_URL=http://localhost:5000
```

---

## 📡 API Reference

### Main Express BFF & Load Balancer Endpoints (`http://localhost:5000`)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/predict` | `POST` | Dispatches prediction payload to Django worker nodes using Round-Robin rotation. |
| `/api/predict/history` | `GET` | Fetches recent prediction history for authenticated user (with safe offline fallback). |
| `/api/chat/query` | `POST` | Interacts with AgriChatbot for crop protection, fertilizer calculations, and market timing. |
| `/api/commodity-prices` | `GET` | Returns list of supported commodities with live scraped spot prices and trading bounds. |
| `/api/v1/analytics` | `GET` | Exposes Pandas dataset statistics (`describe()`, correlation matrix, `groupby()` aggregations, IQR outliers). |
| `/api/v1/model/summary` | `GET` | Returns Scikit-Learn metrics (Confusion Matrix $TP/TN/FP/FN$, accuracy, precision, recall, F1-score). |
| `/health` | `GET` | Returns BFF gateway health status and target Django service worker status. |

---

## 🔬 Machine Learning & Load Balancer Pipeline

1. **Synthetic & Historical Dataset**: 100,000 multi-variate records representing Indian agricultural Mandi trading.
2. **Feature Matrix (10 Quantitative Features)**:
   - `crop_code`, `previous_price`, `supply_volume`, `transport_cost_index`, `market_demand_score`, `spot_price`, `historical_7d_avg`, `spot_momentum`, `weather_impact_score`, `msp_difference_pct`.
3. **Round-Robin Load Distribution**:
   - `LoadBalancer` cycles requests sequentially across registered worker nodes (`Node-1` $\rightarrow$ `Node-2` $\rightarrow$ `Node-1`).
   - Automated 15-second background health checks update worker health states.
4. **Classifier & Regressor**: `HistGradientBoostingClassifier` and `HistGradientBoostingRegressor` (81.09% accuracy).

---

## 📄 License & Maintainers

Architected and maintained by **Dhruvil Thummar** ([@DhruvilThummar](https://github.com/DhruvilThummar)).  
Distributed under the **MIT License**. Built for precision agriculture and decision support across Indian Mandis.
