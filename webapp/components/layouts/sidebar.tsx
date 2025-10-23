"use client";

import * as React from "react";
import { GaugeCircle, Bot, PhoneCall, LineChart, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { NavLink } from "@/components/ui/nav-link";
import { cn } from "@/lib/utils";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV_ITEMS: SidebarNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: GaugeCircle, exact: true },
  { label: "Assistants", href: "/assistants", icon: Bot },
  { label: "Appels", href: "/calls", icon: PhoneCall },
  { label: "Analytics", href: "/analytics", icon: LineChart },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden h-full w-[260px] flex-col border-r border-border/60 bg-background/70 backdrop-blur-xl md:flex",
        className,
      )}
    >
      <div className="flex items-center justify-between px-5 py-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-[-0.04em]">
          Ava Studio
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} exact={item.exact} />
        ))}
      </nav>
      <div className="px-4 pb-6">
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">🎯 Astuce</p>
          <p>Appuyez sur ⌘K pour ouvrir la palette et naviguer plus rapidement.</p>
        </div>
      </div>
    </aside>
  );
}

export const sidebarNavItems = NAV_ITEMS;
