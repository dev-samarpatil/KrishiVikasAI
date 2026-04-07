"use client";

import { useEffect, useState } from "react";
import { Leaf, Heart, History, Beaker, CheckCircle } from "lucide-react";
import SkeletonLoader from "@/components/shared/SkeletonLoader";
import { getFarmerContext } from "@/lib/farmer-context";
import { useLanguage } from "@/context/LanguageContext";

export default function FarmPage() {
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [soilScore, setSoilScore] = useState(0);
  const { t } = useLanguage();

  const ORGANIC_POINTS = 10;
  const CHEMICAL_POINTS = 2;

  useEffect(() => {
    const saved = localStorage.getItem('kv_soil_score');
    if (saved) setSoilScore(parseInt(saved));
  }, []);

  const ctx = getFarmerContext();

  useEffect(() => {
    const fetchFarmData = async () => {
      setLoading(true);
      try {
        const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        // Default to a test farmer ID if none exists in a real app
        const farmerId = "demo_farmer_123";
        const resp = await fetch(`${url}/api/farm-history?farmer_id=${farmerId}`);
        if (resp.ok) {
          const data = await resp.json();
          setProfile(data.profile);
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFarmData();
  }, []);

  // Compute SVG Dial parameters
  const score = soilScore;
  const radius = 60;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Make it a semi-circle (dasharray is half circumference, offset handles the fill)
  const arcLength = circumference / 2;
  const strokeDashoffset = arcLength - (score / 100) * arcLength;

  let healthStatus = "Degraded";
  let statusColor = "text-red-500";
  if (score >= 80) { healthStatus = "Excellent"; statusColor = "text-green-500"; }
  else if (score >= 60) { healthStatus = "Healthy"; statusColor = "text-green-600"; }
  else if (score >= 40) { healthStatus = "Fair"; statusColor = "text-amber-500"; }

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOrganic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
    const newScore = Math.min(100, soilScore + ORGANIC_POINTS);
    setSoilScore(newScore);
    localStorage.setItem('kv_soil_score', newScore.toString());
    
    // Add to treatment history
    const hist = JSON.parse(
      localStorage.getItem('kv_treatments') || '[]'
    );
    hist.unshift({
      type: 'organic',
      date: new Date().toLocaleDateString('en-IN'),
      points: ORGANIC_POINTS
    });
    localStorage.setItem('kv_treatments', 
      JSON.stringify(hist.slice(0, 10)));
    
    showToast('Organic treatment logged! +10 soil points 🌱');
  };

  const handleChemical = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
    const newScore = Math.min(100, soilScore + CHEMICAL_POINTS);
    setSoilScore(newScore);
    localStorage.setItem('kv_soil_score', newScore.toString());
    showToast('Chemical treatment logged! +2 soil points 🌱');
  };

  return (
    <div className="px-3 py-3 space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Leaf className="w-5 h-5 text-green-700" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">{t("farm")}</h1>
          <p className="text-xs text-gray-500 flex items-center gap-1">{t("soil_health")}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
           <SkeletonLoader variant="rect" className="h-48 w-full rounded-2xl" />
           <SkeletonLoader variant="rect" className="h-32 w-full rounded-2xl" />
           <SkeletonLoader variant="rect" className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Soil Health Dial */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm text-center">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <Heart className="w-5 h-5 text-green-700" />
              <span className="text-sm font-bold text-gray-900">{t("soil_health")}</span>
            </div>
            
            <div className="relative w-32 h-20 mx-auto mt-4 overflow-hidden">
               <svg height={radius * 2} width={radius * 2} className="absolute left-1/2 -translate-x-1/2 overflow-visible">
                  {/* Background Arc */}
                  <circle
                    stroke="#f3f4f6"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arcLength} ${arcLength}`}
                    strokeLinecap="round"
                    style={{ strokeDashoffset: 0, transform: "rotate(180deg)", transformOrigin: "50% 50%" }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                  {/* Progress Arc */}
                  <circle
                    stroke="url(#gradient)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arcLength} ${arcLength}`}
                    strokeLinecap="round"
                    style={{
                      strokeDashoffset,
                      transform: "rotate(180deg)",
                      transformOrigin: "50% 50%",
                      transition: "stroke-dashoffset 1s ease-out"
                    }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
               </svg>
               <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                 <span className="text-3xl font-extrabold text-gray-900 leading-none">{score}</span>
                 <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>{healthStatus}</span>
               </div>
            </div>

            {/* Badges */}
            <div className="flex justify-center gap-2 mt-2">
              {profile?.badges?.map((badge: string, idx: number) => (
                <span key={idx} className="bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold shadow-sm inline-flex items-center gap-1">
                   {t(badge.toLowerCase().replace(" ", "_"))}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Logs */}
          <div className="grid grid-cols-2 gap-3">
             <button onClick={handleOrganic} className="bg-green-700 text-white rounded-2xl p-3 flex flex-col items-center text-center shadow-sm active:scale-[0.97] transition-transform">
               <Leaf className="w-6 h-6 mb-1 opacity-80" />
               <span className="text-xs font-bold">{t("used_organic")}</span>
               <span className="text-[10px] text-green-200">+10 Soil Points</span>
             </button>
             <button onClick={handleChemical} className="bg-gray-100 text-gray-600 rounded-2xl p-3 flex flex-col items-center text-center border border-gray-200 shadow-sm active:scale-[0.97] transition-transform">
               <Beaker className="w-6 h-6 mb-1 opacity-60" />
               <span className="text-xs font-bold">{t("used_chemical")}</span>
               <span className="text-[10px] text-gray-400">+2 Soil Points</span>
             </button>
          </div>

          {/* Diagnosis History Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-bold text-gray-900">{t("treatment_history")}</span>
            </div>
            
            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-gray-100 pl-2">
              {history && history.length > 0 ? history.map((record, idx) => (
                <div key={idx} className="relative pl-6">
                   <div className="absolute left-[-2px] top-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-10 shadow-sm"></div>
                   <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-bold text-gray-900">{record.disease_name}</h3>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {new Date(record.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Crop: <strong>{record.crop_type}</strong></p>
                      
                      <div className="flex items-center gap-2">
                         {record.treatment_chosen === 'organic' ? (
                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                               <CheckCircle className="w-3 h-3" /> Organic Applied
                            </span>
                         ) : (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded">
                               Monitoring
                            </span>
                         )}
                      </div>
                   </div>
                </div>
              )) : (
                 <p className="text-xs text-gray-500 pl-6">No diagnoses logged yet. Scan a crop to get started!</p>
              )}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 
                        bg-green-700 text-white px-5 py-3 rounded-full 
                        text-sm font-semibold shadow-lg z-50
                        animate-bounce text-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
