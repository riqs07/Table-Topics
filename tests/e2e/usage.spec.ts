// Browser check for Settings' "Usage and costs (estimated)" (decision 143): with a passphrase saved, the section reads the stood-in usage route and shows each kind's use, its estimate and the total
import { expect, test } from "./support/fixtures";

// The usage section shows the server's numbers
test("the usage section shows this month's numbers and estimates", async ({ page }) => {
  // The welcome seen, the passphrase saved
  await page.addInitScript(() => {
    // Seen
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // The passphrase
    localStorage.setItem("voicelab-passphrase", "a long passphrase for testing");
  });
  // The usage route, stood in
  await page.route("**/api/usage", (route) => route.fulfill({ json: { month: "2026-10", live: { used: 12, limit: 150, left: 138, setUp: true }, call: { used: 5, limit: 60, left: 55, setUp: true }, voiceCharacters: { turbo: 3_400, v4: 0 }, lines: 42, conversationMinutes: { used: 20, limit: 150 } } }));
  // Settings' minutes check
  await page.route("**/api/conversation", (route) => route.fulfill({ json: { minutesUsed: 20, minutesPerMonth: 150, minutesLeft: 130 } }));
  // Settings
  await page.goto("/settings");
  // The section
  const section = page.locator("#usage");
  // Its rows
  await expect(section.locator("[data-usage-row='live']")).toHaveText("Live turns12 of 150 minutes, 138 left$0.03");
  // Calls: 5 × ($0.08 + 3 lines)
  await expect(section.locator("[data-usage-row='call']")).toHaveText("Phone calls5 of 60 minutes, 55 left$0.40");
  // The voice
  await expect(section.locator("[data-usage-row='turbo']")).toHaveText("Persona voice (Turbo)3,400 characters$0.14");
  // The total
  await expect(section.locator("[data-usage-row='total']")).toHaveText("Total$0.57");
  // The note
  await expect(section.getByText("Estimates from the prices below; your provider’s bill is the real number.")).toBeVisible();
});
