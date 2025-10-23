import { create } from "zustand";

import type { TranscriptChunk } from "@/lib/dto";

type TranscriptState = {
  base: Record<string, string>;
  chunks: Record<string, TranscriptChunk[]>;
  setBase: (callId: string, transcript: string) => void;
  appendChunk: (callId: string, chunk: TranscriptChunk) => void;
  clear: (callId: string) => void;
};

export const useCallTranscriptsStore = create<TranscriptState>((set) => ({
  base: {},
  chunks: {},
  setBase: (callId, transcript) =>
    set((state) => ({
      base: { ...state.base, [callId]: transcript },
    })),
  appendChunk: (callId, chunk) =>
    set((state) => {
      const list = state.chunks[callId] ?? [];
      return {
        chunks: {
          ...state.chunks,
          [callId]: [...list, chunk],
        },
      };
    }),
  clear: (callId) =>
    set((state) => {
      const nextBase = { ...state.base };
      const nextChunks = { ...state.chunks };
      delete nextBase[callId];
      delete nextChunks[callId];
      return { base: nextBase, chunks: nextChunks };
    }),
}));
