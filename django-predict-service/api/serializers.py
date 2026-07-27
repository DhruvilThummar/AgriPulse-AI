# ──────────────────────────────────────────────────────────────
# FILE: serializers.py
# WHERE IT IS: django-predict-service/api/serializers.py
# WHAT IT DOES: Defines "Serializers" — these are like smart validators.
#               When the frontend sends data to our API, the serializer:
#                 1. Checks if all required fields are present
#                 2. Validates that the values are the right type and in range
#                 3. Converts the raw data into clean Python objects
#               Think of a serializer like a form validator.
# WHEN IT RUNS: Every time a POST/GET request hits one of our API views.
# HOW IT WORKS: Imported and used inside api/views.py
# ──────────────────────────────────────────────────────────────

# serializers: Django REST Framework's module for creating validators/converters
from rest_framework import serializers

# SUPPORTED_CROPS: The master list of valid crop names (single source of truth)
# Imported from the scraper module so this list is never duplicated or out of sync.
# If you add a new crop to scraper.py, this automatically picks it up.
from model.scraper import SUPPORTED_CROPS


# ──────────────────────────────────────────────────────────────
# CLASS: PredictionInputSerializer
# WHAT IT IS: A validator for the POST /api/v1/predict request body.
# WHEN TO USE: In the PredictView when handling incoming prediction requests.
# HOW IT WORKS: Define each expected field with its type and rules.
#               Call serializer.is_valid() to run all checks at once.
# ──────────────────────────────────────────────────────────────
class PredictionInputSerializer(serializers.Serializer):

    # previous_price: The last known market price for this commodity (in INR per Quintal)
    # required=True → the request MUST include this field, otherwise it fails validation
    # min_value=1.0  → the price cannot be 0 or negative
    previous_price = serializers.FloatField(
        required=True,
        min_value=1.0,
        help_text="Previous market closing price per Quintal in INR"
    )

    # supply_volume: How much of this crop is available in the market (in Tons)
    # Higher supply usually pushes prices DOWN (basic economics)
    supply_volume = serializers.FloatField(
        required=True,
        min_value=1.0,
        help_text="Total available market supply volume in Tons"
    )

    # transport_cost_index: A relative index for how expensive transportation is
    # 100 = baseline (normal cost). Higher = more expensive freight = higher prices
    transport_cost_index = serializers.FloatField(
        required=True,
        min_value=10.0,
        help_text="Transit freight logistics cost index (Baseline = 100)"
    )

    # market_demand_score: A score from 1 to 10 representing how high demand is
    # 1 = very low demand, 10 = very high demand
    # Higher demand usually pushes prices UP
    market_demand_score = serializers.FloatField(
        required=True,
        min_value=1.0,
        max_value=10.0,
        help_text="Consumer market demand rating (strictly between 1.0 and 10.0)"
    )

    # crop: The name of the commodity to predict (e.g. 'wheat', 'rice', 'cotton')
    # required=False → if not provided, defaults to 'wheat'
    crop = serializers.CharField(
        required=False,
        default='wheat',
        help_text="Target commodity name"
    )

    # ── Custom Field Validator ──
    # validate_crop: This special method runs automatically when is_valid() is called.
    # DRF naming convention: validate_<fieldname>() → runs for that specific field.
    # WHAT IT DOES: Cleans the crop name (strips spaces, lowercases it) and
    #               checks if it is in our SUPPORTED_CROPS list.
    # WHY: Prevents users from submitting invalid crop names like "banana" or "xyz".
    def validate_crop(self, value):
        """Validates that requested crop is present in SUPPORTED_CROPS from model.scraper."""
        # Clean up the input — remove leading/trailing spaces and make lowercase
        normalized = str(value).strip().lower()

        # Check if the cleaned crop name is in the master supported list
        if normalized not in SUPPORTED_CROPS:
            # If not found, raise a validation error with a helpful message
            raise serializers.ValidationError(
                f"Unknown crop '{normalized}'. Valid commodities: {SUPPORTED_CROPS}"
            )

        # Return the cleaned value to be stored in serializer.validated_data
        return normalized


# ──────────────────────────────────────────────────────────────
# CLASS: HealthStatusSerializer
# WHAT IT IS: A serializer for the GET /api/v1/health response.
# WHEN TO USE: Used in HealthCheckView to structure the health status response.
# WHY: Ensures all health check fields are present and correctly typed
#      before sending to the Node.js load balancer.
# ──────────────────────────────────────────────────────────────
class HealthStatusSerializer(serializers.Serializer):
    status = serializers.CharField()           # e.g. "HEALTHY" or "DEGRADED"
    service = serializers.CharField()          # e.g. "Django ML Predict Microservice"
    version = serializers.CharField()          # e.g. "2.4.0"
    worker_node = serializers.CharField()      # e.g. "Worker-Node-127.0.0.1:8000"
    uptime_seconds = serializers.FloatField()  # How long the server has been running (seconds)
    active_engine = serializers.CharField()    # e.g. "Direct API ML Model Engine"
    timestamp = serializers.CharField()        # ISO 8601 datetime string of the response


# ──────────────────────────────────────────────────────────────
# CLASS: CommoditySerializer
# WHAT IT IS: A serializer for the GET /api/v1/commodities response items.
# WHEN TO USE: Used in CommodityListView to serialize each commodity's metadata.
# WHY: Ensures each commodity object in the response has the correct fields
#      with proper types before it is sent to the frontend.
# ──────────────────────────────────────────────────────────────
class CommoditySerializer(serializers.Serializer):
    code = serializers.IntegerField()           # Numeric crop ID (e.g. 0 for wheat)
    crop = serializers.CharField()              # Crop key (e.g. "wheat")
    name = serializers.CharField()              # Display name (e.g. "Wheat (Premium)")
    base_price = serializers.IntegerField()     # Live scraped spot price in INR
    min_bound = serializers.IntegerField()      # Lower price bound for this commodity
    max_bound = serializers.IntegerField()      # Upper price bound for this commodity
    symbol = serializers.CharField(allow_null=True)  # Yahoo Finance ticker (e.g. "ZW=F"), or None


# ──────────────────────────────────────────────────────────────
# CLASS: AnalyticsResponseSerializer
# WHAT IT IS: Serializer for GET /api/v1/analytics endpoint (Unit 1 & 10)
# ──────────────────────────────────────────────────────────────
class AnalyticsResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    pandas_analytics = serializers.DictField()
    chart_payloads = serializers.DictField()
    dataset_samples = serializers.IntegerField()
    pandas_version = serializers.CharField()
    timestamp = serializers.CharField()


# ──────────────────────────────────────────────────────────────
# CLASS: ModelSummarySerializer
# WHAT IT IS: Serializer for GET /api/v1/model/summary endpoint (Unit 3-5 & 10)
# ──────────────────────────────────────────────────────────────
class ModelSummarySerializer(serializers.Serializer):
    status = serializers.CharField()
    classification_metrics = serializers.DictField()
    linear_regression_metrics = serializers.DictField()
    gbdt_regressor_metrics = serializers.DictField()
    feature_contributions = serializers.DictField()
    feature_names = serializers.ListField(child=serializers.CharField())
    scikit_learn_version = serializers.CharField()
    trained_at = serializers.CharField()
    timestamp = serializers.CharField()
