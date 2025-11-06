import { expect, test } from "@playwright/test";

test.describe("Spam click resilience", () => {
  test("deduplicates rapid POST submissions", async ({ page }) => {
    let postCalls = 0;

    await page.route("**/api/test/spam", async (route, request) => {
      if (request.method() === "POST") {
        postCalls += 1;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
          headers: { "Content-Type": "application/json" },
        });
        return;
      }

      await route.fulfill({
        status: 200,
        body: JSON.stringify({ hits: postCalls }),
        headers: { "Content-Type": "application/json" },
      });
    });

    await page.goto("/en/test/resilience");
    const trigger = page.getByTestId("spam-trigger");

    await Promise.all(
      Array.from({ length: 20 }).map(async () => {
        await trigger.click();
      }),
    );

    await page.waitForTimeout(200);
    expect(postCalls).toBe(1);
  });
});
