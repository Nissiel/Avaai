"use client";

import * as React from "react";
import type { Route } from "next";
import { GaugeCircle, Bot, Users, UserCog, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { NavLink } from "@/components/ui/nav-link";
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

const NAV_DEFINITIONS: SidebarNavDefinition[] = [
  { labelKey: "dashboard", path: "dashboard", icon: GaugeCircle, exact: true },
  { labelKey: "assistants", path: "app/assistants", icon: Bot },
  { labelKey: "contacts", path: "app/contacts", icon: Users },
  { labelKey: "profile", path: "settings?section=profile", icon: UserCog },
];

function buildSidebarNavItems(locale: string, translate: (key: string) => string): SidebarNavItem[] {
  const prefix = `/${locale}`.replace(/\/{2,}/g, "/");
  return NAV_DEFINITIONS.map(({ path, labelKey, ...rest }) => ({
    ...rest,
    label: translate(labelKey),
    href: `${prefix}/${path}`.replace(/\/{2,}/g, "/"),
  }));
}

export function useSidebarNavItems(): SidebarNavItem[] {
  const locale = useLocale();
  const t = useTranslations("sidebarNav");
  return React.useMemo(() => buildSidebarNavItems(locale, t), [locale, t]);
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const items = useSidebarNavItems();
  const homeHref = items[0]?.href ?? "/";

  return (
    <aside
      className={cn(
        "hidden h-full w-[260px] flex-col border-r border-border/60 bg-background/70 backdrop-blur-xl md:flex",
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 py-6">
        <Link href={homeHref as Route} className="text-lg font-semibold tracking-[-0.04em]">
          Ava Studio
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 pb-6">
        {items.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} exact={item.exact} />
        ))}
      </nav>
    </aside>
  );
}

export const sidebarNavDefinitions = NAV_DEFINITIONS;
