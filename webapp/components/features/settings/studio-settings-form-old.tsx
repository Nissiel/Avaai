"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCcw, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard } from "@/components/ui/glass-card";
import { createStudioConfigSchema, type StudioConfigInput } from "@/lib/validations/config";

const TIMEZONE_OPTIONS = ["europe/paris", "america/new_york", "asia/tokyo"] as const;
const LANGUAGE_OPTIONS = ["fr", "en", "es"] as const;
const PERSONA_OPTIONS = ["secretary", "concierge", "sdr", "cs"] as const;
const TONE_OPTIONS = ["warm", "professional", "energetic"] as const;

type StudioConfigResponse = StudioConfigInput;

export function StudioSettingsForm() {
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
    defaultValues: configQuery.data,
    mode: "onChange",
  });

  useEffect(() => {
    if (configQuery.data) {
      form.reset(configQuery.data);
    }
  }, [configQuery.data, form]);

  const updateMutation = useMutation<{ success?: boolean; config?: StudioConfigInput }, Error, StudioConfigInput>({
    mutationFn: async (values) => {
      // Validate client-side before sending (ensures localized errors surface)
      localizedSchema.parse(values);

      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail.error ?? tMessages("error"));
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const nextConfig = data.config ?? variables;
      queryClient.setQueryData(["studio-config"], nextConfig);
      form.reset(nextConfig);
      toast.success(tMessages("success"));
    },
    onError: (error) => {
      toast.error(tMessages("error"), { description: error.message });
    },
  });

  const isDisabled = configQuery.isPending || updateMutation.isPending;
  const isDirty = form.formState.isDirty;

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

        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
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
            </div>

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
                    <Textarea {...field} rows={5} disabled={isDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.phoneNumber")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isDisabled} />
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
                      <Input {...field} disabled={isDisabled} />
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

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{t("form.smtpServer")}</h3>
                <p className="text-sm text-muted-foreground">{t("smtpDescription")}</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="smtpServer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.smtpServer")}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isDisabled} />
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
                        <Input {...field} disabled={isDisabled} />
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
                        <Input {...field} disabled={isDisabled} />
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
                        <Input {...field} type="password" disabled={isDisabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (configQuery.data) {
                    form.reset(configQuery.data);
                  }
                }}
                disabled={updateMutation.isPending || !isDirty}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {tActions("reset")}
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={updateMutation.isPending || !isDirty}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tActions("saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {tActions("save")}
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
