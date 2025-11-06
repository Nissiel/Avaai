const SYNC_ROUTE = "/api/studio/sync-vapi";

/**
 * 🔥 DIVINE: Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1);
        console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

function withTimeout(init: RequestInit = {}, timeoutMs = 20_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    ...init,
    signal: controller.signal,
    cleanup: () => clearTimeout(timeout),
  } as RequestInit & { cleanup: () => void };
}

export async function syncStudioConfigToVapi() {
  return retryWithBackoff(async () => {
    const request = withTimeout({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });

    try {
      const response = await fetch(SYNC_ROUTE, request);

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.detail || detail.error || `HTTP ${response.status}`);
      }

      return response.json();
    } finally {
      request.cleanup();
    }
  });
}
