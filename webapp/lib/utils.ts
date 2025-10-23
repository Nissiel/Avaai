import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, locale = "en", currency: string | undefined = "USD") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${Math.round(value).toLocaleString()}`;
  }
}

export function formatNumber(value: number, locale = "en") {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function formatDate(date: Date | string, locale = "en", options?: Intl.DateTimeFormatOptions) {
  const instance = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, options ?? { dateStyle: "medium" }).format(instance);
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function classNames(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function assertNever(value: never, message = "Unexpected value"): never {
  throw new Error(`${message}: ${value}`);
}
