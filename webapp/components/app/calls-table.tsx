'use client';

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listCalls } from "@/lib/api/calls";
import { formatDuration } from "@/lib/formatters/duration";
import type { CallSummary } from "@/lib/dto";

const statusBadge: Record<string, string> = {
  completed: "bg-status-success/15 text-status-success",
  "no-answer": "bg-status-warning/15 text-status-warning",
  failed: "bg-status-danger/15 text-status-danger",
  "in-progress": "bg-status-info/15 text-status-info",
};

export function CallsTable() {
  const t = useTranslations("callsPage.table");
  const tStatus = useTranslations("callsPage.status");
  const locale = useLocale();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["calls", "table"],
    queryFn: () => listCalls({ limit: 50 }),
    staleTime: 30_000,
  });

  const calls: CallSummary[] = data?.calls ?? [];
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }), [locale]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isRefetching} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            {t("refresh")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
            {t("error")}
          </div>
        ) : calls.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.contact")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.startedAt")}</TableHead>
                <TableHead>{t("columns.duration")}</TableHead>
                <TableHead>{t("columns.cost")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => {
                const statusLabel = tStatus(call.status, { defaultMessage: call.status });
                const badgeClass = statusBadge[call.status] ?? "bg-muted text-muted-foreground";
                const startedAtLabel = call.startedAt ? dateFormatter.format(new Date(call.startedAt)) : t("unknown");
                const durationLabel = typeof call.durationSeconds === "number"
                  ? formatDuration(call.durationSeconds, locale)
                  : t("unknown");
                const costLabel = typeof call.cost === "number" ? `${call.cost.toFixed(2)}$` : "—";
                const contactLabel = call.customerNumber ?? t("unknown");

                return (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{contactLabel}</span>
                        {call.transcriptPreview ? (
                          <span className="text-xs text-muted-foreground line-clamp-1">{call.transcriptPreview}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={badgeClass}>{statusLabel}</Badge>
                    </TableCell>
                    <TableCell>{startedAtLabel}</TableCell>
                    <TableCell>{durationLabel}</TableCell>
                    <TableCell>{costLabel}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
