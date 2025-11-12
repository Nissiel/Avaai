"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * 🎯 DIVINE: Backend health monitor
 * 
 * Listens for backend health events and shows user-friendly messages:
 * - Backend temporarily unavailable (circuit breaker open)
 * - Reconnecting after errors
 * - Connection restored
 */
export function BackendHealthMonitor() {
  useEffect(() => {
    const handleBackendUnavailable = (event: CustomEvent) => {
      toast.error("Connection issue", {
        description: event.detail?.message || "We're having trouble connecting. Retrying...",
        duration: 5000,
      });
    };

    const handleBackendRecovered = () => {
      toast.success("Connection restored", {
        description: "You're back online!",
        duration: 3000,
      });
    };

    window.addEventListener("ava:backend-unavailable", handleBackendUnavailable as EventListener);
    window.addEventListener("ava:backend-recovered", handleBackendRecovered as EventListener);

    return () => {
      window.removeEventListener("ava:backend-unavailable", handleBackendUnavailable as EventListener);
      window.removeEventListener("ava:backend-recovered", handleBackendRecovered as EventListener);
    };
  }, []);

  return null;
}
