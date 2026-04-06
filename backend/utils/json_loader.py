import json
import os
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")


def get_soil_type(district: str, soil_data: list[dict]) -> str:
    """Look up soil type for a given district from the soil_mapping.json data."""
    for state_entry in soil_data:
        for d in state_entry.get("districts", []):
            if d["name"].lower() == district.lower():
                return d.get("soil", "Mixed")
    # Fallback
    return "Mixed"


def get_crop_stage(crop: str, state: str, calendar_data: list[dict]) -> dict:
    """Derive crop stage from crop_calendar.json based on current month."""
    current_month = datetime.now().month
    crop_lower = crop.lower()

    for region in calendar_data:
        for crop_entry in region.get("crops", []):
            if crop_entry["name"].lower() == crop_lower:
                # Check if state matches
                states = crop_entry.get("states", [])
                # Simple check: if any state abbreviation or full name matches
                state_match = any(
                    s.lower() in state.lower() or state.lower() in s.lower()
                    for s in states
                )
                if state_match or not states:
                    return {
                        "season": crop_entry.get("season", "unknown"),
                        "stage": "growing",  # Simplified; full logic would parse months
                        "sowing": crop_entry.get("sowing", ""),
                        "harvesting": crop_entry.get("harvesting", ""),
                    }

    return {"season": "unknown", "stage": "growing"}
