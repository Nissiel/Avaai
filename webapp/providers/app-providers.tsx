"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { PostHogProvider } from "@/providers/posthog-provider";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { RealtimeProvider } from "@/providers/realtime-provider";
import { SessionProvider } from "@/providers/session-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";

interface AppProvidersProps {
  children: React.ReactNode;
  session?: any;
}

export function AppProviders({ children, session }: AppProvidersProps) {
  return (
    <PostHogProvider>
      <SessionProvider session={session}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider delayDuration={120}>
            <ReactQueryProvider>
              <RealtimeProvider>
                {children}
                <ToastProvider />
              </RealtimeProvider>
            </ReactQueryProvider>
          </TooltipProvider>
        </ThemeProvider>
      </SessionProvider>
    </PostHogProvider>
  );
}
