"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { translate } from "@/lib/translation";
import { fallbackLocale, isLocale, type Locale } from "@/lib/i18n/locales";
import { ArrowRight, Phone, Sparkles, Zap } from "lucide-react";

interface HeroProps {
  locale: string;
}

export function Hero({ locale: localeParam }: HeroProps) {
  const locale: Locale = isLocale(localeParam) ? localeParam : fallbackLocale;
  const signupHref = `/${locale}/signup` as const;
  const loginHref = `/${locale}/login` as const;
  
  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-background via-background to-primary/5">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      
      <div className="relative mx-auto flex min-h-[90vh] w-full max-w-7xl flex-col items-center justify-center px-6 py-20 text-center">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm"
        >
          <Sparkles className="h-4 w-4" />
          <span>Réceptionniste IA disponible 24/7</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-6 max-w-4xl text-6xl font-bold tracking-tight sm:text-7xl lg:text-8xl"
        >
          {translate(locale, "marketing.heroTitle", "Votre secrétaire IA")}{" "}
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            qui ne dort jamais
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-12 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl"
        >
          {translate(
            locale,
            "marketing.heroSubtitle",
            "Ava répond à vos appels, qualifie vos leads et gère vos rendez-vous. Prêt en 3 minutes."
          )}
        </motion.p>

        {/* Spacer pour équilibre visuel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-16"
        >
          {/* CTA buttons removed - coming soon */}
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="font-medium">100+ appels gérés</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">Setup en 3 min</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium">Disponible 24/7</span>
          </div>
        </motion.div>

        {/* Demo preview card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-20 w-full max-w-4xl"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-background/95 p-8 shadow-2xl backdrop-blur-xl">
            {/* Gradient glow */}
            <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/30 blur-[100px]" />
            
            <div className="relative space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {translate(locale, "marketing.preview.label", "Appel en direct")}
                  </p>
                  <p className="mt-1 text-2xl font-bold">Ava ↔︎ Client</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {translate(locale, "marketing.preview.realtime", "En direct")}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    {translate(locale, "marketing.preview.callIntent", "Intention détectée")}
                  </p>
                  <p className="text-lg font-medium">
                    {translate(locale, "marketing.preview.intentText", "Prendre rendez-vous mardi matin pour consultation")}
                  </p>
                </div>
                
                <div className="rounded-2xl border border-border/70 bg-background p-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {translate(locale, "marketing.preview.summary", "Actions à venir")}
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{translate(locale, "marketing.preview.next1", "Invitation calendrier envoyée pour mardi 09h30")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{translate(locale, "marketing.preview.next2", "Checklist de préparation partagée par email")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{translate(locale, "marketing.preview.next3", "Rappel SMS programmé 2h avant")}</span>
                    </li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">{translate(locale, "marketing.preview.minutes", "Appels gérés")}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">+128%</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">{translate(locale, "marketing.preview.csat", "Satisfaction")}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">9.4/10</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
