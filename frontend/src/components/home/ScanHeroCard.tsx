"use client";

import { Camera } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { cropEmojis } from "@/lib/mandi";

interface ScanHeroCardProps {
  onFileSelected: (file: File) => void;
}

export default function ScanHeroCard({ onFileSelected }: ScanHeroCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const [cropText, setCropText] = useState("");

  useEffect(() => {
    const updateProfileText = () => {
      try {
        const saved = localStorage.getItem("kv_farmer_profile");
        if (saved) {
          const profile = JSON.parse(saved);
          const crop = profile.primary_crop;
          if (crop) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const emoji = (cropEmojis as any)[crop] || "🌱";
            setCropText(`${emoji} ${crop}`);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    
    updateProfileText();
    window.addEventListener("kv_profile_updated", updateProfileText);
    return () => window.removeEventListener("kv_profile_updated", updateProfileText);
  }, []);

  const handleTap = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    e.target.value = "";
  };

  return (
    <div className="mx-3 mt-3">
      <button
        onClick={handleTap}
        className="w-full bg-green-50 border-[1.5px] border-green-300 rounded-3xl p-6 flex flex-col items-center active:scale-[0.98] transition-all duration-100 shadow-sm"
        id="scan-hero-card"
      >
        <div className="w-16 h-16 bg-green-100 rounded-2xl border-2 border-green-300 flex items-center justify-center mb-4">
          <Camera className="w-9 h-9 text-green-700" strokeWidth={2.5} />
        </div>
        <div className="text-xl font-bold text-green-900">{t("scan_your_crop")}</div>
        <div className="text-sm font-medium text-green-700 mt-1 mb-2">
          {t("tap_for_diagnosis")}
        </div>
        
        {cropText && (
          <div className="text-xs text-green-600 font-bold mb-3">
            Scanning for: {cropText}
          </div>
        )}

        <div className="flex gap-2 mt-2 flex-wrap justify-center">
          {["disease_detection", "deficiency_check", "budget_plan"].map(
            (tag) => (
              <span
                key={tag}
                className="text-xs bg-white text-green-800 px-3 py-1.5 rounded-full border border-green-200 font-bold shadow-sm"
              >
                {t(tag)}
              </span>
            )
          )}
        </div>
      </button>

      {/* Hidden file input for camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        id="crop-image-input"
      />
    </div>
  );
}
