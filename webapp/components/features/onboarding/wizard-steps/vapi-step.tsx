"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm, type UseFormReturn } from "react-hook-form";
import { Zap, Settings, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useIntegrationsStatus } from "@/lib/hooks/use-integrations-status";
import { saveVapiSettings } from "@/lib/api/vapi-settings";
import type { OnboardingValues } from "@/lib/validations/onboarding";

interface VapiStepProps {
  form: UseFormReturn<OnboardingValues>;
  onNext?: () => void;
}

export function VapiStep({ form, onNext }: VapiStepProps) {
  const t = useTranslations("onboarding.vapi");
  const locale = useLocale();
  const router = useRouter();
  const integrations = useIntegrationsStatus();
  const isLoading = integrations.isLoading;
  const [selectedOption, setSelectedOption] = useState<"inline" | "settings" | "skip">("inline");
  const [vapiKey, setVapiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isAlreadyConfigured = integrations?.vapi?.configured;

  const handleSaveInline = async () => {
    if (!vapiKey || vapiKey.length < 10) {
      toast.error(t("step1.errors.required"));
      return;
    }

    setIsSaving(true);
    try {
      await saveVapiSettings(vapiKey.trim());
      toast.success(t("step1.success"));
      integrations.invalidate?.();
      if (onNext) onNext();
    } catch (error) {
      console.error("Failed to save Vapi key:", error);
      toast.error(
        error instanceof Error ? error.message : t("step1.errors.save"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToSettings = () => {
    router.push(`/${locale}/settings?section=vapi&returnTo=onboarding`);
  };

  const handleSkip = async () => {
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ onboarding_vapi_skipped: true }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Failed to update onboarding status");
      }

      toast.info(t("step3.skipped"));
      integrations.invalidate?.();
      if (onNext) onNext();
    } catch (error) {
      console.error("Failed to mark Vapi as skipped:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("step3.error", { defaultValue: "Unable to skip for now." }),
      );
      return;
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

      <RadioGroup value={selectedOption} onValueChange={(v) => setSelectedOption(v as typeof selectedOption)}>
        {/* Option 1: Configuration rapide */}
        <div className="relative flex items-start space-x-3 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="inline" id="option-inline" className="mt-1" />
          <div className="flex-1 space-y-3">
            <Label htmlFor="option-inline" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-600" />
                <span className="font-semibold">{t("step1.title")}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t("step1.description")}</p>
            </Label>
            {selectedOption === "inline" && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="vapi-key">{t("step1.input.label")}</Label>
                  <Input
                    id="vapi-key"
                    type="password"
                    placeholder={t("step1.input.placeholder")}
                    value={vapiKey}
                    onChange={(e) => setVapiKey(e.target.value)}
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">{t("step1.input.hint")}</p>
                </div>
                <Button type="button" onClick={handleSaveInline} disabled={isSaving || !vapiKey}>
                  {isSaving ? t("step1.saving") : t("step1.save")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Option 2: Settings avancés */}
        <div className="relative flex items-start space-x-3 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="settings" id="option-settings" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="option-settings" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span className="font-semibold">{t("step2.title")}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t("step2.description")}</p>
            </Label>
            {selectedOption === "settings" && (
              <div className="pt-3">
                <Button type="button" onClick={handleGoToSettings} variant="secondary">
                  {t("step2.action")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Option 3: Passer cette étape */}
        <div className="relative flex items-start space-x-3 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
          <RadioGroupItem value="skip" id="option-skip" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="option-skip" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold">{t("step3.title")}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t("step3.description")}</p>
            </Label>
            {selectedOption === "skip" && (
              <div className="pt-3">
                <Button type="button" onClick={handleSkip} variant="outline">
                  {t("step3.action")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </RadioGroup>

      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <p className="text-xs text-blue-700 dark:text-blue-300">{t("info")}</p>
      </div>
    </div>
  );
}
