from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import statistics

from services.supabase_service import get_supabase
from services.gemini_service import generate_alert_text, LANGUAGE_NAMES
from utils.geocode import haversine_distance

router = APIRouter()

OUTBREAK_ALERT_PROMPT = """
Generate a SHORT community warning for farmers in {language}.

Situation:
- Disease/pest detected: {disease_name}
- Cases in nearby area: {case_count} farmers affected
- Radius: {radius_km}km from this farmer
- Time window: last 48 hours
- This farmer grows: {crop_type}

Write a 2-sentence warning and 1-sentence recommended preventative action.
Be specific about the disease name and what to do.
Respond ENTIRELY in {language}.
Return ONLY the alert text string.
"""

class AlertRequest(BaseModel):
    lat: float
    long: float
    crop: Optional[str] = "Unknown"
    language: Optional[str] = "en"


def _get_clusters():
    """Fetch diagnoses from last 48 hours and cluster them."""
    client = get_supabase()
    if not client:
        return []

    # Get diagnoses from last 48 hours
    forty_eight_hours_ago = (datetime.utcnow() - timedelta(hours=48)).isoformat()
    try:
        response = client.table("diagnoses").select("*").gte("created_at", forty_eight_hours_ago).execute()
        records = response.data or []
    except Exception:
        records = []

    # Inject mock records for Nashik demo if DB is empty or unreachable
    if len(records) == 0:
        import random
        base_lat, base_long = 19.99, 73.79
        for i in range(6):
            records.append({
                "disease_name": "Fall Armyworm",
                "lat": base_lat + random.uniform(-0.02, 0.02),
                "long": base_long + random.uniform(-0.02, 0.02)
            })

    # Group by disease and ~11km grid (round lat, long to 1 decimal place)
    groups = {}
    for r in records:
        key = (r['disease_name'], round(r['lat'], 1), round(r['long'], 1))
        if key not in groups:
            groups[key] = []
        groups[key].append(r)

    clusters = []
    for key, items in groups.items():
        if len(items) >= 5: # Only clusters >= 5 cases are considered outbreaks
            disease = key[0]
            avg_lat = statistics.mean(i['lat'] for i in items)
            avg_long = statistics.mean(i['long'] for i in items)
            clusters.append({
                "disease_name": disease,
                "count": len(items),
                "lat": avg_lat,
                "long": avg_long,
                "radius_km": 15, # approximate radius
            })

    return clusters


@router.post("/api/check-alerts")
async def check_alerts(req: AlertRequest):
    """Check if the farmer is within 15km of an outbreak cluster."""
    clusters = _get_clusters()
    
    nearest_cluster = None
    min_dist = 15.0 # Max radius

    for cluster in clusters:
        dist = haversine_distance(req.lat, req.long, cluster['lat'], cluster['long'])
        if dist <= min_dist:
            min_dist = dist
            nearest_cluster = cluster
    
    if not nearest_cluster:
        return {"alert": False, "disease": None, "count": 0, "message": ""}
    
    # Generate message
    prompt = OUTBREAK_ALERT_PROMPT.format(
        language=LANGUAGE_NAMES.get(req.language, "English"),
        disease_name=nearest_cluster['disease_name'],
        case_count=nearest_cluster['count'],
        radius_km=round(min_dist, 1),
        crop_type=req.crop
    )
    message = await generate_alert_text(prompt)

    return {
        "alert": True,
        "disease": nearest_cluster['disease_name'],
        "count": nearest_cluster['count'],
        "message": message
    }


@router.get("/api/map-clusters")
async def get_map_clusters():
    """Return all active outbreak clusters for the Sentinel Map."""
    clusters = _get_clusters()
    return {"clusters": clusters}
