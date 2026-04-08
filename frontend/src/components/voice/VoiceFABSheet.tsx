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
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in your browser. Note: some browsers don't support it on localhost unless without http.");
      setVoiceState("IDLE");
      return;
    }

    const langMap: Record<string, string> = {
      en: "en-IN",
      hi: "hi-IN",
      mr: "mr-IN",
      ta: "ta-IN",
    };

    const recognition = new SpeechRecognition();
    recognition.lang = langMap[lang] || "en-IN";
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
      handleVoiceQuery(transcript, lang);
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
      setVoiceState("IDLE");
    }
  };

  const handleStopRecording = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Stop English Web Speech API if it was running (though it usually stops on silence)
    if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);

    setVoiceState("PROCESSING");
  };



  const getAIReply = async (transcript: string): Promise<string> => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) return "AI not configured. Check API key."

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest"
    })

    const district = localStorage.getItem('kv_district') || 'India'
    const crop = localStorage.getItem('kv_crop') || 'crops'
    const language = localStorage.getItem('kv_language') || 'en'
    const langMap: Record<string, string> = {
      en: "English", hi: "Hindi",
      mr: "Marathi", ta: "Tamil"
    }
    const lang = langMap[language] || "English"

    const prompt = `You are Krishi Vikas AI farming assistant.
Answer in ${lang} language. Simple words. Max 3 sentences.
Farmer: ${district}. Crop: ${crop}.
Question: ${transcript}
Give practical farming advice directly.`

    const result = await model.generateContent(prompt)
    return result.response.text()
  }

  const handleVoiceQuery = async (messageText: string, lang: string) => {
    try {
      setVoiceState("PROCESSING");
      const reply = await getAIReply(messageText);

      addMessage("bot", reply);

      // Speak reply
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
        const language = localStorage.getItem('kv_language') || 'en'
        const utterance = new SpeechSynthesisUtterance(reply)
        utterance.lang = language === 'hi' ? 'hi-IN' :
          language === 'mr' ? 'mr-IN' :
            language === 'ta' ? 'ta-IN' : 'en-IN'
        utterance.rate = 0.9

        utterance.onend = () => {
          setVoiceState("IDLE");
        };

        setVoiceState("SPEAKING");
        window.speechSynthesis.speak(utterance)
      } else {
        setVoiceState("IDLE");
      }
    } catch (err: any) {
      console.error("Voice error:", err)
      const msg = err?.message || ""
      const reply = msg.includes('429') || msg.includes('quota')
        ? "AI is busy. Please try in 1-2 minutes. 🙏"
        : "Sorry, please try again."

      addMessage("bot", reply);
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
              <div className={`max-w-[80%] p-3 text-sm shadow-sm ${m.role === "user"
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
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
            className={`h-16 w-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 z-50 ${voiceState === "IDLE" ? "bg-green-600" :
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
