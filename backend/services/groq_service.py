import os
from groq import AsyncGroq
import json

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()

# Create standard async client
client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

CHAT_SYSTEM_PROMPT = """
You are Krishi Vikas AI, a helpful farming assistant for Indian farmers.
Always respond in {language}. Use simple words. Class 6 reading level.
Never use technical jargon without immediately explaining it.
Be warm, encouraging, and practical.

═══════════════════════════════════════════════════════════════
CRITICAL RULE — READ THIS FIRST:
The user's current message is the ONLY thing that matters. Answer EXACTLY what
they ask. If they ask about Maize, answer about Maize. If they ask about Rice,
answer about Rice. NEVER say "you were asking about Tomato" or "did you mean
Tomato" or "there seems to be confusion". The background context below is ONLY
for enriching your answer when relevant — it must NEVER override, redirect, or
contradict the user's actual question.
═══════════════════════════════════════════════════════════════

Optional background context (use ONLY if relevant to the user's current question):
- Location: {district}, {state}
- Previously tracked crop(s): {crops}
- Soil type: {soil_type}
- Weather today: {weather_summary}
- Season: {season}
- Crop stage: {crop_stage}
- Recent diagnosis: {last_diagnosis}
- Latest Market Price context: {market_context}

You can help with:
- Crop diseases and nutrient deficiencies
- Pesticide and fertiliser advice
- Government schemes and subsidies
- Mandi prices and where to sell
- Weather-based farming tips
- Irrigation advice
- Finding nearby specialists

IMPORTANT: The user's current prompt takes absolute precedence. If they ask about
a new crop, pest, or problem, you MUST answer it directly and thoroughly. DO NOT
correct them, DO NOT force them to talk about their previous crop, and DO NOT
mention 'confusion'. The crop context above is background info only — it must
NEVER override or contradict the user's actual question.

If unsure about something medical or legal, always recommend visiting the nearest KVK.

Keep replies SHORT — 3-4 sentences maximum for voice responses. Provide direct actionable answers.
"""

async def chat_with_farmer(
    message: str,
    language: str,
    district: str,
    state: str,
    soil_type: str,
    crops: list[str],
    weather_summary: str,
    season: str,
    crop_stage: str,
    last_diagnosis: str,
    market_context: str = "None requested",
) -> dict:
    """Send context-aware message to Groq Llama-3 to get response for farmer."""
    
    if not client:
        print("GROQ_API_KEY not configured. Returning fallback response.")
        return {
            "reply": "I am having trouble connecting to my AI brain right now. Please try again later.",
            "intent_type": "general"
        }

    LANGUAGE_NAMES = {
        "en": "English",
        "hi": "Hindi",
        "mr": "Marathi",
        "ta": "Tamil"
    }
    
    crops_str = ", ".join(crops) if crops else "Unknown"
    
    sys_prompt = CHAT_SYSTEM_PROMPT.format(
        language=LANGUAGE_NAMES.get(language, "English"),
        district=district,
        state=state,
        soil_type=soil_type,
        crops=crops_str,
        weather_summary=weather_summary,
        season=season,
        crop_stage=crop_stage,
        last_diagnosis=last_diagnosis if last_diagnosis else "None recently",
        market_context=market_context
    )
    
    try:
        response = await client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": sys_prompt
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.4,
            max_tokens=300,
        )
        
        reply_text = response.choices[0].message.content.strip() if response.choices else "Sorry, I couldn't process that."
        
        return {
            "reply": reply_text,
            "intent_type": "general" # Can be evolved with a classifier if needed
        }
        
    except Exception as e:
        print(f"Groq API Error with primary model: {e}")
        # Fallback to a smaller, more stable model
        try:
            response = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": message}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.4,
                max_tokens=300,
            )
            reply_text = response.choices[0].message.content.strip() if response.choices else "Sorry, I couldn't process that."
            return {
                "reply": reply_text,
                "intent_type": "general"
            }
        except Exception as e2:
            print(f"Groq API Error with fallback model: {e2}")
            return {
                "reply": "Service temporarily unavailable due to a network glitch. Try again soon.",
                "intent_type": "error"
            }
