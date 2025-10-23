"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";

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
import { OnboardingStepper } from "@/components/onboarding/stepper";
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

const steps = [
  { id: "profile", title: "Profile" },
  { id: "ava", title: "Personalize Ava" },
  { id: "telephony", title: "Telephony" },
  { id: "integrations", title: "Integrations" },
  { id: "plan", title: "Plan" },
  { id: "done", title: "Done" },
];

type StepId = typeof steps[number]["id"];

function isStepValid(step: StepId, values: OnboardingValues) {
  switch (step) {
    case "profile":
      return onboardingProfileSchema.safeParse(values).success;
    case "ava":
      return onboardingAvaSchema.safeParse(values).success;
    case "telephony":
      return onboardingTelephonySchema.safeParse(values).success;
    case "integrations":
      return onboardingIntegrationsSchema.safeParse(values).success;
    case "plan":
      return onboardingPlanSchema.safeParse(values).success;
    default:
      return true;
  }
}

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const { track } = useAnalytics();
  const setCommandPaletteOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema.partial()),
    defaultValues: {
      name: "",
      email: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: locale === "fr" || locale === "he" ? (locale as "fr" | "he") : "en",
      marketingOptIn: true,
      acceptTerms: false,
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

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  const goNext = async () => {
    const current = steps[stepIndex].id as StepId;
    const values = form.getValues();
    if (!isStepValid(current, values)) {
      toast.error(t("errors.incomplete", { defaultValue: "Please complete required fields." }));
      return;
    }
    if (stepIndex === steps.length - 2) {
      track("onboarding_completed", { plan: values.plan, seats: values.seats });
    }
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => setStepIndex((prev) => Math.max(prev - 1, 0));

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
        />
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-xs text-muted-foreground">
          {t("autosave", { defaultValue: "Auto-saving every 10 seconds. Use ⌘K to jump to sections." })}
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
        <Form {...form}>
          <form className="space-y-6">
            {step.id === "profile" ? (
              <ProfileStep form={form} />
            ) : step.id === "ava" ? (
              <AvaStep form={form} />
            ) : step.id === "telephony" ? (
              <TelephonyStep form={form} />
            ) : step.id === "integrations" ? (
              <IntegrationsStep form={form} />
            ) : step.id === "plan" ? (
              <PlanStep form={form} />
            ) : (
              <DoneStep summary={summary} />
            )}
          </form>
        </Form>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={goBack} disabled={stepIndex === 0}>
            {t("actions.back", { defaultValue: "Back" })}
          </Button>
          {step.id !== "done" ? (
            <Button onClick={goNext}>
              {stepIndex === steps.length - 2
                ? t("actions.launch", { defaultValue: "Launch Ava" })
                : t("actions.next", { defaultValue: "Continue" })}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfileStep({ form }: { form: ReturnType<typeof useForm<OnboardingValues>> }) {
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

function AvaStep({ form }: { form: ReturnType<typeof useForm<OnboardingValues>> }) {
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
              {["en", "fr", "he"].map((lang) => (
                <label
                  key={lang}
                  className="flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm"
                >
                  <Checkbox
                    checked={field.value?.includes(lang)}
                    onCheckedChange={(checked) => {
                      const next = new Set(field.value ?? []);
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

function TelephonyStep({ form }: { form: ReturnType<typeof useForm<OnboardingValues>> }) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="strategy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Choose phone strategy</FormLabel>
            <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-3 sm:grid-cols-2">
              <FormItem className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                <FormControl>
                  <RadioGroupItem value="attach" />
                </FormControl>
                <div>
                  <FormLabel className="!m-0 text-sm font-semibold">Attach existing number</FormLabel>
                  <FormDescription>Bring your Twilio or SIP number.</FormDescription>
                </div>
              </FormItem>
              <FormItem className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                <FormControl>
                  <RadioGroupItem value="purchase" />
                </FormControl>
                <div>
                  <FormLabel className="!m-0 text-sm font-semibold">Purchase with Ava</FormLabel>
                  <FormDescription>We provision a dedicated Twilio number.</FormDescription>
                </div>
              </FormItem>
            </RadioGroup>
            <FormMessage />
          </FormItem>
        )}
      />
      {form.watch("strategy") === "attach" ? (
        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Existing number</FormLabel>
              <FormControl>
                <Input placeholder="+1 415 555 0199" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
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

function IntegrationsStep({ form }: { form: ReturnType<typeof useForm<OnboardingValues>> }) {
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

function PlanStep({ form }: { form: ReturnType<typeof useForm<OnboardingValues>> }) {
  const plans = [
    { id: "free", price: 0, seats: 2, description: "For testing and solo makers" },
    { id: "pro", price: 199, seats: 10, description: "Growing teams with routing" },
    { id: "business", price: 499, seats: 25, description: "Compliance & analytics" },
  ];
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="plan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select plan</FormLabel>
            <div className="grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <button
                  type="button"
                  key={plan.id}
                  onClick={() => field.onChange(plan.id)}
                  className={cn(
                    "flex flex-col gap-2 rounded-3xl border p-4 text-left transition",
                    field.value === plan.id
                      ? "border-brand-500 bg-brand-500/10"
                      : "border-border/70 bg-background",
                  )}
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.12em]">{plan.id.toUpperCase()}</span>
                  <span className="text-2xl font-semibold">
                    {plan.price === 0 ? "Free" : formatCurrency(plan.price, "en", "USD") + "/mo"}
                  </span>
                  <span className="text-xs text-muted-foreground">{plan.description}</span>
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="seats"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Seats</FormLabel>
            <FormControl>
              <Input type="number" min={1} max={50} {...field} onChange={(event) => field.onChange(Number(event.target.value))} />
            </FormControl>
            <FormDescription>We will auto-create invites for your teammates.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function DoneStep({ summary }: { summary: OnboardingValues }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-[-0.03em]">You're all set!</h2>
      <p className="text-sm text-muted-foreground">
        Invite your teammates, trigger a test call, and configure analytics in Ava Studio.
      </p>
      <div className="rounded-3xl border border-border/70 bg-background p-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Persona</p>
            <p className="font-semibold">
            {summary.persona?.toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Languages</p>
            <p className="font-semibold">{summary.languages?.join(", ").toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Telephony</p>
            <p className="font-semibold">{summary.strategy === "attach" ? "Attaching existing number" : "Purchasing via Ava"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Plan</p>
            <p className="font-semibold">{summary.plan?.toUpperCase()} · {summary.seats} seats</p>
          </div>
        </div>
      </div>
      <Button size="lg" className="w-full" type="button">
        Launch Ava Studio
      </Button>
    </div>
  );
}
