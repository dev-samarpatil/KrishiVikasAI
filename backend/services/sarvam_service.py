import os
import httpx

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "").strip()

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

LANG_MAP = {
    "hi": "hi-IN",
    "mr": "mr-IN",
    "ta": "ta-IN",
    "en": "en-IN"
}

async def transcribe_audio(audio_bytes: bytes, filename: str, language: str) -> str:
    """Send audio to Sarvam Saaras STT API"""
    if not SARVAM_API_KEY:
        print("SARVAM_API_KEY not configured. Mocking STT.")
        return "मुझे मदद चाहिए" # Mock response for testing
    
    # language may already be in BCP-47 format (hi-IN) from frontend
    lang_code = language if "-" in language else LANG_MAP.get(language, "hi-IN")
    
    # Determine correct MIME type from filename extension
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "wav"
    mime_map = {
        "wav": "audio/wav",
        "webm": "audio/webm",
        "mp4": "audio/mp4",
        "m4a": "audio/mp4",
        "mp3": "audio/mpeg",
        "ogg": "audio/ogg",
    }
    mime_type = mime_map.get(ext, "audio/wav")
    
    headers = {
        "api-subscription-key": SARVAM_API_KEY
    }
    
    files = {
        "file": (filename, audio_bytes, mime_type)
    }
    data = {
        "language_code": lang_code,
        "model": "saaras:v3"
    }
    
    print(f"[sarvam-stt] Sending to Sarvam: lang={lang_code}, mime={mime_type}, "
          f"file={filename}, size={len(audio_bytes)} bytes")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(SARVAM_STT_URL, headers=headers, data=data, files=files)
            
            if resp.status_code != 200:
                print(f"[sarvam-stt] Sarvam REJECTED request: status={resp.status_code}")
                print(f"[sarvam-stt] Response body: {resp.text}")
            
            resp.raise_for_status()
            
            # Response is typically {"transcript": "...."}
            json_resp = resp.json()
            transcript = json_resp.get("transcript", "")
            print(f"[sarvam-stt] Transcript: {transcript[:100]}...")
            return transcript
            
    except httpx.HTTPStatusError as e:
        print(f"[sarvam-stt] HTTP Error {e.response.status_code}: {e.response.text}")
        raise e
    except Exception as e:
        print(f"[sarvam-stt] Error: {e}")
        raise e


import base64

async def synthesize_speech(text: str, language: str) -> bytes | None:
    """Convert text to speech via Sarvam Bulbul v3 TTS API"""
    if not SARVAM_API_KEY:
        print("SARVAM_API_KEY not configured. Skipping TTS.")
        return None
        
    lang_code = LANG_MAP.get(language, "hi-IN")
    
    headers = {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "inputs": [text],
        "target_language_code": lang_code,
        "speaker": "ritu",
        "model": "bulbul:v3"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(SARVAM_TTS_URL, headers=headers, json=payload)
            
            if resp.status_code != 200:
                print(f"[sarvam-tts] Sarvam REJECTED request: status={resp.status_code}")
                print(f"[sarvam-tts] Response body: {resp.text}")
                raise Exception(f"Sarvam TTS Error {resp.status_code}: {resp.text}")
            
            # Bulbul typically returns a JSON with { "audios": ["base64_string"] }
            json_resp = resp.json()
            audios = json_resp.get("audios", [])
            if audios:
                # Return the raw base64 string — let the route decide how to deliver it
                return audios[0]
            print("[sarvam-tts] No audios in Sarvam response")
            return None
            
    except Exception as e:
        print(f"Sarvam TTS Error: {e}")
        raise e
