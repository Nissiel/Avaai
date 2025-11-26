"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Sparkles, Phone, Bot, BarChart3, Save, Loader2, Mail, MessageCircle, Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LabeledSlider } from "@/components/ui/labeled-slider";
import type { StudioConfigInput } from "@/lib/validations/config";
import { updateStudioConfiguration } from "@/lib/api/studio-orchestrator";
import {
  handleStudioUpdateToasts,
  handleStudioUpdateError,
  showStudioUpdateLoading,
} from "@/lib/toast/studio-update-toasts";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { createStudioConfigSchema } from "@/lib/validations/config";

const STUDIO_CONFIG_QUERY_KEY = ["studio-config"] as const;

const TIMEZONE_OPTIONS = ["europe/paris", "america/new_york", "asia/tokyo"] as const;
const LANGUAGE_OPTIONS = ["fr", "en", "es"] as const;
const TONE_OPTIONS = ["warm", "professional", "energetic"] as const;
const AI_MODEL_OPTIONS = [
  { value: "gpt-4o", label: "GPT-4o", description: "Best for French & phone calls - Fast + Smart" },
  { value: "gpt-4", label: "GPT-4", description: "Most capable, best quality" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Fast with lower latency" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Faster, lower cost" },
] as const;

async function fetchStudioConfig(): Promise<StudioConfigInput> {
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
  const tHero = useTranslations("assistantsPage.hero");
  const t = useTranslations("settingsPage.studio");
  const queryClient = useQueryClient();

  const studioConfigQuery = useQuery<StudioConfigInput>({
    queryKey: STUDIO_CONFIG_QUERY_KEY,
    queryFn: fetchStudioConfig,
    staleTime: 60_000,
  });

  const localizedSchema = useMemo(
    () => createStudioConfigSchema((key, params) => t(key, params as any)),
    [t],
  );

  const form = useForm<StudioConfigInput>({
    resolver: zodResolver(localizedSchema),
    defaultValues: studioConfigQuery.data || {
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
      aiModel: "gpt-4o",
      aiTemperature: 0.7,
      aiMaxTokens: 200,
      voiceProvider: "azure",
      voiceId: "fr-FR-DeniseNeural",
      voiceSpeed: 1.0,
      transcriberProvider: "deepgram",
      transcriberModel: "nova-2",
      transcriberLanguage: "fr",
      systemPrompt: "You are AVA, a professional AI assistant.",
      firstMessage: "Hello! I'm AVA.",
      askForName: true,
      askForEmail: false,
      askForPhone: false,
      vapiAssistantId: null,
    },
    mode: "onChange",
  });

  // Sync form with fetched data
  useEffect(() => {
    if (studioConfigQuery.data && !form.formState.isDirty) {
      form.reset(studioConfigQuery.data);
    }
  }, [studioConfigQuery.data, form]);

  // Mutation for updating configuration
  const updateMutation = useMutation({
    mutationFn: async (values: StudioConfigInput) => {
      return await updateStudioConfiguration(values, { skipVapiSync: false });
    },
    onMutate: () => {
      const toastId = showStudioUpdateLoading();
      return { toastId };
    },
    onSuccess: (result) => {
      const savedConfig = result.db.config;
      if (savedConfig) {
        queryClient.setQueryData(STUDIO_CONFIG_QUERY_KEY, savedConfig);
        form.reset(savedConfig);
      }
      handleStudioUpdateToasts(result);
    },
    onError: (error) => {
      handleStudioUpdateError(error);
    },
    onSettled: (_result, _error, _variables, context) => {
      if (context?.toastId !== undefined) {
        toast.dismiss(context.toastId);
      }
    },
  });

  const isDisabled = studioConfigQuery.isPending || updateMutation.isPending;
  const isDirty = form.formState.isDirty;

  if (studioConfigQuery.isPending) {
    return (
      <section className="space-y-10">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading configuration...</span>
        </div>
      </section>
    );
  }

  if (studioConfigQuery.isError) {
    return (
      <section className="space-y-10">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="text-center">
            <div className="text-destructive font-semibold text-lg">
              Failed to load configuration
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Your session may have expired. Please try logging in again.
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              window.location.href = "/login";
            }}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Log In Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-10 max-w-5xl mx-auto px-6 py-8">
      <header className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-brand-500/5 p-8 shadow-elevated">
        <div className="space-y-3">
          <Badge variant="brand" className="w-fit gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            {tHero("badge")}
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Create Your Perfect AI Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            Configure your AI assistant in 3 simple steps
          </p>
        </div>
      </header>

      <Form {...form}>
        <form
          className="space-y-6"
          onSubmit={form.handleSubmit((values) => {
            updateMutation.mutate(values);
          })}
        >
          <Accordion type="single" collapsible defaultValue="step-1" className="space-y-4">

            {/* Step 1: Call Setup */}
            <AccordionItem value="step-1" className="border-none">
              <GlassCard className="border" variant="none">
                <AccordionTrigger className="px-6 py-5 hover:no-underline [&[data-state=open]]:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-lg">
                      1
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-foreground" />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-foreground">Call Setup</h3>
                        <p className="text-sm text-muted-foreground">Configure phone number and voice settings</p>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6 pt-4">
                    {/* Organization Info */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="organizationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Assistant Name</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isDisabled} placeholder="Ex: Ava - My Business Assistant" />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Give your assistant a memorable name
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isDisabled} placeholder="+33..." />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Your business phone number
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="businessHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Business Hours</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isDisabled} placeholder="09:00-18:00" />
                            </FormControl>
                            <FormDescription className="text-xs">
                              When your assistant should be available
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Language</FormLabel>
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
                    </div>

                    {/* Voice Settings */}
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-foreground">Voice Settings</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="voiceId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Voice</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a voice" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fr-FR-DeniseNeural">
                                      Denise - Female, warm, natural (French)
                                    </SelectItem>
                                    <SelectItem value="fr-FR-HenriNeural">
                                      Henri - Male, professional (French)
                                    </SelectItem>
                                    <SelectItem value="en-US-JennyNeural">
                                      Jenny - Female, friendly (English)
                                    </SelectItem>
                                    <SelectItem value="en-US-GuyNeural">
                                      Guy - Male, clear (English)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormDescription className="text-xs">
                                Choose the voice for your assistant
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="voiceSpeed"
                          render={({ field }) => (
                            <FormItem>
                              <LabeledSlider
                                label="Voice Speed"
                                description="0.5x = Slow | 1.0x = Normal | 1.2x = Fast"
                                min={0.5}
                                max={1.2}
                                step={0.05}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isDisabled}
                                valueFormatter={(v) => `${v.toFixed(1)}x`}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </GlassCard>
            </AccordionItem>

            {/* Step 2: AI Configuration */}
            <AccordionItem value="step-2" className="border-none">
              <GlassCard className="border" variant="none">
                <AccordionTrigger className="px-6 py-5 hover:no-underline [&[data-state=open]]:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-lg">
                      2
                    </div>
                    <div className="flex items-center gap-3">
                      <Bot className="h-5 w-5 text-foreground" />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-foreground">AI Configuration</h3>
                        <p className="text-sm text-muted-foreground">Set up your AI assistant's personality and behavior</p>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6 pt-4">
                    {/* System Prompt - Most Important */}
                    <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400 mt-1" />
                        <div>
                          <h4 className="text-base font-bold text-amber-900 dark:text-amber-100">
                            AI Instructions (System Prompt)
                          </h4>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            This defines your assistant's personality, knowledge, and behavior. Be specific!
                          </p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="systemPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={12}
                                disabled={isDisabled}
                                placeholder="You are [name], [role] at [company]...&#10;&#10;Your mission:&#10;1. [What to do]&#10;2. [How to behave]&#10;&#10;Tone: [professional/warm/energetic]"
                                className="resize-y min-h-[300px] font-mono text-sm"
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-amber-700 dark:text-amber-300">
                              Current length: {field.value.length} characters
                              {field.value.length < 200 && " - Add more details for better performance"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* First Message & Tone */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">First Message</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isDisabled} placeholder="Hello! I'm AVA." />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Initial greeting when call starts
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Tone</FormLabel>
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

                    {/* AI Model Settings */}
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold text-foreground">AI Model Settings</h4>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="aiTemperature"
                          render={({ field }) => (
                            <FormItem>
                              <LabeledSlider
                                label="AI Temperature (Creativity)"
                                description="0 = Precise | 1 = Creative"
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
                                label="Max Response Length"
                                description="Lower = Faster | Higher = Detailed"
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
                    </div>
                  </div>
                </AccordionContent>
              </GlassCard>
            </AccordionItem>

            {/* Step 3: Reporting */}
            <AccordionItem value="step-3" className="border-none">
              <GlassCard className="border" variant="none">
                <AccordionTrigger className="px-6 py-5 hover:no-underline [&[data-state=open]]:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-lg">
                      3
                    </div>
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-foreground" />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-foreground">Reporting</h3>
                        <p className="text-sm text-muted-foreground">Configure call summaries and notifications</p>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6 pt-4">
                    {/* Email Notifications */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-brand-600" />
                        <h4 className="text-sm font-semibold text-foreground">Gmail Integration</h4>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="summaryEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Summary Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" disabled={isDisabled} placeholder="summary@yourcompany.com" />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Receive call summaries and transcripts
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fallbackEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Fallback Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" disabled={isDisabled} placeholder="support@yourcompany.com" />
                              </FormControl>
                              <FormDescription className="text-xs">
                                For urgent issues and escalations
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                        <h4 className="text-sm font-semibold text-foreground">WhatsApp Integration</h4>
                      </div>
                      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center">
                        <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Send call summaries and notifications via WhatsApp
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Integration coming soon
                        </p>
                      </div>
                    </div>

                    {/* Calendar */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-semibold text-foreground">Calendar Integration</h4>
                      </div>
                      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Automatically schedule appointments from calls
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Coming soon
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </GlassCard>
            </AccordionItem>
          </Accordion>

          {/* Save Button */}
          <div className="flex flex-col gap-3 border-t pt-6">
            {isDirty && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                <span>You have unsaved changes</span>
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={updateMutation.isPending || !isDirty}
              className="w-full h-14 text-lg font-semibold"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Saving Configuration...
                </>
              ) : (
                <>
                  <Save className="mr-3 h-5 w-5" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
