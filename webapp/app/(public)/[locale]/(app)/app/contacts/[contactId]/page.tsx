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
        <FuturisticButton
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]"
        >
          <Link href={`/${locale}/app/contacts`}>
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("back")}
          </Link>
        </FuturisticButton>
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
        <FuturisticButton
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]"
        >
          <Link href={`/${locale}/app/contacts`}>
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("back")}
          </Link>
        </FuturisticButton>
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
  return (
    <div className="rounded-2xl border border-border/50 bg-background px-4 py-3 text-left shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
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

  const currencyFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: CURRENCY_BY_LOCALE[locale as SupportedLocale] ?? "USD",
    maximumFractionDigits: 2,
  });

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
    <GlassCard className="space-y-3 rounded-2xl border border-border/40 bg-background/80 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{startedLabel}</p>
          {relativeLabel ? (
            <p className="text-xs text-muted-foreground uppercase tracking-[0.18em]">{relativeLabel}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-3 py-1">
            <Clock className="h-3 w-3" />
            {durationLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-3 py-1">
            <Phone className="h-3 w-3" />
            {costLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-3 py-1">
            <UserRound className="h-3 w-3" />
            {assistantLabel}
          </span>
          <Badge variant="brand" className="text-[10px] uppercase tracking-[0.14em]">
            {tStatus(call.status, { defaultMessage: call.status })}
          </Badge>
        </div>
      </div>

      {call.transcriptPreview ? (
        <p className="rounded-xl bg-muted/20 p-3 text-sm text-muted-foreground">
          {call.transcriptPreview}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <FuturisticButton
          size="sm"
          variant="ghost"
          onClick={() => setOpen((prev) => !prev)}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          {open ? t("hideTranscript") : t("viewTranscript")}
        </FuturisticButton>
        <FuturisticButton
          size="sm"
          variant="ghost"
          onClick={onDelete}
          disabled={deleting}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? t("deleting") : t("delete")}
        </FuturisticButton>
      </div>

      {open ? (
        <div className="rounded-2xl border border-border/40 bg-background p-4">
          {callDetailQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("loadingTranscript")}
            </div>
          ) : callDetailQuery.data?.transcript ? (
            <TranscriptContent transcript={callDetailQuery.data.transcript} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("noTranscript")}</p>
          )}
        </div>
      ) : null}
    </GlassCard>
  );
}

function TranscriptContent({ transcript }: { transcript: string }) {
  const snippets = transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
      {snippets.length > 0
        ? snippets.map((line, index) => <p key={index}>&ldquo;{line}&rdquo;</p>)
        : null}
    </div>
  );
}
