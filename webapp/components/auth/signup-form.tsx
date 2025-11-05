"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Mail, Phone, Loader2, User, Lock, CheckCircle } from "lucide-react";

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
  FormDescription,
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
import { emitTokenChange } from "@/lib/hooks/use-auth-token";

// ============================================================================
// Validation Schema
// ============================================================================

const signupSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  password: z.string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir au moins un caractère spécial"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les conditions d'utilisation",
  }),
  newsletter: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type SignupValues = z.infer<typeof signupSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Détecte si l'input phone est valide (format E.164)
 */
function isValidPhone(value: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
  return phoneRegex.test(value.replace(/[\s-]/g, ""));
}

/**
 * Calcule la force du mot de passe
 */
function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Faible", color: "text-red-500" };
  if (score <= 4) return { score, label: "Moyen", color: "text-orange-500" };
  return { score, label: "Fort", color: "text-green-500" };
}

// ============================================================================
// Component
// ============================================================================

export function SignupForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const locale = useLocale(); // Get current locale: "fr", "en", or "he"
  const [isLoading, setIsLoading] = useState(false);
  const [phoneType, setPhoneType] = useState<"valid" | "invalid" | "empty">("empty");
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" });
  const setSession = useSessionStore((state) => state.setSession);
  const backendBaseUrl = getBackendBaseUrl();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
      newsletter: false,
    },
  });

  const handlePhoneChange = (value: string) => {
    if (value.length === 0) {
      setPhoneType("empty");
    } else if (isValidPhone(value)) {
      setPhoneType("valid");
    } else {
      setPhoneType("invalid");
    }
  };

  const handlePasswordChange = (value: string) => {
    const strength = calculatePasswordStrength(value);
    setPasswordStrength(strength);
  };

  const onSubmit = async (values: SignupValues) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          password: values.password,
          locale: locale,
        }),
      });

      const data: AuthTokenResponse & { detail?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Erreur lors de l'inscription");
      }

      // Store tokens in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        emitTokenChange();

        const sessionPayload = createSessionFromTokenResponse(data);
        setSession(sessionPayload);
        persistSession(sessionPayload);
      }

      toast.success("Compte créé avec succès !", {
        description: "Bienvenue sur AVA !",
      });

      // Redirect to onboarding
      router.push(`/${locale}/onboarding`);

    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Erreur lors de l'inscription", {
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ===== NAME FIELD ===== */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Nom complet
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors" />
                  <Input
                    {...field}
                    type="text"
                    placeholder="Jean Dupont"
                    disabled={isLoading}
                    className={cn(
                      "h-12 pl-11 pr-4 transition-all duration-200",
                      "border-2 rounded-xl",
                      "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    )}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ===== EMAIL FIELD ===== */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Email
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors",
                    field.value && field.value.includes("@")
                      ? "text-green-500"
                      : "text-muted-foreground"
                  )} />
                  <Input
                    {...field}
                    type="email"
                    placeholder="jean.dupont@example.com"
                    disabled={isLoading}
                    className={cn(
                      "h-12 pl-11 pr-4 transition-all duration-200",
                      "border-2 rounded-xl",
                      "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
                      field.value && field.value.includes("@") && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    )}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ===== PHONE FIELD (Optional) ===== */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Téléphone <span className="text-muted-foreground font-normal">(optionnel)</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors",
                    phoneType === "valid" ? "text-blue-500" : "text-muted-foreground"
                  )} />
                  <Input
                    {...field}
                    type="tel"
                    placeholder="+33612345678"
                    disabled={isLoading}
                    onChange={(e) => {
                      field.onChange(e);
                      handlePhoneChange(e.target.value);
                    }}
                    className={cn(
                      "h-12 pl-11 pr-4 transition-all duration-200",
                      "border-2 rounded-xl",
                      "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
                      phoneType === "valid" && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                    )}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Format international recommandé (ex: +33612345678)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ===== PASSWORD FIELD ===== */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Mot de passe
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors" />
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    onChange={(e) => {
                      field.onChange(e);
                      handlePasswordChange(e.target.value);
                    }}
                    className={cn(
                      "h-12 pl-11 pr-4 transition-all duration-200",
                      "border-2 rounded-xl",
                      "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    )}
                  />
                </div>
              </FormControl>
              {field.value && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        passwordStrength.score <= 2 ? "bg-red-500 w-1/3" : "",
                        passwordStrength.score > 2 && passwordStrength.score <= 4 ? "bg-orange-500 w-2/3" : "",
                        passwordStrength.score > 4 ? "bg-green-500 w-full" : ""
                      )}
                    />
                  </div>
                  <span className={cn("text-xs font-medium", passwordStrength.color)}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
              <FormDescription className="text-xs">
                Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ===== CONFIRM PASSWORD FIELD ===== */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Confirmer le mot de passe
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors",
                    field.value && field.value === form.watch("password")
                      ? "text-green-500"
                      : "text-muted-foreground"
                  )} />
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    className={cn(
                      "h-12 pl-11 pr-4 transition-all duration-200",
                      "border-2 rounded-xl",
                      "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
                      field.value && field.value === form.watch("password") && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                    )}
                  />
                  {field.value && field.value === form.watch("password") && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ===== TERMS & CONDITIONS ===== */}
        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  className="mt-1"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal cursor-pointer">
                  J'accepte les{" "}
                  <Link
                    href="/terms"
                    className="text-brand-600 hover:text-brand-700 font-medium underline"
                    target="_blank"
                  >
                    conditions d'utilisation
                  </Link>
                  {" "}et la{" "}
                  <Link
                    href="/privacy"
                    className="text-brand-600 hover:text-brand-700 font-medium underline"
                    target="_blank"
                  >
                    politique de confidentialité
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* ===== NEWSLETTER OPT-IN ===== */}
        <FormField
          control={form.control}
          name="newsletter"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  className="mt-1"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal cursor-pointer text-muted-foreground">
                  Je souhaite recevoir les actualités et offres AVA par email
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        {/* ===== SUBMIT BUTTON ===== */}
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full h-12 text-base font-semibold",
            "bg-gradient-to-r from-brand-500 to-brand-600",
            "hover:from-brand-600 hover:to-brand-700",
            "shadow-lg hover:shadow-xl",
            "transition-all duration-200"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Création en cours...
            </>
          ) : (
            "Créer mon compte"
          )}
        </Button>

        {/* ===== DIVIDER ===== */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">
              Ou continuer avec
            </span>
          </div>
        </div>

        {/* ===== OAUTH BUTTONS ===== */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            className="h-11 border-2 hover:bg-muted/50 transition-all duration-200"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            className="h-11 border-2 hover:bg-muted/50 transition-all duration-200"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" fill="#F25022" />
              <rect x="13" y="3" width="8" height="8" fill="#7FBA00" />
              <rect x="3" y="13" width="8" height="8" fill="#00A4EF" />
              <rect x="13" y="13" width="8" height="8" fill="#FFB900" />
            </svg>
            Outlook
          </Button>
        </div>

        {/* ===== FOOTER - ALREADY HAVE ACCOUNT ===== */}
        <div className="text-center text-sm text-muted-foreground mt-6">
          Vous avez déjà un compte ?{" "}
          <Link
            href={`/${locale}/login`}
            className="text-brand-600 hover:text-brand-700 font-medium hover:underline transition-colors"
          >
            Se connecter
          </Link>
        </div>

      </form>
    </Form>
  );
}
