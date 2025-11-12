"use client";

import { useTokenRefresh } from "@/lib/hooks/use-token-refresh";

/**
 * 🎯 DIVINE: Session manager component
 * 
 * Runs in the background to keep user sessions alive by:
 * - Auto-refreshing tokens every 10 minutes (before 15min expiry)
 * - Refreshing when tab becomes visible after being hidden
 * - Using secure HTTP-only cookies
 * 
 * This solves the "random disconnect" issue.
 */
export function SessionManager() {
  useTokenRefresh();
  return null; // This component doesn't render anything
}
