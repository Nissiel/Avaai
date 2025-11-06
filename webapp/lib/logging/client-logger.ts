"use client";

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const requestId = context?.requestId ?? "n/a";
  const payload = { ...context, level, requestId, message, ts: new Date().toISOString() };

  if (level === "error") {
    console.error(`[AVA][${requestId}] ${message}`, payload);
    return;
  }

  if (level === "warn") {
    console.warn(`[AVA][${requestId}] ${message}`, payload);
    return;
  }

  console.info(`[AVA][${requestId}] ${message}`, payload);
}

export const clientLogger = {
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
};
