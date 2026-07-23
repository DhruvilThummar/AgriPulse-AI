# ──────────────────────────────────────────────────────────────
# FILE: urls.py
# WHERE IT IS: django-predict-service/api/urls.py
# WHAT IT DOES: Defines the URL routing for the API application.
#               This is the SECOND-LEVEL router (after predict_service/urls.py).
#               predict_service/urls.py forwards everything starting with "api/"
#               here, and THIS file matches the rest of the URL.
# WHEN IT RUNS: Every time Django receives an HTTP request.
# HOW IT WORKS:
#   1. Request comes in → predict_service/urls.py catches "api/" prefix.
#   2. Remaining URL (e.g. "v1/predict") is matched here.
#   3. Matched to the correct View class which handles the request.
#
# FULL URL BREAKDOWN:
#   /api/v1/predict     → predict_service/urls.py strips "api/"
#                      → api/urls.py matches "v1/predict" → PredictView
#   /api/v1/health      → matches "v1/health" → HealthCheckView
#   /api/v1/commodities → matches "v1/commodities" → CommodityListView
#   /api/predict        → matches "predict" → PredictView (legacy)
# ──────────────────────────────────────────────────────────────

# path: Function to define a URL pattern with an exact string match.
# Usage: path('some/url', SomeView.as_view(), name='route-name')
from django.urls import path

# Import all 3 view classes that handle our endpoints.
# These are defined in api/views.py.
from .views import PredictView, HealthCheckView, CommodityListView

# urlpatterns: The list Django reads to match incoming URL paths.
# Each path() entry maps a URL string → a View class → a route name.
# The name is used for reverse URL lookups (e.g. in tests or redirects).
urlpatterns = [

    # ── v1 REST API Endpoints (current, recommended) ──

    # POST /api/v1/predict → PredictView
    # Accepts: { previous_price, supply_volume, transport_cost_index, market_demand_score, crop }
    # Returns: ML prediction result with live scraped data
    path('v1/predict', PredictView.as_view(), name='api-v1-predict'),

    # GET /api/v1/health → HealthCheckView
    # Returns: server status, uptime, version (used by Node.js load balancer health pings)
    path('v1/health', HealthCheckView.as_view(), name='api-v1-health'),

    # GET /api/v1/commodities → CommodityListView
    # Returns: list of all supported commodities with live scraped price metadata
    path('v1/commodities', CommodityListView.as_view(), name='api-v1-commodities'),

    # ── Legacy Backward Compatibility ──

    # POST /api/predict → PredictView (same handler as v1, just a shorter URL)
    # Kept for older frontend code that still uses the non-versioned path.
    path('predict', PredictView.as_view(), name='api-predict-legacy'),
]
