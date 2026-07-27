import os
import sys
import warnings

# Set CPU count environment variable before joblib initializes
os.environ['LOKY_MAX_CPU_COUNT'] = str(os.cpu_count() or 4)
warnings.filterwarnings('ignore', category=UserWarning, module='joblib')

# Monkey patch loky physical core counter to prevent calling missing wmic binary on Windows 11
try:
    import joblib.externals.loky.backend.context as loky_context
    loky_context._count_physical_cores = lambda: (os.cpu_count() or 4, None)
except Exception:
    pass
