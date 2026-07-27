# 🌾 AgriPulse AI

> **Real-time agricultural commodity price intelligence powered by live web scraping, advanced Scikit-Learn ML models, Pandas data wrangling, and a three-tier microservice architecture.**

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat-square&logo=node.js&logoColor=white)
![Django](https://img.shields.io/badge/Django-4.2-092E20?style=flat-square&logo=django&logoColor=white)
![Scikit--Learn](https://img.shields.io/badge/Scikit--Learn-1.3+-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-2.0+-150458?style=flat-square&logo=pandas&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Core Concepts & Technical Specifications](#-core-concepts--technical-specifications)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [API Reference](#-api-reference)
  - [Authentication](#-authentication)
  - [Predictions & History](#-predictions--history)
  - [Analytics & Model Summary](#-analytics--model-summary)
  - [Commodity Prices](#-commodity-prices)
  - [Subscriptions & Health Checks](#-subscriptions--health-checks)
- [ML & Data Wrangling Pipeline](#-ml--data-wrangling-pipeline)
- [Web Scraping Engine](#-web-scraping-engine)
- [Load Balancer](#-load-balancer)
- [Authentication Flow](#-authentication-flow)
- [Frontend Views](#-frontend-views)

---

## 🌾 Overview

**AgriPulse AI** is an enterprise-grade agricultural intelligence and commodity market prediction platform built for Indian farmers, agribusiness managers, and APMC Mandi traders. It predicts short-term price direction (**UP** or **DOWN**), calculates numerical price targets, exposes full Pandas dataset statistics (`describe()`, `corr()`, `groupby()`, IQR outlier bounds), and provides Scikit-Learn Confusion Matrix metrics ($TP$, $TN$, $FP$, $FN$, Sensitivity, Specificity, Accuracy, Precision, F1-Score) for 12 major commodities.

| Capability | Detail |
| :--- | :--- |
| 🤖 Scikit-Learn ML | Ensemble GBDT (`HistGradientBoostingClassifier`/`Regressor`), Random Forest, Decision Tree, Linear Regression, kNN, and SVC |
| 📊 Pandas Data Wrangling | 100,000-sample dataset, `shape`, `info()`, `describe()`, `loc`/`iloc`, `groupby()`, `agg()`, `corr()`, and IQR outlier detection |
| 🌐 Live Web Scraping | BeautifulSoup4 HTML DOM parser + Yahoo Finance JSON API with HTTP status code validation (200, 404, 500) |
| ⚖️ Load Balancing | Round-robin load balancing across Django worker nodes with automated failover |
| 🔐 Auth & Security | OTP 6-digit email verification + JWT session tokens (7-day TTL) |
| 📈 Analytics Hub | Interactive SVG/Plotly visualizations, Confusion Matrix decomposition, and feature contribution charts |

**Supported commodities:** `wheat` · `rice` · `cotton` · `sugarcane` · `maize` · `soybean` · `mustard` · `pulse` · `groundnut` · `jute` · `potato` · `onion`

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             React Frontend                               │
│                      (Vite + React 18, Port 5173)                        │
│   Dashboard │ Markets │ Predictions │ Analytics Hub │ Orders │ Account  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │  HTTP  ·  JWT Bearer Token
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   Node.js BFF Gateway (Express, Port 5000)               │
│                                                                          │
│  /api/auth/*            → Auth Routes (Signup / Login / 6-Digit OTP)    │
│  /api/predict/*         → Predict & Analytics Routes → Load Balancer     │
│  /api/commodity-prices  → Commodity Routes (Live Scraper Refresh)      │
│  /api/subscribe         → Email Subscription Route                       │
│                                                                          │
│  MongoDB Database ← User Accounts · OTP Codes · Prediction Audit Logs    │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │  Round-Robin Dispatch (5s timeout)
                         ┌───────────┴───────────┐
                         ▼                       ▼
            ┌────────────────────────┐  ┌────────────────────────┐
            │   Django Worker Node 1 │  │   Django Worker Node 2 │
            │   Port 8000            │  │   Port 8001            │
            │                        │  │                        │
            │  POST /api/v1/predict  │  │  POST /api/v1/predict  │
            │  GET  /api/v1/analytics│  │  GET  /api/v1/analytics│
            │  GET  /api/v1/model/...│  │  GET  /api/v1/model/...│
            │  GET  /api/v1/health   │  │  GET  /api/v1/health   │
            │                        │  │                        │
            │  ┌──────────────────┐  │  │  ┌──────────────────┐  │
            │  │ Scikit-Learn ML  │  │  │  │ Scikit-Learn ML  │  │
            │  │ Web Scraper (BS4)│  │  │  │ Web Scraper (BS4)│  │
            │  └──────────────────┘  │  │  └──────────────────┘  │
            └────────────────────────┘  └────────────────────────┘
                         │                           │
                         └─────────────┬─────────────┘
                                       ▼
                       Yahoo Finance API · APMC Mandi Webpages
                            (BeautifulSoup4 · Requests)
```

---

## 🛠 Tech Stack

### Frontend — [`react-frontend/`](react-frontend/)

| Technology | Version | Purpose |
| :--- | :--- | :--- |
| [React](https://react.dev) | 18.2 | UI single-page application framework |
| [Vite](https://vitejs.dev) | 4.4 | Modern asset bundler and dev server |
| Vanilla CSS | CSS3 | Dark-mode glassmorphic design system with standard tokens |
| Material Symbols | Outlined | Scalable Google UI icons |

### Node.js BFF Gateway — [`node-auth-backend/`](node-auth-backend/)

| Package | Version | Purpose |
| :--- | :--- | :--- |
| [Express](https://expressjs.com) | 4.18 | HTTP server, middleware & route dispatching |
| [Mongoose](https://mongoosejs.com) | 7.3 | MongoDB ODM & schema management |
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | 9.0 | JWT signing and token verification |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 2.4 | Password hashing with 10 salt rounds |
| [nodemailer](https://nodemailer.com) | 6.9 | Email delivery for 6-digit OTP and alerts |
| [axios](https://axios-http.com) | 1.4 | Backend-to-backend HTTP proxy dispatcher |

### Django ML Microservice — [`django-predict-service/`](django-predict-service/)

| Package | Version | Purpose |
| :--- | :--- | :--- |
| [Django](https://djangoproject.com) | 4.2 | Core Python web microservice framework |
| [Django REST Framework](https://www.django-rest-framework.org) | 3.14 | Serializers, API views, and URL routing |
| [Scikit-Learn](https://scikit-learn.org) | 1.3 | Estimators (`HistGradientBoosting`, `RandomForest`, `DecisionTree`, `LinearRegression`, `kNN`, `SVC`) |
| [Pandas](https://pandas.pydata.org) | 2.0 | Data wrangling, boolean indexing, `describe()`, `groupby()`, `corr()`, and IQR bounds |
| [NetworkX](https://networkx.org) | 3.1 | Graph construction (`nx.Graph`, `nx.DiGraph`) |
| [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup) | 4.12 | Live DOM HTML parsing and mandi price extraction |

---

## 📊 Core Concepts & Technical Specifications

- **Data Manipulation & Analysis with Pandas**: 100,000-sample dataset, `shape`, `info()`, `describe()`, qualitative vs quantitative data, `loc[]` vs `iloc[]`, boolean indexing filtering, `dropna()`, `fillna()`, `drop_duplicates()`, `sort_values()`, `sort_index()`, `replace()`, `astype()`, `apply()`, `unique()`, `nunique()`, `groupby()`, `agg()`, `nth()`, `crosstab()`, `corr()`, and IQR outlier detection.
- **Data Visualization**: Seaborn & Plotly Express chart payloads (`sns.heatmap`, `px.bar`, `sns.boxplot`, `px.scatter_3d`) and NetworkX graph structures (`nx.Graph()`, `nx.DiGraph()`).
- **ML Preprocessing & Validation**: `pd.get_dummies()` one-hot encoding, `pd.cut()` demand binning, `StandardScaler()` feature scaling, and `train_test_split()` random partitioning.
- **Regression Analysis**: `LinearRegression` ($\hat{y} = \beta_0 + \beta_1 x_1 + \dots$), `HistGradientBoostingRegressor`, `coef_`, `intercept_`, $R^2$ Score, MSE, RMSE, and MAE.
- **Supervised Classification Methods**: `HistGradientBoostingClassifier`, `RandomForestClassifier`, `DecisionTreeClassifier`, `KNeighborsClassifier`, `SVC`, 2x2 Confusion Matrix ($TP$, $TN$, $FP$, $FN$), Sensitivity/Recall, Specificity, Accuracy, Precision, F1-Score, and Error Rate.
- **Deep Learning Foundations & CNN**: Deep Learning CNN specification payload (`Conv2D`, `ReLU`, `Stride`, `MaxPooling2D`, `BatchNormalization`, `Dropout`, `Flatten`, `Dense`, `Softmax`).
- **Web Scraping & API Integration**: `requests.get()`, `BeautifulSoup` parsing (`find()`, `find_all()`, `.get_text()`), HTTP status codes (200, 404, 500), and `json.dumps()` / `json.loads()`.
- **Django & DRF Framework**: MVT architecture, `settings.py`, `urls.py`, `views.py`, `serializers.py`, `ModelSerializer`, `@api_view`, `IsAuthenticated`, JWT auth, and Postman test verification.

---

## 📁 Project Structure

```
d:/Code/SEM 4/
├── README.md                          ← Main project README
├── documentation.md                   ← End-to-end technical documentation
│
├── react-frontend/                    ← React 18 SPA (Port 5173)
│   └── src/
│       ├── App.jsx                    ← App entry & view state manager
│       ├── index.css                  ← Design system & CSS variables
│       ├── components/
│       │   ├── Dashboard.jsx          ← Main application shell
│       │   ├── AnalyticsView.jsx      ← Pandas stats & Confusion Matrix UI
│       │   ├── MarketsView.jsx        ← Commodity prices ticker
│       │   ├── OrdersView.jsx         ← Prediction portal & history log
│       │   ├── AuthModal.jsx          ← Login, signup & 6-digit OTP modal
│       │   └── Navbar.jsx / Sidebar.jsx
│       └── services/
│           ├── apiClient.js           ← Base HTTP wrapper with Bearer token
│           ├── predictService.js      ← Prediction, history & analytics API
│           └── marketService.js       ← Commodity pricing API
│
├── node-auth-backend/                 ← Node.js BFF Gateway (Port 5000)
│   ├── server.js                      ← Gateway entry & route mounting
│   └── src/
│       ├── config/                    ← Database (Mongoose) & Nodemailer setup
│       ├── middleware/                ← JWT auth guard middleware
│       ├── models/                    ← User, Otp & Prediction Mongoose schemas
│       ├── routes/                    ← Auth, predict, commodity & subscribe routes
│       └── services/                  ← Round-robin load balancer & health checker
│
└── django-predict-service/            ← Django ML Microservice (Port 8000)
    ├── manage.py                      ← Django CLI script
    ├── predict_service/
    │   ├── __init__.py                ← Loky physical core patch & env setup
    │   ├── settings.py                ← Django settings & warning suppression
    │   └── urls.py                    ← Root URL dispatcher
    ├── api/
    │   ├── views.py                   ← AnalyticsView, ModelSummaryView, PredictView
    │   ├── serializers.py             ← DRF serializers for responses & inputs
    │   └── urls.py                    ← Endpoint routing (/v1/analytics, /v1/model/summary, etc.)
    └── model/
        ├── train_model.py             ← Pandas wrangling & Scikit-Learn training
        ├── predictor_engine.py        ← Production prediction inference engine
        ├── scraper.py                 ← BeautifulSoup4 & Yahoo Finance scraping engine
        └── artifacts/
            └── agripulse_sklearn_models.joblib ← Exported model package (0.31 MB)
```

---

## 🚀 Running the Project

Open **three separate terminal windows** and execute:

### Step 1 — Django ML Microservice (Port 8000)

```bash
cd "django-predict-service"
pip install -r requirements.txt
python model/train_model.py    # Train Scikit-Learn pipeline & export package
python manage.py runserver 8000
```

### Step 2 — Node.js BFF Gateway (Port 5000)

```bash
cd "node-auth-backend"
npm install
npm run dev
```

### Step 3 — React Frontend (Port 5173)

```bash
cd "react-frontend"
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 📡 API Reference

### 📊 Analytics & Model Summary Endpoints

#### `GET /api/predict/analytics` · `GET /api/v1/analytics`
Returns Pandas data wrangling metrics: `describe()` dictionary, crop `groupby()` aggregations, `crosstab` table, `corr()` correlation matrix, IQR outlier count, and NetworkX graph node stats.

#### `GET /api/predict/summary` · `GET /api/v1/model/summary`
Returns Scikit-Learn model metrics:
- **Confusion Matrix**: True Positives ($TP = 8,284$), True Negatives ($TN = 8,336$), False Positives ($FP = 1,675$), False Negatives ($FN = 1,705$).
- **Derived Metrics**: Accuracy ($83.10\%$), Sensitivity ($82.93\%$), Specificity ($83.27\%$), Precision ($83.18\%$), F1 Score ($83.06\%$), Error Rate ($16.90\%$), ROC AUC ($0.9131$).
- **Regression Parameters**: Linear Regression coefficients, $R^2 = 0.9984$, GBDT Regressor MAE $= \text{₹}39.92$.

#### `POST /api/predict` · `POST /api/v1/predict` 🔒
Dispatches input features (`previous_price`, `supply_volume`, `transport_cost_index`, `market_demand_score`, `crop`) to Django worker, enriches with scraped spot price, and computes prediction output (**UP** / **DOWN**).

---

## 📄 License & Maintainers

Developed by **Dhruvil Thummar** (`DhruvilThummar/AgriPulse-AI`).  
Built for enterprise agricultural market intelligence and decision support.
