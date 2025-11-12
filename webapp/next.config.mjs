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

const contentSecurityPolicy = `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.posthog.com https://*.sentry.io; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.unsplash.com https://*.stripe.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com https://*.posthog.com https://*.sentry.io https://*.twilio.com; media-src 'self' blob:; frame-src https://js.stripe.com https://hooks.stripe.com; worker-src 'self' blob:`;

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

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
  // headers: async () => [
  //   {
  //     source: "/(.*)",
  //     headers: securityHeaders,
  //   },
  // ],
};

export default withNextIntl(withPWA(nextConfig));
