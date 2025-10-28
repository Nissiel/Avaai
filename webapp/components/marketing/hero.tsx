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

        {/* Divine Login Button - Scientifiquement irrésistible */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-12"
        >
          <Link href={signupHref}>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group relative"
            >
              {/* Glow effect */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent opacity-75 blur-lg transition duration-500 group-hover:opacity-100 group-hover:blur-xl" />
              
              {/* Button */}
              <div className="relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent px-12 py-5 text-lg font-bold text-white shadow-2xl transition-all duration-300">
                <Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                <span>{translate(locale, "nav.login", "Se connecter")}</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </motion.div>
          </Link>
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
      </div>
    </section>
  );
}
