'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Phone, CheckCircle, Mic } from 'lucide-react';

export default function TestCallPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'completed'>('idle');

  const handleTestCall = () => {
    setCallStatus('calling');
    // TODO: Trigger test call
    // Simulate call completion after 3 seconds
    setTimeout(() => {
      setCallStatus('completed');
    }, 3000);
  };

  const handleComplete = () => {
    // TODO: Mark onboarding as completed
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Test Your AI Receptionist</h1>
        <p className="text-muted-foreground">
          Make a quick test call to hear AVA in action!
        </p>
      </div>

      {/* Test Call Card */}
      <GlassCard className="p-12 text-center space-y-8">
        {callStatus === 'idle' && (
          <>
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/10">
              <Phone className="h-10 w-10 text-brand-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                Ready to test!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Click the button below to start a test call. You'll hear how AVA will greet your callers.
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Test Number: <strong>+1 (555) 123-4567</strong>
              </p>
              <Button size="lg" onClick={handleTestCall} className="gap-2">
                <Phone className="h-5 w-5" />
                Start Test Call
              </Button>
            </div>
          </>
        )}

        {callStatus === 'calling' && (
          <>
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/10 animate-pulse">
              <Mic className="h-10 w-10 text-brand-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                AVA is listening...
              </h2>
              <p className="text-muted-foreground">
                Try saying something! AVA will respond just like with a real caller.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </>
        )}

        {callStatus === 'completed' && (
          <>
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                Perfect! AVA is ready 🎉
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your AI receptionist is now configured and ready to handle calls. Let's go to your dashboard!
              </p>
            </div>

            {/* Call Transcript Preview */}
            <GlassCard className="p-6 text-left max-w-lg mx-auto">
              <h3 className="font-semibold mb-4">Call Transcript</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-brand-600">AVA:</span>{' '}
                  <span className="text-muted-foreground">
                    Hello! How can I help you today?
                  </span>
                </div>
                <div>
                  <span className="font-medium">You:</span>{' '}
                  <span className="text-muted-foreground">
                    I'd like to book an appointment.
                  </span>
                </div>
                <div>
                  <span className="font-medium text-brand-600">AVA:</span>{' '}
                  <span className="text-muted-foreground">
                    Of course! What day works best for you?
                  </span>
                </div>
              </div>
            </GlassCard>

            <Button size="lg" onClick={handleComplete} className="gap-2">
              Go to Dashboard
              <CheckCircle className="h-4 w-4" />
            </Button>
          </>
        )}
      </GlassCard>

      {/* Navigation */}
      {callStatus === 'idle' && (
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${locale}/onboarding/customize`)}
          >
            ← Back
          </Button>
          <Button variant="outline" onClick={handleComplete}>
            Skip Test
          </Button>
        </div>
      )}
    </div>
  );
}
