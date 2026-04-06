import httpx


async def reverse_geocode(lat: float, long: float) -> dict:
    """GPS lat/long → district, state via Nominatim/OpenStreetMap."""
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": lat,
        "lon": long,
        "format": "json",
        "zoom": 10,
        "addressdetails": 1,
    }
    headers = {"User-Agent": "KrishiVikasAI/1.0 (hackathon project)"}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        data = response.json()

    address = data.get("address", {})
    district = (
        address.get("county")
        or address.get("district")
        or address.get("city")
        or "Unknown"
    )
    state = address.get("state", "Unknown")

    # Clean up district name
    district = district.replace(" District", "").replace(" district", "").strip()

    return {"district": district, "state": state}

import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two GPS coordinates in kilometers."""
    R = 6371.0 # Earth radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
