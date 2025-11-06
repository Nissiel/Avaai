"use client";

import { useEffect, useRef } from "react";

type MetricsBucket = {
  renders: Record<string, { count: number; lastAt: string }>;
};

export function useRenderDiagnostics(label: string): number {
  const countRef = useRef(0);
  countRef.current += 1;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const globalObject = window as unknown as { __AVA_METRICS__?: MetricsBucket };
    if (!globalObject.__AVA_METRICS__) {
      globalObject.__AVA_METRICS__ = { renders: {} };
    }

    const entry = globalObject.__AVA_METRICS__.renders[label] ?? { count: 0, lastAt: "" };
    entry.count = countRef.current;
    entry.lastAt = new Date().toISOString();
    globalObject.__AVA_METRICS__.renders[label] = entry;

    if (process.env.NODE_ENV !== "production" && entry.count > 3) {
      console.warn(`[AVA][renders] ${label} rendered ${entry.count} times`, entry);
    }
  });

  return countRef.current;
}
