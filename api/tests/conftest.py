"""
Test configuration and fixtures - DIVINE Testing
"""
import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Set test environment variables BEFORE any imports
os.environ["AVA_API_DATABASE_URL"] = "postgresql+asyncpg://nissielberrebi@localhost:5432/avaai_test"
os.environ["AVA_API_ENVIRONMENT"] = "test"
os.environ["AVA_API_LOG_LEVEL"] = "DEBUG"
os.environ["AVA_API_JWT_SECRET_KEY"] = "test_secret_key_for_testing_only"
os.environ["AVA_API_VAPI_API_KEY"] = "test_vapi_key"
os.environ["INTEGRATIONS_STUB_MODE"] = "true"  # Enable stubs for testing
os.environ["CIRCUIT_BREAKER_ENABLED"] = "true"
os.environ["RATE_LIMIT_PER_MINUTE"] = "60"  # Higher limit for tests

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from api.src.core.app import create_app


@pytest.fixture
def client():
    """Create a test client for the FastAPI application."""
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_user():
    """Mock authenticated user for testing."""
    return {
        "id": "test_user_id",
        "email": "test@example.com"
    }


# Register custom marks
def pytest_configure(config):
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "unit: mark test as unit test")
