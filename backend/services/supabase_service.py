import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()

_client: Client | None = None


def get_supabase() -> Client | None:
    """Get or create Supabase client (lazy init)."""
    global _client
    if _client is not None:
        return _client
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("⚠️  Supabase credentials not set — database features disabled")
        return None
    try:
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return _client
    except Exception as e:
        print(f"Supabase init error: {e}")
        return None


async def save_diagnosis(
    farmer_id: str,
    disease_name: str,
    confidence: float,
    lat: float,
    long: float,
    district: str,
    crop_type: str,
    treatment_chosen: str = "",
) -> dict | None:
    """Save a diagnosis record to the diagnoses table."""
    client = get_supabase()
    if client is None:
        return None

    try:
        result = (
            client.table("diagnoses")
            .insert(
                {
                    "farmer_id": farmer_id,
                    "disease_name": disease_name,
                    "confidence": confidence,
                    "lat": lat,
                    "long": long,
                    "district": district,
                    "crop_type": crop_type,
                    "treatment_chosen": treatment_chosen,
                }
            )
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Supabase save_diagnosis error: {e}")
        return None


async def log_treatment(
    farmer_id: str,
    diagnosis_id: str,
    treatment_type: str,
) -> dict | None:
    """Log a treatment choice (organic/chemical) and update soil health score."""
    client = get_supabase()
    if client is None:
        return None

    try:
        # Insert treatment log
        client.table("treatment_logs").insert(
            {
                "farmer_id": farmer_id,
                "diagnosis_id": diagnosis_id,
                "treatment_type": treatment_type,
            }
        ).execute()

        # Calculate score change: organic = +10, chemical = +2
        score_delta = 10 if treatment_type == "organic" else 2

        # Get current profile
        profile = (
            client.table("farmer_profiles")
            .select("soil_health_score")
            .eq("id", farmer_id)
            .maybe_single()
            .execute()
        )

        if profile.data:
            current_score = profile.data.get("soil_health_score", 50)
            new_score = min(100, current_score + score_delta)
            client.table("farmer_profiles").update(
                {"soil_health_score": new_score}
            ).eq("id", farmer_id).execute()
        else:
            new_score = min(100, 50 + score_delta)
            client.table("farmer_profiles").insert(
                {"id": farmer_id, "soil_health_score": new_score}
            ).execute()

        # Check badge milestones
        badge_earned = None
        if new_score >= 80:
            badge_earned = "🌿 Organic Champion"
        elif new_score >= 60:
            badge_earned = "🌱 Soil Guardian"

        return {
            "new_score": new_score,
            "badge_earned": badge_earned,
            "treatment_type": treatment_type,
        }

    except Exception as e:
        print(f"Supabase log_treatment error: {e}")
        return {"new_score": 50, "badge_earned": None, "treatment_type": treatment_type}

from datetime import datetime, timedelta, timezone

async def get_mandi_cache(state: str, district: str, commodity: str) -> list[dict] | None:
    """Retrieve Mandi prices from cache if < 6 hours old."""
    client = get_supabase()
    if client is None: return None
    try:
        resp = client.table("mandi_cache")\
            .select("data, created_at")\
            .eq("state", state)\
            .eq("district", district)\
            .eq("commodity", commodity)\
            .maybe_single().execute()
        
        if not resp.data: return None
        
        created_at = datetime.fromisoformat(resp.data["created_at"].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) - created_at < timedelta(hours=6):
            return resp.data["data"]
        return None
    except Exception as e:
        print(f"Supabase cache error: {e}")
        return None

async def set_mandi_cache(state: str, district: str, commodity: str, data: list[dict]):
    """Upsert Mandi prices to cache."""
    client = get_supabase()
    if client is None: return
    try:
        # Check if row exists for upsert behavior (supabase-py sometimes struggles with native upsert)
        resp = client.table("mandi_cache").select("id").eq("state", state).eq("district", district).eq("commodity", commodity).maybe_single().execute()
        if resp.data:
            client.table("mandi_cache").update({"data": data, "created_at": "now()"}).eq("id", resp.data["id"]).execute()
        else:
            client.table("mandi_cache").insert({"state": state, "district": district, "commodity": commodity, "data": data}).execute()
    except Exception as e:
        print(f"Supabase cache set error: {e}")

async def get_farmer_profile(farmer_id: str) -> dict:
    """Get soil health score and basic profile logic."""
    client = get_supabase()
    # Mock data fallback if DB fails
    mock = {"soil_health_score": 70, "badges": ["🌱 Soil Guardian"]}
    if client is None: return mock
    
    try:
        resp = client.table("farmer_profiles").select("*").eq("id", farmer_id).maybe_single().execute()
        if not resp.data: return mock
        
        score = resp.data.get("soil_health_score", 50)
        badges = []
        if score >= 80: badges.append("🌿 Organic Champion")
        elif score >= 60: badges.append("🌱 Soil Guardian")
        
        return {"soil_health_score": score, "badges": badges}
    except Exception as e:
        print(f"Supabase get_farmer_profile error: {e}")
        return mock

async def get_farm_history(farmer_id: str) -> list[dict]:
    """Fetch the last 10 diagnoses."""
    client = get_supabase()
    if client is None: return []
    try:
        resp = client.table("diagnoses")\
            .select("id, disease_name, crop_type, created_at, treatment_chosen")\
            .eq("farmer_id", farmer_id)\
            .order("created_at", desc=True)\
            .limit(10)\
            .execute()
        return resp.data or []
    except Exception as e:
        print(f"Supabase get_farm_history error: {e}")
        return []
