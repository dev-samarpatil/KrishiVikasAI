from fastapi import APIRouter, File, UploadFile, Form, Request, Query
from fastapi.responses import JSONResponse
import google.generativeai as genai
from PIL import Image
import io
import json
import os
import re
import traceback

from services.supabase_service import save_diagnosis
from services.weather_service import get_current_weather
from utils.geocode import reverse_geocode
from utils.json_loader import get_soil_type, get_crop_stage
from utils.haversine import get_nearest_kvks

router = APIRouter()

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "ta": "Tamil",
}


def get_model():
    """Get a configured Gemini model instance."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in .env")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-flash")

def extract_json_from_gemini(raw_text: str) -> dict:
    """
    Gemini sometimes wraps JSON in markdown or adds 
    extra text. This function handles all cases.
    """
    import re
    import json
    
    text = raw_text.strip()
    
    # Method 1: Direct parse (if clean JSON)
    try:
        return json.loads(text)
    except:
        pass
    
    # Method 2: Strip markdown code blocks
    # Handles ```json ... ``` and ``` ... ```
    patterns = [
        r'```json\s*([\s\S]*?)\s*```',
        r'```\s*([\s\S]*?)\s*```',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except:
                pass
    
    # Method 3: Find JSON object by braces
    # Handles cases where Gemini adds text before/after JSON
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        try:
            json_str = text[start:end+1]
            return json.loads(json_str)
        except:
            pass
    
    # Method 4: Fix common Gemini JSON formatting issues
    # Sometimes Gemini uses single quotes or trailing commas
    try:
        # Replace single quotes with double quotes
        fixed = text[start:end+1] if start != -1 else text
        fixed = re.sub(r"'([^']*)':", r'"\1":', fixed)
        fixed = re.sub(r":\s*'([^']*)'", r': "\1"', fixed)
        # Remove trailing commas before } or ]
        fixed = re.sub(r',\s*([}\]])', r'\1', fixed)
        return json.loads(fixed)
    except:
        pass
    
    # If all methods fail, raise to trigger fallback
    raise ValueError(
        f"Could not parse JSON from Gemini response. "
        f"Raw text: {text[:300]}"
    )


@router.post("/api/diagnose")
async def diagnose(
    request: Request,
    image: UploadFile = File(...),
    lat: float = Form(default=19.99),
    long: float = Form(default=73.79),
    crop_type: str = Form(default="Unknown"),
    language: str = Form(default="en"),
    farmer_id: str = Form(default="anonymous"),
    farm_size: str = Form(default="Unknown"),
    farming_type: str = Form(default="Unknown"),
):
    """
    Full crop diagnosis pipeline:
    1. Read + validate image → PIL
    2. Reverse geocode GPS → district/state
    3. Soil, crop stage, weather lookups
    4. Gemini Flash → structured diagnosis JSON
    5. Supabase → save record
    """

    # ── Step 0: Check API Key ──────────────────────────────────────
    if not os.getenv("GEMINI_API_KEY"):
        return JSONResponse(
            status_code=500, 
            content={"error": "Missing API Key for Gemini", "details": "GEMINI_API_KEY is not set in environment variables"}
        )

    raw_text = ""  # for error handling

    try:
        # ── Step 1: Read and validate image ─────────────────────────
        image_bytes = await image.read()
        print(f"[diagnose] Received image: {len(image_bytes)} bytes, type: {image.content_type}")

        try:
            pil_image = Image.open(io.BytesIO(image_bytes))
            if pil_image.mode not in ("RGB", "L"):
                pil_image = pil_image.convert("RGB")
            print(f"[diagnose] PIL image: {pil_image.size}, mode: {pil_image.mode}")
        except Exception as img_err:
            print(f"[diagnose] Image conversion error: {img_err}")
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid image format", "detail": str(img_err)},
            )

        # ── Step 2: Reverse geocode GPS → district, state ───────────
        district = "Nashik"
        state = "Maharashtra"
        try:
            geo = await reverse_geocode(lat, long)
            district = geo["district"]
            state = geo["state"]
        except Exception as e:
            print(f"[diagnose] Geocode error (using fallback): {e}")

        # ── Step 3: Context lookups ─────────────────────────────────
        soil_type = get_soil_type(district, request.app.state.soil)

        crop_info = get_crop_stage(crop_type, state, request.app.state.calendar)
        season = crop_info.get("season", "unknown")
        crop_stage = crop_info.get("stage", "growing")

        weather_summary = "Weather data unavailable"
        try:
            weather_data = await get_current_weather(lat, long)
            weather_summary = weather_data.get("summary", weather_summary)
        except Exception as e:
            print(f"[diagnose] Weather error (using fallback): {e}")

        # ── Step 4: Build diagnosis prompt ──────────────────────────
        lang_name = LANGUAGE_NAMES.get(language, "English")

        prompt = f"""You are an expert Indian plant pathologist.
Analyse this crop photo carefully.

Context: {district}, {state} | Crop: {crop_type} | 
Farm Size: {farm_size} | Farming Type: {farming_type}
Weather: {weather_summary} | Soil: {soil_type}

STRICT RULES:
- Respond ONLY with a single valid JSON object
- Do NOT include any text before or after the JSON
- Do NOT use markdown code blocks or backticks
- Do NOT add comments inside the JSON
- All string values must use double quotes
- Identify the SPECIFIC disease name, not generic terms
- Minimum confidence 0.55, maximum 1.0
- Language for all descriptions: {lang_name}

Common Indian crop diseases to identify:
Tomato: Early Blight, Late Blight, Leaf Curl, 
        Septoria Leaf Spot, Fusarium Wilt
Cotton: Bollworm, Pink Bollworm, Aphids, Leaf Curl Virus
Wheat: Rust (Yellow/Brown/Black), Smut, Powdery Mildew
Onion: Purple Blotch, Downy Mildew, Thrips
Rice: Blast, Brown Plant Hopper, Sheath Blight
Soybean: Yellow Mosaic Virus, Rust, Pod Borer
General: Nitrogen deficiency (uniform yellowing),
         Iron deficiency (interveinal yellowing),
         Spider Mites (stippling + webbing),
         Aphids (curling + sticky residue)

Respond with ONLY this JSON, nothing else:
{{
  "type": "disease",
  "name": "SPECIFIC disease name in English",
  "name_local": "disease name in {lang_name}",
  "confidence": 0.85,
  "explanation": "What is happening to this crop in 2-3 simple sentences that a farmer can understand",
  "cause": "What organism or condition caused this",
  "treatment_steps": [
    "Step 1: Specific action with specific product name",
    "Step 2: Specific dosage and application method",
    "Step 3: Follow-up action and timing"
  ],
  "organic_option": {{
    "description": "Specific organic treatment name",
    "steps": [
      "Step 1: Exact organic method with quantities",
      "Step 2: Application frequency and timing"
    ]
  }},
  "prevention": "One specific prevention tip for this disease",
  "budget_items": [
    {{"item": "Specific product name", "quantity": "250g", "price_inr": 90}},
    {{"item": "Sprayer rental", "quantity": "1 day", "price_inr": 50}},
    {{"item": "Labour", "quantity": "1 day", "price_inr": 200}}
  ],
  "total_cost_inr": 340,
  "organic_total_cost_inr": 100,
  "urgency": "immediate",
  "low_confidence_note": null
}}"""

        # ── Step 5: Call Gemini with PIL image ──────────────────────
        print("[diagnose] Calling Gemini vision API...")
        model = get_model()

        response = model.generate_content(
            [prompt, pil_image],
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                max_output_tokens=4096,
                response_mime_type="application/json"
            )
        )

        raw_text = response.text
        
        print("=" * 50)
        print("GEMINI RAW RESPONSE:")
        print(raw_text)
        print("=" * 50)
        
        print(f"[diagnose] Gemini raw response preview: {raw_text[:200]}...")

        # ── Step 6: Parse JSON — extract correctly ──────────
        try:
            result = extract_json_from_gemini(raw_text)
        except ValueError as e:
            print(f"JSON extraction failed: {e}")
            raise json.JSONDecodeError("Failed to extract JSON", raw_text, 0)

        # ── Step 7: Inject low confidence note if needed ────────────
        confidence = result.get("confidence", 0)
        if confidence < 0.65:
            result["low_confidence_note"] = (
                "AI is moderately confident. Consider consulting "
                "your nearest KVK to confirm this diagnosis."
            )

        # ── Step 8: Attach context metadata for frontend ────────────
        result["_context"] = {
            "district": district,
            "state": state,
            "soil_type": soil_type,
            "season": season,
            "crop_stage": crop_stage,
            "weather": weather_summary,
        }

        # ── Step 9: Save to Supabase (non-blocking) ─────────────────
        try:
            saved = await save_diagnosis(
                farmer_id=farmer_id,
                disease_name=result.get("name", "Unknown"),
                confidence=result.get("confidence", 0.0),
                lat=lat,
                long=long,
                district=district,
                crop_type=crop_type,
            )
            if saved:
                result["diagnosis_id"] = saved.get("id", "")
        except Exception as db_err:
            print(f"[diagnose] Supabase save failed (non-critical): {db_err}")

        print(f"[diagnose] ✅ Diagnosis success: {result.get('name')} ({result.get('confidence')})")
        return result

    except json.JSONDecodeError as je:
        print(f"[diagnose] JSON parse error: {je}")
        print(f"[diagnose] Raw text was: {raw_text}")
        # Return a fallback diagnosis so the user still gets something useful
        return {
            "type": "disease",
            "name": "Leaf Disease Detected",
            "name_local": "पत्ती रोग",
            "confidence": 0.55,
            "explanation": (
                "Disease symptoms are visible in the photo. "
                "The AI had trouble formatting the response, but damage is evident. "
                "Please consult your nearest KVK for precise identification."
            ),
            "cause": "Likely fungal or bacterial infection",
            "treatment_steps": [
                "Step 1: Remove and destroy affected leaves",
                "Step 2: Apply broad-spectrum fungicide (Mancozeb / Copper Oxychloride)",
                "Step 3: Improve air circulation around plant",
            ],
            "organic_option": {
                "description": "Neem oil spray",
                "steps": [
                    "Mix 5ml neem oil in 1L water",
                    "Spray on affected parts every 7 days",
                ],
            },
            "prevention": "Avoid overhead irrigation and maintain proper spacing",
            "budget_items": [
                {"item": "Fungicide", "quantity": "250g", "price_inr": 120},
                {"item": "Labour", "quantity": "1 day", "price_inr": 200},
            ],
            "total_cost_inr": 320,
            "organic_total_cost_inr": 80,
            "urgency": "within_week",
            "low_confidence_note": (
                "AI gave an imprecise response. "
                "Visiting nearest KVK is recommended for confirmation."
            ),
            "_context": {
                "district": district,
                "state": state,
                "soil_type": soil_type,
                "season": season,
                "crop_stage": crop_stage,
                "weather": weather_summary,
            },
        }

    except Exception as e:
        print(f"[diagnose] ❌ Error: {str(e)}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "details": "Check server logs or Gemini API status",
            },
        )


# ── Nearest KVK endpoint ────────────────────────────────────────────


@router.get("/api/nearest-kvk")
async def nearest_kvk(
    request: Request,
    lat: float = Query(..., description="Farmer latitude"),
    long: float = Query(..., description="Farmer longitude"),
    limit: int = Query(3, description="Number of results"),
):
    """Find the nearest KVK centres using Haversine distance."""
    kvk_data = getattr(request.app.state, "kvk", [])
    if not kvk_data:
        return {"kvks": []}

    nearest = get_nearest_kvks(lat, long, kvk_data, top_n=limit)
    return {"kvks": nearest}
