'use client';

import { useRouter, useParams } from 'next/navigation';
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface OnboardingStepperProps {
  steps: Step[];
  current: number;
}

export function OnboardingStepper({ steps, current }: OnboardingStepperProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const handleStepClick = (stepId: string) => {
    // Navigate to the clicked step
    // @ts-ignore - Dynamic route navigation
    router.push(`/${locale}/onboarding/${stepId}`);
  };

  return (
    <ol className="flex flex-col gap-4">
      {steps.map((step, index) => {
        const isActive = index === current;
        const isCompleted = index < current;
        const isClickable = true; // Allow navigation to any step for flexibility
        
        return (
          <li
            key={step.id}
            onClick={() => handleStepClick(step.id)}
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
              isActive ? "border-brand-500 bg-brand-500/10" : "border-border/70 bg-background",
              isClickable && "cursor-pointer hover:border-brand-400 hover:bg-brand-500/5 hover:shadow-sm active:scale-[0.98]",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                isCompleted
                  ? "border-brand-500 bg-brand-500 text-white"
                  : isActive
                  ? "border-brand-500 text-brand-600"
                  : "border-border text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-[-0.01em]">{step.title}</p>
              {step.description ? <p className="text-xs text-muted-foreground">{step.description}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
