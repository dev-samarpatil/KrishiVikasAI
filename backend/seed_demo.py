import asyncio
import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Provide fallback to find env based on script location
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from services.supabase_service import get_supabase

async def seed_data():
    client = get_supabase()
    if not client:
        print("❌ Supabase client not initialized")
        return

    print("🌱 Seeding Demo Outbreak Data for Sentinel Map...")
    
    # Base Nashik coordinates
    base_lat = 19.99
    base_long = 73.79
    disease = "Fall Armyworm"
    
    # Check if we already have recent records
    forty_eight_hours_ago = (datetime.utcnow() - timedelta(hours=48)).isoformat()
    resp = client.table("diagnoses").select("*").eq("disease_name", disease).gte("created_at", forty_eight_hours_ago).execute()
    
    if len(resp.data or []) >= 6:
        print(f"✅ Already have {len(resp.data)} recent records for {disease}. Skipping seed.")
        return

    # Generate 6 records around Nashik within a ~5km radius
    # 0.01 degree is ~1.1km
    records = []
    farmer_ids = [f"demo_farmer_{i}" for i in range(1, 7)]
    
    for i, farmer_id in enumerate(farmer_ids):
        lat_offset = random.uniform(-0.02, 0.02)
        long_offset = random.uniform(-0.02, 0.02)
        hour_offset = random.randint(1, 40)
        
        timestamp = (datetime.utcnow() - timedelta(hours=hour_offset)).isoformat()
        
        records.append({
            "farmer_id": farmer_id,
            "disease_name": disease,
            "confidence": 0.95,
            "lat": base_lat + lat_offset,
            "long": base_long + long_offset,
            "district": "Nashik",
            "crop_type": "Maize",
            "treatment_chosen": "organic",
            "created_at": timestamp
        })

    # Insert into Supabase
    try:
        res = client.table("diagnoses").insert(records).execute()
        print(f"✅ Successfully seeded {len(res.data)} records for {disease} near Nashik.")
    except Exception as e:
        print(f"❌ Failed to seed data: {e}")

if __name__ == "__main__":
    asyncio.run(seed_data())
