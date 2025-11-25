"use client";

import { useMemo } from "react";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { User, Building2, Puzzle } from "lucide-react";

import { cn } from "@/lib/utils";
import { ProfileTab } from "@/components/features/settings/tabs/profile-tab";
import { BusinessTab } from "@/components/features/settings/tabs/business-tab";
import { IntegrationsTab } from "@/components/features/settings/tabs/integrations-tab";
import { useSessionStore } from "@/stores/session-store";

const TAB_KEYS = ["profile", "business", "integrations"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function isTabKey(value: string | null): value is TabKey {
  return value ? TAB_KEYS.includes(value as TabKey) : false;
}

const tabConfig: Record<TabKey, { icon: React.ReactNode; labelKey: string }> = {
  profile: {
    icon: <User className="h-4 w-4" />,
    labelKey: "profile",
  },
  business: {
    icon: <Building2 className="h-4 w-4" />,
    labelKey: "business",
  },
  integrations: {
    icon: <Puzzle className="h-4 w-4" />,
    labelKey: "integrations",
  },
};

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

  const displayName = session?.user?.name ?? session?.user?.email ?? "Your Profile";

  const handleTabChange = (value: TabKey) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("section", value);
    const nextUrl = `${pathname}?${params.toString()}` as Route;
    router.replace(nextUrl, { scroll: false });
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-medium">
          {tHeader("title")}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
        <p className="text-sm text-muted-foreground">{tHeader("subtitle")}</p>
      </header>

      {/* Main Layout - Horizontal Tabs */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <nav className="flex gap-1 border-b border-border pb-2">
          {TAB_KEYS.map((tab) => {
            const config = tabConfig[tab];
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  "hover:bg-muted/50",
                  isActive
                    ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                    : "text-muted-foreground border border-transparent"
                )}
              >
                {config.icon}
                <span>{tTabs(config.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className="min-w-0">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "business" && <BusinessTab />}
          {activeTab === "integrations" && <IntegrationsTab />}
        </div>
      </div>
    </section>
  );
}
