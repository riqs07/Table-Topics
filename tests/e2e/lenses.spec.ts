// Focus first in a real browser (decision 115), with seeded takes (labelled as seeded: the stand-in microphone's tone is flat, so realistic takes are made up and written straight in): a short Rapid Fire answer shows only the pitch in its words and "Look closer", a three-minute speech its fingerprint, tabs and best moment, a pause drill only its pauses, tapping an "um" moves the recording there, and History draws each take's tiny fingerprint
import { expect, test } from "./support/fixtures";
// Load the seeding helper and the seeded takes
import { seedTakes } from "./support/seed";
import { lensSeed } from "./support/pitchSeeds";

// A 40-second Rapid Fire answer
test("a short Rapid Fire take shows only the pitch in its words and Look closer", async ({ page }) => {
  // The seeded takes
  await seedTakes(page, lensSeed());
  // Its page, loaded directly
  await page.goto("/sessions?id=seeded-rapid");
  // The pitch in the words
  await expect(page.getByRole("region", { name: "Your voice" }).locator("[data-pitch-text]")).toBeVisible();
  // Look closer, and nothing else
  await expect(page.getByRole("button", { name: "Look closer" })).toBeVisible();
  // No tabs, fingerprint or best moment
  await expect(page.locator("[role='tablist'], [data-fingerprint], [data-best-moment], [data-energy-arc]")).toHaveCount(0);
});

// Tapping an "um" in the pauses lens moves the recording there
test("tapping an um plays its moment", async ({ page }) => {
  // The seeded takes
  await seedTakes(page, lensSeed());
  // The short take
  await page.goto("/sessions?id=seeded-rapid");
  // Open the lenses
  await page.getByRole("button", { name: "Look closer" }).click();
  // Pauses and ums
  await page.getByRole("tab", { name: "Pauses and ums" }).click();
  // The "um", as a button
  const um = page.getByRole("button", { name: /^um, 0:\d\d, play$/ });
  // Tap it
  await um.click();
  // The recording moved to just before it (the "um" starts after 8 seconds) and plays
  await expect.poll(async () => page.locator("audio").first().evaluate((audio: HTMLAudioElement) => audio.currentTime), { timeout: 5_000 }).toBeGreaterThan(8);
});

// A three-minute prepared speech
test("a three-minute prepared speech shows its fingerprint, the tabs and its best moment", async ({ page }) => {
  // The seeded takes
  await seedTakes(page, lensSeed());
  // Its page
  await page.goto("/sessions?id=seeded-speech");
  // The fingerprint, with its strip
  await expect(page.locator("[data-fingerprint] [data-stretch]").first()).toBeAttached();
  // The tabs, open, with Clarity (deeper analysis ran)
  await expect(page.getByRole("tablist").getByRole("tab")).toHaveText(["Pitch", "Pauses and ums", "Pace", "Words", "Clarity"]);
  // The best moment, with its beat
  await expect(page.getByRole("region", { name: "Your best moment" })).toContainText("seagull… stole");
  // The energy arc
  await expect(page.getByRole("region", { name: "Energy" })).toBeVisible();
});

// A pause drill
test("a pause drill shows only the pauses lens", async ({ page }) => {
  // The seeded takes
  await seedTakes(page, lensSeed());
  // Its page
  await page.goto("/sessions?id=seeded-pause");
  // The pauses lens with its pills
  await expect(page.getByRole("region", { name: "Pauses and ums" }).locator("[data-pause]").first()).toBeVisible();
  // No pitch section and no tabs until asked
  await expect(page.locator("[data-pitch-text], [role='tablist']")).toHaveCount(0);
});

// History's rows
test("History rows show each take's tiny fingerprint, older takes' made at idle", async ({ page }) => {
  // The seeded takes
  await seedTakes(page, lensSeed());
  // History
  await page.goto("/history");
  // Every take with readings gets one: the older take's is made once the page is idle, then shown on the next visit
  await expect.poll(async () => {
    // Look again
    await page.reload();
    // How many rows have one
    return page.locator("[data-mini-fingerprint]").count();
  }, { timeout: 20_000 }).toBe(4);
});
