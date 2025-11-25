import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { AvaSession } from "@/lib/auth/session-client";

type SessionState = {
  session: AvaSession | null;
  setSession: (session: AvaSession | null) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
    }),
    {
      name: "ava-session-store",
      // Only persist the session, not the setter
      partialize: (state) => ({ session: state.session }),
    }
  )
);
