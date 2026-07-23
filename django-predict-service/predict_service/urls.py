# ──────────────────────────────────────────────────────────────
# FILE: urls.py
# WHERE IT IS: django-predict-service/predict_service/urls.py
# WHAT IT DOES: This is the ROOT URL configuration for the entire Django project.
#               It acts like a traffic director — when a request comes in,
#               Django checks this file first to decide where to send it.
# WHEN IT RUNS: Every time Django receives an HTTP request, it reads this file.
# HOW IT WORKS: All routes starting with "api/" are forwarded to api/urls.py
#               where they are matched to specific views (controllers).
# ──────────────────────────────────────────────────────────────

# path: Used to define URL patterns (exact string matching)
# include: Used to delegate URL matching to another urls.py file (like api/urls.py)
from django.urls import path, include

# urlpatterns: This list is what Django reads to match incoming request URLs.
# Each entry is a path() that maps a URL prefix to a view or another urls.py.
urlpatterns = [
    # When a request comes in for ANY URL starting with "api/",
    # forward it to the api/urls.py file for further matching.
    # Example: /api/v1/predict → handled by api/urls.py → PredictView
    # Example: /api/v1/health  → handled by api/urls.py → HealthCheckView
    path('api/', include('api.urls')),
]
