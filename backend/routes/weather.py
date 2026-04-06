from fastapi import APIRouter
from pydantic import BaseModel
from services.weather_service import get_current_weather, get_5day_forecast
from services.gemini_service import generate_alert_text, LANGUAGE_NAMES

router = APIRouter()

CLIMATE_ALERT_PROMPT = """
You are an agricultural weather advisor.
Generate a SHORT urgent alert for a farmer in {language}.

Situation:
- Farmer location: {lat}, {long}
- Crop: {crop}
- Crop stage: {crop_stage}
- Alert type: {alert_type}
- Forecast detail: {forecast_detail}

Alert types and what to say:
- harvest_urgent: Heavy rain coming, mature crop must be harvested NOW
- irrigation_needed: Heatwave coming, crop needs water immediately
- fungal_risk: High humidity for 3+ days, spray preventative fungicide
- frost_warning: Temperature dropping below 5°C, cover sensitive crops

Write ONE short, urgent message in {language}.
Maximum 2 sentences. Be specific about the timeframe.
Return ONLY the alert text string, no JSON.
"""

class ClimateAlertRequest(BaseModel):
    lat: float
    long: float
    crop: str = "Unknown"
    crop_stage: str = "Unknown"
    language: str = "en"

@router.get("/api/weather")
async def weather(lat: float = 19.997, lon: float = 73.789):
    """Get current weather + 5-day forecast for given coordinates."""
    current = await get_current_weather(lat, lon)
    forecast = await get_5day_forecast(lat, lon)
    return {"current": current, "forecast": forecast}

@router.post("/api/climate-alert")
async def climate_alert(req: ClimateAlertRequest):
    """Assess 5-day forecast against crop conditions to issue climate warnings."""
    forecast = await get_5day_forecast(req.lat, req.long)
    if not forecast:
        return {"alert_level": None, "message": ""}
    
    alert_type = None
    forecast_detail = ""

    # Check next 3 days for urgent rain
    rain_next_3_days = sum(day.get('rain_mm', 0) for day in forecast[:3])
    if rain_next_3_days > 10 and req.crop_stage.lower() == "mature":
        alert_type = "harvest_urgent"
        forecast_detail = f"Heavy rain ({rain_next_3_days}mm) expected in the next 3 days."
    
    # Check max temp
    max_temp = max(day.get('temp_max', 0) for day in forecast)
    if not alert_type and max_temp > 40:
        alert_type = "irrigation_needed"
        forecast_detail = f"Heatwave expected reaching {max_temp}°C."

    # Check humidity sequence
    high_humidity_days = sum(1 for day in forecast[:3] if day.get('humidity', 0) > 85)
    if not alert_type and high_humidity_days >= 3:
        alert_type = "fungal_risk"
        forecast_detail = "High humidity (>85%) predicted for 3 consecutive days."

    if not alert_type:
        return {"alert_level": None, "message": ""}
    
    prompt = CLIMATE_ALERT_PROMPT.format(
        language=LANGUAGE_NAMES.get(req.language, "English"),
        lat=round(req.lat, 2),
        long=round(req.long, 2),
        crop=req.crop,
        crop_stage=req.crop_stage,
        alert_type=alert_type,
        forecast_detail=forecast_detail
    )
    
    message = await generate_alert_text(prompt)
    alert_level = "urgent" if alert_type in ["harvest_urgent", "irrigation_needed"] else "advisory"

    return {
        "alert_level": alert_level,
        "message": message
    }
