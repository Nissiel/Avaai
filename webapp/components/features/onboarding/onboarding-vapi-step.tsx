"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Mic, ExternalLink, Settings, SkipForward, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/stores/session-store";
import { useIntegrationsStatus } from "@/lib/hooks/use-integrations-status";

interface OnboardingVapiStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function OnboardingVapiStep({ onNext, onSkip }: OnboardingVapiStepProps) {
  const t = useTranslations("onboarding.vapi");
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const { vapi, invalidate } = useIntegrationsStatus();

  const [vapiKey, setVapiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // If already configured, auto-advance
  if (vapi.configured) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
          <Mic className="w-10 h-10 text-green-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            ✅ {t("already.title")}
          </h3>
          <p className="text-gray-400">{t("already.description")}</p>
        </div>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/25"
        >
          {t("already.continue")} →
        </button>
      </motion.div>
    );
  }

  const handleInlineSave = async () => {
    // 🎯 DIVINE: Validation minimale - longueur uniquement
    // Le backend vérifiera la validité réelle via l'API Vapi
    if (!vapiKey || vapiKey.trim().length === 0) {
      toast.error(t("errors.emptyKey", { defaultValue: "Veuillez entrer une clé API" }));
      return;
    }

    if (vapiKey.trim().length < 10) {
      toast.error(t("errors.invalidFormat", { defaultValue: "Clé API trop courte" }), {
        description: "Une clé API Vapi contient au minimum 10 caractères",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vapi-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({ vapi_api_key: vapiKey }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save Vapi key");
      }

      toast.success(t("success.saved"));
      invalidate();
      
      // Wait a bit for the success message
      setTimeout(() => {
        onNext();
      }, 800);
    } catch (error) {
      console.error("Error saving Vapi key:", error);
      toast.error(t("errors.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToSettings = () => {
    router.push("/settings?section=vapi&returnTo=onboarding");
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
          <Mic className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {t("title")}
        </h2>
        <p className="text-gray-400 text-lg">{t("description")}</p>
      </div>

      {/* Option 1: Inline Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 backdrop-blur-xl space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            ⚡
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-lg mb-1">
              {t("option1.title")}
            </h3>
            <p className="text-sm text-gray-400 mb-4">{t("option1.description")}</p>

            {/* Quick guide */}
            <div className="bg-black/20 rounded-lg p-4 mb-4 space-y-2 text-sm text-gray-300">
              <p>📝 {t("option1.step1")}</p>
              <p>🔑 {t("option1.step2")}</p>
              <p>📋 {t("option1.step3")}</p>
            </div>

            <a
              href="https://dashboard.vapi.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors mb-4"
            >
              <ExternalLink className="w-4 h-4" />
              {t("option1.openVapi")}
            </a>

            {/* Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                {t("option1.label")}
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={vapiKey}
                  onChange={(e) => setVapiKey(e.target.value)}
                  placeholder="sk_..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleInlineSave}
              disabled={isSaving || !vapiKey}
              className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
            >
              {isSaving ? t("option1.saving") : t("option1.cta")}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Option 2: Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer"
        onClick={handleGoToSettings}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-lg mb-1">
              {t("option2.title")}
            </h3>
            <p className="text-sm text-gray-400">{t("option2.description")}</p>
          </div>
          <div className="text-gray-400">→</div>
        </div>
      </motion.div>

      {/* Option 3: Skip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={onSkip}
          className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all text-gray-400 hover:text-orange-400 flex items-center justify-center gap-2"
        >
          <SkipForward className="w-5 h-5" />
          {t("option3.cta")}
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          {t("option3.description")}
        </p>
      </motion.div>
    </div>
  );
}
