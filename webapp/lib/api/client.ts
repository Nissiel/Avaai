"use client";

import { clientLogger } from "../logging/client-logger";
import { getAuthTokenSync } from "../hooks/use-auth-token";
import { refreshAccessToken, getBackendBaseUrl } from "../auth/session-client";

type BaseUrlMode = "backend" | "relative" | "absolute";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  dedupeKey?: string;
  requestId?: string;
  timeoutMs?: number;
  baseUrl?: BaseUrlMode;
  metricsLabel?: string;
};

type MetricsStore = {
  requests: Record<string, unknown>;
};

const inflightControllers = new Map<string, AbortController>();
let refreshPromise: Promise<string | null> | null = null;
let isRefreshing = false; // 🎯 DIVINE: Prevent concurrent refreshes
let refreshRetryCount = 0; // 🎯 DIVINE: Track refresh failures
const MAX_REFRESH_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 20_000;

// 🎯 DIVINE: Circuit breaker for backend health
let circuitBreakerFailures = 0;
let circuitBreakerOpenUntil: number | null = null;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT_MS = 30_000;

function now(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function resolveEndpoint(input: string, baseUrl?: BaseUrlMode): { url: string; mode: BaseUrlMode } {
  if (baseUrl === "absolute") {
    return { url: input, mode: "absolute" };
  }

  if (/^https?:\/\//i.test(input)) {
    return { url: input, mode: "absolute" };
  }

  if (baseUrl === "relative" || input.startsWith("/api/")) {
    return { url: input, mode: "relative" };
  }

  const normalized = input.startsWith("/") ? input : `/${input}`;
  return { url: `${getBackendBaseUrl()}${normalized}`, mode: "backend" };
}

function buildHeaders(options: ApiRequestOptions, requestId: string): Headers {
  const headers = new Headers(options.headers);
  headers.set("X-Request-ID", requestId);

  if (options.auth !== false) {
    const token = getAuthTokenSync();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

type NamedError = Error & { name: string };

function createAbortError(message: string, name: string): DOMException | NamedError {
  try {
    return new DOMException(message, name);
  } catch {
    const error = new Error(message) as NamedError;
    error.name = name;
    return error;
  }
}

async function singleFlightRefresh(): Promise<string | null> {
  // 🎯 DIVINE: Already refreshing? Wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // 🎯 DIVINE: Too many failures? Force logout
  if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
    clientLogger.error("Max refresh retries exceeded, forcing logout");
    if (typeof window !== "undefined") {
      window.location.href = "/login?reason=session_expired";
    }
    return null;
  }

  isRefreshing = true;
  refreshRetryCount++;

  // 🎯 DIVINE: Call frontend API route (uses HTTP-only cookies)
  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        clientLogger.warn("Token refresh failed", { 
          status: response.status, 
          attempt: refreshRetryCount 
        });
        
        // 🎯 DIVINE: Exponential backoff before retry
        if (refreshRetryCount < MAX_REFRESH_RETRIES) {
          const backoffMs = Math.min(1000 * Math.pow(2, refreshRetryCount - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
        
        return null;
      }

      const data = await response.json();
      
      // 🎯 DIVINE: Success! Reset retry counter
      refreshRetryCount = 0;
      clientLogger.info("Token refresh successful");
      
      return data.access_token;
    } catch (error) {
      clientLogger.error("Token refresh exception", { error, attempt: refreshRetryCount });
      return null;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
    isRefreshing = false;
  }
}

function recordMetrics(label: string, data: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    try {
      const globalObject = window as unknown as {
        __AVA_METRICS__?: MetricsStore;
      };
      const metricsStore = (globalObject.__AVA_METRICS__ ??= { requests: {} });
      if (!metricsStore.requests) {
        metricsStore.requests = {};
      }
      metricsStore.requests[label] = {
        ...data,
        ts: new Date().toISOString(),
      };
    } catch (error) {
      // 🎯 DIVINE: Silently fail metrics recording, never crash user experience
      if (process.env.NODE_ENV === "development") {
        console.warn("[Metrics] Failed to record:", label, error);
      }
    }
  }
}

// 🎯 DIVINE: Circuit breaker check
function isCircuitBreakerOpen(): boolean {
  if (circuitBreakerOpenUntil === null) return false;
  
  if (Date.now() < circuitBreakerOpenUntil) {
    return true;
  }
  
  // Circuit breaker timeout expired, reset
  circuitBreakerOpenUntil = null;
  circuitBreakerFailures = 0;
  return false;
}

// 🎯 DIVINE: Record backend failure for circuit breaker
function recordBackendFailure() {
  circuitBreakerFailures++;
  
  if (circuitBreakerFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitBreakerOpenUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT_MS;
    clientLogger.error("🔴 Circuit breaker OPEN - too many backend failures", {
      failures: circuitBreakerFailures,
      reopenAt: new Date(circuitBreakerOpenUntil).toISOString(),
    });
    
    // Show user-friendly message
    if (typeof window !== "undefined") {
      const event = new CustomEvent("ava:backend-unavailable", {
        detail: { message: "Server temporarily unavailable. Retrying..." }
      });
      window.dispatchEvent(event);
    }
  }
}

// 🎯 DIVINE: Reset circuit breaker on success
function recordBackendSuccess() {
  if (circuitBreakerFailures > 0) {
    clientLogger.info("✅ Backend recovered, resetting circuit breaker");
    
    // Notify user that connection is restored
    if (typeof window !== "undefined") {
      const event = new CustomEvent("ava:backend-recovered");
      window.dispatchEvent(event);
    }
  }
  circuitBreakerFailures = 0;
  circuitBreakerOpenUntil = null;
}

export async function apiFetch(input: string, options: ApiRequestOptions = {}): Promise<Response> {
  const {
    auth,
    dedupeKey,
    requestId: providedRequestId,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    baseUrl,
    metricsLabel,
    signal,
    ...fetchInit
  } = options;

  // 🎯 DIVINE: Circuit breaker check
  if (isCircuitBreakerOpen()) {
    clientLogger.warn("🔴 Circuit breaker is OPEN, rejecting request", { endpoint: input });
    throw new Error("Service temporarily unavailable. Please try again in a moment.");
  }

  const requestId =
    providedRequestId ?? (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`);
  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener(
        "abort",
        () => {
          controller.abort(signal.reason);
        },
        { once: true },
      );
    }
  }

  if (dedupeKey) {
    const previous = inflightControllers.get(dedupeKey);
    previous?.abort(createAbortError("Deduplicated by apiFetch", "AbortError"));
    inflightControllers.set(dedupeKey, controller);
  }

  const { url: endpoint, mode } = resolveEndpoint(input, baseUrl);
  const headers = buildHeaders({ ...options, auth }, requestId);

  const timeoutId = setTimeout(() => {
    controller.abort(createAbortError("Request timed out", "TimeoutError"));
  }, timeoutMs);

  const startedAt = now();

  const exec = async () =>
    fetch(endpoint, {
      ...fetchInit,
      headers,
      signal: controller.signal,
      credentials:
        fetchInit.credentials ?? (mode === "relative" ? ("same-origin" as RequestCredentials) : undefined),
    });

  let response: Response;
  try {
    response = await exec();

    // 🎯 DIVINE: Handle different error types differently
    if (response.status === 401 && auth !== false) {
      clientLogger.warn("🔑 Received 401, attempting token refresh", { requestId, endpoint });
      
      const newToken = await singleFlightRefresh();
      
      if (!newToken) {
        clientLogger.error("❌ Token refresh failed, redirecting to login");
        if (typeof window !== "undefined") {
          window.location.href = "/login?reason=session_expired";
        }
        return response;
      }
      
      // 🎯 DIVINE: Retry with new token
      clientLogger.info("✅ Token refreshed, retrying request", { requestId, endpoint });
      const retryHeaders = buildHeaders({ ...options, auth }, requestId);
      response = await fetch(endpoint, {
        ...fetchInit,
        headers: retryHeaders,
        signal: controller.signal,
        credentials:
          fetchInit.credentials ?? (mode === "relative" ? ("same-origin" as RequestCredentials) : undefined),
      });
    }

    // 🎯 DIVINE: Don't kill session on server errors (5xx)
    if (response.status >= 500) {
      recordBackendFailure();
      clientLogger.error("🔥 Server error encountered", { 
        status: response.status, 
        endpoint, 
        requestId,
        circuitBreakerFailures 
      });
    } else if (response.status >= 200 && response.status < 400) {
      // 🎯 DIVINE: Success! Reset circuit breaker
      recordBackendSuccess();
    }

    // 🎯 DIVINE: Don't disconnect on 403 (permission denied)
    if (response.status === 403) {
      clientLogger.warn("🚫 Permission denied (403), but keeping session alive", { 
        endpoint, 
        requestId 
      });
    }

  } catch (error) {
    // 🎯 DIVINE: Network errors shouldn't kill session
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        clientLogger.warn("⏱️ Request aborted", { endpoint, requestId });
      } else if (error.name === "TimeoutError") {
        clientLogger.warn("⏱️ Request timeout", { endpoint, requestId });
      } else {
        clientLogger.error("🌐 Network error", { error: error.message, endpoint, requestId });
        recordBackendFailure();
      }
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    if (dedupeKey) {
      const current = inflightControllers.get(dedupeKey);
      if (current === controller) {
        inflightControllers.delete(dedupeKey);
      }
    }
  }

  const durationMs = Math.round(now() - startedAt);
  const metricKey = metricsLabel ?? endpoint;
  recordMetrics(metricKey, {
    requestId,
    status: response.status,
    durationMs,
    dedupeKey,
  });

  clientLogger.info("apiFetch completed", {
    requestId,
    url: endpoint,
    status: response.status,
    durationMs,
    dedupeKey,
  });

  return response;
}
