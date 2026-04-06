"use client";

import {
  Shield,
  AlertTriangle,
  Check,
  Leaf,
  ChevronDown,
  ChevronUp,
  MapPin,
  PhoneCall,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getFarmerContext } from "@/lib/farmer-context";
import { useLanguage } from "@/context/LanguageContext";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface DiagnosisResultCardProps {
  result: any;
  onChooseTreatment: (type: "organic" | "chemical") => void;
  onDismiss: () => void;
}

function getConfidenceColor(confidence: number) {
  if (confidence >= 0.85) return "bg-green-600";
  if (confidence >= 0.70) return "bg-amber-500";
  return "bg-red-500";
}

function getUrgencyLabel(urgency: string) {
  switch (urgency) {
    case "immediate":
      return { label: "Immediate Action", color: "bg-red-500 text-white" };
    case "within_week":
      return { label: "Within This Week", color: "bg-amber-500 text-white" };
    case "monitor":
      return { label: "Monitor", color: "bg-green-100 text-green-800" };
    default:
      return { label: urgency, color: "bg-gray-200 text-gray-700" };
  }
}

export default function DiagnosisResultCard({
  result,
  onChooseTreatment,
  onDismiss,
}: DiagnosisResultCardProps) {
  const [showBudget, setShowBudget] = useState(false);
  const [treatmentChosen, setTreatmentChosen] = useState<string | null>(null);
  const [kvks, setKvks] = useState<any[]>([]);
  const [loadingKvks, setLoadingKvks] = useState(false);
  const { t } = useLanguage();

  const confidence = result.confidence ?? 0;
  const confidencePct = Math.round(confidence * 100);
  const lowConfidence = confidence < 0.70;
  const urgency = getUrgencyLabel(result.urgency || "monitor");

  useEffect(() => {
    if (lowConfidence) {
       const fetchKvks = async () => {
         setLoadingKvks(true);
         try {
           const ctx = getFarmerContext();
           const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
           const resp = await fetch(`${url}/api/nearest-kvk?lat=${ctx.lat}&long=${ctx.long}`);
           if (resp.ok) {
             const data = await resp.json();
             setKvks(data.kvks || []);
           }
         } catch(e) {
             console.error(e);
         } finally {
             setLoadingKvks(false);
         }
       };
       fetchKvks();
    }
  }, [lowConfidence]);

  const handleTreatment = (type: "organic" | "chemical") => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setTreatmentChosen(type);
    onChooseTreatment(type);
  };

  // Only show retake screen for truly unclear/failed images
  const showRetake =
    !result ||
    result.error ||
    (confidence < 0.30 && result.type === "unclear");

  if (showRetake) {
    return (
      <div className="mx-3 mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
        <div className="text-4xl mb-2">📸</div>
        <h2 className="text-base font-bold text-amber-800">{t("retake_better_results") || "Retake for better results"}</h2>
        <p className="text-sm text-amber-700 mt-2">{t("photo_unclear") || "The photo was unclear. For best results:"}</p>
        <ul className="text-left text-sm text-amber-700 mt-3 space-y-1 ml-4 list-disc">
          <li>{t("natural_daylight") || "Take photo in natural daylight"}</li>
          <li>{t("leaf_closeup") || "Show the most affected leaf close-up"}</li>
          <li>{t("hold_steady") || "Hold phone steady, 20-30cm from leaf"}</li>
          <li>{t("avoid_shadows") || "Avoid shadows on the leaf"}</li>
        </ul>
        <button
          onClick={onDismiss}
          className="w-full bg-green-700 text-white rounded-xl px-6 py-3 font-semibold mt-4 active:scale-[0.98] transition-all"
        >
          {t("try_again") || "Try again"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-3 mt-3 bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
      {/* ── Green Header Band ───────────────────────────────── */}
      <div className="bg-green-700 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-lg font-bold">
              {result.name || t("analysis_complete") || "Analysis Complete"}
            </span>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${getConfidenceColor(confidence)}`}
          >
            {confidencePct}% {t("sure") || "sure"}
          </span>
        </div>
        {result.name_local && (
          <div className="text-sm text-green-100 mt-1">{result.name_local}</div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgency.color}`}
          >
            {t(urgency.label.toLowerCase().replace(" ", "_")) || urgency.label}
          </span>
          <span className="text-[10px] bg-green-600 px-2 py-0.5 rounded-full font-semibold capitalize">
            {t(result.type || "disease") || result.type || "disease"}
          </span>
        </div>
      </div>

      {/* ── Low Confidence Warning ──────────────────────────── */}
      {lowConfidence && (
        <div className="mx-4 mt-3 space-y-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-900">
                Not fully sure — consult an expert
              </div>
              <div className="text-xs text-amber-700 mt-0.5">
                {result.low_confidence_note ||
                  "The AI is not confident enough for this diagnosis. Please consult an expert."}
              </div>
            </div>
          </div>
          
          {/* Nearest KVKs */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
             <div className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Nearest KVK Centres
             </div>
             {loadingKvks ? (
                <div className="text-xs font-medium text-blue-700 animate-pulse">Finding nearest centres...</div>
             ) : kvks.length > 0 ? (
                <div className="space-y-2">
                   {kvks.map((k, i) => (
                      <div key={i} className="flex justify-between items-center bg-white border border-blue-100 rounded-lg p-2 shadow-sm">
                         <div>
                            <div className="text-xs font-bold text-gray-900">{k.name}</div>
                            <div className="text-[10px] text-gray-500">{k.distance_km} km away {k.university ? `• ${k.university}` : ''}</div>
                         </div>
                         <a href={`tel:${k.phone}`} className="w-8 h-8 flex items-center justify-center bg-green-100 rounded-full text-green-700 active:scale-95 transition-transform">
                            <PhoneCall className="w-3.5 h-3.5" />
                         </a>
                      </div>
                   ))}
                </div>
             ) : (
                <div className="text-xs text-blue-700">No centres found nearby. Call 1551 (Kisan Call Center).</div>
             )}
          </div>
        </div>
      )}

      {/* ── Explanation ─────────────────────────────────────── */}
      <div className="px-5 pt-4">
        <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-1">
          <span>📋</span> What happened
        </h3>
        <p className="text-sm text-gray-700 leading-relaxed">
          {result.explanation}
        </p>
      </div>

      {/* ── Cause ──────────────────────────────────────────── */}
      {result.cause && (
        <div className="px-5 pt-3">
          <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-1">
            <span>🔍</span> Cause
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">{result.cause}</p>
        </div>
      )}

      {/* ── Treatment Steps ─────────────────────────────────── */}
      {result.treatment_steps && result.treatment_steps.length > 0 && (
        <div className="px-5 pt-3">
          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1">
            <span>💊</span> Treatment Plan
          </h3>
          <ol className="space-y-2">
            {result.treatment_steps.map((step: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-[10px] font-bold text-green-800 shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 leading-relaxed">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Organic Option ──────────────────────────────────── */}
      {result.organic_option && (
        <div className="mx-5 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-amber-700" />
            <span className="text-sm font-bold text-amber-900">
              🌿 Organic Alternative
            </span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            {result.organic_option.description}
          </p>
          {result.organic_option.steps && result.organic_option.steps.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.organic_option.steps.map((step: string, i: number) => (
                <li
                  key={i}
                  className="text-xs text-amber-700 flex items-start gap-1"
                >
                  <span className="text-amber-500 mt-0.5">•</span>
                  {step}
                </li>
              ))}
            </ul>
          )}
          {result.organic_total_cost_inr > 0 && (
            <div className="mt-2 text-xs font-bold text-amber-900">
              Organic cost: ₹{result.organic_total_cost_inr}
            </div>
          )}
        </div>
      )}

      {/* ── Budget Table Toggle ──────────────────────────────── */}
      {result.budget_items && result.budget_items.length > 0 && (
        <div className="px-5 pt-3">
          <button
            onClick={() => setShowBudget(!showBudget)}
            className="flex items-center justify-between w-full text-sm font-bold text-gray-900 active:scale-[0.98] transition-all"
          >
            <span className="flex items-center gap-1">
              <span>💰</span> Budget Estimate (₹{result.total_cost_inr})
            </span>
            {showBudget ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {showBudget && (
            <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs font-bold text-gray-600">
                      Item
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-bold text-gray-600">
                      Qty
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-bold text-gray-600">
                      ₹ Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.budget_items.map(
                    (
                      item: { item: string; quantity: string; price_inr: number },
                      i: number
                    ) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-gray-800">{item.item}</td>
                        <td className="px-3 py-2 text-gray-600">{item.quantity}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900">
                          ₹{item.price_inr}
                        </td>
                      </tr>
                    )
                  )}
                  <tr className="border-t-2 border-gray-300 bg-green-50">
                    <td
                      colSpan={2}
                      className="px-3 py-2 font-bold text-green-900"
                    >
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-green-900 text-base">
                      ₹{result.total_cost_inr}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Prevention ──────────────────────────────────────── */}
      {result.prevention && (
        <div className="px-5 pt-3">
          <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-1">
            <span>🛡️</span> Prevention
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {result.prevention}
          </p>
        </div>
      )}

      {/* ── Context bar ─────────────────────────────────────── */}
      {result._context && (
        <div className="mx-5 mt-3 flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
          <MapPin className="w-3 h-3" />
          <span>
            {result._context.district}, {result._context.state}
          </span>
          <span>•</span>
          <span>{result._context.soil_type}</span>
          <span>•</span>
          <span>{result._context.season}</span>
        </div>
      )}

      {/* ── Treatment Choice Buttons ────────────────────────── */}
      <div className="px-5 py-4">
        {!treatmentChosen ? (
          <div>
            <p className="text-xs text-gray-500 mb-2 font-semibold">
              Which treatment will you use?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleTreatment("organic")}
                className="flex-1 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-xl py-3 text-sm font-bold active:scale-[0.96] transition-all flex items-center justify-center gap-1.5"
              >
                <Leaf className="w-4 h-4" /> Organic
              </button>
              <button
                onClick={() => handleTreatment("chemical")}
                className="flex-1 bg-green-50 border-2 border-green-300 text-green-900 rounded-xl py-3 text-sm font-bold active:scale-[0.96] transition-all flex items-center justify-center gap-1.5"
              >
                <Shield className="w-4 h-4" /> Chemical
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-700" />
            <span className="text-sm font-bold text-green-900">
              {treatmentChosen === "organic" ? "🌿 Organic" : "💊 Chemical"}{" "}
              treatment selected — logged to your farm profile
            </span>
          </div>
        )}

        <button
          onClick={onDismiss}
          className="w-full mt-3 text-sm text-gray-500 font-semibold py-2 active:scale-[0.96] transition-all"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
