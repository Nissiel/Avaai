"use client";

import { useMemo } from "react";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettingsForm } from "@/components/features/settings/profile-settings-form";
import { StudioSettingsForm } from "@/components/features/settings/studio-settings-form";
import { useSessionStore } from "@/stores/session-store";

const TAB_KEYS = ["profile", "studio"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return value ? TAB_KEYS.includes(value as TabKey) : false;
}

export function SettingsView() {
  const { session } = useSessionStore((state) => ({ session: state.session }));
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tHeader = useTranslations("settingsPage.header");
  const tTabs = useTranslations("settingsPage.tabs");
  const activeTab = useMemo<TabKey>(() => {
    const sectionParam = searchParams?.get("section");
    if (isTabKey(sectionParam)) {
      return sectionParam;
    }
    return "profile";
  }, [searchParams]);

  const displayName = session?.user?.name ?? session?.user?.email ?? "Votre profil";

  const handleTabChange = (value: string) => {
    if (!isTabKey(value)) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("section", value);
    const nextUrl = `${pathname}?${params.toString()}` as Route;
    router.replace(nextUrl, { scroll: false });
  };

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.24em] text-brand-500">{tHeader("title")}</p>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{displayName}</h1>
          <p className="text-sm text-muted-foreground">{tHeader("subtitle")}</p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="profile">{tTabs("profile")}</TabsTrigger>
          <TabsTrigger value="studio">{tTabs("studio")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettingsForm />
        </TabsContent>

        <TabsContent value="studio" className="space-y-6">
          <StudioSettingsForm />
        </TabsContent>
      </Tabs>
    </section>
  );
}
