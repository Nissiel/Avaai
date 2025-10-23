"use client";

import { useCallback } from "react";
import { usePostHog } from "posthog-js/react";

export type AnalyticsEvent =
  | "onboarding_completed"
  | "ava_voice_preview"
  | "call_answered"
  | "call_missed"
  | "summary_sent"
  | "twilio_number_purchased"
  | "integration_connected";

export function useAnalytics() {
  const posthog = usePostHog();

  const track = useCallback(
    (event: AnalyticsEvent, properties?: Record<string, unknown>) => {
      if (!posthog) return;
      posthog.capture(event, properties);
    },
    [posthog],
  );

  return {
    track,
  };
}
