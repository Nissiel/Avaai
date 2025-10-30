"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { AlertCircle, CheckCircle2, ChevronRight, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";

type SetupStatus = {
  vapi: boolean;
  twilio: boolean;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function resolveApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

async function fetchIntegrationStatus<T extends Record<string, unknown>>(
  path: string,
  token: string,
) {
  const response = await fetch(resolveApiUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Check integration status from API
async function checkSetupStatus(token?: string): Promise<SetupStatus> {
  if (!token) {
    return { vapi: false, twilio: false };
  }

  try {
    const [vapiResult, twilioResult] = await Promise.allSettled([
      fetchIntegrationStatus<{ has_vapi_key?: boolean }>("/api/v1/vapi-settings", token),
      fetchIntegrationStatus<{ has_twilio_credentials?: boolean }>("/api/v1/twilio-settings", token),
    ]);

    if (vapiResult.status === "rejected") {
      console.error("Failed to fetch Vapi status:", vapiResult.reason);
    }
    if (twilioResult.status === "rejected") {
      console.error("Failed to fetch Twilio status:", twilioResult.reason);
    }

    return {
      vapi: vapiResult.status === "fulfilled" ? !!vapiResult.value?.has_vapi_key : false,
      twilio: twilioResult.status === "fulfilled" ? !!twilioResult.value?.has_twilio_credentials : false,
    };
  } catch (error) {
    console.error("Failed to check setup status:", error);
    return { vapi: false, twilio: false };
  }
}

export function SetupReminderBanner() {
  const [dismissed, setDismissed] = useState(false);
  const locale = useLocale();
  const { session } = useSessionStore((state) => ({ session: state.session }));
  const token = session?.accessToken;

  const { data: status, isLoading } = useQuery({
    queryKey: ["setup-status", token],
    queryFn: () => checkSetupStatus(token),
    enabled: Boolean(token),
    staleTime: 30_000,
  });

  useEffect(() => {
    // Check if banner was dismissed in localStorage
    const wasDismissed = localStorage.getItem("setup_reminder_dismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("setup_reminder_dismissed", "true");
  };

  const missingSteps = useMemo(() => {
    if (!status) return [];

    const steps: Array<{ name: string; description: string; href: string }> = [];

    if (!status.vapi) {
      steps.push({
        name: "Vapi Configuration",
        description: "Connect your Vapi API key to create voice assistants",
        href: `/${locale}/settings?section=vapi`, // 🎯 DIVINE: Navigate to Settings with Vapi tab
      });
    }

    if (!status.twilio) {
      steps.push({
        name: "Twilio Configuration",
        description: "Add your Twilio credentials to enable phone calls",
        href: `/${locale}/settings?section=twilio`, // 🎯 DIVINE: Navigate to Settings with Twilio tab
      });
    }

    return steps;
  }, [status, locale]);

  // Don't show if dismissed or if everything is configured
  if (dismissed || !token || isLoading || missingSteps.length === 0) {
    return null;
  }

  const headline =
    missingSteps.length > 1 ? "Complete Your Setup" : `${missingSteps[0]!.name} Required`;
  const description =
    missingSteps.length > 1
      ? "Finish configuring these integrations to activate your AI assistant and start receiving calls."
      : "This integration is required to activate your AI assistant experience.";

  return (
    <div className="rounded-2xl border border-amber-200/50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 p-6 shadow-sm dark:border-amber-900/50 dark:from-amber-950/30 dark:to-orange-950/30">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                {headline}
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                {description}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded-lg p-1 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-900/30 dark:hover:text-amber-200"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {missingSteps.map((step) => (
              <Link
                key={step.name}
                href={step.href as any}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border border-amber-200/50 bg-white/50 p-3 transition-all hover:border-amber-300 hover:bg-white dark:border-amber-900/50 dark:bg-amber-950/20 dark:hover:border-amber-800 dark:hover:bg-amber-950/40",
                )}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                  <div className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-amber-900 dark:text-amber-100">
                    {step.name}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    {step.description}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-amber-600 transition-transform group-hover:translate-x-1 dark:text-amber-400" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Your progress has been saved. You can complete these steps anytime.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
