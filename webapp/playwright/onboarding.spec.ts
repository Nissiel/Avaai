import { test, expect } from "@playwright/test";

test.describe("Onboarding flow", () => {
  test("completes profile step", async ({ page }) => {
    await page.goto("/en/onboarding");

    await expect(page.getByText("Let's configure your Ava")).toBeVisible();
    await page.getByPlaceholder("Acme Corp").fill("Lex & Co. Law");
    await page.getByPlaceholder("team@acme.com").fill("team@lexandco.com");
    await page.getByText("Continue").click();
    await expect(page.getByText("Tone & voice preview")).toBeVisible();
  });
});
