"use client";

import { useEffect, useRef } from "react";
import { clientLogger } from "@/lib/logging/client-logger";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // Refresh every 10 minutes (access token expires in 15)
const VISIBILITY_REFRESH_DELAY_MS = 2000; // Wait 2s after tab becomes visible before refreshing

/**
 * 🎯 DIVINE: Auto-refresh access token in the background
 * 
 * This hook ensures the user's session stays active by:
 * 1. Refreshing the access token every 10 minutes (before 15min expiry)
 * 2. Refreshing when the tab becomes visible again (after being hidden)
 * 3. Using HTTP-only cookies for security (no localStorage exposure)
 * 
 * This prevents the "random disconnect" issue where users had to hard refresh.
 */
export function useTokenRefresh() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const refreshToken = async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
        });

        if (response.ok) {
          clientLogger.info("✅ Token refreshed successfully");
        } else {
          clientLogger.warn("⚠️ Token refresh returned non-OK status", {
            status: response.status,
          });
        }
      } catch (error) {
        clientLogger.error("❌ Token refresh failed", { error });
      }
    };

    // Start periodic refresh
    intervalRef.current = setInterval(refreshToken, REFRESH_INTERVAL_MS);

    // Refresh when tab becomes visible (user returns)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Clear any pending visibility timeout
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }

        // Refresh after a short delay to avoid race conditions
        visibilityTimeoutRef.current = setTimeout(refreshToken, VISIBILITY_REFRESH_DELAY_MS);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
