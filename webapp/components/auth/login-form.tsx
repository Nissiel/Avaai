"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Mail, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

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
import { cn } from "@/lib/utils";
import {
  createSessionFromTokenResponse,
  persistSession,
  type AuthTokenResponse,
} from "@/lib/auth/session-client";
import { useSessionStore } from "@/stores/session-store";
import { emitTokenChange } from "@/lib/hooks/use-auth-token";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale(); // Get current locale: "fr", "en", or "he"
  const [isLoading, setIsLoading] = useState(false);
  const [identifierType, setIdentifierType] = useState<"email" | "phone" | "unknown">("unknown");
  const setSession = useSessionStore((state) => state.setSession);

  // Get redirect URL from query params (set by middleware or manual navigation)
  const redirectTo = searchParams.get("redirect");
  const passwordResetSuccess = searchParams.get("reset") === "success";

  // Show toast if user just reset their password
  useEffect(() => {
    if (passwordResetSuccess) {
      toast.success("Mot de passe réinitialisé", {
        description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
    }
  }, [passwordResetSuccess]);

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
      // 🔥 DIVINE: Always use backend API for login (handles both Supabase and legacy)
      // This ensures consistent token handling and user resolution

      const response = await fetch(`/api/auth/login`, {
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

        // 🔥 DIVINE FIX: Set cookies for middleware to detect auth state
        const accessMaxAge = values.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days if remember, else 7 days
        document.cookie = `access_token=${data.access_token}; path=/; max-age=${accessMaxAge}; SameSite=Lax`;
        document.cookie = `refresh_token=${data.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;

        emitTokenChange();

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

      // Determine redirect destination
      let destination: string;
      if (redirectTo) {
        // Redirect to the page they were trying to access
        // Ensure it's a valid path (starts with /) and not an external URL
        const isValidRedirect = redirectTo.startsWith("/") && !redirectTo.includes("://");
        destination = isValidRedirect ? redirectTo : `/${locale}/dashboard`;
      } else {
        // Default to dashboard
        destination = `/${locale}/dashboard`;
      }

      router.push(destination);
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Vérifiez vos identifiants";

      // Map backend errors to user-friendly messages
      let title = "Erreur de connexion";
      let description = errorMessage;

      if (errorMessage.toLowerCase().includes("invalid credentials")) {
        title = "Identifiants incorrects";
        description = "L'email/téléphone ou le mot de passe est incorrect. Veuillez réessayer.";
      } else if (errorMessage.toLowerCase().includes("user not found")) {
        title = "Compte introuvable";
        description = "Aucun compte n'est associé à cet identifiant. Voulez-vous créer un compte ?";
      } else if (errorMessage.toLowerCase().includes("rate limit") || errorMessage.toLowerCase().includes("too many")) {
        title = "Trop de tentatives";
        description = "Veuillez patienter quelques minutes avant de réessayer.";
      } else if (errorMessage.toLowerCase().includes("timeout") || errorMessage.toLowerCase().includes("timed out")) {
        title = "Délai dépassé";
        description = "Le serveur met trop de temps à répondre. Veuillez réessayer.";
      } else if (errorMessage.toLowerCase().includes("token")) {
        title = "Session expirée";
        description = "Votre session a expiré. Veuillez vous reconnecter.";
      }

      toast.error(title, { description, duration: 6000 });
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
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      {identifierType === "phone" ? (
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <Input
                      {...field}
                      type="text"
                      placeholder="email@exemple.com ou +33 6 12 34 56 78"
                      disabled={isLoading}
                      className="h-11 pl-10 text-sm"
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
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="h-11"
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
            className="w-full h-11"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          className="h-10"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
          className="h-10"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
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
