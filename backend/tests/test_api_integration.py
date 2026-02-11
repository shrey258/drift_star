"""
Integration tests for the API endpoints in main.py.

Tests cover:
- Full API request/response cycles
- Dependency injection
- Error handling
- Cross-service interactions
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from datetime import date
from models import Activity, Day, Itinerary


class TestAPIIntegration:
    """Integration tests for the API endpoints."""

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
            start_date=date(2023, 6, 1),
            end_date=date(2023, 6, 2),
            days=[
                Day(
                    day_number=1,
                    theme_title="Classic Paris",
                    activities=[
                        Activity(
                            id="act-1",
                            name="Eiffel Tower",
                            description="Visit the iconic landmark",
                            start_time="09:00",
                            duration_minutes=120,
                            location_name="Champ de Mars",
                            image_keyword="Eiffel Tower Paris",
                        ),
                        Activity(
                            id="act-2",
                            name="Louvre Museum",
                            description="Explore world-famous art",
                            start_time="12:00",
                            duration_minutes=180,
                            location_name="Rue de Rivoli",
                            image_keyword="Louvre Museum Paris",
                        ),
                    ],
                ),
            ],
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
                "Eiffel Tower Paris": "https://example.com/eiffel.jpg",
                "Louvre Museum Paris": "https://example.com/louvre.jpg",
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
        mock.delete = AsyncMock(return_value=True)
        return mock

    @pytest.fixture
    def client(self, mock_settings, mock_generator_service, mock_image_service, mock_storage_service):
        """Create test client with mocked services."""
        # Clear any existing global service instances
        import main
        main._generator_service = mock_generator_service
        main._image_service = mock_image_service
        main._storage_service = mock_storage_service

        with patch("main.get_generator_service", return_value=mock_generator_service), \
             patch("main.get_image_service", return_value=mock_image_service), \
             patch("main.get_storage_service", return_value=mock_storage_service):

            from main import app
            yield TestClient(app)

    def test_health_check_endpoint(self, client):
        """Test the health check endpoint."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data

    def test_generate_itinerary_success(self, client, mock_generator_service, mock_storage_service):
        """Test successful itinerary generation."""
        request_data = {
            "destination": "Paris",
            "days": 2,
            "start_date": "2023-06-01"
        }
        
        response = client.post("/api/v1/generate", json=request_data)
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify response structure
        assert data["id"] == "test-trip-123"
        assert data["destination"] == "Paris"
        assert data["trip_title"] == "2-Day Paris Adventure"
        assert len(data["days"]) == 1
        assert data["days"][0]["theme_title"] == "Classic Paris"
        assert len(data["days"][0]["activities"]) == 2
        
        # Verify service methods were called
        mock_generator_service.generate_itinerary.assert_called_once()
        mock_storage_service.save.assert_called_once()

    def test_generate_itinerary_validation_error(self, client):
        """Test itinerary generation with invalid input."""
        request_data = {
            "destination": "P",  # Too short
            "days": 0,  # Invalid
            "start_date": "2023-06-01"
        }
        
        response = client.post("/api/v1/generate", json=request_data)
        
        assert response.status_code == 422  # Validation error

    def test_generate_itinerary_generation_error(self, client, mock_generator_service):
        """Test itinerary generation when service fails."""
        # Make the generator service raise an exception
        mock_generator_service.generate_itinerary.side_effect = Exception("Generation failed")
        
        request_data = {
            "destination": "Paris",
            "days": 2,
            "start_date": "2023-06-01"
        }
        
        response = client.post("/api/v1/generate", json=request_data)
        
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data

    def test_enrich_images_success(self, client, mock_image_service):
        """Test successful image enrichment."""
        request_data = {
            "keywords": ["Eiffel Tower Paris", "Louvre Museum Paris"]
        }
        
        response = client.post("/api/v1/enrich-images", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "images" in data
        assert data["images"]["Eiffel Tower Paris"] == "https://example.com/eiffel.jpg"
        assert data["images"]["Louvre Museum Paris"] == "https://example.com/louvre.jpg"
        
        # Verify service method was called
        mock_image_service.fetch_images_batch.assert_called_once_with(
            ["Eiffel Tower Paris", "Louvre Museum Paris"]
        )

    def test_enrich_images_validation_error(self, client):
        """Test image enrichment with invalid input."""
        request_data = {
            "keywords": []  # Empty list
        }
        
        response = client.post("/api/v1/enrich-images", json=request_data)
        
        assert response.status_code == 422  # Validation error

    def test_get_trip_success(self, client, mock_storage_service, sample_itinerary):
        """Test successful retrieval of a trip."""
        response = client.get("/api/v1/trips/test-trip-123")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == "test-trip-123"
        assert data["destination"] == "Paris"
        assert data["trip_title"] == "2-Day Paris Adventure"
        
        # Verify service method was called
        mock_storage_service.get.assert_called_once_with("test-trip-123")

    def test_get_trip_not_found(self, client, mock_storage_service):
        """Test retrieval of a non-existent trip."""
        # Make storage service return None
        mock_storage_service.get = AsyncMock(return_value=None)
        
        response = client.get("/api/v1/trips/nonexistent-id")
        
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    def test_list_trips_success(self, client, mock_storage_service, sample_itinerary):
        """Test successful listing of all trips."""
        response = client.get("/api/v1/trips")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == "test-trip-123"
        
        # Verify service method was called
        mock_storage_service.list_all.assert_called_once()

    def test_list_trips_empty(self, client, mock_storage_service):
        """Test listing trips when none exist."""
        # Make storage service return empty list
        mock_storage_service.list_all = AsyncMock(return_value=[])
        
        response = client.get("/api/v1/trips")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data == []

    def test_cors_middleware_enabled(self, client):
        """Test that CORS middleware is properly configured."""
        # Make a request with origin header
        response = client.get("/health", headers={"Origin": "http://localhost:3000"})
        
        # Check that CORS headers are present
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "*"

    def test_api_endpoints_return_correct_content_types(self, client):
        """Test that API endpoints return JSON content type."""
        response = client.get("/health")
        assert response.headers["content-type"].startswith("application/json")

        response = client.get("/api/v1/trips/test-trip-123")
        assert response.headers["content-type"].startswith("application/json")

        response = client.get("/api/v1/trips")
        assert response.headers["content-type"].startswith("application/json")

    def test_generate_endpoint_response_model(self, client):
        """Test that generate endpoint returns correct response model structure."""
        request_data = {
            "destination": "Tokyo",
            "days": 3,
            "start_date": "2023-07-01"
        }
        
        response = client.post("/api/v1/generate", json=request_data)
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify required fields are present
        required_fields = ["id", "trip_title", "destination", "days"]
        for field in required_fields:
            assert field in data
        
        # Verify days structure
        assert isinstance(data["days"], list)
        if data["days"]:
            day = data["days"][0]
            assert "day_number" in day
            assert "theme_title" in day
            assert "activities" in day
            if day["activities"]:
                activity = day["activities"][0]
                assert "name" in activity
                assert "description" in activity
                assert "start_time" in activity
                assert "duration_minutes" in activity

    def test_enrich_images_endpoint_response_model(self, client):
        """Test that enrich images endpoint returns correct response model structure."""
        request_data = {
            "keywords": ["Eiffel Tower Paris", "Louvre Museum Paris"]
        }

        response = client.post("/api/v1/enrich-images", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Verify structure
        assert "images" in data
        assert isinstance(data["images"], dict)

        # Verify each keyword has a corresponding image URL
        for keyword in request_data["keywords"]:
            assert keyword in data["images"]
            assert isinstance(data["images"][keyword], str)

    def test_get_trip_by_id_response_model(self, client, sample_itinerary):
        """Test that get trip endpoint returns correct response model structure."""
        response = client.get(f"/api/v1/trips/{sample_itinerary.id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields are present
        required_fields = ["id", "trip_title", "destination", "days"]
        for field in required_fields:
            assert field in data
        
        # Verify days structure
        assert isinstance(data["days"], list)
        if data["days"]:
            day = data["days"][0]
            assert "day_number" in day
            assert "theme_title" in day
            assert "activities" in day
            if day["activities"]:
                activity = day["activities"][0]
                assert "name" in activity
                assert "description" in activity
                assert "start_time" in activity
                assert "duration_minutes" in activity
                assert "location_name" in activity
                assert "image_keyword" in activity

    def test_list_trips_response_model(self, client):
        """Test that list trips endpoint returns correct response model structure."""
        response = client.get("/api/v1/trips")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify it's a list
        assert isinstance(data, list)
        
        # If there are trips, verify their structure
        if data:
            trip = data[0]
            required_fields = ["id", "trip_title", "destination", "days"]
            for field in required_fields:
                assert field in trip