"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RotateCw, Loader2, Server, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export function BackendControl() {
  const [status, setStatus] = useState<"running" | "stopped" | "unknown">("unknown");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check status every 3 seconds
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/backend");
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
      }
    } catch (error) {
      console.error("Error checking backend status:", error);
      setStatus("unknown");
    } finally {
      setChecking(false);
    }
  };

  const handleAction = async (action: "start" | "stop" | "restart") => {
    setLoading(true);
    try {
      const response = await fetch("/api/backend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        
        // 🔥 FORCER UN REFRESH IMMÉDIAT après 500ms
        setTimeout(() => {
          checkStatus();
        }, 500);
        
        // 🔥 ET UN AUTRE après 2s pour être sûr
        setTimeout(() => {
          checkStatus();
        }, 2000);
        
        // 🔥 ET UN DERNIER après 4s
        setTimeout(() => {
          checkStatus();
        }, 4000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(`Error ${action} backend:`, error);
      toast.error(`Erreur lors de ${action === "start" ? "démarrage" : action === "stop" ? "l'arrêt" : "du redémarrage"}`);
    } finally {
      setLoading(false);
    }
  };

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
          disabled={loading || status === "running"}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Démarrer
        </Button>

        <Button
          onClick={() => handleAction("stop")}
          disabled={loading || status === "stopped"}
          variant="destructive"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Square className="w-4 h-4 mr-2" />
          )}
          Arrêter
        </Button>

        <Button
          onClick={() => handleAction("restart")}
          disabled={loading}
          variant="outline"
        >
          {loading ? (
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
