"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, RefreshCcw, RotateCcw, Save, Sparkles,
  Bot, Mic, MessageSquare, Zap, Check, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GlassCard } from "@/components/ui/glass-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LabeledSlider } from "@/components/ui/labeled-slider";
import { createStudioConfigSchema, type StudioConfigInput } from "@/lib/validations/config";
import { Badge } from "@/components/ui/badge";
import { backendConfig } from "@/services/backend-service";
import { refreshAccessToken } from "@/lib/auth/session-client";
import {
  PERSONA_PROMPTS,
  PERSONA_LABELS,
  PERSONA_DESCRIPTIONS,
  getPersonaFirstMessage,
  getPersonaSettings,
  type PersonaType,
} from "@/lib/constants/persona-prompts";

const TIMEZONE_OPTIONS = ["europe/paris", "america/new_york", "asia/tokyo"] as const;
const LANGUAGE_OPTIONS = ["fr", "en", "es"] as const;
const PERSONA_OPTIONS = ["secretary", "concierge", "sdr", "cs"] as const;
const TONE_OPTIONS = ["warm", "professional", "energetic"] as const;
const AI_MODEL_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o", description: "⚡ Best for French & phone calls - Fast + Smart" },
  { value: "gpt-4", label: "GPT-4", description: "Most capable, best quality" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Fast GPT-4 with lower latency" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Faster, lower cost" },
] as const;
const VOICE_PROVIDER_OPTIONS = [
  { value: "11labs", label: "ElevenLabs" },
  { value: "playht", label: "PlayHT" },
] as const;

// Pricing per minute (approximate costs)
const PRICING = {
  models: {
    "gpt-4o": 0.012, // ~$0.012/min for typical phone conversation
    "gpt-4": 0.024, // ~$0.024/min
    "gpt-4-turbo": 0.018, // ~$0.018/min
    "gpt-3.5-turbo": 0.003, // ~$0.003/min
  },
  voices: {
    // 🔥 Azure Neural Voices (BEST quality, low cost)
    "fr-FR-DeniseNeural": 0.016, // Azure TTS standard pricing
    "fr-FR-HenriNeural": 0.016, // Azure TTS standard pricing
    // ElevenLabs turbo voices
    "XB0fDUnXU5powFXDhCwa": 0.30, // Charlotte
    "EXAVITQu4vr4xnSDxMaL": 0.30, // Bella
    "21m00Tcm4TlvDq8ikWAM": 0.30, // Rachel
    "pNInz6obpgDQGcFmaJgB": 0.30, // Adam
    "TxGEqnHWrfWFTfGW9XjX": 0.30, // Josh
    "MF3mGyEYCl7XYWbV9V6O": 0.30, // Elli
    "onwK4e9ZLuTAKqWW03F9": 0.30, // Daniel (Hebrew)
    "pqHfZKP75CvOlQylNhV4": 0.30, // Sarah (Hebrew)
    // Premium voices
    "VR6AewLTigWG4xSOukaG": 0.48, // Thomas
    "ErXwobaYiN019PkySvjV": 0.48, // Antoine
  },
  platform: 0.05, // Vapi platform fee per minute
} as const;

type StudioConfigResponse = StudioConfigInput;

export interface StudioSettingsFormProps {
  linkedAssistantId?: string | null;
  onLinkedAssistantChange?: (assistantId: string | null) => void;
}

export function StudioSettingsForm({
  linkedAssistantId,
  onLinkedAssistantChange,
}: StudioSettingsFormProps = {}) {
  const t = useTranslations("settingsPage.studio");
  const tActions = useTranslations("settingsPage.studio.actions");
  const tMessages = useTranslations("settingsPage.studio.messages");
  const queryClient = useQueryClient();

  const localizedSchema = useMemo(
    () => createStudioConfigSchema((key, params) => t(key, params as any)),
    [t],
  );

  const configQuery = useQuery<StudioConfigResponse>({
    queryKey: ["studio-config"],
    queryFn: async () => {
      // 🎯 DIVINE: Get token from localStorage for authenticated request
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("/api/config", {
        headers,
      });

      // 🎯 DIVINE: If 401, try to refresh token automatically
      if (response.status === 401) {
        console.log("⚠️ Studio Config: 401 Unauthorized - Attempting token refresh...");
        
        const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
        if (refreshToken) {
          const newAccessToken = await refreshAccessToken(refreshToken);
          
          if (newAccessToken) {
            console.log("✅ Studio Config: Token refreshed! Retrying...");
            
            // Retry the request with new token
            const retryResponse = await fetch("/api/config", {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newAccessToken}`,
              },
            });
            
            if (retryResponse.ok) {
              return retryResponse.json();
            }
          }
        }
        
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error ?? tMessages("error"));
      }
      return response.json();
    },
    staleTime: 60_000,
  });

  const form = useForm<StudioConfigInput>({
    resolver: zodResolver(localizedSchema),
    defaultValues: configQuery.data || {
      // Provide sensible defaults while loading
      organizationName: "",
      adminEmail: "",
      timezone: "Europe/Paris",
      language: "fr",
      persona: "secretary",
      tone: "warm",
      guidelines: "",
      phoneNumber: "",
      businessHours: "09:00-18:00",
      fallbackEmail: "",
      summaryEmail: "",
      smtpServer: "",
      smtpPort: "587",
      smtpUsername: "",
      smtpPassword: "",
      aiModel: "gpt-4o", // ⚡ Best for French & phone calls
      aiTemperature: 0.7, // 🔥 DIVINE: Changed to 0.7
      aiMaxTokens: 200, // 🔥 DIVINE: Changed to 200
      voiceProvider: "azure", // 🎤 ULTRA DIVINE: Azure Neural = Most natural
      voiceId: "fr-FR-DeniseNeural", // Denise Neural - Ultra natural French
      voiceSpeed: 1.0, // Normal speed for natural flow
      transcriberProvider: "deepgram", // 🎧 Speech-to-Text
      transcriberModel: "nova-2", // Best accuracy
      transcriberLanguage: "fr", // French
      systemPrompt: "You are AVA, a professional AI assistant.",
      firstMessage: "Hello! I'm AVA.",
      askForName: true,
      askForEmail: false,
      askForPhone: false,
      vapiAssistantId: null,
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (configQuery.data) {
      console.log("📥 Config Data Loaded:", configQuery.data);
      form.reset(configQuery.data);
      if (typeof linkedAssistantId === "undefined") {
        onLinkedAssistantChange?.(configQuery.data.vapiAssistantId ?? null);
      }
    }
  }, [configQuery.data, form, linkedAssistantId, onLinkedAssistantChange]);

  useEffect(() => {
    if (typeof linkedAssistantId === "undefined") {
      return;
    }
    const currentValue = form.getValues("vapiAssistantId");
    if (linkedAssistantId !== currentValue) {
      form.setValue("vapiAssistantId", linkedAssistantId, {
        shouldDirty: linkedAssistantId !== configQuery.data?.vapiAssistantId,
        shouldTouch: true,
      });
    }
  }, [linkedAssistantId, configQuery.data?.vapiAssistantId, form]);

  // 💰 Real-time cost calculator
  const estimatedCost = useMemo(() => {
    const aiModel = form.watch("aiModel");
    const voiceId = form.watch("voiceId");

    const modelCost = PRICING.models[aiModel as keyof typeof PRICING.models] || 0.012;
    const voiceCost = PRICING.voices[voiceId as keyof typeof PRICING.voices] || 0.30;
    const platformCost = PRICING.platform;

    const total = modelCost + voiceCost + platformCost;

    return {
      total: total.toFixed(3),
      breakdown: {
        model: modelCost.toFixed(3),
        voice: voiceCost.toFixed(3),
        platform: platformCost.toFixed(3),
      },
    };
  }, [form.watch("aiModel"), form.watch("voiceId")]);

  const updateMutation = useMutation<{ success?: boolean; config?: StudioConfigInput }, Error, StudioConfigInput>({
    mutationFn: async (values) => {
      console.log("🚀 Studio Config Update Starting:", values);
      localizedSchema.parse(values);

      // 🎯 DIVINE: Get token from localStorage
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // 1. Save to database
      const response = await fetch("/api/config", {
        method: "POST",
        headers,
        body: JSON.stringify(values),
      });

      // 🎯 DIVINE: If 401, try to refresh token automatically
      if (response.status === 401) {
        console.log("⚠️ Studio Config Update: 401 Unauthorized - Attempting token refresh...");
        
        const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
        if (refreshToken) {
          const newAccessToken = await refreshAccessToken(refreshToken);
          
          if (newAccessToken) {
            console.log("✅ Studio Config Update: Token refreshed! Retrying...");
            
            // Retry the request with new token
            const retryResponse = await fetch("/api/config", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${newAccessToken}`,
              },
              body: JSON.stringify(values),
            });
            
            if (retryResponse.ok) {
              const result = await retryResponse.json();
              console.log("✅ Studio Config Update Success (after refresh):", result);
              return result;
            }
          }
        }
        
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        console.error("❌ Studio Config Update Failed:", detail);
        throw new Error(detail.error ?? tMessages("error"));
      }

      const result = await response.json();
      console.log("✅ Studio Config Update Success:", result);

      // 2. Auto-sync to Vapi after successful save
      try {
        console.log("🔄 Auto-syncing to Vapi...");
        
        // 🎯 DIVINE: Get token for Vapi sync (reuse or get fresh one)
        const syncToken = token || (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
        
        const syncHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        if (syncToken) {
          syncHeaders.Authorization = `Bearer ${syncToken}`;
        }
        
        const vapiResponse = await fetch(
          `${backendConfig.baseUrl}/api/v1/studio/sync-vapi`,
          {
            method: "POST",
            headers: syncHeaders,
          },
        );

        // 🎯 DIVINE: Handle 401 on Vapi sync too
        if (vapiResponse.status === 401) {
          console.log("⚠️ Vapi Sync: 401 Unauthorized - Attempting token refresh...");
          
          const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
          if (refreshToken) {
            const newAccessToken = await refreshAccessToken(refreshToken);
            
            if (newAccessToken) {
              console.log("✅ Vapi Sync: Token refreshed! Retrying sync...");
              
              // Retry Vapi sync with new token
              const retrySyncResponse = await fetch(
                `${backendConfig.baseUrl}/api/v1/studio/sync-vapi`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newAccessToken}`,
                  },
                },
              );
              
              if (retrySyncResponse.ok) {
                const vapiResult = await retrySyncResponse.json();
                console.log("✅ Vapi Sync Success (after refresh):", vapiResult);
                
                // Show success toast with details
                const settings = vapiResult.settings || {};
                if (vapiResult.action === "updated") {
                  toast.success("🔄 Assistant Updated Successfully!", {
                    description: (
                      <div className="space-y-1 text-xs">
                        <div>✅ Voice: {settings.voiceProvider} @ {settings.voiceSpeed}x</div>
                        <div>✅ Model: {settings.model} (temp={settings.temperature})</div>
                        <div>✅ Max Tokens: {settings.maxTokens}</div>
                        <div className="pt-1 text-[10px] opacity-70">
                          ID: {vapiResult.assistantId?.slice(0, 12)}...
                        </div>
                      </div>
                    ),
                    duration: 5000,
                  });
                } else if (vapiResult.action === "created") {
                  toast.success("🆕 New Assistant Created!", {
                    description: `Created new assistant: ${vapiResult.assistantId}`,
                  });
                }
                
                // Update assistant ID if returned
                if (vapiResult.assistantId && vapiResult.assistantId !== values.vapiAssistantId) {
                  result.config = { ...result.config, vapiAssistantId: vapiResult.assistantId };
                }
                
                return result;
              }
            }
          }
          
          // If refresh failed, show warning but don't fail the whole save
          console.warn("⚠️ Vapi sync failed due to auth, but config was saved successfully");
          toast.warning("⚠️ Config saved but Vapi sync failed", {
            description: "Session expired. Please refresh and try again.",
          });
          return result;
        }

        if (vapiResponse.ok) {
          const vapiResult = await vapiResponse.json();
          console.log("✅ Vapi Sync Success:", vapiResult);

          // Show detailed toast with what was changed
          const settings = vapiResult.settings || {};
          if (vapiResult.action === "updated") {
            toast.success("� Assistant Updated Successfully!", {
              description: (
                <div className="space-y-1 text-xs">
                  <div>✅ Voice: {settings.voiceProvider} @ {settings.voiceSpeed}x</div>
                  <div>✅ Model: {settings.model} (temp={settings.temperature})</div>
                  <div>✅ Max Tokens: {settings.maxTokens}</div>
                  <div className="pt-1 text-[10px] opacity-70">
                    ID: {vapiResult.assistantId?.slice(0, 12)}...
                  </div>
                </div>
              ),
              duration: 5000,
            });
          } else if (vapiResult.action === "created") {
            toast.success("🆕 New Assistant Created!", {
              description: `Created new assistant: ${vapiResult.assistantId}`,
            });
          }

          // Update assistant ID if returned
          if (vapiResult.assistantId && vapiResult.assistantId !== values.vapiAssistantId) {
            result.config = { ...result.config, vapiAssistantId: vapiResult.assistantId };
          }
        } else {
          const detail = await vapiResponse.json().catch(() => ({}));
          console.warn("⚠️ Vapi sync failed, but config saved successfully", detail);
        }
      } catch (syncError) {
        console.warn("⚠️ Vapi sync error:", syncError);
        // Don't fail the whole mutation if Vapi sync fails
      }

      return result;
    },
    onSuccess: (data, variables) => {
      const nextConfig = data.config ?? variables;
      queryClient.setQueryData(["studio-config"], nextConfig);
      form.reset(nextConfig);
      onLinkedAssistantChange?.(nextConfig.vapiAssistantId ?? null);
      toast.success("✅ Configuration saved and synced to Vapi!", {
        description: "Your AI assistant is now up to date",
      });
    },
    onError: (error) => {
      toast.error(tMessages("error"), { description: error.message });
    },
  });

  const isDisabled = configQuery.isPending || updateMutation.isPending;
  const isDirty = form.formState.isDirty;
  const vapiAssistantId = form.watch("vapiAssistantId");

  // � DIVINE: Persona Preset Selector
  const [selectedPreset, setSelectedPreset] = useState<PersonaType | "none" | "">("");

  const handlePresetChange = (preset: string) => {
    if (!preset || preset === "none") {
      setSelectedPreset("none");
      return;
    }

    const personaType = preset as PersonaType;
    setSelectedPreset(personaType);

    // Apply preset to form
    const prompt = PERSONA_PROMPTS[personaType];
    const settings = getPersonaSettings(personaType);
    const firstMessage = getPersonaFirstMessage(
      personaType,
      form.getValues("organizationName")
    );

    form.setValue("systemPrompt", prompt, { shouldDirty: true, shouldTouch: true });
    form.setValue("firstMessage", firstMessage, { shouldDirty: true, shouldTouch: true });
    form.setValue("persona", personaType, { shouldDirty: true, shouldTouch: true });
    form.setValue("tone", settings.tone, { shouldDirty: true, shouldTouch: true });
    form.setValue("aiTemperature", settings.temperature, { shouldDirty: true, shouldTouch: true });
    form.setValue("aiMaxTokens", settings.maxTokens, { shouldDirty: true, shouldTouch: true });
    form.setValue("askForName", settings.askForName, { shouldDirty: true, shouldTouch: true });
    form.setValue("askForEmail", settings.askForEmail, { shouldDirty: true, shouldTouch: true });
    form.setValue("askForPhone", settings.askForPhone, { shouldDirty: true, shouldTouch: true });

    toast.success(`✨ Preset "${PERSONA_LABELS[personaType]}" applied!`, {
      description: "All settings have been updated. You can customize them further before saving.",
    });
  };

  // �🐛 DEBUG: Log form state
  useEffect(() => {
    console.log("🔍 Studio Form State:", {
      isDirty,
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      dirtyFields: Object.keys(form.formState.dirtyFields),
    });
  }, [isDirty, form.formState]);

  if (configQuery.isPending) {
    return (
      <GlassCard className="flex items-center justify-center py-12" variant="none">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{t("loading")}</span>
      </GlassCard>
    );
  }

  if (configQuery.isError) {
    return (
      <GlassCard className="space-y-4" variant="none">
        <div>
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("error")}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => configQuery.refetch()} className="w-fit">
          <RefreshCcw className="mr-2 h-4 w-4" />
          {t("refresh")}
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-5">
      {/* Professional Header - Clean & Simple */}
      <GlassCard className="border" variant="none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/5">
                <Sparkles className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {t("title")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("description")}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {vapiAssistantId && (
              <div className="flex flex-col gap-1">
                <Badge variant="brand" className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Synced with Vapi
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ID: {vapiAssistantId.slice(0, 8)}...
                </span>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => configQuery.refetch()}
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              {t("refresh")}
            </Button>
          </div>
        </div>
      </GlassCard>

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => {
          console.log("📝 Form Submit Handler Called:", values);
          updateMutation.mutate(values);
        })}>

          {/* 🔥 DIVINE: PRESET SELECTOR - Make personalization OBVIOUS */}
          <GlassCard className="border border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-background dark:from-brand-950 dark:to-background" variant="none">
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10">
                  <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">
                    🎭 Quick Persona Presets
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select a preset to auto-fill systemPrompt, tone, and behavior. You can customize everything after.
                  </p>
                </div>
              </div>

              <Select value={selectedPreset || "none"} onValueChange={handlePresetChange}>
                <SelectTrigger className="h-12 text-left">
                  <SelectValue placeholder="Choose a persona preset..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex flex-col">
                      <span className="font-medium">🚫 No Preset (Keep Current)</span>
                      <span className="text-xs text-muted-foreground">Keep your current settings</span>
                    </div>
                  </SelectItem>
                  {(Object.keys(PERSONA_LABELS) as PersonaType[]).map((personaKey) => (
                    <SelectItem key={personaKey} value={personaKey}>
                      <div className="flex flex-col">
                        <span className="font-medium">{PERSONA_LABELS[personaKey]}</span>
                        <span className="text-xs text-muted-foreground">
                          {PERSONA_DESCRIPTIONS[personaKey]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPreset && selectedPreset !== "none" && (
                <div className="rounded-lg bg-brand-500/10 border border-brand-500/20 p-3 text-sm text-brand-700 dark:text-brand-300">
                  <strong>✨ Preset applied:</strong> {PERSONA_LABELS[selectedPreset]}
                  <br />
                  <span className="text-xs">
                    System prompt, first message, and behavior settings have been updated. Customize them below before saving.
                  </span>
                </div>
              )}
            </div>
          </GlassCard>

          <Accordion type="single" collapsible className="space-y-4">

            {/* 📋 ORGANIZATION SECTION - Professional Design */}
            <AccordionItem value="org" className="border-none">
              <GlassCard className="border" variant="none">
                <AccordionTrigger className="px-5 py-4 hover:no-underline [&[data-state=open]]:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/5">
                      <Sparkles className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-semibold text-foreground">Organization</h3>
                      <p className="text-xs text-muted-foreground">Company info & business settings</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="grid gap-4 pt-3 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">{t("form.organizationName")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isDisabled} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">{t("form.adminEmail")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" disabled={isDisabled} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">{t("form.timezone")}</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIMEZONE_OPTIONS.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {t(`options.timezone.${value}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">{t("form.language")}</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LANGUAGE_OPTIONS.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {t(`options.language.${value}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">{t("form.phoneNumber")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isDisabled} placeholder="+33..." className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">{t("form.businessHours")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isDisabled} placeholder="09:00-18:00" className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fallbackEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">{t("form.fallbackEmail")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" disabled={isDisabled} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="summaryEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">{t("form.summaryEmail")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" disabled={isDisabled} className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </GlassCard>
            </AccordionItem>

            {/* 🤖 AI PERFORMANCE SECTION - Professional */}
            <AccordionItem value="ai" className="border-none">
              <GlassCard className="border" variant="none">
                <AccordionTrigger className="px-5 py-4 hover:no-underline [&[data-state=open]]:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/5">
                      <Bot className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-semibold text-foreground">AI Performance</h3>
                      <p className="text-xs text-muted-foreground">Model settings & intelligence tuning</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="space-y-4 pt-3">
                    <FormField
                      control={form.control}
                      name="aiModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">AI Model</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {AI_MODEL_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{opt.label}</span>
                                      <span className="text-xs text-muted-foreground">{opt.description}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription className="flex items-center gap-2 text-xs">
                            <Zap className="h-3 w-3 text-purple-500" />
                            <strong>Recommandé:</strong> GPT-4o pour le français (rapide + intelligent)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aiTemperature"
                      render={({ field }) => (
                        <FormItem>
                          <LabeledSlider
                            label="AI Temperature (Creativity)"
                            description="0 = Precise & Consistent | 1 = Creative & Varied"
                            min={0}
                            max={1}
                            step={0.1}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isDisabled}
                            valueFormatter={(v) => v.toFixed(1)}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aiMaxTokens"
                      render={({ field }) => (
                        <FormItem>
                          <LabeledSlider
                            label="Max Response Length (tokens)"
                            description="Lower = Faster responses | Higher = More detailed"
                            min={50}
                            max={500}
                            step={10}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isDisabled}
                            valueFormatter={(v) => `${v} tokens`}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </GlassCard>
            </AccordionItem>

            {/* 🎤 VOICE & PERSONALITY SECTION - Professional */}
            <AccordionItem value="voice" className="border-none">
              <GlassCard className="border" variant="none">
                <AccordionTrigger className="px-5 py-4 hover:no-underline [&[data-state=open]]:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/5">
                      <Mic className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-semibold text-foreground">Voice & Personality</h3>
                      <p className="text-xs text-muted-foreground">Voice settings & conversation style</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="space-y-4 pt-3">
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="voiceProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Voice Provider</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                                <SelectTrigger className="h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {VOICE_PROVIDER_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="voiceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">Assistant Voice</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select a voice" />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">🔥 Azure Neural (Recommandé)</div>
                                  <SelectItem value="fr-FR-DeniseNeural">
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="h-3 w-3 text-amber-500" />
                                      <span>Denise - Femme, ultra naturelle, chaleureuse</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="fr-FR-HenriNeural">
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="h-3 w-3 text-blue-600" />
                                      <span>Henri - Homme, naturel, professionnel</span>
                                    </div>
                                  </SelectItem>
                                  
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">🇫🇷 ElevenLabs Français</div>
                                  <SelectItem value="XB0fDUnXU5powFXDhCwa">
                                    <div className="flex items-center gap-2">
                                      <Mic className="h-3 w-3 text-pink-500" />
                                      <span>Charlotte - Femme, chaleureuse, claire</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="EXAVITQu4vr4xnSDxMaL">
                                    <div className="flex items-center gap-2">
                                      <Mic className="h-3 w-3 text-purple-500" />
                                      <span>Bella - Femme, douce, rassurante</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="flq6f7yk4E4fJM5XTYuZ">
                                    <div className="flex items-center gap-2">
                                      <Mic className="h-3 w-3 text-blue-500" />
                                      <span>Thomas - Homme, calme, professionnel</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="ErXwobaYiN019PkySvjV">
                                    <div className="flex items-center gap-2">
                                      <Mic className="h-3 w-3 text-green-500" />
                                      <span>Antoine - Homme, dynamique</span>
                                    </div>
                                  </SelectItem>

                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">🇮🇱 עברית (Hebrew)</div>
                                  <SelectItem value="onwK4e9ZLuTAKqWW03F9">
                                    <div className="flex items-center gap-2">
                                      <Mic className="h-3 w-3 text-blue-400" />
                                      <span>Daniel - גבר, ברור ומקצועי</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="pqHfZKP75CvOlQylNhV4">
                                    <div className="flex items-center gap-2">
                                      <Mic className="h-3 w-3 text-pink-400" />
                                      <span>Sarah - אישה, חמה ונעימה</span>
                                    </div>
                                  </SelectItem>

                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">🇬🇧 English</div>
                                  <SelectItem value="21m00Tcm4TlvDq8ikWAM">
                                    <div className="flex items-center gap-2">
                                      <Mic className="h-3 w-3 text-gray-500" />
                                      <span>Rachel - Female, clear American</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="pNInz6obpgDQGcFmaJgB">
                                    <div className="flex items-center gap-2">
                                      <Mic className="h-3 w-3 text-gray-600" />
                                      <span>Adam - Male, deep American</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="TxGEqnHWrfWFTfGW9XjX">
                                    <div className="flex items-center gap-2">
                                      <Mic className="h-3 w-3 text-gray-500" />
                                      <span>Josh - Male, young American</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="MF3mGyEYCl7XYWbV9V6O">
                                    <div className="flex items-center gap-2">
                                      <Mic className="h-3 w-3 text-gray-500" />
                                      <span>Elli - Female, soft British</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription className="flex items-center gap-2 text-xs">
                              <Mic className="h-3 w-3 text-emerald-500" />
                              Sélectionnez une voix de qualité pour votre assistant
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="voiceSpeed"
                      render={({ field }) => (
                        <FormItem>
                          <LabeledSlider
                            label="Voice Speed"
                            description="0.5x = Slow | 1.0x = Normal | 2.0x = Fast"
                            min={0.5}
                            max={2.0}
                            step={0.1}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isDisabled}
                            valueFormatter={(v) => `${v.toFixed(1)}x`}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="persona"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">{t("form.persona")}</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                                <SelectTrigger className="h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PERSONA_OPTIONS.map((value) => (
                                    <SelectItem key={value} value={value}>
                                      {t(`options.persona.${value}`)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold">{t("form.tone")}</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                                <SelectTrigger className="h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TONE_OPTIONS.map((value) => (
                                    <SelectItem key={value} value={value}>
                                      {t(`options.tone.${value}`)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="guidelines"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">{t("form.guidelines")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} disabled={isDisabled} placeholder="Additional behavioral guidelines..." className="resize-none" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </GlassCard>
            </AccordionItem>

            {/* 💬 CONVERSATION BEHAVIOR SECTION - Professional */}
            <AccordionItem value="conversation" className="border-none">
              <GlassCard className="border" variant="none">
                <AccordionTrigger className="px-5 py-4 hover:no-underline [&[data-state=open]]:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/5">
                      <MessageSquare className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-semibold text-foreground">Conversation Behavior</h3>
                      <p className="text-xs text-muted-foreground">System prompts & auto-collect settings</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5">
                  <div className="space-y-6 pt-3">
                    
                    {/* 🔥 DIVINE: SYSTEM PROMPT - MAKE IT OBVIOUS */}
                    <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20">
                          <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                            🧠 System Prompt (AI Brain)
                          </h4>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            ⚠️ <strong>CRITICAL</strong>: This is the MOST IMPORTANT setting.
                            It defines your assistant's personality, knowledge, and behavior.
                          </p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="systemPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold text-amber-900 dark:text-amber-100">
                              AI Instructions (Be VERY specific)
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={18}
                                disabled={isDisabled} 
                                placeholder="Tu es [name], [role] de [company]...&#10;&#10;🎯 MISSION:&#10;1. [What to do]&#10;2. [How to behave]&#10;&#10;✨ TONE: [professional/warm/energetic]&#10;&#10;⚠️ IMPORTANT: [Critical instructions]"
                                className="resize-y min-h-[400px] font-mono text-sm leading-relaxed"
                              />
                            </FormControl>
                            <FormDescription className="space-y-2 text-xs">
                              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                <AlertCircle className="h-4 w-4" />
                                <span>
                                  Current length: <strong className="text-base">{field.value.length}</strong> characters
                                  {field.value.length < 200 && (
                                    <span className="ml-2 text-orange-600 dark:text-orange-400 font-semibold">
                                      ⚠️ Too short! Add more details for better AI performance.
                                    </span>
                                  )}
                                  {field.value.length >= 200 && field.value.length < 500 && (
                                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                                      ✓ Good length. Consider adding more specific examples.
                                    </span>
                                  )}
                                  {field.value.length >= 500 && (
                                    <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                                      ✅ Excellent! Very detailed instructions.
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="bg-amber-100 dark:bg-amber-900 rounded p-3 space-y-1">
                                <p className="font-semibold text-amber-900 dark:text-amber-100">💡 Pro Tips:</p>
                                <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
                                  <li>Be SPECIFIC: Define exact role, company, services</li>
                                  <li>Add MISSION: What should the AI accomplish?</li>
                                  <li>Define TONE: professional? warm? energetic?</li>
                                  <li>List DO's and DON'Ts clearly</li>
                                  <li>Include example conversations if possible</li>
                                </ul>
                              </div>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* First Message */}
                    <FormField
                      control={form.control}
                      name="firstMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">First Message</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isDisabled} placeholder="Hello! I'm AVA. How can I help you today?" className="h-11" />
                          </FormControl>
                          <FormDescription className="flex items-center gap-2 text-xs">
                            <MessageSquare className="h-3 w-3 text-orange-500" />
                            Initial greeting when call starts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Auto-collect switches - Professional design */}
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-foreground" />
                        <p className="text-sm font-semibold text-foreground">Auto-collect Information</p>
                      </div>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="askForName"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between space-y-0 rounded-md bg-background p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm font-medium">Ask for Name</FormLabel>
                                <FormDescription className="text-xs">Request caller's name during conversation</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isDisabled} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="askForEmail"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between space-y-0 rounded-md bg-background p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm font-medium">Ask for Email</FormLabel>
                                <FormDescription className="text-xs">Request caller's email address</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isDisabled} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="askForPhone"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between space-y-0 rounded-md bg-background p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm font-medium">Ask for Phone</FormLabel>
                                <FormDescription className="text-xs">Request caller's phone number</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isDisabled} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </GlassCard>
            </AccordionItem>

          </Accordion>

          {/* 🔥 DIVINE PREVIEW PANEL - Show what will be sent to Vapi */}
          {isDirty && (
            <GlassCard className="border-2 border-brand-500 bg-gradient-to-br from-brand-50 to-background dark:from-brand-950 dark:to-background" variant="none">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-500/20">
                    <Zap className="h-6 w-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-brand-900 dark:text-brand-100">
                      🔥 PREVIEW: Ready to Sync to Vapi
                    </h3>
                    <p className="text-sm text-brand-700 dark:text-brand-300">
                      These settings will be applied to your Vapi assistant {vapiAssistantId ? `(ID: ${vapiAssistantId.slice(0, 8)}...)` : '(new assistant will be created)'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Voice & Model Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-background rounded-lg border">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Mic className="h-4 w-4 text-brand-600" />
                        Voice Settings
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Provider:</strong> {form.watch("voiceProvider")}</p>
                        <p><strong>Voice ID:</strong> {form.watch("voiceId")}</p>
                        <p><strong>Speed:</strong> {form.watch("voiceSpeed")}x</p>
                      </div>
                    </div>

                    <div className="p-4 bg-background rounded-lg border">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Bot className="h-4 w-4 text-brand-600" />
                        AI Model
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>Model:</strong> {form.watch("aiModel")}</p>
                        <p><strong>Temperature:</strong> {form.watch("aiTemperature")}</p>
                        <p><strong>Max Tokens:</strong> {form.watch("aiMaxTokens")}</p>
                      </div>
                    </div>
                  </div>

                  {/* First Message */}
                  <div className="p-4 bg-background rounded-lg border">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-brand-600" />
                      First Message
                    </h4>
                    <p className="text-sm italic text-muted-foreground">
                      "{form.watch("firstMessage")}"
                    </p>
                  </div>

                  {/* System Prompt Preview */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-300 dark:border-amber-700">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-amber-900 dark:text-amber-100">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      System Prompt ({form.watch("systemPrompt").length} characters)
                    </h4>
                    <div className="max-h-48 overflow-y-auto">
                      <pre className="text-xs font-mono whitespace-pre-wrap text-amber-800 dark:text-amber-200">
                        {form.watch("systemPrompt").slice(0, 800)}{form.watch("systemPrompt").length > 800 && "..."}
                      </pre>
                    </div>
                    {form.watch("systemPrompt").length < 200 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-semibold">
                        ⚠️ Warning: System prompt is very short. Consider adding more details for better AI performance.
                      </p>
                    )}
                  </div>

                  {/* Auto-collect settings */}
                  <div className="p-4 bg-background rounded-lg border">
                    <h4 className="font-semibold mb-2">Auto-collect Information</h4>
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        {form.watch("askForName") ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="h-4 w-4 text-red-600">✗</span>
                        )}
                        <span>Name</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {form.watch("askForEmail") ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="h-4 w-4 text-red-600">✗</span>
                        )}
                        <span>Email</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {form.watch("askForPhone") ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="h-4 w-4 text-red-600">✗</span>
                        )}
                        <span>Phone</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Big Save Button */}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-lg font-semibold"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Syncing to Vapi...
                    </>
                  ) : (
                    <>
                      <Save className="mr-3 h-5 w-5" />
                      💾 SAVE & SYNC TO VAPI NOW
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  ⚡ This will save to database AND immediately sync to your Vapi assistant
                </p>
              </div>
            </GlassCard>
          )}

          {/* 🔥 OLD DEBUG PANEL - Hidden but kept for reference */}
          {false && isDirty && (
            <GlassCard className="border border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/30" variant="none">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                    🔥 Preview: Ces paramètres seront envoyés à Vapi
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-orange-800 dark:text-orange-200">Voice:</span>{" "}
                    <span className="text-orange-700 dark:text-orange-300">
                      {form.watch("voiceProvider")} / {form.watch("voiceId").slice(0, 8)}...
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-orange-800 dark:text-orange-200">Speed:</span>{" "}
                    <span className="text-orange-700 dark:text-orange-300">{form.watch("voiceSpeed")}x</span>
                  </div>
                  <div>
                    <span className="font-semibold text-orange-800 dark:text-orange-200">Model:</span>{" "}
                    <span className="text-orange-700 dark:text-orange-300">{form.watch("aiModel")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-orange-800 dark:text-orange-200">Temperature:</span>{" "}
                    <span className="text-orange-700 dark:text-orange-300">{form.watch("aiTemperature")}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-orange-800 dark:text-orange-200">First Message:</span>{" "}
                    <span className="text-orange-700 dark:text-orange-300 italic">
                      "{form.watch("firstMessage").slice(0, 50)}..."
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-orange-600 dark:text-orange-400">
                  ⚡ Clique sur "Save & Sync to Vapi" pour appliquer ces changements à l'assistant {vapiAssistantId?.slice(0, 8)}...
                </div>
              </div>
            </GlassCard>
          )}

          {/* Professional Save Button */}
          <div className="flex flex-col gap-3 border-t pt-5">
            {isDirty && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <span>You have unsaved changes</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              {/* Cost Calculator Display */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium">
                  💰 ~${estimatedCost.total}/min
                </Badge>
                <div className="text-xs text-muted-foreground">
                  (AI: ${estimatedCost.breakdown.model} + Voice: ${estimatedCost.breakdown.voice} + Platform: ${estimatedCost.breakdown.platform})
                </div>
              </div>

              {/* Save Button */}
              <Button
                type="submit"
                size="lg"
                disabled={updateMutation.isPending}
                className="gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-semibold">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="font-semibold">Save & Sync to Vapi</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
