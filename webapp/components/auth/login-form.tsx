"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Mail, Phone, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createSessionFromTokenResponse,
  getBackendBaseUrl,
  persistSession,
  type AuthTokenResponse,
} from "@/lib/auth/session-client";
import { useSessionStore } from "@/stores/session-store";

// ============================================================================
// Validation Schema
// ============================================================================

const loginSchema = z.object({
  identifier: z.string().min(1, "Email ou numéro de téléphone requis"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  remember: z.boolean().default(false),
});

type LoginValues = z.infer<typeof loginSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Détecte si l'identifiant est un email ou un numéro de téléphone
 */
function detectIdentifierType(value: string): "email" | "phone" | "unknown" {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format

  if (emailRegex.test(value)) return "email";
  if (phoneRegex.test(value.replace(/[\s-]/g, ""))) return "phone";
  return "unknown";
}

// ============================================================================
// Component
// ============================================================================

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const locale = useLocale(); // Get current locale: "fr", "en", or "he"
  const [isLoading, setIsLoading] = useState(false);
  const [identifierType, setIdentifierType] = useState<"email" | "phone" | "unknown">("unknown");
  const setSession = useSessionStore((state) => state.setSession);
  const backendBaseUrl = getBackendBaseUrl();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      remember: false,
    },
  });

  const handleIdentifierChange = (value: string) => {
    const type = detectIdentifierType(value);
    setIdentifierType(type);
  };

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${backendBaseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: values.identifier,
          password: values.password,
          remember: values.remember,
        }),
      });

      const data: AuthTokenResponse & { detail?: string } = await response.json();

      if (!response.ok) {
        // Gestion des erreurs backend
        throw new Error(data.detail || "Identifiants invalides");
      }

      // Succès - Stocker le token
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        if (values.remember) {
          localStorage.setItem("remember_me", "true");
        }

        const sessionPayload = createSessionFromTokenResponse(data);
        setSession(sessionPayload);
        persistSession(sessionPayload);
      }

      toast.success("Connexion réussie !", {
        description: `Bienvenue ${data.user?.name || ""}`,
      });

      // Redirection avec locale préservée
      // Check localStorage first (faster + offline support)
      const localOnboardingCompleted = typeof window !== "undefined"
        ? localStorage.getItem("onboarding_completed") === "true"
        : false;

      const isOnboardingCompleted = localOnboardingCompleted || data.user?.onboarding_completed;

      if (!isOnboardingCompleted) {
        router.push(`/${locale}/onboarding`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch (error) {
      toast.error("Erreur de connexion", {
        description: error instanceof Error ? error.message : "Vérifiez vos identifiants",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Identifier Field (Email OR Phone) */}
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold">
                  Email ou téléphone
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors">
                      {identifierType === "email" && (
                        <Mail className="h-5 w-5 text-green-600" />
                      )}
                      {identifierType === "phone" && (
                        <Phone className="h-5 w-5 text-blue-600" />
                      )}
                      {identifierType === "unknown" && (
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <Input
                      {...field}
                      type="text"
                      placeholder="email@exemple.com ou +33 6 12 34 56 78"
                      disabled={isLoading}
                      className={cn(
                        "h-12 pl-12 pr-4 text-base transition-all duration-200",
                        identifierType === "email" && "border-green-500/50 bg-green-50/50 focus-visible:border-green-500 focus-visible:ring-green-500/20 dark:bg-green-950/20",
                        identifierType === "phone" && "border-blue-500/50 bg-blue-50/50 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:bg-blue-950/20"
                      )}
                      onChange={(e) => {
                        field.onChange(e);
                        handleIdentifierChange(e.target.value);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-semibold">
                    Mot de passe
                  </FormLabel>
                  <Link
                    href={`/${locale}/forgot-password` as any}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••••••"
                    disabled={isLoading}
                    className="h-12 text-base"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Remember Me */}
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal leading-none cursor-pointer">
                  Rester connecté pendant 30 jours
                </FormLabel>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs font-medium uppercase tracking-wider">
          <span className="bg-background px-3 py-1 text-muted-foreground">
            Ou continuer avec
          </span>
        </div>
      </div>

      {/* OAuth Providers */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          className="h-11 font-medium hover:bg-accent/80"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          className="h-11 font-medium hover:bg-accent/80"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23">
            <path fill="#f3f3f3" d="M0 0h23v23H0z" />
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
          Outlook
        </Button>
      </div>

      {/* Footer Links */}
      <div className="space-y-4 pt-2 text-center">
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link
            href={`/${locale}/signup` as any}
            className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Créer un compte gratuitement
          </Link>
        </p>
      </div>
    </div>
  );
}
