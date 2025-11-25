export function supabaseAuthEnabled(): boolean {
  // Access NEXT_PUBLIC_* variables directly for client-side compatibility
  const enabled = process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH === "true";
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return enabled && hasUrl && hasKey;
}

export function getSupabaseClientConfig(requireEnabled = true): { supabaseUrl: string; supabaseAnonKey: string } {
  if (requireEnabled && !supabaseAuthEnabled()) {
    throw new Error("Supabase auth is not enabled. Set NEXT_PUBLIC_ENABLE_SUPABASE_AUTH=true to use Supabase auth.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase client env config is missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabaseServerSecrets(): {
  serviceRoleKey?: string;
  jwtSecret?: string;
} {
  return {
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  };
}
