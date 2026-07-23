# ──────────────────────────────────────────────────────────────
# FILE: predictor_engine.py
# WHERE IT IS: django-predict-service/model/predictor_engine.py
# WHAT IT DOES: This is the ML (Machine Learning) prediction engine.
#               It does NOT use .pkl files or scikit-learn.
#               Instead, it implements the math of two ML models directly in Python:
#                 1. Logistic Regression  → produces probability A
#                 2. Gradient Boosting    → produces probability B
#                 3. Ensemble Average     → combines A and B for final prediction
# WHEN IT RUNS: Called once per POST /api/v1/predict request, AFTER web scraping.
# HOW IT WORKS: Takes the user inputs + scraped live data → runs math → returns UP/DOWN + confidence
# ──────────────────────────────────────────────────────────────

# math: Python's standard math library — used for the exponential function (math.exp)
# math.exp(-x) is needed for the Logistic (Sigmoid) function: 1 / (1 + e^-x)
import math


# ──────────────────────────────────────────────────────────────
# CLASS: AgriPulseMLPredictor
# WHAT IT IS: The prediction engine class.
# WHEN TO USE: Called in api/views.py → PredictView.post()
# HOW IT WORKS: All logic is in a single @staticmethod predict() method.
#               No class instantiation needed — call AgriPulseMLPredictor.predict(...) directly.
# ──────────────────────────────────────────────────────────────
class AgriPulseMLPredictor:

    # ──────────────────────────────────────────────────────────
    # METHOD: predict
    # WHAT IT DOES: Runs the ensemble ML model to produce a price direction forecast.
    # WHEN TO USE: Called after web scraping in PredictView.post()
    #
    # PARAMETERS (what you send in):
    #   previous_price       → The last known market price (INR per Quintal). e.g. 2450
    #   supply_volume        → Total market supply in Tons. e.g. 120.0
    #   transport_cost_index → Freight cost index (100 = normal). e.g. 105.0
    #   market_demand_score  → Demand rating from 1–10. e.g. 7.5
    #   crop_code            → Numeric crop ID (generated from crop name). e.g. 42
    #   scraped_data         → Dict from CommodityWebScraper.scrape_commodity_data()
    #                          Contains: scraped_spot_price, historical_7d_avg, etc.
    #
    # RETURNS: A dict with:
    #   prediction     → "UP" or "DOWN"
    #   confidence     → Percentage confidence in the prediction (e.g. 73.5)
    #   probability_up → Probability the price will go UP (e.g. 73.5%)
    #   target_price   → Forecasted next price in INR
    #   execution_method → Description string
    #   sub_models     → Breakdown of each sub-model's individual prediction
    # ──────────────────────────────────────────────────────────
    @staticmethod
    def predict(previous_price, supply_volume, transport_cost_index, market_demand_score, crop_code, scraped_data):

        # Extract live scraped prices from the scraped_data dict
        # If scraping failed and the key is missing, fall back to previous_price
        scraped_spot = scraped_data.get("scraped_spot_price", previous_price)  # Live spot price
        hist_7d_avg  = scraped_data.get("historical_7d_avg", previous_price)   # 7-day average price


        # ── FEATURE ENGINEERING ──
        # Feature engineering = transforming raw inputs into meaningful signals for the model.
        # Each variable below represents one "signal" or "factor" that influences price.

        # spot_momentum: How much has the price moved from the previous close to the current spot?
        # Positive = price going up (bullish), Negative = price going down (bearish)
        # Dividing by previous_price normalizes it to a percentage-like ratio
        spot_momentum = (scraped_spot - previous_price) / max(1.0, previous_price)

        # historical_diff: How does the current spot compare to the 7-day average?
        # If spot > 7d_avg → recent upward trend (positive signal)
        historical_diff = (scraped_spot - hist_7d_avg) / max(1.0, hist_7d_avg)

        # demand_weight: Converts demand score (1–10) into a model weight.
        # 5.0 is the neutral midpoint → score above 5 pushes UP, below 5 pushes DOWN.
        # Multiplied by 0.38 to calibrate its influence in the final logit score.
        demand_weight = (market_demand_score - 5.0) * 0.38

        # supply_pressure: High supply → price goes DOWN (negative pressure).
        # 100.0 Tons = baseline. Above baseline = excess supply = negative signal.
        # Multiplied by -0.28 (negative) to make it push the score DOWN.
        supply_pressure = -((supply_volume - 100.0) / 200.0) * 0.28

        # freight_penalty: High transport costs = higher end price (slightly negative for buyers).
        # 100.0 = baseline freight index.
        # Multiplied by -0.14 (negative) to apply a downward correction.
        freight_penalty = -((transport_cost_index - 100.0) / 100.0) * 0.14

        # momentum_score: Combined momentum signal from spot and historical trend.
        # Weighted heavier on spot_momentum (2.5x) than historical (1.5x)
        momentum_score = (spot_momentum * 2.5) + (historical_diff * 1.5)


        # ── MODEL 1: LOGISTIC REGRESSION ──
        # Logistic Regression is a simple classification model.
        # It adds up all the weighted signals into a single "logit" score.
        # Then applies the Sigmoid function: 1 / (1 + e^-x) to convert it to a 0–1 probability.
        # A logit > 0 → probability > 0.5 → predicts UP
        # A logit < 0 → probability < 0.5 → predicts DOWN

        lr_logit  = 0.15 + demand_weight + supply_pressure + freight_penalty + momentum_score
        # Sigmoid function: converts logit score → probability between 0.0 and 1.0
        lr_prob_up = 1.0 / (1.0 + math.exp(-lr_logit))


        # ── MODEL 2: GRADIENT BOOSTING DECISION TREE ──
        # Simulates the output of a gradient boosting tree using a simpler mathematical formula.
        # Uses different weights and features to produce a second independent estimate.
        # This adds diversity to the ensemble (different model sees features differently).

        tree_score = 0.20 + (market_demand_score * 0.08) - (supply_volume * 0.001) + (spot_momentum * 2.2)
        # Apply Sigmoid to get a 0–1 probability from this model too
        cb_prob_up = 1.0 / (1.0 + math.exp(-tree_score))


        # ── ENSEMBLE AVERAGING ──
        # Ensemble = combining multiple models for a better, more robust prediction.
        # We simply average the two model probabilities (equal weighting: 50/50).
        # This reduces the risk of one model being wrong alone.

        ensemble_prob_up = (lr_prob_up + cb_prob_up) / 2.0  # Final averaged probability

        # If final probability >= 50% → price will go UP, else → price will go DOWN
        prediction = "UP" if ensemble_prob_up >= 0.50 else "DOWN"

        # Confidence = how certain the model is.
        # If UP: confidence = probability_up (the higher the better)
        # If DOWN: confidence = (1 - probability_up) (inverse for down-side confidence)
        confidence = ensemble_prob_up if prediction == "UP" else (1.0 - ensemble_prob_up)


        # ── TARGET PRICE FORECAST ──
        # Estimate how much the price will move if the prediction is correct.
        # UP: assume +3.8% price move | DOWN: assume -3.0% price move (asymmetric)
        target_move_pct = 0.038 if prediction == "UP" else -0.030
        target_price    = round(previous_price * (1 + target_move_pct))  # Forecasted next price


        # ── BUILD AND RETURN RESULT DICT ──
        return {
            "prediction":      prediction,                       # "UP" or "DOWN"
            "confidence":      round(confidence * 100, 2),      # e.g. 73.52 (%)
            "probability_up":  round(ensemble_prob_up * 100, 2), # e.g. 73.52 (%)
            "target_price":    target_price,                     # e.g. 2543 (INR)
            "execution_method": "Direct API ML Model Engine (model/predictor_engine.py)",

            # sub_models: Individual breakdown of each model's prediction (for transparency)
            "sub_models": {
                "logistic_regression": {
                    "prediction":    "UP" if lr_prob_up >= 0.50 else "DOWN",
                    "probability_up": round(lr_prob_up * 100, 2)    # LogReg's own prediction
                },
                "gradient_boosting_tree": {
                    "prediction":    "UP" if cb_prob_up >= 0.50 else "DOWN",
                    "probability_up": round(cb_prob_up * 100, 2)    # GradBoost's own prediction
                }
            }
        }
