
# 03 — Data Mapping Rules

> **CRITICAL VIBE CODER INSTRUCTION:** > **STRICT REQUIREMENT:** Use **Python 3.14+**, **Node.js v22+**, **FastAPI 0.115+**, and the absolute latest versions of all SDKs. Do NOT use legacy syntax (e.g., avoid importing `List` or `Dict` from `typing`; use the built-in `list` and `dict` types).

**How to Link Soil / Scheme / KVK / Calendar JSONs**
This file explains exactly how to load and use each of the 4 static JSON files. No API calls, no database — just fast file reads.

## Overview
You have 4 pre-built JSON files in the `data/` folder:

| File | Used for | When to call |
| :--- | :--- | :--- |
| `soil_types.json` | Region-specific treatment advice | On every `/api/diagnose` call |
| `schemes.json` | Govt scheme eligibility + details | On `/api/schemes` call |
| `kvk_directory.json` | Nearest specialist connect | On specialist screen load |
| `crop_calendar.json` | Crop stage + season context | On every `/api/diagnose` + `/api/climate-alert` |

---

## 1. `soil_types.json` — District → Soil Type

### Expected format
```json
{
  "Nashik": "Alluvial",
  "Nagpur": "Black",
  "Pune": "Black",
  "Kolhapur": "Laterite"
}
```

### How to use in backend
```python
# backend/utils/json_loader.py
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "../../data")

def get_soil_type(district: str) -> str:
    with open(f"{DATA_DIR}/soil_types.json") as f:
        soil_data = json.load(f)
    # Try exact match first, then title case, then default
    return (
        soil_data.get(district) or
        soil_data.get(district.title()) or
        "Mixed"  # safe default
    )
```

### How it feeds into Gemini
The soil type is injected into the diagnosis prompt:
`Soil type: Black (Regur) — high moisture retention, good for cotton and soybean`
This makes Gemini's treatment advice region-specific instead of generic.

---

## 2. `schemes.json` — Government Scheme Data

### How to filter schemes
```python
# backend/routes/schemes.py
def filter_schemes(state: str, crop: str, schemes_data: list[dict]) -> list[dict]:
    eligible = []
    for scheme in schemes_data:
        # Check state eligibility
        state_ok = ("ALL" in scheme["states"] or state in scheme["states"])
        # Check crop eligibility
        crop_ok = ("ALL" in scheme["crops"] or any(c.lower() in crop.lower() for c in scheme["crops"]))
        if state_ok and crop_ok:
            eligible.append(scheme)
    return eligible
```

### Eligibility badge logic
```python
def get_eligibility_status(scheme: dict, farmer_acres: float) -> str:
    limit = scheme["eligibility"]["land_limit_acres"]
    if limit is None or farmer_acres <= limit:
        return "eligible"      # ✅ Green badge
    elif farmer_acres <= limit * 1.5:
        return "check"         # ⚠️ Amber badge — borderline
    else:
        return "not_eligible"  # ❌ Red badge
```

---

## 3. `kvk_directory.json` — KVK Finder

### Haversine distance calculation
```python
# backend/utils/haversine.py
import math

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dlon/2)**2)
    return R * 2 * math.asin(math.sqrt(a))

def get_nearest_kvks(farmer_lat: float, farmer_long: float, kvk_data: list[dict], top_n: int = 3) -> list[dict]:
    with_distance = []
    for kvk in kvk_data:
        dist = haversine_km(farmer_lat, farmer_long, kvk["lat"], kvk["long"])
        with_distance.append({**kvk, "distance_km": round(dist, 1)})

    return sorted(with_distance, key=lambda x: x["distance_km"])[:top_n]
```

---

## 4. `crop_calendar.json` — Season + Stage Context

### How to derive crop_stage automatically
```python
# backend/utils/json_loader.py
from datetime import datetime

def get_crop_stage(crop: str, state: str, calendar_data: dict) -> dict:
    crop_key = crop.lower().replace(" ", "_")
    current_month = datetime.now().month

    if crop_key not in calendar_data:
        return {"season": "unknown", "stage": "growing"}

    crop_info = calendar_data[crop_key]

    for season_name in ["kharif", "rabi", "zaid"]:
        if season_name not in crop_info:
            continue
        season = crop_info[season_name]

        stage_map = {
            "sowing_months": "sowing",
            "flowering_months": "flowering",
            "fruiting_months": "fruiting",
            "boll_formation_months": "boll_formation",
            "harvest_months": "mature",
            "boll_opening_months": "mature"
        }
        for key, stage_name in stage_map.items():
            if key in season and current_month in season[key]:
                return {
                    "season": season_name,
                    "stage": stage_name,
                    "display": f"{season_name.capitalize()} — {stage_name.replace('_', ' ').title()}"
                }

    return {"season": "off-season", "stage": "growing"}
```

---

## Loading All JSONs at Startup (FastAPI State)

Load once at app startup — not on every request.

```python
# backend/main.py
import json
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load all static data at startup
    with open("../data/soil_types.json") as f:
        app.state.soil = json.load(f)
    with open("../data/schemes.json") as f:
        app.state.schemes = json.load(f)
    with open("../data/kvk_directory.json") as f:
        app.state.kvk = json.load(f)
    with open("../data/crop_calendar.json") as f:
        app.state.calendar = json.load(f)
    yield
    # Clean up here if needed

app = FastAPI(lifespan=lifespan)
```
*(Vibe Coder Note: In your route files, access these via `request.app.state.soil`, etc.)*

---

## Nominatim — GPS to District/State

```python
# backend/utils/geocode.py
import httpx

async def reverse_geocode(lat: float, long: float) -> dict:
    url = "[https://nominatim.openstreetmap.org/reverse](https://nominatim.openstreetmap.org/reverse)"
    params = {
        "lat": lat,
        "lon": long,
        "format": "json",
        "zoom": 10,
        "addressdetails": 1
    }
    headers = {"User-Agent": "KrishiVikasAI/1.0 (hackathon project)"}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        data = response.json()

    address = data.get("address", {})
    district = (address.get("county") or address.get("district") or address.get("city") or "Unknown")
    state = address.get("state", "Unknown")

    # Clean up district name
    district = district.replace(" District", "").replace(" district", "").strip()

    return {"district": district, "state": state}
```

---

## Agmarknet — Live Mandi Prices

```python
# backend/utils/agmarknet.py
import httpx

AGMARKNET_URL = "[https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070](https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070)"

async def fetch_mandi_prices(state: str, district: str, commodity: str) -> list[dict]:
    params = {
        "api-key": "579b464db66ec23bdd000001cdd3946e44ce4aae38d4b36c33a9b00",
        "format": "json",
        "limit": "10",
        "filters[State]": state,
        "filters[District]": district,
        "filters[Commodity]": commodity
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(AGMARKNET_URL, params=params, timeout=10.0)
            resp.raise_for_status()
            data = resp.json()

        records = data.get("records", [])
        return [
            {
                "crop": r.get("Commodity"),
                "market": r.get("Market"),
                "min_price": r.get("Min Price"),
                "max_price": r.get("Max Price"),
                "modal_price": r.get("Modal Price"),
                "date": r.get("Arrival Date")
            }
            for r in records
        ]
    except Exception as e:
        print(f"Agmarknet API Error: {e}")
        return [] # Return empty list so frontend can fallback gracefully
```
```

The startup state loading via FastAPI's modern `lifespan` manager is a huge win for performance!