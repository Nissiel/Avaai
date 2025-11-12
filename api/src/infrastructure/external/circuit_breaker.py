"""Circuit breaker pattern for external API resilience."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from functools import wraps
from typing import Any, Callable, TypeVar

from fastapi import HTTPException, status

try:
    from prometheus_client import Counter, Gauge

    METRICS_AVAILABLE = True
except ImportError:
    METRICS_AVAILABLE = False

logger = logging.getLogger("ava.circuit_breaker")

T = TypeVar("T")

# Prometheus metrics (optional)
if METRICS_AVAILABLE:
    circuit_breaker_state_metric = Gauge(
        "circuit_breaker_state",
        "Current state of circuit breaker (0=closed, 1=half_open, 2=open)",
        ["service"],
    )
    circuit_breaker_failures_metric = Counter(
        "circuit_breaker_failures_total",
        "Total failures recorded by circuit breaker",
        ["service"],
    )
    circuit_breaker_opens_metric = Counter(
        "circuit_breaker_opens_total",
        "Total times circuit breaker opened",
        ["service"],
    )
    circuit_breaker_closes_metric = Counter(
        "circuit_breaker_closes_total",
        "Total times circuit breaker closed (recovered)",
        ["service"],
    )
else:
    circuit_breaker_state_metric = None
    circuit_breaker_failures_metric = None
    circuit_breaker_opens_metric = None
    circuit_breaker_closes_metric = None


class CircuitState(str, Enum):
    """Circuit breaker states following the classic pattern."""

    CLOSED = "closed"  # Normal operation - requests flow through
    OPEN = "open"  # Failing - reject requests immediately
    HALF_OPEN = "half_open"  # Testing recovery - allow limited requests


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker behavior."""

    failure_threshold: int = 3  # Open circuit after N consecutive failures
    recovery_timeout: int = 30  # Seconds before attempting recovery (half-open)
    success_threshold: int = 2  # Close circuit after N successes in half-open state


@dataclass
class CircuitBreaker:
    """
    Circuit breaker for external API calls.
    
    Prevents cascading failures by opening circuit after threshold failures,
    then attempting recovery after timeout period.
    """

    name: str
    config: CircuitBreakerConfig = field(default_factory=CircuitBreakerConfig)
    _state: CircuitState = CircuitState.CLOSED
    _failure_count: int = 0
    _success_count: int = 0
    _last_failure_time: float = 0

    @property
    def state(self) -> CircuitState:
        """Get current circuit state."""
        return self._state

    def _emit_state_metric(self) -> None:
        """Emit Prometheus metric for current state."""
        if not METRICS_AVAILABLE or circuit_breaker_state_metric is None:
            return

        state_value = {
            CircuitState.CLOSED: 0,
            CircuitState.HALF_OPEN: 1,
            CircuitState.OPEN: 2,
        }[self._state]

        circuit_breaker_state_metric.labels(service=self.name).set(state_value)

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt recovery."""
        if self._state != CircuitState.OPEN:
            return False
        elapsed = time.time() - self._last_failure_time
        return elapsed >= self.config.recovery_timeout

    async def call(self, func: Callable[..., T], *args: Any, **kwargs: Any) -> T:
        """
        Execute function with circuit breaker protection.
        
        Args:
            func: Async function to execute
            *args: Positional arguments for func
            **kwargs: Keyword arguments for func
            
        Returns:
            Result from func
            
        Raises:
            HTTPException: If circuit is open (503)
            Exception: Original exception from func if circuit allows
        """
        # Check if we should transition to half-open
        if self._should_attempt_reset():
            logger.info(
                f"Circuit breaker [{self.name}] transitioning to HALF_OPEN for recovery attempt",
                extra={"circuit": self.name, "state": "half_open"},
            )
            self._state = CircuitState.HALF_OPEN
            self._success_count = 0
            self._emit_state_metric()

        # Reject if circuit is open
        if self._state == CircuitState.OPEN:
            wait_time = int(self.config.recovery_timeout - (time.time() - self._last_failure_time))
            logger.warning(
                f"Circuit breaker [{self.name}] is OPEN - rejecting request",
                extra={
                    "circuit": self.name,
                    "state": "open",
                    "wait_seconds": wait_time,
                },
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"{self.name} is temporarily unavailable. Please try again in {wait_time}s.",
            )

        # Attempt the call
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except HTTPException:
            # Don't count HTTP exceptions as circuit breaker failures
            raise
        except Exception as exc:
            self._on_failure(exc)
            raise

    def _on_success(self) -> None:
        """Handle successful call - reset failure count or close circuit."""
        self._failure_count = 0

        if self._state == CircuitState.HALF_OPEN:
            self._success_count += 1
            if self._success_count >= self.config.success_threshold:
                logger.info(
                    f"Circuit breaker [{self.name}] closing - recovery successful",
                    extra={
                        "circuit": self.name,
                        "state": "closed",
                        "success_count": self._success_count,
                    },
                )
                self._state = CircuitState.CLOSED
                self._success_count = 0
                self._emit_state_metric()
                if METRICS_AVAILABLE and circuit_breaker_closes_metric:
                    circuit_breaker_closes_metric.labels(service=self.name).inc()

    def _on_failure(self, exc: Exception) -> None:
        """Handle failed call - increment counter and potentially open circuit."""
        self._failure_count += 1
        self._last_failure_time = time.time()

        # Emit failure metric
        if METRICS_AVAILABLE and circuit_breaker_failures_metric:
            circuit_breaker_failures_metric.labels(service=self.name).inc()

        if self._failure_count >= self.config.failure_threshold:
            logger.error(
                f"Circuit breaker [{self.name}] opening - threshold reached",
                extra={
                    "circuit": self.name,
                    "state": "open",
                    "failure_count": self._failure_count,
                    "threshold": self.config.failure_threshold,
                    "error": str(exc),
                },
            )
            self._state = CircuitState.OPEN
            self._emit_state_metric()
            if METRICS_AVAILABLE and circuit_breaker_opens_metric:
                circuit_breaker_opens_metric.labels(service=self.name).inc()


# Global registry of circuit breakers
_breakers: dict[str, CircuitBreaker] = {}


def get_circuit_breaker(name: str, config: CircuitBreakerConfig | None = None) -> CircuitBreaker:
    """
    Get or create a circuit breaker by name.
    
    Args:
        name: Unique identifier for this circuit breaker
        config: Optional configuration (only used on first creation)
        
    Returns:
        CircuitBreaker instance
    """
    if name not in _breakers:
        _breakers[name] = CircuitBreaker(
            name=name,
            config=config or CircuitBreakerConfig(),
        )
    return _breakers[name]


def with_circuit_breaker(name: str, config: CircuitBreakerConfig | None = None):
    """
    Decorator to wrap async functions with circuit breaker protection.
    
    Usage:
        @with_circuit_breaker("vapi")
        async def call_vapi_api():
            ...
    """

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            breaker = get_circuit_breaker(name, config)
            return await breaker.call(func, *args, **kwargs)

        return wrapper

    return decorator


__all__ = [
    "CircuitBreaker",
    "CircuitBreakerConfig",
    "CircuitState",
    "get_circuit_breaker",
    "with_circuit_breaker",
]
