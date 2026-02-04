"""
Integration test to verify real API connections (Gemini + Pexels).
Requires valid API keys in .env.
"""

import asyncio
from dotenv import load_dotenv
import os
from services import ItineraryGeneratorService, ImageHunterService
from models import Itinerary

async def main():
    # Load keys
    load_dotenv()
    gemini_key = os.getenv("GEMINI_API_KEY")
    pexels_key = os.getenv("PEXELS_API_KEY")

    if not gemini_key or "your_" in gemini_key:
        print("❌ Error: GEMINI_API_KEY not set in .env")
        return
    if not pexels_key or "your_" in pexels_key:
        print("❌ Error: PEXELS_API_KEY not set in .env")
        return

    print("🚀 Starting Integration Tests (Real API Calls)...")

    # 1. Test Gemini
    print("\n--- Testing Gemini Generation ---")
    gen_service = ItineraryGeneratorService(api_key=gemini_key)
    try:
        itinerary = await gen_service.generate_itinerary(destination="Kyoto", days=2)
        print(f"✅ Gemini Success! Trip Title: {itinerary.trip_title}")
        print(f"   Days: {len(itinerary.days)}")
        print(f"   First Activity: {itinerary.days[0].activities[0].name}")
    except Exception as e:
        print(f"❌ Gemini Failed: {e}")

    # 2. Test Pexels
    print("\n--- Testing Pexels Image Fetch ---")
    img_service = ImageHunterService(api_key=pexels_key)
    try:
        keywords = ["Fushimi Inari Kyoto", "Gion District"]
        results = await img_service.fetch_images_batch(keywords)
        for kw, url in results.items():
            if "pexels.com" in url and "386009" not in url: # Check if not the fallback
                print(f"✅ Pexels Success! {kw}: {url[:60]}...")
            else:
                print(f"⚠️ Pexels Fallback used for {kw}")
    except Exception as e:
        print(f"❌ Pexels Failed: {e}")
    finally:
        await img_service.close()

if __name__ == "__main__":
    asyncio.run(main())
