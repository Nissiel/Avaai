export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple passthrough layout - OnboardingWizard has its own stepper
  return (
    <div className="container max-w-7xl py-12">
      {children}
    </div>
  );
}
