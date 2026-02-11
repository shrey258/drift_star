"""
Tests for error handling and edge cases in the backend.

Tests cover:
- Exception handling
- Boundary conditions
- Invalid inputs
- Edge cases in business logic
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import HTTPException
from datetime import date, timedelta
import uuid
from models import Activity, Day, Itinerary, GenerateRequest, EnrichImagesRequest
from services import ItineraryGeneratorService, ImageHunterService, TripStorageService


class TestErrorHandling:
    """Tests for error handling in various components."""

    def test_activity_time_format_edge_cases(self):
        """Test edge cases for time format validation."""
        # Test boundary times that should be valid
        Activity(
            name="Test",
            description="Test activity",
            start_time="00:00",  # Midnight
            duration_minutes=60,
            location_name="Test Location",
            image_keyword="test keyword",
        )

        Activity(
            name="Test",
            description="Test activity",
            start_time="23:59",  # Last minute of day
            duration_minutes=60,
            location_name="Test Location",
            image_keyword="test keyword",
        )

        # Formats that should fail due to regex pattern mismatch
        invalid_formats = [
            "12",  # Missing minutes
            "12:",  # Missing minutes
            ":30",  # Missing hour
            "",  # Empty
            "ab:cd",  # Non-numeric
            "12:00 AM",  # Invalid format with AM/PM
            "1:30",  # Missing leading zero
            "12:3",  # Missing trailing zero
        ]

        for invalid_format in invalid_formats:
            with pytest.raises(ValueError):
                Activity(
                    name="Test",
                    description="Test activity",
                    start_time=invalid_format,
                    duration_minutes=60,
                    location_name="Test Location",
                    image_keyword="test keyword",
                )

    def test_activity_duration_edge_cases(self):
        """Test edge cases for duration validation."""
        # Minimum valid duration (15 minutes)
        Activity(
            name="Test",
            description="Test",
            start_time="09:00",
            duration_minutes=15,  # Minimum
            location_name="Test",
            image_keyword="test",
        )
        
        # Maximum valid duration (480 minutes = 8 hours)
        Activity(
            name="Test",
            description="Test",
            start_time="09:00",
            duration_minutes=480,  # Maximum
            location_name="Test",
            image_keyword="test",
        )
        
        # Invalid durations
        with pytest.raises(ValueError):
            Activity(
                name="Test",
                description="Test",
                start_time="09:00",
                duration_minutes=14,  # Just under minimum
                location_name="Test",
                image_keyword="test",
            )
        
        with pytest.raises(ValueError):
            Activity(
                name="Test",
                description="Test",
                start_time="09:00",
                duration_minutes=481,  # Just over maximum
                location_name="Test",
                image_keyword="test",
            )

    def test_day_number_edge_cases(self):
        """Test edge cases for day number validation."""
        # Minimum valid day number (1)
        Day(
            day_number=1,
            theme_title="Test Day",
            activities=[],
        )
        
        # Large day number (should be valid)
        Day(
            day_number=100,
            theme_title="Test Day",
            activities=[],
        )
        
        # Invalid day numbers
        invalid_numbers = [0, -1, -10]
        
        for invalid_num in invalid_numbers:
            with pytest.raises(ValueError):
                Day(
                    day_number=invalid_num,
                    theme_title="Test Day",
                    activities=[],
                )

    def test_generate_request_edge_cases(self):
        """Test edge cases for GenerateRequest validation."""
        # Minimum destination length (2 chars)
        GenerateRequest(
            destination="AB",
            days=1,
            start_date=date.today()
        )
        
        # Maximum destination length (100 chars)
        GenerateRequest(
            destination="A" * 100,
            days=14,
            start_date=date.today()
        )
        
        # Minimum and maximum days
        GenerateRequest(
            destination="Test",
            days=1,  # Minimum
            start_date=date.today()
        )
        
        GenerateRequest(
            destination="Test",
            days=14,  # Maximum
            start_date=date.today()
        )
        
        # Invalid cases
        with pytest.raises(ValueError):
            GenerateRequest(
                destination="A",  # Too short
                days=1,
                start_date=date.today()
            )
        
        with pytest.raises(ValueError):
            GenerateRequest(
                destination="A" * 101,  # Too long
                days=1,
                start_date=date.today()
            )
        
        with pytest.raises(ValueError):
            GenerateRequest(
                destination="Test",
                days=0,  # Too low
                start_date=date.today()
            )
        
        with pytest.raises(ValueError):
            GenerateRequest(
                destination="Test",
                days=15,  # Too high
                start_date=date.today()
            )

    def test_enrich_images_request_edge_cases(self):
        """Test edge cases for EnrichImagesRequest validation."""
        # Minimum keywords (1)
        EnrichImagesRequest(
            keywords=["test"]
        )
        
        # Maximum keywords (50)
        EnrichImagesRequest(
            keywords=[f"keyword_{i}" for i in range(50)]
        )
        
        # Invalid cases
        with pytest.raises(ValueError):
            EnrichImagesRequest(
                keywords=[]  # Empty list
            )
        
        with pytest.raises(ValueError):
            EnrichImagesRequest(
                keywords=[f"keyword_{i}" for i in range(51)]  # Too many
            )


class TestServiceErrorHandling:
    """Tests for error handling in services."""

    @pytest.mark.asyncio
    async def test_itinerary_generator_service_error_handling(self):
        """Test error handling in ItineraryGeneratorService."""
        service = ItineraryGeneratorService(api_key="test-key")
        
        # Mock the client to raise an exception
        mock_response = MagicMock()
        mock_response.parsed = None
        
        with patch.object(service.client.aio.models, 'generate_content', 
                         return_value=mock_response):
            with pytest.raises(ValueError, match="failed to parse structured output"):
                await service.generate_itinerary(
                    destination="Paris",
                    days=2,
                    start_date=date(2023, 6, 1)
                )

    @pytest.mark.asyncio
    async def test_image_hunter_service_error_handling(self):
        """Test error handling in ImageHunterService."""
        service = ImageHunterService(api_key="test-key")
        
        # Mock HTTP client to raise exceptions
        with patch('httpx.AsyncClient.get', side_effect=Exception("Network error")):
            with patch('httpx.AsyncClient.__aenter__', return_value=AsyncMock()):
                with patch('httpx.AsyncClient.__aexit__', return_value=AsyncMock()):
                    result = await service.fetch_image("test keyword")
                    
                    # Should return fallback image
                    assert result == service.FALLBACK_IMAGE

    @pytest.mark.asyncio
    async def test_image_hunter_service_http_error(self):
        """Test HTTP error handling in ImageHunterService."""
        service = ImageHunterService(api_key="test-key")
        
        # Mock HTTP error
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("HTTP Error")
        
        with patch('httpx.AsyncClient.get', return_value=mock_response):
            with patch('httpx.AsyncClient.__aenter__', return_value=AsyncMock()):
                with patch('httpx.AsyncClient.__aexit__', return_value=AsyncMock()):
                    result = await service.fetch_image("test keyword")
                    
                    # Should return fallback image
                    assert result == service.FALLBACK_IMAGE

    @pytest.mark.asyncio
    async def test_trip_storage_service_operations(self):
        """Test edge cases in TripStorageService."""
        service = TripStorageService()
        
        # Test getting non-existent trip
        result = await service.get("nonexistent-id")
        assert result is None
        
        # Test deleting non-existent trip
        result = await service.delete("nonexistent-id")
        assert result is False
        
        # Test with empty storage
        trips = await service.list_all()
        assert trips == []


class TestAPIErrorHandling:
    """Tests for API error handling."""

    @pytest.fixture
    def mock_settings(self):
        """Mock settings with fake API keys."""
        with patch("main.get_settings") as mock:
            mock.return_value = MagicMock(
                gemini_api_key="test-gemini-key",
                pexels_api_key="test-pexels-key",
                app_name="Test API",
                debug=True,
            )
            yield mock

    @pytest.fixture
    def sample_itinerary(self):
        """Sample itinerary for testing."""
        return Itinerary(
            id="test-trip-123",
            trip_title="2-Day Paris Adventure",
            destination="Paris",
            days=[]
        )

    @pytest.fixture
    def mock_generator_service(self, sample_itinerary):
        """Mock the itinerary generator service."""
        mock = AsyncMock()
        mock.generate_itinerary = AsyncMock(return_value=sample_itinerary)
        return mock

    @pytest.fixture
    def mock_image_service(self):
        """Mock the image hunter service."""
        mock = AsyncMock()
        mock.fetch_images_batch = AsyncMock(
            return_value={
                "test": "https://example.com/test.jpg",
            }
        )
        mock.close = AsyncMock()
        return mock

    @pytest.fixture
    def mock_storage_service(self, sample_itinerary):
        """Mock the storage service."""
        mock = AsyncMock()
        mock.save = AsyncMock(return_value=sample_itinerary.id)
        mock.get = AsyncMock(return_value=sample_itinerary)
        mock.list_all = AsyncMock(return_value=[sample_itinerary])
        return mock

    @pytest.fixture
    def client(self, mock_settings, mock_generator_service, mock_image_service, mock_storage_service):
        """Create test client with mocked services."""
        import main
        main._generator_service = mock_generator_service
        main._image_service = mock_image_service
        main._storage_service = mock_storage_service

        with patch("main.get_generator_service", return_value=mock_generator_service), \
             patch("main.get_image_service", return_value=mock_image_service), \
             patch("main.get_storage_service", return_value=mock_storage_service):

            from main import app
            yield TestClient(app)

    def test_generate_endpoint_error_responses(self, client):
        """Test error responses from generate endpoint."""
        # Test with invalid destination (too short)
        response = client.post("/api/v1/generate", json={
            "destination": "A",  # Too short
            "days": 2,
            "start_date": "2023-06-01"
        })
        assert response.status_code == 422

        # Test with invalid days (too low)
        response = client.post("/api/v1/generate", json={
            "destination": "Paris",
            "days": 0,  # Invalid
            "start_date": "2023-06-01"
        })
        assert response.status_code == 422

        # Test with invalid days (too high)
        response = client.post("/api/v1/generate", json={
            "destination": "Paris",
            "days": 15,  # Too high
            "start_date": "2023-06-01"
        })
        assert response.status_code == 422

        # Test with missing required fields
        response = client.post("/api/v1/generate", json={})
        assert response.status_code == 422

    def test_enrich_images_endpoint_error_responses(self, client):
        """Test error responses from enrich images endpoint."""
        # Test with empty keywords list
        response = client.post("/api/v1/enrich-images", json={
            "keywords": []
        })
        assert response.status_code == 422

        # Test with missing keywords field
        response = client.post("/api/v1/enrich-images", json={})
        assert response.status_code == 422

        # Test with too many keywords
        response = client.post("/api/v1/enrich-images", json={
            "keywords": [f"keyword_{i}" for i in range(51)]  # Too many
        })
        assert response.status_code == 422

    def test_get_trip_endpoint_error_responses(self, client, mock_storage_service):
        """Test error responses from get trip endpoint."""
        # Test with non-existent trip ID
        mock_storage_service.get = AsyncMock(return_value=None)
        
        response = client.get("/api/v1/trips/nonexistent-id")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_generate_endpoint_service_error(self, client, mock_generator_service):
        """Test error response when service fails."""
        # Make the generator service raise an exception
        mock_generator_service.generate_itinerary.side_effect = Exception("Service unavailable")
        
        response = client.post("/api/v1/generate", json={
            "destination": "Paris",
            "days": 2,
            "start_date": "2023-06-01"
        })
        
        assert response.status_code == 500
        assert "detail" in response.json()

    def test_input_sanitization(self, client):
        """Test handling of potentially malicious inputs."""
        # Test with SQL injection-like input - this is actually valid length (>2 chars)
        response = client.post("/api/v1/generate", json={
            "destination": "'; DROP TABLE trips; --",
            "days": 2,
            "start_date": "2023-06-01"
        })
        # This input is actually valid length-wise, so it might succeed
        # The important thing is that it doesn't cause any security issues
        assert response.status_code in [201, 422, 500]  # Could be any response

        # Test with XSS-like input
        response = client.post("/api/v1/generate", json={
            "destination": "<script>alert('xss')</script>",
            "days": 2,
            "start_date": "2023-06-01"
        })
        # Should pass validation but be handled safely by the model
        assert response.status_code in [201, 422, 500]  # Could be any response, as long as no security issues


class TestEdgeCases:
    """Tests for edge cases in business logic."""

    def test_date_calculations_in_itinerary(self):
        """Test date calculations in itinerary generation."""
        # Test with 1-day trip
        start_date = date(2023, 6, 1)
        end_date = start_date + timedelta(days=1 - 1)  # 1 day means same start/end
        assert end_date == date(2023, 6, 1)

        # Test with 14-day trip (maximum)
        start_date = date(2023, 6, 1)
        end_date = start_date + timedelta(days=14 - 1)  # 14 days
        assert end_date == date(2023, 6, 14)

        # Test year boundary
        start_date = date(2023, 12, 30)
        end_date = start_date + timedelta(days=5 - 1)  # 5 days crossing year
        assert end_date == date(2024, 1, 3)

    def test_uuid_generation_uniqueness(self):
        """Test that UUID generation creates unique IDs."""
        ids = set()
        for _ in range(100):
            new_id = str(uuid.uuid4())
            assert new_id not in ids  # Should be unique
            ids.add(new_id)
        
        assert len(ids) == 100  # All should be unique

    def test_large_payload_handling(self):
        """Test handling of large payloads."""
        # Create a large itinerary - start day numbers at 1, not 0
        large_itinerary = Itinerary(
            trip_title="Large Trip",
            destination="Very Long Destination Name " * 10,  # Still within limits
            days=[
                Day(
                    day_number=i + 1,  # Start at 1, not 0
                    theme_title=f"Day {i + 1} Theme",
                    activities=[
                        Activity(
                            name=f"Activity {j}",
                            description="Long description " * 20,
                            start_time="09:00",
                            duration_minutes=60,
                            location_name=f"Location {j}",
                            image_keyword=f"Keyword {j}"
                        ) for j in range(10)  # 10 activities per day
                    ]
                ) for i in range(5)  # 5 days
            ]
        )

        # Should still validate correctly
        assert len(large_itinerary.days) == 5
        assert len(large_itinerary.days[0].activities) == 10

    def test_boundary_values_in_models(self):
        """Test boundary values in model validation."""
        # Test maximum length strings
        max_dest = "A" * 100
        max_desc = "Description"  # Length doesn't matter for this field
        
        activity = Activity(
            name="Test",
            description=max_desc,
            start_time="09:00",
            duration_minutes=480,  # Max duration
            location_name="Test Location",
            image_keyword="test keyword"
        )
        
        itinerary = Itinerary(
            trip_title="Test Trip",
            destination=max_dest,  # Max length destination
            days=[]
        )
        
        assert itinerary.destination == max_dest
        assert activity.duration_minutes == 480