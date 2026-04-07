import os
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from services.groq_service import chat_with_farmer
from services.weather_service import get_current_weather
from utils.geocode import reverse_geocode
from utils.json_loader import get_soil_type, get_crop_stage
from utils.agmarknet import fetch_mandi_prices

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    language: str
    lat: float
    long: float
    crop: Optional[str] = None
    last_diagnosis: str | None = None

@router.post("/api/chat")
async def chat(req: ChatRequest, fastapi_req: Request):
    """
    Process context-aware chat utilizing Groq. Optionally grabs latest market prices 
    if user intends to know prices (basic keyword intercept proxy).
    """
    if not os.getenv("GROQ_API_KEY"):
        return JSONResponse(
            status_code=500,
            content={"error": "Missing API Key for Groq", "details": "GROQ_API_KEY is not set in environment variables"}
        )

    try:
        # Extract location 
        try:
            geo = await reverse_geocode(req.lat, req.long)
            district = geo["district"]
            state = geo["state"]
        except:
            district = "Nashik"
            state = "Maharashtra"

        # Context gathering
        soil_type = get_soil_type(district, fastapi_req.app.state.soil)
        crop_info = get_crop_stage(req.crop, state, fastapi_req.app.state.calendar) if req.crop else {"season": "unknown", "stage": "unknown"}
        
        # Weather
        weather = await get_current_weather(req.lat, req.long)
        weather_summary = weather.get("summary", "Unknown")

        # Intent Interceptor: Pre-fetch market data if words like 'price', 'bhav', 'mandi' appear
        market_context = "None requested"
        test_message = req.message.lower()
        
        if any(keyword in test_message for keyword in ["price", "mandi", "bhav", "rate", "sell", "market", "dam", "kimat"]):
            print("Checking Agmarknet for context...")
            if req.crop:
                prices = await fetch_mandi_prices(state, district, req.crop)
                if prices:
                    top_market = prices[0]
                    market_context = f"Today's {req.crop} price in {top_market['market']} is ₹{top_market['modal_price']}/Quintal (Min: ₹{top_market['min_price']}, Max: ₹{top_market['max_price']})"
                else:
                    market_context = "Market data currently unavailable for your nearby district."
            else:
                market_context = "No specific crop selected. Ask the user which crop's price they want."

        # Send to Groq
        response = await chat_with_farmer(
            message=req.message,
            language=req.language,
            district=district,
            state=state,
            soil_type=soil_type,
            crops=[req.crop] if req.crop else [],
            weather_summary=weather_summary,
            season=crop_info.get("season", "unknown"),
            crop_stage=crop_info.get("stage", "growing"),
            last_diagnosis=req.last_diagnosis or "None",
            market_context=market_context
        )
        
        return response

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "details": "Check server logs or Groq API status",
            },
        )
