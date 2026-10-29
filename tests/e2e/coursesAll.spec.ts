// Every course's pages open cleanly, and the new kinds of course practice record and go back to the course (decision 144), with the stand-in microphone
import { STORY_SPOKEN, expect, test, useStandIns } from "./support/fixtures";
// Load the page type
import type { Page } from "@playwright/test";
// Load the courses
import { COURSES } from "@/content/courses";
// Load the course rules, for each part's addresses
import { coursePlaces, partHref, takeHref } from "@/core/courses";

// One check per course: its page lists every part, and every part's idea and recorder open with the course line
for (const course of COURSES) {
  // The check
  test(`Course pages: ${course.title}`, async ({ page }) => {
    // Past the welcome
    await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
    // Its parts
    const places = coursePlaces(course);
    // The course page
    await page.goto(`/courses/course?id=${course.id}`);
    // Every part listed
    await expect(page.locator("[data-course-part]")).toHaveCount(places.length);
    // Each part
    for (const { part } of places) {
      // Its idea
      await page.goto(partHref(part.id));
      // (the headline)
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(part.learn.headline);
      // Nothing to record: on to the next part
      if (!part.practice) continue;
      // Its recorder
      await page.goto(takeHref(part, 1)!);
      // The course line and the goal
      await expect(page.locator("[data-course-take]")).toContainText(`${course.title} · lesson`);
      // (the goal)
      await expect(page.locator("[data-course-take]")).toContainText(part.practice.goal);
    }
  });
}

// Record past the minimum and stop, then wait for the way back to the course
async function speakAndStop(page: Page): Promise<void> {
  // Recording is under way
  const stop = page.getByRole("button", { name: /Stop/ });
  // (shown; a spoken question may take a few seconds first)
  await expect(stop).toBeVisible({ timeout: 15_000 });
  // Speak past the 10-second minimum
  await page.waitForTimeout(11_500);
  // Stop
  await stop.click();
}

// A story part: plan, tell, and back to the part for the second try
test("Course practice: a story goes back to its part", async ({ page }) => {
  // The stand-in microphone tells a story
  await useStandIns(page, STORY_SPOKEN);
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // The but-and-so part's first try
  await page.goto("/courses/part?id=sl-but-1&step=try");
  // Start
  await page.getByRole("link", { name: /^Start/ }).click();
  // The recorder, with the shape carried in the address
  await expect(page).toHaveURL(/mode=story&prompt=sp03&shape=but-therefore&length=full&course=sl-but-1&try=1/);
  // Plan it, then ready
  await page.getByRole("button", { name: /Plan it/ }).click();
  // (ready before the minute is up)
  await page.getByRole("button", { name: /Ready/ }).click();
  // Tell it
  await speakAndStop(page);
  // Back to the part for the second try
  await expect(page).toHaveURL(/\/courses\/part\?id=sl-but-1&step=try&try=2/, { timeout: 15_000 });
});

// A small-talk part: hear the question, answer, and on to the wrap-up after the last try
test("Course practice: a small-talk answer goes back to its part", async ({ page }) => {
  // The stand-in microphone answers
  await useStandIns(page, "Pretty quiet but I finally fixed my bike it was really fun did you get outside at all");
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // The hand-it-back part (one try)
  await page.goto("/courses/part?id=bg-hook-2&step=try");
  // Start
  await page.getByRole("link", { name: /^Start/ }).click();
  // Hear the question; recording starts once it has been said
  await page.getByRole("button", { name: /Hear the question/ }).click();
  // Answer
  await speakAndStop(page);
  // The wrap-up
  await expect(page).toHaveURL(/\/courses\/part\?id=bg-hook-2&step=wrap/, { timeout: 15_000 });
  // The part done
  await expect(page.getByText(/^Part 2 of 2 done/)).toBeVisible();
});

// A reading part and a lesson part: read, and on to the wrap-up
for (const partId of ["vo-breath-1", "ex-update-2"]) {
  // The check
  test(`Course practice: reading aloud in ${partId} goes back to its part`, async ({ page }) => {
    // The stand-in microphone
    await useStandIns(page);
    // Past the welcome
    await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
    // The part's try
    await page.goto(`/courses/part?id=${partId}&step=try`);
    // Start
    await page.getByRole("link", { name: /^Start/ }).click();
    // Start reading
    await page.getByRole("button", { name: /Start reading/ }).click();
    // Read
    await speakAndStop(page);
    // The wrap-up
    await expect(page).toHaveURL(new RegExp(`/courses/part\\?id=${partId}&step=wrap`), { timeout: 15_000 });
  });
}
