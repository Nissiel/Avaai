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
      const response = await fetch("/api/config");
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

      // 1. Save to database
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

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
        const vapiResponse = await fetch(
          `${backendConfig.baseUrl}/api/v1/studio/sync-vapi`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

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

  // 🐛 DEBUG: Log form state
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
                  <div className="space-y-4 pt-3">
                    <FormField
                      control={form.control}
                      name="systemPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">System Prompt</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={6} disabled={isDisabled} placeholder="You are AVA, a professional AI assistant..." className="resize-none" />
                          </FormControl>
                          <FormDescription className="flex items-center gap-2 text-xs">
                            <Sparkles className="h-3 w-3 text-orange-500" />
                            Core AI instructions - defines personality and behavior
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

          {/* 🔥 DIVINE DEBUG PANEL */}
          {isDirty && (
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
