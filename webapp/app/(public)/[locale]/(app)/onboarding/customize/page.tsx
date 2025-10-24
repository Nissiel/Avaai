'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Volume2 } from 'lucide-react';

const TONES = [
  { id: 'warm', label: 'Warm & Friendly', description: 'Perfect for healthcare, hospitality' },
  { id: 'professional', label: 'Professional', description: 'Ideal for legal, consulting' },
  { id: 'energetic', label: 'Energetic & Dynamic', description: 'Great for sales, retail' },
];

export default function CustomizePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [formData, setFormData] = useState({
    name: 'AVA',
    tone: 'warm',
    greeting: 'Hello! How can I help you today?',
  });

  const handleContinue = () => {
    // TODO: Save customization
    router.push(`/${locale}/onboarding/test`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Personalize AVA</h1>
        <p className="text-muted-foreground">
          Customize your AI receptionist to match your brand and style.
        </p>
      </div>

      {/* Form */}
      <GlassCard className="p-8 space-y-8">
        {/* Assistant Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Assistant Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="AVA"
          />
          <p className="text-sm text-muted-foreground">
            This is how your assistant will introduce herself
          </p>
        </div>

        {/* Tone Selection */}
        <div className="space-y-4">
          <Label>Voice Tone</Label>
          <RadioGroup
            value={formData.tone}
            onValueChange={(value) => setFormData({ ...formData, tone: value })}
          >
            {TONES.map((tone) => (
              <div key={tone.id} className="flex items-center space-x-3">
                <RadioGroupItem value={tone.id} id={tone.id} />
                <Label htmlFor={tone.id} className="flex-1 cursor-pointer">
                  <div>
                    <div className="font-medium">{tone.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {tone.description}
                    </div>
                  </div>
                </Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    // TODO: Play voice sample
                  }}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Greeting Message */}
        <div className="space-y-2">
          <Label htmlFor="greeting">Greeting Message</Label>
          <Textarea
            id="greeting"
            value={formData.greeting}
            onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
            placeholder="Hello! How can I help you today?"
            rows={3}
          />
          <p className="text-sm text-muted-foreground">
            This is the first thing callers will hear
          </p>
        </div>
      </GlassCard>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/${locale}/onboarding/industry`)}
        >
          ← Back
        </Button>
        <Button size="lg" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
