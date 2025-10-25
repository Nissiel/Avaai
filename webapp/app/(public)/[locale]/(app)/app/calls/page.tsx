'use client';

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import type { Locale as DateFnsLocale } from "date-fns";
import { enUS, fr as frLocale, he as heLocale } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Clock, DollarSign, Phone, Search } from "lucide-react";

import { listCalls } from "@/lib/api/calls";
import type { CallSummary } from "@/lib/dto";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallsStore } from "@/stores/calls-store";
import type { Locale as SupportedLocale } from "@/lib/i18n/locales";

const DATE_LOCALE_MAP: Record<SupportedLocale, DateFnsLocale> = {
  en: enUS,
  fr: frLocale,
  he: heLocale,
};

const CURRENCY_BY_LOCALE: Record<SupportedLocale, string> = {
  en: "USD",
  fr: "EUR",
  he: "ILS",
};

export default function CallsPage() {
  const locale = useLocale() as SupportedLocale;
  const t = useTranslations("callsPage");
  const tStatus = useTranslations("callsPage.status");
  const dateLocale = DATE_LOCALE_MAP[locale] ?? enUS;
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: CURRENCY_BY_LOCALE[locale] ?? "USD",
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const [statusFilter, setStatusFilter] = useState<string>("any");
  const [search, setSearch] = useState("");
  const calls = useCallsStore((state) => state.calls);
  const setCalls = useCallsStore((state) => state.setCalls);

  const { data, isFetching } = useQuery({
    queryKey: ["calls", statusFilter],
    queryFn: () =>
      listCalls({
        limit: 50,
        status: statusFilter === "any" ? undefined : statusFilter,
      }),
  });

  useEffect(() => {
    if (data?.calls) {
      setCalls(data.calls);
    }
  }, [data?.calls, setCalls]);

  const filteredCalls = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const matchesStatus = (call: CallSummary) =>
      statusFilter === "any" ? true : call.status === statusFilter;

    const matchesSearch = (call: CallSummary) => {
      if (!normalizedSearch) return true;
      const haystack = [
        call.customerNumber,
        call.assistantId,
        call.id,
        call.transcriptPreview,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    };

    return calls
      .filter(matchesStatus)
      .filter(matchesSearch)
      .sort((a, b) => {
        const aDate = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        const bDate = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        return bDate - aDate;
      });
  }, [calls, search, statusFilter]);

  const total = data?.total ?? filteredCalls.length;
  const subtitle = t("subtitle", { count: numberFormatter.format(total) });
  const detailBaseHref = `/${locale}/calls`.replace(/\/{2,}/g, "/");

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <GlassCard className="space-y-4" variant="none">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("statusPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{tStatus("any")}</SelectItem>
              <SelectItem value="in-progress">{tStatus("in-progress")}</SelectItem>
              <SelectItem value="ended">{tStatus("ended")}</SelectItem>
              <SelectItem value="failed">{tStatus("failed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      <div className="grid gap-4">
        {isFetching
          ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)
          : filteredCalls.map((call) => {
              const startedAt = call.startedAt
                ? format(parseISO(call.startedAt), "dd MMM HH:mm", { locale: dateLocale })
                : "—";
              const duration = call.durationSeconds
                ? t("duration", {
                    minutes: Math.floor(call.durationSeconds / 60),
                    seconds: call.durationSeconds % 60,
                  })
                : "—";
              const cost = call.cost ? currencyFormatter.format(call.cost) : "—";

              const badgeVariant =
                call.status === "ended"
                  ? "success"
                  : call.status === "in-progress"
                  ? "warning"
                  : "danger";

              return (
                <Link key={call.id} href={`${detailBaseHref}/${call.id}` as Route} className="block">
                  <GlassCard variant="none" className="transition-colors hover:bg-muted/30">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{call.customerNumber ?? t("unknownNumber")}</span>
                          <Badge variant={badgeVariant}>{tStatus(call.status, { defaultMessage: call.status })}</Badge>
                        </div>
                        {call.transcriptPreview ? (
                          <p className="line-clamp-2 text-sm text-muted-foreground">{call.transcriptPreview}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground/70">{t("noTranscript")}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {startedAt}
                        </span>
                        <span>{duration}</span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {cost}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
        {!isFetching && !filteredCalls.length ? (
          <GlassCard variant="none" className="py-12 text-center text-muted-foreground">
            {t("empty")}
          </GlassCard>
        ) : null}
      </div>
    </section>
  );
}
