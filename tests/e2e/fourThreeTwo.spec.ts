// The 4/3/2 loop for a story (decision 118), end to end with the stand-in microphone; the page's clock is faked and run forward, so three rounds of 2:00, 1:30 and 1:00 take seconds, not minutes
import { expect, STORY_SPOKEN, test, useStandIns } from "./support/fixtures";
// Load the page type
import type { Page } from "@playwright/test";

// Record one round: start it, let the faked clock run, then stop
async function tellRound(page: Page, round: number, seconds: number): Promise<void> {
  // Which round, and its time
  await expect(page.locator("[data-loop-round]")).toContainText(`round ${round} of 3`, { timeout: 15_000 });
  // Round 1 plans first (Ready cuts it short); later rounds start at once
  if (round === 1) {
    // Plan it
    await page.getByRole("button", { name: /Plan it/ }).click();
    // Ready
    await page.getByRole("button", { name: /Ready/ }).click();
  } else {
    // Start the round
    await page.getByRole("button", { name: new RegExp(`Start round ${round}`) }).click();
  }
  // Recording
  const stop = page.getByRole("button", { name: /Stop/ });
  // (shown)
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // The round's time passes on the faked clock
  await page.clock.runFor(seconds * 1000);
  // Stop
  await stop.click();
}

// From the 4/3/2 page (decision 126), tell today's story three times, shorter each time, then compare the rounds
test("4/3/2: tell today's story three times, shorter each time, then compare the rounds", async ({ page }) => {
  // The stand-in speech tells a story
  await useStandIns(page, STORY_SPOKEN);
  // A clock the check runs forward
  await page.clock.install({ time: new Date("2026-10-22T09:00:00") });
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // Practice, then the drill under "More ways to practise"
  await page.goto("/practice");
  // (opened)
  await page.getByRole("button", { name: "More ways to practise" }).click();
  // The rest of speaking on the spot
  await page.getByRole("region", { name: "Speak on the spot" }).getByRole("button", { name: "See all" }).click();
  // The drill's page
  await page.getByRole("link", { name: /^4\/3\/2/ }).click();
  // Today's story, with a full story's times shown
  const row = page.getByRole("list", { name: "Today's 4/3/2" }).getByRole("link", { name: /^A story/ });
  // (the times)
  await expect(row).toContainText("3:00, then 2:15, then 1:30");
  // Start
  await row.click();
  // Round 1: its 3:00 shown
  await expect(page.locator("[data-loop-round]")).toContainText("Told three times · round 1 of 3 · 3:00");
  // Told for 2:50
  await tellRound(page, 1, 170);
  // Round 2, a page of its own, 2:15
  await expect(page).toHaveURL(/loop=[^&]+&round=2/, { timeout: 15_000 });
  // (its time)
  await expect(page.locator("[data-loop-round]")).toContainText("round 2 of 3 · 2:15");
  // Told for 2:05
  await tellRound(page, 2, 125);
  // Round 3, 1:30
  await expect(page).toHaveURL(/round=3/, { timeout: 15_000 });
  // Told for 1:25
  await tellRound(page, 3, 85);
  // The results
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // The three rounds compared: the line
  await expect(page.locator("[data-loop-line]")).toHaveText(/^From round 1 to round 3, /, { timeout: 15_000 });
  // The table: a column per round, story checks and time against target
  await expect(page.getByRole("row", { name: /story checks/ })).toBeVisible();
  // (the times)
  await expect(page.getByRole("row", { name: /time \/ target/ })).toHaveText(/^time \/ target2:5\d \/ 3:002:0\d \/ 2:151:2\d \/ 1:30$/);
  // The curves on matching phrases, with the three rounds' key
  await expect(page.locator("[data-loop-curves]")).toContainText("Round 1Round 2Round 3");
  // Your stories lists it told three times
  await page.goto("/stories");
  // (three tellings)
  await expect(page.getByRole("list", { name: "Your stories" })).toContainText("Told 3 times");
});
