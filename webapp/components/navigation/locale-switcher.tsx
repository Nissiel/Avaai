"use client";

import { useMemo, useTransition } from "react";
import type { Route } from "next";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales, localeNames, type Locale } from "@/lib/i18n/locales";

function buildLocalizedPath(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/").filter(Boolean);

  if (!segments.length) {
    return `/${nextLocale}`;
  }

  const [, ...rest] = segments;
  const rewrittenSegments = [nextLocale, ...rest];
  return `/${rewrittenSegments.join("/")}`;
}

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("localeSwitcher");

  const options = useMemo(
    () =>
      locales.map((value) => ({
        value,
        label: localeNames[value],
      })),
    [],
  );

  const handleSelect = (nextLocale: Locale) => {
    if (nextLocale === currentLocale) return;

    const targetPath = buildLocalizedPath(pathname, nextLocale);
    startTransition(() => {
      router.replace(targetPath as Route);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t("ariaLabel")}
          disabled={isPending}
        >
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[180px]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={(event) => {
              event.preventDefault();
              handleSelect(option.value);
            }}
            className="flex items-center justify-between gap-2"
          >
            <span>{option.label}</span>
            {option.value === currentLocale ? (
              <span className="text-xs uppercase tracking-wide text-brand-600">{t("active")}</span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
