/**
 * Twilio Setup Dialog
 * 
 * Modal for importing a Twilio phone number into Vapi.
 * Includes real-time validation and helpful guidance.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { verifyTwilioCredentials, importTwilioNumber } from '@/services/phone-numbers-service';

interface TwilioSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (phoneNumber: string) => void;
  assistantId: string;
  orgId: string;
}

export function TwilioSetupDialog({
  open,
  onOpenChange,
  onSuccess,
  assistantId,
  orgId,
}: TwilioSetupDialogProps) {
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const handleVerify = async () => {
    if (!accountSid || !authToken || !phoneNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('idle');

    try {
      const result = await verifyTwilioCredentials(accountSid, authToken, phoneNumber);

      if (result.valid) {
        setVerificationStatus('valid');
        toast.success(`✅ Verified! Number: ${result.number} (${result.country})`);
      } else {
        setVerificationStatus('invalid');
        toast.error(`❌ ${result.error ?? 'Invalid credentials or number not found'}`);
      }
    } catch (error) {
      setVerificationStatus('invalid');
      toast.error('Failed to verify credentials. Please check and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleImport = async () => {
    if (verificationStatus !== 'valid') {
      toast.error('Please verify your credentials first');
      return;
    }

    setIsImporting(true);

    try {
      const result = await importTwilioNumber(
        accountSid,
        authToken,
        phoneNumber,
        assistantId,
        orgId
      );

      toast.success(`🎉 ${result.message}`);
      onSuccess(result.phone.number);
      onOpenChange(false);
      
      // Reset form
      setAccountSid('');
      setAuthToken('');
      setPhoneNumber('');
      setVerificationStatus('idle');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import number';
      toast.error(`❌ ${message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Twilio Number</DialogTitle>
          <DialogDescription>
            Connect your Twilio phone number to use with AVA. You'll need your Twilio credentials.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Help Link */}
          <div className="rounded-lg bg-blue-500/10 p-3 text-sm">
            <p className="text-blue-700 dark:text-blue-400">
              Don't have a Twilio number yet?{' '}
              <a
                href="https://www.twilio.com/console/phone-numbers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline hover:no-underline"
              >
                Buy one here
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountSid">Account SID</Label>
              <Input
                id="accountSid"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                disabled={isVerifying || isImporting}
              />
              <p className="text-xs text-muted-foreground">
                Found in your{' '}
                <a
                  href="https://console.twilio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  Twilio Console
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="authToken">Auth Token</Label>
              <Input
                id="authToken"
                type="password"
                placeholder="********************************"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                disabled={isVerifying || isImporting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                placeholder="+33612345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isVerifying || isImporting}
              />
              <p className="text-xs text-muted-foreground">
                Format: E.164 (+country code + number, no spaces)
              </p>
            </div>

            {/* Verification Status */}
            {verificationStatus !== 'idle' && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  verificationStatus === 'valid'
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'bg-red-500/10 text-red-700 dark:text-red-400'
                }`}
              >
                {verificationStatus === 'valid' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Credentials verified! Ready to import.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>Verification failed. Please check your credentials.</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isVerifying || isImporting}
          >
            Cancel
          </Button>
          
          {verificationStatus !== 'valid' ? (
            <Button
              onClick={handleVerify}
              disabled={isVerifying || !accountSid || !authToken || !phoneNumber}
            >
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify Credentials
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import Number
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
