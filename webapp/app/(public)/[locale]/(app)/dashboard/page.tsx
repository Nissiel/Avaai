/**
 * ============================================================================
 * AVA DASHBOARD - Divine Control Center (i18n enabled)
 * ============================================================================
 * Real-time analytics, call management, and AVA configuration
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Phone, Users, Clock, TrendingUp, Settings, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GlassCard } from '@/components/ui/glass-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { useQuery } from '@tanstack/react-query';

import { getAnalyticsOverview } from '@/lib/api/analytics';
import { listAssistants } from '@/lib/api/assistants';
import type { AssistantSummary, DashboardAnalytics } from '@/lib/dto';
import { useAssistantsStore } from '@/lib/stores/assistants-store';
import { useCallsStore } from '@/lib/stores/calls-store';

export default function DashboardPage() {
  const t = useTranslations();
  
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

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassCard className="max-w-md p-8 text-center">
          <p className="text-destructive">Error loading dashboard</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's what's happening with your AVA assistants.
          </p>
        </div>
        <FuturisticButton size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          New Assistant
        </FuturisticButton>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
              <p className="text-3xl font-bold mt-2">
                {loading ? '...' : overview?.totalCalls ?? 0}
              </p>
            </div>
            <Phone className="h-8 w-8 text-primary" />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <p className="text-3xl font-bold mt-2">
                {loading ? '...' : '0'}
              </p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
              <p className="text-3xl font-bold mt-2">
                {loading ? '...' : '0s'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-primary" />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold mt-2">
                {loading ? '...' : '95%'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Calls</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : calls.length === 0 ? (
            <p className="text-muted-foreground">No calls yet</p>
          ) : (
            <div className="space-y-4">
              {calls.slice(0, 5).map((call) => (
                <div key={call.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{call.id}</p>
                    <p className="text-sm text-muted-foreground">Call details</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Recent
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Assistants</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : assistants.length === 0 ? (
            <p className="text-muted-foreground">No assistants yet</p>
          ) : (
            <div className="space-y-4">
              {assistants.map((assistant) => (
                <div key={assistant.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{assistant.name}</p>
                    <p className="text-sm text-muted-foreground">AVA Assistant</p>
                  </div>
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
