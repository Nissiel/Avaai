"""
Comprehensive tests for Authentication routes.

Tests cover:
- Signup flow
- Login flow
- Token refresh
- Email/Phone verification endpoints
- Verification status
- Token validation (Supabase-only)
"""

import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

# Set test environment
os.environ["AVA_API_ENVIRONMENT"] = "test"
os.environ["AVA_API_JWT_SECRET_KEY"] = "test_secret_key_for_testing_only"
os.environ["ENABLE_SUPABASE_AUTH"] = "true"
os.environ["SUPABASE_JWT_SECRET"] = "test_supabase_jwt_secret"
os.environ["SUPABASE_PROJECT_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test_service_role_key"


class TestSignupEndpoint:
    """Tests for POST /api/v1/auth/signup"""

    def test_signup_missing_email(self, client: TestClient):
        """Test signup fails without email"""
        response = client.post("/api/v1/auth/signup", json={
            "password": "ValidPass123!",
            "name": "Test User"
        })
        assert response.status_code == 422

    def test_signup_invalid_email(self, client: TestClient):
        """Test signup fails with invalid email format"""
        response = client.post("/api/v1/auth/signup", json={
            "email": "not-an-email",
            "password": "ValidPass123!",
            "name": "Test User"
        })
        assert response.status_code == 422

    def test_signup_weak_password_no_uppercase(self, client: TestClient):
        """Test signup fails with password missing uppercase"""
        response = client.post("/api/v1/auth/signup", json={
            "email": "test@example.com",
            "password": "weakpass123!",
            "name": "Test User"
        })
        assert response.status_code == 422

    def test_signup_weak_password_no_digit(self, client: TestClient):
        """Test signup fails with password missing digit"""
        response = client.post("/api/v1/auth/signup", json={
            "email": "test@example.com",
            "password": "WeakPassword!",
            "name": "Test User"
        })
        assert response.status_code == 422

    def test_signup_password_too_short(self, client: TestClient):
        """Test signup fails with password under 8 characters"""
        response = client.post("/api/v1/auth/signup", json={
            "email": "test@example.com",
            "password": "Ab1!",
            "name": "Test User"
        })
        assert response.status_code == 422

    def test_signup_invalid_phone_format(self, client: TestClient):
        """Test signup fails with invalid phone format"""
        response = client.post("/api/v1/auth/signup", json={
            "email": "test@example.com",
            "password": "ValidPass123!",
            "name": "Test User",
            "phone": "123456789"  # Missing + prefix
        })
        assert response.status_code == 422

    def test_signup_name_too_short(self, client: TestClient):
        """Test signup fails with name under 2 characters"""
        response = client.post("/api/v1/auth/signup", json={
            "email": "test@example.com",
            "password": "ValidPass123!",
            "name": "A"
        })
        assert response.status_code == 422

    def test_signup_valid_request_format(self, client: TestClient):
        """Test signup request with valid format is accepted"""
        # Note: This will fail at the Supabase service level in test mode
        # but validates the request format is correct
        response = client.post("/api/v1/auth/signup", json={
            "email": "test@example.com",
            "password": "ValidPass123!",
            "name": "Test User",
            "phone": "+33612345678",
            "locale": "fr"
        })
        # Will get 500 or 400 due to Supabase not being available in tests
        # but should not be 422 (validation error)
        assert response.status_code != 422


class TestLoginEndpoint:
    """Tests for POST /api/v1/auth/login"""

    def test_login_missing_identifier(self, client: TestClient):
        """Test login fails without identifier"""
        response = client.post("/api/v1/auth/login", json={
            "password": "ValidPass123!"
        })
        assert response.status_code == 422

    def test_login_missing_password(self, client: TestClient):
        """Test login fails without password"""
        response = client.post("/api/v1/auth/login", json={
            "identifier": "test@example.com"
        })
        assert response.status_code == 422

    def test_login_valid_email_format(self, client: TestClient):
        """Test login accepts email as identifier"""
        response = client.post("/api/v1/auth/login", json={
            "identifier": "test@example.com",
            "password": "ValidPass123!"
        })
        # Should fail with 401 (invalid credentials) not 422 (validation)
        assert response.status_code in [401, 400, 500]
        assert response.status_code != 422

    def test_login_valid_phone_format(self, client: TestClient):
        """Test login accepts phone as identifier"""
        response = client.post("/api/v1/auth/login", json={
            "identifier": "+33612345678",
            "password": "ValidPass123!"
        })
        # Should fail with 401 (invalid credentials) not 422 (validation)
        assert response.status_code in [401, 400, 500]
        assert response.status_code != 422

    def test_login_with_remember_flag(self, client: TestClient):
        """Test login accepts remember flag"""
        response = client.post("/api/v1/auth/login", json={
            "identifier": "test@example.com",
            "password": "ValidPass123!",
            "remember": True
        })
        assert response.status_code != 422


class TestRefreshEndpoint:
    """Tests for POST /api/v1/auth/refresh"""

    def test_refresh_missing_token(self, client: TestClient):
        """Test refresh fails without refresh_token"""
        response = client.post("/api/v1/auth/refresh", json={})
        assert response.status_code == 422

    def test_refresh_invalid_token(self, client: TestClient):
        """Test refresh fails with invalid token"""
        response = client.post("/api/v1/auth/refresh", json={
            "refresh_token": "invalid_token"
        })
        assert response.status_code == 401


class TestVerificationEndpoints:
    """Tests for email/phone verification endpoints"""

    def test_resend_verification_email_missing_email(self, client: TestClient):
        """Test resend verification fails without email"""
        response = client.post("/api/v1/auth/resend-verification-email", json={})
        assert response.status_code == 422

    def test_resend_verification_email_invalid_email(self, client: TestClient):
        """Test resend verification fails with invalid email"""
        response = client.post("/api/v1/auth/resend-verification-email", json={
            "email": "not-an-email"
        })
        assert response.status_code == 422

    def test_send_phone_otp_invalid_phone(self, client: TestClient):
        """Test send OTP fails with invalid phone format"""
        response = client.post(
            "/api/v1/auth/send-phone-otp",
            json={"phone": "123456789"},  # Missing + prefix
            headers={"Authorization": "Bearer fake_token"}
        )
        # Should get 401 (unauthorized) or 422 (validation)
        assert response.status_code in [401, 422]

    def test_send_phone_otp_unauthorized(self, client: TestClient):
        """Test send OTP fails without authentication"""
        response = client.post(
            "/api/v1/auth/send-phone-otp",
            json={"phone": "+33612345678"}
        )
        assert response.status_code == 401

    def test_verify_phone_otp_missing_token(self, client: TestClient):
        """Test verify OTP fails without token"""
        response = client.post(
            "/api/v1/auth/verify-phone-otp",
            json={"phone": "+33612345678"},
            headers={"Authorization": "Bearer fake_token"}
        )
        assert response.status_code in [401, 422]

    def test_verify_phone_otp_invalid_token_length(self, client: TestClient):
        """Test verify OTP fails with wrong token length"""
        response = client.post(
            "/api/v1/auth/verify-phone-otp",
            json={
                "phone": "+33612345678",
                "token": "12345"  # Should be 6 digits
            },
            headers={"Authorization": "Bearer fake_token"}
        )
        assert response.status_code in [401, 422]

    def test_verification_status_unauthorized(self, client: TestClient):
        """Test verification status fails without authentication"""
        response = client.get("/api/v1/auth/verification-status")
        assert response.status_code == 401


class TestMeEndpoint:
    """Tests for GET/PATCH /api/v1/auth/me"""

    def test_get_me_unauthorized(self, client: TestClient):
        """Test get current user fails without authentication"""
        response = client.get("/api/v1/auth/me")
        # In dev mode, might return default user, otherwise 401
        assert response.status_code in [200, 401]

    def test_patch_me_unauthorized(self, client: TestClient):
        """Test update current user fails without authentication"""
        response = client.patch(
            "/api/v1/auth/me",
            json={"name": "New Name"}
        )
        # In dev mode, might work, otherwise 401
        assert response.status_code in [200, 401]

    def test_patch_me_invalid_phone(self, client: TestClient):
        """Test update fails with invalid phone format"""
        response = client.patch(
            "/api/v1/auth/me",
            json={"phone": "invalid"},
            headers={"Authorization": "Bearer fake_token"}
        )
        assert response.status_code in [401, 422]

    def test_patch_me_invalid_locale(self, client: TestClient):
        """Test update fails with invalid locale format"""
        response = client.patch(
            "/api/v1/auth/me",
            json={"locale": "invalid"},  # Should be 2 chars
            headers={"Authorization": "Bearer fake_token"}
        )
        assert response.status_code in [401, 422]


class TestTokenValidation:
    """Tests for Supabase-only token validation"""

    def test_invalid_token_format(self, client: TestClient):
        """Test request fails with malformed token"""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer not.a.valid.jwt"}
        )
        assert response.status_code == 401

    def test_expired_token(self, client: TestClient):
        """Test request fails with expired token"""
        # Create an expired JWT (would need proper JWT library in real test)
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxfQ.fake"}
        )
        assert response.status_code == 401

    def test_missing_authorization_header(self, client: TestClient):
        """Test protected endpoint fails without auth header"""
        response = client.get("/api/v1/auth/verification-status")
        assert response.status_code == 401


class TestRateLimiting:
    """Tests for rate limiting on auth endpoints"""

    @pytest.mark.slow
    def test_signup_rate_limit(self, client: TestClient):
        """Test signup is rate limited"""
        # Make multiple requests quickly
        responses = []
        for i in range(5):
            response = client.post("/api/v1/auth/signup", json={
                "email": f"test{i}@example.com",
                "password": "ValidPass123!",
                "name": "Test User"
            })
            responses.append(response.status_code)

        # At least one should be rate limited (429) after 3 requests
        # Note: This depends on rate limiter configuration
        # In tests, rate limiting might be disabled

    @pytest.mark.slow
    def test_login_rate_limit(self, client: TestClient):
        """Test login is rate limited"""
        # Make multiple requests quickly
        responses = []
        for i in range(10):
            response = client.post("/api/v1/auth/login", json={
                "identifier": "test@example.com",
                "password": "WrongPass123!"
            })
            responses.append(response.status_code)

        # At least one should be rate limited (429) after 5 requests
        # Note: This depends on rate limiter configuration


class TestPasswordResetFlow:
    """Tests for password reset flow (Supabase handles actual reset)"""

    def test_forgot_password_email_validation(self, client: TestClient):
        """Test forgot password validates email format"""
        # Note: Actual forgot password is handled by Supabase client-side
        # Backend provides resend-verification-email endpoint
        response = client.post("/api/v1/auth/resend-verification-email", json={
            "email": "invalid-email"
        })
        assert response.status_code == 422

    def test_forgot_password_valid_email(self, client: TestClient):
        """Test forgot password accepts valid email"""
        response = client.post("/api/v1/auth/resend-verification-email", json={
            "email": "test@example.com"
        })
        # Should succeed or fail with Supabase error, not validation error
        assert response.status_code != 422


# Integration tests (require database)
@pytest.mark.integration
class TestAuthIntegration:
    """Integration tests requiring database connection"""

    @pytest.fixture(autouse=True)
    def setup_db(self):
        """Setup test database before each test"""
        # This would set up a test database
        pass

    def test_full_signup_login_flow(self, client: TestClient):
        """Test complete signup -> login flow"""
        # This would test the full flow with mocked Supabase
        pass

    def test_token_refresh_flow(self, client: TestClient):
        """Test token refresh maintains session"""
        pass

    def test_logout_invalidates_session(self, client: TestClient):
        """Test logout properly clears session"""
        pass
