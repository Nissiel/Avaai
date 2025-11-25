"""
User Journey Integration Tests

Tests the complete user flow from signup to using the dashboard.
Covers critical paths that must work end-to-end.

Test Scenarios:
1. New user signup → email verification → first login
2. User profile setup during onboarding
3. Studio config creation and persistence
4. Assistant creation and management
5. Phone number operations
"""

import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status
from cryptography.fernet import Fernet

# Test environment setup
os.environ["AVA_API_ENVIRONMENT"] = "test"
os.environ["AVA_API_JWT_SECRET_KEY"] = "test_secret_key_for_testing_only"
os.environ["ENABLE_SUPABASE_AUTH"] = "false"  # Disable for unit tests

FERNET_KEY = os.environ.get("AVA_API_SMTP_ENCRYPTION_KEY", "wJ2YcYzaO6F6DRKCVh0b07XHtcwPa5wPLXnw0lPwQxI=").encode("utf-8")
FERNET = Fernet(FERNET_KEY)

# Import after env setup
from api.src.presentation.dependencies.auth import get_current_user


def create_mock_user(completed_onboarding=False):
    """Create a realistic mock user for testing."""
    user = MagicMock()
    user.id = "test-user-uuid-12345"
    user.email = "testuser@example.com"
    user.name = "Test User"
    user.locale = "en"
    user.phone = "+15551234567"
    user.phone_verified = False
    user.two_fa_enabled = False
    user.onboarding_completed = completed_onboarding
    user.onboarding_step = 9 if completed_onboarding else 0
    user.onboarding_vapi_skipped = False
    user.onboarding_twilio_skipped = False
    user.onboarding_assistant_created = completed_onboarding
    user.vapi_api_key_encrypted = FERNET.encrypt(b"vapi_test_key_123").decode("utf-8")
    user.vapi_api_key_preview = "vapi_...123"
    user.twilio_account_sid_encrypted = FERNET.encrypt(b"ACtest12345").decode("utf-8")
    user.twilio_auth_token_encrypted = FERNET.encrypt(b"auth_token_test").decode("utf-8")
    user.twilio_phone_number = "+15559876543"
    user.created_at = MagicMock()
    user.updated_at = MagicMock()
    return user


@pytest.fixture
def mock_user():
    """Create a realistic mock user for testing."""
    return create_mock_user()


@pytest.fixture
def completed_onboarding_user():
    """User who has completed onboarding."""
    return create_mock_user(completed_onboarding=True)


@pytest.fixture
def auth_override(client, mock_user):
    """Override get_current_user dependency to return mock_user."""
    client.app.dependency_overrides[get_current_user] = lambda: mock_user
    yield
    client.app.dependency_overrides.clear()


@pytest.fixture
def completed_auth_override(client, completed_onboarding_user):
    """Override get_current_user dependency to return completed onboarding user."""
    client.app.dependency_overrides[get_current_user] = lambda: completed_onboarding_user
    yield
    client.app.dependency_overrides.clear()


class TestSignupToLoginJourney:
    """Test the signup → login flow."""

    def test_signup_validates_email_format(self, client: TestClient):
        """Signup rejects invalid email."""
        response = client.post("/api/v1/auth/signup", json={
            "email": "invalid-email",
            "password": "ValidPass123!",
            "name": "Test User"
        })
        assert response.status_code == 422

    def test_signup_validates_password_strength(self, client: TestClient):
        """Signup enforces password requirements."""
        # Missing uppercase
        response = client.post("/api/v1/auth/signup", json={
            "email": "test@example.com",
            "password": "weakpass123!",
            "name": "Test User"
        })
        assert response.status_code == 422

    def test_signup_validates_name_length(self, client: TestClient):
        """Signup requires minimum name length."""
        response = client.post("/api/v1/auth/signup", json={
            "email": "test@example.com",
            "password": "ValidPass123!",
            "name": "A"
        })
        assert response.status_code == 422

    def test_login_validates_credentials_format(self, client: TestClient):
        """Login validates credential format."""
        # Missing password
        response = client.post("/api/v1/auth/login", json={
            "identifier": "test@example.com"
        })
        assert response.status_code == 422


@pytest.mark.integration
class TestOnboardingJourney:
    """Test the onboarding flow for new users. Requires database."""

    def test_get_onboarding_status(self, client: TestClient, auth_override):
        """Get current onboarding status."""
        response = client.get("/api/v1/user/onboarding")
        assert response.status_code == 200
        data = response.json()
        assert "onboarding_vapi_skipped" in data
        assert "onboarding_twilio_skipped" in data
        assert "onboarding_assistant_created" in data

    @pytest.mark.skip(reason="Requires database connection")
    def test_update_onboarding_flags(self, client: TestClient, auth_override):
        """Update onboarding progress flags."""
        response = client.patch("/api/v1/user/onboarding", json={
            "onboarding_vapi_skipped": True
        })
        assert response.status_code == 200

    @pytest.mark.skip(reason="Requires database connection")
    def test_update_user_profile(self, client: TestClient, auth_override):
        """Update user profile during onboarding."""
        response = client.patch("/api/v1/user/profile", json={
            "name": "Updated Name",
            "locale": "fr"
        })
        assert response.status_code == 200

    @pytest.mark.skip(reason="Requires database connection")
    def test_complete_onboarding(self, client: TestClient, auth_override):
        """Complete onboarding flow."""
        response = client.post("/api/v1/user/complete-onboarding")
        assert response.status_code == 200


@pytest.mark.integration
class TestStudioConfigJourney:
    """Test studio configuration management. Requires database."""

    @pytest.mark.skip(reason="Requires database connection")
    def test_get_studio_config(self, client: TestClient, auth_override):
        """Get studio configuration for user."""
        response = client.get("/api/v1/studio/config")
        assert response.status_code == 200
        data = response.json()
        assert "organizationName" in data

    @pytest.mark.skip(reason="Requires database connection")
    def test_update_studio_config(self, client: TestClient, auth_override):
        """Update studio configuration."""
        response = client.patch("/api/v1/studio/config", json={
            "organizationName": "New Org Name",
            "firstMessage": "Welcome to our service!"
        })
        assert response.status_code == 200


@pytest.mark.integration
class TestAssistantJourney:
    """Test assistant creation and management. Requires database and Vapi."""

    @pytest.mark.skip(reason="Requires database and Vapi connection")
    def test_list_assistants(self, client: TestClient, auth_override):
        """List user's assistants."""
        response = client.get("/api/v1/assistants")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "assistants" in data

    def test_create_assistant_validates_input(self, client: TestClient, auth_override):
        """Assistant creation validates required fields."""
        # Missing required fields should fail validation
        response = client.post("/api/v1/assistants", json={})
        assert response.status_code == 422


@pytest.mark.integration
class TestPhoneNumberJourney:
    """Test phone number lifecycle operations. Requires database."""

    @pytest.mark.skip(reason="Requires database connection")
    def test_get_my_numbers(self, client: TestClient, auth_override):
        """Get user's phone numbers."""
        response = client.get("/api/v1/phone-numbers/my-numbers")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "numbers" in data

    def test_create_us_number_validates_input(self, client: TestClient, auth_override):
        """Create US number validates required fields."""
        # Missing assistant_id should fail
        response = client.post("/api/v1/phone-numbers/create-us", json={
            "user_id": "test-user"
        })
        assert response.status_code == 422

    @pytest.mark.skip(reason="Requires database connection")
    def test_import_twilio_validates_credentials(self, client: TestClient, auth_override):
        """Import Twilio number validates credentials format."""
        response = client.post("/api/v1/phone-numbers/import-twilio", json={
            "twilio_account_sid": "AC",  # Too short
            "twilio_auth_token": "short",
            "phone_number": "+15551234567",
            "assistant_id": "asst_123",
            "user_id": "test-user"
        })
        assert response.status_code == 422


@pytest.mark.integration
class TestDashboardJourney:
    """Test dashboard data retrieval. Requires database."""

    @pytest.mark.skip(reason="Requires database connection")
    def test_get_analytics_overview(self, client: TestClient, completed_auth_override):
        """Get analytics overview for dashboard."""
        response = client.get("/api/v1/analytics/overview")
        assert response.status_code == 200


class TestWebhookJourney:
    """Test webhook handling flows."""

    def test_vapi_webhook_validates_payload(self, client: TestClient):
        """Vapi webhook validates payload structure."""
        response = client.post("/api/v1/webhooks/vapi", json={
            "invalid": "payload"
        })
        # Should fail validation
        assert response.status_code in [422, 400]

    def test_vapi_webhook_handles_call_started(self, client: TestClient):
        """Vapi webhook handles call.started event."""
        response = client.post("/api/v1/webhooks/vapi", json={
            "type": "call.started",
            "call": {
                "id": "call_123",
                "assistantId": "asst_456"
            }
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"

    def test_vapi_webhook_handles_function_call(self, client: TestClient):
        """Vapi webhook handles function-call event."""
        response = client.post("/api/v1/webhooks/vapi", json={
            "type": "function-call",
            "call": {
                "id": "call_123",
                "assistantId": "asst_456"
            },
            "functionCall": {
                "name": "save_caller_info",
                "parameters": {
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "john@example.com"
                }
            }
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True


class TestCriticalPaths:
    """Test critical user paths that must always work."""

    def test_health_check(self, client: TestClient):
        """Health check endpoint is always available."""
        response = client.get("/healthz")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_root_endpoint(self, client: TestClient):
        """Root endpoint for deployment health checks."""
        response = client.get("/")
        assert response.status_code == 200

    def test_api_docs_available(self, client: TestClient):
        """API documentation is accessible."""
        response = client.get("/api/v1/docs")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "not slow"])
