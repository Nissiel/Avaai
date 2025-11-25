import { defineConfig } from "@playwright/test";

const playwrightBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5556";

export default defineConfig({
  testDir: "playwright",
  use: {
    baseURL: playwrightBaseUrl,
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
  },
  // No webServer – assumes app is already running at PLAYWRIGHT_BASE_URL
});
