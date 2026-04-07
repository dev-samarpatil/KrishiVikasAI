import os
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import httpx
from services.sarvam_service import transcribe_audio

router = APIRouter()

@router.post("/api/voice-stt")
async def voice_stt(
    file: UploadFile = File(...),
    language: str = Form("hi-IN")
):
    """
    Handle speech-to-text. 
    Frontend handles English natively via Web Speech API, so this endpoint 
    principally serves 'hi-IN', 'mr-IN', 'ta-IN' via Sarvam.
    """
    
    if not os.getenv("SARVAM_API_KEY"):
        return JSONResponse(
            status_code=500,
            content={"error": "Missing API Key for Sarvam", "details": "SARVAM_API_KEY is not set in environment variables"}
        )

    try:
        # Read audio bytes
        audio_bytes = await file.read()
        filename = file.filename or "audio.webm"
        
        # Derive MIME from filename extension (more reliable than browser content_type)
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webm"
        mime_map = {"wav": "audio/wav", "webm": "audio/webm", "mp4": "audio/mp4", "ogg": "audio/ogg", "mp3": "audio/mpeg"}
        content_type = mime_map.get(ext, file.content_type or "audio/webm")
        
        print(f"[voice-stt] Received file: {filename}, size: {len(audio_bytes)} bytes, "
              f"derived_mime: {content_type}, browser_mime: {file.content_type}, language: {language}")
        
        # Fallback to simple instruction if english mistakenly dispatched to endpoint
        if language in ('en', 'en-IN'):
            return {"transcript": "English transcription is meant to be handled client-side by the browser Web Speech API."}
        
        if len(audio_bytes) < 100:
            return JSONResponse(status_code=400, content={"error": "Audio file too small", "details": "Audio file is too small or empty."})
            
        # Send to Sarvam Saaras
        transcript = await transcribe_audio(audio_bytes, filename, language)
        
        return {
            "transcript": transcript
        }

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
