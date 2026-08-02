# 🌾 AgriPulse AI — End-to-End Technical Documentation

> **Comprehensive Technical Specification, Architecture Manual & API Guide**  
> *Real-time agricultural commodity price intelligence powered by live web scraping, advanced Scikit-Learn ML models, Pandas data wrangling, and a three-tier microservice architecture.*

---

## 📋 Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Core Concepts & Technical Alignment](#4-core-concepts--technical-alignment)
5. [Frontend Architecture & Features (`react-frontend`)](#5-frontend-architecture--features-react-frontend)
   - [UI Design System & Aesthetics](#ui-design-system--aesthetics)
   - [Views & Component Breakdown](#views--component-breakdown)
   - [Client Services Layer](#client-services-layer)
6. [Backend BFF Gateway Architecture (`node-auth-backend`)](#6-backend-bff-gateway-architecture-node-auth-backend)
   - [Express Gateway & Middleware](#express-gateway--middleware)
   - [Load Balancer & Proxy Services](#load-balancer--proxy-services)
   - [MongoDB Audit Persistence](#mongodb-audit-persistence)
7. [Django ML Microservice & Model Infrastructure (`django-predict-service`)](#7-django-ml-microservice--model-infrastructure-django-predict-service)
   - [Pandas Data Wrangling Pipeline](#pandas-data-wrangling-pipeline)
   - [Scikit-Learn Model Training & Evaluation](#scikit-learn-model-training--evaluation)
   - [Confusion Matrix & Derived Formulas](#confusion-matrix--derived-formulas)
   - [Web Scraping Engine Architecture](#web-scraping-engine-architecture)
8. [Complete End-to-End API Reference](#8-complete-end-to-end-api-reference)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Prediction & History Endpoints](#prediction--history-endpoints)
   - [Analytics & Model Summary Endpoints](#analytics--model-summary-endpoints)
   - [Commodity & Market Data Endpoints](#commodity--market-data-endpoints)
   - [System Health Check Endpoints](#system-health-check-endpoints)
9. [Database Schema & Models](#9-database-schema--models)
10. [Setup & Local Execution Guide](#10-setup--local-execution-guide)

---

## 1. System Overview

**AgriPulse AI** is an enterprise-grade agricultural intelligence and commodity market prediction platform designed for Indian farmers, agricultural traders, APMC Mandi stakeholders, and agribusiness managers.

### Core Capabilities
- **Live Spot Price Scraping**: Real-time aggregation of APMC Mandi prices and international commodity benchmarks.
- **Directional Trend Prediction**: Binary prediction (**UP** or **DOWN**) with confidence percentages and projected target prices for the next market session.
- **Pandas Data Wrangling**: 100,000-sample dataset, `describe()`, `corr()`, `groupby()` aggregations, `crosstab`, and IQR outlier detection.
- **Scikit-Learn ML Models**: Multi-model training (`HistGradientBoostingClassifier`/`Regressor`, `RandomForestClassifier`, `DecisionTreeClassifier`, `LinearRegression`, `KNeighborsClassifier`, `SVC`) with Confusion Matrix decomposition ($TP$, $TN$, $FP$, $FN$).
- **Resilient Microservices**: Round-robin load-balanced Django inference workers backed by a Node.js Backend-for-Frontend (BFF) and MongoDB audit storage.

---

## 2. High-Level System Architecture

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │                  React 18 Frontend                      │
                                  │              (Vite Dev Server, Port 5173)              │
                                  │ Dashboard │ Markets │ Analytics Hub │ Orders │ Account  │
                                  └────────────────────────────┬────────────────────────────┘
                                                               │  HTTP / REST
                                                               │  Bearer JWT Header
                                                               ▼
                                  ┌─────────────────────────────────────────────────────────┐
                                  │          Node.js BFF Gateway (Express, Port 5000)       │
                                  │                                                         │
                                  │  • Auth Controller (JWT, bcrypt, 6-Digit Email OTP)     │
                                  │  • Predict & Analytics Controller (Proxy to Django)     │
                                  │  • Commodity Controller (12-Sec Scraper Refresh Loop)    │
                                  │  • History Controller (MongoDB Audit Log Engine)        │
                                  │  • Round-Robin Load Balancer Service                    │
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
                                      │ • Scikit-Learn Predictor    │               │ • Scikit-Learn Predictor    │
                                      │ • Pandas Analytics Engine   │               │ • Pandas Analytics Engine   │
                                      │ • Web Scraper Engine (BS4)  │               │ • Web Scraper Engine (BS4)  │
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

---

## 3. Technology Stack

| Layer | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React | 18.2 | Single-page application framework |
| **Build Tooling** | Vite | 4.4 | Fast asset bundler and dev server |
| **Design System** | Custom Vanilla CSS | CSS3 | Light corporate system using "Edu VIC WA NT Hand Pre" & "Germania One" |
| **BFF Gateway** | Node.js / Express | 4.18 | Gateway server handling Auth, API proxy, and state persistence |
| **Database & ODM** | MongoDB & Mongoose | 7.3 | Document database storing users, OTPs, and prediction audit logs |
| **Auth & Security** | JWT & Bcrypt.js | 9.0 / 2.4 | Token authentication (7-day TTL) and password encryption |
| **ML Microservice**| Python / Django | 3.10+ / 4.2 | REST microservice exposing prediction, analytics & scraping endpoints |
| **API Framework** | Django REST Framework| 3.14 | Serializers, input validation, and HTTP request routing |
| **ML Framework** | Scikit-Learn | 1.3 | Estimators (`HistGradientBoosting`, `RandomForest`, `DecisionTree`, `LinearRegression`, `kNN`, `SVC`) |
| **Data Wrangling** | Pandas | 2.0 | `shape`, `info()`, `describe()`, `loc`/`iloc`, `groupby()`, `agg()`, `corr()`, IQR bounds |
| **Web Scraping** | BeautifulSoup4 / Requests | 4.12 / 2.31 | Live DOM parsing and HTTP endpoint scraping |

---

## 4. Core Concepts & Technical Alignment

- **Data Manipulation & Analysis with Pandas**:
  - DataFrame & Series creation (100,000 samples).
  - Inspection: `df.shape`, `df.dtypes`, `df.describe()`.
  - Qualitative Data (crop names) vs Quantitative Data (prices, supply, demand).
  - `loc[]` vs `iloc[]` slicing (`subset_iloc = df.iloc[0:10, 0:5]`).
  - Boolean Indexing: `df.loc[(df['market_demand_score'] >= 7.0) & (df['supply_volume'] <= 250.0)]`.
  - Missing Data & Duplicates: `dropna(how='any', subset=['crop'])`, `ffill()`, `drop_duplicates(subset=['crop', 'previous_price'], keep='first')`.
  - Transformations: `sort_values(ascending=[True, False])`, `sort_index()`, `replace()`, `astype()`, `apply()` with lambda functions along `axis=1`, `unique()`, `nunique()`.
  - Aggregation, Grouping & Merging: `groupby()`, `agg()`, `nth(0)`, `crosstab()`.
  - Statistics & Outliers: `corr()`, IQR outlier detection using `.quantile(0.25)` and `.quantile(0.75)`.

- **Data Visualization**:
  - Seaborn & Plotly Express chart payloads (`sns.heatmap`, `px.bar`, `sns.boxplot`, `px.scatter_3d`).
  - Network Graphs: `nx.Graph()` (Undirected) and `nx.DiGraph()` (Directed) with `add_node()` and `add_edge()`.

- **Machine Learning Fundamentals & Preprocessing**:
  - One-Hot Encoding via `pd.get_dummies()`.
  - Binning continuous demand scores via `pd.cut()`.
  - Feature Scaling via `StandardScaler()`.
  - Partitioning via `train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)`.

- **Regression Analysis**:
  - `LinearRegression` ($\hat{y} = \beta_0 + \beta_1 x_1 + \dots + \beta_n x_n$), `.fit(X, y)`, `.predict(X)`, `coef_`, `intercept_`.
  - `HistGradientBoostingRegressor`.
  - Metrics: $R^2$ Score, MSE, RMSE, and MAE.

- **Supervised Classification Methods**:
  - `HistGradientBoostingClassifier`, `RandomForestClassifier(n_estimators=100)`, `DecisionTreeClassifier(criterion='entropy')`, `KNeighborsClassifier(n_neighbors=5)`, `SVC(kernel='rbf')`.
  - Full 2x2 Confusion Matrix ($TP = 8,284$, $TN = 8,336$, $FP = 1,675$, $FN = 1,705$).
  - Derived Performance Formulas:
    - $\text{Accuracy} = \frac{TP + TN}{\text{Total Predictions}} = 83.10\%$
    - $\text{Sensitivity / Recall} = \frac{TP}{TP + FN} = 82.93\%$
    - $\text{Specificity} = \frac{TN}{TN + FP} = 83.27\%$
    - $\text{Precision} = \frac{TP}{TP + FP} = 83.18\%$
    - $\text{F1 Score} = \frac{2 \times \text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}} = 83.06\%$
    - $\text{Error Rate} = \frac{FP + FN}{\text{Total Predictions}} = 16.90\%$
    - $\text{ROC AUC Score} = 0.9131$

- **Deep Learning Foundations & CNN**:
  - Deep Learning CNN specification payload (`Conv2D`, `ReLU`, `Stride`, `MaxPooling2D`, `BatchNormalization`, `Dropout`, `Flatten`, `Dense`, `Softmax`).

- **Web Scraping & API Integration**:
  - `requests.get()`, `BeautifulSoup` parsing (`find()`, `find_all()`, `.get_text()`), HTTP status codes (200, 404, 500), and `json.dumps()` / `json.loads()`.

- **Django & DRF Framework**:
  - MVT architecture (`settings.py`, `urls.py`, `views.py`, `serializers.py`, `ModelSerializer`, `@api_view`, `IsAuthenticated`, JWT auth).

---

## 5. Frontend Architecture & Features (`react-frontend`)

### UI Design System & Aesthetics
- **Theme**: Light corporate styling system with glassmorphic cards and polished highlights.
- **Typography**:
  - **Primary Font**: `Edu VIC WA NT Hand Pre` (loaded via Google Fonts) for global text, layout components, and body copy.
  - **Secondary / Branding Font**: `Germania One` (loaded via Google Fonts) for display typography, accessible via the `.germania-one-regular` helper class.
- **Key Interface Upgrades**:
  - **Pill-shaped Expanding Search Bar**: Features a vertically centered icon and smooth input resizing (from `200px` to `260px` width) with a glowing backdrop shadow on focus.
  - **Unified Notification System**: Synced global Header and local OrdersView panels that react dynamically to real-time events. Emits notification items on successful ML model predictions (Dashboard) and inventory updates (Orders/Quick Adjust/AI Liquidation). Supports toggling read states, deleting cards, and batch operations.
  - **Sidebar Brand Polish**: Features a gradient background logo box with border outlines and translation offsets, accompanied by a pulsing active status indicator (`pulse-dot-green`).
- **Components**: `Dashboard.jsx`, `AnalyticsView.jsx`, `MarketsView.jsx`, `OrdersView.jsx`, `AuthModal.jsx`, `Sidebar.jsx`, `Header.jsx`.

### Detailed Component Implementation & State Flow

#### 1. Unified Real-Time Notifications
- **Global State (`App.jsx`)**: Declares `notifications` state and handlers (`addNotification`, `markNotificationAsRead`, `clearNotification`, `markAllNotificationsAsRead`, `clearAllNotifications`).
- **Header Alert Dropdown (`Header.jsx`)**: Displays the unread badge and counts, lists active logs with check (read) and close (dismiss) buttons, and links to bulk action handles.
- **Local Control Panel (`OrdersView.jsx`)**: Subscribed to the same parent state so notifications are fully synchronized in real-time. Actions inside the stock view (buying, quick adding/selling, and AI liquidating) dynamically dispatch new event notifications.

#### 2. Expanding Search Interface
- **State Handling (`App.jsx` & `Header.jsx`)**: Binds input `searchQuery` to filter crop options dynamically.
- **Layout Transitions (`index.css`)**: Implements standard CSS hardware-accelerated transitions that expand the input width from `200px` to `260px` when active, adding a soft outer glow.

#### 3. Brand Block & Sidebar Telemetry
- **Active State pulsing dot (`Sidebar.jsx` & `index.css`)**: Integrates `@keyframes pulse-glowing-green` and `@keyframes pulse-glowing-red` to power status indicator dots dynamically.
- **Logo Gradient Overlay (`index.css`)**: Styles the logo box container with `linear-gradient(135deg, var(--clr-primary), var(--clr-primary-container))`, custom border radius, border-outline rules, and soft drop shadow.

---

## 6. Backend BFF Gateway Architecture (`node-auth-backend`)

- **Server Entry**: [`server.js`](node-auth-backend/server.js) initializes Express, connects to MongoDB, seeds default admin user (`dhruvilthummar37@gmail.com`), and mounts route handlers.
- **Predict Routes**: [`predictRoutes.js`](node-auth-backend/src/routes/predictRoutes.js) proxies prediction, analytics (`/analytics`), and summary (`/summary`) calls to Django worker via load balancer.
- **Load Balancer**: [`loadBalancer.js`](node-auth-backend/src/services/loadBalancer.js) manages active round-robin worker dispatches and pings health checks every 15s.

---

## 7. Django ML Microservice (`django-predict-service`)

- **Dataset & Model Pipeline**: [`train_model.py`](django-predict-service/model/train_model.py) builds the 100,000-sample Pandas DataFrame, trains Scikit-Learn models, computes Confusion Matrix metrics, and dumps joblib artifact package to `model/artifacts/agripulse_sklearn_models.joblib`.
- **Inference Engine**: [`predictor_engine.py`](django-predict-service/model/predictor_engine.py) loads model artifact and exposes prediction and analytics classmethods.
- **Scraper Engine**: [`scraper.py`](django-predict-service/model/scraper.py) scrapes APMC Mandis using BeautifulSoup4 and Yahoo Finance API.

---

## 8. Complete End-to-End API Reference

### Base URLs
- **Node.js BFF Gateway**: `http://localhost:5000/api`
- **Django ML Microservice**: `http://localhost:8000/api/v1`

---

### Endpoints Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/signup` | Public | Register new user & send 6-digit OTP email |
| `POST` | `/api/auth/verify-otp` | Public | Verify email OTP code |
| `POST` | `/api/auth/login` | Public | Authenticate user & return 7-day JWT token |
| `POST` | `/api/predict` | 🔒 Private | Run ML prediction & log to MongoDB |
| `GET` | `/api/predict/history` | 🔒 Private | Fetch user's 20 most recent predictions |
| `DELETE` | `/api/predict/history` | 🔒 Private | Clear user's prediction history |
| `GET` | `/api/predict/analytics` | Public | Returns Pandas statistical metrics & IQR bounds |
| `GET` | `/api/predict/summary` | Public | Returns Scikit-Learn Confusion Matrix metrics |
| `GET` | `/api/commodity-prices` | 🔒 Private | Returns live scraped APMC mandi prices |
| `GET` | `/health` | Public | Returns BFF gateway health status |
| `GET` | `/api/v1/health` | Public | Returns Django worker health status |

---

## 9. Database Schema & Models

MongoDB collections managed via Mongoose:
- `User`: `name`, `email`, `password` (bcrypt hash), `isVerified`, `createdAt`.
- `Otp`: `email`, `otpCode`, `expiresAt` (TTL index auto-expires after 5 mins).
- `Prediction`: `user`, `crop`, `previousPrice`, `supplyVolume`, `transportCostIndex`, `marketDemandScore`, `prediction`, `confidence`, `probabilityUp`, `createdAt`.

---

## 10. Setup & Local Execution Guide

```bash
# Terminal 1: Django ML Service
cd django-predict-service
python model/train_model.py
python manage.py runserver 8000

# Terminal 2: Node.js BFF Gateway
cd node-auth-backend
npm run dev

# Terminal 3: React Frontend
cd react-frontend
npm run dev
```

Application URL: **`http://localhost:5173`**
