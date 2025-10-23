"use client";

import { useMemo, useState } from "react";
import { demoCalls, type DemoCall } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CallDetail } from "@/components/app/call-detail";

const filters = ["all", "answered", "missed", "voicemail", "callback"] as const;

type Filter = (typeof filters)[number];

export default function CallsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<DemoCall | null>(demoCalls[0] ?? null);

  const filteredCalls = useMemo(() => {
    return demoCalls.filter((call) => {
      const matchesFilter = filter === "all" ? true : call.outcome === filter;
      const matchesSearch = call.contact.toLowerCase().includes(search.toLowerCase()) ||
        call.summary.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Call journal</h1>
          <p className="text-sm text-muted-foreground">Monitor conversations, handovers, and follow-up actions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search by contact or summary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 w-60"
          />
          <Button variant="outline">Export CSV</Button>
        </div>
      </header>
      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <TabsList className="mb-6">
          {filters.map((item) => (
            <TabsTrigger key={item} value={item} className="capitalize">
              {item}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={filter} className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-border/60">
              <table className="w-full text-sm">
                <tbody>
                  {filteredCalls.map((call) => (
                    <tr
                      key={call.id}
                      onClick={() => setSelected(call)}
                      className="cursor-pointer border-b border-border/60 transition hover:bg-accent"
                    >
                      <td className="px-4 py-3 font-semibold">{call.contact}</td>
                      <td className="px-4 py-3 text-muted-foreground">{call.summary}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{call.duration}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{call.outcome}</Badge>
                      </td>
                    </tr>
                  ))}
                  {filteredCalls.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={4}>
                        No calls found with current filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
          <CallDetail call={selected} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
