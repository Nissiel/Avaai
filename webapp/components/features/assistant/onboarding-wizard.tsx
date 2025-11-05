/**
 * ============================================================================
 * AVA ONBOARDING WIZARD - Divine 3-Step Setup
 * ============================================================================
 * Ultra-simple wizard: Connect → Configure → Activate
 * State persisted, smooth animations, crystal clear UX
 * ============================================================================
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Check, Phone, Sparkles, Rocket, ArrowRight, ArrowLeft } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VOICE_PRESETS, PROMPT_TEMPLATES } from '@/lib/vapi/client';
import { toast } from 'sonner';
import { createAssistant } from '@/lib/api/assistants';

type OnboardingStep = 'connect' | 'configure' | 'activate';

interface OnboardingState {
  // Step 1: Connect
  phoneNumber: string;

  // Step 2: Configure
  name: string;
  voice: string;
  personality: string;
  instructions: string;

  // Step 3: Activate
  assistantId?: string;
  status: 'idle' | 'creating' | 'ready' | 'error';
}

export function AvaOnboardingWizard() {
  const [currentStep, setCurrentStep] = React.useState<OnboardingStep>('connect');
  const [state, setState] = React.useState<OnboardingState>({
    phoneNumber: '',
    name: '',
    voice: 'jennifer-playht',
    personality: 'secretary',
    instructions: '',
    status: 'idle',
  });

  // Load saved state from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('ava-onboarding-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (e) {
        console.error('Failed to load saved state');
      }
    }
  }, []);

  // Save state to localStorage
  React.useEffect(() => {
    localStorage.setItem('ava-onboarding-state', JSON.stringify(state));
  }, [state]);

  const steps: { id: OnboardingStep; title: string; icon: any }[] = [
    { id: 'connect', title: 'Connect', icon: Phone },
    { id: 'configure', title: 'Configure', icon: Sparkles },
    { id: 'activate', title: 'Activate', icon: Rocket },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const canProceed = React.useMemo(() => {
    switch (currentStep) {
      case 'connect':
        return state.phoneNumber.length > 0;
      case 'configure':
        return state.name.length > 0 && state.instructions.length > 0;
      case 'activate':
        return state.status === 'ready';
      default:
        return false;
    }
  }, [currentStep, state]);

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        name: state.name,
        voice: state.voice,
        instructions: state.instructions,
        firstMessage: "Bonjour ! Je suis AVA, votre assistante vocale. Comment puis-je vous aider aujourd'hui?",
      };

      if (state.phoneNumber) {
        payload.phoneNumber = state.phoneNumber;
      }

      return createAssistant(payload);
    },
    onMutate: () => {
      setState({ ...state, status: 'creating' });
    },
    onSuccess: (assistant) => {
      setState({
        ...state,
        assistantId: assistant.id,
        status: 'ready',
      });
      toast.success('🎉 AVA créée avec succès !');
    },
    onError: (error: Error) => {
      console.error('Failed to create assistant:', error);
      setState({ ...state, status: 'error' });
      toast.error('Erreur: ' + error.message);
    },
  });

  const handleCreateAssistant = () => {
    createMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-animated p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Créez votre AVA
          </h1>
          <p className="text-muted-foreground text-lg">
            En 3 étapes simples, votre assistante vocale sera prête
          </p>
        </motion.div>

        {/* Progress Steps */}
        <GlassCard className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = index < currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`
                        flex h-12 w-12 items-center justify-center rounded-full
                        transition-all duration-300
                        ${isCompleted
                          ? 'bg-success text-success-foreground'
                          : isActive
                            ? 'gradient-primary text-primary-foreground glow'
                            : 'glass text-muted-foreground'
                        }
                      `}
                      whileHover={{ scale: 1.1 }}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </motion.div>
                    <p
                      className={`
                        mt-2 text-sm font-medium
                        ${isActive ? 'text-foreground' : 'text-muted-foreground'}
                      `}
                    >
                      {step.title}
                    </p>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`
                        h-1 flex-1 mx-4 rounded-full transition-all duration-300
                        ${index < currentStepIndex
                          ? 'bg-success'
                          : 'bg-border'
                        }
                      `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </GlassCard>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard gradientBorder glow>
              {/* STEP 1: CONNECT */}
              {currentStep === 'connect' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      📞 Connectez votre numéro
                    </h2>
                    <p className="text-muted-foreground">
                      Entrez le numéro de téléphone sur lequel AVA répondra aux appels
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phone">Numéro de téléphone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+33 1 23 45 67 89"
                        value={state.phoneNumber}
                        onChange={(e) =>
                          setState({ ...state, phoneNumber: e.target.value })
                        }
                        className="glass mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Format international recommandé (ex: +33 pour la France)
                      </p>
                    </div>

                    <div className="glass p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">💡 Astuce</p>
                      <p className="text-sm text-muted-foreground">
                        Vous pouvez utiliser un numéro Twilio. Si vous n'en avez pas encore,
                        nous vous aiderons à en obtenir un.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: CONFIGURE */}
              {currentStep === 'configure' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      ✨ Configurez AVA
                    </h2>
                    <p className="text-muted-foreground">
                      Personnalisez la voix et la personnalité de votre assistante
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom de votre AVA</Label>
                      <Input
                        id="name"
                        placeholder="AVA Réception"
                        value={state.name}
                        onChange={(e) => setState({ ...state, name: e.target.value })}
                        className="glass mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="voice">Voix</Label>
                      <Select
                        value={state.voice}
                        onValueChange={(value) => setState({ ...state, voice: value })}
                      >
                        <SelectTrigger className="glass mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(VOICE_PRESETS.playht).map(([key, voice]) => (
                            <SelectItem key={key} value={voice.voiceId}>
                              {voice.name} - {voice.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="personality">Personnalité</Label>
                      <Select
                        value={state.personality}
                        onValueChange={(value) => {
                          setState({
                            ...state,
                            personality: value,
                            instructions:
                              PROMPT_TEMPLATES[value as keyof typeof PROMPT_TEMPLATES] || '',
                          });
                        }}
                      >
                        <SelectTrigger className="glass mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="secretary">🗂️ Secrétaire</SelectItem>
                          <SelectItem value="sales">📈 Commercial</SelectItem>
                          <SelectItem value="support">💬 Support Client</SelectItem>
                          <SelectItem value="custom">⚙️ Personnalisé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="instructions">Instructions personnalisées</Label>
                      <Textarea
                        id="instructions"
                        placeholder="Décrivez comment AVA doit se comporter..."
                        value={state.instructions}
                        onChange={(e) =>
                          setState({ ...state, instructions: e.target.value })
                        }
                        className="glass mt-2 min-h-[120px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: ACTIVATE */}
              {currentStep === 'activate' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">
                      🚀 Activez AVA
                    </h2>
                    <p className="text-muted-foreground">
                      Un clic et votre assistante vocale sera opérationnelle !
                    </p>
                  </div>

                  {state.status === 'idle' && (
                    <div className="space-y-4">
                      <div className="glass p-6 rounded-lg space-y-3">
                        <p className="font-medium">📋 Récapitulatif</p>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-muted-foreground">Numéro:</span>{' '}
                            <span className="font-medium">{state.phoneNumber}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Nom:</span>{' '}
                            <span className="font-medium">{state.name}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Personnalité:</span>{' '}
                            <span className="font-medium capitalize">{state.personality}</span>
                          </p>
                        </div>
                      </div>

                      <FuturisticButton
                        variant="primary"
                        size="lg"
                        fullWidth
                        glow
                        onClick={handleCreateAssistant}
                        icon={<Rocket className="h-5 w-5" />}
                      >
                        Créer mon AVA
                      </FuturisticButton>
                    </div>
                  )}

                  {state.status === 'creating' && (
                    <div className="text-center py-12">
                      <motion.div
                        className="inline-block"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="h-16 w-16 text-primary" />
                      </motion.div>
                      <p className="mt-4 text-lg font-medium">Création en cours...</p>
                      <p className="text-muted-foreground">
                        Configuration de votre assistante vocale
                      </p>
                    </div>
                  )}

                  {state.status === 'ready' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-success/20 mb-4">
                        <Check className="h-12 w-12 text-success" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">🎉 AVA est prête !</h3>
                      <p className="text-muted-foreground mb-6">
                        Votre assistante vocale est maintenant active
                      </p>
                      <FuturisticButton
                        variant="primary"
                        size="lg"
                        onClick={() => (window.location.href = '/dashboard')}
                        icon={<ArrowRight className="h-5 w-5" />}
                      >
                        Aller au Dashboard
                      </FuturisticButton>
                    </motion.div>
                  )}

                  {state.status === 'error' && (
                    <div className="text-center py-12">
                      <p className="text-destructive font-medium mb-4">
                        ❌ Une erreur est survenue
                      </p>
                      <FuturisticButton
                        variant="primary"
                        onClick={() => setState({ ...state, status: 'idle' })}
                      >
                        Réessayer
                      </FuturisticButton>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              {state.status !== 'ready' && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <FuturisticButton
                    variant="ghost"
                    onClick={goToPreviousStep}
                    disabled={currentStepIndex === 0}
                    icon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Précédent
                  </FuturisticButton>

                  {currentStep !== 'activate' && (
                    <FuturisticButton
                      variant="primary"
                      onClick={goToNextStep}
                      disabled={!canProceed}
                      icon={<ArrowRight className="h-4 w-4" />}
                    >
                      Suivant
                    </FuturisticButton>
                  )}
                </div>
              )}
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
