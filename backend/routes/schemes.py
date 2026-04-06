from fastapi import APIRouter, Request
from pydantic import BaseModel
from services.gemini_service import generate_scheme_guide

router = APIRouter()

class SchemesRequest(BaseModel):
    state: str
    crop_type: str

class SchemeGuideRequest(BaseModel):
    scheme_name: str
    benefit_description: str
    district: str
    state: str
    language: str

@router.post("/api/schemes")
async def schemes(req: SchemesRequest, request: Request):
    """Government scheme filtering from loaded JSON data."""
    all_schemes = getattr(request.app.state, "schemes", [])
    
    filtered_schemes = []
    farmer_state_clean = req.state.strip().lower()

    for s in all_schemes:
        states_raw = s.get("states", [])
        if not states_raw:
            filtered_schemes.append(s)
            continue
            
        states = [st.lower() for st in states_raw]
        if "all" not in states and farmer_state_clean not in states:
            continue
            
            
        filtered_schemes.append(s)

    return {"schemes": filtered_schemes}

@router.post("/api/scheme-guide")
async def scheme_guide(req: SchemeGuideRequest):
    """Generate localized scheme application guide via Gemini."""
    guide = await generate_scheme_guide(
        scheme_name=req.scheme_name,
        benefit_description=req.benefit_description,
        district=req.district,
        state=req.state,
        language=req.language
    )
    return guide
