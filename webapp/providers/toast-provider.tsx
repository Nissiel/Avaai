"use client";

import { Toaster } from "@/components/ui/sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      visibleToasts={3}
      toastOptions={{
        classNames: {
          toast: "rounded-2xl shadow-elevated border border-border bg-background/95 backdrop-blur-sm",
        },
      }}
    />
  );
}
