"""
Tests for the integration test script.

Tests cover:
- Integration test script functionality
- Environment variable handling
- Service connection verification
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import asyncio
from io import StringIO
import sys
from integration_test import main as integration_main


class TestIntegrationTestScript:
    """Tests for the integration test script."""

    @pytest.mark.asyncio
    async def test_integration_main_with_valid_keys(self):
        """Test integration main function with valid API keys."""
        # Mock environment variables
        with patch.dict('os.environ', {
            'GEMINI_API_KEY': 'valid-gemini-key',
            'PEXELS_API_KEY': 'valid-pexels-key'
        }):
            # Mock the services and their methods
            with patch('integration_test.ItineraryGeneratorService') as mock_gen_service_cls, \
                 patch('integration_test.ImageHunterService') as mock_img_service_cls:
                
                # Create mock service instances
                mock_gen_service = AsyncMock()
                mock_img_service = AsyncMock()  # Use AsyncMock for async methods

                mock_gen_service_cls.return_value = mock_gen_service
                mock_img_service_cls.return_value = mock_img_service

                # Mock the service methods
                mock_itinerary = MagicMock()
                mock_itinerary.trip_title = "Test Trip"
                mock_itinerary.days = [MagicMock()]
                mock_itinerary.days[0].activities = [MagicMock()]
                mock_itinerary.days[0].activities[0].name = "Test Activity"

                mock_gen_service.generate_itinerary = AsyncMock(return_value=mock_itinerary)
                mock_img_service.fetch_images_batch = AsyncMock(
                    return_value={
                        "Fushimi Inari Kyoto": "https://pexels.com/test1.jpg",
                        "Gion District": "https://pexels.com/test2.jpg"
                    }
                )
                mock_img_service.close = AsyncMock()  # Mock the close method as async
                
                # Capture print output
                captured_output = StringIO()
                sys.stdout = captured_output
                
                try:
                    await integration_main()
                finally:
                    sys.stdout = sys.__stdout__  # Restore stdout
                
                output = captured_output.getvalue()
                # Check that success messages are printed
                assert "🚀 Starting Integration Tests" in output
                assert "✅ Gemini Success!" in output
                assert "✅ Pexels Success!" in output

    @pytest.mark.asyncio
    async def test_integration_main_missing_gemini_key(self):
        """Test integration main function with missing Gemini API key."""
        # Mock environment with missing GEMINI_API_KEY
        with patch.dict('os.environ', {
            'PEXELS_API_KEY': 'valid-pexels-key'
        }, clear=True):
            # Also mock load_dotenv to return empty
            with patch('integration_test.load_dotenv'):
                with patch('integration_test.os.getenv', side_effect=lambda x: {
                    'GEMINI_API_KEY': None,
                    'PEXELS_API_KEY': 'valid-pexels-key'
                }.get(x)):
                    
                    # Capture print output
                    captured_output = StringIO()
                    sys.stdout = captured_output
                    
                    try:
                        await integration_main()
                    finally:
                        sys.stdout = sys.__stdout__  # Restore stdout
                    
                    output = captured_output.getvalue()
                    # Check that error message is printed
                    assert "❌ Error: GEMINI_API_KEY not set" in output

    @pytest.mark.asyncio
    async def test_integration_main_missing_pexels_key(self):
        """Test integration main function with missing Pexels API key."""
        # Mock environment with missing PEXELS_API_KEY
        with patch.dict('os.environ', {
            'GEMINI_API_KEY': 'valid-gemini-key'
        }, clear=True):
            # Also mock load_dotenv to return empty
            with patch('integration_test.load_dotenv'):
                with patch('integration_test.os.getenv', side_effect=lambda x: {
                    'GEMINI_API_KEY': 'valid-gemini-key',
                    'PEXELS_API_KEY': None
                }.get(x)):
                    
                    # Capture print output
                    captured_output = StringIO()
                    sys.stdout = captured_output
                    
                    try:
                        await integration_main()
                    finally:
                        sys.stdout = sys.__stdout__  # Restore stdout
                    
                    output = captured_output.getvalue()
                    # Check that error message is printed
                    assert "❌ Error: PEXELS_API_KEY not set" in output

    @pytest.mark.asyncio
    async def test_integration_main_placeholder_keys(self):
        """Test integration main function with placeholder API keys."""
        # Mock environment with placeholder keys
        with patch.dict('os.environ', {}, clear=True):
            # Also mock load_dotenv to return placeholder keys
            with patch('integration_test.load_dotenv'):
                with patch('integration_test.os.getenv', side_effect=lambda x: {
                    'GEMINI_API_KEY': 'your_gemini_key_here',
                    'PEXELS_API_KEY': 'your_pexels_key_here'
                }.get(x)):
                    
                    # Capture print output
                    captured_output = StringIO()
                    sys.stdout = captured_output
                    
                    try:
                        await integration_main()
                    finally:
                        sys.stdout = sys.__stdout__  # Restore stdout
                    
                    output = captured_output.getvalue()
                    # Check that error message for GEMINI_API_KEY is printed
                    # The function returns early after the first error, so only one error is shown
                    assert "❌ Error: GEMINI_API_KEY not set" in output

    @pytest.mark.asyncio
    async def test_integration_main_gemini_error(self):
        """Test integration main function when Gemini service fails."""
        # Mock environment variables
        with patch.dict('os.environ', {
            'GEMINI_API_KEY': 'valid-gemini-key',
            'PEXELS_API_KEY': 'valid-pexels-key'
        }):
            # Mock the services and their methods
            with patch('integration_test.ItineraryGeneratorService') as mock_gen_service_cls, \
                 patch('integration_test.ImageHunterService') as mock_img_service_cls:
                
                # Create mock service instances
                mock_gen_service = AsyncMock()
                mock_img_service = AsyncMock()  # Use AsyncMock for async methods

                mock_gen_service_cls.return_value = mock_gen_service
                mock_img_service_cls.return_value = mock_img_service

                # Mock Gemini to raise an exception
                mock_gen_service.generate_itinerary = AsyncMock(side_effect=Exception("API Error"))
                mock_img_service.fetch_images_batch = AsyncMock(
                    return_value={
                        "Fushimi Inari Kyoto": "https://pexels.com/test1.jpg"
                    }
                )
                mock_img_service.close = AsyncMock()  # Mock the close method as async
                
                # Capture print output
                captured_output = StringIO()
                sys.stdout = captured_output
                
                try:
                    await integration_main()
                finally:
                    sys.stdout = sys.__stdout__  # Restore stdout
                
                output = captured_output.getvalue()
                # Check that error message is printed for Gemini
                assert "🚀 Starting Integration Tests" in output
                assert "❌ Gemini Failed:" in output
                # Pexels should still work
                assert "✅ Pexels Success!" in output

    @pytest.mark.asyncio
    async def test_integration_main_pexels_error(self):
        """Test integration main function when Pexels service fails."""
        # Mock environment variables
        with patch.dict('os.environ', {
            'GEMINI_API_KEY': 'valid-gemini-key',
            'PEXELS_API_KEY': 'valid-pexels-key'
        }):
            # Mock the services and their methods
            with patch('integration_test.ItineraryGeneratorService') as mock_gen_service_cls, \
                 patch('integration_test.ImageHunterService') as mock_img_service_cls:
                
                # Create mock service instances
                mock_gen_service = AsyncMock()
                mock_img_service = AsyncMock()  # Use AsyncMock for async methods

                mock_gen_service_cls.return_value = mock_gen_service
                mock_img_service_cls.return_value = mock_img_service

                # Mock successful itinerary generation
                mock_itinerary = MagicMock()
                mock_itinerary.trip_title = "Test Trip"
                mock_itinerary.days = [MagicMock()]
                mock_itinerary.days[0].activities = [MagicMock()]
                mock_itinerary.days[0].activities[0].name = "Test Activity"

                mock_gen_service.generate_itinerary = AsyncMock(return_value=mock_itinerary)
                # Mock Pexels to raise an exception
                mock_img_service.fetch_images_batch = AsyncMock(side_effect=Exception("API Error"))
                mock_img_service.close = AsyncMock()  # Mock the close method as async
                
                # Capture print output
                captured_output = StringIO()
                sys.stdout = captured_output
                
                try:
                    await integration_main()
                finally:
                    sys.stdout = sys.__stdout__  # Restore stdout
                
                output = captured_output.getvalue()
                # Check that success message is printed for Gemini
                assert "🚀 Starting Integration Tests" in output
                assert "✅ Gemini Success!" in output
                # And error message for Pexels
                assert "❌ Pexels Failed:" in output

    @pytest.mark.asyncio
    async def test_integration_main_pexels_fallback_used(self):
        """Test integration main function when Pexels returns fallback images."""
        # Mock environment variables
        with patch.dict('os.environ', {
            'GEMINI_API_KEY': 'valid-gemini-key',
            'PEXELS_API_KEY': 'valid-pexels-key'
        }):
            # Mock the services and their methods
            with patch('integration_test.ItineraryGeneratorService') as mock_gen_service_cls, \
                 patch('integration_test.ImageHunterService') as mock_img_service_cls:
                
                # Create mock service instances
                mock_gen_service = AsyncMock()
                mock_img_service = AsyncMock()  # Use AsyncMock for async methods

                mock_gen_service_cls.return_value = mock_gen_service
                mock_img_service_cls.return_value = mock_img_service

                # Mock successful itinerary generation
                mock_itinerary = MagicMock()
                mock_itinerary.trip_title = "Test Trip"
                mock_itinerary.days = [MagicMock()]
                mock_itinerary.days[0].activities = [MagicMock()]
                mock_itinerary.days[0].activities[0].name = "Test Activity"

                mock_gen_service.generate_itinerary = AsyncMock(return_value=mock_itinerary)
                # Mock Pexels to return fallback images
                mock_img_service.fetch_images_batch = AsyncMock(
                    return_value={
                        "Fushimi Inari Kyoto": "https://images.pexels.com/photos/386009/pexels-photo-386009.jpeg?auto=compress&cs=tinysrgb&w=600",  # fallback
                        "Gion District": "https://pexels.com/test2.jpg"  # valid
                    }
                )
                mock_img_service.close = AsyncMock()  # Mock the close method as async
                
                # Capture print output
                captured_output = StringIO()
                sys.stdout = captured_output
                
                try:
                    await integration_main()
                finally:
                    sys.stdout = sys.__stdout__  # Restore stdout
                
                output = captured_output.getvalue()
                # Check that success message is printed for Gemini
                assert "🚀 Starting Integration Tests" in output
                assert "✅ Gemini Success!" in output
                # And warning message for fallback
                assert "⚠️ Pexels Fallback used" in output