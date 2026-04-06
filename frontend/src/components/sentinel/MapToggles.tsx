"use client";

import { useLanguage } from "@/context/LanguageContext";

interface MapTogglesProps {
  activeLayer: "disease" | "soil";
  setActiveLayer: (layer: "disease" | "soil") => void;
}

export default function MapToggles({ activeLayer, setActiveLayer }: MapTogglesProps) {
  const { t } = useLanguage();

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex gap-1 bg-slate-800 rounded-full p-1 shadow-lg">
      <button
        onClick={() => setActiveLayer("disease")}
        className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold transition-colors ${
          activeLayer === "disease"
            ? "bg-red-600 text-white"
            : "bg-transparent text-slate-400"
        }`}
      >
        Disease Outbreak
      </button>
      <button
        onClick={() => setActiveLayer("soil")}
        className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold transition-colors ${
          activeLayer === "soil"
            ? "bg-blue-700 text-white"
            : "bg-transparent text-slate-400"
        }`}
      >
        Climate Risk
      </button>
    </div>
  );
}
