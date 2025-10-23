import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { fallbackLocale, locales } from "@/lib/i18n/locales";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: fallbackLocale,
  localePrefix: "always",
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)"],
};
