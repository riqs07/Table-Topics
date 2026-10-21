// A phone's first screen says what to do in few words: a ceiling on the words in view, so explanations do not creep back (decision 63)
import { expect, test } from "./support/fixtures";

// The most words allowed in the first phone screen of a page (text read aloud, such as a passage, is not on these pages)
const WORD_BUDGET = 100;

// Pages to measure: the tabs, their inside pages, and the start of each kind of practice without a passage
const PAGES: ReadonlyArray<string> = ["/", "/practice", "/learn", "/skills", "/settings", "/profile", "/bookends", "/small-talk/unit?id=answering", "/small-talk/unit?id=news", "/learn/set?id=warmth", "/learn/scenarios", "/session?mode=talk&prompt=t001", "/session?mode=response&prompt=p001", "/session?mode=smalltalk&prompt=st01", "/session?mode=smalltalk&prompt=sn01", "/session?mode=bookend&prompt=b001", "/session?mode=moment&prompt=moment", "/voice", "/voice/warmup", "/voice/drill?id=v01", "/voice/shadow?id=s01", "/conversations", "/conversations/talk?id=maya"];

// One check per page
for (const path of PAGES) {
  // Count the words in view
  test(`the first phone screen stays under ${WORD_BUDGET} words: ${path}`, async ({ page }) => {
    // A phone-sized screen
    await page.setViewportSize({ width: 390, height: 844 });
    // Skip the welcome so Today shows its usual page
    await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
    // Open the page
    await page.goto(path);
    // Let it settle
    await page.waitForLoadState("networkidle");
    // Words in the main column whose text sits at least partly on the first screen
    const words = await page.evaluate(() => {
      // The main column
      const main = document.querySelector("main");
      // Nothing to count without it
      if (!main) return 0;
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
    });
    // Confirm it stays within the budget
    expect(words).toBeLessThanOrEqual(WORD_BUDGET);
  });
}
