"use client";

import { useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard } from "@/components/ui/glass-card";
import { createProfileSettingsSchema, type ProfileSettingsValues } from "@/lib/validations/profile";
import { fallbackLocale, isLocale, localeNames, type Locale } from "@/lib/i18n/locales";
import {
  getBackendBaseUrl,
  persistSession,
  type AvaSession,
} from "@/lib/auth/session-client";
import { useSessionStore } from "@/stores/session-store";

interface UpdateProfileResponse {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  locale: string;
  image?: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  phone_verified: boolean;
}

export function ProfileSettingsForm() {
  const locale = useLocale();
  const t = useTranslations("settingsPage.profile");
  const tActions = useTranslations("settingsPage.profile.actions");
  const tMessages = useTranslations("settingsPage.profile.messages");

  const { session, setSession } = useSessionStore((state) => ({
    session: state.session,
    setSession: state.setSession,
  }));

  const initialValues = useMemo<ProfileSettingsValues>(() => {
    const userLocale = session?.user?.locale;
    const safeLocale: Locale =
      userLocale && isLocale(userLocale) ? (userLocale as Locale) : fallbackLocale;

    return {
      name: session?.user?.name ?? "",
      email: session?.user?.email ?? "",
      phone: session?.user?.phone ?? "",
      locale: safeLocale,
    };
  }, [session?.user?.email, session?.user?.locale, session?.user?.name, session?.user?.phone]);

  const profileSchema = useMemo(
    () => createProfileSettingsSchema((key, params) => t(key, params as any)),
    [t],
  );

  const form = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  // Watch for form changes
  const watchedValues = form.watch();

  useEffect(() => {
    console.log("📝 Form values changed:", watchedValues);
  }, [watchedValues]);

  useEffect(() => {
    console.log("🔄 Resetting form with initialValues:", initialValues);
    form.reset(initialValues);
  }, [initialValues, form]);

  const updateProfileMutation = useMutation<UpdateProfileResponse, Error, ProfileSettingsValues>({
    mutationFn: async (values) => {
      const accessToken =
        session?.accessToken ??
        (typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null);

      if (!accessToken) {
        throw new Error(tMessages("sessionExpired"));
      }

      const payload = {
        name: values.name.trim(),
        locale: values.locale,
        phone: values.phone?.trim() ? values.phone.trim() : null,
      };

      const response = await fetch(`${getBackendBaseUrl()}/api/v1/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.detail ?? tMessages("error"));
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const refreshToken =
        session?.refreshToken ??
        (typeof window !== "undefined"
          ? window.localStorage.getItem("refresh_token") ?? undefined
          : undefined);

      const nextSession: AvaSession = {
        ...(session ?? {
          user: {
            id: data.id,
            name: data.name ?? null,
            email: data.email ?? null,
            image: data.image ?? null,
          },
          expires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        }),
        user: {
          ...(session?.user ?? {
            id: data.id,
            name: null,
            email: null,
            image: null,
          }),
          id: data.id,
          name: data.name ?? null,
          email: data.email ?? null,
          image: data.image ?? null,
          locale: data.locale,
          phone: data.phone ?? null,
          onboarding_completed: data.onboarding_completed,
          onboarding_step: data.onboarding_step,
          phone_verified: data.phone_verified,
        },
        accessToken:
          session?.accessToken ??
          (typeof window !== "undefined" ? window.localStorage.getItem("access_token") ?? undefined : undefined),
        refreshToken,
      };

      setSession(nextSession);
      persistSession(nextSession);
      form.reset({
        ...variables,
        phone: variables.phone ?? "",
      });
      toast.success(tMessages("success"));
    },
    onError: (error) => {
      toast.error(tMessages("error"), {
        description: error.message,
      });
    },
  });

  const onSubmit = (values: ProfileSettingsValues) => {
    console.log("🚀 Profile form submitted:", values);
    updateProfileMutation.mutate(values);
  };

  const handleReset = () => {
    console.log("🔄 Resetting form to:", initialValues);
    form.reset(initialValues);
  };

  const isDirty = form.formState.isDirty;

  console.log("📊 Form state:", {
    isDirty,
    isValid: form.formState.isValid,
    isPending: updateProfileMutation.isPending,
    errors: form.formState.errors,
  });

  return (
    <GlassCard className="space-y-6" variant="none">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <Form {...form}>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.name")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={updateProfileMutation.isPending} />
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
                <FormLabel>{t("form.email")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.phone")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("form.phonePlaceholder")}
                      disabled={updateProfileMutation.isPending}
                    />
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
                  <FormLabel>{t("form.locale")}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={updateProfileMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(localeNames).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
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

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={handleReset}
              disabled={updateProfileMutation.isPending || !isDirty}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {tActions("reset")}
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={!isDirty || !form.formState.isValid || updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
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
  );
}
