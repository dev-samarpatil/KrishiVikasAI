"use client";

import { useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import VoiceFABSheet from "@/components/voice/VoiceFABSheet";

type VoiceState = "IDLE" | "RECORDING" | "PROCESSING" | "SPEAKING";

export default function VoiceFAB() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("IDLE");

  const handleFABTap = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Open sheet 
    if (!isSheetOpen) {
      setIsSheetOpen(true);
    }
  };

  return (
    <>
      <VoiceFABSheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        voiceState={voiceState}
        setVoiceState={setVoiceState}
      />
      
      {/* Floating button always visible if sheet is not open */}
      {!isSheetOpen && (
        <button
          onClick={handleFABTap}
          className={`fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full border-4 border-white shadow-xl flex items-center justify-center transition-all active:scale-95 ${
            voiceState === "IDLE" ? "bg-green-600 animate-pulse" :
            voiceState === "RECORDING" ? "bg-red-600" :
            voiceState === "PROCESSING" ? "bg-green-600 opacity-60" :
            voiceState === "SPEAKING" ? "bg-green-600 shadow-[0_0_0_4px_rgba(22,163,74,0.3)] animate-pulse" : "bg-green-600"
          }`}
          style={voiceState === "IDLE" ? { animationDuration: "2.5s" } : {}}
          aria-label="Voice assistant"
          id="voice-fab"
        >
          {voiceState === "PROCESSING" ? (
             <Loader2 className="w-7 h-7 text-white animate-spin" />
          ) : voiceState === "RECORDING" ? (
             <div className="w-5 h-5 bg-white rounded-sm" /> 
          ) : (
             <Mic className="w-7 h-7 text-white" strokeWidth={2} />
          )}
        </button>
      )}
    </>
  );
}
