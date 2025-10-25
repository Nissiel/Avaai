import { create } from "zustand";
import { persist } from "zustand/middleware";

type ContactAliasState = {
  aliases: Record<string, string>;
  setAlias: (phone: string, alias: string) => void;
  clearAlias: (phone: string) => void;
};

export const useContactAliasStore = create<ContactAliasState>()(
  persist(
    (set) => ({
      aliases: {},
      setAlias: (phone, alias) =>
        set((state) => {
          const next = { ...state.aliases };
          const normalizedAlias = alias.trim();
          if (normalizedAlias.length === 0) {
            delete next[phone];
          } else {
            next[phone] = normalizedAlias;
          }
          return { aliases: next };
        }),
      clearAlias: (phone) =>
        set((state) => {
          const next = { ...state.aliases };
          delete next[phone];
          return { aliases: next };
        }),
    }),
    {
      name: "ava-contact-aliases",
      version: 1,
    },
  ),
);

