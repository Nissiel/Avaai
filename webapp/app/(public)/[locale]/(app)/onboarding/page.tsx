'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { CheckCircle } from 'lucide-react';

export default function OnboardingPage() {
  const t = useTranslations();
  const router = useRouter();

  const handleComplete = () => {
    // TODO: Mark onboarding as completed in backend
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <GlassCard className="max-w-2xl p-12 text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">
            Welcome to AVA! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Let's set up your AI receptionist in just a few steps.
          </p>
        </div>

        <div className="space-y-6 text-left">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Step 1: Phone Number</h3>
              <p className="text-sm text-muted-foreground">
                Configure your phone number to receive calls
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Step 2: Customize AVA</h3>
              <p className="text-sm text-muted-foreground">
                Set your assistant's voice, tone, and greeting message
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Step 3: Test Call</h3>
              <p className="text-sm text-muted-foreground">
                Make a test call to ensure everything works perfectly
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Skip for now
          </Button>
          <Button size="lg" onClick={handleComplete}>
            Start Setup
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
