"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Callback<T extends (...args: any[]) => any> = (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>;

export interface SingleActionState {
  pending: boolean;
  runs: number;
  lastError: unknown;
  lastDurationMs: number | null;
}

export interface UseSingleActionOptions<T extends (...args: any[]) => any> {
  onError?: (error: unknown) => void;
  onSuccess?: (result: Awaited<ReturnType<T>>) => void;
  metricsLabel?: string;
}

const INITIAL_STATE: SingleActionState = {
  pending: false,
  runs: 0,
  lastError: null,
  lastDurationMs: null,
};

export function useSingleAction<T extends (...args: any[]) => any>(
  fn: T,
  options: UseSingleActionOptions<T> = {},
): { run: Callback<T>; pending: boolean; state: SingleActionState; lastError: unknown; lastDurationMs: number | null } {
  const fnRef = useRef(fn);
  const mountedRef = useRef(true);
  const inflightRef = useRef<Promise<Awaited<ReturnType<T>>> | null>(null);
  const [state, setState] = useState<SingleActionState>(INITIAL_STATE);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const updateState = useCallback((updater: (prev: SingleActionState) => SingleActionState) => {
    if (!mountedRef.current) {
      return;
    }
    setState(updater);
  }, []);

  const run: Callback<T> = useCallback(
    async (...args: Parameters<T>) => {
      // Reuse inflight promise when pending to guarantee single flight.
      if (state.pending && inflightRef.current) {
        return inflightRef.current;
      }

      updateState((prev) => ({
        ...prev,
        pending: true,
        lastError: null,
      }));

      const startedAt =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();

      const execution = (async () => {
        try {
          const result = await fnRef.current(...args);
          const durationMs = Math.round(
            (typeof performance !== "undefined" && typeof performance.now === "function"
              ? performance.now()
              : Date.now()) - startedAt,
          );
          updateState((prev) => ({
            pending: false,
            runs: prev.runs + 1,
            lastError: null,
            lastDurationMs: durationMs,
          }));

          if (options.metricsLabel && typeof window !== "undefined") {
            const globalObject = window as unknown as {
              __AVA_METRICS__?: { actions: Record<string, unknown> };
            };
            if (!globalObject.__AVA_METRICS__) {
              globalObject.__AVA_METRICS__ = { actions: {} };
            }
            globalObject.__AVA_METRICS__.actions[options.metricsLabel] = {
              runs: (globalObject.__AVA_METRICS__.actions?.[options.metricsLabel]?.runs ?? 0) + 1,
              lastDurationMs: durationMs,
              ts: new Date().toISOString(),
            };
          }

          options.onSuccess?.(result);
          return result;
        } catch (error) {
          updateState((prev) => ({
            ...prev,
            pending: false,
            lastError: error,
          }));
          options.onError?.(error);
          throw error;
        } finally {
          inflightRef.current = null;
        }
      })();

      inflightRef.current = execution;
      return execution;
    },
    [options, state.pending, updateState],
  );

  return {
    run,
    pending: state.pending,
    state,
    lastError: state.lastError,
    lastDurationMs: state.lastDurationMs,
  };
}
