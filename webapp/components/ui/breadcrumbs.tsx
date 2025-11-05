"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

function humanize(segment: string): string {
  return segment
    .replace(/\(.*?\)/g, "")
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Extract locale from pathname (first segment)
  const locale = segments[0] || "en";
  const dashboardHref = `/${locale}/dashboard`;

  if (segments.length === 0) {
    return (
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <span className="font-medium text-foreground">Dashboard</span>
      </nav>
    );
  }

  const crumbs = segments.map((segment, index) => {
    let href = "/" + segments.slice(0, index + 1).join("/");

    // Fix: "onboarding" should link to "onboarding/welcome" instead of "onboarding"
    if (segment === "onboarding" && index === segments.length - 1) {
      href = href + "/welcome";
    }

    const label = humanize(segment || "dashboard");
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
      <Link href={dashboardHref as any} className="transition hover:text-foreground">
        Dashboard
      </Link>
      {crumbs.map(({ href, label, isLast }) => (
        <span key={href} className="flex items-center gap-2">
          <ChevronRight className="h-3 w-3" />
          {isLast ? (
            <span className="font-medium text-foreground">{label}</span>
          ) : (
            <Link href={href as any} className="transition hover:text-foreground">
              {label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
