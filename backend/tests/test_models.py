"""
Unit tests for the Pydantic models in models.py.

Tests cover:
- Model creation and validation
- Field constraints and validation rules
- Data integrity
"""

import pytest
from datetime import date
from models import Activity, Day, Itinerary, GenerateRequest, EnrichImagesRequest, EnrichImagesResponse, ErrorResponse


class TestActivityModel:
    """Tests for the Activity model."""

    def test_activity_creation_valid_data(self):
        """Test creating an Activity with valid data."""
        activity = Activity(
            name="Eiffel Tower",
            description="Iconic landmark in Paris",
            start_time="09:00",
            duration_minutes=120,
            location_name="Champ de Mars",
            image_keyword="Eiffel Tower Paris"
        )
        
        assert activity.name == "Eiffel Tower"
        assert activity.description == "Iconic landmark in Paris"
        assert activity.start_time == "09:00"
        assert activity.duration_minutes == 120
        assert activity.location_name == "Champ de Mars"
        assert activity.image_keyword == "Eiffel Tower Paris"
        assert activity.id is not None  # UUID should be auto-generated

    def test_activity_with_optional_image_url(self):
        """Test Activity with optional image_url field."""
        activity = Activity(
            name="Eiffel Tower",
            description="Iconic landmark in Paris",
            start_time="09:00",
            duration_minutes=120,
            location_name="Champ de Mars",
            image_keyword="Eiffel Tower Paris",
            image_url="https://example.com/image.jpg"
        )
        
        assert activity.image_url == "https://example.com/image.jpg"

    def test_activity_start_time_validation(self):
        """Test that start_time follows HH:MM format."""
        # Valid format
        Activity(
            name="Test",
            description="Test activity",
            start_time="09:30",
            duration_minutes=60,
            location_name="Test Location",
            image_keyword="test keyword",
        )

        # Invalid formats should raise ValidationError
        with pytest.raises(ValueError):
            Activity(
                name="Test",
                description="Test activity",
                start_time="9:30",  # Missing leading zero
                duration_minutes=60,
                location_name="Test Location",
                image_keyword="test keyword",
            )

        with pytest.raises(ValueError):
            Activity(
                name="Test",
                description="Test activity",
                start_time="09:30 AM",  # Invalid format
                duration_minutes=60,
                location_name="Test Location",
                image_keyword="test keyword",
            )

        # Note: The regex pattern ^\d{2}:\d{2}$ only validates format, not logical time validity
        # So "25:00" would pass the format validation but is logically invalid
        # If we want to validate logical time validity, we'd need additional validation
        # For now, we'll test format validation only
        with pytest.raises(ValueError):
            Activity(
                name="Test",
                description="Test activity",
                start_time="9:",  # Missing minutes
                duration_minutes=60,
                location_name="Test Location",
                image_keyword="test keyword",
            )

    def test_activity_duration_validation(self):
        """Test that duration_minutes is within valid range."""
        # Valid duration
        Activity(
            name="Test",
            description="Test activity",
            start_time="09:00",
            duration_minutes=60,
            location_name="Test",
            image_keyword="test",
        )
        
        # Too short (less than 15 minutes)
        with pytest.raises(ValueError):
            Activity(
                name="Test",
                description="Test",
                start_time="09:00",
                duration_minutes=10,  # Less than 15
                location_name="Test",
                image_keyword="test",
            )

        # Too long (more than 480 minutes = 8 hours)
        with pytest.raises(ValueError):
            Activity(
                name="Test",
                description="Test",
                start_time="09:00",
                duration_minutes=500,  # More than 480
                location_name="Test",
                image_keyword="test",
            )


class TestDayModel:
    """Tests for the Day model."""

    def test_day_creation_valid_data(self):
        """Test creating a Day with valid data."""
        day = Day(
            day_number=1,
            theme_title="Classic Paris",
            activities=[]
        )
        
        assert day.day_number == 1
        assert day.theme_title == "Classic Paris"
        assert day.activities == []

    def test_day_number_validation(self):
        """Test that day_number is positive."""
        # Valid day number
        Day(
            day_number=1,
            theme_title="Test Day",
            activities=[],
        )
        
        # Invalid: day number <= 0
        with pytest.raises(ValueError):
            Day(
                day_number=0,
                theme_title="Test Day",
                activities=[],
            )
        
        with pytest.raises(ValueError):
            Day(
                day_number=-1,
                theme_title="Test Day",
                activities=[],
            )

    def test_day_with_activities(self):
        """Test Day with activities."""
        activity = Activity(
            name="Eiffel Tower",
            description="Iconic landmark",
            start_time="09:00",
            duration_minutes=120,
            location_name="Champ de Mars",
            image_keyword="Eiffel Tower Paris"
        )
        
        day = Day(
            day_number=1,
            theme_title="Classic Paris",
            activities=[activity]
        )
        
        assert len(day.activities) == 1
        assert day.activities[0].name == "Eiffel Tower"


class TestItineraryModel:
    """Tests for the Itinerary model."""

    def test_itinerary_creation_valid_data(self):
        """Test creating an Itinerary with valid data."""
        itinerary = Itinerary(
            trip_title="2-Day Paris Adventure",
            destination="Paris",
            start_date=date(2023, 6, 1),
            end_date=date(2023, 6, 2),
            days=[]
        )
        
        assert itinerary.trip_title == "2-Day Paris Adventure"
        assert itinerary.destination == "Paris"
        assert itinerary.start_date == date(2023, 6, 1)
        assert itinerary.end_date == date(2023, 6, 2)
        assert itinerary.days == []
        assert itinerary.id is not None  # UUID should be auto-generated

    def test_itinerary_with_days(self):
        """Test Itinerary with days."""
        day = Day(
            day_number=1,
            theme_title="Classic Paris",
            activities=[]
        )
        
        itinerary = Itinerary(
            trip_title="2-Day Paris Adventure",
            destination="Paris",
            days=[day]
        )
        
        assert len(itinerary.days) == 1
        assert itinerary.days[0].theme_title == "Classic Paris"

    def test_itinerary_optional_dates(self):
        """Test Itinerary with optional date fields."""
        itinerary = Itinerary(
            trip_title="2-Day Paris Adventure",
            destination="Paris",
            days=[]
        )
        
        assert itinerary.start_date is None
        assert itinerary.end_date is None


class TestGenerateRequestModel:
    """Tests for the GenerateRequest model."""

    def test_generate_request_valid_data(self):
        """Test creating a GenerateRequest with valid data."""
        request = GenerateRequest(
            destination="Paris",
            days=3,
            start_date=date(2023, 6, 1)
        )
        
        assert request.destination == "Paris"
        assert request.days == 3
        assert request.start_date == date(2023, 6, 1)

    def test_generate_request_destination_validation(self):
        """Test destination length validation."""
        # Valid destination (minimum length 2)
        GenerateRequest(
            destination="NY",
            days=3,
            start_date=date(2023, 6, 1)
        )
        
        # Valid destination (maximum length 100)
        long_dest = "A" * 100
        GenerateRequest(
            destination=long_dest,
            days=3,
            start_date=date(2023, 6, 1)
        )
        
        # Invalid: too short
        with pytest.raises(ValueError):
            GenerateRequest(
                destination="P",
                days=3,
                start_date=date(2023, 6, 1)
            )
        
        # Invalid: too long
        with pytest.raises(ValueError):
            too_long_dest = "A" * 101
            GenerateRequest(
                destination=too_long_dest,
                days=3,
                start_date=date(2023, 6, 1)
            )

    def test_generate_request_days_validation(self):
        """Test days validation."""
        # Valid range (1-14)
        GenerateRequest(
            destination="Paris",
            days=1,
            start_date=date(2023, 6, 1)
        )
        
        GenerateRequest(
            destination="Paris",
            days=14,
            start_date=date(2023, 6, 1)
        )
        
        # Invalid: too low
        with pytest.raises(ValueError):
            GenerateRequest(
                destination="Paris",
                days=0,
                start_date=date(2023, 6, 1)
            )
        
        # Invalid: too high
        with pytest.raises(ValueError):
            GenerateRequest(
                destination="Paris",
                days=15,
                start_date=date(2023, 6, 1)
            )


class TestEnrichImagesRequestModel:
    """Tests for the EnrichImagesRequest model."""

    def test_enrich_images_request_valid_data(self):
        """Test creating an EnrichImagesRequest with valid data."""
        request = EnrichImagesRequest(
            keywords=["Eiffel Tower", "Louvre Museum"]
        )
        
        assert request.keywords == ["Eiffel Tower", "Louvre Museum"]

    def test_enrich_images_request_keywords_validation(self):
        """Test keywords list validation."""
        # Valid: minimum length (1)
        EnrichImagesRequest(
            keywords=["Eiffel Tower"]
        )
        
        # Valid: maximum length (50)
        many_keywords = [f"keyword_{i}" for i in range(50)]
        EnrichImagesRequest(
            keywords=many_keywords
        )
        
        # Invalid: empty list
        with pytest.raises(ValueError):
            EnrichImagesRequest(
                keywords=[]
            )
        
        # Invalid: too many keywords
        with pytest.raises(ValueError):
            too_many_keywords = [f"keyword_{i}" for i in range(51)]
            EnrichImagesRequest(
                keywords=too_many_keywords
            )


class TestEnrichImagesResponseModel:
    """Tests for the EnrichImagesResponse model."""

    def test_enrich_images_response_valid_data(self):
        """Test creating an EnrichImagesResponse with valid data."""
        response = EnrichImagesResponse(
            images={
                "Eiffel Tower": "https://example.com/eiffel.jpg",
                "Louvre Museum": "https://example.com/louvre.jpg"
            }
        )
        
        assert len(response.images) == 2
        assert response.images["Eiffel Tower"] == "https://example.com/eiffel.jpg"
        assert response.images["Louvre Museum"] == "https://example.com/louvre.jpg"

    def test_enrich_images_response_empty_dict(self):
        """Test EnrichImagesResponse with empty dictionary."""
        response = EnrichImagesResponse(
            images={}
        )
        
        assert response.images == {}


class TestErrorResponseModel:
    """Tests for the ErrorResponse model."""

    def test_error_response_valid_data(self):
        """Test creating an ErrorResponse with valid data."""
        response = ErrorResponse(
            error="Something went wrong",
            detail="Additional details here"
        )
        
        assert response.error == "Something went wrong"
        assert response.detail == "Additional details here"

    def test_error_response_without_detail(self):
        """Test ErrorResponse with optional detail field."""
        response = ErrorResponse(
            error="Something went wrong"
        )
        
        assert response.error == "Something went wrong"
        assert response.detail is None