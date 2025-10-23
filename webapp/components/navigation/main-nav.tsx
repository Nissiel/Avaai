"use client";

import { motion } from "framer-motion";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { getPrimaryNav } from "@/lib/nav";
import { Link } from "@/lib/i18n/routing";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

export function MainNav() {
  const localeFromHook = useLocale();
  const pathname = usePathname();
  const locale: Locale = isLocale(localeFromHook) ? localeFromHook : fallbackLocale;
  const items = getPrimaryNav(locale);

  return (
    <nav className="hidden w-full min-w-[240px] flex-col gap-1 lg:flex">
      {items.map((item) => {
        const isActive = pathname?.startsWith(`/${locale}${item.href}`);
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={{ pathname: item.href }}
            className={cn(
              "group relative flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold transition-colors",
              isActive ? "text-brand-700" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="tracking-[-0.01em]">{item.title}</span>
            {isActive ? (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 -z-10 rounded-2xl border border-brand-500/40 bg-brand-500/10 shadow-elevated"
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
