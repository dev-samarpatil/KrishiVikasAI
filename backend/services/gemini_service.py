import google.generativeai as genai
import os
import json
from PIL import Image
import io
from pydantic import BaseModel
from typing import Optional, Literal


# ── Pydantic Output Schema ──────────────────────────────────────────

class BudgetItem(BaseModel):
    item: str
    quantity: str
    price_inr: int


class OrganicOption(BaseModel):
    description: str
    steps: list[str]


class DiagnosisResponse(BaseModel):
    type: Literal["disease", "deficiency", "pest", "unclear"]
    name: str
    name_local: str
    confidence: float
    explanation: str
    cause: str
    treatment_steps: list[str]
    organic_option: OrganicOption
    prevention: str
    budget_items: list[BudgetItem]
    total_cost_inr: int
    organic_total_cost_inr: int
    urgency: Literal["immediate", "within_week", "monitor"]
    low_confidence_note: Optional[str] = None


class SchemeGuideResponse(BaseModel):
    summary: str
    likely_eligible: bool
    eligibility_reason: str
    documents_needed: list[str]
    application_steps: list[str]
    where_to_apply: str
    timeline: str
    helpline: str


# ── Diagnosis prompt template ────────────────────────────────────────

DIAGNOSIS_SYSTEM_PROMPT = """
You are an expert Indian agricultural scientist and
plant pathologist analysing a crop photo.

Farmer context:
- Location: {district}, {state}, India
- Soil type: {soil_type}
- Crop: {crop_type}
- Weather: {weather_summary}
- Crop stage: {crop_stage}

IMPORTANT INSTRUCTIONS:
1. Always provide your BEST DIAGNOSIS even if not 100% certain
2. If you can see any abnormality, identify what it most
   likely is — never return "unable to identify" unless
   the image is completely black or has no plant visible
3. The minimum confidence you should return is 0.45 —
   even a likely guess is more helpful than "unknown"
4. Common Indian crop diseases to consider:
   Early Blight, Late Blight, Powdery Mildew,
   Downy Mildew, Leaf Curl, Yellow Mosaic Virus,
   Bacterial Wilt, Anthracnose, Rust, Smut,
   Spider Mite damage, Aphid damage,
   Nitrogen deficiency (yellowing),
   Phosphorus deficiency (purple tint),
   Iron deficiency (interveinal chlorosis)

5. If the image quality is low, still give your best
   estimate based on visible symptoms and note it with
   slightly lower confidence (0.55-0.65)

Respond ONLY in {language} language.
Return ONLY valid JSON with no markdown:
{{
  "type": "disease" or "deficiency" or "pest",
  "name": "name in English",
  "name_local": "name in {language}",
  "confidence": 0.75,
  "explanation": "2-3 simple sentences what happened",
  "cause": "brief cause",
  "treatment_steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "organic_option": {{
    "description": "organic treatment",
    "steps": ["Step 1: ..."]
  }},
  "prevention": "prevention tip",
  "budget_items": [
    {{"item": "product name", "quantity": "250g", "price_inr": 90}},
    {{"item": "labour", "quantity": "1 day", "price_inr": 200}}
  ],
  "total_cost_inr": 290,
  "organic_total_cost_inr": 100,
  "urgency": "immediate",
  "low_confidence_note": null
}}
"""

SCHEME_GUIDE_PROMPT = """
You are a government scheme advisor helping an Indian farmer understand
how to apply for a government benefit.

Scheme: {scheme_name}
Benefit: {benefit_description}
Farmer location: {district}, {state}
Farmer's language: {language}

Explain in VERY simple language (Class 5 reading level):
1. What this scheme gives them
2. Whether they are likely eligible (based on: small/marginal farmer, owns land, has Aadhaar)
3. Exactly what documents they need to bring
4. Step-by-step where to go and what to do to apply
5. How long it takes and what happens next

Respond ENTIRELY in {language} and guarantee JSON output.
"""

# ── SDK Configuration ────────────────────────────────────────────────

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "ta": "Tamil",
}


# ── Async Diagnosis Function ─────────────────────────────────────────

async def diagnose_crop(
    image_bytes: bytes,
    district: str,
    state: str,
    soil_type: str,
    crop_type: str,
    weather_summary: str,
    season: str,
    crop_stage: str,
    language: str,
) -> dict:
    """Send crop image + context to Gemini 1.5 Flash and get structured diagnosis."""

    prompt = DIAGNOSIS_SYSTEM_PROMPT.format(
        district=district,
        state=state,
        soil_type=soil_type,
        crop_type=crop_type,
        weather_summary=weather_summary,
        season=season,
        crop_stage=crop_stage,
        language=LANGUAGE_NAMES.get(language, "English"),
    )

    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != 'RGB':
        image = image.convert('RGB')

    try:
        response = await model.generate_content_async(
            [prompt, image],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=DiagnosisResponse,
            ),
        )

        result = json.loads(response.text)

        # Inject low confidence note
        if result.get("confidence", 0) < 0.65:
            result["low_confidence_note"] = (
                "I'm not fully certain about this diagnosis. "
                "Please visit your nearest KVK for confirmation before treating."
            )

        return result

    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {
            "type": "unclear",
            "name": "Unable to identify",
            "name_local": "",
            "confidence": 0.0,
            "explanation": "The analysis failed or the photo is unclear. Please retake it in good lighting.",
            "cause": "",
            "treatment_steps": [],
            "organic_option": {"description": "", "steps": []},
            "prevention": "",
            "budget_items": [],
            "total_cost_inr": 0,
            "low_confidence_note": "Analysis failed. Please try again with a clearer photo.",
        }

async def generate_alert_text(prompt: str) -> str:
    """Generate a short alert text using Gemini 1.5 Flash based on a prompt."""
    try:
        response = await model.generate_content_async(prompt)
        if response.text:
            return response.text.strip()
        return "Warning: Check your crops."
    except Exception as e:
        print(f"Gemini alert generation error: {e}")
        return "Warning: Check your crops."


async def generate_scheme_guide(
    scheme_name: str,
    benefit_description: str,
    district: str,
    state: str,
    language: str
) -> dict:
    """Generate a step-by-step scheme application guide."""
    prompt = SCHEME_GUIDE_PROMPT.format(
        scheme_name=scheme_name,
        benefit_description=benefit_description,
        district=district,
        state=state,
        language=LANGUAGE_NAMES.get(language, "English"),
    )

    try:
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=SchemeGuideResponse,
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini Scheme Guide API Error: {e}")
        return {
            "summary": "Error analyzing this scheme. Please try again later.",
            "likely_eligible": False,
            "eligibility_reason": "Analysis failed.",
            "documents_needed": ["Aadhaar Card", "Bank Passbook", "Land Records (7/12)"],
            "application_steps": ["Visit your nearest CSC or Gram Panchayat.", "Ask about this scheme."],
            "where_to_apply": "CSC or KVK",
            "timeline": "Unknown",
            "helpline": "1551 (Kisan Call Center)"
        }
