# ──────────────────────────────────────────────────────────────
# FILE: settings.py
# WHERE IT IS: django-predict-service/predict_service/settings.py
# WHAT IT DOES: This is the main configuration file for the entire
#               Django project. Think of it like a "control panel".
#               Django reads this file at startup to know what apps
#               to load, how to handle requests, CORS, and more.
# WHEN IT RUNS: Automatically loaded by Django on every server start.
# ──────────────────────────────────────────────────────────────

import os
import warnings
from pathlib import Path

# Environment variable to prevent joblib loky backend wmic process search on Windows 11
os.environ.setdefault('LOKY_MAX_CPU_COUNT', str(os.cpu_count() or 4))
warnings.filterwarnings('ignore', category=UserWarning, module='joblib')

# BASE_DIR points to the root folder of this project
# Path(__file__) = this settings.py file
# .resolve().parent.parent = go up 2 folders → reaches the project root
BASE_DIR = Path(__file__).resolve().parent.parent

# SECRET_KEY: A long random string used by Django for security (signing cookies, tokens, etc.)
# In production ALWAYS change this to a real secret using environment variables.
# os.environ.get('DJANGO_SECRET_KEY', ...) → reads from .env file if set, else uses the fallback
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-key-for-agri-pulse-predict-service')

# DEBUG: When True, Django shows detailed error pages (useful during development).
# IMPORTANT: Always set DEBUG = False in production so errors are not shown to users.
DEBUG = True

# ALLOWED_HOSTS: List of domain names or IPs that are allowed to access this server.
# '*' means anyone can connect — fine for development, restrict in production.
ALLOWED_HOSTS = ['*']

# ──────────────────────────────────────────────────────────────
# INSTALLED_APPS: List of all active Django apps/plugins.
# Each item here tells Django to include that app and its features.
# We only install what we actually need (pure REST API microservice).
# ──────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    # rest_framework: Django REST Framework — enables us to create REST APIs easily
    'rest_framework',

    # corsheaders: Allows our API to accept requests from different origins (e.g. React frontend)
    'corsheaders',

    # api.apps.ApiConfig: Our own local app that contains the views, urls, and serializers
    'api.apps.ApiConfig',
]

# ──────────────────────────────────────────────────────────────
# MIDDLEWARE: A list of "plugins" that process every request/response.
# They run in order, from top to bottom, before reaching the view.
# ──────────────────────────────────────────────────────────────
MIDDLEWARE = [
    # CorsMiddleware: Must be at the very top — handles Cross-Origin Resource Sharing headers
    # Without this, the React frontend would be blocked by the browser's security policy
    'corsheaders.middleware.CorsMiddleware',

    # SecurityMiddleware: Adds basic security headers (HTTPS redirects, XSS protection, etc.)
    'django.middleware.security.SecurityMiddleware',

    # CommonMiddleware: Handles common HTTP features like URL normalization
    'django.middleware.common.CommonMiddleware',
]

# ROOT_URLCONF: Tells Django which file contains the main URL routing configuration
# Django will look in predict_service/urls.py for URL patterns
ROOT_URLCONF = 'predict_service.urls'

# WSGI_APPLICATION: Entry point for WSGI web servers (like gunicorn in production)
# Used when deploying to a real server — not needed during local development
WSGI_APPLICATION = 'predict_service.wsgi.application'

# ──────────────────────────────────────────────────────────────
# DATABASES: This microservice is stateless — it does NOT use a database.
# All data comes from live web scraping. So we set DATABASES to empty.
# If you ever need to store data, configure a database here (e.g. PostgreSQL).
# ──────────────────────────────────────────────────────────────
DATABASES = {}

# LANGUAGE_CODE: Sets the default human language for error messages, etc.
LANGUAGE_CODE = 'en-us'

# TIME_ZONE: Sets the server timezone for timestamps (IST = India Standard Time)
TIME_ZONE = 'Asia/Kolkata'

# USE_I18N: Internationalization support — disabled (False) to save performance
USE_I18N = False

# USE_TZ: When True, Django stores all datetimes as timezone-aware
USE_TZ = True

# DEFAULT_AUTO_FIELD: The default primary key type for database models
# BigAutoField = uses a 64-bit integer as the auto-incrementing ID
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ──────────────────────────────────────────────────────────────
# CORS CONFIGURATION
# CORS = Cross-Origin Resource Sharing
# This controls which websites/apps are allowed to call our API.
# ──────────────────────────────────────────────────────────────

# CORS_ALLOW_ALL_ORIGINS = True → any website can call our API
# In production, change this to: CORS_ALLOWED_ORIGINS = ['http://localhost:5173']
CORS_ALLOW_ALL_ORIGINS = True

# ──────────────────────────────────────────────────────────────
# REST FRAMEWORK CONFIGURATION
# Settings for Django REST Framework (DRF) — the library that
# powers our REST API endpoints (views, serializers, authentication).
# ──────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    # DEFAULT_PERMISSION_CLASSES: Who is allowed to call the API?
    # AllowAny = anyone can call (no login required) — since auth is handled by Node.js BFF
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],

    # DEFAULT_RENDERER_CLASSES: How should responses be formatted?
    # JSONRenderer = always return responses as JSON (perfect for REST APIs)
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],

    # UNAUTHENTICATED_USER = None: Tells DRF to NOT try to load Django's User model
    # This is required because we removed django.contrib.auth from INSTALLED_APPS.
    # Without this, DRF would crash trying to find AnonymousUser in the auth module.
    'UNAUTHENTICATED_USER': None,

    # UNAUTHENTICATED_TOKEN = None: Same idea — skip looking for a default token class
    'UNAUTHENTICATED_TOKEN': None,
}
