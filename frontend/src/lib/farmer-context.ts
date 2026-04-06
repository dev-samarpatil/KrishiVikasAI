export interface FarmerContext {
  language: "en" | "hi" | "mr" | "ta";
  lat: number;
  long: number;
  district: string;
  state: string;
  soil_type: string;
  weather_summary: string;
  crop_types: string[];
  crop_stage: string;
  last_diagnosis: string | null;
  farmer_id: string;
}

const STORAGE_KEY = "kv_farmer_context";

export function getFarmerContext(): FarmerContext {
  if (typeof window === "undefined") {
    return getDefaultContext();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as FarmerContext;
    } catch {
      return getDefaultContext();
    }
  }

  const ctx = getDefaultContext();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  return ctx;
}

export function updateFarmerContext(
  updates: Partial<FarmerContext>
): FarmerContext {
  const current = getFarmerContext();
  const updated = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

function getDefaultContext(): FarmerContext {
  return {
    language: "en",
    lat: 19.997,
    long: 73.789,
    district: "Nashik",
    state: "Maharashtra",
    soil_type: "Black (Regur)",
    weather_summary: "",
    crop_types: ["Tomato", "Onion"],
    crop_stage: "growing",
    last_diagnosis: null,
    farmer_id: generateFarmerId(),
  };
}

function generateFarmerId(): string {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem("kv_farmer_id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem("kv_farmer_id", id);
    return id;
  }
  return "unknown";
}
