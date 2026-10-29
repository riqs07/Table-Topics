// The weekly check-in end to end (decision 100): the first check-in's four parts with the stand-in microphone, then a week later (the page's clock moved on) the second from Today, the comparison of the two with both recordings playing, and the reminder to look back
import { expect, test, useStandIns } from "./support/fixtures";
// Load the page type, for the helpers
import type { Page } from "@playwright/test";

// Move the page's clock on by a number of days, keeping timers real (the recording's timing still runs at its own pace)
async function useShiftedClock(page: Page): Promise<void> {
  // Runs before the app on every page load: Date reads the days to add from this browser's storage (test only)
  await page.addInitScript(() => {
    // The days to add, set by the check
    const days = Number(window.localStorage.getItem("e2e-shift-days") ?? "0");
    // Nothing to do without a shift
    if (!days) return;
    // The real Date
    const RealDate = Date;
    // The shift in milliseconds
    const offset = days * 86_400_000;
    // A Date whose "now" is moved on, and is otherwise the same
    class ShiftedDate extends RealDate {
      // A new date: now moved on, or exactly what was asked
      constructor(...args: ConstructorParameters<typeof Date> | []) {
        // Now, moved on
        if (args.length === 0) super(RealDate.now() + offset);
        // Anything else as asked
        else super(...(args as ConstructorParameters<typeof Date>));
      }
      // Now, moved on
      static override now(): number {
        // The real now plus the shift
        return RealDate.now() + offset;
      }
    }
    // Used by the app from here on
    Object.assign(window, { Date: ShiftedDate });
  });
}

// Record the part the check-in page offers next: start it from the band, speak past the 10-second minimum, stop, and come back to the check-in
async function recordNextPart(page: Page, start: RegExp): Promise<void> {
  // The band names the part
  await page.getByRole("link", { name: start }).click();
  // The recording page, inside the check-in
  await expect(page.getByText(/Weekly check-in · part \d of 4/)).toBeVisible();
  // The part's own start: reading, speaking, planning a story, or seeing the topic
  await page.getByRole("button", { name: /Start reading|Start speaking|Plan it|Show my topic/ }).click();
  // A story starts telling from its planning minute
  if (await page.getByRole("button", { name: /^Ready/ }).isVisible().catch(() => false)) await page.getByRole("button", { name: /^Ready/ }).click();
  // Recording is under way (a surprise question counts down ten seconds first)
  const stop = page.getByRole("button", { name: /Stop/ });
  // (waiting)
  await expect(stop).toBeVisible({ timeout: 15_000 });
  // Speak past the 10-second minimum
  await page.waitForTimeout(11_000);
  // Stop
  await stop.click();
  // Back on the check-in, never stuck on "Saving…"
  await expect(page).toHaveURL(/\/check-in\/run/, { timeout: 15_000 });
}

// Run all four parts from the check-in page
async function runCheckIn(page: Page): Promise<void> {
  // The four parts in order
  for (const start of [/^Start read aloud/, /^Start elevator pitch/, /^Start a story/, /^Start surprise question/]) await recordNextPart(page, start);
}

// The first check-in, a week later the second from Today, then the comparison and the reminder
test("Weekly check-in: a first one, a second a week later, then compare and hear both", async ({ page }) => {
  // Eight recordings in real time
  test.setTimeout(300_000);
  // The stand-in microphone and speech
  await useStandIns(page);
  // The page's clock, which this check moves on
  await useShiftedClock(page);
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // The check-ins page, opened directly: the first one can be done any day
  await page.goto("/check-in");
  // It says so
  await expect(page.getByText("Your first check-in sets your starting point.")).toBeVisible();
  // Start
  await page.getByRole("link", { name: /^Start check-in/ }).click();
  // The check-in page, with the four parts
  await expect(page.getByRole("list", { name: "The four parts" }).getByRole("listitem")).toHaveCount(4);
  // Each part
  await runCheckIn(page);
  // The finish screen
  await expect(page.getByRole("heading", { name: "Your starting point is saved." })).toBeVisible();
  // (each part recorded, with its length)
  await expect(page.getByRole("list", { name: "Your parts" }).getByRole("link")).toHaveCount(4);

  // A week later
  await page.evaluate(() => localStorage.setItem("e2e-shift-days", "7"));
  // Today leads with the check-in
  await page.goto("/");
  // (its headline)
  await expect(page.getByRole("heading", { name: "Check-in day." })).toBeVisible();
  // Start it from Today: the check-in is the current step (no band since decision 138)
  await page.locator("[aria-current='step']").click();
  // The second check-in
  await expect(page.getByRole("heading", { name: "Check-in 2." })).toBeVisible();
  // Each part again
  await runCheckIn(page);
  // Done, with the way to compare
  await expect(page.getByRole("heading", { name: "Check-in done." })).toBeVisible();
  // Compare with the first
  await page.getByRole("link", { name: "Compare with your first" }).click();
  // The comparison: four parts
  await expect(page.locator("section[data-part]")).toHaveCount(4);
  // Two recordings each, all playable (counted outside the "Then and now" pitch cards, which load in later with their own Play then and Play now, so the count never depends on timing)
  await expect(page.getByRole("button", { name: /^Play (then|now)/ }).and(page.locator("section[data-part] button:not([data-last-this] *)"))).toHaveCount(8);
  // What changed, in words, first
  await expect(page.getByRole("list", { name: "What changed, Read aloud" }).getByRole("listitem")).not.toHaveCount(0);
  // The reading's measures, folded away under "All numbers" (decision 103)
  await expect(page.getByRole("table", { name: "Measures, Read aloud" })).toBeHidden();
  // Opened
  await page.locator("section[data-part='read']").getByText("All numbers").click();
  // Then and now, with neutral words (never "Worse")
  await expect(page.getByRole("table", { name: "Measures, Read aloud" })).toBeVisible();
  // (no "Worse")
  await expect(page.getByRole("table", { name: "Measures, Read aloud" })).not.toContainText("Worse");
  // Play the first reading, then switch to the latest with A/B
  await page.getByRole("button", { name: /^Play then/ }).first().click();
  // (switch)
  const ab = page.getByRole("group", { name: "Switch between then and now, Read aloud" });
  // Now
  await ab.getByRole("button", { name: "Now" }).click();
  // Now is the one playing
  await expect(ab.getByRole("button", { name: "Now" })).toHaveAttribute("aria-pressed", "true");
  // And back
  await ab.getByRole("button", { name: "Then" }).click();
  // Then is the one playing
  await expect(ab.getByRole("button", { name: "Then" })).toHaveAttribute("aria-pressed", "true");

  // Today offers a look back now the check-in is done
  await page.goto("/");
  // The reminder
  await expect(page.getByRole("heading", { name: "Hear how far you’ve come" })).toBeVisible();
  // Not now
  await page.getByRole("region", { name: "Hear how far you’ve come" }).getByRole("button", { name: "Not now" }).click();
  // Gone, and still gone after a reload
  await expect(page.getByRole("heading", { name: "Hear how far you’ve come" })).toHaveCount(0);
  // (reloaded)
  await page.reload();
  // (Today has loaded)
  await expect(page.getByRole("region", { name: "Today's practice" })).toBeVisible();
  // (no reminder)
  await expect(page.getByRole("heading", { name: "Hear how far you’ve come" })).toHaveCount(0);
});
