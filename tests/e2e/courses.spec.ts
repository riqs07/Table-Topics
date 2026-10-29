// A guided course part end to end (decision 131), with the stand-in microphone and a faked clock: Practice → the course → a part's steps → two Rapid Fire tries → the wrap-up, then the part shows done on the course page
import { expect, test, useStandIns } from "./support/fixtures";
// Load the page type
import type { Page } from "@playwright/test";

// Record one Rapid Fire try: reveal the topic, let the countdown and some speaking pass on the faked clock, then stop
async function rapidFire(page: Page): Promise<void> {
  // Reveal the topic and start the countdown
  await page.getByRole("button", { name: /Show my topic/ }).click();
  // The topic draw (decision 133) and the countdown pass
  await page.clock.runFor(14_000);
  // Recording
  const stop = page.getByRole("button", { name: /Stop/ });
  // (shown)
  await expect(stop).toBeVisible({ timeout: 10_000 });
  // Forty seconds of speaking
  await page.clock.runFor(40_000);
  // Stop
  await stop.click();
}

// From Practice, one part of a course: learn, see it, two tries, and the wrap-up
test("Course: a part from Practice through two tries to the wrap-up", async ({ page }) => {
  // The stand-in microphone and speech
  await useStandIns(page);
  // A clock the check runs forward
  await page.clock.install({ time: new Date("2026-10-28T09:00:00") });
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // Practice
  await page.goto("/practice");
  // The course's card
  await page.getByRole("link", { name: /^Stop freezing/ }).click();
  // The course page, with lesson 2's first part
  await page.locator('[data-course-part="sf-point-1"]').click();
  // Learn: the idea
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Say your answer first. Explain after.");
  // On to See it
  await page.getByRole("link", { name: /^Next/ }).click();
  // The model answer's highlight
  await expect(page.locator("mark")).toHaveText("Yes, the basics.");
  // On to Try it
  await page.getByRole("link", { name: /^Your turn/ }).click();
  // The goal, then the recorder
  await expect(page.getByRole("region", { name: "Your one goal" })).toContainText("Say your answer in the first sentence.");
  // (opened)
  await page.getByRole("link", { name: /^Start/ }).click();
  // The course line on the recorder
  await expect(page.locator("[data-course-take]")).toContainText("try 1 of 2");
  // First try
  await rapidFire(page);
  // Back to the part for the second try
  await expect(page).toHaveURL(/\/courses\/part\?id=sf-point-1&step=try&try=2/, { timeout: 15_000 });
  // How the first went
  await expect(page.getByText(/^Try 1 ·/)).toBeVisible();
  // Second try
  await page.getByRole("link", { name: /^Try again/ }).click();
  // (recorded)
  await rapidFire(page);
  // The wrap-up
  await expect(page).toHaveURL(/\/courses\/part\?id=sf-point-1&step=wrap/, { timeout: 15_000 });
  // It names the part done and offers the next one
  await expect(page.getByText("Part 1 of 3 done")).toBeVisible();
  // (the next part)
  await expect(page.getByRole("link", { name: /^Next part/ })).toHaveAttribute("href", "/courses/part?id=sf-point-2");
  // Back on the course page, the part is marked done
  await page.goto("/courses/course?id=stop-freezing");
  // (its mark)
  await expect(page.locator('[data-course-part="sf-point-1"]')).toContainText("Done");
});
