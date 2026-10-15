// Every page loads directly, without errors, and fits a phone (rules T4, T5, T8)
import { ROUTES, expect, test } from "./support/fixtures";

// One check per page at desktop width
for (const route of ROUTES) {
  // Load it fresh, as if the address was typed in
  test(`loads ${route} directly with a clean console`, async ({ page }) => {
    // Open the page
    await page.goto(route);
    // Wait until the app has taken over the server-drawn page (a hydration mismatch logs an error here)
    await page.waitForLoadState("networkidle");
    // Something is on screen
    await expect(page.locator("main").first()).toBeVisible();
  });
}

// One check per page at phone width
for (const route of ROUTES) {
  // Nothing scrolls sideways at 375 pixels
  test(`fits a phone: ${route}`, async ({ page }) => {
    // A typical phone width
    await page.setViewportSize({ width: 375, height: 760 });
    // Open the page
    await page.goto(route);
    // Let it settle
    await page.waitForLoadState("networkidle");
    // The page is no wider than the screen
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    // No sideways scrolling
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
