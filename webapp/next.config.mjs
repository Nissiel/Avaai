import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");
const isPwaEnabled = process.env.NEXT_ENABLE_PWA === "true";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: !isPwaEnabled, // Par défaut OFF pour fiabiliser le build (NEXT_ENABLE_PWA=true pour activer)
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "avaai-fonts",
          expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/(cdn\.stripe\.com|js\.stripe\.com|api\.stripe\.com)\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "avaai-stripe",
          expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "avaai-images",
          expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 7 },
        },
      },
    ],
  },
});

// 🔥 DIVINE FIX: Removed unused CSP config (was commented out and causing warnings)
// Vercel handles security headers at edge level

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    typedRoutes: true,
    instrumentationHook: true,
    serverComponentsExternalPackages: ["@react-email/components"],
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion", "@dnd-kit/core", "@dnd-kit/sortable"],
  },
  eslint: {
    dirs: ["app", "components", "lib", "hooks", "providers", "features"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? true : false,
  },
};

// 🔥 DIVINE FIX: CSP headers removed
// These were commented out and causing console warnings about 'unsafe-eval'
// Vercel handles security headers at edge level, no need for Next.js config
// If needed in future, uncomment and configure properly

export default withNextIntl(withPWA(nextConfig));
