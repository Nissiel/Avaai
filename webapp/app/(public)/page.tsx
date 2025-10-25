'use client';

/**
 * ============================================================================
 * AVA HOME PAGE - Divine Landing Experience
 * ============================================================================
 * Marketing hero with feature highlights and CTA buttons.
 * Footer handled by MarketingShell layout wrapper (DRY principle).
 * ============================================================================
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Phone, Sparkles, Zap, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';

export default function HomePage() {
  const features = [
    {
      icon: Zap,
      title: 'Setup en 3 minutes',
      description: 'Wizard intuitif pour configurer AVA sans code',
    },
    {
      icon: Phone,
      title: 'Voix ultra-réalistes',
      description: 'ElevenLabs, PlayHT, Azure - les meilleures IA vocales',
    },
    {
      icon: Sparkles,
      title: '100% personnalisable',
      description: 'Adaptez la personnalité, les instructions, les fonctions',
    },
    {
      icon: Shield,
      title: '99.9% uptime',
      description: 'Infrastructure Vapi.ai professionnelle et fiable',
    },
    {
      icon: TrendingUp,
      title: 'Analytics temps réel',
      description: 'Suivez vos appels, transcripts, satisfaction',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-animated">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),transparent)]" />

        <div className="container mx-auto px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Propulsé par Vapi.ai</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
              Votre assistante vocale
              <br />
              <span className="gradient-text">intelligente et divine</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              AVA répond à vos appels 24/7 avec une voix ultra-réaliste,
              comprend vos clients, et automatise votre réception.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <FuturisticButton
                variant="primary"
                size="xl"
                glow
                onClick={() => (window.location.href = '/dashboard')}
                icon={<ArrowRight className="h-6 w-6" />}
              >
                Voir la démo
              </FuturisticButton>
            </div>
          </motion.div>

          {/* Demo Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <GlassCard gradientBorder glow className="p-8 md:p-12">
              <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center">
                  <Phone className="h-24 w-24 text-primary mx-auto mb-4 glow" />
                  <p className="text-lg text-muted-foreground">
                    Démo interactive à venir
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Pourquoi AVA ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            La solution la plus simple et puissante pour automatiser vos appels
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <GlassCard hoverable glow variant="slide-up" className="h-full">
                  <div className="flex flex-col h-full">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-primary mb-4">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground flex-1">
                      {feature.description}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <GlassCard gradientBorder glow className="max-w-4xl mx-auto p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
              Prêt à transformer vos appels ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Créez votre AVA en moins de 3 minutes. Aucune carte bancaire requise.
            </p>
            <FuturisticButton
              variant="primary"
              size="xl"
              glow
              onClick={() => (window.location.href = '/onboarding')}
              icon={<Sparkles className="h-6 w-6" />}
            >
              Commencer gratuitement
            </FuturisticButton>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
