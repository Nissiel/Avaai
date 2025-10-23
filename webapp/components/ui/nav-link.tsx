"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  label: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  exact?: boolean;
}

export function NavLink({ href, label, icon: Icon, badge, exact = false, className, ...rest }: NavLinkProps) {
  const pathname = usePathname();
  const normalizedHref = href;
  const isActive = exact
    ? pathname === normalizedHref
    : pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);

  return (
    <Link
      href={href as any}
      className={cn(
        "group flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium transition",
        isActive
          ? "bg-brand-500/15 text-brand-600 shadow-inner shadow-brand-500/20"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
        className,
      )}
      {...rest}
    >
      <span className="flex items-center gap-2">
        {Icon ? (
          <Icon
            className={cn(
              "h-4 w-4 transition",
              isActive ? "text-brand-600" : "text-muted-foreground group-hover:text-foreground",
            )}
          />
        ) : null}
        {label}
      </span>
      {badge ? <span className="text-xs text-muted-foreground">{badge}</span> : null}
    </Link>
  );
}
