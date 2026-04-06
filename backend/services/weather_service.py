import os
import httpx

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
BASE_URL = "https://api.openweathermap.org/data/2.5"


async def get_current_weather(lat: float, lon: float) -> dict:
    """Get current weather from OpenWeather API."""
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{BASE_URL}/weather", params=params, timeout=10.0)
            resp.raise_for_status()
            data = resp.json()

        main = data.get("main", {})
        weather = data.get("weather", [{}])[0]
        wind = data.get("wind", {})

        return {
            "temp_c": round(main.get("temp", 0)),
            "feels_like_c": round(main.get("feels_like", 0)),
            "humidity": main.get("humidity", 0),
            "description": weather.get("description", "").title(),
            "icon": weather.get("icon", "01d"),
            "wind_speed_kmh": round((wind.get("speed", 0) * 3.6), 1),
            "city": data.get("name", ""),
            "summary": f"{weather.get('description', '').title()}, {round(main.get('temp', 0))}°C, Humidity {main.get('humidity', 0)}%, Wind {round(wind.get('speed', 0) * 3.6, 1)} km/h",
        }

    except Exception as e:
        print(f"OpenWeather API Error: {e}")
        return {
            "temp_c": 0,
            "feels_like_c": 0,
            "humidity": 0,
            "description": "Unavailable",
            "icon": "01d",
            "wind_speed_kmh": 0,
            "city": "",
            "summary": "Weather data unavailable",
        }


async def get_5day_forecast(lat: float, lon: float) -> list[dict]:
    """Get 5-day forecast from OpenWeather API."""
    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
        "cnt": 40,  # 5 days × 8 (3-hour intervals)
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{BASE_URL}/forecast", params=params, timeout=10.0)
            resp.raise_for_status()
            data = resp.json()

        forecast_list = data.get("list", [])
        daily: dict[str, dict] = {}

        for entry in forecast_list:
            date = entry["dt_txt"].split(" ")[0]
            if date not in daily:
                weather = entry.get("weather", [{}])[0]
                main = entry.get("main", {})
                rain = entry.get("rain", {})
                daily[date] = {
                    "date": date,
                    "temp_c": round(main.get("temp", 0)),
                    "temp_min": round(main.get("temp_min", 0)),
                    "temp_max": round(main.get("temp_max", 0)),
                    "description": weather.get("description", "").title(),
                    "icon": weather.get("icon", "01d"),
                    "humidity": main.get("humidity", 0),
                    "rain_mm": rain.get("3h", 0)
                }
            else:
                # Accumulate rain for the day
                rain = entry.get("rain", {})
                daily[date]["rain_mm"] += rain.get("3h", 0)
                
                # Update min/max temps correctly
                main = entry.get("main", {})
                if main.get("temp_max", 0) > daily[date]["temp_max"]:
                    daily[date]["temp_max"] = round(main.get("temp_max", 0))
                if main.get("temp_min", 0) < daily[date]["temp_min"]:
                    daily[date]["temp_min"] = round(main.get("temp_min", 0))

        return list(daily.values())[:5]

    except Exception as e:
        print(f"OpenWeather Forecast Error: {e}")
        return []
