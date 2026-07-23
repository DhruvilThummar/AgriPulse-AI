# ──────────────────────────────────────────────────────────────
# FILE: apps.py
# WHERE IT IS: django-predict-service/api/apps.py
# WHAT IT DOES: Configures the "api" Django application.
#               Every Django app needs an AppConfig class.
#               It's how Django knows this folder is a valid app
#               (along with __init__.py).
# WHEN IT RUNS: Automatically loaded by Django at startup because
#               'api.apps.ApiConfig' is listed in INSTALLED_APPS
#               in predict_service/settings.py.
# HOW IT WORKS:
#   - The ready() method is a Django startup hook — it runs ONCE
#     after all apps are fully loaded and ready.
#   - We use it to print the startup banner to the console.
# ──────────────────────────────────────────────────────────────

# os: Standard Python library — used to read environment variables
import os

# AppConfig: The base class provided by Django for app configuration.
# We inherit from it to create our own custom AppConfig for the 'api' app.
from django.apps import AppConfig


# ──────────────────────────────────────────────────────────────
# CLASS: ApiConfig
# WHAT IT IS: The configuration class for the "api" Django app.
# HOW DJANGO USES IT: Django imports this automatically when
#   'api.apps.ApiConfig' is in INSTALLED_APPS in settings.py.
# ──────────────────────────────────────────────────────────────
class ApiConfig(AppConfig):
    # default_auto_field: Sets the default primary key field type for all models in this app.
    # BigAutoField = a 64-bit integer that auto-increments (allows ~9 quintillion unique IDs).
    # This is only relevant if you add database models to this app.
    default_auto_field = 'django.db.models.BigAutoField'

    # name: The Python import path to this app's folder.
    # Must match the folder name and how it's referenced in INSTALLED_APPS.
    name = 'api'

    def ready(self):
        """
        Django startup hook — called ONCE when the app is fully loaded.
        WHERE: Automatically called by Django during server startup.
        WHEN: After all INSTALLED_APPS have been initialized.
        WHAT IT DOES HERE: Prints the startup banner to the server console.

        WHY THE RUN_MAIN CHECK:
          Django's development server (runserver) starts TWO processes:
            1. A file watcher process (monitors for code changes)
            2. The actual web server process
          Without this check, the banner prints TWICE (once per process).
          os.environ.get('RUN_MAIN') == 'true' is True ONLY in the main
          web server process — so the banner prints exactly once.
        """
        if os.environ.get('RUN_MAIN') == 'true':
            # Read the API key status from .env for display in the banner.
            # If COMMODITY_API_KEY is not set → shows "PUBLIC_SCRAPER_MODE"
            api_key_status = os.environ.get('COMMODITY_API_KEY', 'PUBLIC_SCRAPER_MODE (No Key Required)')

            # Print the startup banner to the console so developers know
            # the server has booted successfully and in the correct mode.
            print("=====================================================================")
            print(" 🌾 AGRI-PULSE AI — DIRECT ML ENGINE ONLINE ")
            print(" 🌐 Real-Time Web Scraping Pipeline Active: ON DEMAND")
            print(f" 🔑 API Key Reference: {api_key_status}")
            print("=====================================================================")
