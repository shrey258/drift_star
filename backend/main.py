"""
FastAPI application for the Travel Itinerary API.

Endpoints:
- POST /api/v1/generate: Generate AI-powered itinerary
- POST /api/v1/enrich-images: Batch image lookup
- GET /api/v1/trips/{trip_id}: Retrieve saved trip
"""

import logging
from contextlib import asynccontextmanager
from functools import lru_cache
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings, SettingsConfigDict

from models import (
    EnrichImagesRequest,
    EnrichImagesResponse,
    ErrorResponse,
    GenerateRequest,
    Itinerary,
)
from services import ImageHunterService, ItineraryGeneratorService, TripStorageService


# ============================================================================
# Configuration
# ============================================================================

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    gemini_api_key: str
    pexels_api_key: str

    # Optional settings
    app_name: str = "Drift Star API"
    debug: bool = False


@lru_cache
def get_settings() -> Settings:
    """Cached settings dependency."""
    return Settings()


# ============================================================================
# Logging
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ============================================================================
# Service Dependencies
# ============================================================================

# Global service instances (initialized in lifespan)
_generator_service: ItineraryGeneratorService | None = None
_image_service: ImageHunterService | None = None
_storage_service: TripStorageService | None = None


def get_generator_service() -> ItineraryGeneratorService:
    if _generator_service is None:
        raise RuntimeError("Generator service not initialized")
    return _generator_service


def get_image_service() -> ImageHunterService:
    if _image_service is None:
        raise RuntimeError("Image service not initialized")
    return _image_service


def get_storage_service() -> TripStorageService:
    if _storage_service is None:
        raise RuntimeError("Storage service not initialized")
    return _storage_service


# ============================================================================
# Application Lifespan
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    global _generator_service, _image_service, _storage_service

    settings = get_settings()
    logger.info(f"Starting {settings.app_name}...")

    # Initialize services
    _generator_service = ItineraryGeneratorService(api_key=settings.gemini_api_key)
    _image_service = ImageHunterService(api_key=settings.pexels_api_key)
    _storage_service = TripStorageService()

    logger.info("Services initialized successfully")

    yield

    # Cleanup
    logger.info("Shutting down...")
    if _image_service:
        await _image_service.close()


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="Drift Star API",
    description="AI-powered travel itinerary generation",
    version="1.0.0",
    lifespan=lifespan,
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)

# CORS middleware for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Type Aliases
# ============================================================================

GeneratorDep = Annotated[ItineraryGeneratorService, Depends(get_generator_service)]
ImageDep = Annotated[ImageHunterService, Depends(get_image_service)]
StorageDep = Annotated[TripStorageService, Depends(get_storage_service)]


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "drift-star-api"}


@app.post(
    "/api/v1/generate",
    response_model=Itinerary,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Generation failed"},
    },
)
async def generate_itinerary(
    request: GenerateRequest,
    generator: GeneratorDep,
    storage: StorageDep,
):
    """
    Generate an AI-powered travel itinerary.

    Uses Google Gemini to create a structured, walkable itinerary
    with activities grouped by proximity.
    """
    try:
        logger.info(f"Generating itinerary for {request.destination} ({request.days} days) starting {request.start_date}")

        itinerary = await generator.generate_itinerary(
            destination=request.destination,
            days=request.days,
            start_date=request.start_date,
        )

        # Save to storage
        await storage.save(itinerary)
        logger.info(f"Itinerary generated and saved: {itinerary.id}")

        return itinerary

    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@app.post(
    "/api/v1/enrich-images",
    response_model=EnrichImagesResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
    },
)
async def enrich_images(
    request: EnrichImagesRequest,
    image_service: ImageDep,
):
    """
    Fetch images for multiple keywords in parallel.

    Allows frontend to load text instantly and images lazily.
    """
    logger.info(f"Enriching images for {len(request.keywords)} keywords")

    images = await image_service.fetch_images_batch(request.keywords)

    return EnrichImagesResponse(images=images)


@app.get(
    "/api/v1/trips/{trip_id}",
    response_model=Itinerary,
    responses={
        404: {"model": ErrorResponse, "description": "Trip not found"},
    },
)
async def get_trip(
    trip_id: str,
    storage: StorageDep,
):
    """Retrieve a saved trip by ID."""
    itinerary = await storage.get(trip_id)

    if itinerary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip '{trip_id}' not found",
        )

    return itinerary


@app.get(
    "/api/v1/trips",
    response_model=list[Itinerary],
)
async def list_trips(
    storage: StorageDep,
):
    """List all saved trips."""
    return await storage.list_all()


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
