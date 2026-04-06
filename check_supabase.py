from backend.services.supabase_service import get_supabase
import asyncio

async def main():
    client = get_supabase()
    if not client:
        print("No supabase client")
        return
    resp = client.table("diagnoses").select("*").eq("disease_name", "Fall Armyworm").execute()
    print("Fall Armyworm records:", len(resp.data))
    for r in resp.data:
        print(f"- {r['district']}, {r['crop_type']} ({r['confidence']})")

if __name__ == "__main__":
    asyncio.run(main())
