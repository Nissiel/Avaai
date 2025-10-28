"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useSessionStore } from "@/stores/session-store";

const DISMISSED_KEY = "vapi-setup-banner-dismissed";
const CHECK_INTERVAL = 60000; // Check every 60 seconds

export function VapiSetupBanner() {
  const t = useTranslations("vapiSetup");
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useSessionStore((state) => ({ session: state.session }));
  
  const [hasVapiKey, setHasVapiKey] = useState<boolean | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  // Don't show on settings page or auth pages
  const isSettingsPage = pathname?.includes("/settings");
  const isAuthPage = pathname?.includes("/login") || pathname?.includes("/signup");

  useEffect(() => {
    // Check if user dismissed the banner
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Check Vapi key status periodically
    const checkVapiKey = async () => {
      if (!session?.accessToken || isSettingsPage || isAuthPage) {
        return;
      }

      setIsChecking(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vapi-settings`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setHasVapiKey(data.has_vapi_key);
          
          // Show banner if no key
          if (!data.has_vapi_key) {
            setIsDismissed(false);
          }
        }
      } catch (error) {
        console.error("Failed to check Vapi key:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkVapiKey();
    const interval = setInterval(checkVapiKey, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [session?.accessToken, isSettingsPage, isAuthPage, pathname]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setIsDismissed(true);
  };

  const handleSetup = () => {
    router.push("/settings?section=vapi");
  };

  // Don't show if:
  // - Dismissed
  // - Has Vapi key
  // - On settings page
  // - On auth page
  // - No session
  if (isDismissed || hasVapiKey || isSettingsPage || isAuthPage || !session) {
    return null;
  }

  return (
    <AnimatePresence>
      {hasVapiKey === false && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-4 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4"
        >
          <GlassCard className="relative overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 p-4 shadow-lg backdrop-blur-xl">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-yellow-500/20 blur-3xl" />
            
            <div className="relative flex items-start gap-4">
              <div className="rounded-xl bg-orange-500/20 p-2.5">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {t("title", { defaultValue: "⚠️ Vapi Integration Required" })}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("description", { 
                        defaultValue: "Configure your Vapi.ai API key to unlock AI voice assistants and phone features." 
                      })}
                    </p>
                  </div>

                  <button
                    onClick={handleDismiss}
                    className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSetup}
                    size="sm"
                    className="h-8 gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-xs hover:from-orange-600 hover:to-yellow-600"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("cta", { defaultValue: "Setup Now" })}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                  >
                    {t("later", { defaultValue: "Later" })}
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
