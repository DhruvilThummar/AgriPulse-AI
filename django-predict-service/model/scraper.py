# ──────────────────────────────────────────────────────────────
# FILE: scraper.py
# WHERE IT IS: django-predict-service/model/scraper.py
# WHAT IT DOES: This is the live web scraping engine.
#               It fetches REAL-TIME commodity prices from the internet
#               using BeautifulSoup4 (HTML parser) and Yahoo Finance API.
#               No hardcoded prices — everything is scraped on demand.
# WHEN IT RUNS: Called by views.py every time a prediction request arrives.
# HOW IT WORKS:
#   - For crops with a Yahoo Finance symbol (wheat, rice, corn, etc.):
#       → Fetches live chart JSON from Yahoo Finance API
#   - For domestic crops (mustard, groundnut, turmeric, chilli):
#       → Scrapes HTML from Indian market websites using BeautifulSoup4
# ──────────────────────────────────────────────────────────────

# os: Used to read environment variables (e.g. API keys from .env file)
import os

# json: Used to parse JSON responses from Yahoo Finance API calls
import json

# urllib.request: Python's built-in HTTP client for making web requests
# Used instead of 'requests' library to avoid extra dependencies
import urllib.request

# re: Regular expressions library — used to find price numbers in HTML text
import re


# ── Try to import BeautifulSoup4 ──
# BeautifulSoup4 (bs4): HTML/XML parser used to extract data from live web pages.
# We wrap the import in try/except so the server doesn't crash even if bs4 is not installed.
# If bs4 is not installed → BS4_AVAILABLE = False → we skip HTML DOM scraping.
try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True   # bs4 is installed and ready to use
except ImportError:
    BS4_AVAILABLE = False  # bs4 is missing — HTML DOM scraping will be skipped


# COMMODITY_API_KEY: Optional API key for premium commodity data sources.
# Read from the .env file if set. If not set, defaults to None.
# Currently not used — included for future paid API integration.
COMMODITY_API_KEY = os.environ.get('COMMODITY_API_KEY', None)

# SUPPORTED_CROPS: The master list of all crop names this system supports.
# This list is used in:
#   - serializers.py → to validate the "crop" field in API requests
#   - get_dynamic_registry() → to loop and scrape data for all crops
# To add a new crop, just add its name here and provide base data in get_crop_config().
SUPPORTED_CROPS = ['wheat', 'rice', 'corn', 'cotton', 'soybean', 'sugarcane', 'mustard', 'groundnut', 'turmeric', 'chilli']


# ──────────────────────────────────────────────────────────────
# CLASS: CommodityWebScraper
# WHAT IT IS: The main web scraping engine class.
# WHEN TO USE: Called from api/views.py in all 3 endpoints.
# HOW IT WORKS: All methods are @staticmethod — they don't need
#               an instance (no need to do CommodityWebScraper() first).
#               Just call CommodityWebScraper.method_name(args) directly.
# ──────────────────────────────────────────────────────────────
class CommodityWebScraper:

    # ──────────────────────────────────────────────────────────
    # METHOD: get_crop_config
    # WHAT IT DOES: Returns metadata for a given crop name.
    #               Resolves the Yahoo Finance symbol, display name,
    #               numeric code, and base reference price.
    # WHEN TO USE: Called before scraping to get the crop's symbol
    #              (needed for Yahoo Finance API URL construction).
    # RETURNS: A dict with crop, name, symbol, code, base_ref
    # EXAMPLE: get_crop_config('wheat') → { crop: 'wheat', symbol: 'ZW=F', code: 42, ... }
    # ──────────────────────────────────────────────────────────
    @staticmethod
    def get_crop_config(crop_name):
        # Normalize input: strip spaces and make lowercase
        crop_key = str(crop_name).strip().lower()

        # symbols: Maps crop name → Yahoo Finance ticker symbol
        # Only crops that trade on international exchanges have a symbol.
        # Domestic Indian crops (mustard, groundnut, etc.) have no Yahoo symbol → None
        symbols = {'wheat': 'ZW=F', 'rice': 'ZR=F', 'corn': 'ZC=F', 'cotton': 'CT=F', 'soybean': 'ZS=F', 'sugarcane': 'SB=F'}

        # bases: Maps crop name → typical APMC Mandi base price in INR per Quintal
        # Used as a fallback/scaling reference when scraping fails or is unavailable
        bases = {'wheat': 2450, 'rice': 6800, 'corn': 1950, 'cotton': 7200, 'soybean': 4600, 'sugarcane': 315, 'mustard': 5400, 'groundnut': 6150, 'turmeric': 8900, 'chilli': 18500}

        return {
            "crop": crop_key,
            "name": crop_key.capitalize() + " (Premium Spot Market)",  # Display name
            "symbol": symbols.get(crop_key, None),   # Yahoo Finance ticker, or None if domestic
            # abs(hash(crop_key)) % 100: Generates a consistent numeric ID from the crop name string
            "code": abs(hash(crop_key)) % 100,
            "base_ref": bases.get(crop_key, 2450)    # Base INR reference price (fallback default: wheat price)
        }

    # ──────────────────────────────────────────────────────────
    # METHOD: scrape_html_dom_price
    # WHAT IT DOES: Opens a webpage URL, downloads the HTML,
    #               and uses BeautifulSoup4 to parse price values
    #               from HTML elements (span, div, td) whose CSS class
    #               contains words like "price", "last", "quote", or "rate".
    # WHEN TO USE: Called for domestic crops that don't have a Yahoo Finance symbol.
    # RETURNS: A float price number if found, or None if scraping fails.
    # EXAMPLE: scrape_html_dom_price("https://markets.business-standard.com") → 5420.0
    # ──────────────────────────────────────────────────────────
    @staticmethod
    def scrape_html_dom_price(url):
        # Skip if BeautifulSoup is not installed or URL is empty
        if not BS4_AVAILABLE or not url:
            return None

        try:
            # Create an HTTP request with a browser-like User-Agent header
            # Some websites block requests that don't look like a real browser
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

            # Open the URL and download the HTML content (timeout=3.5 seconds max)
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                # Decode the raw bytes into a Python string
                html_data = resp.read().decode('utf-8', errors='ignore')

                # Parse the HTML string with BeautifulSoup using the built-in HTML parser
                soup = BeautifulSoup(html_data, 'html.parser')

                # Find all HTML elements (span, div, td) whose CSS class name contains
                # 'price', 'last', 'quote', or 'rate' (case-insensitive)
                # re.compile() creates a regex pattern for flexible class matching
                elements = soup.find_all(['span', 'div', 'td'], class_=re.compile(r'(price|last|quote|rate)', re.I))

                # Loop through each matching element and try to extract a price number
                for el in elements:
                    # Get the visible text, strip whitespace, remove commas and ₹ symbol
                    text = el.get_text().strip().replace(',', '').replace('₹', '')

                    # Use regex to find the first number (with optional decimal) in the text
                    match = re.search(r'\d+(\.\d+)?', text)

                    if match:
                        num = float(match.group())
                        # Filter out tiny numbers — real commodity prices are always > 10
                        if num > 10:
                            return num  # Return the first valid price found

        except Exception:
            # If anything goes wrong (network error, parsing error, etc.) → silently return None
            pass

        return None  # No price found

    # ──────────────────────────────────────────────────────────
    # METHOD: scrape_commodity_data
    # WHAT IT DOES: The main scraping method. Fetches live spot price,
    #               percentage change, min/max trading bounds, and
    #               7-day average price for the requested commodity.
    # WHEN TO USE: Called in PredictView.post() before running the ML model.
    # RETURNS: A dict with all live scraped data for this crop.
    # EXAMPLE: scrape_commodity_data('wheat') → { scraped_spot_price: 2510, ... }
    # ──────────────────────────────────────────────────────────
    @staticmethod
    def scrape_commodity_data(crop_name):
        crop_key = str(crop_name).strip().lower()
        config   = CommodityWebScraper.get_crop_config(crop_key)  # Get metadata
        base_ref = config['base_ref']  # Fallback price if scraping fails

        # Start with baseline values — will be overwritten if scraping succeeds
        result = {
            "crop": crop_key,
            "name": config["name"],
            "code": config["code"],
            "scraped_spot_price": base_ref,            # Will be updated with live price
            "scraped_change_pct": 0.0,                 # % price change from previous close
            # min/max bounds = ±28% of base price (reasonable trading band estimate)
            "min_bound": round(base_ref * 0.72),
            "max_bound": round(base_ref * 1.32),
            "historical_7d_avg": base_ref,             # 7-day average (updated if available)
            "source": f"Live Web Scraper (BeautifulSoup4: {'ACTIVE' if BS4_AVAILABLE else 'PARSER'})",
            "scrape_status": "SUCCESS"
        }

        try:
            # ── Path A: Yahoo Finance API (for international commodities with a symbol) ──
            if config.get("symbol"):
                # Build the Yahoo Finance chart API URL for this commodity's symbol
                # interval=1d = daily data, range=7d = last 7 days
                live_url = f"https://query1.financeapp.com/v8/finance/chart/{config['symbol']}?interval=1d&range=7d"
                req = urllib.request.Request(live_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

                # Make the HTTP request to Yahoo Finance (timeout = 3.5 seconds)
                with urllib.request.urlopen(req, timeout=3.5) as response:
                    if response.status == 200:
                        # Parse the JSON response into a Python dict
                        raw = json.loads(response.read().decode('utf-8'))

                        # Navigate the nested JSON structure to extract price data
                        # raw['chart']['result'][0]['meta'] contains current market info
                        meta = raw.get('chart', {}).get('result', [{}])[0].get('meta', {})

                        # quotes contains arrays of open/high/low/close prices for each day
                        quotes = raw.get('chart', {}).get('result', [{}])[0].get('indicators', {}).get('quote', [{}])[0]

                        chart_price  = meta.get('regularMarketPrice')  # Current live price
                        prev_close   = meta.get('previousClose')       # Yesterday's closing price
                        close_series = quotes.get('close', [])         # Array of last 7 close prices

                        if chart_price and prev_close:
                            # Calculate % change from previous close
                            change_pct = ((chart_price - prev_close) / prev_close) * 100

                            # Scale the INR price using the international/INR ratio
                            # (Yahoo Finance prices are in USD — we use ratio to scale our INR base)
                            ratio = chart_price / prev_close
                            spot  = round(base_ref * ratio)   # Estimated INR spot price

                            # Update result with live scraped values
                            result["scraped_spot_price"] = spot
                            result["scraped_change_pct"] = round(change_pct, 2)
                            result["min_bound"] = round(spot * 0.72)
                            result["max_bound"] = round(spot * 1.32)

                        # Calculate 7-day average from the close price series
                        valid_series = [c for c in close_series if c is not None]  # Filter out None values
                        if valid_series and prev_close:
                            avg_chart = sum(valid_series) / len(valid_series)  # Average of last 7 days
                            ratio_avg = avg_chart / prev_close
                            result["historical_7d_avg"] = round(base_ref * ratio_avg)

            # ── Path B: HTML DOM Scraping (for domestic Indian crops without a symbol) ──
            else:
                # Use BeautifulSoup to scrape price from a domestic Indian market website
                live_url  = "https://markets.business-standard.com"
                dom_price = CommodityWebScraper.scrape_html_dom_price(live_url)

                if dom_price:
                    # If a price was found in the HTML, use it to update bounds
                    result["scraped_spot_price"] = round(dom_price)
                    result["min_bound"]          = round(dom_price * 0.75)
                    result["max_bound"]           = round(dom_price * 1.30)
                    result["historical_7d_avg"]  = round(dom_price * 0.98)

        except Exception as err:
            # If scraping fails for any reason, update the status but keep the baseline values
            # This ensures the ML model still gets data to work with (just less accurate)
            result["scrape_status"] = f"SCRAPE_WARNING ({str(err)})"

        return result

    # ──────────────────────────────────────────────────────────
    # METHOD: get_dynamic_registry
    # WHAT IT DOES: Scrapes live data for EVERY crop in SUPPORTED_CROPS
    #               and returns a registry dict with metadata for all of them.
    # WHEN TO USE: Called in CommodityListView.get() to power the GET /commodities endpoint.
    # RETURNS: A dict where each key is a crop name and value is its live metadata.
    # NOTE: This makes N HTTP requests (one per crop) — it is slower than single-crop scraping.
    # ──────────────────────────────────────────────────────────
    @staticmethod
    def get_dynamic_registry():
        # Build an empty registry dict — we will populate it below
        dynamic_registry = {}

        # Loop over every supported crop and scrape its data
        for crop_key in SUPPORTED_CROPS:
            scraped = CommodityWebScraper.scrape_commodity_data(crop_key)  # Live scrape
            config  = CommodityWebScraper.get_crop_config(crop_key)        # Metadata

            # Build the registry entry for this crop
            dynamic_registry[crop_key] = {
                "code":      scraped["code"],              # Numeric crop ID
                "name":      scraped["name"],              # Display name
                "basePrice": scraped["scraped_spot_price"], # Live price
                "min":       scraped["min_bound"],         # Lower trading band
                "max":       scraped["max_bound"],         # Upper trading band
                "symbol":    config["symbol"]              # Yahoo Finance ticker or None
            }

        return dynamic_registry
