"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { AlertCircle, CheckCircle2, ChevronRight, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// Check integration status from API
async function checkSetupStatus() {
  try {
    const [vapiRes, twilioRes] = await Promise.all([
      fetch("/api/v1/vapi-settings").then(r => r.ok ? r.json() : null),
      fetch("/api/v1/twilio-settings").then(r => r.ok ? r.json() : null),
    ]);

    return {
      vapi: !!vapiRes?.has_vapi_key,
      twilio: !!twilioRes?.has_twilio_credentials,
    };
  } catch (error) {
    console.error("Failed to check setup status:", error);
    return { vapi: false, twilio: false };
  }
}

export function SetupReminderBanner() {
  const [dismissed, setDismissed] = useState(false);
  const locale = useLocale();

  const { data: status } = useQuery({
    queryKey: ["setup-status"],
    queryFn: checkSetupStatus,
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

  // Don't show if dismissed or if everything is configured
  if (dismissed || (status?.vapi && status?.twilio)) {
    return null;
  }

  const missingSteps = [];
  if (!status?.vapi) {
    missingSteps.push({
      name: "Vapi Configuration",
      description: "Connect your Vapi API key to create voice assistants",
      href: `/${locale}/settings?section=vapi`, // 🎯 DIVINE: Navigate to Settings with Vapi tab
    });
  }
  if (!status?.twilio) {
    missingSteps.push({
      name: "Twilio Configuration",
      description: "Add your Twilio credentials to enable phone calls",
      href: `/${locale}/settings?section=twilio`, // 🎯 DIVINE: Navigate to Settings with Twilio tab
    });
  }

  if (missingSteps.length === 0) {
    return null;
  }

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
                Complete Your Setup
              </h3>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                Finish configuring these integrations to activate your AI assistant and start receiving calls.
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
                className="group flex items-center gap-3 rounded-xl border border-amber-200/50 bg-white/50 p-3 transition-all hover:border-amber-300 hover:bg-white dark:border-amber-900/50 dark:bg-amber-950/20 dark:hover:border-amber-800 dark:hover:bg-amber-950/40"
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
