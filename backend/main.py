import json
import os
import glob
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import io

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load all static JSON data at startup — not on every request."""

    # ── Verify API keys on startup ──────────────────────────────────
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        print(f"✅ GEMINI_API_KEY loaded: {api_key[:8]}...")
    else:
        print("❌ GEMINI_API_KEY NOT FOUND — check your .env file!")

    groq_key = os.getenv("GROQ_API_KEY")
    print(f"✅ GROQ_API_KEY: {'loaded' if groq_key else '❌ MISSING'}")

    sarvam_key = os.getenv("SARVAM_API_KEY")
    print(f"✅ SARVAM_API_KEY: {'loaded' if sarvam_key else '❌ MISSING'}")

    print("\n🌱 Krishi Vikas AI — Loading data files...")

    # 1. Soil mapping
    soil_path = os.path.join(DATA_DIR, "soil_mapping.json")
    with open(soil_path, encoding="utf-8") as f:
        app.state.soil = json.load(f)
    print(f"   ✅ soil_mapping.json loaded ({len(app.state.soil)} states)")

    # 2. Crop calendar
    calendar_path = os.path.join(DATA_DIR, "crop_calendar.json")
    with open(calendar_path, encoding="utf-8") as f:
        app.state.calendar = json.load(f)
    print(f"   ✅ crop_calendar.json loaded ({len(app.state.calendar)} regions)")

    # 3. Government schemes
    schemes_path = os.path.join(DATA_DIR, "schemes.json")
    if os.path.exists(schemes_path):
        with open(schemes_path, encoding="utf-8") as f:
            app.state.schemes = json.load(f)
        print(f"   ✅ Loaded {len(app.state.schemes)} schemes")
    else:
        app.state.schemes = []
        print("   ⚠️  schemes.json not found")

    # 5. KVK directory — aggregate all state-wise JSON files
    kvk_dir = os.path.join(DATA_DIR, "KVK")
    all_kvks: list[dict] = []
    for filepath in sorted(glob.glob(os.path.join(kvk_dir, "*.json"))):
        with open(filepath, encoding="utf-8") as f:
            kvks = json.load(f)
            all_kvks.extend(kvks)
    app.state.kvk = all_kvks
    print(f"   ✅ KVK directory loaded ({len(all_kvks)} KVKs across India)")

    # 6. Mandi prices (static fallback)
    mandi_path = os.path.join(DATA_DIR, "mandi_prices.json")
    if os.path.exists(mandi_path):
        with open(mandi_path, encoding="utf-8") as f:
            app.state.mandi_prices = json.load(f)
        print(f"   ✅ mandi_prices.json loaded")
    else:
        app.state.mandi_prices = []
        print("   ⚠️  mandi_prices.json not found — using empty fallback")

    print("🚀 All data loaded. Server ready!\n")
    yield
    print("🛑 Shutting down Krishi Vikas AI backend.")


app = FastAPI(
    title="Krishi Vikas AI — Backend",
    description="AI-powered farming companion API for Indian smallholder farmers",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000",
        "https://krishi-vikas-ai.vercel.app",
        "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "Krishi Vikas AI Backend",
        "version": "1.0.0",
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "data_loaded": {
            "soil": len(app.state.soil) if hasattr(app.state, "soil") else 0,
            "calendar": len(app.state.calendar) if hasattr(app.state, "calendar") else 0,
            "schemes": len(app.state.schemes) if hasattr(app.state, "schemes") else 0,
            "kvk": len(app.state.kvk) if hasattr(app.state, "kvk") else 0,
        },
    }


@app.get("/api/test-gemini")
async def test_gemini():
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content("Say hello in one word")
        return {"status": "ok", "response": response.text}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ── STEP 1: Debug endpoint to test Gemini vision directly ───────────
@app.post("/api/test-vision")
async def test_vision(image: UploadFile = File(...)):
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash")

        # Read image bytes
        image_bytes = await image.read()
        print(f"[test-vision] Image size received: {len(image_bytes)} bytes")

        # Convert to PIL
        pil_image = Image.open(io.BytesIO(image_bytes))
        if pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")
        print(f"[test-vision] PIL image size: {pil_image.size}, mode: {pil_image.mode}")

        # Send to Gemini with simple prompt
        response = model.generate_content([
            "What do you see in this image? Describe any plant disease or damage visible. Be specific.",
            pil_image,
        ])

        print(f"[test-vision] Gemini response: {response.text[:300]}")
        return {"status": "ok", "gemini_says": response.text}

    except Exception as e:
        print(f"[test-vision] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"status": "error", "error": str(e)}


# ── STEP 2: Endpoint to log client-side diagnoses to Supabase ───────────
from services.supabase_service import get_supabase

@app.post("/api/log-diagnosis")
async def log_diagnosis(data: dict):
    try:
        supabase = get_supabase()
        if not supabase:
            return {"status": "error", "error": "Supabase not configured"}
        # Save to Supabase diagnoses table
        result = supabase.table("diagnoses").insert({
            "disease_name": data.get("disease_name"),
            "confidence": data.get("confidence"),
            "district": data.get("district"),
            "crop_type": data.get("crop_type"),
            "lat": data.get("lat", 19.99),
            "long": data.get("long", 73.79),
        }).execute()
        return {"status": "saved"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ── Register API routes ──────────────────────────────────────────────
from routes.diagnose import router as diagnose_router
from routes.log_treatment import router as log_treatment_router
from routes.weather import router as weather_router
from routes.voice_stt import router as voice_stt_router
from routes.voice_tts import router as voice_tts_router
from routes.chat import router as chat_router
from routes.alerts import router as alerts_router
from routes.market import router as market_router
from routes.schemes import router as schemes_router
from routes.farm import router as farm_router

app.include_router(diagnose_router)
app.include_router(log_treatment_router)
app.include_router(weather_router)
app.include_router(voice_stt_router)
app.include_router(voice_tts_router)
app.include_router(chat_router)
app.include_router(alerts_router)
app.include_router(market_router)
app.include_router(schemes_router)
app.include_router(farm_router)
