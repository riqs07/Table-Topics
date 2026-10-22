// A phone's first screen says what to do in few words: a ceiling on the words in view, so explanations do not creep back (decision 63)
import { expect, test } from "./support/fixtures";
// Load the small-talk lessons, so every unit's lesson pages are measured too (decision 96)
import { SMALL_TALK_LESSONS } from "../../src/content/smallTalk";
// Load every Learn card's title, so Today is measured with the longest one (decision 113)
import { LEARN_INDEX } from "../../src/content/learnIndex";

// A fixed day, so a page that shows the day's picks (Today's prompts) is measured the same on every date: the check once failed only on some days (2026-10-22)
const FIXED_DAY = new Date("2026-10-22T09:00:00");
// The Learn card title with the most words: Today is measured with it in place of the card shown (Today shows the next unread card, whichever that is)
const LONGEST_CARD = [...LEARN_INDEX].sort((a, b) => b.title.split(/\s+/).length - a.title.split(/\s+/).length)[0]!.title;

// The most words allowed in the first phone screen of a page (text read aloud, such as a passage, is not on these pages)
const WORD_BUDGET = 100;

// Pages to measure: the tabs, their inside pages, the start of each kind of practice without a passage, and every small-talk lesson page
const PAGES: ReadonlyArray<string> = ["/", "/practice", "/learn", "/skills", "/settings", "/profile", "/small-talk/unit?id=answering", "/small-talk/unit?id=news", "/small-talk", "/small-talk/unit?id=room", "/small-talk/unit?id=starting", "/small-talk/unit?id=deeper", "/session?mode=smalltalk&prompt=sr01", "/session?mode=smalltalk&prompt=se01", "/session?mode=smalltalk&prompt=sd01", "/learn/set?id=warmth", "/learn/set?id=skills", "/learn/scenarios", "/session?mode=talk&prompt=t001", "/session?mode=response&prompt=p001", "/session?mode=smalltalk&prompt=st01", "/session?mode=smalltalk&prompt=sn01", "/session?mode=bookend&prompt=b001", "/session?mode=moment&prompt=moment", "/voice", "/voice/warmup", "/voice/drill?id=v01", "/voice/shadow?id=s01", "/conversations", "/conversations/talk?id=maya", "/stories", "/stories/tell?prompt=sp01", "/session?mode=story&prompt=sp01", "/stories/tell?prompt=gs13", "/session?mode=story&prompt=gs13&focus=middle", "/check-in", "/check-in/run", "/session?mode=outline&prompt=ci-pitch&checkin=ci-2026-10-13&part=pitch", ...SMALL_TALK_LESSONS.map((lesson) => `/session?mode=smalltalk&prompt=${lesson.id}`)];

// One check per page
for (const path of PAGES) {
  // Count the words in view
  test(`the first phone screen stays under ${WORD_BUDGET} words: ${path}`, async ({ page }) => {
    // A phone-sized screen
    await page.setViewportSize({ width: 390, height: 844 });
    // Skip the welcome so Today shows its usual page
    await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
    // The same day every time (timers still run)
    await page.clock.setFixedTime(FIXED_DAY);
    // Open the page
    await page.goto(path);
    // Let it settle
    await page.waitForLoadState("networkidle");
    // Words in the main column whose text sits at least partly on the first screen, with the longest Learn card's title in place of the one shown
    const words = await page.evaluate((longest) => {
      // The main column
      const main = document.querySelector("main");
      // Nothing to count without it
      if (!main) return 0;
      // Today's Learn step title, when there is one
      const card = main.querySelector("[data-step-lane='learn'] [data-step-title]");
      // The longest title in its place, so the page is laid out (and wraps) as it would with that card
      if (card) card.textContent = longest;
      // Walk every piece of text
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      // The running count
      let count = 0;
      // Each piece
      while (walker.nextNode()) {
        // The element holding it
        const holder = walker.currentNode.parentElement;
        // Skip hidden text (folded sections, screen-reader-only text)
        if (!holder || !holder.checkVisibility() || holder.closest(".sr-only")) continue;
        // Where it sits
        const box = holder.getBoundingClientRect();
        // Count it if it is on the first screen
        if (box.top < window.innerHeight && box.bottom > 0) count += (walker.currentNode.textContent ?? "").split(/\s+/).filter(Boolean).length;
      }
      // The total
      return count;
    }, LONGEST_CARD);
    // Confirm it stays within the budget
    expect(words).toBeLessThanOrEqual(WORD_BUDGET);
  });
}
