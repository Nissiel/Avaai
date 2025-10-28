'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Zap, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createUSNumber } from '@/services/phone-numbers-service';
import { TwilioSetupDialog } from '@/components/features/onboarding/twilio-setup-dialog';
import { useOnboarding } from '@/lib/stores/onboarding-store';

export default function PhoneSetupPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [isCreatingNumber, setIsCreatingNumber] = useState(false);
  const [showTwilioDialog, setShowTwilioDialog] = useState(false);
  const { data, updatePhoneSetup } = useOnboarding();

  // TODO: Get real org_id from session/auth
  const TEMP_ORG_ID = 'temp-org-id';
  
  // Get assistant_id from onboarding store (created in customize step)
  // At this point in the flow (after customize), assistantId ALWAYS exists
  const assistantId = data.assistantId!;

  const handleCreateUSNumber = async () => {
    setIsCreatingNumber(true);
    try {
      const result = await createUSNumber(assistantId, TEMP_ORG_ID);
      updatePhoneSetup('vapi', result.phone.number);
      toast.success('✅ Phone number created!', {
        description: `Your number: ${result.phone.number}`,
      });
      router.push(`/${locale}/onboarding/test`);
    } catch (error: any) {
      console.error('Failed to create number:', error);
      toast.error('❌ Failed to create number', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsCreatingNumber(false);
    }
  };

  const handleTwilioSuccess = (phoneNumber: string) => {
    updatePhoneSetup('twilio', phoneNumber);
    toast.success('✅ Twilio number imported!');
    router.push(`/${locale}/onboarding/test`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Setup Your Phone Number</h1>
        <p className="text-muted-foreground">
          Choose how you want to receive calls. Don't worry, you can change this later.
        </p>
      </div>

      {/* Options */}
      <Tabs defaultValue="vapi" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vapi" className="gap-2">
            <Zap className="h-4 w-4" />
            Quick Setup (US only)
          </TabsTrigger>
          <TabsTrigger value="twilio" className="gap-2">
            <Settings className="h-4 w-4" />
            Custom Setup (All countries)
          </TabsTrigger>
        </TabsList>

        {/* Vapi Option - US Only */}
        <TabsContent value="vapi" className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Get a US Number (Free)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Perfect for getting started quickly. Vapi will assign you a free US phone number instantly.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Free forever (up to 10 numbers)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Setup in 1 click
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    US numbers only
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button
                size="lg"
                className="w-full"
                onClick={handleCreateUSNumber}
                disabled={isCreatingNumber}
              >
                {isCreatingNumber ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Number...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-4 w-4" />
                    Get My US Number
                  </>
                )}
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Twilio Option - All Countries */}
        <TabsContent value="twilio" className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Import Twilio Number</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  For France, Israel, or any other country. Buy a number on Twilio (~$1/month) and import it here.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Works in 100+ countries
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Local numbers available
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    Requires Twilio account (~$1/mo)
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => setShowTwilioDialog(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Setup with Twilio
              </Button>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/${locale}/onboarding/customize`)}
        >
          ← Back
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/onboarding/test`)}
        >
          Skip for now
        </Button>
      </div>

      {/* Twilio Setup Dialog */}
      <TwilioSetupDialog
        open={showTwilioDialog}
        onOpenChange={setShowTwilioDialog}
        onSuccess={handleTwilioSuccess}
        assistantId={assistantId}
        orgId={TEMP_ORG_ID}
      />
    </div>
  );
}
