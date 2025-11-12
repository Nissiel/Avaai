import type { ReactNode } from "react";

import { Sidebar } from "@/components/layouts/sidebar";
import { TopBar } from "@/components/layouts/top-bar";
import { SessionManager } from "@/components/auth/session-manager";

// Force dynamic rendering for all app pages (next-intl requires it)
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AppLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export default function AppLayout({ children, params }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <SessionManager />
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
        </main>
        <footer className="border-t border-border/40 px-6 py-4">
          <div className="mx-auto w-full max-w-6xl flex items-center justify-between text-xs text-muted-foreground">
            <p>© 2025 Ava.ai · Your AI Secretary</p>
            <p>Made with ❤️ by the Ava team</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
