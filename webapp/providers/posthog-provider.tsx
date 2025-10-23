"use client";

import posthog from "posthog-js";
import { PostHogProvider as ReactPostHogProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

export function PostHogProvider({ children }: React.PropsWithChildren) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    posthog.init(apiKey, {
      api_host: apiHost,
      capture_pageview: false,
    });

    return () => {
      const anyPosthog = posthog as { reset?: () => void };
      anyPosthog.reset?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) return;
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname, searchParams, apiKey]);

  if (!apiKey) {
    return <>{children}</>;
  }

  return <ReactPostHogProvider client={posthog}>{children}</ReactPostHogProvider>;
}
