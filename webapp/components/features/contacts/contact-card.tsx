"use client";

import * as React from "react";
import type { Locale as DateFnsLocale } from "date-fns";
import { format } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { Phone, Clock, Calendar, TrendingUp } from "lucide-react";
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

  // Professional UX: Engagement scoring subtil
  const isHighEngagement = contact.callCount >= 10;

  return (
    <GlassCard
      variant="none"
      className={cn(
        "group flex h-full flex-col gap-4 rounded-xl border",
        "bg-background/95 backdrop-blur-sm",
        "transition-all duration-200 cursor-pointer",
        "hover:border-foreground/20 hover:shadow-md",
        isHighEngagement ? "border-foreground/15" : "border-border/60",
        "p-4"
      )}
    >
      {/* SECTION 1: Header - Clean & Professional */}
      <div className="flex items-start gap-3">
        {/* Avatar - Simple & Clean */}
        <div className="relative flex-shrink-0">
          <Avatar className={cn(
            "h-12 w-12 border-2 transition-colors duration-200",
            isHighEngagement 
              ? "border-foreground/20 bg-foreground/5" 
              : "border-border/60 bg-muted/30"
          )}>
            <AvatarFallback className={cn(
              "text-sm font-semibold",
              isHighEngagement 
                ? "bg-foreground/10 text-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          
          {/* Status indicator - Minimal */}
          {isHighEngagement && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
          )}
        </div>

        {/* Name + Info - Clear Hierarchy */}
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-base font-semibold text-foreground truncate">
            {displayName}
          </h3>
          
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{subtitle}</span>
          </div>
        </div>

        {/* Call Count Badge - Professional */}
        <Badge 
          variant={isHighEngagement ? "brand" : "outline"}
          className={cn(
            "text-sm font-semibold px-2.5 py-1",
            !isHighEngagement && "border-border/60 text-muted-foreground"
          )}
        >
          {contact.callCount}
        </Badge>
      </div>

      {/* SECTION 2: Stats - Clean Grid */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
        {/* Stat 1: Average Duration */}
        <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/30">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {t("averageDuration")}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {averageDuration}
          </span>
        </div>

        {/* Stat 2: Total Duration */}
        <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/30">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {t("totalDuration")}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {totalDuration}
          </span>
        </div>

        {/* Stat 3: Last Contact */}
        <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/30">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {t("lastContact")}
          </span>
          <span className="text-xs font-semibold text-foreground">
            {lastContactLabel}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
