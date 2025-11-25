import { test, expect } from "@playwright/test";

const supabaseEnabled =
  process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH === "true" || process.env.PLAYWRIGHT_SUPABASE === "true";
const supabaseEmail = process.env.SUPABASE_E2E_EMAIL;
const supabasePassword = process.env.SUPABASE_E2E_PASSWORD;

test.describe("public/protected routing", () => {
  test("redirects anonymous user from protected route to login", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/login/);
  });
});

test.describe("supabase auth (opt-in)", () => {
  test.skip(
    !supabaseEnabled || !supabaseEmail || !supabasePassword,
    "Set NEXT_PUBLIC_ENABLE_SUPABASE_AUTH=true and SUPABASE_E2E_EMAIL/SUPABASE_E2E_PASSWORD to run Supabase auth tests."
  );

  test("can sign in with Supabase credentials and reach a protected page", async ({ page }) => {
    test.slow();

    // Clean state
    await page.context().clearCookies();
    await page.goto("/en/login");

    // Wait for login form to render (placeholder is locale-specific but contains "email@")
    const emailInput = page.getByPlaceholder("email@exemple.com ou +33 6 12 34 56 78");
    const passwordInput = page.getByPlaceholder("••••••••••••");

    await emailInput.waitFor({ timeout: 45_000 });
    await emailInput.fill(supabaseEmail!);
    await passwordInput.fill(supabasePassword!);
    await page.getByRole("button", { name: /se connecter/i }).click();

    await page.waitForURL(/\/(en|fr|he)\/(dashboard|onboarding)/, { timeout: 30_000 });

    // Token persisted client-side
    await expect.poll(async () => page.evaluate(() => localStorage.getItem("access_token")), {
      message: "access_token should be stored after login",
    }).not.toBeNull();

    // Backend acknowledges the token
    const me = await page.request.get("/api/auth/me");
    expect(me.ok()).toBe(true);
    const body = await me.json();
    expect(body.email).toBeTruthy();
  });
});
