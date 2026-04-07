import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from services.sarvam_service import synthesize_speech

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    language: str

@router.post("/api/voice-tts")
async def voice_tts(req: TTSRequest):
    """
    Convert text to speech via Sarvam Bulbul.
    Returns JSON with audios array containing base64 audio string.
    """
    if not os.getenv("SARVAM_API_KEY"):
        return JSONResponse(
            status_code=500,
            content={"error": "Missing API Key for Sarvam", "details": "SARVAM_API_KEY is not set in environment variables"}
        )
    
    try:
        audio_base64 = await synthesize_speech(req.text, req.language)
        if audio_base64:
            # Return in Sarvam's native format
            return {"audios": [audio_base64]}
        else:
            return JSONResponse(status_code=500, content={"error": "TTS returned no audio", "details": "Sarvam API succeeded but returned empty audio stream"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "details": "Check server logs or Sarvam API status",
            },
        )
