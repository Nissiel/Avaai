import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  // Build redirect URL
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");

  if (token_hash && type) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // For recovery type, we need to pass a flag to the reset-password page
      // so it knows the session is valid
      if (type === "recovery") {
        redirectTo.searchParams.set("verified", "true");
      }
      return NextResponse.redirect(redirectTo);
    }

    // If there's an error, redirect to the page with error info
    console.error("OTP verification error:", error);
    redirectTo.searchParams.set("error", "verification_failed");
    redirectTo.searchParams.set("error_description", error.message);
    return NextResponse.redirect(redirectTo);
  }

  // No token_hash or type provided
  redirectTo.pathname = "/en/login";
  redirectTo.searchParams.set("error", "missing_token");
  return NextResponse.redirect(redirectTo);
}
