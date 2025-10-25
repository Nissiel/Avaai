'use client';

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Locale as DateFnsLocale } from "date-fns";
import { enUS, fr as frLocale, he as heLocale } from "date-fns/locale";
import { Search, Users, Clock, TrendingUp, Calendar } from "lucide-react";

import Link from "next/link";

import { listCalls } from "@/lib/api/calls";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCallsStore } from "@/stores/calls-store";
import type { Locale as SupportedLocale } from "@/lib/i18n/locales";
import { ContactCard } from "@/components/features/contacts/contact-card";
import { useContactAliasStore } from "@/lib/stores/contact-alias-store";
import {
  buildContactAggregates,
  sortContactAggregates,
  type ContactSortOption,
} from "@/lib/services/contact-analytics";

const DATE_LOCALE_MAP: Record<SupportedLocale, DateFnsLocale> = {
  en: enUS,
  fr: frLocale,
  he: heLocale,
};

export default function ContactsPage() {
  const locale = useLocale() as SupportedLocale;
  const t = useTranslations("contactsPage");
  const dateLocale = DATE_LOCALE_MAP[locale] ?? enUS;
  
  const [search, setSearch] = React.useState("");
  const [sortBy, setSortBy] = React.useState<ContactSortOption>("recent");

  const calls = useCallsStore((state) => state.calls);
  const setCalls = useCallsStore((state) => state.setCalls);
  const aliases = useContactAliasStore((state) => state.aliases);

  const { data, isFetching } = useQuery({
    queryKey: ["calls", "all"],
    queryFn: () => listCalls({ limit: 200 }),
  });

  React.useEffect(() => {
    if (data?.calls) {
      setCalls(data.calls);
    }
  }, [data?.calls, setCalls]);

  const contactsAggregates = React.useMemo(() => buildContactAggregates(calls), [calls]);

  const filteredContacts = React.useMemo(() => {
    if (!search.trim()) return contactsAggregates;
    const normalized = search.trim().toLowerCase();
    return contactsAggregates.filter((contact) => {
      const alias = aliases[contact.id];
      const phone = contact.phone ?? '';
      return (
        phone.toLowerCase().includes(normalized) ||
        (!!alias && alias.toLowerCase().includes(normalized))
      );
    });
  }, [aliases, contactsAggregates, search]);

  const sortedContacts = React.useMemo(
    () => sortContactAggregates(filteredContacts, sortBy),
    [filteredContacts, sortBy]
  );

  const contactCards = React.useMemo(
    () =>
      sortedContacts.map((contact) => ({
        id: contact.id,
        phone: contact.phone,
        alias: aliases[contact.id] ?? null,
        callCount: contact.callCount,
        lastCallAt: contact.lastCallDate ?? null,
        firstCallAt: contact.firstCallDate ?? null,
        totalDurationSeconds: contact.totalDurationSeconds,
        averageDurationSeconds: contact.averageDurationSeconds,
        recentCalls: contact.recentCalls,
      })),
    [aliases, sortedContacts],
  );

  return (
    <section className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle", { contacts: sortedContacts.length, calls: calls.length })}
        </p>
      </div>

      <GlassCard className="space-y-4" variant="none">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as ContactSortOption)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("sort.recent")}
                </span>
              </SelectItem>
              <SelectItem value="frequent">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t("sort.frequent")}
                </span>
              </SelectItem>
              <SelectItem value="oldest">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("sort.oldest")}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {isFetching ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))
        ) : contactCards.length > 0 ? (
          contactCards.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/${locale}/app/contacts/${encodeURIComponent(contact.id)}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ContactCard contact={contact} dateLocale={dateLocale} />
              </Link>
            </motion.div>
          ))
        ) : (
          <GlassCard variant="none" className="py-16 text-center">
            <div className="space-y-4">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-muted-foreground">
                  {t("emptyTitle")}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {t("emptyDescription")}
                </p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </section>
  );
}
