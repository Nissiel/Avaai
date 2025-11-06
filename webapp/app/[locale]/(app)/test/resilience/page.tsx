"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSingleAction } from "@/lib/hooks/use-single-action";
import { clientLogger } from "@/lib/logging/client-logger";

export default function ResilienceTestPage() {
  const locale = useLocale();
  const [hits, setHits] = useState(0);

  const { run, pending } = useSingleAction(async () => {
    const requestId = crypto.randomUUID();
    clientLogger.info("Test spam click invoked", { requestId });
    await fetch("/api/test/spam", { method: "POST", headers: { "X-Request-ID": requestId } });
    await refreshHits();
  });

  const refreshHits = async () => {
    const response = await fetch("/api/test/spam");
    const data = await response.json();
    setHits(data.hits ?? 0);
  };

  useEffect(() => {
    refreshHits();
  }, [locale]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Resilience Test Harness</h1>
        <p className="text-sm text-muted-foreground">
          Use this page to validate spam-click protections. The POST endpoint increments a server counter.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={() => run()} disabled={pending} className="min-w-[160px]" data-testid="spam-trigger">
          {pending ? "Processing…" : "Trigger Action"}
        </Button>
        <span className="text-sm text-muted-foreground">Server hits: {hits}</span>
      </div>
    </div>
  );
}
