"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabaseAuthEnabled } from "@/lib/supabase/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!supabaseAuthEnabled()) {
        throw new Error(t("errors.supabaseNotEnabled") || "Password reset requires Supabase authentication to be enabled");
      }

      const client = getSupabaseBrowserClient();
      if (!client) {
        throw new Error(t("errors.clientNotInitialized") || "Authentication service not available");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error(t("errors.invalidEmail") || "Please enter a valid email address");
      }

      // Get the current origin for the redirect URL
      const redirectTo = `${window.location.origin}/${locale}/reset-password`;

      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        // Map Supabase errors to user-friendly messages
        if (error.message.toLowerCase().includes("rate limit")) {
          throw new Error(t("errors.rateLimited") || "Too many requests. Please wait a few minutes before trying again.");
        }
        throw error;
      }

      setIsSuccess(true);
      toast.success(t("forgotPassword.emailSent") || "Email sent!", {
        description: t("forgotPassword.checkInbox") || "Check your inbox for the password reset link.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(t("errors.title") || "Error", {
        description: error.message || t("errors.resetFailed") || "Failed to send reset email. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t("forgotPassword.checkEmail") || "Check your email"}</h2>
          <p className="text-sm text-muted-foreground">
            {t("forgotPassword.sentTo") || "We've sent a password reset link to"}{" "}
            <strong>{email}</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("forgotPassword.checkSpam") || "If you don't see the email, check your spam folder."}
          </p>
        </div>
        <Link
          href={`/${locale}/login`}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("forgotPassword.backToLogin") || "Back to login"}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          {t("fields.email") || "Email"}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholders.email") || "your@email.com"}
            required
            disabled={isLoading}
            className="h-11 pl-10"
          />
        </div>
      </div>

      <Button type="submit" className="w-full h-11" disabled={isLoading || !email}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("forgotPassword.sending") || "Sending..."}
          </>
        ) : (
          t("forgotPassword.resetPassword") || "Reset password"
        )}
      </Button>

      <Link
        href={`/${locale}/login`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("forgotPassword.backToLogin") || "Back to login"}
      </Link>
    </form>
  );
}
