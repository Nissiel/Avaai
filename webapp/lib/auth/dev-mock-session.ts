"use client";

import type { AvaSession } from "@/lib/auth/session-client";

/**
 * Development mode mock session - bypasses authentication for local development
 * Only active when NEXT_PUBLIC_DEV_BYPASS_AUTH=true
 */

export function isDevBypassEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
}

export function createDevMockSession(): AvaSession {
  // Create session that expires in 24 hours
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    user: {
      id: "dev-user-avner",
      email: "addavner@gmail.com",
      name: "Avner (Dev Mode)",
      image: null,
      locale: "en",
      phone: null,
      onboarding_completed: true,
      onboarding_step: 5,
      phone_verified: false,
    },
    expires,
    accessToken: "dev-bypass-mock-token",
    refreshToken: "dev-bypass-mock-refresh-token",
  };
}

/**
 * Initialize dev bypass session in browser storage
 * This sets up localStorage and cookies so the app behaves as if logged in
 */
export function initializeDevBypassSession(): void {
  if (typeof window === "undefined") return;
  if (!isDevBypassEnabled()) return;

  try {
    const mockSession = createDevMockSession();

    // Set localStorage
    localStorage.setItem("ava_active_session", JSON.stringify(mockSession));
    localStorage.setItem("access_token", mockSession.accessToken!);
    localStorage.setItem("refresh_token", mockSession.refreshToken!);

    // Set cookie for middleware
    const cookie = [
      `access_token=${encodeURIComponent(mockSession.accessToken!)}`,
      "Path=/",
      "Max-Age=86400", // 24 hours
      "SameSite=Lax",
    ].join("; ");
    document.cookie = cookie;

    console.log("🔓 DEV BYPASS: Mock session initialized for addavner@gmail.com");
  } catch (error) {
    console.warn("Failed to initialize dev bypass session", error);
  }
}
