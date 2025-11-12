"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { listVapiRemoteSettingsAction, updateVapiRemoteSettingAction, type RemoteVapiSetting } from "@/app/(app)/settings/vapi-actions";

interface SettingEditorProps {
  setting: RemoteVapiSetting;
  onSave: (key: string, value: string) => void;
  isSaving: boolean;
}

function formatSettingValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

function SettingEditor({ setting, onSave, isSaving }: SettingEditorProps) {
  const [draft, setDraft] = useState(() => formatSettingValue(setting.value));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(formatSettingValue(setting.value));
    setDirty(false);
  }, [setting.value]);

  const handleSave = useCallback(() => {
    onSave(setting.key, draft);
  }, [draft, onSave, setting.key]);

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="font-mono text-xs">
            {setting.key}
          </Badge>
          {setting.updated_at && (
            <span className="text-xs text-muted-foreground">
              Last update: {new Date(setting.updated_at).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={isSaving}
            onClick={() => {
              setDraft(formatSettingValue(setting.value));
              setDirty(false);
            }}
          >
            Reset
          </Button>
          <Button size="sm" disabled={isSaving || !dirty} onClick={handleSave} className="gap-2">
            {isSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
      <Textarea
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setDirty(true);
        }}
        disabled={isSaving}
        className="font-mono text-sm"
        rows={4}
        placeholder='{"assistant.defaultGreeting": "Bonjour"}'
      />
      <p className="text-xs text-muted-foreground">
        Values are auto-parsed as JSON when possible, otherwise stored as plain text.
      </p>
    </div>
  );
}

export function VapiRemoteSettings() {
  const [settings, setSettings] = useState<RemoteVapiSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listVapiRemoteSettingsAction();
      setSettings(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load settings";
      setError(message);
      toast.error("Unable to load Vapi settings", { description: message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = useCallback(
    (key: string, value: string) => {
      setPendingKey(key);
      startTransition(async () => {
        const result = await updateVapiRemoteSettingAction({ key, value });
        setPendingKey(null);
        if (!result.success) {
          toast.error("Failed to update setting", { description: result.error });
          return;
        }
        toast.success("Setting updated", { description: key });
        await loadSettings();
      });
    },
    [loadSettings],
  );

  const body = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-10 animate-pulse rounded-lg bg-muted/40" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error.includes("Vapi API key not configured")
            ? "Add your Vapi API key above to see remote settings."
            : error}
        </div>
      );
    }

    if (!settings.length) {
      return <p className="text-sm text-muted-foreground">No remote settings available for this account.</p>;
    }

    return (
      <div className="space-y-4">
        {settings.map((setting) => (
          <SettingEditor
            key={setting.key}
            setting={setting}
            onSave={handleSave}
            isSaving={pendingKey === setting.key}
          />
        ))}
      </div>
    );
  }, [error, handleSave, isLoading, pendingKey, settings]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Vapi Remote Settings</CardTitle>
          <CardDescription>View and edit key/value settings stored directly in Vapi.</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isLoading || isRefreshing}
          onClick={() => startTransition(() => { void loadSettings(); })}
        >
          {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">{body}</CardContent>
    </Card>
  );
}
