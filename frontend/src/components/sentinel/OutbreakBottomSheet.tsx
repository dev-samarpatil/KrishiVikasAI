"use client";

import { X, ShieldAlert, Activity, Navigation, Clock } from "lucide-react";

interface ClusterData {
  disease_name: string;
  count: number;
  lat: number;
  long: number;
  radius_km: number;
}

interface OutbreakBottomSheetProps {
  cluster: ClusterData | null;
  onClose: () => void;
}

export default function OutbreakBottomSheet({ cluster, onClose }: OutbreakBottomSheetProps) {
  if (!cluster) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 z-10 bg-black/20 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.18)] flex flex-col p-4 animate-slide-up">
        {/* Handle bar */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex items-center gap-3 mb-5">
           <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
             <ShieldAlert className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-xl font-black text-gray-900 leading-tight">
               {cluster.disease_name} Outbreak
             </h2>
             <p className="text-red-600 text-xs font-bold uppercase tracking-wider">High Risk Zone</p>
           </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
           {/* Box 1 */}
           <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center text-center">
             <Activity className="w-4 h-4 text-red-500 mb-1" />
             <div className="text-lg font-black text-gray-900">{cluster.count}</div>
             <div className="text-[10px] uppercase font-bold text-gray-400 leading-tight">Cases Reported</div>
           </div>
           
           {/* Box 2 */}
           <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center text-center">
             <Navigation className="w-4 h-4 text-orange-500 mb-1" />
             <div className="text-lg font-black text-gray-900">~{cluster.radius_km}km</div>
             <div className="text-[10px] uppercase font-bold text-gray-400 leading-tight">Impact Radius</div>
           </div>
           
           {/* Box 3 */}
           <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center text-center">
             <Clock className="w-4 h-4 text-blue-500 mb-1" />
             <div className="text-lg font-black text-gray-900">48h</div>
             <div className="text-[10px] uppercase font-bold text-gray-400 leading-tight">Time Window</div>
           </div>
        </div>
        
        <button 
          onClick={onClose}
          className="w-full bg-slate-900 text-white rounded-2xl py-3.5 font-bold mt-1 active:scale-[0.98] transition-transform"
        >
           Acknowledge & Close
        </button>
      </div>
    </>
  );
}
