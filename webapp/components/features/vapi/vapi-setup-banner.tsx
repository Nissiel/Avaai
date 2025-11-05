"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Settings, X, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { VapiSetupModal } from "./vapi-setup-modal";

interface VapiSetupBannerProps {
  onDismiss?: () => void;
  showModal?: boolean;
}

export function VapiSetupBanner({ onDismiss, showModal = false }: VapiSetupBannerProps) {
  const t = useTranslations("vapi.banner");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [isModalOpen, setIsModalOpen] = useState(showModal);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleGoToSettings = () => {
    router.push(`/${locale}/settings?section=vapi`);
  };

  const handleQuickSetup = () => {
    setIsModalOpen(true);
  };

  if (isDismissed) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <GlassCard className="relative overflow-hidden border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 p-6">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative flex items-start gap-4">
              <div className="rounded-full bg-orange-500/20 p-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-orange-500">
                    {t("title", { defaultValue: "⚠️ Configuration Vapi manquante" })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("description", {
                      defaultValue: "Configurez votre clé API Vapi.ai pour créer des assistants vocaux et gérer vos appels téléphoniques."
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleQuickSetup}
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {t("quickSetup", { defaultValue: "Configuration rapide (2 min)" })}
                  </Button>

                  <Button
                    onClick={handleGoToSettings}
                    size="sm"
                    variant="outline"
                    className="border-orange-500/20"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t("goToSettings", { defaultValue: "Ouvrir les paramètres" })}
                  </Button>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="rounded-lg p-1 hover:bg-white/10 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      <VapiSetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
