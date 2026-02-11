"""
Unit tests for the services in services.py.

Tests cover:
- Service initialization
- Business logic methods
- Error handling
- Mocked external API calls
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock, PropertyMock
import httpx
from datetime import date, timedelta
from services import ItineraryGeneratorService, ImageHunterService, TripStorageService
from models import Activity, Day, Itinerary


class TestItineraryGeneratorService:
    """Tests for the ItineraryGeneratorService."""

    @pytest.fixture
    def generator_service(self):
        """Fixture for ItineraryGeneratorService with test API key."""
        return ItineraryGeneratorService(api_key="test-gemini-key")

    @pytest.mark.asyncio
    async def test_generate_itinerary_success(self, generator_service):
        """Test successful itinerary generation."""
        # Mock the Gemini API response
        mock_response = MagicMock()
        mock_response.parsed = Itinerary(
            trip_title="Test Trip",
            destination="Paris",
            days=[
                Day(
                    day_number=1,
                    theme_title="Classic Paris",
                    activities=[
                        Activity(
                            name="Eiffel Tower",
                            description="Iconic landmark",
                            start_time="09:00",
                            duration_minutes=120,
                            location_name="Champ de Mars",
                            image_keyword="Eiffel Tower Paris"
                        )
                    ]
                )
            ]
        )
        
        with patch.object(generator_service.client.aio.models, 'generate_content', 
                         return_value=mock_response):
            result = await generator_service.generate_itinerary(
                destination="Paris",
                days=2,
                start_date=date(2023, 6, 1)
            )
            
            assert result.destination == "Paris"
            assert result.trip_title == "Test Trip"
            assert len(result.days) == 1
            assert result.days[0].activities[0].name == "Eiffel Tower"
            assert result.start_date == date(2023, 6, 1)
            assert result.end_date == date(2023, 6, 2)  # 2 days starting from 2023-06-01

    @pytest.mark.asyncio
    async def test_generate_itinerary_fallback_title(self, generator_service):
        """Test itinerary generation with fallback title when none provided."""
        # Mock the Gemini API response with empty title
        mock_response = MagicMock()
        mock_response.parsed = Itinerary(
            trip_title="",  # Empty title to trigger fallback
            destination="",
            days=[]
        )
        
        with patch.object(generator_service.client.aio.models, 'generate_content', 
                         return_value=mock_response):
            result = await generator_service.generate_itinerary(
                destination="Tokyo",
                days=3,
                start_date=date(2023, 7, 1)
            )
            
            assert result.trip_title == "3-Day Tokyo Adventure"  # Fallback title
            assert result.destination == "Tokyo"  # Should be set from input
            assert result.start_date == date(2023, 7, 1)
            assert result.end_date == date(2023, 7, 3)  # 3 days starting from 2023-07-01

    @pytest.mark.asyncio
    async def test_generate_itinerary_gemini_failure(self, generator_service):
        """Test handling of Gemini API failure."""
        with patch.object(generator_service.client.aio.models, 'generate_content',
                         side_effect=Exception("API Error")):
            with pytest.raises(Exception, match="API Error"):
                await generator_service.generate_itinerary(
                    destination="Paris",
                    days=2,
                    start_date=date(2023, 6, 1)
                )

    @pytest.mark.asyncio
    async def test_generate_itinerary_parse_failure(self, generator_service):
        """Test handling of Gemini parsing failure."""
        # Mock response with no parsed content
        mock_response = MagicMock()
        mock_response.parsed = None
        
        with patch.object(generator_service.client.aio.models, 'generate_content',
                         return_value=mock_response):
            with pytest.raises(ValueError, match="failed to parse structured output"):
                await generator_service.generate_itinerary(
                    destination="Paris",
                    days=2,
                    start_date=date(2023, 6, 1)
                )


class TestImageHunterService:
    """Tests for the ImageHunterService."""

    @pytest.fixture
    def image_service(self):
        """Fixture for ImageHunterService with test API key."""
        return ImageHunterService(api_key="test-pexels-key")

    @pytest.mark.asyncio
    async def test_fetch_image_success(self, image_service):
        """Test successful image fetching."""
        # Mock HTTP response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photos": [
                {
                    "src": {
                        "medium": "https://example.com/image.jpg"
                    }
                }
            ]
        }
        
        with patch('httpx.AsyncClient.get', return_value=mock_response):
            with patch('httpx.AsyncClient.__aenter__', return_value=AsyncMock()):
                with patch('httpx.AsyncClient.__aexit__', return_value=AsyncMock()):
                    result = await image_service.fetch_image("Eiffel Tower Paris")
                    
                    assert result == "https://example.com/image.jpg"

    @pytest.mark.asyncio
    async def test_fetch_image_no_results(self, image_service):
        """Test handling when no images are found."""
        # Mock response with no photos
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "photos": []
        }
        
        with patch('httpx.AsyncClient.get', return_value=mock_response):
            with patch('httpx.AsyncClient.__aenter__', return_value=AsyncMock()):
                with patch('httpx.AsyncClient.__aexit__', return_value=AsyncMock()):
                    result = await image_service.fetch_image("Nonexistent Place")
                    
                    # Should return fallback image
                    assert result == image_service.FALLBACK_IMAGE

    @pytest.mark.asyncio
    async def test_fetch_image_api_error(self, image_service):
        """Test handling of API errors."""
        # Mock HTTP error
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "API Error", request=MagicMock(), response=MagicMock()
        )
        mock_response.status_code = 401
        
        with patch('httpx.AsyncClient.get', return_value=mock_response):
            with patch('httpx.AsyncClient.__aenter__', return_value=AsyncMock()):
                with patch('httpx.AsyncClient.__aexit__', return_value=AsyncMock()):
                    result = await image_service.fetch_image("Eiffel Tower Paris")
                    
                    # Should return fallback image
                    assert result == image_service.FALLBACK_IMAGE

    @pytest.mark.asyncio
    async def test_fetch_image_general_error(self, image_service):
        """Test handling of general errors."""
        with patch('httpx.AsyncClient.get', side_effect=Exception("Network Error")):
            with patch('httpx.AsyncClient.__aenter__', return_value=AsyncMock()):
                with patch('httpx.AsyncClient.__aexit__', return_value=AsyncMock()):
                    result = await image_service.fetch_image("Eiffel Tower Paris")
                    
                    # Should return fallback image
                    assert result == image_service.FALLBACK_IMAGE

    @pytest.mark.asyncio
    async def test_fetch_images_batch_success(self, image_service):
        """Test successful batch image fetching."""
        # Mock individual image fetches
        async def mock_fetch_image(keyword):
            if keyword == "Eiffel Tower":
                return "https://example.com/eiffel.jpg"
            elif keyword == "Louvre Museum":
                return "https://example.com/louvre.jpg"
            else:
                return image_service.FALLBACK_IMAGE
        
        with patch.object(image_service, 'fetch_image', side_effect=mock_fetch_image):
            result = await image_service.fetch_images_batch([
                "Eiffel Tower", 
                "Louvre Museum", 
                "Invalid Keyword"
            ])
            
            assert len(result) == 3
            assert result["Eiffel Tower"] == "https://example.com/eiffel.jpg"
            assert result["Louvre Museum"] == "https://example.com/louvre.jpg"
            assert result["Invalid Keyword"] == image_service.FALLBACK_IMAGE

    @pytest.mark.asyncio
    async def test_close_client(self):
        """Test closing the HTTP client."""
        image_service = ImageHunterService(api_key="test-key")
        mock_client = AsyncMock()
        # Manually set the _client attribute to simulate it being initialized
        image_service._client = mock_client
        # Set the is_closed property to False so the condition in close() is met
        type(mock_client).is_closed = PropertyMock(return_value=False)

        await image_service.close()

        # Check that aclose was called on the client if it existed and wasn't closed
        mock_client.aclose.assert_called_once()


class TestTripStorageService:
    """Tests for the TripStorageService."""

    @pytest.fixture
    def storage_service(self):
        """Fixture for TripStorageService."""
        return TripStorageService()

    @pytest.mark.asyncio
    async def test_save_and_get_trip(self, storage_service):
        """Test saving and retrieving a trip."""
        itinerary = Itinerary(
            id="test-trip-123",
            trip_title="Test Trip",
            destination="Paris",
            days=[]
        )
        
        # Save the trip
        saved_id = await storage_service.save(itinerary)
        
        # Verify the ID matches
        assert saved_id == "test-trip-123"
        
        # Retrieve the trip
        retrieved_trip = await storage_service.get("test-trip-123")
        
        # Verify the trip was retrieved correctly
        assert retrieved_trip is not None
        assert retrieved_trip.id == "test-trip-123"
        assert retrieved_trip.trip_title == "Test Trip"
        assert retrieved_trip.destination == "Paris"

    @pytest.mark.asyncio
    async def test_get_nonexistent_trip(self, storage_service):
        """Test retrieving a non-existent trip."""
        result = await storage_service.get("nonexistent-id")
        
        assert result is None

    @pytest.mark.asyncio
    async def test_list_all_trips(self, storage_service):
        """Test listing all trips."""
        # Create and save multiple trips
        trip1 = Itinerary(id="trip-1", trip_title="Trip 1", destination="Paris", days=[])
        trip2 = Itinerary(id="trip-2", trip_title="Trip 2", destination="Tokyo", days=[])
        
        await storage_service.save(trip1)
        await storage_service.save(trip2)
        
        # List all trips
        trips = await storage_service.list_all()
        
        # Verify both trips are returned
        assert len(trips) == 2
        trip_ids = {trip.id for trip in trips}
        assert "trip-1" in trip_ids
        assert "trip-2" in trip_ids

    @pytest.mark.asyncio
    async def test_list_all_empty(self, storage_service):
        """Test listing trips when none exist."""
        trips = await storage_service.list_all()
        
        assert len(trips) == 0
        assert trips == []

    @pytest.mark.asyncio
    async def test_delete_trip_success(self, storage_service):
        """Test deleting an existing trip."""
        # Save a trip first
        itinerary = Itinerary(
            id="delete-test",
            trip_title="Delete Test",
            destination="Paris",
            days=[]
        )
        await storage_service.save(itinerary)
        
        # Verify it exists
        assert await storage_service.get("delete-test") is not None
        
        # Delete the trip
        result = await storage_service.delete("delete-test")
        
        # Verify deletion was successful
        assert result is True
        assert await storage_service.get("delete-test") is None

    @pytest.mark.asyncio
    async def test_delete_nonexistent_trip(self, storage_service):
        """Test deleting a non-existent trip."""
        result = await storage_service.delete("nonexistent-id")
        
        # Should return False since trip doesn't exist
        assert result is False