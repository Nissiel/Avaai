"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Phone, Settings, SkipForward, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useIntegrationsStatus } from "@/lib/hooks/use-integrations-status";

interface OnboardingTwilioStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function OnboardingTwilioStep({ onNext, onSkip }: OnboardingTwilioStepProps) {
  const t = useTranslations("onboarding.twilio");
  const router = useRouter();
  const { twilio } = useIntegrationsStatus();

  // If already configured, show success and auto-advance
  if (twilio.configured) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
          <Phone className="w-10 h-10 text-green-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            ✅ {t("already.title")}
          </h3>
          <p className="text-gray-400">{t("already.description")}</p>
          {twilio.phoneNumber && (
            <p className="text-purple-400 font-mono mt-2">{twilio.phoneNumber}</p>
          )}
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

  const handleGoToSettings = () => {
    router.push("/settings?section=twilio&returnTo=onboarding");
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
          <Phone className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          {t("title")}
        </h2>
        <p className="text-gray-400 text-lg">{t("description")}</p>
      </div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl"
      >
        <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {t("info.title")}
        </h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>{t("info.point1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>{t("info.point2")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>{t("info.point3")}</span>
          </li>
        </ul>
      </motion.div>

      {/* Option 1: Go to Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={handleGoToSettings}
        className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 hover:border-blue-500/50 backdrop-blur-xl cursor-pointer transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-lg mb-1">
              {t("option1.title")}
            </h3>
            <p className="text-sm text-gray-400">{t("option1.description")}</p>
          </div>
          <div className="text-gray-400">→</div>
        </div>
      </motion.div>

      {/* Option 2: Skip */}
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
          {t("option2.cta")}
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          {t("option2.description")}
        </p>
      </motion.div>
    </div>
  );
}
