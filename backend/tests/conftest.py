"""
Configuration for pytest.

This file contains shared fixtures and configurations for all tests.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from datetime import date
from models import Activity, Day, Itinerary


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
    mock.delete = AsyncMock(return_value=True)
    return mock


@pytest.fixture
def client(mock_settings, mock_generator_service, mock_image_service, mock_storage_service):
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


@pytest.fixture(autouse=True)
def reset_global_services():
    """Reset global service instances before each test."""
    import main
    main._generator_service = None
    main._image_service = None
    main._storage_service = None
    yield
    # Reset after test as well
    main._generator_service = None
    main._image_service = None
    main._storage_service = None