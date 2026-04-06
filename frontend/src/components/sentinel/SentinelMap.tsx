"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
});
L.Marker.prototype.options.icon = DefaultIcon;

import MapToggles from "./MapToggles";
import OutbreakBottomSheet from "./OutbreakBottomSheet";
import { getFarmerContext } from "@/lib/farmer-context";
import { useLanguage } from "@/context/LanguageContext";

// Custom Leaflet DivIcon for pulsing cluster effect
const createPulseIcon = (count: number, colorClass: keyof typeof colors) => {
  const bgColors = {
    red: "bg-red-600",
    orange: "bg-orange-500",
    amber: "bg-[#D97706]"
  };
  const color = bgColors[colorClass];

  return L.divIcon({
    className: "pulse-marker-container",
    html: `
      <div class="relative flex items-center justify-center w-12 h-12">
        <div class="absolute w-full h-full ${color}/18 rounded-full animate-ping [animation-duration:2s]"></div>
        <div class="absolute w-8 h-8 ${color}/32 rounded-full animate-pulse"></div>
        <div class="absolute w-5 h-5 ${color} rounded-full flex items-center justify-center shadow-lg shadow-black/20">
           <span class="text-[9px] font-bold text-white">${count}</span>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const colors = {
  red: "red",
  orange: "orange",
  amber: "amber"
};

interface Cluster {
  disease_name: string;
  count: number;
  lat: number;
  long: number;
  radius_km: number;
  colorClass: keyof typeof colors;
}

const generateDemoClusters = (farmerLat: number, farmerLng: number): Cluster[] => [
  {
    // Severe — 8km northeast of farmer
    lat: farmerLat + 0.072,
    long: farmerLng + 0.072,
    count: 6,
    colorClass: 'red',
    disease_name: 'Fall Armyworm',
    radius_km: 15
  },
  {
    // Moderate — 12km northwest  
    lat: farmerLat + 0.065,
    long: farmerLng - 0.090,
    count: 3,
    colorClass: 'orange',
    disease_name: 'Early Blight',
    radius_km: 8
  },
  {
    // Low — 5km south
    lat: farmerLat - 0.045,
    long: farmerLng + 0.010,
    count: 1,
    colorClass: 'amber',
    disease_name: 'Powdery Mildew',
    radius_km: 2
  }
];

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function SentinelMap() {
  const [activeLayer, setActiveLayer] = useState<"disease" | "soil">("disease");
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const { t } = useLanguage();
  
  const ctx = getFarmerContext();
  const [mapCenter, setMapCenter] = useState<[number, number]>([ctx.lat || 19.99, ctx.long || 73.79]);
  const [clusters, setClusters] = useState<Cluster[]>(generateDemoClusters(ctx.lat || 19.99, ctx.long || 73.79));

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter([lat, lng]);
          setClusters(generateDemoClusters(lat, lng));
        },
        (error) => {
          console.error("GPS error:", error);
          setMapCenter([19.99, 73.79]);
          setClusters(generateDemoClusters(19.99, 73.79));
        }
      );
    }
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={10} 
        zoomControl={false}
        style={{ height: 'calc(100vh - 132px)', width: '100%' }}
      >
        <ChangeView center={mapCenter} />
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <CircleMarker 
          center={mapCenter}
          radius={8}
          pathOptions={{ 
            color: '#1D4ED8', 
            fillColor: '#3B82F6',
            fillOpacity: 1
          }}
        >
          {/* <Tooltip permanent>📍 Your location</Tooltip> */}
        </CircleMarker>

        {activeLayer === "disease" && clusters.map((cluster, idx) => (
          <Marker
            key={idx}
            position={[cluster.lat, cluster.long]}
            icon={createPulseIcon(cluster.count, cluster.colorClass)}
            eventHandlers={{
              click: () => {
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                  navigator.vibrate(50);
                }
                setSelectedCluster(cluster);
              }
            }}
          />
        ))}
      </MapContainer>

      {/* Floating Toggles over the map */}
      <MapToggles activeLayer={activeLayer} setActiveLayer={setActiveLayer} />

      {/* Map Legend */}
      <div className="absolute top-14 right-2.5 z-[1000] bg-slate-800/90 rounded-xl px-3 py-2">
         <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"></div>
               <span className="text-white text-xs font-semibold">{t("severe")}</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></div>
               <span className="text-white text-xs font-semibold">{t("moderate")}</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></div>
               <span className="text-white text-xs font-semibold">{t("low")}</span>
            </div>
         </div>
      </div>

      {/* Climate Risk Card */}
      {activeLayer === "soil" && (
        <div className="bg-white rounded-t-2xl p-5 absolute bottom-0 left-0 right-0 z-[1000] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
            Climate Risk &mdash; {ctx.district || "Nashik"}
          </h2>
          <div className="space-y-3 text-sm font-medium">
             <div className="flex items-start gap-3 bg-orange-50 p-3 rounded-xl border border-orange-100">
                <span className="text-lg leading-none mt-0.5">🌡️</span>
                <span className="text-orange-900">Heat stress risk &mdash; irrigate crops today</span>
             </div>
             <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                <span className="text-lg leading-none mt-0.5">💧</span>
                <span className="text-blue-900">Fungal disease risk &mdash; spray preventatively</span>
             </div>
             <div className="flex items-start gap-3 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                <span className="text-lg leading-none mt-0.5">☀️</span>
                <span className="text-yellow-900">Drought stress &mdash; check soil moisture</span>
             </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet overlay */}
      <OutbreakBottomSheet 
        cluster={selectedCluster as any} 
        onClose={() => setSelectedCluster(null)} 
      />
    </div>
  );
}
