// Rate yourself before the results (decision 116): after a take, one question, then the results with one line comparing the call with the measure; seeded earlier takes give the usual band
import { expect, test, useStandIns } from "./support/fixtures";
// Load the seeder
import { seedTakes } from "./support/seed";
// Load the session builder
import { makeSession } from "../support/fixtures";

// Free talk: answer the question, then see the comparison on the results
test("Rate yourself: answer how it felt, then see your call against the measure", async ({ page }) => {
  // The stand-in microphone and speech
  await useStandIns(page);
  // Five earlier takes on the spot, each about 120 words a minute (seeded data)
  await seedTakes(page, { sessions: [118, 120, 122, 119, 121].map((wpm, index) => makeSession({ id: `seed-${index}`, mode: "talk", promptId: "t001", createdAt: new Date(Date.now() - (6 - index) * 86_400_000).toISOString(), wordsPerMinute: wpm, durationSec: 70, feedbackStatus: "done", feedback: { keep: "k", change: "c", retryCue: "r" } })) });
  // Free talk
  await page.goto("/session?mode=free&prompt=free");
  // Start
  await page.getByRole("button", { name: /Start speaking/ }).click();
  // The stop
  const stop = page.getByRole("button", { name: /Stop/ });
  // Recording
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // Long enough for the pace to count
  await page.waitForTimeout(22_000);
  // Stop
  await stop.click();
  // The question, before any results
  await expect(page.getByRole("heading", { name: "How did that feel?" })).toBeVisible({ timeout: 15_000 });
  // Still on the recording page
  await expect(page).toHaveURL(/\/session\?/);
  // Slow
  await page.getByRole("button", { name: "Slow" }).click();
  // The results
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // The one line: the call, the pace and where it sits, in neutral words
  await expect(page.locator("[data-self-rating]")).toHaveText(/^You said slow\. Your pace was \d+ a minute, slower than usual\.$/);
});

// Skipping goes straight to the results with no line
test("Rate yourself: one tap skips it, and the results show no comparison", async ({ page }) => {
  // The stand-in microphone and speech
  await useStandIns(page);
  // Free talk
  await page.goto("/session?mode=free&prompt=free");
  // Start
  await page.getByRole("button", { name: /Start speaking/ }).click();
  // The stop
  const stop = page.getByRole("button", { name: /Stop/ });
  // Recording
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // Past the minimum
  await page.waitForTimeout(11_000);
  // Stop
  await stop.click();
  // Skip
  await page.getByRole("button", { name: "Skip" }).click();
  // The results
  await expect(page.getByText("One change", { exact: true })).toBeVisible({ timeout: 15_000 });
  // No line
  await expect(page.locator("[data-self-rating]")).toHaveCount(0);
});
