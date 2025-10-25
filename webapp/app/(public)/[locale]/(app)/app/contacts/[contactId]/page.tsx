'use client';

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { Locale as DateFnsLocale } from "date-fns";
import { enUS, fr as frLocale, he as heLocale } from "date-fns/locale";
import { ArrowLeft, Clock, MessageSquare, Phone, Sparkles, UserRound, Loader2, Trash2 } from "lucide-react";

import { listCalls, getCall, deleteCall } from "@/lib/api/calls";
import type { CallSummary, CallDetail } from "@/lib/dto";
import { buildContactAggregates, findContactAggregate } from "@/lib/services/contact-analytics";
import { formatDuration } from "@/lib/formatters/duration";
import { useContactAliasStore } from "@/lib/stores/contact-alias-store";
import { useCallsStore } from "@/lib/stores/calls-store";
import { GlassCard } from "@/components/ui/glass-card";
import { FuturisticButton } from "@/components/ui/futuristic-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Locale as SupportedLocale } from "@/lib/i18n/locales";
import { humanizeIdentifier } from "@/lib/formatters/name";

const DATE_LOCALE_MAP: Record<string, DateFnsLocale> = {
  en: enUS,
  fr: frLocale,
  he: heLocale,
};

const CURRENCY_BY_LOCALE: Record<string, string> = {
  en: "USD",
  fr: "EUR",
  he: "ILS",
};

interface ContactDetailPageProps {
  params: {
    contactId: string;
  };
}

export default function ContactDetailPage({ params }: ContactDetailPageProps) {
  const locale = useLocale();
  const t = useTranslations("contactsPage.detail");
  const tTimeline = useTranslations("contactsPage.detail.timeline");
  const tCard = useTranslations("contactsPage.card");
  const dateLocale = DATE_LOCALE_MAP[locale] ?? enUS;
  const decodedContactId = decodeURIComponent(params.contactId);

  const aliases = useContactAliasStore((state) => state.aliases);
  const setAlias = useContactAliasStore((state) => state.setAlias);
  const clearAlias = useContactAliasStore((state) => state.clearAlias);
  const removeCall = useCallsStore((state) => state.removeCall);
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ["calls", "all"],
    queryFn: () => listCalls({ limit: 400 }),
  });

  const contactAggregate = React.useMemo(() => {
    if (!data?.calls) return undefined;
    const aggregates = buildContactAggregates(data.calls);
    return findContactAggregate(aggregates, decodedContactId);
  }, [data?.calls, decodedContactId]);

  const alias = aliases[decodedContactId] ?? "";
  const [isEditingAlias, setIsEditingAlias] = React.useState(false);
  const [aliasValue, setAliasValue] = React.useState(alias);

  React.useEffect(() => {
    setAliasValue(alias);
  }, [alias]);

  const handleAliasSave = () => {
    const value = aliasValue.trim();
    if (value.length === 0) {
      clearAlias(decodedContactId);
    } else {
      setAlias(decodedContactId, value);
    }
    setIsEditingAlias(false);
  };

  const handleAliasCancel = () => {
    setAliasValue(alias);
    setIsEditingAlias(false);
  };

  const isUnknownPhone = !contactAggregate?.phone || contactAggregate.phone === "unknown";
  const resolvedPhone = isUnknownPhone ? "" : humanizeIdentifier(contactAggregate?.phone ?? "");

  const displayName = alias.trim().length > 0 ? humanizeIdentifier(alias) : resolvedPhone || tCard("unknownNumber");

  const phoneLabel = resolvedPhone || t("unknownPhone");

  const totalDurationLabel = contactAggregate
    ? formatDuration(contactAggregate.totalDurationSeconds, locale, { includeSeconds: false })
    : t("metrics.unknown");

  const averageDurationLabel = contactAggregate
    ? formatDuration(contactAggregate.averageDurationSeconds, locale, { includeSeconds: false })
    : t("metrics.unknown");

  const firstCallLabel =
    contactAggregate?.firstCallDate != null
      ? format(contactAggregate.firstCallDate, "dd MMM yyyy", { locale: dateLocale })
      : t("metrics.unknown");

  const lastCallLabel =
    contactAggregate?.lastCallDate != null
      ? format(contactAggregate.lastCallDate, "dd MMM yyyy", { locale: dateLocale })
      : t("metrics.unknown");

  const contactCalls = contactAggregate?.calls ?? [];
  const [visibleCount, setVisibleCount] = React.useState(3);
  const visibleCalls = React.useMemo(
    () => contactCalls.slice(0, visibleCount),
    [contactCalls, visibleCount]
  );

  React.useEffect(() => {
    if (visibleCount > contactCalls.length && contactCalls.length > 0) {
      setVisibleCount((prev) => Math.min(prev, contactCalls.length));
    }
  }, [contactCalls.length, visibleCount]);

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (callId) => {
      await deleteCall(callId);
    },
    onSuccess: (_data, callId) => {
      removeCall(callId);
      queryClient.setQueryData(["calls", "all"], (oldData: { calls?: CallSummary[]; total?: number } | undefined) => {
        if (!oldData?.calls) return oldData;
        const nextCalls = oldData.calls.filter((item) => item.id !== callId);
        return {
          ...oldData,
          calls: nextCalls,
          total: Math.max(0, (oldData.total ?? nextCalls.length)),
        };
      });
      toast.success(tTimeline("deleteSuccess"));
    },
    onError: (error) => {
      toast.error(tTimeline("deleteError"), {
        description: error.message,
      });
    },
  });


  if (!isFetching && !contactAggregate) {
    return (
      <section className="space-y-8">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]"
        >
          <Link href={`/${locale}/app/contacts`}>
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("back")}
          </Link>
        </Button>
        <GlassCard className="rounded-3xl border border-border/60 bg-background/80 p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="mt-4 text-lg font-semibold text-foreground">{t("notFound.title")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("notFound.subtitle")}</p>
        </GlassCard>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]"
        >
          <Link href={`/${locale}/app/contacts`}>
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("back")}
          </Link>
        </Button>
        <Badge variant="brand" className="text-[10px] uppercase tracking-[0.14em]">
          {t("badge")}
        </Badge>
      </div>

      <GlassCard className="space-y-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-brand-500/10 p-6 shadow-elevated">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{displayName}</p>
                <p className="text-sm text-muted-foreground uppercase tracking-[0.16em]">
                  {phoneLabel}
                </p>
              </div>
            </div>
            {isEditingAlias ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  value={aliasValue}
                  onChange={(event) => setAliasValue(event.target.value)}
                  placeholder={t("alias.placeholder")}
                  className="sm:w-72"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleAliasCancel}>
                    {t("alias.cancel")}
                  </Button>
                  <Button size="sm" onClick={handleAliasSave}>
                    {t("alias.save")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsEditingAlias(true)}>
                  {alias.trim().length ? t("alias.edit") : t("alias.add")}
                </Button>
                {alias.trim().length > 0 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      clearAlias(decodedContactId);
                      setAliasValue("");
                    }}
                  >
                    {t("alias.remove")}
                  </Button>
                ) : null}
              </div>
            )}
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-4">
            <MetricChip label={t("metrics.callCount")} value={contactAggregate?.callCount ?? 0} />
            <MetricChip label={t("metrics.totalDuration")} value={totalDurationLabel} />
            <MetricChip label={t("metrics.averageDuration")} value={averageDurationLabel} />
            <MetricChip label={t("metrics.lastCall")} value={lastCallLabel} />
            <MetricChip label={t("metrics.firstCall")} value={firstCallLabel} />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="space-y-4 rounded-3xl border border-border/60 bg-background/70 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{t("timeline.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("timeline.subtitle", { count: contactCalls.length })}</p>
          </div>
        </div>

        {isFetching && !contactAggregate ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : contactCalls.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-12 text-center">
            <p className="text-sm text-muted-foreground">{t("timeline.empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleCalls.map((call) => (
              <ContactCallTimelineItem
                key={call.id}
                call={call}
                locale={locale}
                dateLocale={dateLocale}
                onDelete={() => deleteMutation.mutate(call.id)}
                deleting={deleteMutation.isPending && deleteMutation.variables === call.id}
              />
            ))}
            {visibleCount < contactCalls.length ? (
              <div className="flex justify-center pt-2">
                <FuturisticButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 3, contactCalls.length))}
                  className="gap-2"
                >
                  {t("timeline.loadMore")}
                </FuturisticButton>
              </div>
            ) : null}
          </div>
        )}
      </GlassCard>
    </section>
  );
}

interface MetricChipProps {
  label: string;
  value: string | number;
}

function MetricChip({ label, value }: MetricChipProps) {
  // 🎨 DIVINE: Couleurs dynamiques basées sur le label
  const colors = React.useMemo(() => {
    const labelLower = label.toLowerCase();
    if (labelLower.includes('call') || labelLower.includes('appel')) {
      return {
        border: 'border-blue-500/30',
        bg: 'bg-gradient-to-br from-blue-500/10 via-background/60 to-blue-500/5',
        icon: 'text-blue-500',
        hover: 'hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/20'
      };
    }
    if (labelLower.includes('total') || labelLower.includes('somme')) {
      return {
        border: 'border-purple-500/30',
        bg: 'bg-gradient-to-br from-purple-500/10 via-background/60 to-purple-500/5',
        icon: 'text-purple-500',
        hover: 'hover:border-purple-500/50 hover:shadow-md hover:shadow-purple-500/20'
      };
    }
    if (labelLower.includes('average') || labelLower.includes('moyenne') || labelLower.includes('avg')) {
      return {
        border: 'border-emerald-500/30',
        bg: 'bg-gradient-to-br from-emerald-500/10 via-background/60 to-emerald-500/5',
        icon: 'text-emerald-500',
        hover: 'hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/20'
      };
    }
    if (labelLower.includes('last') || labelLower.includes('dernier') || labelLower.includes('first') || labelLower.includes('premier')) {
      return {
        border: 'border-orange-500/30',
        bg: 'bg-gradient-to-br from-orange-500/10 via-background/60 to-orange-500/5',
        icon: 'text-orange-500',
        hover: 'hover:border-orange-500/50 hover:shadow-md hover:shadow-orange-500/20'
      };
    }
    // Default
    return {
      border: 'border-brand-500/30',
      bg: 'bg-gradient-to-br from-brand-500/10 via-background/60 to-brand-500/5',
      icon: 'text-brand-500',
      hover: 'hover:border-brand-500/50 hover:shadow-md hover:shadow-brand-500/20'
    };
  }, [label]);

  return (
    <div className={cn(
      "group rounded-2xl border-2 px-5 py-4 text-center shadow-sm transition-all duration-300",
      colors.border,
      colors.bg,
      colors.hover
    )}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </p>
      <p className={cn(
        "text-xl font-extrabold transition-transform duration-300 group-hover:scale-105",
        colors.icon
      )}>
        {value}
      </p>
    </div>
  );
}

interface ContactCallTimelineItemProps {
  call: CallSummary;
  locale: string;
  dateLocale: DateFnsLocale;
  onDelete: () => void;
  deleting: boolean;
}

function ContactCallTimelineItem({
  call,
  locale,
  dateLocale,
  onDelete,
  deleting,
}: ContactCallTimelineItemProps) {
  const t = useTranslations("contactsPage.detail.timeline");
  const tStatus = useTranslations("callsPage.status");
  const [open, setOpen] = React.useState(false);

  const callDetailQuery = useQuery<CallDetail>({
    queryKey: ["call-detail", call.id],
    queryFn: () => getCall(call.id),
    enabled: open,
  });

  const startedAtDate = call.startedAt ? parseISO(call.startedAt) : null;
  const startedLabel = startedAtDate
    ? format(startedAtDate, "dd MMM yyyy • HH:mm", { locale: dateLocale })
    : t("unknownDate");
  const relativeLabel = startedAtDate
    ? formatDistanceToNow(startedAtDate, { addSuffix: true, locale: dateLocale })
    : null;

  const currencyFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: CURRENCY_BY_LOCALE[locale as SupportedLocale] ?? "USD",
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const durationLabel = call.durationSeconds
    ? formatDuration(call.durationSeconds, locale)
    : t("unknownDuration");
  const costLabel =
    typeof call.cost === "number"
      ? call.cost === 0
        ? t("free")
        : currencyFormatter.format(call.cost)
      : t("unknownCost");

  const assistantLabel =
    (call.assistantId && call.assistantId.length > 0
      ? humanizeIdentifier(call.assistantId)
      : t("unknownAssistant"));

  return (
    <GlassCard className="group relative overflow-hidden rounded-2xl border-2 border-brand-500/20 bg-gradient-to-br from-background/90 via-background/70 to-brand-500/5 p-5 shadow-md transition-all duration-300 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/20">
      {/* 🌟 DIVINE: Aura cosmique subtile */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-brand-500/10 to-purple-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative space-y-4">
        {/* SECTION 1: Header avec date & badges */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-400/30">
                <Phone className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{startedLabel}</p>
                {relativeLabel ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {relativeLabel}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          
          {/* SECTION 2: Badges avec icônes COLORÉES */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-semibold">{durationLabel}</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Phone className="h-3.5 w-3.5" />
              <span className="font-semibold">{costLabel}</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserRound className="h-3.5 w-3.5" />
              <span className="font-semibold truncate max-w-[120px]">{assistantLabel}</span>
            </Badge>
            <Badge variant="brand" className="font-bold text-xs uppercase tracking-widest shadow-md">
              {tStatus(call.status, { defaultMessage: call.status })}
            </Badge>
          </div>
        </div>

        {/* SECTION 3: Transcript Preview avec style amélioré */}
        {call.transcriptPreview ? (
          <div className="rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-transparent p-4">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-brand-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground/80 italic leading-relaxed">
                &ldquo;{call.transcriptPreview}&rdquo;
              </p>
            </div>
          </div>
        ) : null}

        {/* SECTION 4: Actions avec design amélioré */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
          <FuturisticButton
            size="sm"
            variant="ghost"
            onClick={() => setOpen((prev) => !prev)}
            className="gap-2 hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="font-semibold">{open ? t("hideTranscript") : t("viewTranscript")}</span>
          </FuturisticButton>
          <FuturisticButton
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={deleting}
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-semibold">{t("deleting")}</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span className="font-semibold">{t("delete")}</span>
              </>
            )}
          </FuturisticButton>
        </div>

        {/* SECTION 5: Transcript complet avec style DIVINE */}
        {open ? (
          <div className="rounded-2xl border-2 border-brand-500/20 bg-gradient-to-br from-background/80 to-brand-500/5 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
            {callDetailQuery.isLoading ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                <span className="font-medium">{t("loadingTranscript")}</span>
              </div>
            ) : callDetailQuery.data?.transcript ? (
              <TranscriptContent transcript={callDetailQuery.data.transcript} />
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">{t("noTranscript")}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}

function TranscriptContent({ transcript }: { transcript: string }) {
  const snippets = transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {snippets.length > 0 ? (
        snippets.map((line, index) => (
          <div key={index} className="flex gap-3 group">
            <div className="flex-shrink-0 mt-1">
              <div className="h-2 w-2 rounded-full bg-brand-500/60 group-hover:bg-brand-500 transition-colors duration-200" />
            </div>
            <p className="text-sm leading-relaxed text-foreground/90 flex-1">
              &ldquo;<span className="italic">{line}</span>&rdquo;
            </p>
          </div>
        ))
      ) : null}
    </div>
  );
}
