"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseClientConfig, supabaseAuthEnabled } from "./env";

let browserClient: SupabaseClient | null = null;

/**
 * Lazily create a Supabase browser client.
 * Returns null when Supabase auth is disabled (feature flag not set or env missing).
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!supabaseAuthEnabled()) {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseClientConfig();
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
