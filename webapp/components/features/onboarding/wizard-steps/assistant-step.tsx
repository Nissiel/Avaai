"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Sparkles, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useIntegrationsStatus } from "@/lib/hooks/use-integrations-status";
import type { OnboardingValues } from "@/lib/validations/onboarding";

interface AssistantStepProps {
  form: UseFormReturn<OnboardingValues>;
  onNext?: () => void;
  onBack?: () => void;
}

const DEFAULT_VOICES = [
  { provider: "azure", voiceId: "en-US-JennyNeural", name: "Jenny (English)" },
  { provider: "azure", voiceId: "fr-FR-DeniseNeural", name: "Denise (French)" },
  { provider: "azure", voiceId: "he-IL-HilaNeural", name: "Hila (Hebrew)" },
];

export function AssistantStep({ form, onNext, onBack }: AssistantStepProps) {
  const t = useTranslations("onboarding.assistant");
  const integrations = useIntegrationsStatus();
  const isLoading = integrations.isLoading;

  const [assistantName, setAssistantName] = useState("Ava Assistant");
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICES[0].voiceId);
  const [isCreating, setIsCreating] = useState(false);

  const vapiConfigured = integrations?.vapi?.configured;

  const handleCreateAssistant = async () => {
    if (!vapiConfigured) {
      toast.error(t("blocked.vapiRequired"));
      return;
    }

    if (!assistantName || assistantName.trim().length < 2) {
      toast.error(t("form.name.error"));
      return;
    }

    setIsCreating(true);
    try {
      // Get the selected voice object
      const voice = DEFAULT_VOICES.find((v) => v.voiceId === selectedVoice) || DEFAULT_VOICES[0];

      // 🎯 DIVINE: Get token from localStorage for authenticated request
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      
      if (!token) {
        toast.error("Authentication required. Please login first.");
        return;
      }

      const payload = {
        name: assistantName,
        voice_provider: voice.provider,
        voice_id: voice.voiceId,
        first_message: t("defaults.firstMessage", { name: assistantName }),
        model_provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 250,
        metadata: {
          created_from: "onboarding",
        },
      };

      console.log("🚀 Creating assistant with payload:", payload);

      // 🎯 DIVINE: Call Python backend directly with auth
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/assistants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Create assistant response:", response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        console.error("❌ Failed to create assistant:", error);
        throw new Error(error.detail || "Failed to create assistant");
      }

      const result = await response.json();
      console.log("✅ Assistant created:", result);

      // Mark assistant as created
      try {
        await fetch("/api/user/onboarding", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ onboarding_assistant_created: true }),
        });
      } catch (onboardingError) {
        console.warn("⚠️ Failed to update onboarding status:", onboardingError);
        // Don't fail the whole flow if this fails
      }

      toast.success(t("success.created", { name: assistantName }));
      if (onNext) onNext();
    } catch (error) {
      console.error("Failed to create assistant:", error);
      toast.error(t("form.error"));
    } finally {
      setIsCreating(false);
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

  // Block if Vapi not configured
  if (!vapiConfigured) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>

        <div className="flex items-start gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-950">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div className="flex-1 space-y-3">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
              {t("blocked.title")}
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {t("blocked.description")}
            </p>
            <Button type="button" onClick={onBack} variant="outline" className="mt-3">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("blocked.action")}
            </Button>
          </div>
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

      <div className="flex items-start gap-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-green-900 dark:text-green-100">
            {t("preview.title")}
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            {t("preview.description")}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-border p-6">
        <div className="space-y-2">
          <Label htmlFor="assistant-name">{t("form.name.label")}</Label>
          <Input
            id="assistant-name"
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
            placeholder={t("form.name.placeholder")}
            disabled={isCreating}
          />
          <p className="text-xs text-muted-foreground">{t("form.name.hint")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice-select">{t("form.voice.label")}</Label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isCreating}>
            <SelectTrigger id="voice-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_VOICES.map((voice) => (
                <SelectItem key={voice.voiceId} value={voice.voiceId}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("form.voice.hint")}</p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>{t("defaults.model")}:</strong> GPT-4o Mini
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            <strong>{t("defaults.temperature")}:</strong> 0.7
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" onClick={onBack} variant="outline" size="lg" disabled={isCreating}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
        <Button type="button" onClick={handleCreateAssistant} size="lg" disabled={isCreating}>
          <Sparkles className="mr-2 h-4 w-4" />
          {isCreating ? t("form.creating") : t("form.create")}
        </Button>
      </div>
    </div>
  );
}
