import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";
import { fallbackLocale, locales } from "./locales";

export const routing = defineRouting({
  locales,
  defaultLocale: fallbackLocale,
  localePrefix: "always",
});

export const { Link, getPathname, redirect, usePathname, useRouter } = createNavigation(routing);
