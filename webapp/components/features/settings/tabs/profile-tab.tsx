"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/glass-card";
import { DataRow } from "@/components/ui/data-row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fallbackLocale, isLocale, localeNames, type Locale } from "@/lib/i18n/locales";
import { persistSession, type AvaSession } from "@/lib/auth/session-client";
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

export function ProfileTab() {
  const t = useTranslations("settingsPage.profile");
  const tMessages = useTranslations("settingsPage.profile.messages");

  const { session, setSession } = useSessionStore((state) => ({
    session: state.session,
    setSession: state.setSession,
  }));

  const [pendingField, setPendingField] = useState<string | null>(null);

  const userLocale = useMemo(() => {
    const locale = session?.user?.locale;
    return locale && isLocale(locale) ? (locale as Locale) : fallbackLocale;
  }, [session?.user?.locale]);

  const updateProfileMutation = useMutation<UpdateProfileResponse, Error, Partial<{ name: string; phone: string; locale: string }>>({
    mutationFn: async (values) => {
      const payload = {
        ...(values.name !== undefined && { name: values.name.trim() }),
        ...(values.locale !== undefined && { locale: values.locale }),
        ...(values.phone !== undefined && { phone: values.phone.trim() || null }),
      };

      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.detail ?? tMessages("error"));
      }

      return response.json();
    },
    onSuccess: (data) => {
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
      toast.success(tMessages("success"));
      setPendingField(null);
    },
    onError: (error) => {
      toast.error(tMessages("error"), {
        description: error.message,
      });
      setPendingField(null);
    },
  });

  const handleSave = (field: string, value: string) => {
    setPendingField(field);
    updateProfileMutation.mutate({ [field]: value });
  };

  const handleLocaleChange = (value: string) => {
    setPendingField("locale");
    updateProfileMutation.mutate({ locale: value });
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4" variant="none">
        <div className="space-y-1 mb-4">
          <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-xs text-muted-foreground">{t("description")}</p>
        </div>

        <div className="divide-y divide-border/50">
          <DataRow
            label={t("form.name")}
            value={session?.user?.name ?? ""}
            onSave={(value) => handleSave("name", value)}
            disabled={updateProfileMutation.isPending}
            placeholder={t("form.namePlaceholder") || "Enter your name"}
          />

          <DataRow
            label={t("form.email")}
            value={session?.user?.email ?? ""}
            editable={false}
          />

          <DataRow
            label={t("form.phone")}
            value={session?.user?.phone ?? ""}
            onSave={(value) => handleSave("phone", value)}
            type="tel"
            disabled={updateProfileMutation.isPending}
            placeholder={t("form.phonePlaceholder")}
          />
        </div>

        {updateProfileMutation.isPending && pendingField && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
