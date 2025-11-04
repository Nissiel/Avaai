"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  Key,
  ExternalLink,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
  Settings,
  ArrowRight,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useVapiStatus } from "@/lib/hooks/use-vapi-status";
import { saveVapiSettings } from "@/lib/api/vapi-settings";

interface VapiSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function VapiSetupModal({ isOpen, onClose, onSuccess }: VapiSetupModalProps) {
  const t = useTranslations("vapi.modal");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { refetch } = useVapiStatus();
  const queryClient = useQueryClient();

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [step, setStep] = useState<"choice" | "quick" | "success">("choice");

  const saveMutation = useMutation({
    mutationFn: (key: string) => saveVapiSettings(key),
    onSuccess: async () => {
      setStep("success");
      await refetch();
      
      // 🔥 DIVINE: Invalidate ALL related caches so dashboard refetches with new key
      queryClient.invalidateQueries({ queryKey: ["assistants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-status"] });
      
      onSuccess?.();
      
      setTimeout(() => {
        onClose();
        setStep("choice");
        setApiKey("");
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error(t("errors.saveFailed", { defaultValue: "Échec de la sauvegarde" }), {
        description: error.message,
      });
    },
  });

  const handleSaveApiKey = () => {
    // Validation minimale - longueur uniquement
    if (!apiKey.trim()) {
      toast.error(t("errors.emptyKey", { defaultValue: "Veuillez entrer une clé API" }));
      return;
    }

    if (apiKey.trim().length < 10) {
      toast.error(t("errors.invalidFormat", { defaultValue: "Format de clé invalide" }), {
        description: "Une clé API Vapi contient au minimum 10 caractères",
      });
      return;
    }

    saveMutation.mutate(apiKey.trim());
  };

  const handleGoToSettings = () => {
    onClose();
    router.push(`/${locale}/settings?section=vapi`);
  };

  const openVapiDashboard = () => {
    window.open("https://vapi.ai/dashboard", "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <AnimatePresence mode="wait">
          {step === "choice" && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <DialogHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/20 to-violet-500/20">
                  <Phone className="h-6 w-6 text-brand-500" />
                </div>
                <DialogTitle className="text-center text-2xl">
                  {t("title", { defaultValue: "Configuration Vapi.ai" })}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {t("subtitle", {
                    defaultValue: "Choisissez votre méthode de configuration"
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Option 1: Quick Setup */}
                <button
                  onClick={() => setStep("quick")}
                  className="w-full rounded-xl border border-border/60 bg-gradient-to-br from-background to-brand-500/5 p-6 text-left transition-all hover:border-brand-500/40 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-brand-500/20 p-2">
                      <Sparkles className="h-5 w-5 text-brand-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        ⚡ {t("quickSetup.title", { defaultValue: "Configuration Rapide" })}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("quickSetup.description", {
                          defaultValue: "Configurez votre clé Vapi ici en 2 minutes"
                        })}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-sm text-brand-500">
                        <ArrowRight className="h-4 w-4" />
                        {t("quickSetup.time", { defaultValue: "~2 minutes" })}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Option 2: Full Settings */}
                <button
                  onClick={handleGoToSettings}
                  className="w-full rounded-xl border border-border/60 bg-gradient-to-br from-background to-violet-500/5 p-6 text-left transition-all hover:border-violet-500/40 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-violet-500/20 p-2">
                      <Settings className="h-5 w-5 text-violet-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        ⚙️ {t("settings.title", { defaultValue: "Paramètres Complets" })}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("settings.description", {
                          defaultValue: "Accédez à la page Settings avec le guide détaillé"
                        })}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-sm text-violet-500">
                        <ArrowRight className="h-4 w-4" />
                        {t("settings.more", { defaultValue: "Plus d'options" })}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full"
              >
                {t("skip", { defaultValue: "Passer pour l'instant" })}
              </Button>
            </motion.div>
          )}

          {step === "quick" && (
            <motion.div
              key="quick"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <DialogHeader>
                <DialogTitle>⚡ {t("quickSetup.title", { defaultValue: "Configuration Rapide" })}</DialogTitle>
                <DialogDescription>
                  {t("quickSetup.guide", {
                    defaultValue: "Suivez ces 3 étapes simples"
                  })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Steps */}
                <div className="space-y-3">
                  {[
                    t("quickSetup.step1", { defaultValue: "1. Créez un compte gratuit sur Vapi.ai" }),
                    t("quickSetup.step2", { defaultValue: "2. Allez dans Settings → API Keys" }),
                    t("quickSetup.step3", { defaultValue: "3. Créez une nouvelle clé et copiez-la" }),
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-500">
                        {i + 1}
                      </div>
                      <p className="text-sm text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={openVapiDashboard}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t("openVapi", { defaultValue: "Ouvrir Vapi Dashboard" })}
                </Button>

                {/* API Key Input */}
                <div className="space-y-2">
                  <Label htmlFor="quick-vapi-key">
                    {t("form.label", { defaultValue: "Clé API Vapi" })}
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="quick-vapi-key"
                      type={showKey ? "text" : "password"}
                      placeholder="sk_live_..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pl-10 pr-12"
                      disabled={saveMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setStep("choice")}
                    variant="outline"
                    className="flex-1"
                    disabled={saveMutation.isPending}
                  >
                    {t("back", { defaultValue: "Retour" })}
                  </Button>
                  <Button
                    onClick={handleSaveApiKey}
                    disabled={saveMutation.isPending || !apiKey.trim()}
                    className="flex-1 bg-gradient-to-r from-brand-500 to-violet-500"
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("saving", { defaultValue: "Enregistrement..." })}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t("activate", { defaultValue: "Activer Vapi" })}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-green-500">
                {t("success.title", { defaultValue: "✨ Configuration réussie !" })}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {t("success.description", {
                  defaultValue: "Votre intégration Vapi.ai est maintenant active"
                })}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
