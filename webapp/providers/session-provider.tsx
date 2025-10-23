"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { useEffect } from "react";

import { useSessionStore } from "@/stores/session-store";

type SessionProviderProps = React.PropsWithChildren<{
  session?: Session | null;
}>;

export function SessionProvider({ children, session }: SessionProviderProps) {
  const setSession = useSessionStore((state) => state.setSession);

  useEffect(() => {
    setSession(session ?? null);
  }, [session, setSession]);

  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
