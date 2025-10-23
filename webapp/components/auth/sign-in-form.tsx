"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signInSchema, verifyTotpSchema } from "@/lib/validations/auth";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const oauthProviders = [
  { id: "google", label: "Google" },
  { id: "microsoft", label: "Microsoft" },
];

type SignInValues = z.infer<typeof signInSchema>;
type TotpValues = z.infer<typeof verifyTotpSchema>;

export function SignInForm() {
  const t = useTranslations("auth");
  const [step, setStep] = useState<"magic" | "verify">("magic");
  const [email, setEmail] = useState<string | null>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", remember: true },
  });

  const totpForm = useForm<TotpValues>({
    resolver: zodResolver(verifyTotpSchema),
    defaultValues: { token: "" },
  });

  const handleMagicSubmit = async (values: SignInValues) => {
    setEmail(values.email);
    toast(t("magic.success", { defaultValue: "Magic link sent! Check your inbox." }), {
      description: values.email,
    });
    setTimeout(() => setStep("verify"), 400);
  };

  const handleTotpSubmit = async (values: TotpValues) => {
    toast.success(t("totp.success", { defaultValue: "2FA verified. Redirecting..." }));
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.04em]">
          {step === "magic" ? t("title", { defaultValue: "Welcome back" }) : t("totp.title", { defaultValue: "Verify with 2FA" })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === "magic"
            ? t("subtitle", { defaultValue: "Sign in with a magic link or your favourite identity provider." })
            : t("totp.subtitle", { defaultValue: "Enter the 6-digit code from your authenticator app." })}
        </p>
      </div>

      {step === "magic" ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleMagicSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.email", { defaultValue: "Work email" })}</FormLabel>
                  <FormControl>
                    <Input placeholder="you@company.com" type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t("fields.remember", { defaultValue: "Stay signed in" })}</FormLabel>
                    <FormDescription>{t("fields.remember_hint", { defaultValue: "Keeps your session active for 30 days." })}</FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full">
              {t("cta.magic", { defaultValue: "Send magic link" })}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...totpForm}>
          <form onSubmit={totpForm.handleSubmit(handleTotpSubmit)} className="space-y-6">
            <FormField
              control={totpForm.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("totp.token", { defaultValue: "Authenticator code" })}</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" maxLength={6} placeholder="123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="lg" className="w-full">
              {t("totp.verify", { defaultValue: "Verify code" })}
            </Button>
            <button
              type="button"
              onClick={() => setStep("magic")}
              className="w-full text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              {t("totp.back", { defaultValue: "Use a different email" })}
            </button>
          </form>
        </Form>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("or", { defaultValue: "Or continue with" })}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-3">
          {oauthProviders.map((provider) => (
            <Button key={provider.id} variant="outline" size="lg" className="w-full gap-2" type="button">
              <span className={cn("h-2 w-2 rounded-full", provider.id === "google" ? "bg-[#4285F4]" : "bg-[#2F2F2F]")} aria-hidden />
              {t("oauth", { defaultValue: "Continue with {provider}", provider: provider.label })}
            </Button>
          ))}
        </div>
      </div>

      {email ? (
        <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-xs text-muted-foreground">
          {t("magic.sent", { defaultValue: "We sent a secure link to {email}.", email })}
        </div>
      ) : null}
    </div>
  );
}
