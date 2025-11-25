import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const defaultLocale = process.env.AUTH_LOCALE ?? "en";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseLoginEmail = process.env.SUPABASE_E2E_EMAIL;
const supabaseLoginPassword = process.env.SUPABASE_E2E_PASSWORD;
const supabaseSignupEmail = process.env.SUPABASE_E2E_SIGNUP_EMAIL;
const supabaseSignupPassword = process.env.SUPABASE_E2E_SIGNUP_PASSWORD;

const canSupabaseLogin = !!(supabaseUrl && supabaseAnonKey && supabaseLoginEmail && supabaseLoginPassword);
const canSupabaseSignup = !!(supabaseUrl && supabaseAnonKey && supabaseSignupEmail && supabaseSignupPassword);

test.describe("Auth validation (UI)", () => {
  test("login form shows validation errors for empty and short password", async ({ page }) => {
    await page.goto(`/${defaultLocale}/login`);

    await page.getByRole("button", { name: /se connecter/i }).click();
    await expect(page.getByText("Email ou numéro de téléphone requis")).toBeVisible();

    await page.getByPlaceholder("email@exemple.com ou +33 6 12 34 56 78").fill("jean@example.com");
    await page.getByRole("button", { name: /se connecter/i }).click();
    await expect(page.getByText("Le mot de passe doit contenir au moins 8 caractères")).toBeVisible();
  });

  test("signup form rejects invalid email, weak password, mismatched confirmation, and unchecked terms", async ({ page }) => {
    await page.goto(`/${defaultLocale}/signup`);

    await page.getByPlaceholder("Jean Dupont").fill("Test User");
    await page.getByPlaceholder("jean.dupont@example.com").fill("not-an-email");
    await page.getByPlaceholder("+33612345678").fill("12345"); // invalid phone
    await page.getByPlaceholder("••••••••").first().fill("weakpass"); // missing uppercase/digit/special
    await page.getByPlaceholder("••••••••").nth(1).fill("different");

    await page.getByRole("button", { name: /créer mon compte/i }).click();

    // Stay on the signup page (no navigation)
    await expect(page).toHaveURL(new RegExp(`/${defaultLocale}/signup`));
    // Form remains visible (no redirect despite invalid input)
    await expect(page.getByRole("button", { name: /créer mon compte/i })).toBeVisible();
  });
});

test.describe("Auth happy-path (Supabase, optional)", () => {
  test.skip(!canSupabaseLogin, "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_E2E_EMAIL, SUPABASE_E2E_PASSWORD to run Supabase login test.");

  test("existing Supabase user can access protected page", async ({ page, context }) => {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: supabaseLoginEmail!,
      password: supabaseLoginPassword!,
    });
    if (error || !data.session) {
      throw new Error(`Supabase sign in failed: ${error?.message ?? "no session returned"}`);
    }

    // Inject tokens so middleware allows protected routes
    const cookies = [
      { name: "access_token", value: data.session.access_token, domain: "localhost", path: "/" },
      { name: "sb-access-token", value: data.session.access_token, domain: "localhost", path: "/" },
      { name: "access_token", value: data.session.access_token, domain: "127.0.0.1", path: "/" },
      { name: "sb-access-token", value: data.session.access_token, domain: "127.0.0.1", path: "/" },
    ];
    await context.addCookies(cookies);
    await page.goto(`/${defaultLocale}/dashboard`);

    await expect(page).not.toHaveURL(new RegExp(`/${defaultLocale}/login`));
  });

  test.skip(!canSupabaseSignup, "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_E2E_SIGNUP_EMAIL, SUPABASE_E2E_SIGNUP_PASSWORD to run Supabase signup test.");

  test("can create Supabase account via API (non-UI)", async () => {
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { error, data } = await supabase.auth.signUp({
      email: supabaseSignupEmail!,
      password: supabaseSignupPassword!,
      options: {
        data: { name: "Playwright Test User" },
      },
    });

    if (error && !/already/.test(error.message)) {
      throw new Error(`Supabase signup failed: ${error.message}`);
    }

    // If email confirmation is required, session may be null — that's acceptable for this check
    if (error) {
      expect(error.message.toLowerCase()).toContain("already");
    } else {
      expect(error).toBeNull();
    }
    expect(data.user?.email).toBeTruthy();
  });
});
