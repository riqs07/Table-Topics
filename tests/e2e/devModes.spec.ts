// The page listing every mode, for development (decision 132), in the released build: Settings hides its link until it is switched on from the page itself
import { expect, test } from "./support/fixtures";

// Hidden from Settings, then shown once switched on
test("All modes: hidden in Settings until switched on from the page", async ({ page }) => {
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // Settings in the released build
  await page.goto("/settings");
  // Its last group is drawn
  await expect(page.getByRole("heading", { name: "Appearance" })).toBeVisible();
  // No link to the page
  await expect(page.getByRole("link", { name: /All modes/ })).toHaveCount(0);
  // The page, opened by its address
  await page.goto("/dev/modes");
  // Its rows, Rapid Fire among them
  await expect(page.getByRole("link", { name: /^Rapid Fire/ })).toBeVisible();
  // Switch the link on
  await page.getByRole("checkbox", { name: /Show a link to this page in Settings/ }).check();
  // Back to Settings
  await page.goto("/settings");
  // The link is there and opens the page
  await page.getByRole("link", { name: /All modes/ }).click();
  // (opened)
  await expect(page).toHaveURL(/\/dev\/modes$/);
});
