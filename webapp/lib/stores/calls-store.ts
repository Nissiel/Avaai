import { create } from "zustand";

import type { CallSummary } from "@/lib/dto";

type CallsState = {
  calls: CallSummary[];
  setCalls: (calls: CallSummary[]) => void;
  upsertCall: (call: CallSummary) => void;
  prependCall: (call: CallSummary) => void;
  removeCall: (callId: string) => void;
};

export const useCallsStore = create<CallsState>((set) => ({
  calls: [],
  setCalls: (calls) => set({ calls }),
  upsertCall: (call) =>
    set((state) => {
      const existingIndex = state.calls.findIndex((item) => item.id === call.id);
      if (existingIndex === -1) {
        return { calls: [...state.calls, call] };
      }
      const updated = [...state.calls];
      updated[existingIndex] = { ...updated[existingIndex], ...call };
      return { calls: updated };
    }),
  prependCall: (call) =>
    set((state) => {
      const withoutDuplicate = state.calls.filter((item) => item.id !== call.id);
      return { calls: [call, ...withoutDuplicate] };
    }),
  removeCall: (callId) =>
    set((state) => ({
      calls: state.calls.filter((item) => item.id !== callId),
    })),
}));
