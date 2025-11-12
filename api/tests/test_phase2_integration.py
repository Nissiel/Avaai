"""Integration tests with real Vapi and Twilio sandboxes."""

from __future__ import annotations

import os

import pytest
from fastapi import HTTPException

from api.src.infrastructure.external.circuit_breaker import CircuitBreaker, CircuitBreakerConfig, CircuitState
from api.src.infrastructure.external.vapi_client import VapiClient


@pytest.mark.integration
@pytest.mark.skipif(
    not os.getenv("VAPI_SANDBOX_KEY"),
    reason="Requires VAPI_SANDBOX_KEY environment variable for integration testing",
)
async def test_vapi_list_settings_real_api():
    """Test Vapi client against real sandbox API."""
    client = VapiClient(token=os.getenv("VAPI_SANDBOX_KEY"))
    settings = await client.list_settings()
    
    # Verify response structure
    assert isinstance(settings, (list, dict))
    if isinstance(settings, dict):
        assert "settings" in settings or len(settings) == 0


@pytest.mark.integration
async def test_circuit_breaker_opens_after_threshold():
    """Verify circuit breaker opens after consecutive failures."""
    breaker = CircuitBreaker(
        name="test-breaker",
        config=CircuitBreakerConfig(failure_threshold=2, recovery_timeout=5),
    )
    
    assert breaker.state == CircuitState.CLOSED
    
    async def failing_func():
        raise RuntimeError("Simulated API failure")
    
    # First failure
    with pytest.raises(RuntimeError, match="Simulated API failure"):
        await breaker.call(failing_func)
    assert breaker._failure_count == 1
    assert breaker.state == CircuitState.CLOSED  # Still closed
    
    # Second failure - should open circuit
    with pytest.raises(RuntimeError, match="Simulated API failure"):
        await breaker.call(failing_func)
    assert breaker._failure_count == 2
    assert breaker.state == CircuitState.OPEN  # Now open
    
    # Third call should be blocked by circuit breaker
    with pytest.raises(HTTPException) as exc_info:
        await breaker.call(failing_func)
    assert exc_info.value.status_code == 503
    assert "temporarily unavailable" in exc_info.value.detail.lower()


@pytest.mark.integration
async def test_circuit_breaker_half_open_recovery():
    """Verify circuit breaker attempts recovery after timeout."""
    import asyncio
    
    breaker = CircuitBreaker(
        name="test-recovery",
        config=CircuitBreakerConfig(
            failure_threshold=1,
            recovery_timeout=1,  # 1 second for fast test
            success_threshold=2,
        ),
    )
    
    async def failing_func():
        raise RuntimeError("Failure")
    
    async def successful_func():
        return "success"
    
    # Open the circuit
    with pytest.raises(RuntimeError):
        await breaker.call(failing_func)
    assert breaker.state == CircuitState.OPEN
    
    # Wait for recovery timeout
    await asyncio.sleep(1.1)
    
    # Should transition to half-open on next call
    result = await breaker.call(successful_func)
    assert result == "success"
    assert breaker.state == CircuitState.HALF_OPEN
    assert breaker._success_count == 1
    
    # Another success should close circuit
    result = await breaker.call(successful_func)
    assert result == "success"
    assert breaker.state == CircuitState.CLOSED
    assert breaker._failure_count == 0


@pytest.mark.integration
async def test_circuit_breaker_preserves_http_exceptions():
    """Verify circuit breaker doesn't count HTTP exceptions as failures."""
    breaker = CircuitBreaker(
        name="test-http",
        config=CircuitBreakerConfig(failure_threshold=2),
    )
    
    async def http_error_func():
        raise HTTPException(status_code=404, detail="Not found")
    
    # HTTP exceptions should pass through without affecting failure count
    with pytest.raises(HTTPException) as exc_info:
        await breaker.call(http_error_func)
    assert exc_info.value.status_code == 404
    assert breaker._failure_count == 0
    assert breaker.state == CircuitState.CLOSED
