"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSessionStore } from "@/lib/stores/session-store";
import { useIntegrationsStatus } from "@/lib/hooks/use-integrations-status";

interface OnboardingAssistantStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export function OnboardingAssistantStep({
  onComplete,
  onBack,
}: OnboardingAssistantStepProps) {
  const t = useTranslations("onboarding.assistant");
  const session = useSessionStore((state) => state.session);
  const { vapi } = useIntegrationsStatus();

  const [assistantName, setAssistantName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Block if Vapi not configured
  if (!vapi.configured) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-orange-500/20 border-2 border-orange-500 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">{t("blocked.title")}</h2>
          <p className="text-gray-400 text-lg">{t("blocked.description")}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/30 backdrop-blur-xl"
        >
          <p className="text-sm text-gray-300 mb-4">{t("blocked.explain")}</p>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 bg-purple-500/20 text-purple-400 font-medium rounded-xl hover:bg-purple-500/30 border border-purple-500/30 transition-all"
            >
              {t("blocked.cta1")}
            </button>
            <button
              onClick={onComplete}
              className="flex-1 px-6 py-3 bg-white/5 text-gray-400 font-medium rounded-xl hover:bg-white/10 border border-white/10 transition-all"
            >
              {t("blocked.cta2")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleCreateAssistant = async () => {
    if (!assistantName.trim()) {
      toast.error(t("errors.nameRequired"));
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/assistants`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({
            name: assistantName,
            firstMessage: t("defaults.firstMessage"),
            systemPrompt: t("defaults.systemPrompt"),
            model: "gpt-4",
            voice: "jennifer",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create assistant");
      }

      // Mark as created in backend
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          onboarding_assistant_created: true,
        }),
      });

      toast.success(t("success.created"));
      
      // Wait for success animation
      setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (error) {
      console.error("Error creating assistant:", error);
      toast.error(t("errors.createFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {t("title")}
        </h2>
        <p className="text-gray-400 text-lg">{t("description")}</p>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-xl space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t("form.name")}
          </label>
          <input
            type="text"
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
            placeholder={t("form.placeholder")}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
          />
        </div>

        <div className="bg-black/20 rounded-lg p-4 space-y-2 text-sm text-gray-300">
          <p className="font-semibold text-purple-400">{t("preview.title")}</p>
          <p>🎙️ {t("preview.voice")}</p>
          <p>🤖 {t("preview.model")}</p>
          <p>💬 {t("preview.greeting")}</p>
        </div>

        <button
          onClick={handleCreateAssistant}
          disabled={isCreating || !assistantName.trim()}
          className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25 text-lg"
        >
          {isCreating ? t("form.creating") : t("form.create")}
        </button>

        <p className="text-xs text-gray-500 text-center">
          {t("form.hint")}
        </p>
      </motion.div>
    </div>
  );
}
