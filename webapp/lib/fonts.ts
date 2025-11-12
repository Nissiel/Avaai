import localFont from "next/font/local";

export const inter = localFont({
  src: [
    {
      path: "../public/fonts/Inter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: "Arial", // 🔥 DIVINE FIX: Reduce CLS with font fallback matching
});

export const jetbrains = localFont({
  src: [
    {
      path: "../public/fonts/JetBrainsMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-jetbrains",
  display: "swap",
  preload: true,
  fallback: ["Monaco", "Courier New", "monospace"],
  adjustFontFallback: false, // 🔥 DIVINE FIX: Disable auto-fallback for monospace fonts
});
