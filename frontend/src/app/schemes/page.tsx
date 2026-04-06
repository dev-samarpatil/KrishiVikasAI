"use client";

import { useEffect, useState } from "react";
import { Shield, MapPin } from "lucide-react";
import SchemeGuideSheet from "@/components/schemes/SchemeGuideSheet";
import { getFarmerContext } from "@/lib/farmer-context";
import { useLanguage } from "@/context/LanguageContext";

interface Scheme {
  id: string;
  name: string;
  category: string;
  benefit: string;
  eligibility_status: "eligible" | "check" | "not_eligible";
  summary: string;
  states: string[];
  crops: string[];
  how_to_apply: string[];
  documents: string[];
  apply_url: string;
  helpline: string;
  timeline: string;
  benefit_amount: string;
}

const FILTER_CHIPS = ["All", "Direct Benefit", "Crop Insurance", "Credit", "Irrigation", "Organic"];

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChip, setActiveChip] = useState("All");
  const { t } = useLanguage();
  
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [profileText, setProfileText] = useState("");
  const [farmerProfile, setFarmerProfile] = useState<any>(null);

  const [district, setDistrict] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);

  useEffect(() => {
    const ctx = getFarmerContext();
    let activeState = "Maharashtra";
    let activeDistrict = "Pune";
    let activeProfile: any = null;

    try {
      activeState = localStorage.getItem('kv_state') || ctx.state || activeState;
      activeDistrict = localStorage.getItem('kv_district') || ctx.district || activeDistrict;
      setState(activeState);
      setDistrict(activeDistrict);
    } catch {}

    const fetchSchemes = async () => {
      setLoading(true);
      try {
        const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const primaryCrop = activeProfile ? activeProfile.primary_crop : (ctx.crop_types && ctx.crop_types.length > 0 ? ctx.crop_types[0] : "Tomato");
        const resp = await fetch(`${url}/api/schemes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: activeState, crop_type: primaryCrop }),
        });
        if (resp.ok) {
          const data = await resp.json();
          setSchemes(data.schemes || []);
        } else {
          setSchemes([]);
        }
      } catch (err) {
        console.error(err);
        setSchemes([]);
      } finally {
        setLoading(false);
      }
    };

    // Load profile first, then fetch schemes
    try {
      const saved = localStorage.getItem("kv_farmer_profile");
      if (saved) {
        const profile = JSON.parse(saved);
        activeProfile = profile;
        setFarmerProfile(profile);
        setProfileText(`Based on your profile: ${profile.primary_crop} | ${profile.farm_size} | ${activeDistrict}`);
      }
    } catch {}

    fetchSchemes();
  }, []); // Run exactly once on mount per user instructions

  const handleOpenGuide = async (scheme: Scheme) => {
    if (scheme.eligibility_status === "not_eligible") return;
    
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
    
    setSelectedScheme(scheme);
  };

  const renderBadge = (status: "eligible" | "check" | "not_eligible") => {
    if (status === "eligible") {
      return (
        <span className="bg-green-100 text-green-800 rounded-full px-2.5 py-1 text-[10px] font-semibold">
          ✅ Eligible
        </span>
      );
    }
    if (status === "not_eligible") {
      return (
        <span className="bg-red-100 text-red-800 rounded-full px-2.5 py-1 text-[10px] font-semibold">
          ❌ Not Eligible
        </span>
      );
    }
    return (
      <span className="bg-amber-100 text-amber-800 rounded-full px-2.5 py-1 text-[10px] font-semibold">
        ⚠️ More Info
      </span>
    );
  };

  const filteredSchemes = schemes?.map((s) => {
    let status = s.eligibility_status;
    if (farmerProfile) {
      const sizeStr = farmerProfile.farm_size;
      const typeStr = farmerProfile.farming_type;
      
      const isOneAcreOrMore = sizeStr === "1-2 acres" || sizeStr === "2-5 acres" || sizeStr === "5+ acres";
      
      if (s.name.includes("PM-Kisan") || s.name.includes("PM Kisan")) {
        status = "eligible"; // PM-Kisan: eligible if farm_size is any value
      } else if (s.name.includes("PMFBY") || s.name.includes("Soil Health")) {
        status = "eligible"; // PMFBY / Soil health: eligible always
      } else if (s.name.includes("KCC") || s.name.includes("Kisan Credit") || s.name.includes("Credit Card")) {
        status = isOneAcreOrMore ? "eligible" : status;
      } else if (s.name.includes("Kusum") || s.name.includes("PM Kusum")) {
        status = isOneAcreOrMore ? "eligible" : status;
      } else if (s.name.includes("Organic") || s.name.includes("Paramparagat")) {
        status = typeStr.includes("Organic") ? "eligible" : status;
      }
    }
    return { ...s, eligibility_status: status };
  }).filter((s) => {
    if (activeChip === "All") return true;
    return s.category === activeChip;
  });

  return (
    <div className="py-3 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2 px-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-700" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">{t("government_schemes")}</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1">
             <MapPin className="w-3 h-3" /> {state}
          </p>
        </div>
      </div>

      {farmerProfile && farmerProfile.onboarded === true ? (
        <div className="mx-3 mb-1 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <span>🌾</span>
          <div>
            <div className="text-xs font-semibold text-green-800">
              Schemes filtered for your farm
            </div>
            <div className="text-[10px] text-green-600 mt-0.5">
              {farmerProfile.primary_crop} · {farmerProfile.farm_size} · {district}
            </div>
          </div>
        </div>
      ) : profileText && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 mx-3 mb-1 border border-gray-200 shadow-sm font-medium">
          {profileText}
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto px-3 pb-1 no-scrollbar">
        {FILTER_CHIPS.map((chip) => (
            <button
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
                setActiveChip(chip);
              }}
              key={chip}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap active:scale-[0.96] transition-all
                ${activeChip === chip 
                  ? 'bg-green-700 text-white' 
                  : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              {chip}
            </button>
          )
        )}
      </div>

      {/* Scheme Cards */}
      <div className="px-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
             <div key={i} className="animate-pulse bg-gray-200 rounded-2xl h-28 mb-3" />
          ))
        ) : filteredSchemes && filteredSchemes.length > 0 ? (
          filteredSchemes.map((s) => (
             <div
               key={s.id || s.name}
               onClick={() => handleOpenGuide(s)}
               className="mb-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer active:scale-[0.98] transition-all duration-100"
             >
               <div className="flex justify-between items-start">
                 <h3 className="text-sm font-bold text-gray-900 flex-1 pr-2 leading-tight">
                   {s.name}
                 </h3>
                 <div className="shrink-0">{renderBadge(s.eligibility_status)}</div>
               </div>
               
               <p className="text-xs text-gray-500 mt-1 mb-3 line-clamp-2">
                 {s.benefit}
               </p>
               
               <button 
                 className={`w-full rounded-xl px-4 py-2 text-xs font-semibold transition-transform
                   ${s.eligibility_status === 'eligible' ? 'bg-green-700 text-white' : 
                     s.eligibility_status === 'check' ? 'bg-amber-600 text-white' : 
                     'bg-gray-400 text-white'}`}
               >
                 {s.eligibility_status === 'eligible' ? `${t("view_details_apply")} →` : 
                  s.eligibility_status === 'check' ? 'Check Eligibility →' : 
                  'Not Available'}
               </button>
             </div>
          ))
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
            <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-600">No schemes found</p>
            <p className="text-xs text-gray-500 mt-1">We couldn&apos;t find any schemes for this category.</p>
          </div>
        )}
      </div>

      <SchemeGuideSheet 
         isOpen={!!selectedScheme}
         onClose={() => setSelectedScheme(null)}
         scheme={selectedScheme}
      />
    </div>
  );
}
