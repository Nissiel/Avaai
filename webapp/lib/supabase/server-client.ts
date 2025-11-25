import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabaseClientConfig, supabaseAuthEnabled } from "./env";

/**
 * Create a Supabase server client (for Route Handlers / Server Components).
 * Returns null when Supabase auth is disabled.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!supabaseAuthEnabled()) {
    return null;
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseClientConfig();
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options?: CookieOptions) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

export async function getSupabaseServerSession() {
  const client = getSupabaseServerClient();
  if (!client) return null;

  const { data, error } = await client.auth.getSession();
  if (error) {
    console.error("Supabase session fetch failed:", error.message);
    return null;
  }

  return data.session;
}
