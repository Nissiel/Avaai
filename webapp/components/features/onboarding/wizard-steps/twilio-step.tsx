"use client";

import { useTranslations, useLocale } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Phone, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useIntegrationsStatus } from "@/lib/hooks/use-integrations-status";
import type { OnboardingValues } from "@/lib/validations/onboarding";

interface TwilioStepProps {
  form: UseFormReturn<OnboardingValues>;
  onNext?: () => void;
}

export function TwilioStep({ form, onNext }: TwilioStepProps) {
  const t = useTranslations("onboarding.twilio");
  const locale = useLocale();
  const router = useRouter();
  const integrations = useIntegrationsStatus();
  const isLoading = integrations.isLoading;

  const isAlreadyConfigured = integrations?.twilio?.configured;

  const handleGoToSettings = () => {
    router.push(`/${locale}/settings?section=twilio&returnTo=onboarding`);
  };

  const handleSkip = async () => {
    try {
      // Mark as skipped in backend
      await fetch("/api/user/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_twilio_skipped: true }),
      });
      toast.info(t("skip.message"));
      if (onNext) onNext();
    } catch (error) {
      console.error("Failed to mark Twilio as skipped:", error);
      // Continue anyway
      if (onNext) onNext();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-3/4 bg-muted rounded"></div>
          <div className="h-4 w-1/2 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (isAlreadyConfigured) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              {t("alreadyConfigured.title")}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {t("alreadyConfigured.description")}
            </p>
            {integrations?.twilio?.phoneNumber && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-mono">
                {integrations.twilio.phoneNumber}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={onNext} size="lg">
            {t("continue")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-brand-600 mt-0.5" />
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold">{t("info.title")}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-brand-600">•</span>
                <span>{t("info.benefit1")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-600">•</span>
                <span>{t("info.benefit2")}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-brand-600">•</span>
                <span>{t("info.benefit3")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Button type="button" onClick={handleGoToSettings} size="lg" className="w-full">
          {t("configure.action")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button type="button" onClick={handleSkip} variant="outline" size="lg" className="w-full">
          {t("skip.action")}
        </Button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <p className="text-xs text-blue-700 dark:text-blue-300">{t("hint")}</p>
      </div>
    </div>
  );
}
