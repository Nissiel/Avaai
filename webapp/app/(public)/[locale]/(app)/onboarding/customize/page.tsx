'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Volume2, Loader2 } from 'lucide-react';
import { useOnboarding } from '@/lib/stores/onboarding-store';
import { createAssistant } from '@/services/assistants-service';
import { toast } from 'sonner';

// Map tone to Vapi voice configuration
const TONE_TO_VOICE: Record<string, { provider: string; voice_id: string }> = {
  warm: { provider: '11labs', voice_id: '21m00Tcm4TlvDq8ikWAM' },        // Rachel - warm female
  professional: { provider: '11labs', voice_id: 'pNInz6obpgDQGcFmaJgB' }, // Adam - professional male
  energetic: { provider: '11labs', voice_id: 'EXAVITQu4vr4xnSDxMaL' },    // Bella - energetic female
};

const TONES = [
  { id: 'warm', label: 'Warm & Friendly', description: 'Perfect for healthcare, hospitality' },
  { id: 'professional', label: 'Professional', description: 'Ideal for legal, consulting' },
  { id: 'energetic', label: 'Energetic & Dynamic', description: 'Great for sales, retail' },
];

export default function CustomizePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { data, updateCustomization, setAssistantId } = useOnboarding();
  
  const [formData, setFormData] = useState({
    name: data.customization.name,
    tone: data.customization.tone,
    greeting: data.customization.greeting,
    // NEW: Champs enrichis pour personnalisation maximale
    instructions: data.customization.instructions || '',
    businessContext: data.customization.businessContext || '',
    dos: data.customization.dos || '',
    donts: data.customization.donts || '',
    exampleConversation: data.customization.exampleConversation || '',
  });
  
  const [isCreating, setIsCreating] = useState(false);

  const handleContinue = async () => {
    try {
      setIsCreating(true);
      
      // Save customization to store
      updateCustomization(formData);
      
      // Get voice configuration based on tone
      const voice = TONE_TO_VOICE[formData.tone] || TONE_TO_VOICE.warm;
      
      // Get industry for metadata (if available)
      const industry = data.industry || 'general';
      
      // Build rich system prompt with all customization
      const systemPrompt = `
You are ${formData.name}, a professional AI receptionist.

BEHAVIOR INSTRUCTIONS:
${formData.instructions || 'Be professional, friendly, and helpful at all times.'}

BUSINESS CONTEXT:
${formData.businessContext || 'Provide general assistance to callers.'}

WHAT YOU SHOULD DO:
${formData.dos || '- Answer questions politely\n- Help callers with their requests\n- Be professional and courteous'}

WHAT YOU SHOULD NEVER DO:
${formData.donts || '- Give incorrect information\n- Be rude or dismissive\n- Guarantee things you cannot deliver'}

${formData.exampleConversation ? `EXAMPLE CONVERSATION:\n${formData.exampleConversation}` : ''}
`.trim();

      // Create the assistant in Vapi
      toast.info('✨ Creating your AI assistant...', {
        description: 'This will only take a moment.',
      });
      
      const assistant = await createAssistant({
        name: `${formData.name} - ${industry.replace('_', ' ')} Assistant`,
        voice_provider: voice.provider,
        voice_id: voice.voice_id,
        first_message: formData.greeting,
        model_provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 250,
        metadata: {
          industry,
          tone: formData.tone,
          created_via: 'onboarding',
          system_prompt: systemPrompt, // Store the rich prompt in metadata
        },
      });
      
      // Store the assistant ID
      setAssistantId(assistant.id);
      
      toast.success('🎉 Assistant created!', {
        description: `${formData.name} is ready to handle calls.`,
      });
      
      // Navigate to phone page (next step after customization)
      router.push(`/${locale}/onboarding/phone`);
      
    } catch (error: any) {
      console.error('Failed to create assistant:', error);
      toast.error('❌ Failed to create assistant', {
        description: error.message || 'Please try again or contact support.',
      });
    } finally {
      setIsCreating(false);
    }
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

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Advanced Personalization
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <Label htmlFor="instructions">Behavior Instructions</Label>
          <Textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="You are a professional and friendly receptionist. Always be polite, helpful, and efficient. Answer questions clearly and book appointments when needed."
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            Describe how your assistant should behave and interact with callers
          </p>
        </div>

        {/* Business Context */}
        <div className="space-y-2">
          <Label htmlFor="businessContext">Business Information</Label>
          <Textarea
            id="businessContext"
            value={formData.businessContext}
            onChange={(e) => setFormData({ ...formData, businessContext: e.target.value })}
            placeholder="We are a dental clinic located in downtown. We offer general dentistry, cosmetic treatments, and emergency services. Office hours: Monday-Friday 9am-6pm. Average consultation: $150."
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            Provide context about your business (services, hours, pricing, location, etc.)
          </p>
        </div>

        {/* Do's */}
        <div className="space-y-2">
          <Label htmlFor="dos">What TO DO ✅</Label>
          <Textarea
            id="dos"
            value={formData.dos}
            onChange={(e) => setFormData({ ...formData, dos: e.target.value })}
            placeholder="- Always ask for the caller's name and callback number&#10;- Offer to book appointments&#10;- Provide office hours when asked&#10;- Transfer urgent cases to the doctor"
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            List specific actions your assistant SHOULD take
          </p>
        </div>

        {/* Don'ts */}
        <div className="space-y-2">
          <Label htmlFor="donts">What NOT TO DO ❌</Label>
          <Textarea
            id="donts"
            value={formData.donts}
            onChange={(e) => setFormData({ ...formData, donts: e.target.value })}
            placeholder="- Never give medical advice&#10;- Don't discuss prices for procedures not listed&#10;- Never guarantee specific results&#10;- Don't schedule without checking availability"
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            List specific things your assistant should NEVER do
          </p>
        </div>

        {/* Example Conversation (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="exampleConversation">
            Example Conversation <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Textarea
            id="exampleConversation"
            value={formData.exampleConversation}
            onChange={(e) => setFormData({ ...formData, exampleConversation: e.target.value })}
            placeholder="Caller: Hi, I'd like to book a cleaning.&#10;Assistant: Of course! I'd be happy to help book your cleaning. May I have your name please?&#10;Caller: It's John Smith.&#10;Assistant: Thank you John! What day works best for you?"
            rows={5}
          />
          <p className="text-sm text-muted-foreground">
            Provide an example of your ideal conversation flow
          </p>
        </div>
      </GlassCard>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/${locale}/onboarding/industry`)}
          disabled={isCreating}
        >
          ← Back
        </Button>
        <Button 
          size="lg" 
          onClick={handleContinue}
          disabled={isCreating || !formData.name || !formData.greeting}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Assistant...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
}
