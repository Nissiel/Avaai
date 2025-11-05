/**
 * 🔥 DIVINE: Twilio Settings Form - Clean & Simple
 * Uses centralized API with React Query mutations
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
import { Loader2, Phone, Trash2 } from "lucide-react";
import { saveTwilioSettings, deleteTwilioSettings, type SaveTwilioSettingsPayload } from "@/lib/api/twilio-settings";
import { useTwilioStatus } from "@/lib/hooks/use-twilio-status";
import { autoImportTwilioNumber } from "@/lib/api/twilio-auto-import";

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

function normalizePhoneNumberInput(raw: string): string {
  if (!raw) return "";
  let normalized = raw.trim();
  normalized = normalized.replace(/[\s().-]/g, "");
  if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`;
  }
  if (!normalized.startsWith("+") && /^\d+$/.test(normalized)) {
    normalized = `+${normalized}`;
  }
  return normalized;
}

export function TwilioSettingsForm() {
  const t = useTranslations("settings.twilio");
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const queryClient = useQueryClient();

  const {
    hasTwilioCredentials,
    phoneNumber: currentPhone,
    accountSidPreview,
    isLoading: statusLoading,
  } = useTwilioStatus();

  // 🔥 DIVINE: Save mutation with centralized API
  const saveMutation = useMutation({
    mutationFn: (payload: SaveTwilioSettingsPayload) => saveTwilioSettings(payload),
  });

  // 🔥 DIVINE: Delete mutation with centralized API
  const deleteMutation = useMutation({
    mutationFn: deleteTwilioSettings,
    onSuccess: () => {
      toast.success(t("success.deleted"));
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["twilio-settings"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-status"] });
    },
    onError: (error: Error) => {
      toast.error(t("errors.deleteFailed"), {
        description: error.message,
      });
    },
  });

  const handleSave = async () => {
    if (!accountSid.trim() || !authToken.trim()) {
      toast.error(t("errors.emptyFields"));
      return;
    }

    const normalizedPhone = normalizePhoneNumberInput(phoneNumber);
    if (phoneNumber.trim() && !E164_REGEX.test(normalizedPhone)) {
      toast.error(t("errors.invalidPhone"), {
        description: t("errors.invalidPhoneDesc", {
          defaultValue: "Use the international format, e.g. +33123456789.",
        }),
      });
      return;
    }

    const payload: SaveTwilioSettingsPayload = {
      account_sid: accountSid.trim(),
      auth_token: authToken.trim(),
      phone_number: normalizedPhone || undefined,
    };

    try {
      await saveMutation.mutateAsync(payload);
      toast.success(t("success.saved"), { description: t("success.savedDesc") });

      setAccountSid("");
      setAuthToken("");
      setPhoneNumber("");

      queryClient.invalidateQueries({ queryKey: ["twilio-settings"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-status"] });

      if (payload.phone_number) {
        toast.info(t("import.start"), {
          description: t("import.startDesc", { defaultValue: "Importing your phone number via Vapi..." }),
        });

        const result = await autoImportTwilioNumber(
          payload.account_sid,
          payload.auth_token,
          payload.phone_number,
        );

        if (result.imported) {
          toast.success(result.message, {
            description: result.description,
          });
        } else if (result.success) {
          const guidance =
            result.missingPrerequisites && result.missingPrerequisites.length > 0
              ? result.missingPrerequisites.join(", ")
              : result.message.replace(/\n+/g, " ");
          toast.info(guidance, {
            description: t("import.guidance", { defaultValue: "Complete the missing step and retry the import." }),
          });
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error(t("errors.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
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
          <Phone className="w-5 h-5" />
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
        ) : hasTwilioCredentials ? (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
            ✅ {t("status.connected")}
            {accountSidPreview && (
              <div className="text-xs mt-1 font-mono">SID: {accountSidPreview}</div>
            )}
            {currentPhone && <div className="text-sm mt-1">Phone: {currentPhone}</div>}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400">
            ⚠️ {t("status.notConfigured")}
          </div>
        )}

        {/* Input Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-sid">{t("form.accountSid.label")}</Label>
            <Input
              id="account-sid"
              type="text"
              placeholder={t("form.accountSid.placeholder")}
              value={accountSid}
              onChange={(e) => setAccountSid(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth-token">{t("form.authToken.label")}</Label>
            <Input
              id="auth-token"
              type="password"
              placeholder={t("form.authToken.placeholder")}
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone-number">{t("form.phoneNumber.label")} (optionnel)</Label>
            <Input
              id="phone-number"
              type="tel"
              placeholder="+33123456789"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">{t("form.phoneNumber.help")}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isLoading || !accountSid.trim() || !authToken.trim()}
            className="flex-1"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("actions.save")}
          </Button>

          {hasTwilioCredentials && (
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
