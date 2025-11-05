"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { StudioSettingsForm } from "@/components/features/settings/studio-settings-form";
import { VapiSetupBanner } from "@/components/features/vapi/vapi-setup-banner";
import { useVapiStatus } from "@/lib/hooks/use-vapi-status";
import type { StudioConfigInput } from "@/lib/validations/config";

const STUDIO_CONFIG_QUERY_KEY = ["studio-config"] as const;

async function fetchStudioConfig(): Promise<StudioConfigInput> {
  // 🔐 DIVINE: Get token from localStorage for authenticated request
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch("/api/config", {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error ?? "Failed to load studio configuration");
  }

  return response.json() as Promise<StudioConfigInput>;
}

export function AssistantsStudio() {
  const t = useTranslations("assistantsPage");
  const tHero = useTranslations("assistantsPage.hero");
  const tDesigner = useTranslations("assistantsPage.designer");

  const { hasVapiKey, isLoading: isLoadingVapi } = useVapiStatus();

  const studioConfigQuery = useQuery<StudioConfigInput>({
    queryKey: STUDIO_CONFIG_QUERY_KEY,
    queryFn: fetchStudioConfig,
    staleTime: 60_000,
  });

  return (
    <section className="space-y-10">
      <header className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-brand-500/5 p-8 shadow-elevated">
        <div className="space-y-3 max-w-2xl">
          <Badge variant="brand" className="w-fit gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            {tHero("badge")}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Créez votre Assistant IA parfait
          </h1>
        </div>
      </header>

      {/* Vapi Setup Banner - Only show if user doesn't have a key */}
      {!isLoadingVapi && !hasVapiKey && <VapiSetupBanner />}

      <div className="space-y-6">
        <StudioSettingsForm
          linkedAssistantId={studioConfigQuery.data?.vapiAssistantId ?? null}
          onLinkedAssistantChange={() => { }}
        />
      </div>
    </section>
  );
}
