import { test, expect } from "@playwright/test";

test.describe("Spam click resilience", () => {
  test("rapid clicks trigger a single server mutation", async ({ page }) => {
    await page.goto("/en/test/resilience");

    const trigger = page.getByTestId("spam-trigger");
    await expect(trigger).toBeEnabled();

    await Promise.all(
      Array.from({ length: 20 }).map(async () => {
        await trigger.click();
      }),
    );

    await expect(trigger).toBeEnabled();

    const hitsText = page.locator("text=Server hits:");
    await expect(hitsText).toContainText("Server hits: 1");
  });
});
