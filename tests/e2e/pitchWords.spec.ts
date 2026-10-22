// Pitch in your words (decision 111) in a real browser, with seeded takes (the stand-in microphone's tone is flat, so realistic pitch is made up and written straight in): the text view on a take's page, the phrase rows and tapping a word, a second try's overlay, the stress lesson's targets, a volume drill's thickness (recorded with the stand-in), and an older take's note
import { expect, test, useStandIns } from "./support/fixtures";
// Load the seeding helper and the seeded takes
import { seedTakes } from "./support/seed";
import { lessonSeed, zooSeed } from "./support/pitchSeeds";

// The take's page shows its words with their pitch, and the phrase rows are one tap away; a tapped word moves the recording there
test("a take's page shows pitch in the text, and the phrase rows play from a tapped word", async ({ page }) => {
  // The seeded zoo story
  await seedTakes(page, zooSeed());
  // Its page, loaded directly
  await page.goto("/sessions?id=seeded-zoo");
  // The voice section
  const voice = page.getByRole("region", { name: "Your voice" });
  // The words with their pitch, the endings marked
  await expect(voice.locator("[data-pitch-text]")).toContainText("a seagull stole it right out of my hand.");
  // The rising ending is named
  await expect(voice.getByRole("img", { name: "ending rose" })).toBeVisible();
  // The way to the phrase rows
  await voice.getByRole("link", { name: "See it phrase by phrase" }).click();
  // The phrase rows page
  await expect(page).toHaveURL(/\/sessions\/voice\?id=seeded-zoo$/);
  // Five phrases
  await expect(page.locator("[data-phrase-row]")).toHaveCount(5);
  // The pause between the first two
  await expect(page.getByText("0.8 s pause")).toBeVisible();
  // Tap "stole"
  await page.getByRole("button", { name: /^stole, 0:0\d, play from here$/ }).click();
  // The recording moved to the word (7.2 s in the gliding seed) and is playing from there
  await expect.poll(async () => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.currentTime), { timeout: 5_000 }).toBeGreaterThanOrEqual(6.75);
  // Not far past it
  expect(await page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeLessThan(8.5);
  // The phrase playing is marked
  await expect(page.locator("[data-current]")).toHaveAttribute("data-phrase-row", "2");
});

// A second try draws the first try's curve dashed under its own, with the clear change as the headline
test("a second try overlays the first", async ({ page }) => {
  // The seeded tellings
  await seedTakes(page, zooSeed());
  // The second try's page
  await page.goto("/sessions?id=seeded-again");
  // The card, headed by the change
  const card = page.getByRole("region", { name: "Your ending used to rise. Now it falls." });
  // The first try's curve under this one's
  await expect(card.locator("[data-under]").first()).toBeAttached();
  // Both play buttons
  await expect(card.getByRole("button", { name: "Play first try" })).toBeVisible();
});

// The stress lesson shows where the stress was meant to go, and where it went
test("the stress lesson shows its targets", async ({ page }) => {
  // The seeded lesson
  await seedTakes(page, lessonSeed());
  // Its page
  await page.goto("/sessions?id=seeded-lesson");
  // The planned-stress card
  const card = page.getByRole("region", { name: "Did the key word get the lift?" });
  // A circle for each sentence's key word, and the line on the miss
  await expect(card.locator("[data-target]")).toHaveCount(2);
  // The miss, named
  await expect(card.getByText("Your lift went to “said”. Lean on “took”, and let “said” stay low.")).toBeVisible();
});

// A volume drill's takes are drawn thicker where louder (recorded with the stand-in microphone's tone)
test("a volume drill shows loudness as thickness", async ({ page }) => {
  // The stand-in microphone and speech
  await useStandIns(page);
  // The first three-rooms drill
  await page.goto("/voice/drill?id=v01");
  // Three takes
  for (let take = 0; take < 3; take++) {
    // Record
    await page.getByRole("button", { name: /^Record/ }).click();
    // Speak for a moment
    await page.waitForTimeout(1500);
    // Stop
    await page.getByRole("button", { name: "Stop" }).click();
  }
  // One thick line per take
  await expect(page.locator("[data-thickness]")).toHaveCount(3);
  // Its pieces drawn
  await expect(page.locator("[data-thick]").first()).toBeAttached();
});

// An older take whose readings were dropped says so on its page and on the phrase rows page
test("an older take shows the note instead of charts", async ({ page }) => {
  // The seeded takes
  await seedTakes(page, zooSeed());
  // The old take's page
  await page.goto("/sessions?id=seeded-old");
  // The note
  await expect(page.getByText("Detailed charts aren’t kept for older takes. The words, numbers and feedback are all here.")).toBeVisible();
  // Its phrase rows, opened directly
  await page.goto("/sessions/voice?id=seeded-old");
  // The same note
  await expect(page.getByText(/Detailed charts aren’t kept for older takes/)).toBeVisible();
});
