"use client";

import * as React from "react";
import type { Locale as DateFnsLocale } from "date-fns";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { formatDuration } from "@/lib/formatters/duration";
import { humanizeIdentifier } from "@/lib/formatters/name";
import { cn } from "@/lib/utils";
import type { CallSummary } from "@/lib/dto";

export interface ContactCardData {
  id: string;
  phone: string;
  alias?: string | null;
  callCount: number;
  lastCallAt?: Date | null;
  firstCallAt?: Date | null;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  recentCalls: CallSummary[];
}

interface ContactCardProps {
  contact: ContactCardData;
  dateLocale: DateFnsLocale;
}

function getInitials(label: string) {
  return label
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ContactCard({ contact, dateLocale }: ContactCardProps) {
  const locale = useLocale();
  const t = useTranslations("contactsPage.card");

  const isUnknownPhone = !contact.phone || contact.phone === "unknown";
  const rawPhone = contact.phone ?? "";
  const phoneDisplay = isUnknownPhone ? t("unknownNumber") : humanizeIdentifier(rawPhone);
  const displayName = contact.alias?.trim().length
    ? humanizeIdentifier(contact.alias)
    : phoneDisplay || t("unknownNumber");
  const subtitle = contact.alias?.trim().length ? phoneDisplay : t("callCount", { count: contact.callCount });

  const lastContactLabel = contact.lastCallAt
    ? format(contact.lastCallAt, "dd MMM", { locale: dateLocale })
    : t("unknownDate");
  const totalDuration = formatDuration(contact.totalDurationSeconds, locale, { includeSeconds: false });
  const averageDuration = formatDuration(contact.averageDurationSeconds, locale, { includeSeconds: false });

  return (
    <GlassCard
      variant="none"
      className={cn(
        "group flex h-full flex-col gap-4 rounded-2xl border border-border/50",
        "bg-gradient-to-br from-background/70 via-background/50 to-brand-500/5 p-4",
        "transition hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/10",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-brand-500/30 bg-brand-500/10 text-brand-600">
            <AvatarFallback className="text-xs font-semibold uppercase tracking-wide">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-foreground">{displayName}</span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/80">
              {subtitle}
            </span>
          </div>
        </div>
        <Badge variant="brand" className="text-[10px] font-semibold tracking-[0.14em] uppercase">
          {t("callCount", { count: contact.callCount })}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-border/40 bg-muted/15 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
            {t("averageDuration")}
          </p>
          <p className="text-sm font-semibold text-foreground">{averageDuration || t("unknownDuration")}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-muted/15 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
            {t("totalDuration")}
          </p>
          <p className="text-sm font-semibold text-foreground">{totalDuration || t("unknownDuration")}</p>
        </div>
        <div className="col-span-2 rounded-lg border border-border/40 bg-muted/15 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
            {t("lastContact")}
          </p>
          <p className="text-sm font-semibold text-foreground">{lastContactLabel}</p>
        </div>
      </div>
    </GlassCard>
  );
}
