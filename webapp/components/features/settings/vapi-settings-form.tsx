/**
 * 🔥 DIVINE: Vapi Settings Form - Clean & Simple
 * Uses centralized API with React Query mutations
 * From 544 lines → 120 lines (78% reduction)
 */

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Key, Trash2 } from "lucide-react";
import { saveVapiSettings, deleteVapiSettings } from "@/lib/api/vapi-settings";
import { useVapiStatus } from "@/lib/hooks/use-vapi-status";

export function VapiSettingsForm() {
  const t = useTranslations("settings.vapi");
  const [apiKey, setApiKey] = useState("");
  const queryClient = useQueryClient();

  const { hasVapiKey, isLoading: statusLoading } = useVapiStatus();
  const label = t("apiKey.label");
  const placeholder = t("apiKey.placeholder");
  const helpText = t("apiKey.hint");

  // 🔥 DIVINE: Save mutation with centralized API
  const saveMutation = useMutation({
    mutationFn: (key: string) => saveVapiSettings(key),
    onSuccess: () => {
      toast.success(t("success.saved"), {
        description: t("success.savedDesc"),
      });
      setApiKey("");
      // 🔥 DIVINE: Invalidate ALL related queries to refetch with new key
      queryClient.invalidateQueries({ queryKey: ["vapi-settings"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-status"] });
      queryClient.invalidateQueries({ queryKey: ["assistants"] }); // 🎯 Force assistants refetch!
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }); // 🎯 Force dashboard refetch!
    },
    onError: (error: Error) => {
      toast.error(t("errors.saveFailed"), {
        description: error.message,
      });
    },
  });

  // 🔥 DIVINE: Delete mutation with centralized API
  const deleteMutation = useMutation({
    mutationFn: deleteVapiSettings,
    onSuccess: () => {
      toast.success(t("success.deleted"));
      // 🔥 DIVINE: Invalidate ALL related queries
      queryClient.invalidateQueries({ queryKey: ["vapi-settings"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-status"] });
      queryClient.invalidateQueries({ queryKey: ["assistants"] }); // 🎯 Clear assistants cache!
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }); // 🎯 Clear dashboard cache!
    },
    onError: (error: Error) => {
      toast.error(t("errors.deleteFailed"), {
        description: error.message,
      });
    },
  });

  const handleSave = () => {
    if (!apiKey.trim()) {
      toast.error(t("errors.emptyKey"));
      return;
    }

    if (apiKey.trim().length < 10) {
      toast.error(t("errors.invalidFormat"), {
        description: "Une clé API Vapi contient au minimum 10 caractères",
      });
      return;
    }

    saveMutation.mutate(apiKey);
  };

  const handleDelete = () => {
    if (!confirm(t("confirm.delete"))) return;
    deleteMutation.mutate();
  };

  const isLoading = saveMutation.isPending || deleteMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        {statusLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("status.testing")}
          </div>
        ) : hasVapiKey ? (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
            ✅ {t("status.connected")}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400">
            ⚠️ {t("status.notConfigured")}
          </div>
        )}

        {/* Input Field */}
        <div className="space-y-2">
          <Label htmlFor="vapi-key">{label}</Label>
          <Input
            id="vapi-key"
            type="password"
            placeholder={placeholder}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">{helpText}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isLoading || !apiKey.trim()}
            className="flex-1"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("actions.save")}
          </Button>

          {hasVapiKey && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
