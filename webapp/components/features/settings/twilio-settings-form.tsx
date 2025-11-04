"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Phone, Eye, EyeOff, Check, X, ExternalLink, Shield, Zap, Globe, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSessionStore } from "@/lib/stores/session-store";
import { useTwilioStatus } from "@/lib/hooks/use-twilio-status";
import { autoImportTwilioNumber, getAutoImportGuidance } from "@/lib/api/twilio-auto-import";

export function TwilioSettingsForm() {
  const t = useTranslations("settingsPage.twilio");
  const locale = useLocale();
  const session = useSessionStore((state) => state.session);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasTwilioCredentials, accountSidPreview, phoneNumber, refetch, invalidate } = useTwilioStatus();

  const returnTo = searchParams?.get("returnTo");
  
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState(phoneNumber || "");
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!accountSid || !authToken) {
      toast.error(t("errors.missingFields"));
      return;
    }

    if (!accountSid.startsWith("AC")) {
      toast.error(t("errors.invalidAccountSid"));
      return;
    }

    if (twilioPhoneNumber && !twilioPhoneNumber.startsWith("+")) {
      toast.error(t("errors.invalidPhoneFormat"));
      return;
    }

    setIsSaving(true);

    try {
      console.log("🔄 Saving Twilio credentials...");
      console.log("📍 API URL:", process.env.NEXT_PUBLIC_API_URL);
      console.log("🔑 Has token:", !!session?.accessToken);
      console.log("📦 Payload:", { account_sid: accountSid.substring(0, 8) + "...", has_phone: !!twilioPhoneNumber });
      
      // 🎯 DIVINE: Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/twilio-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({
            account_sid: accountSid,
            auth_token: authToken,
            phone_number: twilioPhoneNumber || null,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      
      console.log("📥 Response status:", response.status);
      console.log("📥 Response OK:", response.ok);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        console.error("❌ Backend error:", { status: response.status, error });
        throw new Error(error.detail || `HTTP ${response.status}: Failed to save Twilio credentials`);
      }

      console.log("✅ Twilio credentials saved successfully");
      toast.success(t("success.credentialsSaved"));
      
      // 🔥 DIVINE: Auto-import orchestration!
      // If user provided phone number, attempt auto-import
      if (twilioPhoneNumber) {
        console.log("🚀 Starting auto-import orchestration...");
        toast.loading("Configuring phone number...", { id: "auto-import" });
        
        try {
          const importResult = await autoImportTwilioNumber(
            accountSid,
            authToken,
            twilioPhoneNumber
          );
          
          if (importResult.imported) {
            // Success! Number is imported and ready
            toast.success(importResult.message, { 
              id: "auto-import",
              description: importResult.description,  // 🔥 DIVINE: Show auto-link status
              duration: 5000,
            });
          } else if (importResult.missingPrerequisites) {
            // Prerequisites missing - guide user
            toast.info(importResult.message, {
              id: "auto-import",
              duration: 7000,
              description: "Complete these steps to activate your number",
            });
          } else if (importResult.error) {
            // Import failed
            toast.error("Could not import number", {
              id: "auto-import",
              description: importResult.error,
              duration: 5000,
            });
          }
        } catch (importError) {
          console.error("❌ Auto-import failed:", importError);
          toast.warning("Credentials saved, but number import failed", {
            id: "auto-import",
            description: "You can import manually from Phone Numbers section",
          });
        }
      } else {
        toast.dismiss("auto-import");
      }
      
      setAccountSid("");
      setAuthToken("");
      
      // 🎯 DIVINE: Refetch in background, don't block UI
      refetch().catch((err) => console.error("Refetch failed:", err));
    } catch (error) {
      console.error("❌ Error saving Twilio credentials:", error);
      
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          toast.error("Request timeout", {
            description: "La requête a pris trop de temps. Réessayez.",
          });
        } else {
          toast.error(t("errors.saveFailed"), {
            description: error.message,
          });
        }
      } else {
        toast.error(t("errors.saveFailed"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("confirmDelete"))) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/twilio-settings`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete Twilio credentials");
      }

      // 🔥 DIVINE: Invalidate cache immediately to prevent stale data
      invalidate();
      
      toast.success(t("success.credentialsDeleted"));
      setTwilioPhoneNumber("");
      refetch();
    } catch (error) {
      console.error("Error deleting Twilio credentials:", error);
      toast.error(t("errors.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Return to Onboarding Banner */}
      {returnTo === "onboarding" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-400 text-sm">
                  🔄 Configuration depuis l'onboarding
                </h3>
                <p className="text-xs text-gray-300">
                  Une fois les identifiants sauvegardés, retournez à l'onboarding
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // Set flag to invalidate integrations cache
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("returning_from_settings", "true");
                }
                router.push(`/${locale}/onboarding/welcome`);
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-white text-sm font-medium flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour onboarding
            </button>
          </div>
        </motion.div>
      )}

      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {t("title")}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{t("description")}</p>
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            hasTwilioCredentials
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
          }`}
        >
          {hasTwilioCredentials ? (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              {t("status.configured")}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <X className="w-4 h-4" />
              {t("status.notConfigured")}
            </span>
          )}
        </motion.div>
      </div>

      {/* Current Configuration Preview */}
      {hasTwilioCredentials && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 backdrop-blur-xl"
        >
          <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t("currentConfig.title")}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">{t("currentConfig.accountSid")}</span>
              <span className="text-white font-mono">{accountSidPreview}</span>
            </div>
            {phoneNumber && (
              <div className="flex justify-between">
                <span className="text-gray-400">{t("currentConfig.phoneNumber")}</span>
                <span className="text-white font-mono">{phoneNumber}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Setup Guide */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-xl">
        <h3 className="font-semibold text-purple-400 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5" />
          {t("guide.title")}
        </h3>
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
              1
            </span>
            <p>{t("guide.step1")}</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
              2
            </span>
            <p>{t("guide.step2")}</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
              3
            </span>
            <p>{t("guide.step3")}</p>
          </div>
        </div>
        <a
          href="https://console.twilio.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          {t("guide.openTwilio")}
        </a>
      </div>

      {/* Configuration Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t("form.accountSid")}
          </label>
          <input
            type="text"
            value={accountSid}
            onChange={(e) => setAccountSid(e.target.value)}
            placeholder="AC..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t("form.authToken")}
          </label>
          <div className="relative">
            <input
              type={showAuthToken ? "text" : "password"}
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all pr-12"
            />
            <button
              type="button"
              onClick={() => setShowAuthToken(!showAuthToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showAuthToken ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t("form.phoneNumber")}
            <span className="text-gray-500 ml-2">({t("form.optional")})</span>
          </label>
          <input
            type="text"
            value={twilioPhoneNumber}
            onChange={(e) => setTwilioPhoneNumber(e.target.value)}
            placeholder="+15551234567"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving || !accountSid || !authToken}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
          >
            {isSaving ? t("form.saving") : t("form.save")}
          </button>

          {hasTwilioCredentials && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-6 py-3 bg-red-500/20 text-red-400 font-medium rounded-xl hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isDeleting ? t("form.deleting") : t("form.delete")}
            </button>
          )}
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <Zap className="w-8 h-8 text-yellow-400 mb-2" />
          <h4 className="font-semibold text-white mb-1">{t("benefits.scalable.title")}</h4>
          <p className="text-sm text-gray-400">{t("benefits.scalable.description")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <Shield className="w-8 h-8 text-green-400 mb-2" />
          <h4 className="font-semibold text-white mb-1">{t("benefits.secure.title")}</h4>
          <p className="text-sm text-gray-400">{t("benefits.secure.description")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <Globe className="w-8 h-8 text-blue-400 mb-2" />
          <h4 className="font-semibold text-white mb-1">{t("benefits.unlimited.title")}</h4>
          <p className="text-sm text-gray-400">{t("benefits.unlimited.description")}</p>
        </motion.div>
      </div>
    </div>
  );
}
