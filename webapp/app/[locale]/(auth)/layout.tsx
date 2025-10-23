import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-background via-background to-brand-500/10 px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-background/95 p-10 shadow-elevated">
        {children}
      </div>
    </div>
  );
}
