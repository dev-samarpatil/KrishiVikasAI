from fastapi import APIRouter, Query
from services.supabase_service import get_farm_history, get_farmer_profile

router = APIRouter()

@router.get("/api/farm-history")
async def farm_history(farmer_id: str = Query(..., description="The ID of the farmer from localStorage")):
    """Fetch farmer's profile score and diagnosis timeline."""
    profile = await get_farmer_profile(farmer_id)
    history = await get_farm_history(farmer_id)
    
    return {
        "profile": profile,
        "history": history
    }
