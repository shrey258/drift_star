"""
Pydantic models for the Travel Itinerary API.

Strict schemas for itinerary data, request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional
import uuid


# ============================================================================
# Core Domain Models
# ============================================================================

class Activity(BaseModel):
    """A single activity within a day's itinerary."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="Name of the activity")
    description: str = Field(..., description="Brief description of the activity")
    start_time: str = Field(
        ...,
        pattern=r"^\d{2}:\d{2}$",
        description="Start time in HH:MM format",
    )
    duration_minutes: int = Field(..., ge=15, le=480, description="Duration in minutes")
    location_name: str = Field(..., description="Name of the location/venue")
    image_keyword: str = Field(..., description="Keyword for image search")
    image_url: Optional[str] = Field(default=None, description="Resolved image URL")


class Day(BaseModel):
    """A single day in the itinerary."""

    day_number: int = Field(..., ge=1, description="Day number (1-indexed)")
    theme_title: str = Field(..., description="Theme or title for the day")
    activities: list[Activity] = Field(default_factory=list)


class Itinerary(BaseModel):
    """Complete travel itinerary."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trip_title: str = Field(..., description="Title of the trip")
    destination: str = Field(..., description="Destination city/region")
    days: list[Day] = Field(default_factory=list)


# ============================================================================
# API Request/Response Models
# ============================================================================

class GenerateRequest(BaseModel):
    """Request body for itinerary generation."""

    destination: str = Field(..., min_length=2, max_length=100)
    days: int = Field(..., ge=1, le=14, description="Number of days (1-14)")


class EnrichImagesRequest(BaseModel):
    """Request body for image enrichment."""

    keywords: list[str] = Field(..., min_length=1, max_length=50)


class EnrichImagesResponse(BaseModel):
    """Response for image enrichment."""

    images: dict[str, str] = Field(
        default_factory=dict,
        description="Map of keyword → image URL",
    )


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str
    detail: Optional[str] = None
