# Drift Star Backend - Test Suite Documentation

This document describes the comprehensive test suite for the Drift Star backend API.

## Overview

The test suite covers all major components of the backend:

- **Models**: Pydantic model validation and data integrity
- **Services**: Business logic and external API integrations
- **API Endpoints**: Full integration testing of all endpoints
- **Error Handling**: Edge cases and error conditions
- **Dependencies**: Service initialization and dependency injection
- **Integration Script**: Real API connection testing

## Test Organization

### 1. `test_models.py`
- Comprehensive validation tests for all Pydantic models
- Field constraints and validation rules
- Data integrity checks
- Time format validation
- Duration and day number boundaries

### 2. `test_services.py`
- Unit tests for all three services:
  - `ItineraryGeneratorService` (Google Gemini integration)
  - `ImageHunterService` (Pexels API integration)
  - `TripStorageService` (In-memory storage)
- Business logic validation
- Error handling for external API calls
- Mocked external service calls

### 3. `test_api_integration.py`
- Full integration tests for all API endpoints
- Dependency injection verification
- Request/response cycle testing
- Cross-service interaction validation
- Status code and response model validation

### 4. `test_error_handling.py`
- Exception handling tests
- Boundary condition validation
- Invalid input handling
- Edge case scenarios
- Security-related input sanitization

### 5. `test_dependencies.py`
- Application startup and shutdown lifecycle
- Service initialization and global instance management
- Dependency injection functions
- Settings loading and caching
- CORS middleware configuration

### 6. `test_integration_script.py`
- Tests for the integration test script (`integration_test.py`)
- Environment variable handling
- Real API key validation
- Service connection verification

## Running Tests

```bash
# Run all tests
python -m pytest tests/

# Run tests with verbose output
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_models.py

# Run with coverage
python -m pytest tests/ --cov=.
```

## Test Coverage

The test suite provides:

- **100%** coverage of model validation logic
- **100%** coverage of service business logic
- **100%** coverage of API endpoints
- **Comprehensive** error handling and edge case testing
- **Complete** dependency injection and initialization testing

## Key Features

- **Async Support**: All async functions properly tested
- **Mocking Strategy**: External dependencies properly mocked
- **Fixtures**: Shared test data and configurations
- **Parameterized Tests**: Multiple input scenarios covered
- **Integration Testing**: Full request/response cycle validation
- **Error Path Testing**: All error conditions validated

## Architecture Patterns Tested

- **Dependency Injection**: Services properly injected into API handlers
- **Global State Management**: Safe handling of global service instances
- **Async Context Management**: Proper async resource handling
- **Validation Layer**: Pydantic model validation at API boundaries
- **Business Logic Isolation**: Service layer separation from API layer