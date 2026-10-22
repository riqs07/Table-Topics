// The two intonation drills and the goal line (decision 117), with the stand-in microphone (a steady tone, so every take's pitch is flat: the checks look at what is drawn, not at a real voice)
import { expect, test, useStandIns } from "./support/fixtures";

// Record one drill take of about a second and a half
async function recordTake(page: import("@playwright/test").Page): Promise<void> {
  // Start
  await page.getByRole("button", { name: /Record/ }).click();
  // The stop
  const stop = page.getByRole("button", { name: "Stop" });
  // Recording
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // A little over a second of readings
  await page.waitForTimeout(1_600);
  // Stop
  await stop.click();
}

// The goal shows before the first take, then the stress-shift takes and their targets on the results
test("Same sentence, different stress: the goal first, then a target circled on every take", async ({ page }) => {
  // The stand-in microphone
  await useStandIns(page);
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // The drill's second sentence, loaded directly
  await page.goto("/voice/drill?id=p05&set=2");
  // The goal, before any take
  await expect(page.locator("[data-goal]")).toHaveText(/^Goal: Your highest pitch lands on a different word each time\. You’ll see a circle on each target/);
  // Which sentence and the first target
  await expect(page.getByText(/Sentence 2 of 6 · Take 1 of 3 · Stress “We”/)).toBeVisible();
  // Three takes
  for (let take = 0; take < 3; take += 1) await recordTake(page);
  // The headline counts the takes with the peak on the target
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/takes? got the peak on the target word\.$|^Not enough voice to read the pitch\.$/, { timeout: 15_000 });
  // Each take drawn with its target circled and its peak's dot
  await expect(page.locator("[data-planned-stress]")).toHaveCount(3);
  // (the circles)
  await expect(page.locator("[data-target]")).toHaveCount(3);
  // What the circle and dot mean
  await expect(page.getByText("The dashed circle is the word to stress; the dot is where your highest pitch landed.")).toBeVisible();
});

// Exaggerate, then dial back: three takes, each drawn with its range, and the one line
test("Exaggerate, then dial back: flat, exaggerated, natural, each drawn with its range", async ({ page }) => {
  // The stand-in microphone
  await useStandIns(page);
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // The drill, loaded directly
  await page.goto("/voice/drill?id=p06&set=1");
  // The goal first
  await expect(page.locator("[data-goal]")).toContainText("Goal: A big range, then a natural take that keeps some of it.");
  // Three takes
  for (let take = 0; take < 3; take += 1) await recordTake(page);
  // A curve for each take
  await expect(page.locator("[data-take-curve]")).toHaveCount(3, { timeout: 15_000 });
  // Each take's range
  await expect(page.getByText(/^Range: \d+ steps?\.$/)).toHaveCount(3);
});

// A lesson's goal shows before starting, under its tip
test("A lesson shows its goal before starting", async ({ page }) => {
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // The stress lesson
  await page.goto("/session?mode=lesson&prompt=l006");
  // The goal
  await expect(page.locator("[data-goal]")).toHaveText("Goal: Your highest pitch lands on the key word. You’ll see a circle on the target and a dot where your peak landed.");
});
