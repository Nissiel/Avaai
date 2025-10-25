import { create } from "zustand";

import type { AvaSession } from "@/lib/auth/session-client";

type SessionState = {
  session: AvaSession | null;
  setSession: (session: AvaSession | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
}));
