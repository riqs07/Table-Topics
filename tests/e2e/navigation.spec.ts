// From every page, the main navigation reaches every section and marks the current one (rule T11, bug B5)
import { NAV_LINKS, NAV_PAGES, expect, test } from "./support/fixtures";

// One check per starting page
for (const start of NAV_PAGES) {
  // Every link works from here
  test(`navigation from ${start.path}`, async ({ page }) => {
    // Past the welcome, which has no tabs (decision 78)
    await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
    // Try each link in turn
    for (const link of NAV_LINKS) {
      // Load the starting page fresh
      await page.goto(start.path);
      // The main navigation
      const nav = page.getByRole("navigation", { name: "Main" });
      // The current section is marked, and only that one
      if (start.current) await expect(nav.locator('[aria-current="page"]')).toHaveText(start.current);
      // Follow the link (Settings is the gear in the title row, the rest are tabs)
      await (link.name === "Settings" ? page.locator("header").getByRole("link", { name: "Settings" }) : nav.getByRole("link", { name: link.name, exact: true })).click();
      // It leads to the right section
      await expect(page).toHaveURL((url) => url.pathname === link.path);
    }
  });
}

// Practising is focus mode: no tab bar, and the close button leads back to where the session belongs
test("a practice page hides the tab bar and closes back to its section", async ({ page }) => {
  // A prepared speech before recording
  await page.goto("/session?mode=response&prompt=p001");
  // Close it
  await page.getByRole("link", { name: "Close, back to Practice" }).click();
  // Back on Practice, where the tab bar is
  await expect(page).toHaveURL((url) => url.pathname === "/practice");
  // The tab bar is back
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
});
