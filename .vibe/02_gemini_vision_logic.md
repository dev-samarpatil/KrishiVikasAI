
# 02 — Gemini Vision Logic

> **CRITICAL VIBE CODER INSTRUCTION:** > **STRICT REQUIREMENT:** Use **Python 3.14+**, **Node.js v22+**, **Next.js 15**, and the absolute latest versions of all SDKs (`@google/generative-ai`, Pydantic). Do NOT use legacy syntax. Specifically, use Pydantic schemas for structured JSON outputs with the Gemini SDK instead of string parsing.

**Prompt Engineering for Disease + Deficiency Detection**
This file defines exactly how to call Gemini 1.5 Flash for crop diagnosis. Copy these prompts exactly into `gemini_service.py`.

## Why Gemini Instead of a CNN Model
* **No training time** — saves 4–6 hours in a 4-day hackathon
* **More accurate for Indian crops** — Gemini's training data includes Indian agriculture
* **Handles deficiency + disease in one call** — a CNN would need two separate models
* **Multilingual output built-in** — one prompt change, response in Hindi/Marathi/Tamil
* **Free** — 1 million tokens/day on aistudio.google.com free tier

---

## Core Diagnosis Prompt
Use this exact system prompt in `gemini_service.py`:

```python
DIAGNOSIS_SYSTEM_PROMPT = """
You are an expert Indian agronomist and plant pathologist with 20 years of experience.
A farmer has uploaded a photo of their affected crop. Analyse it carefully.

Farmer context:
- Location: {district}, {state}, India
- Soil type: {soil_type}
- Crop: {crop_type}
- Current weather: {weather_summary}
- Season: {season}
- Crop stage: {crop_stage}

Your task:
1. Identify whether this is a DISEASE (fungal/bacterial/viral/pest) or NUTRIENT DEFICIENCY (N/P/K/Fe/Mg/Ca etc.)
2. Give a confidence score (0.0 to 1.0)
3. Explain what happened in simple language suitable for a farmer with Class 6 education
4. Provide a step-by-step treatment plan specific to their region and current season
5. Provide an organic alternative treatment
6. Give an itemised cost estimate in Indian Rupees for a standard 0.5 acre field

IMPORTANT RULES:
- If confidence is below 0.65, say so clearly and recommend visiting the nearest KVK
- Always recommend organic option alongside chemical
- Prices must be realistic Indian market rates for {state}
- Respond ENTIRELY in {language}. Simple vocabulary. No jargon without explanation.
"""
```

---

## Python Implementation (Using Modern Structured Outputs)
*Note for Vibe Coder: Use Pydantic to enforce the schema so we don't have to manually parse markdown strings.*

```python
# backend/services/gemini_service.py

import google.generativeai as genai
import os
from PIL import Image
import io
from pydantic import BaseModel
from typing import List, Optional, Literal

# 1. Define the exact Output Schema using Pydantic
class BudgetItem(BaseModel):
    item: str
    quantity: str
    price_inr: int

class OrganicOption(BaseModel):
    description: str
    steps: List[str]

class DiagnosisResponse(BaseModel):
    type: Literal["disease", "deficiency", "unclear"]
    name: str
    name_local: str
    confidence: float
    explanation: str
    cause: str
    treatment_steps: List[str]
    organic_option: OrganicOption
    prevention: str
    budget_items: List[BudgetItem]
    total_cost_inr: int
    organic_total_cost_inr: int
    urgency: Literal["immediate", "within_week", "monitor"]
    low_confidence_note: Optional[str]

# 2. Configure SDK
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "ta": "Tamil"
}

# 3. Async Generation Function
async def diagnose_crop(
    image_bytes: bytes,
    district: str,
    state: str,
    soil_type: str,
    crop_type: str,
    weather_summary: str,
    season: str,
    crop_stage: str,
    language: str
) -> dict:

    prompt = DIAGNOSIS_SYSTEM_PROMPT.format(
        district=district,
        state=state,
        soil_type=soil_type,
        crop_type=crop_type,
        weather_summary=weather_summary,
        season=season,
        crop_stage=crop_stage,
        language=LANGUAGE_NAMES[language]
    )

    image = Image.open(io.BytesIO(image_bytes))

    try:
        # Pass the Pydantic schema directly to the model
        response = await model.generate_content_async(
            [prompt, image],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=DiagnosisResponse,
            ),
        )
        
        # Pydantic schema ensures the response text is already perfect JSON
        import json
        result = json.loads(response.text)

        # Handle low confidence injection rule
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
            "confidence": 0.0,
            "explanation": "The analysis failed or the photo is unclear. Please retake it in good lighting.",
            "treatment_steps": [],
            "budget_items": [],
            "total_cost_inr": 0
        }
```

---

## Scheme Explanation Prompt
Used when a farmer taps a scheme card to get the full application guide.

```python
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

Respond ENTIRELY in {language}.
"""
```
*(Vibe Coder: Use Pydantic `response_schema` here as well to guarantee JSON output containing: summary, likely_eligible(bool), eligibility_reason, documents_needed(list), application_steps(list), where_to_apply, timeline, helpline).*

---

## Chat Advisory Prompt
Used for the AI chatbot — Groq with full farm context:

```python
CHAT_SYSTEM_PROMPT = """
You are Krishi Vikas AI, a helpful farming assistant for Indian farmers.
Always respond in {language}. Use simple words. Class 6 reading level.
Never use technical jargon without immediately explaining it.
Be warm, encouraging, and practical.

Farmer context:
- Location: {district}, {state}
- Crop(s): {crops}
- Soil type: {soil_type}
- Weather today: {weather_summary}
- Season: {season}
- Crop stage: {crop_stage}
- Recent diagnosis: {last_diagnosis}

You can help with:
- Crop diseases and nutrient deficiencies
- Pesticide and fertiliser advice
- Government schemes and subsidies
- Mandi prices and where to sell
- Weather-based farming tips
- Irrigation advice
- Finding nearby specialists

If asked about current mandi prices, say: "Let me check today's price for you"
If asked about a government scheme, refer to what you know about Indian agriculture schemes
If unsure about something medical or legal, always recommend visiting the nearest KVK

Keep replies SHORT — 3-4 sentences maximum for voice responses.
"""
```

---

## Climate Alert Prompt
```python
CLIMATE_ALERT_PROMPT = """
You are an agricultural weather advisor.
Generate a SHORT urgent alert for a farmer in {language}.

Situation:
- Farmer location: {district}, {state}
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
```

---

## Outbreak Alert Prompt
```python
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
```

---

## Image Compression (Client-Side Before Upload)
Do this in the browser BEFORE sending to backend. Reduces 3MB photos to ~150KB:

```typescript
// frontend/lib/compress-image.ts
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    img.onload = () => {
      // Max dimension 800px
      const maxDim = 800
      let { width, height } = img

      if (width > height && width > maxDim) {
        height = (height * maxDim) / width
        width = maxDim
      } else if (height > maxDim) {
        width = (width * maxDim) / height
        height = maxDim
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        0.75  // 75% quality — invisible loss, 10-20x smaller
      )
    }

    img.src = URL.createObjectURL(file)
  })
}
```
```

