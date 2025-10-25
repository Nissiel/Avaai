"use client";

import { useEffect } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

import {
  type AvaSession,
  getBackendBaseUrl,
  loadPersistedSession,
  persistSession,
} from "@/lib/auth/session-client";
import { useSessionStore } from "@/stores/session-store";

type SessionProviderProps = React.PropsWithChildren<{
  session?: Session | null;
}>;

export function SessionProvider({ children, session }: SessionProviderProps) {
  const { session: sessionValue, setSession } = useSessionStore((state) => ({
    session: state.session,
    setSession: state.setSession,
  }));

  useEffect(() => {
    let active = true;

    const applySession = (value: AvaSession | null) => {
      if (!active) return;
      setSession(value);
      persistSession(value);
    };

    const bootstrap = async () => {
      if (session) {
        applySession(session as AvaSession);
        return;
      }

      if (typeof window === "undefined") {
        applySession(null);
        return;
      }

      const cached = loadPersistedSession();
      if (cached) {
        applySession(cached);
        return;
      }

      const accessToken = window.localStorage.getItem("access_token");
      if (!accessToken) {
        applySession(null);
        return;
      }

      try {
        const response = await fetch(`${getBackendBaseUrl()}/api/v1/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load current user (status ${response.status})`);
        }

        const data = await response.json();
        const refreshToken = window.localStorage.getItem("refresh_token") ?? undefined;
        const hydratedSession: AvaSession = {
          user: {
            id: data.id,
            name: data.name ?? null,
            email: data.email ?? null,
            image: data.image ?? null,
            locale: data.locale ?? null,
            phone: data.phone ?? null,
            onboarding_completed: data.onboarding_completed,
            onboarding_step: data.onboarding_step,
            phone_verified: data.phone_verified,
          },
          accessToken,
          refreshToken,
          expires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        };

        applySession(hydratedSession);
      } catch (error) {
        console.warn("Session bootstrap failed:", error);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("access_token");
          window.localStorage.removeItem("refresh_token");
          window.localStorage.removeItem("remember_me");
        }
        applySession(null);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [session, setSession]);

  return <NextAuthSessionProvider session={sessionValue ?? undefined}>{children}</NextAuthSessionProvider>;
}
