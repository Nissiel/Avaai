"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RotateCw, Loader2, Server, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useSingleAction } from "@/lib/hooks/use-single-action";
import { apiFetch } from "@/lib/api/client";
import { useRenderDiagnostics } from "@/lib/diagnostics/use-render-diagnostics";

export function BackendControl() {
  const [status, setStatus] = useState<"running" | "stopped" | "unknown">("unknown");
  const [checking, setChecking] = useState(true);
  useRenderDiagnostics("BackendControl");

  const { run: runStatusCheck } = useSingleAction(
    async () => {
      const response = await apiFetch("/api/backend", {
        baseUrl: "relative",
        timeoutMs: 5_000,
        auth: false,
        metricsLabel: "backend.status.poll",
      });
      if (!response.ok) {
        throw new Error(`Status request failed (${response.status})`);
      }
      const data = await response.json();
      const nextStatus = (data.status as typeof status) ?? "unknown";
      setStatus(nextStatus);
      return nextStatus;
    },
    {
      onError: (error) => {
        console.error("Error checking backend status:", error);
        setStatus("unknown");
        setChecking(false);
      },
      onSuccess: () => {
        setChecking(false);
      },
      metricsLabel: "backend.status.poll",
    },
  );

  const statusCheckRef = React.useRef(runStatusCheck);
  useEffect(() => {
    statusCheckRef.current = runStatusCheck;
  }, [runStatusCheck]);

  // Check status every 3 seconds with single-flight guard
  useEffect(() => {
    let cancelled = false;

    const tick = () => {
      if (!cancelled) {
        void statusCheckRef.current();
      }
    };

    tick();
    const interval = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const lastActionRef = React.useRef<"start" | "stop" | "restart" | null>(null);
  const { run: runRuntimeAction, state: runtimeActionState } = useSingleAction(
    async (action: "start" | "stop" | "restart") => {
      const response = await apiFetch("/api/backend", {
        method: "POST",
        baseUrl: "relative",
        timeoutMs: 10_000,
        auth: false,
        body: JSON.stringify({ action }),
        headers: { "Content-Type": "application/json" },
        metricsLabel: `backend.action.${action}`,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message ?? `Action ${action} failed`);
      }

      return data as { success: boolean; message: string };
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        void runStatusCheck();
        setTimeout(() => {
          void runStatusCheck();
        }, 2_000);
      },
      onError: (error) => {
        const action = lastActionRef.current;
        console.error(`Error ${action ?? "runtime"} backend:`, error);
        toast.error(
          `Erreur lors de ${
            action === "start" ? "démarrage" : action === "stop" ? "l'arrêt" : "du redémarrage"
          }`,
        );
      },
      metricsLabel: "backend.action",
    },
  );

  const handleAction = (action: "start" | "stop" | "restart") => {
    lastActionRef.current = action;
    void runRuntimeAction(action).finally(() => {
      lastActionRef.current = null;
    });
  };

  const actionPending = runtimeActionState.pending;

  const getStatusBadge = () => {
    if (checking) {
      return (
        <Badge variant="outline" className="flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          Vérification...
        </Badge>
      );
    }

    if (status === "running") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3" />
          En cours d'exécution
        </Badge>
      );
    }

    if (status === "stopped") {
      return (
        <Badge variant="danger" className="flex items-center gap-2">
          <XCircle className="w-3 h-3" />
          Arrêté
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="flex items-center gap-2">
        <XCircle className="w-3 h-3" />
        Inconnu
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Backend AVA (Port 8081)</h3>
        </div>
        {getStatusBadge()}
      </div>

      <p className="text-sm text-gray-600 mb-6">
        Contrôlez le serveur backend Python FastAPI qui gère les appels téléphoniques et OpenAI Realtime API.
      </p>

      <div className="flex gap-3">
        <Button
          onClick={() => handleAction("start")}
          disabled={actionPending || status === "running"}
          className="bg-green-600 hover:bg-green-700"
        >
          {actionPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Démarrer
        </Button>

        <Button
          onClick={() => handleAction("stop")}
          disabled={actionPending || status === "stopped"}
          variant="destructive"
        >
          {actionPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Square className="w-4 h-4 mr-2" />
          )}
          Arrêter
        </Button>

        <Button
          onClick={() => handleAction("restart")}
          disabled={actionPending}
          variant="outline"
        >
          {actionPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RotateCw className="w-4 h-4 mr-2" />
          )}
          Redémarrer
        </Button>
      </div>

      {status === "running" && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Le backend est opérationnel et prêt à recevoir des appels !
          </p>
        </div>
      )}

      {status === "stopped" && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Le backend est arrêté. Démarrez-le pour accepter les appels.
          </p>
        </div>
      )}
    </Card>
  );
}
