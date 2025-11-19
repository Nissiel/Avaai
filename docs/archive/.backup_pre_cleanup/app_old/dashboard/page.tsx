/**
 * ============================================================================
 * AVA DASHBOARD - Divine Control Center
 * ============================================================================
 * Real-time analytics, call management, and AVA configuration
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Phone, Users, Clock, TrendingUp, Settings, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { useQuery } from '@tanstack/react-query';

import { getAnalyticsOverview } from '@/lib/api/analytics';
import { listAssistants } from '@/lib/api/assistants';
import type { AssistantSummary, DashboardAnalytics } from '@/lib/dto';
import { useAssistantsStore } from '@/lib/stores/assistants-store';
import { useCallsStore } from '@/lib/stores/calls-store';

export default function DashboardPage() {
  const analyticsQuery = useQuery<DashboardAnalytics>({
    queryKey: ['dashboard', 'analytics'],
    queryFn: getAnalyticsOverview,
    staleTime: 60_000,
  });

  const assistantsQuery = useQuery<AssistantSummary[]>({
    queryKey: ['assistants'],
    queryFn: listAssistants,
    staleTime: 60_000,
  });

  const overview = analyticsQuery.data?.overview ?? null;
  const calls = analyticsQuery.data?.calls ?? [];
  const assistants = assistantsQuery.data ?? [];
  const loading = analyticsQuery.isLoading || assistantsQuery.isLoading;
  const error = analyticsQuery.error || assistantsQuery.error;
  const setAssistants = useAssistantsStore((state) => state.setAssistants);
  const setCalls = useCallsStore((state) => state.setCalls);

  React.useEffect(() => {
    if (assistants.length) {
      setAssistants(assistants);
    }
  }, [assistants, setAssistants]);

  React.useEffect(() => {
    if (calls.length) {
      setCalls(calls);
    }
  }, [calls, setCalls]);

  const periodLabel = React.useMemo(() => {
    if (!overview) return null;

    const formatter = new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'short',
    });

    const start = formatter.format(new Date(overview.period.start));
    const end = formatter.format(new Date(overview.period.end));
    return `${start} – ${end}`;
  }, [overview]);

  const statCards = [
    {
      title: 'Appels totaux',
      value: overview?.totalCalls ?? 0,
      icon: Phone,
      color: 'primary' as const,
      trend: overview ? '7 derniers jours' : '—',
    },
    {
      title: 'Appels actifs',
      value: overview?.activeNow ?? 0,
      icon: Users,
      color: 'success' as const,
      trend: 'En temps réel',
    },
    {
      title: 'Durée moyenne',
      value: overview?.avgDuration ?? '0:00',
      icon: Clock,
      color: 'accent' as const,
      trend: 'Aujourd’hui',
    },
    {
      title: 'Satisfaction',
      value: overview ? `${Math.round(overview.satisfaction * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'secondary' as const,
      trend: overview?.totalCost ? `${overview.totalCost.toFixed(1)} €` : '+0%',
    },
  ];

  const errorMessage = React.useMemo(() => {
    if (!error) return null;
    if (error instanceof Error) return error.message;
    return String(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-animated p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Dashboard AVA
            </h1>
            <p className="text-muted-foreground">
              Gérez vos assistantes vocales en temps réel
            </p>
            {periodLabel ? (
              <p className="text-xs text-muted-foreground/80 mt-1">
                Période analysée : {periodLabel}
              </p>
            ) : null}
          </div>
          <FuturisticButton
            variant="primary"
            glow
            icon={<Plus className="h-5 w-5" />}
            onClick={() => (window.location.href = '/onboarding')}
          >
            Nouvelle AVA
          </FuturisticButton>
        </motion.div>

        {errorMessage ? (
          <GlassCard className="mb-8 border-destructive/40">
            <p className="text-sm text-destructive">{errorMessage}</p>
          </GlassCard>
        ) : null}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <GlassCard
                key={stat.title}
                hoverable
                glow
                variant="slide-up"
                delay={index * 0.1}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg gradient-${stat.color}`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-success font-medium">{stat.trend}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </GlassCard>
            );
          })}
        </div>

        {/* Assistants List */}
        <GlassCard gradientBorder className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Vos AVA</h2>
            <FuturisticButton
              variant="ghost"
              size="sm"
              icon={<Settings className="h-4 w-4" />}
            >
              Configurer
            </FuturisticButton>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <Phone className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="mt-4 text-muted-foreground">Chargement...</p>
            </div>
          ) : assistants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Aucune AVA configurée pour le moment
              </p>
              <FuturisticButton
                variant="primary"
                onClick={() => (window.location.href = '/onboarding')}
                icon={<Plus className="h-5 w-5" />}
              >
                Créer votre première AVA
              </FuturisticButton>
            </div>
          ) : (
            <div className="space-y-4">
              {assistants.map((assistant, index) => (
                <motion.div
                  key={assistant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass p-4 rounded-lg hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">{assistant.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {assistant.phoneNumber ? `Numéro: ${assistant.phoneNumber}` : 'Numéro non attribué'}
                      </p>
                    </div>
                    <FuturisticButton variant="secondary" size="sm">
                      Gérer
                    </FuturisticButton>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    ID: {assistant.id.substring(0, 8)}...
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Recent Calls */}
        <GlassCard gradientBorder>
          <h2 className="text-2xl font-bold mb-6">Appels récents</h2>
          <div className="text-center py-12 text-muted-foreground">
            Historique des appels à venir...
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
