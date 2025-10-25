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

const TIMEZONE_OPTIONS = ["europe/paris", "america/new_york", "asia/tokyo"] as const;
const LANGUAGE_OPTIONS = ["fr", "en", "es"] as const;
const PERSONA_OPTIONS = ["secretary", "concierge", "sdr", "cs"] as const;
const TONE_OPTIONS = ["warm", "professional", "energetic"] as const;
const AI_MODEL_OPTIONS = [
  { value: "gpt-4", label: "GPT-4", description: "Most capable, best quality" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Faster, lower cost" },
] as const;
const VOICE_PROVIDER_OPTIONS = [
  { value: "11labs", label: "ElevenLabs" },
  { value: "playht", label: "PlayHT" },
] as const;

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
      aiModel: "gpt-4",
      aiTemperature: 0.5,
      aiMaxTokens: 150,
      voiceProvider: "11labs",
      voiceId: "21m00Tcm4TlvDq8ikWAM",
      voiceSpeed: 1.2,
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
        const vapiResponse = await fetch("http://localhost:8000/api/v1/studio/sync-vapi", {
          method: "POST",
        });

        if (vapiResponse.ok) {
          const vapiResult = await vapiResponse.json();
          console.log("✅ Vapi Sync Success:", vapiResult);

          // Update assistant ID if returned
          if (vapiResult.assistantId && vapiResult.assistantId !== values.vapiAssistantId) {
            result.config = { ...result.config, vapiAssistantId: vapiResult.assistantId };
          }
        } else {
          console.warn("⚠️ Vapi sync failed, but config saved successfully");
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
    <div className="space-y-6">
      <GlassCard className="space-y-6" variant="none">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            {vapiAssistantId && (
              <Badge variant="brand" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Synced
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => configQuery.refetch()}
              disabled={updateMutation.isPending}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("refresh")}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit((values) => {
            console.log("📝 Form Submit Handler Called:", values);
            updateMutation.mutate(values);
          })}>

            <Accordion type="multiple" defaultValue={[]} className="space-y-4">

              {/* 📋 ORGANIZATION SECTION */}
              <AccordionItem value="org" className="border-none">
                <AccordionTrigger className="text-base">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    📋 Organization
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="organizationName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.organizationName")}</FormLabel>
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
                          <FormLabel>{t("form.adminEmail")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" disabled={isDisabled} />
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
                          <FormLabel>{t("form.timezone")}</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                              <SelectTrigger>
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
                          <FormLabel>{t("form.language")}</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                              <SelectTrigger>
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
                          <FormLabel>{t("form.phoneNumber")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isDisabled} placeholder="+33..." />
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
                          <FormLabel>{t("form.businessHours")}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isDisabled} placeholder="09:00-18:00" />
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
                          <FormLabel>{t("form.fallbackEmail")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" disabled={isDisabled} />
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
                          <FormLabel>{t("form.summaryEmail")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" disabled={isDisabled} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 🤖 AI PERFORMANCE SECTION */}
              <AccordionItem value="ai" className="border-none">
                <AccordionTrigger className="text-base">
                  <span className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    🤖 AI Performance
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="aiModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AI Model</FormLabel>
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
                          <FormDescription>
                            GPT-4 = Best quality | GPT-3.5 = Faster & cheaper
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
              </AccordionItem>

              {/* 🎤 VOICE & PERSONALITY SECTION */}
              <AccordionItem value="voice" className="border-none">
                <AccordionTrigger className="text-base">
                  <span className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    🎤 Voice & Personality
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="voiceProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Voice Provider</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                                <SelectTrigger>
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
                            <FormLabel>Voice ID</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isDisabled} placeholder="21m00Tcm4TlvDq8ikWAM" />
                            </FormControl>
                            <FormDescription>
                              ElevenLabs voice ID (Rachel by default)
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
                            <FormLabel>{t("form.persona")}</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                                <SelectTrigger>
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
                            <FormLabel>{t("form.tone")}</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                                <SelectTrigger>
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
                          <FormLabel>{t("form.guidelines")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} disabled={isDisabled} placeholder="Additional behavioral guidelines..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 💬 CONVERSATION BEHAVIOR SECTION */}
              <AccordionItem value="conversation" className="border-none">
                <AccordionTrigger className="text-base">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    💬 Conversation Behavior
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="systemPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System Prompt</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={6} disabled={isDisabled} placeholder="You are AVA, a professional AI assistant..." />
                          </FormControl>
                          <FormDescription>
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
                          <FormLabel>First Message</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isDisabled} placeholder="Hello! I'm AVA. How can I help you today?" />
                          </FormControl>
                          <FormDescription>
                            Initial greeting when call starts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4 rounded-lg border p-4">
                      <p className="text-sm font-medium">Auto-collect Information</p>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="askForName"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between space-y-0">
                              <div>
                                <FormLabel>Ask for Name</FormLabel>
                                <FormDescription>Request caller's name during conversation</FormDescription>
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
                            <FormItem className="flex items-center justify-between space-y-0">
                              <div>
                                <FormLabel>Ask for Email</FormLabel>
                                <FormDescription>Request caller's email address</FormDescription>
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
                            <FormItem className="flex items-center justify-between space-y-0">
                              <div>
                                <FormLabel>Ask for Phone</FormLabel>
                                <FormDescription>Request caller's phone number</FormDescription>
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
              </AccordionItem>

            </Accordion>

            {/* SAVE BUTTONS */}
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end border-t pt-6">
              <Button
                type="submit"
                className="w-full sm:w-auto"
                size="lg"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving & Syncing...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    <Zap className="mr-1 h-3 w-3" />
                    Save & Sync to Vapi
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </GlassCard>
    </div>
  );
}
