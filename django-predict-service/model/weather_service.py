# ──────────────────────────────────────────────────────────────
# FILE: weather_service.py
# WHERE IT IS: django-predict-service/model/weather_service.py
# WHAT IT DOES: OpenWeatherMap API Integration & Weather Impact Score Engine
#               Fetches real-time weather telemetry for agricultural regions
#               and converts meteorological conditions into a quantitative score (0.0 to 1.0)
# ──────────────────────────────────────────────────────────────

import os
import json
import urllib.request

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False


class AgriWeatherService:
    """
    OpenWeatherMap API Service & Agritech Weather Impact Scoring Engine.
    Converts weather telemetry (temperature, rainfall, humidity, cloudiness)
    into a domain-specific agricultural impact rating (0.0 drought/storm to 1.0 ideal harvest).
    """

    OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', 'placeholder_key')

    # Heuristic weather impact baseline scores by OpenWeather condition code/main
    WEATHER_CONDITION_SCORES = {
        'Thunderstorm': 0.15,
        'Tornado': 0.10,
        'Squall': 0.20,
        'Extreme': 0.15,
        'Snow': 0.35,
        'Heavy Rain': 0.25,
        'Rain': 0.65,
        'Drizzle': 0.85,
        'Light Rain': 0.90,
        'Clouds': 0.85,
        'Clear': 0.95,
        'Mist': 0.80,
        'Fog': 0.75,
        'Haze': 0.80,
        'Dust': 0.40,
        'Sand': 0.35,
        'Ash': 0.20
    }

    @classmethod
    def get_weather_impact_score(cls, city_name='Khanna'):
        """
        Fetches current weather from OpenWeatherMap API for city_name.
        Applies agricultural heuristic formula to derive weather_impact_score.
        
        RETURNS:
            Float strictly bounded between 0.0 and 1.0.
            Defaults to neutral score 0.75 on network or API failure.
        """
        city = str(city_name).strip() if city_name else 'Khanna'
        api_key = cls.OPENWEATHER_API_KEY

        # Fallback to neutral default score if placeholder API key is used
        if not api_key or api_key == 'placeholder_key':
            print(f"ℹ️ OpenWeatherMap API key not set in environment; using neutral weather score 0.75 for '{city}'.")
            return 0.75

        url = f"https://api.openweathermap.org/data/2.5/weather?q={urllib.parse.quote(city)}&appid={api_key}&units=metric"
        headers = {'User-Agent': 'AgriCastAI/2.4 (Agritech Weather Service)'}

        try:
            weather_data = None
            if REQUESTS_AVAILABLE:
                response = requests.get(url, headers=headers, timeout=4.0)
                if response.status_code == 200:
                    weather_data = response.json()
                else:
                    print(f"⚠️ OpenWeatherMap API HTTP {response.status_code} for city '{city}'")
            else:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=4.0) as resp:
                    if resp.status == 200:
                        weather_data = json.loads(resp.read().decode('utf-8'))

            if weather_data and 'weather' in weather_data:
                # Extract main condition category (e.g. Rain, Clear, Thunderstorm)
                main_condition = weather_data['weather'][0].get('main', 'Clear')
                description = weather_data['weather'][0].get('description', '').lower()
                temp = float(weather_data.get('main', {}).get('temp', 25.0))
                humidity = float(weather_data.get('main', {}).get('humidity', 60.0))

                # Look up base condition score
                base_score = cls.WEATHER_CONDITION_SCORES.get(main_condition, 0.75)

                # Fine-tune with description heuristics
                if 'heavy' in description or 'extreme' in description:
                    base_score -= 0.20
                elif 'light' in description:
                    base_score += 0.05

                # Extreme temperature penalties (>42°C heatwave or <5°C frost hazard)
                if temp > 42.0 or temp < 5.0:
                    base_score -= 0.15

                # Extreme humidity penalties (>90% fungal infection risk)
                if humidity > 90.0:
                    base_score -= 0.10

                final_score = float(round(max(0.0, min(1.0, base_score)), 2))
                print(f"🌤️ OpenWeather Live Telemetry for '{city}': {main_condition} ({temp}°C, {humidity}% humidity) -> Impact Score: {final_score}")
                return final_score

        except Exception as err:
            print(f"⚠️ Weather Service API request failed for '{city}': {err}. Using default score 0.75.")

        return 0.75
