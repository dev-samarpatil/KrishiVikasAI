import math


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two GPS points in km."""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(
        math.radians(lat2)
    ) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def get_nearest_kvks(
    farmer_lat: float, farmer_long: float, kvk_data: list[dict], top_n: int = 3
) -> list[dict]:
    """Find the N closest KVKs to a farmer's GPS position."""
    with_distance = []
    for kvk in kvk_data:
        coords = kvk.get("coordinates", {})
        lat = coords.get("lat", 0)
        lng = coords.get("lng", 0)
        dist = haversine_km(farmer_lat, farmer_long, lat, lng)
        with_distance.append({**kvk, "distance_km": round(dist, 1)})

    return sorted(with_distance, key=lambda x: x["distance_km"])[:top_n]
