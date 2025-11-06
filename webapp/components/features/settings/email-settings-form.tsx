"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ExternalLink, Loader2, MailCheck } from "lucide-react";

import { getStudioConfig, updateStudioConfigClient } from "@/lib/api/config";
import type { StudioConfig, StudioConfigUpdate } from "@/lib/dto";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const EMAIL_STEPS_KEYS = ["step1", "step2", "step3", "step4"] as const;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createEmailSettingsSchema = (t: (key: string) => string) =>
  z
    .object({
      fallbackEmail: z
        .string()
        .trim()
        .optional()
        .refine((value) => !value || emailRegex.test(value), {
          message: t("errors.email"),
        }),
      summaryEmail: z
        .string()
        .trim()
        .optional()
        .refine((value) => !value || emailRegex.test(value), {
          message: t("errors.email"),
        }),
      smtpServer: z.string().trim().optional(),
      smtpPort: z
        .string()
        .trim()
        .optional()
        .refine((value) => !value || /^\d+$/.test(value), { message: t("errors.port") }),
      smtpUsername: z.string().trim().optional(),
      smtpPassword: z.string().trim().optional(),
    })
    .superRefine((values, ctx) => {
      const filledFields = [
        values.smtpServer?.length,
        values.smtpPort?.length,
        values.smtpUsername?.length,
        values.smtpPassword?.length,
      ].filter(Boolean).length;

      if (filledFields === 0) {
        return;
      }

      const requiredFields: Array<keyof typeof values> = [
        "smtpServer",
        "smtpPort",
        "smtpUsername",
        "smtpPassword",
      ];

      for (const field of requiredFields) {
        if (!values[field] || !values[field]?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: t("errors.smtpIncomplete"),
          });
        }
      }
    });

type EmailSettingsValues = z.infer<ReturnType<typeof createEmailSettingsSchema>>;

export function EmailSettingsForm() {
  const t = useTranslations("settingsPage.email");
  const tTabs = useTranslations("settingsPage.tabs");
  const queryClient = useQueryClient();

  const schema = useMemo(() => createEmailSettingsSchema(t), [t]);

  const form = useForm<EmailSettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fallbackEmail: "",
      summaryEmail: "",
      smtpServer: "",
      smtpPort: "587",
      smtpUsername: "",
      smtpPassword: "",
    },
  });

  const configQuery = useQuery<StudioConfig>({
    queryKey: ["studio-config"],
    queryFn: getStudioConfig,
    staleTime: 60_000,
  });

  const isConfigured =
    !!configQuery.data?.smtpServer &&
    !!configQuery.data?.smtpUsername &&
    !!configQuery.data?.smtpPassword;

  useEffect(() => {
    if (configQuery.data) {
      form.reset({
        fallbackEmail: configQuery.data.fallbackEmail ?? "",
        summaryEmail: configQuery.data.summaryEmail ?? "",
        smtpServer: configQuery.data.smtpServer ?? "",
        smtpPort: configQuery.data.smtpPort ?? "587",
        smtpUsername: configQuery.data.smtpUsername ?? "",
        smtpPassword: configQuery.data.smtpPassword ?? "",
      });
    }
  }, [configQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: EmailSettingsValues) => {
      const payload: StudioConfigUpdate = {
        fallbackEmail: values.fallbackEmail?.trim() ?? "",
        summaryEmail: values.summaryEmail?.trim() ?? "",
        smtpServer: values.smtpServer?.trim() ?? "",
        smtpPort: values.smtpPort?.trim() || "587",
        smtpUsername: values.smtpUsername?.trim() ?? "",
        smtpPassword: values.smtpPassword?.trim() ?? "",
      };

      return updateStudioConfigClient(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio-config"] });
      toast.success(t("messages.success"));
    },
    onError: (error) => {
      toast.error(t("messages.error"), {
        description: error.message,
      });
    },
  });

  const providerGuides = useMemo(() => {
    const googleSteps = EMAIL_STEPS_KEYS.map((key) => t(`guides.google.steps.${key}`)).filter(Boolean);
    const outlookSteps = EMAIL_STEPS_KEYS.map((key) => t(`guides.outlook.steps.${key}`)).filter(Boolean);
    return [
      {
        id: "google",
        title: t("guides.google.title"),
        description: t("guides.google.description"),
        steps: googleSteps,
        link: "https://support.google.com/accounts/answer/185833",
        linkLabel: t("guides.google.linkLabel"),
      },
      {
        id: "outlook",
        title: t("guides.outlook.title"),
        description: t("guides.outlook.description"),
        steps: outlookSteps,
        link: "https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission",
        linkLabel: t("guides.outlook.linkLabel"),
      },
    ];
  }, [t]);

  const onSubmit = (values: EmailSettingsValues) => {
    updateMutation.mutate(values);
  };

  const statusLabel = isConfigured ? t("status.connected") : t("status.missing");
  const statusClass = isConfigured
    ? "bg-status-success/15 text-status-success"
    : "bg-status-warning/15 text-status-warning";

  return (
    <div className="space-y-6">
      <GlassCard className="space-y-6" variant="none">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-brand-500">{tTabs("email")}</p>
            <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Badge className={statusClass}>{statusLabel}</Badge>
        </div>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fallbackEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.fallbackEmail")}</FormLabel>
                    <FormControl>
                      <Input placeholder="ops@yourdomain.com" {...field} />
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
                      <Input placeholder="founder@yourdomain.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="bg-border/60" />

            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-tight">{t("form.smtpTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("form.providerHint")}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="smtpServer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.smtpServer")}</FormLabel>
                    <FormControl>
                      <Input placeholder="smtp.gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="smtpPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.smtpPort")}</FormLabel>
                    <FormControl>
                      <Input placeholder="587" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="smtpUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.smtpUsername")}</FormLabel>
                    <FormControl>
                      <Input placeholder="notifications@yourdomain.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="smtpPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.smtpPassword")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="App password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <MailCheck className="h-4 w-4 text-brand-500" />
                <span>{t("status.caption")}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => configQuery.data && form.reset({
                    fallbackEmail: configQuery.data.fallbackEmail ?? "",
                    summaryEmail: configQuery.data.summaryEmail ?? "",
                    smtpServer: configQuery.data.smtpServer ?? "",
                    smtpPort: configQuery.data.smtpPort ?? "587",
                    smtpUsername: configQuery.data.smtpUsername ?? "",
                    smtpPassword: configQuery.data.smtpPassword ?? "",
                  })}
                  disabled={configQuery.isLoading || updateMutation.isPending}
                >
                  {t("actions.reset")}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("actions.save")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {providerGuides.map((provider) => (
          <GlassCard key={provider.id} className="space-y-4 border border-border/60" variant="none">
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold tracking-tight">{provider.title}</h3>
              <p className="text-sm text-muted-foreground">{provider.description}</p>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              {provider.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold text-brand-500">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <Button variant="outline" className="gap-2" asChild>
              <a href={provider.link} target="_blank" rel="noreferrer">
                {provider.linkLabel}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
