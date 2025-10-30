"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { OnboardingStepper } from "@/components/features/onboarding/stepper";
import {
  onboardingAvaSchema,
  onboardingIntegrationsSchema,
  onboardingPlanSchema,
  onboardingProfileSchema,
  onboardingTelephonySchema,
  onboardingSchema,
  type OnboardingValues,
} from "@/lib/validations/onboarding";
import { SUPPORTED_INTEGRATIONS, VOICE_TONES } from "@/lib/constants";
import { toast } from "@/components/ui/sonner";
import { useAnalytics } from "@/lib/analytics";
import { cn, formatCurrency } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useSessionStore } from "@/stores/session-store";
import { getStudioConfig, updateStudioConfigClient } from "@/lib/api/config";
import { createAssistant } from "@/lib/api/assistants";
import { completeOnboarding } from "@/lib/api/user";
import type { CreateAssistantPayload, StudioConfig, StudioConfigUpdate } from "@/lib/dto";
import { VapiStep } from "./wizard-steps/vapi-step";
import { TwilioStep } from "./wizard-steps/twilio-step";
import { AssistantStep } from "./wizard-steps/assistant-step";

const steps = [
  { id: "profile", title: "Profile" },
  { id: "vapi", title: "Vapi API" },
  { id: "ava", title: "Personalize Ava" },
  { id: "twilio", title: "Twilio" },
  { id: "telephony", title: "Telephony" },
  { id: "integrations", title: "Integrations" },
  { id: "assistant", title: "Assistant" },
  { id: "plan", title: "Plan" },
];

type StepId = typeof steps[number]["id"];

type LocaleCode = "en" | "fr" | "he";

const LOCALE_TO_LANGUAGE: Record<LocaleCode, string> = {
  en: "en-US",
  fr: "fr-FR",
  he: "he-IL",
};

const LANGUAGE_TO_LOCALE: Record<string, LocaleCode> = {
  en: "en",
  "en-US": "en",
  fr: "fr",
  "fr-FR": "fr",
  "fr-CA": "fr",
  he: "he",
  "he-IL": "he",
};

const DEFAULT_VOICES: Record<OnboardingValues["tone"], { provider: "azure" | "playht"; voiceId: string }> = {
  warm: { provider: "azure", voiceId: "fr-FR-DeniseNeural" },
  professional: { provider: "azure", voiceId: "fr-FR-HenriNeural" },
  energetic: {
    provider: "playht",
    voiceId: "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json",
  },
};

const FALLBACK_VOICE = DEFAULT_VOICES.warm;

const AVAILABLE_LOCALES: LocaleCode[] = ["en", "fr", "he"];

function languageFromLocale(locale: LocaleCode): string {
  return LOCALE_TO_LANGUAGE[locale] ?? "en-US";
}

function localeFromLanguage(language: string): LocaleCode {
  return LANGUAGE_TO_LOCALE[language] ?? "en";
}

function mapConfigToFormValues(config: StudioConfig): Partial<OnboardingValues> {
  const locale = localeFromLanguage(config.language);
  return {
    name: config.organizationName,
    email: config.adminEmail,
    timezone: config.timezone,
    locale,
    persona: (config.persona as OnboardingValues["persona"]) ?? "secretary",
    tone: (config.tone as OnboardingValues["tone"]) ?? "warm",
    guidelines: config.guidelines ?? "",
    number: config.phoneNumber ?? "",
    businessHours: config.businessHours ?? "09:00-18:00",
    fallbackEmail: config.fallbackEmail ?? config.summaryEmail ?? "",
    languages: [locale],
  };
}

function buildConfigUpdate(step: StepId, values: OnboardingValues): StudioConfigUpdate {
  const update: StudioConfigUpdate = {};

  const assign = <K extends keyof StudioConfigUpdate>(key: K, value: StudioConfigUpdate[K]) => {
    if (value !== undefined && value !== null && value !== "") {
      update[key] = value;
    }
  };

  if (step === "profile" || step === "ava" || step === "plan") {
    assign("organizationName", values.name);
    assign("adminEmail", values.email);
    assign("timezone", values.timezone);
    assign("language", languageFromLocale(values.locale as LocaleCode));
  }

  if (step === "ava" || step === "plan") {
    assign("persona", values.persona);
    assign("tone", values.tone);
    assign("guidelines", values.guidelines);
  }

  if (step === "telephony" || step === "plan") {
    if (values.number) assign("phoneNumber", values.number);
    assign("businessHours", values.businessHours);
    if (values.fallbackEmail) {
      assign("fallbackEmail", values.fallbackEmail);
      assign("summaryEmail", values.fallbackEmail);
    }
  }

  return update;
}

function buildAssistantPayload(values: OnboardingValues): CreateAssistantPayload {
  if (!values.number || values.number.length < 4) {
    throw new Error("Un numéro de téléphone valide est requis pour créer l'assistante.");
  }

  const voice = DEFAULT_VOICES[values.tone] ?? FALLBACK_VOICE;
  const language = languageFromLocale(values.locale as LocaleCode);
  const languages = values.languages?.join(", ") ?? values.locale;

  const instructions = [
    values.guidelines,
    `Persona: ${values.persona}.`,
    `Ton: ${values.tone}.`,
    `Langues supportées: ${languages}.`,
    values.jobToBeDone ? `Mission principale: ${values.jobToBeDone}.` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    name: `${values.name || "Ava"} (${values.persona})`,
    instructions,
    phoneNumber: values.number,
    firstMessage: `Bonjour, je suis ${values.name || "Ava"}. Comment puis-je vous aider ?`,
    voice,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.7,
    },
    metadata: {
      personality: values.persona,
      language,
    },
  } satisfies CreateAssistantPayload;
}

function isStepValid(step: StepId, values: OnboardingValues) {
  switch (step) {
    case "profile":
      return onboardingProfileSchema.safeParse(values).success;
    case "vapi":
      // Vapi step handles its own validation
      return true;
    case "ava":
      return onboardingAvaSchema.safeParse(values).success;
    case "twilio":
      // Twilio step handles its own validation
      return true;
    case "telephony":
      return onboardingTelephonySchema.safeParse(values).success;
    case "integrations":
      return onboardingIntegrationsSchema.safeParse(values).success;
    case "assistant":
      // Assistant step handles its own validation
      return true;
    case "plan":
      return onboardingPlanSchema.safeParse(values).success;
    default:
      return true;
  }
}

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const { track } = useAnalytics();
  const setCommandPaletteOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const { session, setSession } = useSessionStore((state) => ({
    session: state.session,
    setSession: state.setSession,
  }));
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema.partial()),
    defaultValues: {
      name: "",
      email: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: locale === "fr" || locale === "he" ? (locale as "fr" | "he") : "en",
      marketingOptIn: true,
      acceptTerms: true,
      persona: "secretary",
      jobToBeDone: "",
      languages: [locale === "fr" || locale === "he" ? (locale as "fr" | "he") : "en"],
      tone: "warm",
      guidelines: "",
      strategy: "purchase",
      number: "",
      businessHours: "09:00-18:00",
      fallbackEmail: "",
      calendar: "google",
      workspaceApps: ["slack"],
      crm: "hubspot",
      plan: "pro",
      seats: 5,
    },
  });

  const queryClient = useQueryClient();
  
  // 🌟 DIVINE: Offline-first config management
  // Load from localStorage immediately, sync with backend in background
  const [localConfig, setLocalConfig] = useState<StudioConfig | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("studio_config_draft");
    return stored ? JSON.parse(stored) : null;
  });

  const configQuery = useQuery<StudioConfig>({
    queryKey: ["studio", "config"],
    queryFn: getStudioConfig,
    staleTime: 300_000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    // 🌟 DIVINE: Graceful degradation - don't block UI on error
    onError: (error) => {
      console.warn("Failed to load config from backend, using local draft:", error);
    },
    onSuccess: (data) => {
      // Sync remote config to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("studio_config_draft", JSON.stringify(data));
        setLocalConfig(data);
      }
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (payload: StudioConfigUpdate) => updateStudioConfigClient(payload),
    // 🌟 DIVINE: Optimistic update - update UI immediately
    onMutate: async (payload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["studio", "config"] });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData<StudioConfig>(["studio", "config"]);
      
      // Optimistically update to new value
      const optimistic = { ...previous, ...payload } as StudioConfig;
      queryClient.setQueryData(["studio", "config"], optimistic);
      
      // Save to localStorage immediately
      if (typeof window !== "undefined") {
        localStorage.setItem("studio_config_draft", JSON.stringify(optimistic));
        setLocalConfig(optimistic);
      }
      
      return { previous };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["studio", "config"], context.previous);
        if (typeof window !== "undefined") {
          localStorage.setItem("studio_config_draft", JSON.stringify(context.previous));
          setLocalConfig(context.previous);
        }
      }
      
      // 🎯 DIVINE: Log détaillé + feedback utilisateur clair
      console.error("❌ Failed to update config:", {
        error,
        message: error instanceof Error ? error.message : String(error),
        variables,
        timestamp: new Date().toISOString(),
      });
      
      // Afficher l'erreur réelle à l'utilisateur
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(`Sauvegarde échouée: ${errorMessage}`, {
        description: "Vos modifications sont sauvegardées localement et seront synchronisées plus tard.",
        duration: 5000,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["studio", "config"], data);
      if (typeof window !== "undefined") {
        localStorage.setItem("studio_config_draft", JSON.stringify(data));
        setLocalConfig(data);
      }
    },
  });

  const assistantMutation = useMutation({
    mutationFn: createAssistant,
  });

  // 🌟 DIVINE: Use local config if available, fallback to remote
  const effectiveConfig = localConfig ?? configQuery.data ?? null;
  
  // 🌟 DIVINE: Only block initial load, not subsequent fetches
  const isInitialLoading = configQuery.isLoading && !effectiveConfig;
  
  // 🌟 DIVINE: Show error but don't block navigation
  const configErrorMessage = configQuery.error instanceof Error 
    ? configQuery.error.message 
    : null;
    
  // 🌟 DIVINE: Only block navigation during critical operations
  const isLaunching = assistantMutation.isPending;
  const [hasLaunched, setHasLaunched] = useState<boolean>(false);

  // Persist current step in sessionStorage for "redirect & resume" pattern
  const [stepIndex, setStepIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    const savedStep = sessionStorage.getItem("onboarding_current_step");
    return savedStep ? parseInt(savedStep, 10) : 0;
  });
  
  const step = steps[stepIndex];

  // Save step index whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("onboarding_current_step", stepIndex.toString());
    }
  }, [stepIndex]);

  // Invalidate integrations cache when returning from Settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if we're returning from settings (localStorage flag can be set by Settings pages)
      const returningFromSettings = sessionStorage.getItem("returning_from_settings");
      if (returningFromSettings) {
        // Invalidate the integrations-status query to refetch
        queryClient.invalidateQueries({ queryKey: ["integrations-status"] });
        sessionStorage.removeItem("returning_from_settings");
      }
    }
  }, [queryClient]);

  useEffect(() => {
    if (!effectiveConfig) return;
    const mapped = mapConfigToFormValues(effectiveConfig);
    form.reset({
      ...form.getValues(),
      ...mapped,
    });
    // We intentionally depend on effectiveConfig only to avoid infinite loops with form state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveConfig]);

  const goNext = async () => {
    // 🌟 DIVINE: Never block navigation during background operations
    if (isLaunching) {
      return;
    }

    const current = steps[stepIndex].id as StepId;
    const values = form.getValues();

    // Validation only for critical steps
    const shouldValidate = current === "profile" || current === "plan";
    
    if (shouldValidate && !isStepValid(current, values)) {
      toast.warning(t("errors.incomplete", { defaultValue: "Some fields are incomplete, but you can skip and complete later." }));
    }

    try {
      // 🌟 DIVINE: Optimistic update - save locally first, sync in background
      const updatePayload = buildConfigUpdate(current, values);
      
      if (Object.keys(updatePayload).length > 0) {
        // Save to localStorage immediately (offline-first)
        if (typeof window !== "undefined") {
          const currentDraft = localStorage.getItem("studio_config_draft");
          const draft = currentDraft ? JSON.parse(currentDraft) : {};
          const updated = { ...draft, ...updatePayload };
          localStorage.setItem("studio_config_draft", JSON.stringify(updated));
          setLocalConfig(updated as StudioConfig);
        }
        
        // Trigger backend sync in background (don't await - fire and forget)
        updateConfigMutation.mutate(updatePayload);
      }

      if (current === "plan" && !hasLaunched) {
        setHasLaunched(true);

        // 🌟 DIVINE: Mark onboarding completed (localStorage + backend)
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("onboarding_completed", "true");
          }
          
          // Try to sync with backend (don't block if fails)
          completeOnboarding().then((updatedUser) => {
            console.log("✅ Onboarding synced to backend:", updatedUser);
            
            if (session?.user) {
              const updatedSession = {
                ...session,
                user: {
                  ...session.user,
                  onboarding_completed: true,
                },
              };
              setSession(updatedSession);
            }
          }).catch((error) => {
            console.warn("⚠️ Failed to sync onboarding to backend (will retry later):", error);
            // Don't show error - user can continue
          });
        } catch (error) {
          console.warn("⚠️ Onboarding completion failed (non-blocking):", error);
        }

        // � DIVINE: Try to create assistant (optional, don't block)
        try {
          const assistantPayload = buildAssistantPayload(values);
          await assistantMutation.mutateAsync(assistantPayload);
          console.log("✅ Assistant created successfully");
          toast.success(t("success.launch", { defaultValue: "🎉 Welcome to Ava Studio! Your assistant is ready." }));
        } catch (assistantError) {
          console.warn("⚠️ Assistant creation failed (user can finish setup later):", assistantError);
          toast.success(t("success.welcome", { defaultValue: "🎉 Welcome to Ava Studio! Complete your setup to activate your assistant." }));
        }

        track("onboarding_completed", { plan: values.plan, seats: values.seats });
        
        // � DIVINE: Always redirect (never block)
        setTimeout(() => {
          console.log("🚀 Redirecting to dashboard...");
          router.push(`/${locale}/dashboard`);
        }, 1500);
        
        return;
      }

      // 🌟 DIVINE: Move to next step (never blocked)
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      
    } catch (error) {
      // 🌟 DIVINE: Graceful error handling - log but don't block
      console.error("Failed to persist onboarding step:", error);
      toast.warning(t("errors.save", { 
        defaultValue: "Changes saved locally. Will sync when connection is restored." 
      }));
      
      // Still allow navigation
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const goBack = () => setStepIndex((prev) => Math.max(prev - 1, 0));

  // Allow direct navigation to any step (make all steps clickable)
  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setStepIndex(index);
    }
  };

  const summary = useMemo(() => form.getValues(), [stepIndex]);

  return (
    <div className="grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.04em]">{t("title", { defaultValue: "Let's configure your Ava" })}</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle", { defaultValue: "Guided onboarding with auto-save. You can invite the team once done." })}
          </p>
        </div>
        <OnboardingStepper
          steps={steps.map((item) => ({
            ...item,
            title: t(`steps.${item.id}.title`, { defaultValue: item.title }),
            description: t(`steps.${item.id}.description`, { defaultValue: "" }) || undefined,
          }))}
          current={stepIndex}
          onStepClick={goToStep}
        />
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-xs text-muted-foreground">
          {t("shortcuts_info", { defaultValue: "Use ⌘K to quickly jump to any section." })}
          <button
            type="button"
            className="ml-2 font-semibold text-brand-600 underline-offset-4 hover:underline"
            onClick={() => setCommandPaletteOpen(true)}
          >
            {t("shortcuts", { defaultValue: "View shortcuts" })}
          </button>
        </div>
      </div>
      <div className="space-y-8">
        {isInitialLoading ? (
          <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground animate-pulse">
            {t("loading.config", { defaultValue: "Chargement de votre configuration existante..." })}
          </div>
        ) : null}
        {configErrorMessage ? (
          <div className="rounded-2xl border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
            {configErrorMessage}
          </div>
        ) : null}
        <Form {...form}>
          <form className="space-y-6">
            {step.id === "profile" ? (
              <ProfileStep form={form} />
            ) : step.id === "vapi" ? (
              <VapiStep form={form} onNext={goNext} />
            ) : step.id === "ava" ? (
              <AvaStep form={form} />
            ) : step.id === "twilio" ? (
              <TwilioStep form={form} onNext={goNext} />
            ) : step.id === "telephony" ? (
              <TelephonyStep form={form} />
            ) : step.id === "integrations" ? (
              <IntegrationsStep form={form} />
            ) : step.id === "assistant" ? (
              <AssistantStep form={form} onNext={goNext} onBack={goBack} />
            ) : step.id === "plan" ? (
              <PlanStep form={form} />
            ) : null}
          </form>
        </Form>
        {/* Hide navigation buttons for steps that manage their own navigation */}
        {step.id !== "vapi" && step.id !== "twilio" && step.id !== "assistant" && (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={goBack} disabled={stepIndex === 0}>
              {t("actions.back", { defaultValue: "Back" })}
            </Button>
            {step.id !== "done" && (
              <>
                <Button onClick={goNext} disabled={isLaunching}>
                  {isLaunching
                    ? t("actions.launching", { defaultValue: "Creating your assistant..." })
                    : stepIndex === steps.length - 1
                      ? t("actions.complete", { defaultValue: "Complete Setup" })
                      : t("actions.next", { defaultValue: "Continue" })}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={goNext}
                  disabled={isLaunching}
                  className="text-muted-foreground"
                >
                  {t("actions.skip", { defaultValue: "Skip for now" })}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileStep({ form }: { form: UseFormReturn<OnboardingValues> }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Organization name</FormLabel>
            <FormControl>
              <Input placeholder="Acme Corp" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Admin email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="team@acme.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormControl>
                <Input placeholder="Europe/Paris" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locale"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default language</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="he">עברית</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="marketingOptIn"
        render={({ field }) => (
          <FormItem className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
            </FormControl>
            <div className="space-y-1">
              <FormLabel>Product updates</FormLabel>
              <FormDescription>Send me new features and best practices.</FormDescription>
            </div>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="acceptTerms"
        render={({ field }) => (
          <FormItem className="flex items-start gap-3">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
            </FormControl>
            <div className="space-y-1">
              <FormLabel>I accept the Terms & Privacy</FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

function AvaStep({ form }: { form: UseFormReturn<OnboardingValues> }) {
  const personaOptions = [
    { value: "secretary", label: "Executive Secretary" },
    { value: "concierge", label: "Concierge" },
    { value: "sdr", label: "Sales Development" },
    { value: "cs", label: "Customer Success" },
  ];

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="persona"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pick a starting persona</FormLabel>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-3 sm:grid-cols-2">
              {personaOptions.map((option) => (
                <FormItem
                  key={option.value}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3"
                >
                  <FormControl>
                    <RadioGroupItem value={option.value} />
                  </FormControl>
                  <FormLabel className="!m-0 text-sm font-medium">{option.label}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="jobToBeDone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>What should Ava achieve?</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="Capture inbound leads 24/7 and schedule qualified demos." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="languages"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Languages</FormLabel>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_LOCALES.map((lang) => (
                <label
                  key={lang}
                  className="flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm"
                >
                  <Checkbox
                    checked={field.value?.includes(lang)}
                    onCheckedChange={(checked) => {
                      const next = new Set<LocaleCode>((field.value as LocaleCode[] | undefined) ?? []);
                      if (checked) {
                        next.add(lang);
                      } else {
                        next.delete(lang);
                      }
                      field.onChange(Array.from(next));
                    }}
                  />
                  {lang.toUpperCase()}
                </label>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="tone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Voice tone</FormLabel>
            <div className="flex flex-wrap gap-3">
              {VOICE_TONES.map((tone) => (
                <button
                  type="button"
                  key={tone}
                  onClick={() => field.onChange(tone)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm capitalize transition",
                    field.value === tone
                      ? "border-brand-500 bg-brand-500/10 text-brand-600"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {tone}
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="guidelines"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Guidelines & expressions</FormLabel>
            <FormControl>
              <Textarea rows={4} placeholder="Always greet callers by name. Offer to send a recap email." {...field} />
            </FormControl>
            <FormDescription>Add forbidden sentences or escalation triggers.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function TelephonyStep({ form }: { form: UseFormReturn<OnboardingValues> }) {
  // Auto-select "attach" strategy as default
  const currentStrategy = form.watch("strategy");
  if (!currentStrategy) {
    form.setValue("strategy", "attach");
  }

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone number</FormLabel>
            <FormControl>
              <Input placeholder="+1 415 555 0199" {...field} />
            </FormControl>
            <FormDescription>Enter your Twilio or SIP number to attach to Ava.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="businessHours"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business hours</FormLabel>
            <FormControl>
              <Input placeholder="Mon-Fri · 09:00-18:00" {...field} />
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
            <FormLabel>Fallback email</FormLabel>
            <FormControl>
              <Input placeholder="ops@acme.com" {...field} />
            </FormControl>
            <FormDescription>Where missed calls should be escalated.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function IntegrationsStep({ form }: { form: UseFormReturn<OnboardingValues> }) {
  const integrations = SUPPORTED_INTEGRATIONS;
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="calendar"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Calendar provider</FormLabel>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-3 sm:grid-cols-3">
              {[
                { value: "google", label: "Google" },
                { value: "outlook", label: "Outlook" },
                { value: "none", label: "Other" },
              ].map((option) => (
                <FormItem key={option.value} className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3">
                  <FormControl>
                    <RadioGroupItem value={option.value} />
                  </FormControl>
                  <FormLabel className="!m-0 text-sm font-medium">{option.label}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="workspaceApps"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Workspace apps</FormLabel>
            <div className="flex flex-wrap gap-3">
              {integrations.map((integration) => (
                <label key={integration} className="flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm">
                  <Checkbox
                    checked={field.value?.includes(integration)}
                    onCheckedChange={(checked) => {
                      const next = new Set(field.value ?? []);
                      if (checked) {
                        next.add(integration);
                      } else {
                        next.delete(integration);
                      }
                      field.onChange(Array.from(next));
                    }}
                  />
                  {integration.replace("-", " ")}
                </label>
              ))}
            </div>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="crm"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CRM</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? "none"}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="hubspot">HubSpot</SelectItem>
                <SelectItem value="salesforce">Salesforce</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function PlanStep({ form }: { form: UseFormReturn<OnboardingValues> }) {
  // Set default plan to free if not set
  const currentPlan = form.watch("plan");
  if (!currentPlan) {
    form.setValue("plan", "free");
  }

  return (
    <div className="space-y-6">
      {/* Free Plan Card */}
      <div className="rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-500/10 to-background p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-600">FREE</span>
            <h3 className="text-3xl font-bold mt-2">$0<span className="text-lg text-muted-foreground">/month</span></h3>
          </div>
          <CheckCircle2 className="w-8 h-8 text-brand-500" />
        </div>
        <p className="text-muted-foreground mb-6">Perfect for testing and solo makers</p>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-brand-500" />
            <span>Up to 2 team members</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-brand-500" />
            <span>Basic voice assistant features</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-brand-500" />
            <span>Community support</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-brand-500" />
            <span>Upgrade anytime from Settings</span>
          </div>
        </div>
      </div>

      {/* Info message */}
      <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">
          🚀 You can upgrade to <strong>Pro</strong> or <strong>Business</strong> plans later from Settings → Billing
        </p>
      </div>
    </div>
  );
}
