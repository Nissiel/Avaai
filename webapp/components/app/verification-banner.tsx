"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Mail, Phone, Shield, X, Loader2 } from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VerificationStatus {
  email: string | null;
  email_verified: boolean;
  phone: string | null;
  phone_verified: boolean;
}

export function VerificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);
  const locale = useLocale();
  const t = useTranslations("verification");
  const session = useSessionStore((state) => state.session);

  // Fetch verification status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;

        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/auth/verification-status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (error) {
        console.error("Failed to fetch verification status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [session]);

  // Check if banner was dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem("verification_banner_dismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("verification_banner_dismissed", "true");
  };

  const handleResendEmail = async () => {
    if (!status?.email) return;

    setResendingEmail(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("/api/auth/resend-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: status.email }),
      });

      if (response.ok) {
        toast.success(t("emailSent") || "Verification email sent", {
          description: t("checkInbox") || "Check your inbox for the verification link.",
        });
      } else {
        throw new Error("Failed to send verification email");
      }
    } catch (error) {
      toast.error(t("emailFailed") || "Failed to send email", {
        description: t("tryAgain") || "Please try again later.",
      });
    } finally {
      setResendingEmail(false);
    }
  };

  // Don't show if dismissed, loading, or everything is verified
  if (dismissed || isLoading || !status) {
    return null;
  }

  const needsEmailVerification = !status.email_verified && status.email;
  const needsPhoneVerification = !status.phone_verified && status.phone;

  // If everything is verified, don't show banner
  if (!needsEmailVerification && !needsPhoneVerification) {
    return null;
  }

  const itemCount = (needsEmailVerification ? 1 : 0) + (needsPhoneVerification ? 1 : 0);
  const headline = itemCount > 1
    ? (t("verifyAccount") || "Verify Your Account")
    : needsEmailVerification
      ? (t("verifyEmail") || "Verify Your Email")
      : (t("verifyPhone") || "Verify Your Phone");

  const description = itemCount > 1
    ? (t("verifyBothDescription") || "Complete your account security by verifying your email and phone number.")
    : needsEmailVerification
      ? (t("verifyEmailDescription") || "Verify your email address to secure your account and receive important notifications.")
      : (t("verifyPhoneDescription") || "Verify your phone number for additional account security.");

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium">
                {headline}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {description}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {needsEmailVerification && (
              <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {t("emailVerification") || "Email Verification"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {status.email}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  className="h-8 text-xs"
                >
                  {resendingEmail ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      {t("sending") || "Sending..."}
                    </>
                  ) : (
                    t("resendEmail") || "Resend"
                  )}
                </Button>
              </div>
            )}

            {needsPhoneVerification && (
              <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">
                    {t("phoneVerification") || "Phone Verification"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {status.phone}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.location.href = `/${locale}/settings?section=profile`;
                  }}
                  className="h-8 text-xs"
                >
                  {t("verifyNow") || "Verify"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
