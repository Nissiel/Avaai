import { defineConfig } from "@playwright/test";

const playwrightPort = process.env.PLAYWRIGHT_PORT ?? "3002";
const playwrightBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${playwrightPort}`;
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "true";

export default defineConfig({
  testDir: "playwright",
  use: {
    baseURL: playwrightBaseUrl,
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
  },
  webServer: skipWebServer
    ? undefined
    : {
        // Allow overriding the dev command (pnpm not always available)
        command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? `PORT=${playwrightPort} npm run dev`,
        url: playwrightBaseUrl,
        reuseExistingServer: !process.env.CI,
      },
});
