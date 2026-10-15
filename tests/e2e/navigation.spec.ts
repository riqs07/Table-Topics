// From every page, the main navigation reaches every section and marks the current one (rule T11, bug B5)
import { NAV_LINKS, NAV_PAGES, expect, test } from "./support/fixtures";

// One check per starting page
for (const start of NAV_PAGES) {
  // Every link works from here
  test(`navigation from ${start.path}`, async ({ page }) => {
    // Try each link in turn
    for (const link of NAV_LINKS) {
      // Load the starting page fresh
      await page.goto(start.path);
      // The main navigation
      const nav = page.getByRole("navigation", { name: "Main" });
      // The current section is marked, and only that one
      if (start.current) await expect(nav.locator('[aria-current="page"]')).toHaveText(start.current);
      // Follow the link
      await nav.getByRole("link", { name: link.name, exact: true }).click();
      // It leads to the right section
      await expect(page).toHaveURL((url) => url.pathname === link.path);
    }
  });
}
