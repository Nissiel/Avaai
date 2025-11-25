"use client";

import * as React from "react";
import type { Route } from "next";
import {
  GaugeCircle,
  Bot,
  Users,
  Phone,
  User,
  Settings,
  CreditCard,
  type LucideIcon
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { NavLink } from "@/components/ui/nav-link";
import { AvaLogoWordmark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

type SidebarNavDefinition = {
  labelKey: string;
  path: string;
  icon: LucideIcon;
  exact?: boolean;
};

// Main navigation items
const MAIN_NAV: SidebarNavDefinition[] = [
  { labelKey: "dashboard", path: "dashboard", icon: GaugeCircle, exact: true },
  { labelKey: "assistants", path: "app/assistants", icon: Bot },
  { labelKey: "phone", path: "app/phone", icon: Phone },
  { labelKey: "contacts", path: "app/contacts", icon: Users },
];

// Account navigation items
const ACCOUNT_NAV: SidebarNavDefinition[] = [
  { labelKey: "profile", path: "settings?section=profile", icon: User },
  { labelKey: "settings", path: "settings", icon: Settings },
  { labelKey: "billing", path: "app/billing", icon: CreditCard },
];

function buildNavItems(
  definitions: SidebarNavDefinition[],
  locale: string,
  translate: (key: string) => string
): SidebarNavItem[] {
  const prefix = `/${locale}`.replace(/\/{2,}/g, "/");
  return definitions.map(({ path, labelKey, ...rest }) => ({
    ...rest,
    label: translate(labelKey),
    href: `${prefix}/${path}`.replace(/\/{2,}/g, "/"),
  }));
}

export function useSidebarNavItems(): { main: SidebarNavItem[]; account: SidebarNavItem[] } {
  const locale = useLocale();
  const t = useTranslations("sidebarNav");
  return React.useMemo(() => ({
    main: buildNavItems(MAIN_NAV, locale, t),
    account: buildNavItems(ACCOUNT_NAV, locale, t),
  }), [locale, t]);
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { main, account } = useSidebarNavItems();
  const t = useTranslations("sidebarNav");
  const homeHref = main[0]?.href ?? "/";

  return (
    <aside
      className={cn(
        "hidden sticky top-0 h-screen w-[260px] flex-col border-r border-border/60 bg-background/70 backdrop-blur-xl md:flex",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-6">
        <Link href={homeHref as Route} className="transition-opacity hover:opacity-90">
          <AvaLogoWordmark subtitle="Studio" />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3">
        <div className="mb-2">
          <span className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("sections.main")}
          </span>
        </div>
        <div className="space-y-1">
          {main.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              exact={item.exact}
            />
          ))}
        </div>
      </nav>

      {/* Account Navigation */}
      <div className="px-3 pb-6">
        <div className="mb-2">
          <span className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("sections.account")}
          </span>
        </div>
        <div className="space-y-1">
          {account.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              exact={item.exact}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

// Export for compatibility
export const sidebarNavDefinitions = [...MAIN_NAV, ...ACCOUNT_NAV];
