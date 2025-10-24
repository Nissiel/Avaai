'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, DollarSign, Phone, Search } from "lucide-react";

import { listCalls } from "@/lib/api/calls";
import type { CallSummary } from "@/lib/dto";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallsStore } from "@/stores/calls-store";

export default function CallsPage() {
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

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Appels</h1>
          <p className="text-sm text-muted-foreground">
            {total} appels analysés • Les nouveaux appels arrivent en temps réel
          </p>
        </div>
      </div>

      <GlassCard className="space-y-4" variant="none">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Recherche rapide (numéro, assistant, transcription...)"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Tous les statuts</SelectItem>
              <SelectItem value="in-progress">En cours</SelectItem>
              <SelectItem value="ended">Terminés</SelectItem>
              <SelectItem value="failed">Échecs</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      <div className="grid gap-4">
        {isFetching
          ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)
          : filteredCalls.map((call) => {
              const startedAt = call.startedAt ? format(parseISO(call.startedAt), "dd MMM HH:mm", { locale: fr }) : "—";
              const duration = call.durationSeconds
                ? `${Math.floor(call.durationSeconds / 60)}min ${call.durationSeconds % 60}s`
                : "—";
              const cost = call.cost ? `${call.cost.toFixed(2)}€` : "—";

              const badgeVariant =
                call.status === "ended"
                  ? "success"
                  : call.status === "in-progress"
                  ? "warning"
                  : "danger";

              return (
                <Link key={call.id} href={`/calls/${call.id}`} className="block">
                  <GlassCard variant="none" className="transition-colors hover:bg-muted/30">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{call.customerNumber ?? "Numéro inconnu"}</span>
                          <Badge variant={badgeVariant}>{call.status}</Badge>
                        </div>
                        {call.transcriptPreview ? (
                          <p className="line-clamp-2 text-sm text-muted-foreground">{call.transcriptPreview}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground/70">Pas de transcription enregistrée</p>
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
            Aucun appel trouvé pour ce filtre.
          </GlassCard>
        ) : null}
      </div>
    </section>
  );
}
