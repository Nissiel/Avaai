import "./globals.css";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.ava.ai"),
  title: {
    default: "Ava.ai · Your AI Secretary, truly useful",
    template: "%s · Ava.ai",
  },
  description:
    "Design, launch, and operate your AI-powered voice and inbox assistant with premium UX, realtime insights, and enterprise guardrails.",
  keywords: [
    "Ava.ai",
    "AI secretary",
    "voice assistant",
    "Twilio",
    "call center automation",
    "customer experience",
  ],
  authors: [{ name: "Ava.ai" }],
  creator: "Ava.ai",
  publisher: "Ava.ai",
  openGraph: {
    title: "Ava.ai · Your AI Secretary, truly useful",
    description:
      "Launch a multi-channel AI secretary in minutes with Ava Studio, premium UX, and guardrails.",
    type: "website",
    locale: "en_US",
    siteName: "Ava.ai",
    url: "https://app.ava.ai",
    images: [
      {
        url: "/og/avaai.png",
        width: 1200,
        height: 630,
        alt: "Ava.ai Assistant preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ava.ai · Your AI Secretary, truly useful",
    description:
      "The premium way to operate an AI assistant across voice, email, and chat with guardrails built-in.",
    creator: "@avaai",
    site: "@avaai",
    images: ["/og/avaai.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico" }],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  category: "productivity",
};

export const viewport: Viewport = {
  maximumScale: 1,
  initialScale: 1,
  width: "device-width",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
