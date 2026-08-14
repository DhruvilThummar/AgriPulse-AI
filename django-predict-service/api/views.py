# ──────────────────────────────────────────────────────────────
# FILE: views.py
# WHERE IT IS: django-predict-service/api/views.py
# WHAT IT DOES: This is the main "controller" layer of the Django REST API.
#               Each class in this file handles one API endpoint.
#               When a request arrives, Django calls the matching class's method.
# WHEN IT RUNS: Triggered by HTTP requests — POST, GET, etc.
# HOW IT WORKS:
#   1. Request comes in → Django router (api/urls.py) directs it here.
#   2. The view validates input, calls the scraper and ML engine.
#   3. Returns a structured JSON response.
# ──────────────────────────────────────────────────────────────

# time: Python standard library — used to track server uptime
import time

# datetime: Python standard library — used to generate ISO timestamp strings
from datetime import datetime

# APIView: Base class for all our REST API views (from Django REST Framework)
from rest_framework.views import APIView

# Response: DRF's response class — automatically formats Python dicts as JSON
from rest_framework.response import Response

# status: DRF constants for HTTP status codes (e.g. status.HTTP_200_OK = 200)
from rest_framework import status

from .serializers import (
    PredictionInputSerializer,   # Validates POST /predict input fields
    HealthStatusSerializer,      # Structures GET /health response
    CommoditySerializer,         # Structures GET /commodities response items
    AnalyticsResponseSerializer, # Structures GET /analytics response (Unit 1)
    ModelSummarySerializer       # Structures GET /model/summary response (Unit 3-5)
)

# Import the web scraper and ML engine from the model/ package
# CommodityWebScraper: scrapes live prices from internet → feeds into ML engine
# SUPPORTED_CROPS: the list of all valid crop names we support
from model.scraper import CommodityWebScraper, SUPPORTED_CROPS

# AgriPulseMLPredictor: runs the mathematical ML ensemble to produce UP/DOWN predictions
from model.predictor_engine import AgriPulseMLPredictor

# AgriWeatherService: OpenWeatherMap API integration for live agricultural region telemetry
from model.weather_service import AgriWeatherService

# SERVICE_START_TIME: Records the exact Unix timestamp when the server first started.
# Used in the /health endpoint to calculate how long the server has been running (uptime).
SERVICE_START_TIME = time.time()


# ──────────────────────────────────────────────────────────────
# CLASS: PredictView
# HANDLES: POST /api/v1/predict  (and legacy /api/predict)
# ACCESS: Public (auth handled at the Node.js BFF layer)
# WHAT IT DOES:
#   Step 1 → Validate the request body using PredictionInputSerializer
#   Step 2 → Scrape live commodity spot price data from the internet
#   Step 3 → Fetch live weather telemetry via OpenWeatherMap API for location
#   Step 4 → Feed scraped data + user inputs + weather score into the ML prediction engine
#   Step 5 → Return the prediction result as JSON
# ──────────────────────────────────────────────────────────────
class PredictView(APIView):

    # post(): Called when a POST request hits /api/v1/predict
    # request: Django REST Framework request object (contains body, headers, etc.)
    def post(self, request):

        # ── Step 1: Validate Request Body ──
        # Pass the raw request body into the serializer for validation
        serializer = PredictionInputSerializer(data=request.data)

        # is_valid(): Runs all field validators. Returns True if everything is OK.
        if not serializer.is_valid():
            # If validation fails, return a 400 Bad Request with the error details
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # validated_data: A clean Python dict with all fields type-checked and sanitized
        validated_data = serializer.validated_data

        # Extract each field from the validated data
        crop_name      = validated_data['crop']                # e.g. 'wheat'
        prev_price     = validated_data['previous_price']      # e.g. 2450.0
        supply_vol     = validated_data['supply_volume']       # e.g. 120.0
        trans_idx      = validated_data['transport_cost_index'] # e.g. 105.0
        demand_score   = validated_data['market_demand_score']  # e.g. 7.5
        location       = validated_data.get('location', 'Khanna')
        weather_impact = validated_data.get('weather_impact_score')
        msp_diff       = validated_data.get('msp_difference_pct', 0.02)

        # Dynamic live weather telemetry score lookup if not explicitly provided
        if weather_impact is None:
            weather_impact = AgriWeatherService.get_weather_impact_score(location)

        # get_crop_config(): Looks up metadata for this crop (symbol, code, base reference price)
        crop_info = CommodityWebScraper.get_crop_config(crop_name)
        crop_code = crop_info['code']  # Numeric ID used by the ML engine

        # ── Step 2: Live Web Scraping ──
        # scrape_commodity_data(): Hits live finance APIs and HTML pages to get real-time data.
        # Returns a dict with: scraped_spot_price, scraped_change_pct, historical_7d_avg, etc.
        scraped_data = CommodityWebScraper.scrape_commodity_data(crop_name)

        # ── Step 3: ML Model Engine Inference ──
        # predict(): Combines user inputs + scraped data through the ensemble ML engine.
        # Returns: { prediction: "UP"/"DOWN", confidence: 73.5, probability_up: 73.5, ... }
        prediction_output = AgriPulseMLPredictor.predict(
            previous_price=prev_price,
            supply_volume=supply_vol,
            transport_cost_index=trans_idx,
            market_demand_score=demand_score,
            crop_code=crop_code,
            scraped_data=scraped_data,    # Live scraped data is fed directly into the model
            weather_impact_score=weather_impact,
            msp_difference_pct=msp_diff
        )

        # Inject weather & location telemetry into response payload
        prediction_output['telemetry'] = {
            'location': location,
            'weather_impact_score': weather_impact,
            'msp_difference_pct': msp_diff
        }

        # ── Step 4: Build and Return Response ──
        # Combine prediction results + scraping metadata into one response envelope
        response_payload = {
            "success": True,
            "prediction": prediction_output["prediction"],       # "UP" or "DOWN"
            "confidence": prediction_output["confidence"],       # e.g. 73.5 (percentage)
            "probability_up": prediction_output["probability_up"], # e.g. 73.5%
            "target_price": prediction_output["target_price"],   # Forecasted next price in INR
            "crop": crop_name,                                   # e.g. "wheat"
            "execution_method": prediction_output["execution_method"],  # Model description
            "models": prediction_output["sub_models"],           # LogReg + GradBoost sub-results
            "web_scraping": scraped_data,                        # All live scraped data included
            "timestamp": datetime.utcnow().isoformat() + "Z"    # ISO 8601 UTC timestamp
        }

        # Return HTTP 200 OK with the prediction payload as JSON
        return Response(response_payload, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────────────────────
# CLASS: HealthCheckView
# HANDLES: GET /api/v1/health
# ACCESS: Public — used by the Node.js Load Balancer to check if this worker is alive
# WHAT IT DOES: Returns server status, uptime, and version info.
#               The Node.js BFF pings this every 15 seconds to decide
#               which Django workers are healthy enough to receive traffic.
# ──────────────────────────────────────────────────────────────
class HealthCheckView(APIView):

    # get(): Called when a GET request hits /api/v1/health
    def get(self, request):
        # Calculate how many seconds the server has been running since it started
        uptime = round(time.time() - SERVICE_START_TIME, 2)

        # Build the health status response payload
        payload = {
            "status": "HEALTHY",
            "service": "Django ML Predict Microservice",
            "version": "2.4.0",
            # request.get_host() returns the hostname (e.g. 127.0.0.1:8000)
            "worker_node": f"Worker-Node-{request.get_host()}",
            "uptime_seconds": uptime,
            "active_engine": "Direct API ML Model Engine (model/package, Zero .pkl dependency)",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        # Serialize the payload through HealthStatusSerializer to ensure correct field types
        serializer = HealthStatusSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────────────────────
# CLASS: CommodityListView
# HANDLES: GET /api/v1/commodities
# ACCESS: Public — used by the frontend to show available crops
# WHAT IT DOES: Scrapes live metadata for ALL supported commodities
#               and returns them as a list with current price bounds.
#               This is called when the user opens the "Markets" page.
# ──────────────────────────────────────────────────────────────
class CommodityListView(APIView):

    # get(): Called when a GET request hits /api/v1/commodities
    def get(self, request):
        # get_dynamic_registry(): Loops through all SUPPORTED_CROPS and scrapes
        # live data for each one. Returns a dict keyed by crop name.
        dynamic_registry = CommodityWebScraper.get_dynamic_registry()

        # Build a flat list of commodity objects for the response
        items = []
        for key, conf in dynamic_registry.items():
            # Each item maps the scraped data into the format the frontend expects
            items.append({
                "code": conf["code"],          # Numeric crop ID
                "crop": key,                   # Crop key string (e.g. "rice")
                "name": conf["name"],          # Display name (e.g. "Rice (Premium Spot Market)")
                "base_price": conf["basePrice"], # Live scraped spot price
                "min_bound": conf["min"],      # Lower trading band
                "max_bound": conf["max"],      # Upper trading band
                "symbol": conf["symbol"]       # Yahoo Finance symbol (e.g. "ZW=F") or None
            })

        # Serialize the list through CommoditySerializer (many=True handles a list of items)
        serializer = CommoditySerializer(items, many=True)

        # Return HTTP 200 OK with the full commodities list
        return Response({"success": True, "commodities": serializer.data}, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────────────────────
# CLASS: AnalyticsView
# HANDLES: GET /api/v1/analytics (Unit 1 & 10)
# ACCESS: Public
# WHAT IT DOES: Exposes Pandas statistical summaries (describe, corr, groupby aggregations,
#               IQR outliers, and Plotly visualization payload).
# ──────────────────────────────────────────────────────────────
class AnalyticsView(APIView):

    def get(self, request):
        analytics_data = AgriPulseMLPredictor.get_pandas_analytics()
        analytics_data["timestamp"] = datetime.utcnow().isoformat() + "Z"
        serializer = AnalyticsResponseSerializer(analytics_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ──────────────────────────────────────────────────────────────
# CLASS: ModelSummaryView
# HANDLES: GET /api/v1/model/summary (Unit 3-5 & 10)
# ACCESS: Public
# WHAT IT DOES: Exposes Scikit-Learn training metrics, Confusion Matrix decomposition,
#               regression parameters, and feature contributions.
# ──────────────────────────────────────────────────────────────
class ModelSummaryView(APIView):

    def get(self, request):
        summary_data = AgriPulseMLPredictor.get_model_summary()
        summary_data["timestamp"] = datetime.utcnow().isoformat() + "Z"
        serializer = ModelSummarySerializer(summary_data)
        return Response(serializer.data, status=status.HTTP_200_OK)
