import { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <div className="bg-background">{children}</div>;
}
