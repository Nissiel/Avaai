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

interface DashboardStats {
  totalCalls: number;
  activeNow: number;
  avgDuration: string;
  satisfaction: string;
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats>({
    totalCalls: 0,
    activeNow: 0,
    avgDuration: '0:00',
    satisfaction: '0%',
  });

  const [assistants, setAssistants] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Load dashboard data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch assistants
      const response = await fetch('/api/vapi/assistants');
      const data = await response.json();
      
      if (data.success) {
        setAssistants(data.assistants || []);
      }

      // TODO: Fetch real stats from analytics API
      setStats({
        totalCalls: 142,
        activeNow: 3,
        avgDuration: '4:32',
        satisfaction: '98%',
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Appels totaux',
      value: stats.totalCalls,
      icon: Phone,
      color: 'primary',
      trend: '+12%',
    },
    {
      title: 'Appels actifs',
      value: stats.activeNow,
      icon: Users,
      color: 'success',
      trend: 'En temps réel',
    },
    {
      title: 'Durée moyenne',
      value: stats.avgDuration,
      icon: Clock,
      color: 'accent',
      trend: '+8s',
    },
    {
      title: 'Satisfaction',
      value: stats.satisfaction,
      icon: TrendingUp,
      color: 'secondary',
      trend: '+2%',
    },
  ];

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
                        ID: {assistant.id.substring(0, 8)}...
                      </p>
                    </div>
                    <FuturisticButton variant="secondary" size="sm">
                      Gérer
                    </FuturisticButton>
                  </div>
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
