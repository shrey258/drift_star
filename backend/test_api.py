"""
Test suite for the Travel Itinerary API.

Uses pytest with FastAPI TestClient. External services are mocked.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from models import Activity, Day, Itinerary


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mock_settings():
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
def sample_itinerary():
    """Sample itinerary for testing."""
    return Itinerary(
        id="test-trip-123",
        trip_title="2-Day Paris Adventure",
        destination="Paris",
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
def mock_generator_service(sample_itinerary):
    """Mock the itinerary generator service."""
    mock = AsyncMock()
    mock.generate_itinerary = AsyncMock(return_value=sample_itinerary)
    return mock


@pytest.fixture
def mock_image_service():
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
def mock_storage_service(sample_itinerary):
    """Mock the storage service."""
    mock = AsyncMock()
    mock.save = AsyncMock(return_value=sample_itinerary.id)
    mock.get = AsyncMock(return_value=sample_itinerary)
    mock.list_all = AsyncMock(return_value=[sample_itinerary])
    return mock


@pytest.fixture
def client(mock_settings, mock_generator_service, mock_image_service, mock_storage_service):
    """Create test client with mocked services."""
    with patch("main._generator_service", mock_generator_service), \
         patch("main._image_service", mock_image_service), \
         patch("main._storage_service", mock_storage_service), \
         patch("main.ItineraryGeneratorService"), \
         patch("main.ImageHunterService"), \
         patch("main.TripStorageService"):
        
        from main import app
        
        # Override dependency getters
        with patch("main.get_generator_service", return_value=mock_generator_service), \
             patch("main.get_image_service", return_value=mock_image_service), \
             patch("main.get_storage_service", return_value=mock_storage_service):
            
            yield TestClient(app)


# ============================================================================
# Health Check Tests
# ============================================================================

class TestHealthCheck:
    """Tests for the health check endpoint."""

    def test_health_check_returns_healthy(self, client):
        """Health check should return healthy status."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data


# ============================================================================
# Generate Itinerary Tests
# ============================================================================

class TestGenerateItinerary:
    """Tests for POST /api/v1/generate endpoint."""

    def test_generate_itinerary_success(self, client, mock_generator_service):
        """Should generate and return a valid itinerary."""
        response = client.post(
            "/api/v1/generate",
            json={"destination": "Paris", "days": 2},
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["destination"] == "Paris"
        assert data["trip_title"] == "2-Day Paris Adventure"
        assert len(data["days"]) == 1
        assert data["days"][0]["theme_title"] == "Classic Paris"

    def test_generate_itinerary_invalid_days_too_low(self, client):
        """Should reject days < 1."""
        response = client.post(
            "/api/v1/generate",
            json={"destination": "Paris", "days": 0},
        )
        
        assert response.status_code == 422  # Validation error

    def test_generate_itinerary_invalid_days_too_high(self, client):
        """Should reject days > 14."""
        response = client.post(
            "/api/v1/generate",
            json={"destination": "Paris", "days": 15},
        )
        
        assert response.status_code == 422

    def test_generate_itinerary_missing_destination(self, client):
        """Should reject missing destination."""
        response = client.post(
            "/api/v1/generate",
            json={"days": 2},
        )
        
        assert response.status_code == 422

    def test_generate_itinerary_empty_destination(self, client):
        """Should reject empty destination."""
        response = client.post(
            "/api/v1/generate",
            json={"destination": "", "days": 2},
        )
        
        assert response.status_code == 422


# ============================================================================
# Enrich Images Tests
# ============================================================================

class TestEnrichImages:
    """Tests for POST /api/v1/enrich-images endpoint."""

    def test_enrich_images_success(self, client, mock_image_service):
        """Should return image URLs for keywords."""
        response = client.post(
            "/api/v1/enrich-images",
            json={"keywords": ["Eiffel Tower Paris", "Louvre Museum Paris"]},
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "images" in data
        assert data["images"]["Eiffel Tower Paris"] == "https://example.com/eiffel.jpg"
        assert data["images"]["Louvre Museum Paris"] == "https://example.com/louvre.jpg"

    def test_enrich_images_empty_keywords(self, client):
        """Should reject empty keywords list."""
        response = client.post(
            "/api/v1/enrich-images",
            json={"keywords": []},
        )
        
        assert response.status_code == 422

    def test_enrich_images_missing_keywords(self, client):
        """Should reject missing keywords field."""
        response = client.post(
            "/api/v1/enrich-images",
            json={},
        )
        
        assert response.status_code == 422


# ============================================================================
# Get Trip Tests
# ============================================================================

class TestGetTrip:
    """Tests for GET /api/v1/trips/{trip_id} endpoint."""

    def test_get_trip_success(self, client, mock_storage_service):
        """Should return saved trip."""
        response = client.get("/api/v1/trips/test-trip-123")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == "test-trip-123"
        assert data["destination"] == "Paris"

    def test_get_trip_not_found(self, client, mock_storage_service):
        """Should return 404 for unknown trip."""
        mock_storage_service.get = AsyncMock(return_value=None)
        
        response = client.get("/api/v1/trips/unknown-id")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


# ============================================================================
# List Trips Tests
# ============================================================================

class TestListTrips:
    """Tests for GET /api/v1/trips endpoint."""

    def test_list_trips_success(self, client):
        """Should return all saved trips."""
        response = client.get("/api/v1/trips")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == "test-trip-123"

    def test_list_trips_empty(self, client, mock_storage_service):
        """Should return empty list when no trips."""
        mock_storage_service.list_all = AsyncMock(return_value=[])
        
        response = client.get("/api/v1/trips")
        
        assert response.status_code == 200
        assert response.json() == []


# ============================================================================
# Model Validation Tests
# ============================================================================

class TestModelValidation:
    """Tests for Pydantic model validation."""

    def test_activity_valid_time_format(self):
        """Activity should accept valid HH:MM format."""
        activity = Activity(
            name="Test",
            description="Test activity",
            start_time="09:30",
            duration_minutes=60,
            location_name="Test Location",
            image_keyword="test keyword",
        )
        assert activity.start_time == "09:30"

    def test_activity_invalid_time_format(self):
        """Activity should reject invalid time format."""
        with pytest.raises(ValueError):
            Activity(
                name="Test",
                description="Test activity",
                start_time="9:30",  # Missing leading zero
                duration_minutes=60,
                location_name="Test Location",
                image_keyword="test keyword",
            )

    def test_activity_duration_bounds(self):
        """Activity should enforce duration bounds."""
        # Valid duration
        activity = Activity(
            name="Test",
            description="Test",
            start_time="09:00",
            duration_minutes=60,
            location_name="Test",
            image_keyword="test",
        )
        assert activity.duration_minutes == 60

        # Invalid: too short
        with pytest.raises(ValueError):
            Activity(
                name="Test",
                description="Test",
                start_time="09:00",
                duration_minutes=10,  # Less than 15
                location_name="Test",
                image_keyword="test",
            )

        # Invalid: too long
        with pytest.raises(ValueError):
            Activity(
                name="Test",
                description="Test",
                start_time="09:00",
                duration_minutes=500,  # More than 480
                location_name="Test",
                image_keyword="test",
            )

    def test_day_number_bounds(self):
        """Day should enforce day_number >= 1."""
        with pytest.raises(ValueError):
            Day(
                day_number=0,
                theme_title="Test Day",
                activities=[],
            )
