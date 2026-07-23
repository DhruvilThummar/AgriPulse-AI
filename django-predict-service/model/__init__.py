# ──────────────────────────────────────────────────────────────
# FILE: __init__.py
# WHERE IT IS: django-predict-service/model/__init__.py
# WHAT IT DOES: This file turns the "model" folder into a Python Package.
#               Any folder that has an __init__.py inside it can be imported
#               like a module. For example: "from model import CommodityWebScraper"
# WHEN IT RUNS: Automatically executed by Python the first time anything
#               does "import model" or "from model import ..."
# HOW IT WORKS: It imports the main classes/variables from the sub-modules
#               (scraper.py and predictor_engine.py) and makes them available
#               directly from "model" without needing to go deeper.
# ──────────────────────────────────────────────────────────────

# Import the web scraper class from model/scraper.py
# CommodityWebScraper: used to scrape live commodity prices from the internet
# SUPPORTED_CROPS: the list of all valid crop names this system supports
from .scraper import CommodityWebScraper, SUPPORTED_CROPS

# Import the ML prediction engine class from model/predictor_engine.py
# AgriPulseMLPredictor: used to run the mathematical ML model and return UP/DOWN predictions
from .predictor_engine import AgriPulseMLPredictor

# __all__: Defines the "public API" of this package.
# When someone does "from model import *", only these names are exported.
# It acts as a whitelist of what is allowed to be used externally.
__all__ = ['CommodityWebScraper', 'AgriPulseMLPredictor', 'SUPPORTED_CROPS']
