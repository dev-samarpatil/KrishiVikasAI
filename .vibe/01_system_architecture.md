# 01 — System Architecture
**Krishi Vikas AI · 4-Day Hackathon Build**

> **CRITICAL VIBE CODER INSTRUCTION:** > **STRICT REQUIREMENT:** Use **Python 3.14+**, **Node.js v22+**, **Next.js 15**, and the absolute latest versions of all SDKs (`@google/generative-ai`, `sarvamai`, `groq`, etc.). Do NOT use legacy syntax.

Read this first. This is the master blueprint. Every agent must follow this before writing any code.

## Product Identity

| Field | Value |
| :--- | :--- |
| **Name** | Krishi Vikas AI |
| **Tagline** | Empowering Farmers |
| **Hackathon** | Airavat 3.0 — IEEE CS S.P.I.T |
| **Track** | AI for Social Good + AI in Sustainability |
| **Theme** | AI-Powered Environmental Sentinel |
| **Target users** | Smallholder Indian farmers, rural Android phones |

## Key Architecture Decision
No CNN model is trained. All crop image analysis (disease detection + nutrient deficiency) is handled entirely by the Gemini 1.5 Flash vision API. This saves 4–6 hours of training time and is actually more accurate for Indian crops than a PlantVillage-trained model.

---

## Tech Stack — 100% Free Tier

### Frontend (Node.js v22+)
* **Next.js 15 (App Router)** configured as PWA
* **Tailwind CSS** for styling
* **React-Leaflet + OpenStreetMap** (no API key, no billing)
* **Chart.js** for soil health bar chart
* **next-pwa** for PWA config

### Backend (Python 3.14+)
* **FastAPI + Uvicorn**
* Hosted on **Render** free tier

### AI / Intelligence
* **Gemini 1.5 Flash** — ALL image diagnosis + scheme explanations + chat advisory (free 1M tokens/day via aistudio.google.com)
* **Groq API (Llama-3.3-70b-versatile)** — AI chatbot, fast responses (free tier, console.groq.com)
* **Sarvam AI Saaras** — Speech-to-Text for Hindi, Marathi, Tamil (₹1,000 free credits)
* **Sarvam AI Bulbul v3** — Text-to-Speech for Hindi, Marathi, Tamil (same credits)
* **Browser Web Speech API** — STT for English (free, built-in Chrome)
* **Browser speechSynthesis** — TTS for English (free, built-in)

### Static Data Files (pre-built, no API needed)
* `data/kvk_directory.json` — 731 KVKs with GPS coordinates
* `data/soil_types.json` — Indian districts → soil type
* `data/schemes.json` — 12–15 govt schemes with eligibility
* `data/crop_calendar.json` — crop → sowing/harvest months by state

### External APIs (all free, no billing)
* **OpenWeather** — current weather + 5-day forecast (free 1000 calls/day)
* **Nominatim/OSM** — GPS lat/long → district/state (no key needed)
* **Agmarknet/data.gov.in** — live mandi prices (no auth needed)

### Database & Hosting
* **Supabase** — PostgreSQL, free 500MB (diagnosis history, treatment logs, mandi cache)
* **Vercel** — frontend hosting, free tier, auto-deploy from GitHub
* **Render** — backend hosting, free tier (wakes after 15min idle — warm before demo)
* **GitHub** — version control, team collaboration

---

## Environment Variables

**backend/.env**
```env
GEMINI_API_KEY=from_aistudio_google_com
GROQ_API_KEY=from_console_groq_com
OPENWEATHER_API_KEY=from_openweathermap_org
SUPABASE_URL=from_supabase_dashboard
SUPABASE_KEY=anon_key_from_supabase
SARVAM_API_KEY=from_sarvam_ai
frontend/.env.local
Code snippet
NEXT_PUBLIC_BACKEND_URL=[https://your-app.onrender.com](https://your-app.onrender.com)
NEXT_PUBLIC_SUPABASE_URL=from_supabase_dashboard
NEXT_PUBLIC_SUPABASE_KEY=anon_key_from_supabase
Never commit .env files to GitHub. Add to .gitignore immediately.
________________________________________
Folder Structure
Plaintext
krishi-vikas-ai/
├── docs/                         ← All .md spec files
├── data/                         ← All 4 static JSON files
├── frontend/
│   ├── app/
│   │   ├── layout.tsx            ← App shell (TopBar + BottomNav + VoiceFAB)
│   │   ├── home/page.tsx
│   │   ├── sentinel/page.tsx
│   │   ├── farm/page.tsx
│   │   ├── mandi/page.tsx
│   │   └── schemes/page.tsx
│   ├── components/
│   │   ├── shell/TopBar.tsx
│   │   ├── shell/BottomNav.tsx
│   │   ├── shell/VoiceFAB.tsx
│   │   ├── home/SentinelAlertCard.tsx
│   │   ├── home/ScanHeroCard.tsx
│   │   ├── home/WeatherWidget.tsx
│   │   ├── home/QuickAccessGrid.tsx
│   │   ├── diagnosis/DiagnosisResultCard.tsx
│   │   ├── diagnosis/TreatmentPlan.tsx
│   │   ├── diagnosis/BudgetTable.tsx
│   │   ├── sentinel/SentinelMap.tsx
│   │   ├── sentinel/MapToggles.tsx
│   │   ├── sentinel/OutbreakBottomSheet.tsx
│   │   ├── farm/SoilHealthDial.tsx
│   │   ├── farm/OrganicTracker.tsx
│   │   ├── farm/DiagnosisTimeline.tsx
│   │   ├── mandi/MandiPriceCard.tsx
│   │   ├── schemes/SchemeCard.tsx
│   │   ├── voice/VoiceFABSheet.tsx
│   │   ├── shared/SkeletonLoader.tsx
│   │   └── shared/LanguageModal.tsx
│   └── lib/
│       ├── api.ts
│       ├── farmer-context.ts
│       └── compress-image.ts
├── backend/
│   ├── main.py
│   ├── routes/
│   │   ├── diagnose.py
│   │   ├── chat.py
│   │   ├── market.py
│   │   ├── schemes.py
│   │   ├── alerts.py
│   │   ├── climate.py
│   │   ├── voice_stt.py
│   │   └── voice_tts.py
│   ├── services/
│   │   ├── gemini_service.py
│   │   ├── groq_service.py
│   │   ├── sarvam_service.py
│   │   ├── weather_service.py
│   │   └── supabase_service.py
│   └── utils/
│       ├── geocode.py
│       ├── haversine.py
│       ├── json_loader.py
│       └── agmarknet.py
└── .gitignore
________________________________________
Navigation — 5 Tabs + Voice FAB
Bottom Navigation:
•	🏠 Home (/home) — Diagnosis + alerts hub
•	🗺️ Sentinel (/sentinel) — Geospatial heatmap (crucial for winning)
•	🌿 Farm (/farm) — Soil health + organic tracker
•	💰 Mandi (/mandi) — Live prices + where to sell
•	📝 Schemes (/schemes) — Govt subsidies + eligibility
Voice FAB: Fixed floating mic button, visible on ALL screens. Pulsing green → tap → Sarvam STT → Groq → Sarvam TTS.
________________________________________
All API Endpoints
POST /api/diagnose
•	Input: image (compressed to <200KB client-side), lat, long, crop_type, language
•	Steps:
1.	Nominatim: lat/long → district, state
2.	OpenWeather: lat/long → weather summary
3.	soil_types.json: district → soil_type
4.	crop_calendar.json: crop + month → season/stage
5.	Gemini 1.5 Flash vision: image + full context → structured JSON
6.	Supabase: save diagnosis record (for Sentinel heatmap)
•	Output: { disease, confidence, explanation, treatment_steps, organic_option, budget_items, soil_type, weather }
POST /api/chat
•	Input: message, language, district, crop, last_diagnosis
•	Steps:
1.	Build system prompt with full farm context
2.	Intent check: price → Agmarknet | weather → cache | scheme → JSON
3.	Groq (llama-3.3-70b): generate reply in farmer's language
•	Output: { reply, intent_type }
POST /api/voice-stt
•	Input: audio_blob (multipart), language
•	Steps: Forward to Sarvam Saaras STT API
•	Output: { transcript }
POST /api/voice-tts
•	Input: text, language
•	Steps: POST to Sarvam Bulbul v3 TTS
•	Output: audio/mp3 stream
GET /api/market
•	Input: state, district, crop (query params)
•	Steps:
1.	Check Supabase cache (< 6 hours old)
2.	If stale: call data.gov.in Agmarknet API
3.	Update Supabase cache
•	Output: { prices: [{ crop, market, modal_price, trend }] }
POST /api/schemes
•	Input: state, district, crop, language
•	Steps:
1.	Load schemes.json
2.	Filter by state + crop
3.	Gemini: generate plain-language guide in farmer's language
•	Output: { schemes: [{ name, benefit, eligibility, guide, documents }] }
POST /api/check-alerts
•	Input: lat, long
•	Steps:
1.	Supabase: GROUP BY disease_name WHERE timestamp > now-48h AND haversine(farmer_pos, record_pos) < 15km HAVING COUNT(*) >= 5
2.	Gemini: generate alert message in farmer's language
•	Output: { alert: bool, disease, count, message }
POST /api/climate-alert
•	Input: lat, long, crop, crop_stage, language
•	Steps:
1.	OpenWeather 5-day forecast
2.	crop_calendar.json: validate stage vs calendar
3.	Rules: rain>10mm+mature → harvest alert | temp>40°C → irrigation alert | humidity>85% for 3 days → fungal risk alert
4.	Gemini: generate alert text in language
•	Output: { alert_level: urgent|advisory|null, message }
POST /api/log-treatment
•	Input: farmer_id, diagnosis_id, treatment_type (organic|chemical)
•	Steps:
1.	Insert into treatment_logs
2.	Recalculate soil_health_score (organic=+10, chemical=+2, max 100)
3.	Check milestone badges
•	Output: { new_score, badge_earned }
________________________________________
Supabase Tables
SQL
CREATE TABLE diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id TEXT,
  disease_name TEXT,
  confidence FLOAT,
  lat FLOAT,
  long FLOAT,
  district TEXT,
  crop_type TEXT,
  treatment_chosen TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treatment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id TEXT,
  diagnosis_id UUID,
  treatment_type TEXT CHECK (treatment_type IN ('organic','chemical')),
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE farmer_profiles (
  id TEXT PRIMARY KEY,
  language TEXT DEFAULT 'hi',
  crop_types TEXT[],
  district TEXT,
  state TEXT,
  soil_health_score INT DEFAULT 50,
  crop_stage TEXT DEFAULT 'growing'
);

CREATE TABLE mandi_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT,
  district TEXT,
  crop TEXT,
  modal_price FLOAT,
  trend TEXT,
  fetched_at TIMESTAMPTZ DEFAULT now()
);
________________________________________
Farmer Context Object (passed to every API call)
TypeScript
interface FarmerContext {
  language: 'en' | 'hi' | 'mr' | 'ta'
  lat: number
  long: number
  district: string
  state: string
  soil_type: string          // from soil_types.json
  weather_summary: string    // from OpenWeather
  crop_types: string[]       // from onboarding / localStorage
  crop_stage: string         // from crop_calendar.json or manual
  last_diagnosis: string | null
  farmer_id: string          // UUID in localStorage
}
________________________________________
Languages Supported
Code|	Language|	STT|	TTS|
en|	English|	Browser Web Speech API|	Browser speechSynthesis|
hi|	हिन्दी|	Sarvam Saaras hi-IN|	Sarvam Bulbul v3|
mr|	मराठी|	Sarvam Saaras mr-IN|	Sarvam Bulbul v3|
ta|	தமிழ்|	Sarvam Saaras ta-IN|	Sarvam Bulbul v3|
Why Sarvam over Web Speech API for Indian languages: Sarvam is trained on rural dialects including Vidarbha Marathi and agricultural vocabulary. Web Speech API fails on these accents.
________________________________________
4-Day Build Order
Day|	Features|	Owner|
Day 1|	Setup + scaffold + Diagnose screen + Gemini vision	P1|
Day |	Voice/Chat (Sarvam+Groq) + Sentinel alerts + Schemes tab|	P2 + P4|
Day 3|	Mandi + Farm Health + Specialist + Language modal|	P3 + P1|
Day 4|	Polish + PPT in Canva + demo prep + Loom recording	All|
________________________________________
Demo Day Checklist
•	[ ] Pre-seed 6 diagnosis records in Supabase (Nashik, Fall Armyworm) for outbreak demo
•	[ ] Visit Render URL 2 minutes before presenting to wake backend
•	[ ] Have static JSON fallback for mandi prices (if Agmarknet is slow)
•	[ ] Test voice feature on real Android phone before judging
•	[ ] Record 90-second Loom backup video
•	[ ] 3 demo scenarios ready:
1.	Tomato leaf photo → Gemini diagnosis → Hindi explanation → ₹ budget
2.	Hindi voice query → Sarvam STT → Groq reply → Sarvam TTS speaks back
3.	Sentinel tab → red cluster → bottom sheet → outbreak stats
________________________________________
Hackathon PDF Alignment
Requirement|	Krishi Vikas AI implementation|
Intelligent Anomaly Prioritization|	Outbreak Sentinel — 5+ same disease in 15km/48hrs triggers community alert|
Temporal Pattern Modeling|	48hr cluster window + 5-day weather forecast|
Adaptive Intelligence|	Climate alert adapts to crop_stage from crop_calendar.json|
Context-Aware Query Interface|	Voice/text chat with full GPS + soil + weather context injected|
Signal-Optimized Alerting|	Alerts only fire when threshold crossed — no noise|



