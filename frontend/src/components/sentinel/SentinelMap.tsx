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
  const [weatherData, setWeatherData] = useState<any>(null);

  useEffect(() => {
    try {
      const data = localStorage.getItem('kv_weather');
      if (data) setWeatherData(JSON.parse(data));
    } catch(err) {}
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

  const getClimateRisk = (weather: any) => {
    const temp = weather?.temp || 28
    const humidity = weather?.humidity || 50
    const windSpeed = weather?.wind || 10
    
    const risks = []
    
    if (temp > 38) {
      risks.push({
        level: 'high',
        icon: '🌡️',
        title: 'Heat Stress Risk',
        advice: 'Temperature above 38°C. Irrigate crops early morning. Avoid spraying pesticides today.',
        color: 'border-red-500'
      })
    }
    if (humidity > 75) {
      risks.push({
        level: 'medium',
        icon: '💧',
        title: 'Fungal Disease Risk',
        advice: `High humidity (${humidity}%). Spray preventive fungicide. Ensure proper crop spacing for airflow.`,
        color: 'border-amber-400'
      })
    }
    if (windSpeed > 25) {
      risks.push({
        level: 'medium',
        icon: '💨',
        title: 'Avoid Spraying Today',
        advice: 'Wind speed too high for pesticide application. Wait for calm morning hours.',
        color: 'border-amber-400'
      })
    }
    if (risks.length === 0) {
      risks.push({
        level: 'low',
        icon: '✅',
        title: 'Weather Conditions Normal',
        advice: 'No immediate climate risk. Good conditions for field work and spraying.',
        color: 'border-green-500'
      })
    }
    return risks
  }

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
      {activeLayer === "soil" && (() => {
        const risks = getClimateRisk(weatherData);
        return (
          <div className="bg-white rounded-t-2xl p-5 absolute bottom-0 left-0 right-0 z-[1000] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-100 pb-2">
              Climate Risk &mdash; {ctx.district || "Nashik"}
            </h2>
            
            <p className="text-xs text-gray-500 text-center mb-3">
              📍 {ctx.district || "Pune"} | {weatherData?.temp || 28}°C | Humidity {weatherData?.humidity || 52}% | Wind {weatherData?.wind || 13} km/h
            </p>

            <div className="space-y-2 text-sm font-medium max-h-[40vh] overflow-y-auto no-scrollbar pb-4">
              {risks.map((risk, i) => (
                <div key={i} className={`bg-white rounded-2xl p-4 mb-2 border-l-4 ${risk.color} border border-gray-100 shadow-sm`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{risk.icon}</span>
                    <span className="font-bold text-sm text-gray-900">{risk.title}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{risk.advice}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Bottom Sheet overlay */}
      <OutbreakBottomSheet 
        cluster={selectedCluster as any} 
        onClose={() => setSelectedCluster(null)} 
      />
    </div>
  );
}
