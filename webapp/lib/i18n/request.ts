import { match } from "@formatjs/intl-localematcher";
import { getRequestConfig } from "next-intl/server";
import Negotiator from "negotiator";
import { headers } from "next/headers";
import { fallbackLocale, isLocale, locales, type Locale } from "./locales";

function negotiateLocale(requested?: string[] | string | null): Locale {
  const header = headers().get("accept-language") ?? undefined;
  const negotiator = new Negotiator({
    headers: {
      "accept-language":
        typeof requested === "string"
          ? requested
          : Array.isArray(requested)
          ? requested.join(", ")
          : header,
    },
  });
  const languages = negotiator.languages();
  const matched = match(languages, locales, fallbackLocale) as Locale;
  return matched;
}

async function maybeRequestLocale(): Promise<string | undefined> {
  try {
    const mod = await import("next-intl/server");
    const fn = (mod as any).requestLocale;
    if (typeof fn === "function") {
      return await fn();
    }
  } catch {
    // requestLocale not available in this next-intl version
  }
  return undefined;
}

export default getRequestConfig(async ({ locale }) => {
  const localeFromRequest = await maybeRequestLocale();
  const resolvedLocale = isLocale(localeFromRequest ?? locale) ? (localeFromRequest ?? locale) : negotiateLocale(localeFromRequest ?? locale);
  try {
    const messages = (await import(`@/messages/${resolvedLocale}.json`)).default;
    return {
      locale: resolvedLocale,
      messages,
    };
  } catch (error) {
    throw new Error(`Missing i18n messages for locale "${resolvedLocale}": ${(error as Error).message}`);
  }
});
