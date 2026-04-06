import axios from "axios";
import { getFarmerContext } from "./farmer-context";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach farmer_id to all JSON requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const ctx = getFarmerContext();
      if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
        config.data.farmer_id = ctx.farmer_id;
      }
    } catch {
      // Ignore
    }
  }
  return config;
});

// Safely execute API calls and bubble up friendly errors
async function safeCall<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error: any) {
    console.error("API Error:", error);
    const friendlyError = new Error(
      error?.response?.data?.detail ||
      error?.message ||
      "Unable to connect to the server. Please check your network and try again."
    );
    throw friendlyError;
  }
}

// Diagnosis
export async function diagnoseImage(formData: FormData) {
  if (typeof window !== "undefined") {
    const ctx = getFarmerContext();
    if (!formData.has("farmer_id")) {
      formData.append("farmer_id", ctx.farmer_id);
    }
  }
  return safeCall(async () => {
    const response = await api.post("/api/diagnose", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });
    return response.data;
  });
}

// Chat
export async function sendChatMessage(payload: {
  message: string;
  language: string;
  district: string;
  crop: string;
  last_diagnosis: string | null;
  farmer_id?: string;
}) {
  return safeCall(async () => {
    const response = await api.post("/api/chat", payload);
    return response.data;
  });
}

// Market prices
export async function getMarketPrices(
  state: string,
  district: string,
  crop: string
) {
  return safeCall(async () => {
    const response = await api.get("/api/market", {
      params: { state, district, crop },
    });
    return response.data;
  });
}

// Schemes
export async function getSchemes(payload: {
  state: string;
  district: string;
  crop: string;
  language: string;
  farmer_id?: string;
}) {
  return safeCall(async () => {
    const response = await api.post("/api/schemes", payload);
    return response.data;
  });
}

// Alerts
export async function checkAlerts(lat: number, long: number) {
  return safeCall(async () => {
    const response = await api.post("/api/check-alerts", { lat, long });
    return response.data;
  });
}

// Climate alert
export async function getClimateAlert(payload: {
  lat: number;
  long: number;
  crop: string;
  crop_stage: string;
  language: string;
  farmer_id?: string;
}) {
  return safeCall(async () => {
    const response = await api.post("/api/climate-alert", payload);
    return response.data;
  });
}

// Voice STT
export async function transcribeAudio(audioBlob: Blob, language: string) {
  return safeCall(async () => {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    formData.append("language", language);
    if (typeof window !== "undefined") {
      formData.append("farmer_id", getFarmerContext().farmer_id);
    }
    const response = await api.post("/api/voice-stt", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  });
}

// Voice TTS
export async function synthesizeSpeech(text: string, language: string) {
  return safeCall(async () => {
    const response = await api.post(
      "/api/voice-tts",
      { text, language },
      { responseType: "blob" }
    );
    return response.data;
  });
}

export default api;
