"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useOnboardingState, ONBOARDING_STEPS } from "@/lib/hooks/use-onboarding-state";
import { useIntegrationsStatus } from "@/lib/hooks/use-integrations-status";
import { OnboardingVapiStep } from "./onboarding-vapi-step";
import { OnboardingTwilioStep } from "./onboarding-twilio-step";
import { OnboardingAssistantStep } from "./onboarding-assistant-step";

export function OnboardingFlow() {
  const searchParams = useSearchParams();
  const {
    currentStep,
    currentStepData,
    totalSteps,
    nextStep,
    previousStep,
    skipStep,
    completeOnboarding,
  } = useOnboardingState();

  const { vapi, twilio, refetch } = useIntegrationsStatus();

  // Check if returning from settings
  const returnTo = searchParams?.get("returnTo");
  useEffect(() => {
    if (returnTo === "settings") {
      // Refetch integrations status when returning from settings
      refetch();
    }
  }, [returnTo, refetch]);

  // Auto-advance if integrations are configured
  useEffect(() => {
    if (currentStep === 2 && vapi.configured) {
      nextStep();
    } else if (currentStep === 3 && twilio.configured) {
      nextStep();
    }
  }, [currentStep, vapi.configured, twilio.configured]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        // Profile step (existing onboarding wizard handles this)
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center space-y-6"
          >
            <h2 className="text-3xl font-bold text-white">Welcome to AVA! 🎉</h2>
            <p className="text-gray-400">Let's get you started</p>
            <button
              onClick={nextStep}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
            >
              Continue →
            </button>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="vapi"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <OnboardingVapiStep
              onNext={nextStep}
              onSkip={() => skipStep("vapi")}
            />
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="twilio"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <OnboardingTwilioStep
              onNext={nextStep}
              onSkip={() => skipStep("twilio")}
            />
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="assistant"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <OnboardingAssistantStep
              onComplete={completeOnboarding}
              onBack={() => previousStep()}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-white/5 h-1">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Header with Steps */}
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          {ONBOARDING_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center",
                index < ONBOARDING_STEPS.length - 1 && "flex-1"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  currentStep === step.number
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-110"
                    : currentStep > step.number
                    ? "bg-green-500/20 text-green-400 border border-green-500"
                    : "bg-white/10 text-gray-500"
                )}
              >
                {currentStep > step.number ? "✓" : step.number}
              </div>
              {index < ONBOARDING_STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all",
                    currentStep > step.number ? "bg-green-500" : "bg-white/10"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Step {currentStep} of {totalSteps}:{" "}
            <span className="text-white font-medium">
              {currentStepData?.title}
            </span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
      </div>

      {/* Back Button */}
      {currentStep > 1 && currentStep < 4 && (
        <div className="w-full max-w-4xl mx-auto px-4 pb-8">
          <button
            onClick={previousStep}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
