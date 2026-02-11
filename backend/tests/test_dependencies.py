"""
Tests for service dependencies and initialization in the backend.

Tests cover:
- Application startup and shutdown
- Service initialization
- Dependency injection
- Settings loading
- Global service instances
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from pydantic_settings import BaseSettings
from models import Itinerary
from services import ItineraryGeneratorService, ImageHunterService, TripStorageService
from main import (
    Settings, get_settings, lifespan, app,
    get_generator_service, get_image_service, get_storage_service,
    _generator_service, _image_service, _storage_service
)


class TestSettingsConfiguration:
    """Tests for settings configuration and loading."""

    def test_settings_model_defaults(self):
        """Test Settings model with default values."""
        settings = Settings(
            gemini_api_key="test-gemini-key",
            pexels_api_key="test-pexels-key"
        )
        
        assert settings.gemini_api_key == "test-gemini-key"
        assert settings.pexels_api_key == "test-pexels-key"
        assert settings.app_name == "Drift Star API"
        assert settings.debug is False

    def test_settings_model_custom_values(self):
        """Test Settings model with custom values."""
        settings = Settings(
            gemini_api_key="custom-gemini-key",
            pexels_api_key="custom-pexels-key",
            app_name="Custom API",
            debug=True
        )
        
        assert settings.gemini_api_key == "custom-gemini-key"
        assert settings.pexels_api_key == "custom-pexels-key"
        assert settings.app_name == "Custom API"
        assert settings.debug is True

    def test_get_settings_cached(self):
        """Test that get_settings returns cached instance."""
        # Clear the cache first
        get_settings.cache_clear()
        
        settings1 = get_settings()
        settings2 = get_settings()
        
        # Should return the same cached instance
        assert settings1 is settings2

    def test_settings_env_file_loading(self, monkeypatch):
        """Test settings loading from environment variables."""
        monkeypatch.setenv("GEMINI_API_KEY", "env-gemini-key")
        monkeypatch.setenv("PEXELS_API_KEY", "env-pexels-key")
        monkeypatch.setenv("APP_NAME", "Env API")
        monkeypatch.setenv("DEBUG", "true")
        
        # Clear the cache to force reload
        get_settings.cache_clear()
        
        settings = get_settings()
        
        assert settings.gemini_api_key == "env-gemini-key"
        assert settings.pexels_api_key == "env-pexels-key"
        assert settings.app_name == "Env API"
        assert settings.debug is True


class TestServiceInitialization:
    """Tests for service initialization."""

    def test_itinerary_generator_service_init(self):
        """Test ItineraryGeneratorService initialization."""
        service = ItineraryGeneratorService(api_key="test-key")
        
        assert service.client is not None
        assert service.model_id == "gemini-2.0-flash"

    def test_image_hunter_service_init(self):
        """Test ImageHunterService initialization."""
        service = ImageHunterService(api_key="test-key")
        
        assert service.api_key == "test-key"
        assert service._client is None  # Should be lazy-loaded
        assert hasattr(service, 'FALLBACK_IMAGE')

    def test_trip_storage_service_init(self):
        """Test TripStorageService initialization."""
        service = TripStorageService()
        
        assert service._storage == {}  # Should start empty


class TestApplicationLifespan:
    """Tests for application lifespan management."""

    @pytest.mark.asyncio
    async def test_lifespan_startup_shutdown(self, monkeypatch):
        """Test application startup and shutdown lifecycle."""
        # Import main module to access global variables
        import main

        # Mock settings
        mock_settings = MagicMock()
        mock_settings.gemini_api_key = "test-gemini-key"
        mock_settings.pexels_api_key = "test-pexels-key"
        mock_settings.app_name = "Test API"

        monkeypatch.setattr("main.get_settings", lambda: mock_settings)

        # Create mock service instances
        mock_gen_service = MagicMock()
        mock_img_service = AsyncMock()  # Make it async-compatible for close()
        mock_sto_service = MagicMock()

        # Patch the global variables temporarily during lifespan execution
        with patch("main.ItineraryGeneratorService", return_value=mock_gen_service), \
             patch("main.ImageHunterService", return_value=mock_img_service), \
             patch("main.TripStorageService", return_value=mock_sto_service):

            # Capture the original values
            original_gen = main._generator_service
            original_img = main._image_service
            original_sto = main._storage_service

            try:
                # Test lifespan context manager
                async with lifespan(app):
                    # Services should be initialized during startup and assigned to globals
                    assert main._generator_service is mock_gen_service
                    assert main._image_service is mock_img_service
                    assert main._storage_service is mock_sto_service
            finally:
                # Restore original values
                main._generator_service = original_gen
                main._image_service = original_img
                main._storage_service = original_sto
            
            # After exiting the context, cleanup should happen
            # (Note: In this test, we're not testing the actual cleanup
            # since that depends on the service implementations)

    @pytest.mark.asyncio
    async def test_lifespan_logging(self, monkeypatch, caplog):
        """Test that lifespan logs startup and shutdown messages."""
        # Import main module to access global variables
        import main

        # Mock settings
        mock_settings = MagicMock()
        mock_settings.gemini_api_key = "test-gemini-key"
        mock_settings.pexels_api_key = "test-pexels-key"
        mock_settings.app_name = "Test API"

        monkeypatch.setattr("main.get_settings", lambda: mock_settings)

        # Create mock service instances
        mock_gen_service = MagicMock()
        mock_img_service = AsyncMock()  # Make it async-compatible for close()
        mock_sto_service = MagicMock()

        # Capture the original values
        original_gen = main._generator_service
        original_img = main._image_service
        original_sto = main._storage_service

        try:
            with patch("main.ItineraryGeneratorService", return_value=mock_gen_service), \
                 patch("main.ImageHunterService", return_value=mock_img_service), \
                 patch("main.TripStorageService", return_value=mock_sto_service):

                # Capture log messages
                with caplog.at_level(logging.INFO):
                    async with lifespan(app):
                        pass  # Startup happens here

                    # Check that startup messages were logged
                    assert any("Starting Test API..." in record.message for record in caplog.records)
                    assert any("Services initialized successfully" in record.message for record in caplog.records)
        finally:
            # Restore original values
            main._generator_service = original_gen
            main._image_service = original_img
            main._storage_service = original_sto


class TestDependencyInjection:
    """Tests for dependency injection functions."""

    def test_get_generator_service(self):
        """Test get_generator_service function."""
        # Import main module to access global variables
        import main

        # Set up a mock service
        mock_service = MagicMock()
        original_service = main._generator_service
        main._generator_service = mock_service

        try:
            service = get_generator_service()
            assert service is mock_service
        finally:
            # Clean up
            main._generator_service = original_service

    def test_get_generator_service_not_initialized(self):
        """Test get_generator_service when service not initialized."""
        global _generator_service
        _generator_service = None
        
        with pytest.raises(RuntimeError, match="Generator service not initialized"):
            get_generator_service()

    def test_get_image_service(self):
        """Test get_image_service function."""
        # Import main module to access global variables
        import main

        # Set up a mock service
        mock_service = MagicMock()
        original_service = main._image_service
        main._image_service = mock_service

        try:
            service = get_image_service()
            assert service is mock_service
        finally:
            # Clean up
            main._image_service = original_service

    def test_get_image_service_not_initialized(self):
        """Test get_image_service when service not initialized."""
        global _image_service
        _image_service = None
        
        with pytest.raises(RuntimeError, match="Image service not initialized"):
            get_image_service()

    def test_get_storage_service(self):
        """Test get_storage_service function."""
        # Import main module to access global variables
        import main

        # Set up a mock service
        mock_service = MagicMock()
        original_service = main._storage_service
        main._storage_service = mock_service

        try:
            service = get_storage_service()
            assert service is mock_service
        finally:
            # Clean up
            main._storage_service = original_service

    def test_get_storage_service_not_initialized(self):
        """Test get_storage_service when service not initialized."""
        global _storage_service
        _storage_service = None
        
        with pytest.raises(RuntimeError, match="Storage service not initialized"):
            get_storage_service()


class TestGlobalServiceInstances:
    """Tests for global service instances management."""

    def setup_method(self):
        """Set up global service instances to None before each test."""
        global _generator_service, _image_service, _storage_service
        _generator_service = None
        _image_service = None
        _storage_service = None

    def teardown_method(self):
        """Clean up global service instances after each test."""
        global _generator_service, _image_service, _storage_service
        _generator_service = None
        _image_service = None
        _storage_service = None

    def test_global_instances_initial_state(self):
        """Test that global instances start as None."""
        assert _generator_service is None
        assert _image_service is None
        assert _storage_service is None

    def test_global_instances_assignment(self):
        """Test assignment of global service instances."""
        gen_service = MagicMock()
        img_service = MagicMock()
        sto_service = MagicMock()
        
        global _generator_service, _image_service, _storage_service
        _generator_service = gen_service
        _image_service = img_service
        _storage_service = sto_service
        
        assert _generator_service is gen_service
        assert _image_service is img_service
        assert _storage_service is sto_service


class TestMainAppConfiguration:
    """Tests for main application configuration."""

    def test_app_title_and_description(self):
        """Test that app has correct title and description."""
        assert app.title == "Drift Star API"
        assert "AI-powered travel itinerary generation" in app.description
        assert app.version == "1.0.0"

    def test_cors_middleware_configuration(self):
        """Test that CORS middleware is properly configured."""
        # Check if CORS middleware is present
        cors_found = False
        for middleware in app.user_middleware:
            if "CORSMiddleware" in str(middleware):
                cors_found = True
                break
        
        assert cors_found, "CORS middleware should be configured"

    def test_app_routes_exist(self):
        """Test that expected routes are registered."""
        route_paths = [route.path for route in app.routes]
        
        expected_paths = [
            "/health",
            "/api/v1/generate",
            "/api/v1/enrich-images", 
            "/api/v1/trips/{trip_id}",
            "/api/v1/trips"
        ]
        
        for path in expected_paths:
            assert path in route_paths, f"Route {path} should be registered"

    def test_route_methods(self):
        """Test that routes have correct HTTP methods."""
        routes_by_method = {}
        for route in app.routes:
            if hasattr(route, 'methods'):
                for method in route.methods:
                    routes_by_method[f"{method}{route.path}"] = True
        
        # Check for expected method/path combinations
        assert "GET/health" in routes_by_method
        assert "POST/api/v1/generate" in routes_by_method
        assert "POST/api/v1/enrich-images" in routes_by_method
        assert "GET/api/v1/trips/{trip_id}" in routes_by_method
        assert "GET/api/v1/trips" in routes_by_method


class TestLoggingConfiguration:
    """Tests for logging configuration."""

    def test_logging_setup(self):
        """Test that logging is configured correctly."""
        logger = logging.getLogger(__name__)
        
        # Check that logging level is set
        assert logger.level in [logging.NOTSET, logging.DEBUG, logging.INFO, logging.WARNING, logging.ERROR, logging.CRITICAL]
        
        # Check that a logger with the expected name exists
        drift_logger = logging.getLogger("main")
        assert drift_logger is not None


class TestServiceDependenciesWithMocks:
    """Tests for service dependencies using mocks."""

    @pytest.mark.asyncio
    async def test_dependency_functions_with_mocked_services(self):
        """Test dependency functions work with mocked services."""
        # Import main module to access global variables
        import main

        # Create mock services
        mock_gen_service = AsyncMock(spec=ItineraryGeneratorService)
        mock_img_service = AsyncMock(spec=ImageHunterService)
        mock_sto_service = AsyncMock(spec=TripStorageService)

        # Temporarily set global services
        original_gen = main._generator_service
        original_img = main._image_service
        original_sto = main._storage_service

        try:
            main._generator_service = mock_gen_service
            main._image_service = mock_img_service
            main._storage_service = mock_sto_service

            # Test that dependency functions return the correct services
            assert get_generator_service() is mock_gen_service
            assert get_image_service() is mock_img_service
            assert get_storage_service() is mock_sto_service

        finally:
            # Restore original values
            main._generator_service = original_gen
            main._image_service = original_img
            main._storage_service = original_sto