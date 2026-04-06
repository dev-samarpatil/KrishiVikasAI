"use client";

import { useEffect, useState } from "react";
import { IndianRupee, MapPin } from "lucide-react";
import { getFarmerContext } from "@/lib/farmer-context";
import { useLanguage } from "@/context/LanguageContext";

import { MandiPrice } from "@/types/mandi";
import { cropEmojis, getLocationBasedPrices } from "@/lib/mandi";

export default function MandiPage() {
  const { t } = useLanguage();
  const [mandiData, setMandiData] = useState<MandiPrice[] | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const ctx = getFarmerContext();
  const [district, setDistrict] = useState("Loading...");
  const [stateName, setStateName] = useState("Maharashtra");

  useEffect(() => {
    const loadPrices = async (targetDistrict: string, targetState: string) => {
      setDistrict(targetDistrict);
      setStateName(targetState);
      
      try {
        const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const primaryCrop = ctx.crop_types && ctx.crop_types.length > 0 ? ctx.crop_types[0] : "Tomato";
        
        // Try live API first
        const res = await fetch(`${url}/api/market?state=${targetState}&district=${targetDistrict}&crop=${primaryCrop}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.prices?.length > 0) {
            setMandiData(data.prices);
            setIsLive(true);
            return;
          }
        }
      } catch (e) {
        console.warn("Mandi API failed, using fallback data");
      }
      
      // Use fallback if API fails
      setMandiData(getLocationBasedPrices(targetDistrict, targetState));
      setIsLive(false);
    };

    const getRealLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();

            // Extract district from Nominatim (usually state_district or county)
            let realDistrict = data.address?.state_district || data.address?.county || data.address?.city || 'Pune';
            realDistrict = realDistrict.replace(' District', ''); // Clean up string
            const realState = data.address?.state || 'Maharashtra';

            // Save to localStorage for other tabs
            localStorage.setItem('kv_district', realDistrict);
            localStorage.setItem('kv_state', realState);

            loadPrices(realDistrict, realState);
          } catch (error) {
            console.error("Geocoding failed, falling back to storage or Nashik", error);
            loadPrices(localStorage.getItem('kv_district') || 'Nashik', localStorage.getItem('kv_state') || 'Maharashtra');
          }
        }, (error) => {
          console.warn("GPS Permission denied, using storage or Nashik");
          loadPrices(localStorage.getItem('kv_district') || 'Nashik', 'Maharashtra');
        });
      } else {
        loadPrices('Nashik', 'Maharashtra');
      }
    };

    // Trigger the location fetch immediately on mount
    getRealLocation();
  }, [ctx.crop_types]);

  return (
    <div className="px-3 py-3 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <IndianRupee className="w-5 h-5 text-amber-600" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">Live Mandi Prices — {district}, {stateName}</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-500" : "bg-gray-400"}`}></span>
            {isLive ? "Live · Agmarknet · Updated today" : "Cached · Last updated 05 Apr 2026"}
          </p>
        </div>
      </div>

      {/* Price Cards */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-2">Today&apos;s Rates</h2>
        <div>
          {!mandiData ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse rounded-2xl h-20 mb-3 w-full" />
            ))
          ) : mandiData.length > 0 ? (
            mandiData.map((p, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3 flex items-center gap-3 active:scale-[0.98] transition-all duration-100"
              >
                <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                  {p.emoji || cropEmojis[p.crop] || cropEmojis["Default"]}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">{p.crop}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.market}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-gray-900">₹{p.modal_price || p.max_price}</div>
                  <div className="text-[10px] text-gray-400 font-normal">{p.unit || "per quintal"}</div>
                  <div className={`text-xs font-semibold mt-0.5 ${p.trend === 'up' ? 'text-green-600' : p.trend === 'down' ? 'text-red-600' : 'text-gray-400'}`}>
                    {p.trend === 'up' ? `▲ ${p.trend_percent || ''}` : p.trend === 'down' ? `▼ ${p.trend_percent || ''}` : "→ Stable"}
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-200">
               <p className="text-sm text-amber-800 font-medium">No active mandi trades found near you today.</p>
               <p className="text-xs text-amber-600 mt-1">Check back during morning auction hours.</p>
             </div>
          )}
        </div>
      </div>

      {/* Where to Sell Section */}
      <div className="pt-2">
        <h2 className="text-sm font-bold text-gray-900 mb-2">Where to Sell</h2>
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-[#E8F5E9] border border-green-200 rounded-2xl p-3 active:scale-[0.96] transition-transform">
              <span className="text-xs font-bold text-green-800 bg-green-200 px-2 py-0.5 rounded-full inline-block mb-1">Local</span>
              <h3 className="text-sm font-extrabold text-gray-900 leading-tight mt-1">{district} APMC</h3>
              <p className="text-[10px] text-green-700 mt-1">Verified physical market</p>
           </div>
           <div className="bg-[#E3F2FD] border border-blue-200 rounded-2xl p-3 active:scale-[0.96] transition-transform">
              <span className="text-xs font-bold text-blue-800 bg-blue-200 px-2 py-0.5 rounded-full inline-block mb-1">Digital</span>
              <h3 className="text-sm font-extrabold text-gray-900 leading-tight mt-1">e-NAM Portal</h3>
              <p className="text-[10px] text-blue-700 mt-1">Sell across borders directly</p>
           </div>
        </div>
      </div>
    </div>
  );
}
