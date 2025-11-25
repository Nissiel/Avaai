"use client";

import type { Session } from "@supabase/supabase-js";
import { supabaseAuthEnabled } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { AuthUserPayload, AvaSession } from "./session-client";
import { emitTokenChange } from "@/lib/hooks/use-auth-token";

type SupabaseUserMetadata = {
  name?: string;
  full_name?: string;
  phone?: string;
  locale?: string;
};

export async function supabaseSignUp(params: {
  email: string;
  password: string;
  metadata?: SupabaseUserMetadata;
}) {
  if (!supabaseAuthEnabled()) return { error: new Error("Supabase auth not enabled") };
  const client = getSupabaseBrowserClient();
  if (!client) return { error: new Error("Supabase client not initialized") };

  return client.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: params.metadata,
    },
  });
}

export async function supabaseSignIn(params: { email: string; password: string }) {
  if (!supabaseAuthEnabled()) return { error: new Error("Supabase auth not enabled") };
  const client = getSupabaseBrowserClient();
  if (!client) return { error: new Error("Supabase client not initialized") };

  return client.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });
}

export async function supabaseGetFreshSession(): Promise<Session | null> {
  if (!supabaseAuthEnabled()) return null;
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data, error } = await client.auth.getSession();
  if (error) {
    console.error("Supabase getSession error:", error.message);
    return null;
  }
  return data.session ?? null;
}

export async function fetchBackendUserWithToken(accessToken: string): Promise<AuthUserPayload | null> {
  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    if (!response.ok) {
      console.warn("Backend /me responded with", response.status);
      return null;
    }
    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name ?? null,
      image: data.image ?? null,
      phone: data.phone ?? null,
      locale: data.locale ?? null,
      onboarding_completed: data.onboarding_completed,
      onboarding_step: data.onboarding_step,
      phone_verified: data.phone_verified,
    };
  } catch (error) {
    console.error("Failed to fetch backend user:", error);
    return null;
  }
}

export function persistSupabaseSessionTokens(session: Session) {
  if (typeof window === "undefined") return;
  try {
    if (session.access_token) {
      localStorage.setItem("access_token", session.access_token);
    }
    if (session.refresh_token) {
      localStorage.setItem("refresh_token", session.refresh_token);
    }
    emitTokenChange();

    // Also persist to cookies so middleware/server routes can read the token
    const maxAge = session.expires_in ?? 60 * 15; // seconds
    const cookie = [
      `access_token=${encodeURIComponent(session.access_token)}`,
      "Path=/",
      `Max-Age=${maxAge}`,
      "SameSite=Lax",
    ].join("; ");
    document.cookie = cookie;
  } catch (error) {
    console.warn("Failed to persist Supabase session tokens", error);
  }
}

export function mapSupabaseSessionToAvaSession(session: Session, user: AuthUserPayload | null): AvaSession {
  const expiresMs =
    session.expires_at && Number.isFinite(session.expires_at)
      ? session.expires_at * 1000
      : Date.now() + (session.expires_in ?? 60 * 15) * 1000;

  return {
    user: {
      id: user?.id,
      name: user?.name ?? null,
      email: user?.email ?? null,
      image: user?.image ?? null,
      locale: user?.locale ?? null,
      phone: user?.phone ?? null,
      onboarding_completed: user?.onboarding_completed,
      onboarding_step: user?.onboarding_step,
      phone_verified: user?.phone_verified,
    },
    expires: new Date(expiresMs).toISOString(),
    accessToken: session.access_token,
    refreshToken: session.refresh_token ?? undefined,
  } as AvaSession;
}

export function requiresEmailInput(value: string): boolean {
  // Supabase email+password flow requires an email; we disallow phone-only identifiers here.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !emailRegex.test(value);
}

export { supabaseAuthEnabled };
