"""
Service layer for the Travel Itinerary API.

Contains:
- ItineraryGeneratorService: Gemini AI integration for itinerary generation
- ImageHunterService: Pexels API integration for image sourcing
- TripStorageService: In-memory trip persistence
"""

import logging
from typing import Optional

from google import genai
from google.genai import types
import httpx
from datetime import date, timedelta

from models import Activity, Day, Itinerary

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)


# ============================================================================
# Itinerary Generator Service (Gemini)
# ============================================================================

class ItineraryGeneratorService:
    """Generates travel itineraries using Google Gemini API (new SDK)."""

    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.0-flash"

    async def generate_itinerary(self, destination: str, days: int, start_date: date) -> Itinerary:
        """
        Generate a structured travel itinerary.
        """
        end_date = start_date + timedelta(days=days - 1)
        logger.info(f"Calling Gemini ({self.model_id}) for {destination} from {start_date} to {end_date}...")
        
        system_prompt = f"""You are an expert local guide. Create a logical, walkable itinerary 
for {days} days in {destination}, starting on {start_date.strftime('%B %d, %Y')} ({start_date.strftime('%A')}).

Date Context:
- Trip dates: {start_date.strftime('%B %d')} to {end_date.strftime('%B %d, %Y')}
- Season: Consider weather, local events, festivals, and seasonal attractions
- Day of week: Plan activities appropriate for weekdays vs weekends

Requirements:
- Group activities by proximity to minimize travel time
- Include realistic timings (start_time in HH:MM format, 24-hour)
- Each day should have 4-6 activities
- Start each day around 09:00 and end by 21:00
- Include a mix of major attractions, local gems, and dining experiences
- image_keyword should be specific and searchable (e.g., "Eiffel Tower Paris sunset")
- duration_minutes should be realistic (typically 30-180 minutes)
- Suggest any seasonal events or festivals happening during these dates
"""

        user_prompt = f"Create a {days}-day travel itinerary for {destination} starting {start_date.strftime('%B %d, %Y')}."

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_id,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    response_schema=Itinerary,
                ),
            )

            if not response.parsed:
                logger.error("Gemini failed to parse structured output. Raw response might be invalid.")
                raise ValueError("Gemini failed to parse structured output")

            itinerary = response.parsed
            logger.info(f"Successfully generated itinerary: {itinerary.trip_title}")
            
            if not itinerary.trip_title:
                itinerary.trip_title = f"{days}-Day {destination} Adventure"
            itinerary.destination = destination
            itinerary.start_date = start_date
            itinerary.end_date = end_date

            return itinerary

        except Exception as e:
            logger.error(f"Gemini generation error: {type(e).__name__} - {str(e)}")
            raise e



# ============================================================================
# Image Hunter Service (Pexels)
# ============================================================================

class ImageHunterService:
    """Fetches high-quality images from Pexels API."""

    PEXELS_API_URL = "https://api.pexels.com/v1/search"
    FALLBACK_IMAGE = "https://images.pexels.com/photos/386009/pexels-photo-386009.jpeg?auto=compress&cs=tinysrgb&w=600"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Lazily initialize async HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                headers={"Authorization": self.api_key},
                timeout=10.0,
            )
        return self._client

    async def fetch_image(self, keyword: str) -> str:
        """
        Fetch a high-quality vertical image for the given keyword.

        Args:
            keyword: Search term (e.g., "Eiffel Tower Paris")

        Returns:
            str: Image URL or fallback placeholder
        """
        try:
            client = await self._get_client()
            response = await client.get(
                self.PEXELS_API_URL,
                params={
                    "query": keyword,
                    "per_page": 1,
                    "orientation": "portrait",
                },
            )
            response.raise_for_status()

            data = response.json()
            photos = data.get("photos", [])

            if photos:
                # Return medium-sized image for mobile
                return photos[0].get("src", {}).get("medium", self.FALLBACK_IMAGE)

            logger.warning(f"No images found for keyword: {keyword}")
            return self.FALLBACK_IMAGE

        except httpx.HTTPStatusError as e:
            logger.error(f"Pexels API error for '{keyword}': {e.response.status_code}")
            return self.FALLBACK_IMAGE
        except Exception as e:
            logger.error(f"Failed to fetch image for '{keyword}': {e}")
            return self.FALLBACK_IMAGE

    async def fetch_images_batch(self, keywords: list[str]) -> dict[str, str]:
        """
        Fetch images for multiple keywords concurrently.

        Args:
            keywords: List of search terms

        Returns:
            dict: Map of keyword → image URL
        """
        import asyncio

        tasks = [self.fetch_image(kw) for kw in keywords]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        return {
            kw: (url if isinstance(url, str) else self.FALLBACK_IMAGE)
            for kw, url in zip(keywords, results)
        }

    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()


# ============================================================================
# Trip Storage Service (In-Memory)
# ============================================================================

class TripStorageService:
    """In-memory storage for trips (mock database)."""

    def __init__(self):
        self._storage: dict[str, Itinerary] = {}

    async def save(self, itinerary: Itinerary) -> str:
        """
        Save an itinerary and return its ID.

        Args:
            itinerary: The itinerary to save

        Returns:
            str: The trip ID
        """
        self._storage[itinerary.id] = itinerary
        logger.info(f"Saved trip: {itinerary.id}")
        return itinerary.id

    async def get(self, trip_id: str) -> Optional[Itinerary]:
        """
        Retrieve an itinerary by ID.

        Args:
            trip_id: The trip's unique identifier

        Returns:
            Itinerary or None if not found
        """
        return self._storage.get(trip_id)

    async def list_all(self) -> list[Itinerary]:
        """Return all saved itineraries."""
        return list(self._storage.values())

    async def delete(self, trip_id: str) -> bool:
        """
        Delete an itinerary by ID.

        Args:
            trip_id: The trip's unique identifier

        Returns:
            bool: True if deleted, False if not found
        """
        if trip_id in self._storage:
            del self._storage[trip_id]
            return True
        return False
