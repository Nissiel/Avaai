'use client';

import { usePathname } from 'next/navigation';
import { OnboardingStepper } from '@/components/features/onboarding/stepper';

const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with AVA' },
  { id: 'phone', title: 'Phone Setup', description: 'Configure your phone number' },
  { id: 'industry', title: 'Industry', description: 'Select your business type' },
  { id: 'customize', title: 'Customize', description: 'Personalize AVA' },
  { id: 'test', title: 'Test Call', description: 'Try your AI receptionist' },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Get current step index from pathname
  const currentStepId = pathname?.split('/').pop() || 'welcome';
  const currentStep = ONBOARDING_STEPS.findIndex(step => step.id === currentStepId);

  return (
    <div className="container max-w-7xl py-12">
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Sidebar with stepper */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <h2 className="mb-6 text-2xl font-bold">Setup AVA</h2>
            <OnboardingStepper 
              steps={ONBOARDING_STEPS} 
              current={currentStep >= 0 ? currentStep : 0} 
            />
          </div>
        </aside>

        {/* Main content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
