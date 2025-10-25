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

  // 🔥 DIVINE UX: Engagement scoring pour hiérarchie visuelle
  const isHighEngagement = contact.callCount >= 10;
  const isVIP = contact.callCount >= 20;

  return (
    <GlassCard
      variant="none"
      className={cn(
        "group relative flex h-full flex-col gap-5 rounded-2xl overflow-hidden",
        "border-2 transition-all duration-300 ease-out cursor-pointer",
        "bg-gradient-to-br from-background/90 via-background/70 to-brand-500/10",
        "hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-500/20",
        // 🔥 DIVINE: Border cosmique selon VIP status
        isVIP 
          ? "border-brand-500/60 shadow-lg shadow-brand-500/30 ring-2 ring-brand-500/20 ring-offset-2 ring-offset-background" 
          : "border-brand-500/20 hover:border-brand-500/50",
        "p-5"
      )}
    >
      {/* 🌟 VIP Aura cosmique (Peak-End Rule: mémorisation du "peak") */}
      {isVIP && (
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-brand-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
      )}

      {/* 🔥 SECTION 1: HEADER - Hero Zone (Fitts's Law: éléments importants = GROS) */}
      <div className="relative flex items-start gap-4">
        {/* Avatar PLUS GROS (de 10x10 à 16x16 = +60%) */}
        <div className="relative flex-shrink-0">
          <Avatar className={cn(
            "h-16 w-16 border-2 transition-all duration-300",
            isVIP 
              ? "border-brand-500 shadow-lg shadow-brand-500/60 ring-2 ring-brand-400/30" 
              : "border-brand-500/40 group-hover:border-brand-500/80"
          )}>
            <AvatarFallback className={cn(
              "text-lg font-bold bg-gradient-to-br transition-all duration-300",
              isVIP 
                ? "from-brand-500 to-purple-500 text-white" 
                : "from-brand-500/20 to-brand-400/40 text-brand-600 dark:text-brand-300 group-hover:from-brand-500/30 group-hover:to-brand-400/50"
            )}>
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          
          {/* 🟢 Status indicator cosmique (active/inactive) */}
          <div className={cn(
            "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background",
            "transition-all duration-300",
            isHighEngagement 
              ? "bg-emerald-500 shadow-lg shadow-emerald-500/60 animate-pulse" 
              : "bg-muted-foreground/40"
          )} />
        </div>

        {/* 📝 Name + Phone avec hiérarchie DIVINE (Hick's Law: moins = mieux) */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "text-lg font-bold truncate transition-colors duration-300",
              "text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400"
            )}>
              {displayName}
            </h3>
            {isVIP && (
              <Badge variant="brand" className="bg-gradient-to-r from-brand-500 to-purple-500 text-white border-0 text-xs font-bold px-2.5 py-0.5 shadow-lg shadow-brand-500/40">
                ⭐ VIP
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{subtitle}</span>
          </div>
        </div>

        {/* 🔢 Call Count Badge - GRAND et BOLD (Fitts's Law: cible importante) */}
        <Badge 
          variant={isHighEngagement ? "brand" : "outline"}
          className={cn(
            "text-lg font-extrabold px-4 py-2 transition-all duration-300 flex-shrink-0",
            isHighEngagement 
              ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/40 hover:shadow-xl hover:shadow-brand-500/60" 
              : "border-2 border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10"
          )}
        >
          {contact.callCount}
        </Badge>
      </div>

      {/* 📊 SECTION 2: STATS - Grid 3 colonnes avec ICÔNES colorées (scannabilité++) */}
      <div className="relative grid grid-cols-3 gap-3">
        {/* Stat 1: Average Duration */}
        <div className={cn(
          "flex flex-col items-center gap-2.5 p-4 rounded-xl",
          "bg-gradient-to-br from-blue-500/10 via-background/60 to-blue-500/5",
          "border border-blue-500/20",
          "transition-all duration-300",
          "group-hover:border-blue-500/40 group-hover:shadow-md group-hover:shadow-blue-500/20"
        )}>
          <Clock className="h-5 w-5 text-blue-500 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-center">
            {t("averageDuration")}
          </span>
          <span className="text-base font-bold text-foreground">
            {averageDuration || t("unknownDuration")}
          </span>
        </div>

        {/* Stat 2: Total Duration */}
        <div className={cn(
          "flex flex-col items-center gap-2.5 p-4 rounded-xl",
          "bg-gradient-to-br from-purple-500/10 via-background/60 to-purple-500/5",
          "border border-purple-500/20",
          "transition-all duration-300",
          "group-hover:border-purple-500/40 group-hover:shadow-md group-hover:shadow-purple-500/20"
        )}>
          <TrendingUp className="h-5 w-5 text-purple-500 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-center">
            {t("totalDuration")}
          </span>
          <span className="text-base font-bold text-foreground">
            {totalDuration || t("unknownDuration")}
          </span>
        </div>

        {/* Stat 3: Last Contact */}
        <div className={cn(
          "flex flex-col items-center gap-2.5 p-4 rounded-xl",
          "bg-gradient-to-br from-emerald-500/10 via-background/60 to-emerald-500/5",
          "border border-emerald-500/20",
          "transition-all duration-300",
          "group-hover:border-emerald-500/40 group-hover:shadow-md group-hover:shadow-emerald-500/20"
        )}>
          <Calendar className="h-5 w-5 text-emerald-500 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-center">
            {t("lastContact")}
          </span>
          <span className="text-sm font-bold text-foreground">
            {lastContactLabel}
          </span>
        </div>
      </div>

      {/* ✨ DIVINE TOUCH: Hover indicator cosmique au bottom (Peak-End Rule) */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </GlassCard>
  );
}
