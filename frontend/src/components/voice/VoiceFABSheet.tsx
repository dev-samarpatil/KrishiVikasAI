"use client";

import { useState, useEffect, useRef } from "react";
import { LucideIcon, Mic, X, Loader2, Volume2 } from "lucide-react";
import { getFarmerContext } from "@/lib/farmer-context";
import { useLanguage } from "@/context/LanguageContext";
import { GoogleGenerativeAI } from "@google/generative-ai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;

type VoiceState = "IDLE" | "RECORDING" | "PROCESSING" | "SPEAKING";

interface Message {
  role: "user" | "bot";
  text: string;
}

interface VoiceFABSheetProps {
  isOpen: boolean;
  onClose: () => void;
  voiceState: VoiceState;
  setVoiceState: (state: VoiceState) => void;
}

export default function VoiceFABSheet({
  isOpen,
  onClose,
  voiceState,
  setVoiceState,
}: VoiceFABSheetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const { t } = useLanguage();
  
  // Clean up on unmount or forced close
  useEffect(() => {
    return () => {
      stopAllMedia();
    };
  }, []);

  // Listen to sheet closing to stop audio immediately
  useEffect(() => {
    if (!isOpen) {
      stopAllMedia();
      setVoiceState("IDLE");
    }
  }, [isOpen, setVoiceState]);

  const stopAllMedia = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      audioPlaybackRef.current = null;
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    // Also stop browser TTS if it was playing English
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const addMessage = (role: "user" | "bot", text: string) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const handleStartRecording = async () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    const ctx = getFarmerContext();
    const lang = localStorage.getItem("kv_language") || ctx.language || "en";

    // ── English: Use Web Speech API ──────────────────────────────────────────
    if (lang === "en") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setVoiceState("RECORDING");
          // Add timeout just in case it hangs
          recordingTimeoutRef.current = setTimeout(() => {
            recognition.stop();
          }, 30000);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          addMessage("user", transcript);
          processChat(transcript, lang);
        };

        recognition.onerror = () => {
          setVoiceState("IDLE");
        };

        recognition.onend = () => {
          if (voiceState === "RECORDING") {
             setVoiceState("PROCESSING");
          }
        };

        try {
          recognition.start();
        } catch (e) {
          console.error("Speech api start error", e);
        }
        return;
      }
    }

    // ── Indian Languages: Use MediaRecorder + Sarvam API ─────────────────────
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Force audio/webm — Sarvam accepts webm reliably
      let mimeType = "audio/webm";
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (!MediaRecorder.isTypeSupported("audio/webm") && MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4"; // Safari fallback
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((trk) => trk.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processStt(audioBlob, lang, mimeType);
      };

      mediaRecorder.start();
      setVoiceState("RECORDING");

      // Auto-submit after 30 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 30000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      setVoiceState("IDLE");
    }
  };

  const handleStopRecording = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Stop English Web Speech API if it was running (though it usually stops on silence)
    // For manual stop with media recorder:
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    
    setVoiceState("PROCESSING");
  };

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const processStt = async (audioBlob: Blob, lang: string, recordedMimeType?: string) => {
    setVoiceState("PROCESSING");
    try {
      const sarvamLangMap: Record<string, string> = {
        hi: "hi-IN",
        mr: "mr-IN",
        ta: "ta-IN",
      };
      const sarvamLang = sarvamLangMap[lang] || lang;

      // Match filename extension to actual recorded MIME type
      const extMap: Record<string, string> = {
        "audio/webm": "audio.webm",
        "audio/mp4": "audio.mp4",
        "audio/ogg": "audio.ogg",
        "audio/wav": "audio.wav",
      };
      const fileName = extMap[recordedMimeType || ""] || "audio.webm";

      const formData = new FormData();
      // Field name MUST be 'file' to match FastAPI UploadFile param name
      formData.append("file", audioBlob, fileName);
      formData.append("language", sarvamLang);

      console.log(`[STT] Sending: file=${fileName}, mime=${recordedMimeType}, lang=${sarvamLang}, size=${audioBlob.size}`);

      const res = await fetch(`${API_BASE}/api/voice-stt`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "unknown");
        console.error(`STT failed: ${res.status} — ${errBody}`);
        throw new Error(`STT failed: ${res.status}`);
      }
      const data = await res.json();
      
      if (data.transcript && data.transcript.trim() !== "") {
        addMessage("user", data.transcript);
        await processChat(data.transcript, lang);
      } else {
        // Did not catch speech
        setVoiceState("IDLE");
      }
    } catch (err) {
      console.error("STT endpoint error", err);
      if (typeof window !== "undefined") {
         alert('Voice processing failed. Check console.');
      }
      setVoiceState("IDLE");
    }
  };

  const processChat = async (messageText: string, lang: string) => {
    setVoiceState("PROCESSING");
    try {
      const genAI = new GoogleGenerativeAI(
        process.env.NEXT_PUBLIC_GEMINI_API_KEY!
      );
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash" 
      });
      
      const district = localStorage.getItem('kv_district') || 'Maharashtra';
      const crop = localStorage.getItem('kv_crop') || 'Tomato';
      const language = localStorage.getItem('kv_language') || 'en';
      
      const prompt = `You are Krishi Vikas AI, a helpful farming assistant. Answer in simple ${language} language.
Farmer location: ${district}. Crop: ${crop}.
Question: ${messageText}
Give a SHORT practical answer in 2-3 sentences maximum.
If about prices, weather, or diseases give specific advice.`;

      const result = await model.generateContent(prompt);
      const replyText = result.response.text();
      
      addMessage("bot", replyText);
      setVoiceState("SPEAKING");
      
      // Speak reply using browser TTS
      const utterance = new SpeechSynthesisUtterance(replyText);
      utterance.lang = language === 'hi' ? 'hi-IN' : 
                       language === 'mr' ? 'mr-IN' : 'en-IN';
      utterance.rate = 0.9;
      
      utterance.onend = () => {
        setVoiceState("IDLE");
      };
      
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } else {
        setVoiceState("IDLE");
      }

    } catch (err) {
      console.error("Chat endpoint error", err);
      setVoiceState("IDLE");
    }
  };

  const processTts = async (text: string, lang: string) => {
    // English TTS handler
    if (lang === "en") {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        setVoiceState("SPEAKING");
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-IN";
        utterance.onend = () => {
          setVoiceState("IDLE");
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setVoiceState("IDLE");
      }
      return;
    }

    // Sarvam TTS handler
    try {
      console.log("[TTS] Requesting TTS for lang:", lang, "text length:", text.length);
      const res = await fetch(`${API_BASE}/api/voice-tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: lang }),
      });

      console.log("[TTS] Response Status:", res.status);

      if (!res.ok) {
        const errBody = await res.text().catch(() => "unknown");
        console.error(`[TTS] Backend error: ${res.status} — ${errBody}`);
        throw new Error(`TTS failed: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("[TTS] Response Data Keys:", Object.keys(data));

      // Sarvam returns { audios: ["base64_string"] }
      if (data.audios && data.audios.length > 0) {
        const base64Audio = data.audios[0];
        console.log("[TTS] Audio data received, length:", base64Audio.length, "- attempting playback...");

        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        audioPlaybackRef.current = audio;

        audio.onended = () => {
          console.log("[TTS] Audio playback finished");
          setVoiceState("IDLE");
        };

        setVoiceState("SPEAKING");

        try {
          await audio.play();
          console.log("[TTS] Audio playing successfully");
        } catch (playErr) {
          console.error("[TTS] WAV play failed, trying MPEG fallback:", playErr);
          audio.src = `data:audio/mpeg;base64,${base64Audio}`;
          try {
            await audio.play();
            console.log("[TTS] Audio playing with MPEG fallback");
          } catch (fallbackErr) {
            console.error("[TTS] All playback attempts failed:", fallbackErr);
            setVoiceState("IDLE");
          }
        }
      } else {
        console.error("[TTS] No audio data found in response:", data);
        setVoiceState("IDLE");
      }
    } catch (err) {
      console.error("[TTS] TTS generation error:", err);
      setVoiceState("IDLE");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dark overlay backdrop — tap to dismiss */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Bottom Sheet UI */}
      <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] h-[500px] bg-white rounded-t-3xl z-50 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pt-2 pb-safe transform transition-transform duration-300">
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-2" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Chat History Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && voiceState !== "RECORDING" && (
            <div className="text-center text-gray-500 mt-10">
              <Mic className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="font-bold">{t("ask_krishi")}</p>
              <p className="text-sm">"{t("voice_prompt_hint")}"</p>
            </div>
          )}

          {messages.map((m, idx) => (
             <div 
               key={idx} 
               className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
             >
               <div className={`max-w-[80%] p-3 text-sm shadow-sm ${
                 m.role === "user" 
                  ? "bg-green-600 text-white rounded-2xl rounded-tr-sm" 
                  : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm"
               }`}>
                 {m.text}
               </div>
             </div>
          ))}

          {/* Processing typing indicator */}
          {voiceState === "PROCESSING" && (
            <div className="flex justify-start">
               <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-3 shadow-sm flex items-center gap-1 w-16 h-10">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
               </div>
            </div>
          )}
        </div>

        {/* Action Bottom Area */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col items-center justify-center pb-8 shrink-0">
          
          <div className="h-6 mb-4 flex items-center justify-center relative">
             {voiceState === "RECORDING" && (
                <div className="flex items-center gap-1">
                   {[1,2,3,4,5,6,7].map((i) => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-red-500 rounded-full animate-pulse text-transparent"
                        style={{ height: `${Math.random() * 16 + 8}px`, animationDuration: `${Math.random() * 0.5 + 0.3}s` }} 
                      >.</div>
                   ))}
                </div>
             )}
             
             {voiceState === "SPEAKING" && (
                <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                   <Volume2 className="w-4 h-4 animate-pulse" /> Speaking...
                </div>
             )}

             {voiceState === "IDLE" && messages.length > 0 && (
                <div className="text-gray-400 text-xs font-semibold">
                  {t("tap_mic_to_reply")}
                </div>
             )}
          </div>

          <button
            onClick={voiceState === "RECORDING" ? handleStopRecording : handleStartRecording}
            className={`h-16 w-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 z-50 ${
              voiceState === "IDLE" ? "bg-green-600" :
              voiceState === "RECORDING" ? "bg-red-600 scale-110" :
              voiceState === "PROCESSING" ? "bg-green-600 opacity-60" :
              voiceState === "SPEAKING" ? "bg-green-600 shadow-[0_0_0_8px_rgba(22,163,74,0.3)] animate-pulse" : ""
            }`}
          >
            {voiceState === "PROCESSING" ? (
               <Loader2 className="w-8 h-8 animate-spin" />
            ) : voiceState === "RECORDING" ? (
               <div className="w-6 h-6 bg-white rounded-sm" /> // Stop square
            ) : (
               <Mic className="w-8 h-8" /> // Mic for IDLE and SPEAKING
            )}
          </button>
        </div>
      </div>
    </>
  );
}
