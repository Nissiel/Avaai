type SafeParseOptions<T> = {
  fallback?: T | null;
  context?: string;
  onError?: (error: unknown, raw: string) => T | null;
};

export function safeJsonParse<T = unknown>(
  text: string | null | undefined,
  options: SafeParseOptions<T> = {},
): T | null {
  if (!text) {
    return options.fallback ?? null;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    if (options.context) {
      console.error(`[safeJsonParse:${options.context}]`, error, text);
    } else {
      console.error("safeJsonParse failed", error, text);
    }

    if (options.onError) {
      try {
        return options.onError(error, text);
      } catch (handlerError) {
        console.error("safeJsonParse onError handler failed", handlerError);
      }
    }

    return options.fallback ?? null;
  }
}
