"use client";

import { useEffect, useState } from "react";
import SentinelAlertCard from "@/components/home/SentinelAlertCard";
import { getFarmerContext, updateFarmerContext } from "@/lib/farmer-context";
import { checkAlerts } from "@/lib/api";

interface AlertData {
  alert: boolean;
  disease: string;
  count: number;
  message: string;
}

export default function GlobalInit() {
  const [alertData, setAlertData] = useState<AlertData | null>(null);

  useEffect(() => {
    async function init() {
      // 1. Get initial context
      const ctx = getFarmerContext();
      
      // 2. Request GPS if not requested or to refresh
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 60000, // 1 minute cache
          });
        });
        
        ctx.lat = pos.coords.latitude;
        ctx.long = pos.coords.longitude;
        
        // Let backend reverse geocode later, just update coords for now
        updateFarmerContext({ lat: ctx.lat, long: ctx.long });
      } catch {
        // Fallback to default/cached coordinates in context
      }

      // 3. Check for alerts globally
      try {
        const data = await checkAlerts(ctx.lat, ctx.long);
        if (data && data.alert) {
          setAlertData(data);
        }
      } catch {
        // Silently fail if alerts endpoint is down
      }
    }

    init();
  }, []);

  if (!alertData || !alertData.alert) return null;

  return (
    <div className="px-3 py-2 z-40 relative sticky top-[60px]">
      <SentinelAlertCard
        title="⚠️ Outbreak Alert Near You"
        message={alertData.message}
        count={alertData.count}
        disease={alertData.disease}
      />
    </div>
  );
}
