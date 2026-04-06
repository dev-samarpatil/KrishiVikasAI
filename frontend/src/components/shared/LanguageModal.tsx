"use client";

import { X, Check } from "lucide-react";

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: string;
  onSelect: (lang: string) => void;
}

const LANGUAGE_OPTIONS = [
  { code: "en", native: "English", label: "English" },
  { code: "hi", native: "हिन्दी", label: "Hindi" },
  { code: "mr", native: "मराठी", label: "Marathi" },
  { code: "ta", native: "தமிழ்", label: "Tamil" },
];

export default function LanguageModal({
  isOpen,
  onClose,
  currentLang,
  onSelect,
}: LanguageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 animate-slide-up shadow-2xl">
        {/* Handle bar */}
        <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        
        <div className="flex justify-between items-center mb-6 px-1">
          <h2 className="text-xl font-bold text-gray-900">Select Language / भाषा चुनें</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
            aria-label="Close language modal"
          >
            <X className="w-5 h-5 text-gray-800" />
          </button>
        </div>

        <div className="space-y-2">
          {LANGUAGE_OPTIONS.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(50);
                  onSelect(lang.code);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.97] mb-2 ${
                  isSelected
                    ? "bg-green-50 border-2 border-green-600"
                    : "bg-white border-[1.5px] border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-lg font-bold text-gray-900 leading-none">
                    {lang.native}
                  </span>
                  <span className="text-sm font-medium text-gray-500 leading-none">
                    {lang.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="bg-green-600 text-white p-1 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
