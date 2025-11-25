"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabaseAuthEnabled } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    // Initialize Supabase session from verified token (PKCE flow)
    const initializeSession = async () => {
      if (typeof window === "undefined") return;

      try {
        if (!supabaseAuthEnabled()) {
          setError(t("errors.supabaseNotEnabled") || "Password reset requires Supabase authentication to be enabled");
          setIsInitializing(false);
          return;
        }

        const client = getSupabaseBrowserClient();
        if (!client) {
          setError(t("errors.clientNotInitialized") || "Authentication service not available");
          setIsInitializing(false);
          return;
        }

        // Check for error in URL (e.g., expired link, verification failed)
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (errorParam) {
          setError(errorDescription || t("errors.invalidResetLink") || "Invalid or expired reset link. Please request a new one.");
          setIsInitializing(false);
          return;
        }

        // Check if we came from the /auth/confirm route (PKCE flow)
        const verified = searchParams.get("verified");

        // Also check for tokens in URL hash (implicit flow fallback)
        const hash = window.location.hash;
        const hasHashToken = hash && (hash.includes("access_token") || hash.includes("type=recovery"));

        if (verified === "true" || hasHashToken) {
          // Session should already be established by /auth/confirm route or hash
          const { data, error: sessionError } = await client.auth.getSession();

          if (sessionError) {
            console.error("Session error:", sessionError);
            setError(sessionError.message || t("errors.sessionFailed") || "Failed to verify reset token");
            setIsInitializing(false);
            return;
          }

          if (!data.session) {
            setError(t("errors.tokenExpired") || "Reset link has expired. Please request a new one.");
            setIsInitializing(false);
            return;
          }

          // Session established successfully
          setIsInitializing(false);
        } else {
          // No verification found in URL
          setError(t("errors.noResetToken") || "No recovery token found. Please request a new password reset link.");
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.error("Reset password initialization error:", err);
        setError(err.message || t("errors.initFailed") || "Failed to initialize password reset");
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [searchParams, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    if (password !== confirmPassword) {
      setError(t("errors.passwordsMismatch") || "Passwords do not match");
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      setError(t("errors.passwordRequirements") || "Password does not meet requirements");
      return;
    }

    setIsLoading(true);

    try {
      if (!supabaseAuthEnabled()) {
        throw new Error(t("errors.supabaseNotEnabled") || "Supabase auth is not enabled");
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        throw new Error(t("errors.clientNotInitialized") || "Supabase client not initialized");
      }

      // Update the user's password using the established session
      const { error: updateError } = await client.auth.updateUser({
        password: password,
      });

      if (updateError) {
        // Map common errors
        if (updateError.message.toLowerCase().includes("same as")) {
          throw new Error(t("errors.samePassword") || "New password must be different from your current password");
        }
        throw updateError;
      }

      // Sign out to clear the recovery session
      await client.auth.signOut();

      setIsSuccess(true);
      toast.success(t("resetPassword.success") || "Password updated successfully!", {
        description: t("resetPassword.canLogin") || "You can now log in with your new password.",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(`/${locale}/login?reset=success`);
      }, 3000);

    } catch (err: any) {
      console.error("Password reset error:", err);
      const message = err.message || t("errors.resetFailed") || "Failed to reset password";
      setError(message);
      toast.error(t("errors.title") || "Error", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">
          {t("resetPassword.verifying") || "Verifying your reset link..."}
        </p>
      </div>
    );
  }

  // Show error state if token is invalid
  if (error && !password) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{t("resetPassword.invalidLink") || "Invalid Reset Link"}</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Link
          href={`/${locale}/forgot-password`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          {t("resetPassword.requestNew") || "Request a new reset link"}
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t("resetPassword.successTitle") || "Password Reset Successful!"}</h2>
          <p className="text-sm text-muted-foreground">
            {t("resetPassword.redirecting") || "Your password has been updated. Redirecting to login..."}
          </p>
        </div>
        <Link
          href={`/${locale}/login`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          {t("resetPassword.goToLogin") || "Go to login now"}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          {t("resetPassword.newPassword") || "New Password"}
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("resetPassword.enterNewPassword") || "Enter new password"}
            required
            disabled={isLoading}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Password strength indicators */}
        <div className="space-y-1 text-xs">
          <div className={hasMinLength ? "text-success" : "text-muted-foreground"}>
            {hasMinLength ? "✓" : "○"} {t("passwordRequirements.minLength") || "At least 8 characters"}
          </div>
          <div className={hasUppercase ? "text-success" : "text-muted-foreground"}>
            {hasUppercase ? "✓" : "○"} {t("passwordRequirements.uppercase") || "One uppercase letter"}
          </div>
          <div className={hasLowercase ? "text-success" : "text-muted-foreground"}>
            {hasLowercase ? "✓" : "○"} {t("passwordRequirements.lowercase") || "One lowercase letter"}
          </div>
          <div className={hasNumber ? "text-success" : "text-muted-foreground"}>
            {hasNumber ? "✓" : "○"} {t("passwordRequirements.number") || "One number"}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          {t("resetPassword.confirmPassword") || "Confirm Password"}
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("resetPassword.confirmNewPassword") || "Confirm new password"}
            required
            disabled={isLoading}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {confirmPassword && (
          <div className={passwordsMatch ? "text-success text-xs" : "text-destructive text-xs"}>
            {passwordsMatch
              ? `✓ ${t("resetPassword.passwordsMatch") || "Passwords match"}`
              : `✗ ${t("errors.passwordsMismatch") || "Passwords do not match"}`}
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-11"
        disabled={isLoading || !hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !passwordsMatch}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("resetPassword.updating") || "Updating..."}
          </>
        ) : (
          t("resetPassword.resetButton") || "Reset Password"
        )}
      </Button>

      <Link
        href={`/${locale}/login`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("resetPassword.backToLogin") || "Back to login"}
      </Link>
    </form>
  );
}
