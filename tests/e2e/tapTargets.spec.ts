// Every control is at least 44 pixels tall on a phone, the size a thumb can hit (UX round, option B)
import { expect, test } from "./support/fixtures";

// Pages to measure
const PAGES: ReadonlyArray<string> = ["/", "/practice", "/skills", "/rehearse", "/history", "/settings", "/profile", "/talk?id=missing", "/session?mode=response&prompt=p040", "/sessions?id=missing", "/speech?id=jfk-inaugural", "/voice", "/voice/warmup", "/voice/drill?id=p04", "/voice/shadow?id=s01", "/conversations", "/conversations/talk?id=theo", "/stories", "/stories/tell?prompt=sp01", "/stories/tell?prompt=gs13", "/session?mode=story&prompt=sp01"];

// One check per page
for (const path of PAGES) {
  // Measure every visible control
  test(`tap targets are at least 44 pixels on a phone: ${path}`, async ({ page }) => {
    // A phone-sized screen
    await page.setViewportSize({ width: 375, height: 812 });
    // Skip the welcome so Today shows its usual controls
    await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
    // Open the page
    await page.goto(path);
    // Let it settle
    await page.waitForLoadState("networkidle");
    // Controls shorter than 44 pixels (a checkbox counts by its label; links inside sentences, marked data-inline, are exempt)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("a, button, input, select, textarea, summary")]
        .map((element) => {
          // A checkbox is tapped through its label
          const target = element instanceof HTMLInputElement && element.type === "checkbox" ? (element.closest("label") ?? element) : element;
          // Its size
          const box = target.getBoundingClientRect();
          // What to report
          return { box, exempt: Boolean(element.closest("[data-inline]")), name: `${element.tagName.toLowerCase()} "${(element.textContent || element.getAttribute("aria-label") || "").trim().slice(0, 30)}"` };
        })
        .filter((entry) => entry.box.width > 1 && !entry.exempt && entry.box.height < 44)
        .map((entry) => `${entry.name} ${Math.round(entry.box.height)}px`),
    );
    // None
    expect(small).toEqual([]);
  });
}
