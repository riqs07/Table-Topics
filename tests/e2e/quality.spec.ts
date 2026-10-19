// Quality checks from the 2026-10-19 UX review (decision 76): focus after a page change, no jumping while data loads, fonts kept lean, and a frame instead of a blank page
import { expect, test } from "./support/fixtures";

// Moving to another page puts focus on its main heading, as a fresh page load would
test("moves focus to the new page's heading after navigating", async ({ page }) => {
  // Open Practice
  await page.goto("/practice");
  // Let it settle
  await page.waitForLoadState("networkidle");
  // Go to Learn with the main navigation
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Learn" }).click();
  // Wait for Learn's heading
  await expect(page.getByRole("heading", { level: 1, name: "Learn" })).toBeVisible();
  // Focus lands on it
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe("H1");
});

// Learn used to shift by 0.37 as today's mission arrived late; now the page appears in one piece
test("keeps Learn still while it loads", async ({ page }) => {
  // Add up layout shifts from the start
  await page.addInitScript(() => {
    // The running total
    (window as unknown as { shift: number }).shift = 0;
    // Watch for shifts not caused by input
    new PerformanceObserver((list) => {
      // Each shift
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!entry.hadRecentInput) (window as unknown as { shift: number }).shift += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  // A phone-sized window
  await page.setViewportSize({ width: 390, height: 844 });
  // Open Learn
  await page.goto("/learn");
  // Wait for the mission to arrive
  await expect(page.getByText("Today’s mission")).toBeVisible();
  // Let any late shifts land
  await page.waitForTimeout(500);
  // Under the "good" line for layout shift
  expect(await page.evaluate(() => (window as unknown as { shift: number }).shift)).toBeLessThan(0.1);
});

// Only the fonts every page uses are fetched up front (two others are for the style page)
test("preloads only the two fonts the app uses", async ({ page }) => {
  // Open Today
  await page.goto("/");
  // Count font preloads
  const preloads = await page.locator('link[rel="preload"][as="font"]').count();
  // At most the two families in use (one file each)
  expect(preloads).toBeLessThanOrEqual(2);
});

// A page that reads its address shows its frame before the code arrives, not a blank screen
test("sends the recording page with a frame to show while it loads", async ({ request }) => {
  // The page as first sent
  const html = await (await request.get("/session?mode=talk&prompt=t001")).text();
  // The loading frame is in it
  expect(html).toContain("Loading");
});
