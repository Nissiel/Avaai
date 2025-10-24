'use client';

import { useRouter, useParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Sparkles, Phone, Building2, Palette, TestTube2 } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const features = [
    {
      icon: Phone,
      title: 'Phone Setup',
      description: 'Configure your phone number in minutes',
    },
    {
      icon: Building2,
      title: 'Industry Preset',
      description: 'Get AI optimized for your business type',
    },
    {
      icon: Palette,
      title: 'Customize',
      description: 'Personalize voice, tone, and greeting',
    },
    {
      icon: TestTube2,
      title: 'Test Call',
      description: 'Try your AI receptionist instantly',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <GlassCard className="p-12 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600">
          <Sparkles className="h-8 w-8 text-white" />
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-4">
            Welcome to AVA! 👋
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Let's set up your AI receptionist in just <strong>5 minutes</strong>.
            You'll be receiving calls before you know it!
          </p>
        </div>
      </GlassCard>

      {/* Features Grid */}
      <GlassCard className="p-8">
        <h2 className="text-2xl font-semibold mb-6">What we'll set up together</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10">
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* CTA */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/dashboard`)}
        >
          Skip for now
        </Button>
        <Button
          size="lg"
          onClick={() => router.push(`/${locale}/onboarding/industry`)}
          className="gap-2"
        >
          Let's Start
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
