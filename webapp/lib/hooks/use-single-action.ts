"use client";

import { useCallback, useRef, useState } from "react";

type SingleActionRunner<TArgs extends unknown[]> = (...args: TArgs) => Promise<unknown> | unknown;

interface UseSingleActionOptions {
  onError?: (error: unknown) => void;
  label?: string;
}

interface UseSingleActionResult<TArgs extends unknown[]> {
  run: (...args: TArgs) => Promise<void>;
  pending: boolean;
  lastError: unknown;
}

/**
 * Ensures a handler executes only once at a time even if the user spam-clicks.
 * Any additional calls while the action is pending are ignored.
 */
export function useSingleAction<TArgs extends unknown[]>(
  action: SingleActionRunner<TArgs>,
  { onError, label }: UseSingleActionOptions = {},
): UseSingleActionResult<TArgs> {
  const inFlightRef = useRef(false);
  const actionLabel = label ?? action.name ?? "single-action";
  const [pending, setPending] = useState(false);
  const [lastError, setLastError] = useState<unknown>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      if (inFlightRef.current) {
        console.info(`[useSingleAction] Ignored re-entry for ${actionLabel}`);
        return;
      }

      inFlightRef.current = true;
      setPending(true);
      setLastError(null);

      try {
        await action(...args);
      } catch (error) {
        setLastError(error);
        onError?.(error);
        throw error;
      } finally {
        inFlightRef.current = false;
        setPending(false);
      }
    },
    [action, actionLabel, onError],
  );

  return { run, pending, lastError };
}
