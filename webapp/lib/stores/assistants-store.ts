import { create } from "zustand";

import type { AssistantSummary } from "@/lib/dto";

type AssistantState = {
  assistants: AssistantSummary[];
  setAssistants: (assistants: AssistantSummary[]) => void;
  upsertAssistant: (assistant: AssistantSummary) => void;
};

export const useAssistantsStore = create<AssistantState>((set) => ({
  assistants: [],
  setAssistants: (assistants) => set({ assistants }),
  upsertAssistant: (assistant) =>
    set((state) => {
      const existingIndex = state.assistants.findIndex((item) => item.id === assistant.id);
      if (existingIndex === -1) {
        return { assistants: [...state.assistants, assistant] };
      }
      const updated = [...state.assistants];
      updated[existingIndex] = { ...updated[existingIndex], ...assistant };
      return { assistants: updated };
    }),
}));
