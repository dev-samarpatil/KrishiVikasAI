from fastapi import APIRouter, HTTPException
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
    
    try:
        audio_base64 = await synthesize_speech(req.text, req.language)
    except Exception as e:
        print(f"[voice-tts] TTS failed: {e}")
        raise HTTPException(status_code=502, detail=f"TTS failed: {str(e)}")
    
    if audio_base64:
        # Return in Sarvam's native format
        return {"audios": [audio_base64]}
    else:
        raise HTTPException(status_code=500, detail="TTS returned no audio")
