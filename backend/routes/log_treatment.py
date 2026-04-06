from fastapi import APIRouter
from pydantic import BaseModel
from services.supabase_service import log_treatment

router = APIRouter()


class TreatmentLogRequest(BaseModel):
    farmer_id: str
    diagnosis_id: str
    treatment_type: str  # "organic" or "chemical"


@router.post("/api/log-treatment")
async def log_treatment_endpoint(req: TreatmentLogRequest):
    """Log treatment choice and update soil health score."""
    result = await log_treatment(
        farmer_id=req.farmer_id,
        diagnosis_id=req.diagnosis_id,
        treatment_type=req.treatment_type,
    )
    return result or {"new_score": 50, "badge_earned": None}
