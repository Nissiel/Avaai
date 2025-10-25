/**
 * ============================================================================
 * AVA DASHBOARD - Divine Control Center (i18n enabled)
 * ============================================================================
 * Real-time analytics, call management, and AVA configuration
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { Phone, Clock, Settings, Plus, MessageSquare, Mail, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { GlassCard } from '@/components/ui/glass-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CallTranscriptViewer } from '@/components/app/call-transcript-viewer';
import { toast } from 'sonner';

import { getAnalyticsOverview } from '@/lib/api/analytics';
import { listAssistants, type AssistantsResult } from '@/lib/api/assistants';
import { sendCallTranscriptEmail } from '@/lib/api/calls';
import type { DashboardAnalytics } from '@/lib/dto';
import { useAssistantsStore } from '@/lib/stores/assistants-store';
import { useCallsStore } from '@/lib/stores/calls-store';
import type { Locale as SupportedLocale } from '@/lib/i18n/locales';
import { formatDuration } from '@/lib/formatters/duration';
import { humanizeIdentifier } from '@/lib/formatters/name';
import { useContactAliasStore } from '@/lib/stores/contact-alias-store';

const CURRENCY_BY_LOCALE: Record<SupportedLocale, string> = {
  en: 'USD',
  fr: 'EUR',
  he: 'ILS',
};

export default function DashboardPage() {
  const t = useTranslations('dashboardPage');
  const tStatus = useTranslations('callsPage.status');
  const tAssistants = useTranslations('dashboardPage.assistants');
  const locale = useLocale() as SupportedLocale;
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
  const aliases = useContactAliasStore((state) => state.aliases);

  const analyticsQuery = useQuery<DashboardAnalytics>({
    queryKey: ['dashboard', 'analytics'],
    queryFn: getAnalyticsOverview,
    staleTime: 60_000,
    enabled: mounted, // Only fetch after mount
  });

  const assistantsQuery = useQuery<AssistantsResult>({
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
  const assistantsResult = assistantsQuery.data ?? { assistants: [], warning: undefined, configured: undefined };
  const assistants = assistantsResult.assistants ?? [];
  const assistantsWarning = assistantsResult.warning;
  const loading = !mounted || analyticsQuery.isLoading || assistantsQuery.isLoading;
  const error = analyticsQuery.error || assistantsQuery.error;
  const setAssistants = useAssistantsStore((state) => state.setAssistants);
  const setCalls = useCallsStore((state) => state.setCalls);

  const assistantsWarningMessage = React.useMemo(() => {
    if (!assistantsWarning) return null;
    switch (assistantsWarning.code) {
      case 'NOT_CONFIGURED':
        return tAssistants('alerts.notConfigured');
      case 'PARSE_FAILED':
        return tAssistants('alerts.parseFailed');
      case 'EMPTY_RESPONSE':
        return tAssistants('alerts.empty');
      case 'FETCH_FAILED':
      default:
        return tAssistants('alerts.fetchFailed');
    }
  }, [assistantsWarning, tAssistants]);

  const assistantsWarningDescription =
    assistantsWarning?.message && assistantsWarning.message !== assistantsWarningMessage
      ? assistantsWarning.message
      : undefined;

  const lastAssistantsWarning = React.useRef<string | null>(null);

  // Client-only mounting guard to prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setAssistants(assistants);
  }, [assistants, setAssistants]);

  React.useEffect(() => {
    if (!assistantsWarningMessage) {
      lastAssistantsWarning.current = null;
      return;
    }

    if (lastAssistantsWarning.current === assistantsWarningMessage) {
      return;
    }

    lastAssistantsWarning.current = assistantsWarningMessage;
    toast.error(
      assistantsWarningMessage,
      assistantsWarningDescription ? { description: assistantsWarningDescription } : undefined,
    );
  }, [assistantsWarningDescription, assistantsWarningMessage]);

  React.useEffect(() => {
    setCalls(calls);
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
        <Link href={`/${locale}/app/assistants`.replace(/\/{2,}/g, '/') as any}>
          <FuturisticButton
            size="lg"
            variant="primary"
            glow
            className="relative overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary hover:to-primary shadow-lg shadow-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/60 hover:scale-105 px-8"
          >
            <span className="relative z-10 font-bold tracking-wider text-base">
              Launch Studio
            </span>
          </FuturisticButton>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            value: loading ? '…' : formatDuration(overview?.avgDurationSeconds, locale),
            helper: t('statsHelpers.avgDuration'),
            icon: Clock,
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
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                    <p className="text-3xl font-bold mt-2">{item.value}</p>
                  </div>
                  {item.key !== 'total-cost' && <Icon className="h-8 w-8 text-primary" />}
                </div>
              </GlassCard>
            );
          })}
      </div>

      {/* Recent Activity */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">{t('recent.title')}</h2>
        {loading ? (
          <p className="text-muted-foreground">{t('recent.loading')}</p>
        ) : calls.length === 0 ? (
          <p className="text-muted-foreground">{t('recent.empty')}</p>
        ) : (
          <div className="space-y-4">
            {calls.slice(0, 5).map((call: any) => {
              const phoneNumber: string = call.customerNumber || '';
              const alias = phoneNumber ? aliases[phoneNumber] : undefined;
              const normalizedPhone = phoneNumber ? humanizeIdentifier(phoneNumber) : '';
              const displayName = alias?.trim().length
                ? humanizeIdentifier(alias)
                : normalizedPhone || t('recent.unknownNumber');
              const phoneLabel = alias?.trim().length ? phoneNumber : null;
              const durationLabel =
                typeof call.durationSeconds === 'number'
                  ? formatDuration(call.durationSeconds, locale)
                  : null;

              let costLabel: string | null = null;
              if (typeof call.cost === 'number') {
                costLabel = call.cost === 0 ? t('recent.free') : currencyFormatter.format(call.cost);
              }

              const metadata = [
                tStatus(call.status as string, { defaultMessage: call.status }),
                durationLabel,
                costLabel,
              ]
                .filter(Boolean)
                .join(' • ');

              return (
                <div key={call.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{displayName}</p>
                    {phoneLabel ? (
                      <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground/70">
                        {phoneLabel}
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground">{metadata}</p>
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
              );
            })}
          </div>
        )}
      </GlassCard>

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
