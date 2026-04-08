import httpx

AGMARKNET_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"


async def fetch_mandi_prices(
    state: str, district: str, commodity: str
) -> list[dict]:
    """Fetch live mandi prices from data.gov.in Agmarknet API."""
    params = {
        "api-key": "579b464db66ec23bdd000001cdd3946e44ce4aae38d4b36c33a9b00",
        "format": "json",
        "limit": "10",
        "filters[State]": state,
        "filters[District]": district,
        "filters[Commodity]": commodity,
    }

    try:
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.get(AGMARKNET_URL, params=params, timeout=4.0)
            resp.raise_for_status()
            data = resp.json()

        records = data.get("records", [])
        if not records:
             raise Exception("Empty response from Agmarknet")
             
        return [
            {
                "crop": r.get("Commodity"),
                "market": r.get("Market"),
                "min_price": r.get("Min Price"),
                "max_price": r.get("Max Price"),
                "modal_price": r.get("Modal Price"),
                "date": r.get("Arrival Date"),
            }
            for r in records
        ]
    except Exception as e:
        print(f"Agmarknet fetch error: {e}")
        raise e
