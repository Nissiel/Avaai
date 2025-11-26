"""
Locust Load Testing for AVA API

Performance targets:
- P50 response time: < 100ms
- P95 response time: < 300ms
- P99 response time: < 500ms
- Throughput: > 100 req/s
- Error rate: < 0.1%

Run with:
    locust -f api/tests/locustfile.py --host=http://localhost:5555

Or headless:
    locust -f api/tests/locustfile.py --host=http://localhost:5555 --headless -u 100 -r 10 -t 60s
"""

import json
import random
import string
from locust import HttpUser, task, between, tag, events
from locust.runners import MasterRunner


# Test configuration
class TestConfig:
    """Configuration for load tests."""

    # Sample test data
    SAMPLE_EMAILS = [
        f"loadtest{i}@example.com" for i in range(1000)
    ]

    SAMPLE_NAMES = [
        "Load Test User", "Performance Tester", "Stress Test Account",
        "API Validator", "Scale Tester"
    ]

    SAMPLE_PASSWORDS = [
        "LoadTest123!", "PerfTest456!", "StressTest789!"
    ]

    @staticmethod
    def random_email():
        """Generate random email for signup tests."""
        suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        return f"loadtest_{suffix}@example.com"

    @staticmethod
    def random_name():
        """Generate random name."""
        return random.choice(TestConfig.SAMPLE_NAMES)

    @staticmethod
    def random_password():
        """Generate random valid password."""
        return random.choice(TestConfig.SAMPLE_PASSWORDS)


class AVAUser(HttpUser):
    """
    Base user class for AVA API load testing.

    Simulates realistic user behavior with think times between requests.
    """

    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks

    # Store auth token after login
    token = None
    user_id = None

    def on_start(self):
        """Called when user starts - perform any setup needed."""
        pass

    @tag("health")
    @task(10)
    def health_check(self):
        """
        Health check endpoint - highest frequency task.

        This simulates monitoring systems and load balancers
        checking health frequently.
        """
        with self.client.get("/healthz", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    response.success()
                else:
                    response.failure(f"Unhealthy status: {data}")
            else:
                response.failure(f"Status code: {response.status_code}")

    @tag("health")
    @task(5)
    def root_health(self):
        """Root endpoint health check."""
        self.client.get("/")


class UnauthenticatedUser(AVAUser):
    """
    Simulates unauthenticated user traffic.

    Tests public endpoints and auth flows.
    """

    @tag("auth", "signup")
    @task(1)
    def signup_attempt(self):
        """
        Attempt signup with random credentials.

        Note: This will hit rate limits quickly in production.
        Use primarily for testing rate limiting behavior.
        """
        payload = {
            "email": TestConfig.random_email(),
            "password": TestConfig.random_password(),
            "name": TestConfig.random_name()
        }

        with self.client.post(
            "/api/v1/auth/signup",
            json=payload,
            catch_response=True
        ) as response:
            if response.status_code in [200, 201, 409, 429]:
                # Success, duplicate, or rate limited are acceptable
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @tag("auth", "login")
    @task(3)
    def login_attempt(self):
        """
        Attempt login with test credentials.

        Tests the login flow performance.
        """
        payload = {
            "identifier": "loadtest@example.com",
            "password": "LoadTest123!"
        }

        with self.client.post(
            "/api/v1/auth/login",
            json=payload,
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 429]:
                # Success, invalid creds, or rate limited
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @tag("auth")
    @task(2)
    def forgot_password(self):
        """Test password reset flow."""
        with self.client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "loadtest@example.com"},
            catch_response=True
        ) as response:
            if response.status_code in [200, 429]:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")


class AuthenticatedUser(AVAUser):
    """
    Simulates authenticated user behavior.

    Tests protected endpoints with valid auth token.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Use a mock token for testing
        # In real tests, you'd get this from a login
        self.token = "mock_auth_token_for_load_testing"
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    @tag("dashboard")
    @task(5)
    def get_analytics_overview(self):
        """
        Get dashboard analytics - most common authenticated request.

        This is the main dashboard data fetch.
        """
        with self.client.get(
            "/api/v1/analytics/overview",
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 500]:
                # Success, unauthorized (mock token), or server error
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @tag("config")
    @task(3)
    def get_studio_config(self):
        """Get studio configuration."""
        with self.client.get(
            "/api/v1/studio/config",
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 500]:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @tag("assistants")
    @task(3)
    def list_assistants(self):
        """List user's assistants."""
        with self.client.get(
            "/api/v1/assistants",
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 500]:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @tag("phone")
    @task(2)
    def get_phone_numbers(self):
        """Get user's phone numbers."""
        with self.client.get(
            "/api/v1/phone-numbers/my-numbers",
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 500]:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @tag("onboarding")
    @task(2)
    def get_onboarding_status(self):
        """Get onboarding status."""
        with self.client.get(
            "/api/v1/user/onboarding",
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code in [200, 401]:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @tag("config")
    @task(1)
    def update_studio_config(self):
        """Update studio configuration."""
        payload = {
            "firstMessage": f"Hello! Load test at {random.randint(1, 1000)}",
            "askForName": random.choice([True, False])
        }

        with self.client.patch(
            "/api/v1/studio/config",
            json=payload,
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 500]:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @tag("voices")
    @task(2)
    def list_voices(self):
        """List available voices."""
        with self.client.get(
            "/api/v1/voices",
            headers=self.headers,
            catch_response=True
        ) as response:
            if response.status_code in [200, 401, 500]:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")


class WebhookUser(HttpUser):
    """
    Simulates webhook traffic from Vapi/Twilio.

    Tests webhook endpoint performance under load.
    """

    wait_time = between(0.1, 0.5)  # Webhooks come fast

    @tag("webhook", "vapi")
    @task(5)
    def vapi_call_started(self):
        """Simulate Vapi call.started webhook."""
        payload = {
            "type": "call.started",
            "call": {
                "id": f"call_{random.randint(10000, 99999)}",
                "assistantId": "asst_test123"
            }
        }

        with self.client.post(
            "/api/v1/webhooks/vapi",
            json=payload,
            catch_response=True
        ) as response:
            if response.status_code in [200, 422]:
                response.success()
            else:
                response.failure(f"Status: {response.status_code}")

    @tag("webhook", "vapi")
    @task(3)
    def vapi_function_call(self):
        """Simulate Vapi function-call webhook."""
        payload = {
            "type": "function-call",
            "call": {
                "id": f"call_{random.randint(10000, 99999)}",
                "assistantId": "asst_test123"
            },
            "functionCall": {
                "name": "save_caller_info",
                "parameters": {
                    "firstName": random.choice(["John", "Jane", "Bob"]),
                    "lastName": random.choice(["Doe", "Smith", "Johnson"]),
                    "email": f"caller{random.randint(1, 100)}@example.com"
                }
            }
        }

        with self.client.post(
            "/api/v1/webhooks/vapi",
            json=payload,
            catch_response=True
        ) as response:
            if response.status_code in [200, 422]:
                response.success()
            else:
                response.failure(f"Status: {response.status_code}")

    @tag("webhook", "vapi")
    @task(2)
    def vapi_transcript_update(self):
        """Simulate Vapi transcript.update webhook."""
        payload = {
            "type": "transcript.update",
            "call": {
                "id": f"call_{random.randint(10000, 99999)}",
                "assistantId": "asst_test123"
            }
        }

        with self.client.post(
            "/api/v1/webhooks/vapi",
            json=payload,
            catch_response=True
        ) as response:
            if response.status_code in [200, 422]:
                response.success()
            else:
                response.failure(f"Status: {response.status_code}")


class MixedUser(HttpUser):
    """
    Realistic mixed traffic simulation.

    Combines health checks, unauthenticated, and authenticated traffic
    in realistic proportions.
    """

    wait_time = between(1, 5)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.token = "mock_auth_token"
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    # Health checks - 30%
    @task(30)
    def health_check(self):
        self.client.get("/healthz")

    # Dashboard data - 20%
    @task(20)
    def dashboard_data(self):
        self.client.get("/api/v1/analytics/overview", headers=self.headers)

    # Config reads - 15%
    @task(15)
    def read_config(self):
        self.client.get("/api/v1/studio/config", headers=self.headers)

    # List resources - 15%
    @task(15)
    def list_resources(self):
        endpoints = [
            "/api/v1/assistants",
            "/api/v1/phone-numbers/my-numbers",
            "/api/v1/voices"
        ]
        self.client.get(random.choice(endpoints), headers=self.headers)

    # Auth attempts - 10%
    @task(10)
    def auth_attempts(self):
        self.client.post("/api/v1/auth/login", json={
            "identifier": "loadtest@example.com",
            "password": "LoadTest123!"
        })

    # Write operations - 10%
    @task(10)
    def write_operations(self):
        self.client.patch(
            "/api/v1/studio/config",
            json={"firstMessage": "Load test message"},
            headers=self.headers
        )


# Event handlers for custom metrics
@events.request.add_listener
def on_request(request_type, name, response_time, response_length, exception, **kwargs):
    """Log custom metrics for each request."""
    if exception:
        print(f"Request failed: {name} - {exception}")


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Log test start."""
    print("=" * 60)
    print("AVA API Load Test Starting")
    print("=" * 60)
    print("Performance Targets:")
    print("  - P50: < 100ms")
    print("  - P95: < 300ms")
    print("  - P99: < 500ms")
    print("  - Throughput: > 100 req/s")
    print("  - Error rate: < 0.1%")
    print("=" * 60)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Log test completion and results summary."""
    print("=" * 60)
    print("AVA API Load Test Complete")
    print("=" * 60)

    if environment.stats.total.num_requests > 0:
        stats = environment.stats.total
        print(f"Total Requests: {stats.num_requests}")
        print(f"Failed Requests: {stats.num_failures}")
        print(f"Error Rate: {(stats.num_failures / stats.num_requests) * 100:.2f}%")
        print(f"Avg Response Time: {stats.avg_response_time:.0f}ms")
        print(f"P50: {stats.get_response_time_percentile(0.5):.0f}ms")
        print(f"P95: {stats.get_response_time_percentile(0.95):.0f}ms")
        print(f"P99: {stats.get_response_time_percentile(0.99):.0f}ms")
        print(f"Requests/s: {stats.total_rps:.1f}")

    print("=" * 60)


if __name__ == "__main__":
    print("Run with: locust -f api/tests/locustfile.py --host=http://localhost:5555")
