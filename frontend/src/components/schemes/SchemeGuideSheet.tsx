"use client";

import { X, CheckCircle, Clock, MapPin, FileText, Phone } from "lucide-react";

interface Scheme {
  id: string;
  name: string;
  benefit: string;
  eligibility_status: "eligible" | "check" | "not_eligible";
  summary: string;
  how_to_apply: string[];
  documents: string[];
  apply_url: string;
  helpline: string;
  timeline: string;
  benefit_amount: string;
}

interface SchemeGuideProps {
  scheme: Scheme | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SchemeGuideSheet({ scheme, isOpen, onClose }: SchemeGuideProps) {
  if (!isOpen || !scheme) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/40 transition-opacity" 
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.18)] flex flex-col p-5 animate-slide-up max-h-[85vh] overflow-y-auto pb-24">
        
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
        
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-extrabold text-gray-900 leading-tight pr-4">{scheme.name}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full active:scale-95 shrink-0"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
             <h3 className="text-sm font-bold text-blue-900 mb-1">Benefit Summary</h3>
             <p className="text-sm text-blue-800">{scheme.summary || scheme.benefit}</p>
          </div>

          {/* Eligibility */}
          <div className={`rounded-xl p-4 border ${scheme.eligibility_status === 'eligible' ? 'bg-green-50 border-green-200' : scheme.eligibility_status === 'check' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className={`w-5 h-5 ${scheme.eligibility_status === 'eligible' ? 'text-green-600' : scheme.eligibility_status === 'check' ? 'text-amber-500' : 'text-red-500'}`} />
              <h3 className={`text-sm font-bold ${scheme.eligibility_status === 'eligible' ? 'text-green-900' : scheme.eligibility_status === 'check' ? 'text-amber-900' : 'text-red-900'}`}>
                {scheme.eligibility_status === 'eligible' ? "You are eligible" : scheme.eligibility_status === 'check' ? "Check Eligibility" : "Not Eligible"}
              </h3>
            </div>
            <p className={`text-xs ${scheme.eligibility_status === 'eligible' ? 'text-green-800' : scheme.eligibility_status === 'check' ? 'text-amber-800' : 'text-red-800'}`}>
              Based on your profile, you meet the initial criteria for this scheme.
            </p>
          </div>

          {/* Application Steps */}
          {scheme.how_to_apply && scheme.how_to_apply.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" /> How to Apply
              </h3>
              <ul className="space-y-3 relative before:absolute before:inset-y-2 before:left-3 before:w-0.5 before:bg-gray-200 ml-1">
                {scheme.how_to_apply.map((step: string, idx: number) => (
                  <li key={idx} className="relative flex items-start gap-4">
                     <span className="w-6 h-6 rounded-full bg-green-100 border border-green-500 text-green-700 text-[10px] font-bold flex items-center justify-center shrink-0 relative z-10 bg-white">
                        {idx + 1}
                     </span>
                     <p className="text-sm text-gray-700 mt-0.5">{step}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Documents Needed */}
          {scheme.documents && scheme.documents.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" /> Documents Needed
              </h3>
              <div className="flex flex-wrap gap-2">
                {scheme.documents.map((doc: string, idx: number) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Rules */}
          <div className="grid grid-cols-2 gap-3 mt-4">
             <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1"><Clock className="w-3 h-3"/> Timeline</span>
                <span className="text-xs font-semibold text-gray-800 line-clamp-2">{scheme.timeline || "Apply Now"}</span>
             </div>
             <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1 mb-1"><Phone className="w-3 h-3"/> Helpline</span>
                <span className="text-xs font-semibold text-green-900 line-clamp-2">{scheme.helpline || "N/A"}</span>
             </div>
          </div>

          <a 
            href={scheme.apply_url || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white rounded-xl py-3.5 text-sm font-bold mt-4 active:scale-[0.98] transition-all"
          >
            🔗 Apply on Government Website
          </a>

          {scheme.helpline && (
            <a
              href={`tel:${scheme.helpline.replace(/[^0-9+]/g, '')}`}
              className="flex items-center justify-center gap-2 w-full border border-green-600 text-green-700 rounded-xl py-3 text-sm font-semibold mt-2"
            >
              📞 Call Helpline: {scheme.helpline}
            </a>
          )}
          
        </div>
      </div>
    </>
  );
}
