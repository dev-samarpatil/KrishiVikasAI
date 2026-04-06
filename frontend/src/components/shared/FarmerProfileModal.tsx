"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface FarmerProfile {
  primary_crop: string;
  farm_size: string;
  farming_type: string;
  language: string;
  onboarded: boolean;
  created_at: string;
}

interface FarmerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  forceOpen?: boolean; // if true, it opens on mount if no profile
}

const CROPS = ["Tomato", "Onion", "Wheat", "Cotton", "Soybean", "Grapes", "Chilli", "Potato", "Corn"];
const SIZES = ["Less than 1 acre", "1-2 acres", "2-5 acres", "5+ acres"];
const TYPES = ["Organic 🌱", "Mixed", "Conventional"];
const LANGUAGES = [
  { code: "hi", label: "हिन्दी" },
  { code: "mr", label: "मराठी" },
  { code: "ta", label: "தமிழ்" },
  { code: "en", label: "English" },
];

export default function FarmerProfileModal({ isOpen, onClose, forceOpen }: FarmerProfileModalProps) {
  const { language: currentLang, setLanguage } = useLanguage();
  const [internalOpen, setInternalOpen] = useState(false);

  const [primaryCrop, setPrimaryCrop] = useState("Tomato");
  const [cropOther, setCropOther] = useState("");
  const [isOtherCrop, setIsOtherCrop] = useState(false);

  const [farmSize, setFarmSize] = useState("1-2 acres");
  const [farmingType, setFarmingType] = useState("Mixed");
  const [selectedLang, setSelectedLang] = useState(currentLang || "en");

  // On mount check if profile exists
  useEffect(() => {
    const saved = localStorage.getItem("kv_farmer_profile");
    if (!saved && forceOpen) {
      setInternalOpen(true);
    } else if (saved) {
      try {
        const data: FarmerProfile = JSON.parse(saved);
        if (CROPS.includes(data.primary_crop)) {
          setPrimaryCrop(data.primary_crop);
          setIsOtherCrop(false);
        } else {
          setPrimaryCrop("Other");
          setCropOther(data.primary_crop);
          setIsOtherCrop(true);
        }
        setFarmSize(data.farm_size);
        setFarmingType(data.farming_type);
        setSelectedLang(data.language);
      } catch (e) {
        // failed to parse
      }
    }
  }, [forceOpen]);

  // Sync external prop if manual trigger
  useEffect(() => {
    if (isOpen) {
      setInternalOpen(true);
      const saved = localStorage.getItem("kv_farmer_profile");
      if (saved) {
        try {
          const data: FarmerProfile = JSON.parse(saved);
          if (CROPS.includes(data.primary_crop)) {
            setPrimaryCrop(data.primary_crop);
            setIsOtherCrop(false);
          } else {
            setPrimaryCrop("Other");
            setCropOther(data.primary_crop);
            setIsOtherCrop(true);
          }
          setFarmSize(data.farm_size);
          setFarmingType(data.farming_type);
          setSelectedLang(data.language);
        } catch (e) {}
      }
    } else {
      setInternalOpen(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    const finalCrop = isOtherCrop && cropOther.trim() !== "" ? cropOther.trim() : primaryCrop === "Other" ? "Unknown" : primaryCrop;
    
    const profile: FarmerProfile = {
      primary_crop: finalCrop,
      farm_size: farmSize,
      farming_type: farmingType,
      language: selectedLang,
      onboarded: true,
      created_at: new Date().toISOString().split("T")[0],
    };

    localStorage.setItem("kv_farmer_profile", JSON.stringify(profile));
    
    // Also use the unified context if needed
    localStorage.setItem("kv_language", selectedLang);
    setLanguage(selectedLang);
    
    // Dispatch event to update other components dynamically
    window.dispatchEvent(new Event("kv_profile_updated"));

    setInternalOpen(false);
    onClose();
  };

  if (!internalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={() => { if (localStorage.getItem("kv_farmer_profile")) onClose(); }} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 pb-8 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl mx-auto w-full max-w-lg">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />
        
        <h2 className="text-lg font-bold text-gray-900 mb-1">Tell us about your farm</h2>
        <p className="text-sm text-gray-500 mb-5">This helps us give you accurate advice</p>

        <div className="space-y-6">
          {/* 1. Primary Crop */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Primary Crop</h3>
            <div className="flex flex-wrap gap-2">
              {CROPS.map((crop) => (
                <button
                  key={crop}
                  onClick={() => { setPrimaryCrop(crop); setIsOtherCrop(false); }}
                  className={`px-4 py-2 rounded-full border text-sm transition-all ${
                    primaryCrop === crop && !isOtherCrop
                      ? "border-green-600 bg-green-50 text-green-700 font-semibold"
                      : "border-gray-200 text-gray-600 bg-white"
                  }`}
                >
                  {crop}
                </button>
              ))}
              <button
                onClick={() => { setPrimaryCrop("Other"); setIsOtherCrop(true); }}
                className={`px-4 py-2 rounded-full border text-sm transition-all ${
                  isOtherCrop
                    ? "border-green-600 bg-green-50 text-green-700 font-semibold"
                    : "border-gray-200 text-gray-600 bg-white"
                }`}
              >
                Other
              </button>
              {isOtherCrop && (
                <input
                  type="text"
                  placeholder="Type crop name..."
                  value={cropOther}
                  onChange={(e) => setCropOther(e.target.value)}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              )}
            </div>
          </div>

          {/* 2. Farm Size */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Farm Size</h3>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setFarmSize(size)}
                  className={`px-4 py-2 rounded-full border text-sm transition-all ${
                    farmSize === size
                      ? "border-green-600 bg-green-50 text-green-700 font-semibold"
                      : "border-gray-200 text-gray-600 bg-white"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Farming Type */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Farming Type</h3>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setFarmingType(type)}
                  className={`px-4 py-2 rounded-full border text-sm transition-all ${
                    farmingType === type
                      ? "border-green-600 bg-green-50 text-green-700 font-semibold"
                      : "border-gray-200 text-gray-600 bg-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Preferred Language */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-2">Preferred Language</h3>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setSelectedLang(l.code)}
                  className={`px-4 py-2 rounded-full border text-sm transition-all ${
                    selectedLang === l.code
                      ? "border-green-600 bg-green-50 text-green-700 font-semibold"
                      : "border-gray-200 text-gray-600 bg-white"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-green-700 text-white rounded-xl py-3.5 text-sm font-bold mt-6 active:scale-[0.98] transition-transform"
        >
          Save & Start →
        </button>
      </div>
    </>
  );
}
