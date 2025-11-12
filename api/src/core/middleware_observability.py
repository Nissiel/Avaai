"""Middleware for observability and request correlation."""

from __future__ import annotations

import asyncio
import sys
import time
from typing import Callable
from uuid import uuid4

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.core.logging import request_logger


class RequestCorrelationMiddleware(BaseHTTPMiddleware):
    """
    Injects a unique X-Request-ID into every request/response.
    Sets request.state.request_id for downstream use.
    Logs request start and end with duration.
    🔥 DIVINE FIX: 20-second timeout (enough for cold Supabase database to wake up)
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("x-request-id") or str(uuid4())
        request.state.request_id = request_id

        start_time = time.time()
        request_logger.info(
            "Request started: %s %s",
            request.method,
            request.url.path,
            extra={"method": request.method, "path": request.url.path}
        )

        # 🔥 DIVINE FIX: 20-second timeout to handle cold database starts
        try:
            response = await asyncio.wait_for(call_next(request), timeout=20.0)
            duration_ms = (time.time() - start_time) * 1000
            request_logger.info(
                "Request completed: %s %s - %s",
                request.method,
                request.url.path,
                response.status_code,
                extra={
                    "method": request.method,
                    "path": request.url.path,
                }
            )
        except asyncio.TimeoutError:
            duration_ms = (time.time() - start_time) * 1000
            request_logger.error(
                "Request timed out",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                },
            )
            response = Response(
                content='{"detail":"Request timeout"}',
                status_code=504,
                media_type="application/json",
            )
            sys.stdout.flush()
        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000
            request_logger.error(
                "Request failed with exception: %s",
                exc,
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                },
            )
            raise

        response.headers["X-Request-ID"] = request_id
        return response


# Alias for backward compatibility
ObservabilityMiddleware = RequestCorrelationMiddleware
