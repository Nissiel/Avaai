"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ArrowLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";
import { useSessionStore } from "@/stores/session-store";

interface VapiSettings {
  has_vapi_key: boolean;
  vapi_api_key_preview?: string;
}

export function VapiSettingsForm() {
  const t = useTranslations("settingsPage.vapi");
  const locale = useLocale();
  const { session } = useSessionStore((state) => ({ session: state.session }));
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const returnTo = searchParams?.get("returnTo");
  
  const [apiKey, setApiKey] = useState("");
  const [settings, setSettings] = useState<VapiSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Only fetch if session is loaded
    if (session?.accessToken) {
      fetchSettings();
    } else {
      // If no token, stop loading
      setFetching(false);
    }
  }, [session?.accessToken]);

  const fetchSettings = async () => {
    setFetching(true);
    try {
      const token = session?.accessToken;
      if (!token) {
        console.warn("No access token available");
        setFetching(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vapi-settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        console.error("Failed to fetch Vapi settings:", res.status);
      }
    } catch (error) {
      console.error("Failed to fetch Vapi settings:", error);
    } finally {
      setFetching(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error(t("errors.emptyKey"));
      return;
    }

    if (!apiKey.startsWith("sk_")) {
      toast.error(t("errors.invalidFormat"), {
        description: t("errors.invalidFormatDesc"),
      });
      return;
    }

    setLoading(true);
    try {
      const token = session?.accessToken;
      if (!token) {
        toast.error(t("errors.noAuth"));
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vapi-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vapi_api_key: apiKey }),
      });

      if (res.ok) {
        toast.success(t("success.saved"), {
          description: t("success.savedDesc"),
        });
        setApiKey("");
        await fetchSettings();
      } else {
        const error = await res.json();
        toast.error(t("errors.saveFailed"), {
          description: error.detail || t("errors.saveFailedDesc"),
        });
      }
    } catch (error) {
      toast.error(t("errors.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async () => {
    if (!confirm(t("confirm.delete"))) return;

    setLoading(true);
    try {
      const token = session?.accessToken;
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vapi-settings`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success(t("success.deleted"), {
          description: t("success.deletedDesc"),
        });
        await fetchSettings();
      }
    } catch (error) {
      toast.error(t("errors.deleteFailed"));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText("https://vapi.ai/dashboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t("success.copied"));
  };

  if (fetching) {
    return (
      <GlassCard className="p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      </GlassCard>
    );
  }

  // If no session, show login prompt
  if (!session?.accessToken) {
    return (
      <GlassCard className="p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <AlertCircle className="h-12 w-12 text-orange-500" />
          <div>
            <h3 className="text-lg font-semibold">Authentication Required</h3>
            <p className="text-sm text-muted-foreground">
              Please sign in to configure your Vapi integration.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Return to Onboarding Banner */}
      {returnTo === "onboarding" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-400 text-sm">
                  🔄 Configuration depuis l'onboarding
                </h3>
                <p className="text-xs text-gray-300">
                  Une fois la clé sauvegardée, retournez à l'onboarding pour continuer
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
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors text-white text-sm font-medium flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour onboarding
            </button>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <GlassCard className="relative overflow-hidden p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
        
        <div className="relative space-y-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 p-3">
              <Phone className="h-6 w-6 text-brand-500" />
            </div>
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {t("title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <AnimatePresence mode="wait">
            {settings?.has_vapi_key ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-3 text-green-500"
              >
                <CheckCircle2 className="h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t("status.configured")}</p>
                  {settings.vapi_api_key_preview && (
                    <p className="text-xs opacity-70">
                      {t("status.keyPreview")}: {settings.vapi_api_key_preview}
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 rounded-xl bg-orange-500/10 px-4 py-3 text-orange-500"
              >
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">{t("status.notConfigured")}</p>
                  <p className="text-xs opacity-70">{t("status.notConfiguredDesc")}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>

      {/* Configuration Form */}
      <GlassCard className="p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="vapi-key" className="text-sm font-semibold">
              {t("form.label")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("form.description")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="vapi-key"
                type={showKey ? "text" : "password"}
                placeholder="sk_live_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pl-10 pr-12"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={saveApiKey}
                disabled={loading || !apiKey.trim()}
                className="flex-1 bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("form.saving")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("form.save")}
                  </>
                )}
              </Button>

              {settings?.has_vapi_key && (
                <Button
                  onClick={deleteApiKey}
                  disabled={loading}
                  variant="outline"
                  className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                >
                  {t("form.delete")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Guide Section */}
      <GlassCard className="bg-gradient-to-br from-blue-500/5 to-violet-500/5 p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-brand-500" />
            <h3 className="text-lg font-semibold">{t("guide.title")}</h3>
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4].map((step) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: step * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-500">
                  {step}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t(`guide.step${step}` as any)}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              asChild
              className="flex-1"
            >
              <a
                href="https://vapi.ai/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {t("guide.goToVapi")}
              </a>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Benefits Section */}
      <GlassCard className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: "🚀", key: "scalable" },
            { icon: "🔒", key: "secure" },
            { icon: "♾️", key: "unlimited" },
          ].map((benefit) => (
            <motion.div
              key={benefit.key}
              whileHover={{ scale: 1.02 }}
              className="flex flex-col items-center gap-2 rounded-xl bg-muted/30 p-4 text-center"
            >
              <span className="text-2xl">{benefit.icon}</span>
              <p className="text-xs font-semibold">
                {t(`benefits.${benefit.key}` as any)}
              </p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
