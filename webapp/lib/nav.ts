import { type LucideIcon, Gauge, Headset, Inbox, Layers, LogOut, Phone, Settings, Users, Wallet, Wand2, Workflow } from "lucide-react";
import { type Locale } from "@/lib/i18n/locales";
import { translate } from "@/lib/translation";

export type NavItem = {
  key: string;
  title: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  shortcut?: string;
};

export function getPrimaryNav(locale: Locale): NavItem[] {
  return [
    { key: "home", title: translate(locale, "common.nav.home"), href: "/app/home", icon: Gauge },
    { key: "ava", title: translate(locale, "common.nav.ava"), href: "/app/ava", icon: Wand2 },
    { key: "calls", title: translate(locale, "common.nav.calls"), href: "/app/calls", icon: Headset },
    { key: "inbox", title: translate(locale, "common.nav.inbox"), href: "/app/inbox", icon: Inbox },
    { key: "schedules", title: translate(locale, "common.nav.schedules"), href: "/app/schedules", icon: Layers },
    { key: "integrations", title: translate(locale, "common.nav.integrations"), href: "/app/integrations", icon: Workflow },
    { key: "phone", title: translate(locale, "common.nav.phone"), href: "/app/phone", icon: Phone },
    { key: "team", title: translate(locale, "common.nav.team"), href: "/app/team", icon: Users },
    { key: "billing", title: translate(locale, "common.nav.billing"), href: "/app/billing", icon: Wallet },
    { key: "settings", title: translate(locale, "common.nav.settings"), href: "/app/settings", icon: Settings },
    { key: "logs", title: translate(locale, "common.nav.logs"), href: "/app/logs", icon: Layers }
  ];
}

export function getAccountNav(locale: Locale): NavItem[] {
  return [
    {
      key: "logout",
      title: translate(locale, "auth.signOut", "Sign out"),
      href: "/auth/sign-out",
      icon: LogOut
    }
  ];
}
