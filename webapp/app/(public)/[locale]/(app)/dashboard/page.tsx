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
import { Phone, Clock, TrendingUp, Settings, Plus, MessageSquare, Mail, DollarSign } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale as DateFnsLocale } from 'date-fns';
import { enUS, fr, he } from 'date-fns/locale';
import { GlassCard } from '@/components/ui/glass-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CallTranscriptViewer } from '@/components/app/call-transcript-viewer';
import { toast } from 'sonner';

import { getAnalyticsOverview } from '@/lib/api/analytics';
import { listAssistants } from '@/lib/api/assistants';
import { sendCallTranscriptEmail } from '@/lib/api/calls';
import type { AssistantSummary, DashboardAnalytics } from '@/lib/dto';
import { useAssistantsStore } from '@/lib/stores/assistants-store';
import { useCallsStore } from '@/lib/stores/calls-store';
import type { Locale as SupportedLocale } from '@/lib/i18n/locales';

const DATE_LOCALE_MAP: Record<SupportedLocale, DateFnsLocale> = {
  en: enUS,
  fr,
  he,
};

const CURRENCY_BY_LOCALE: Record<SupportedLocale, string> = {
  en: 'USD',
  fr: 'EUR',
  he: 'ILS',
};

export default function DashboardPage() {
  const t = useTranslations('dashboardPage');
  const tStatus = useTranslations('callsPage.status');
  const locale = useLocale() as SupportedLocale;
  const dateLocale = DATE_LOCALE_MAP[locale] ?? enUS;
  const numberFormatter = React.useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const currencyFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: CURRENCY_BY_LOCALE[locale] ?? 'USD',
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const [mounted, setMounted] = React.useState(false);
  const [selectedCall, setSelectedCall] = React.useState<any | null>(null);
  
  const analyticsQuery = useQuery<DashboardAnalytics>({
    queryKey: ['dashboard', 'analytics'],
    queryFn: getAnalyticsOverview,
    staleTime: 60_000,
    enabled: mounted, // Only fetch after mount
  });

  const assistantsQuery = useQuery<AssistantSummary[]>({
    queryKey: ['assistants'],
    queryFn: listAssistants,
    staleTime: 60_000,
    enabled: mounted, // Only fetch after mount
  });

  const emailMutation = useMutation({
    mutationFn: (callId: string) => sendCallTranscriptEmail(callId),
    onSuccess: () => {
      toast.success(t('recent.toastSuccess'));
    },
    onError: (error: Error) => {
      toast.error(t('recent.toastError'), {
        description: error.message,
      });
    },
  });

  const overview = analyticsQuery.data?.overview ?? null;
  const calls = analyticsQuery.data?.calls ?? [];
  const assistants = assistantsQuery.data ?? [];
  const loading = !mounted || analyticsQuery.isLoading || assistantsQuery.isLoading;
  const error = analyticsQuery.error || assistantsQuery.error;
  const setAssistants = useAssistantsStore((state) => state.setAssistants);
  const setCalls = useCallsStore((state) => state.setCalls);

  // Client-only mounting guard to prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

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

  // Show loading state during SSR hydration
  if (!mounted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassCard className="max-w-md p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GlassCard className="max-w-md p-8 text-center">
          <p className="text-destructive">{t('error')}</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        <FuturisticButton size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          {t('cta')}
        </FuturisticButton>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            key: 'total-calls',
            label: t('stats.totalCalls'),
            value: loading ? '…' : numberFormatter.format(overview?.totalCalls ?? 0),
            helper: t('statsHelpers.totalCalls'),
            icon: Phone,
            show: true,
          },
          {
            key: 'avg-duration',
            label: t('stats.avgDuration'),
            value: loading ? '…' : overview?.avgDuration ?? '—',
            helper: t('statsHelpers.avgDuration'),
            icon: Clock,
            show: true,
          },
          {
            key: 'success-rate',
            label: t('stats.successRate'),
            value: loading
              ? '…'
              : overview?.satisfaction != null
              ? `${Math.round((overview.satisfaction ?? 0) * 100)}%`
              : '—',
            helper: t('statsHelpers.successRate'),
            icon: TrendingUp,
            show: true,
          },
          {
            key: 'total-cost',
            label: t('stats.totalCost'),
            value:
              loading || overview?.totalCost == null
                ? overview?.totalCost == null && !loading
                  ? '—'
                  : '…'
                : currencyFormatter.format(overview.totalCost),
            helper: t('statsHelpers.totalCost'),
            icon: DollarSign,
            show: overview?.totalCost != null,
          },
        ]
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <GlassCard key={item.key} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                    <p className="text-3xl font-bold mt-2">{item.value}</p>
                    {item.helper ? <p className="text-xs text-muted-foreground mt-1">{item.helper}</p> : null}
                  </div>
                  <Icon className="h-8 w-8 text-primary" />
                </div>
              </GlassCard>
            );
          })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">{t('recent.title')}</h2>
          {loading ? (
            <p className="text-muted-foreground">{t('recent.loading')}</p>
          ) : calls.length === 0 ? (
            <p className="text-muted-foreground">{t('recent.empty')}</p>
          ) : (
            <div className="space-y-4">
              {calls.slice(0, 5).map((call: any) => (
                <div key={call.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium">{call.customerNumber || t('recent.unknownNumber')}</p>
                    <p className="text-sm text-muted-foreground">
                      {tStatus(call.status as string, { defaultMessage: call.status })} • {call.cost ? currencyFormatter.format(call.cost) : t('recent.free')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <FuturisticButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedCall(call)}
                      className="gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {t('recent.view')}
                    </FuturisticButton>
                    <FuturisticButton
                      size="sm"
                      variant="ghost"
                      onClick={() => emailMutation.mutate(call.id)}
                      disabled={emailMutation.isPending}
                      className="gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      {t('recent.send')}
                    </FuturisticButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">{t('assistants.title')}</h2>
          {loading ? (
            <p className="text-muted-foreground">{t('assistants.loading')}</p>
          ) : assistants.length === 0 ? (
            <p className="text-muted-foreground">{t('assistants.empty')}</p>
          ) : (
            <div className="space-y-4">
              {assistants.map((assistant: any) => (
                <div key={assistant.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{assistant.name}</p>
                    <p className="text-sm text-muted-foreground">{t('assistants.subtitle')}</p>
                  </div>
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Transcript Viewer Modal */}
      {selectedCall && (
        <CallTranscriptViewer
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
          onSendEmail={async (callId) => {
            await emailMutation.mutateAsync(callId);
          }}
        />
      )}
    </div>
  );
}
