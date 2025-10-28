import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSessionStore } from "@/lib/stores/session-store";

export interface OnboardingStep {
  id: string;
  number: number;
  title: string;
  description: string;
  optional: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "profile",
    number: 1,
    title: "Welcome",
    description: "Tell us about yourself",
    optional: false,
  },
  {
    id: "vapi",
    number: 2,
    title: "Vapi Configuration",
    description: "Enable voice assistants",
    optional: true,
  },
  {
    id: "twilio",
    number: 3,
    title: "Twilio Configuration",
    description: "Connect phone numbers",
    optional: true,
  },
  {
    id: "assistant",
    number: 4,
    title: "Create Assistant",
    description: "Your first AI assistant",
    optional: false,
  },
];

/**
 * Hook to manage onboarding flow state
 * Handles URL params, step navigation, and completion tracking
 */
export function useOnboardingState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSessionStore((state) => state.session);

  // Get current step from URL or default to 1
  const stepParam = searchParams?.get("step");
  const [currentStep, setCurrentStep] = useState<number>(
    stepParam ? parseInt(stepParam, 10) : 1
  );

  // Sync URL with state
  useEffect(() => {
    const urlStep = stepParam ? parseInt(stepParam, 10) : 1;
    if (urlStep !== currentStep) {
      setCurrentStep(urlStep);
    }
  }, [stepParam]);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    router.push(`/onboarding?step=${step}`, { scroll: false });
  };

  const nextStep = () => {
    const next = currentStep + 1;
    if (next <= ONBOARDING_STEPS.length) {
      goToStep(next);
    }
  };

  const previousStep = () => {
    const prev = currentStep - 1;
    if (prev >= 1) {
      goToStep(prev);
    }
  };

  const skipStep = async (stepId: string) => {
    // Mark step as skipped in backend
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          [`onboarding_${stepId}_skipped`]: true,
        }),
      });
    } catch (error) {
      console.error("Failed to mark step as skipped:", error);
    }

    nextStep();
  };

  const completeOnboarding = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          onboarding_completed: true,
        }),
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  const currentStepData = ONBOARDING_STEPS.find((s) => s.number === currentStep);

  return {
    currentStep,
    currentStepData,
    totalSteps: ONBOARDING_STEPS.length,
    goToStep,
    nextStep,
    previousStep,
    skipStep,
    completeOnboarding,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === ONBOARDING_STEPS.length,
  };
}
