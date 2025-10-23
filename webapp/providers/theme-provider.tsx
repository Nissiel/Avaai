"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";

type ThemeProviderProps = React.PropsWithChildren<{
  attribute?: string;
  defaultTheme?: "system" | "light" | "dark";
  enableSystem?: boolean;
}>;

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
}: ThemeProviderProps) {
  useEffect(() => {
    const documentElement = window.document.documentElement;
    const handler = (event: MediaQueryListEvent) => {
      if (event.matches) {
        documentElement.dataset.motion = "reduced";
      } else {
        delete documentElement.dataset.motion;
      }
    };
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      handler({ matches: true } as MediaQueryListEvent);
    }
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
