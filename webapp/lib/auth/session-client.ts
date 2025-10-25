"use client";

import type { Session } from "next-auth";

export interface AuthUserPayload {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  phone?: string | null;
  locale?: string | null;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  phone_verified?: boolean;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  user: AuthUserPayload;
}

export type AvaUser = Session["user"] & {
  id?: string;
  locale?: string | null;
  phone?: string | null;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  phone_verified?: boolean;
};

export type AvaSession = Session & {
  user: AvaUser;
  accessToken?: string;
  refreshToken?: string;
};

export const SESSION_STORAGE_KEY = "ava_active_session";

export function getBackendBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export function createSessionFromTokenResponse(response: AuthTokenResponse): AvaSession {
  const ttlSeconds = Number.isFinite(response.expires_in) && response.expires_in > 0
    ? response.expires_in
    : 15 * 60; // fallback to 15 minutes

  const expires = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  return {
    user: {
      id: response.user.id,
      name: response.user.name ?? null,
      email: response.user.email ?? null,
      image: response.user.image ?? null,
      locale: response.user.locale ?? null,
      phone: response.user.phone ?? null,
      onboarding_completed: response.user.onboarding_completed,
      onboarding_step: response.user.onboarding_step,
      phone_verified: response.user.phone_verified,
    },
    expires,
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  } as AvaSession;
}

export function persistSession(session: AvaSession | null) {
  if (typeof window === "undefined") return;

  try {
    if (!session) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn("Failed to persist session", error);
  }
}

export function loadPersistedSession(): AvaSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AvaSession;
  } catch (error) {
    console.warn("Failed to read persisted session", error);
    return null;
  }
}

export function clearPersistedSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear persisted session", error);
  }
}
