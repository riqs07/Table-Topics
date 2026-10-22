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

// Choose three rounds on a short story, tell all three, then compare them
test("4/3/2: tell a short story three times, shorter each time, then compare the rounds", async ({ page }) => {
  // The stand-in speech tells a story
  await useStandIns(page, STORY_SPOKEN);
  // A clock the check runs forward
  await page.clock.install({ time: new Date("2026-10-22T09:00:00") });
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // A story's set-up
  await page.goto("/stories/tell?prompt=sp01");
  // Short
  await page.getByRole("button", { name: /Short/ }).click();
  // Three times, with the short story's times shown
  await expect(page.getByText("2:00, then 1:30, then 1:00")).toBeVisible();
  // (switched on)
  await page.getByRole("checkbox", { name: /Tell it three times, shorter each time/ }).check();
  // Start
  await page.getByRole("link", { name: /^Start/ }).click();
  // Round 1: its 2:00 shown
  await expect(page.locator("[data-loop-round]")).toContainText("Told three times · round 1 of 3 · 2:00");
  // Told for 1:50
  await tellRound(page, 1, 110);
  // Round 2, a page of its own, 1:30
  await expect(page).toHaveURL(/loop=[^&]+&round=2/, { timeout: 15_000 });
  // (its time)
  await expect(page.locator("[data-loop-round]")).toContainText("round 2 of 3 · 1:30");
  // Told for 1:20
  await tellRound(page, 2, 80);
  // Round 3, 1:00
  await expect(page).toHaveURL(/round=3/, { timeout: 15_000 });
  // Told for 0:55
  await tellRound(page, 3, 55);
  // The question, once, after the last round
  await page.getByRole("button", { name: "Lively" }).click();
  // The results
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 15_000 });
  // The three rounds compared: the line
  await expect(page.locator("[data-loop-line]")).toHaveText(/^From round 1 to round 3, /, { timeout: 15_000 });
  // The table: a column per round, story checks and time against target
  await expect(page.getByRole("row", { name: /story checks heard/ })).toBeVisible();
  // (the times)
  await expect(page.getByRole("row", { name: /time \/ target/ })).toHaveText(/^time \/ target1:5\d \/ 2:001:2\d \/ 1:300:5\d \/ 1:00$/);
  // The curves on matching phrases, with the three rounds' key
  await expect(page.locator("[data-loop-curves]")).toContainText("Round 1Round 2Round 3");
  // Your stories lists it told three times
  await page.goto("/stories");
  // (three tellings)
  await expect(page.getByRole("list", { name: "Your stories" })).toContainText("Told 3 times");
});
