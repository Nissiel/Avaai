"""Request ID, logging and deduplication middleware."""

from __future__ import annotations

import asyncio
import logging
import time
from collections import deque
from typing import Deque, Tuple
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

RequestKey = Tuple[str, str]


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Adds request IDs, structured logs, timeouts and duplicate detection."""

    def __init__(self, app, *, timeout_seconds: int = 10, dedupe_ttl: int = 300, dedupe_max: int = 2000):
        super().__init__(app)
        self.timeout_seconds = timeout_seconds
        self.dedupe_ttl = dedupe_ttl
        self.logger = logging.getLogger("ava.request")
        self._lock = asyncio.Lock()
        self._seen: Deque[tuple[RequestKey, float]] = deque()
        self._seen_index: dict[RequestKey, float] = {}
        self.dedupe_max = dedupe_max

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid4())
        request.state.request_id = request_id
        method = request.method.upper()
        path = request.url.path
        start = time.perf_counter()

        if await self._is_duplicate(request, method, path):
            self.logger.warning(
                "Duplicate request detected; short-circuiting",
                extra={"request_id": request_id, "method": method, "path": path},
            )
            return JSONResponse({"detail": "Duplicate request"}, status_code=409, headers={"X-Request-ID": request_id})

        try:
            response = await asyncio.wait_for(call_next(request), timeout=self.timeout_seconds)
        except asyncio.TimeoutError:
            duration_ms = (time.perf_counter() - start) * 1000
            self.logger.error(
                "Request timed out",
                extra={"request_id": request_id, "method": method, "path": path, "duration_ms": duration_ms},
            )
            return JSONResponse({"detail": "Request timed out"}, status_code=504, headers={"X-Request-ID": request_id})
        except Exception as exc:  # pragma: no cover - pass-through
            duration_ms = (time.perf_counter() - start) * 1000
            self.logger.exception(
                "Request crashed",
                extra={"request_id": request_id, "method": method, "path": path, "duration_ms": duration_ms},
            )
            raise exc

        duration_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Request-ID"] = request_id
        self.logger.info(
            "Request completed",
            extra={
                "request_id": request_id,
                "method": method,
                "path": path,
                "status": response.status_code,
                "duration_ms": round(duration_ms, 2),
            },
        )
        return response

    async def _is_duplicate(self, request: Request, method: str, path: str) -> bool:
        """Only treat as duplicate when client supplied X-Request-ID for mutating requests."""
        if method not in {"POST", "PUT", "PATCH", "DELETE"}:
            return False
        if "x-request-id" not in request.headers:
            return False

        request_id = request.headers["x-request-id"]
        key: RequestKey = (path, request_id)
        now = time.time()

        async with self._lock:
            while self._seen and now - self._seen[0][1] > self.dedupe_ttl:
                expired_key, _ = self._seen.popleft()
                self._seen_index.pop(expired_key, None)

            if key in self._seen_index:
                return True

            self._seen.append((key, now))
            self._seen_index[key] = now

            while len(self._seen) > self.dedupe_max:
                expired_key, _ = self._seen.popleft()
                self._seen_index.pop(expired_key, None)

        return False


__all__ = ["ObservabilityMiddleware"]
