// A Practice card's scene gliding into the screen it opens (decision 141), checked inside the browser's view transition: the scene travels above both pages, so the new page's panel never covers it as it fades in (it once did: the scene seemed to fade, vanish and pop back, B8), and the pages fade rather than cut
import { expect, test } from "./support/fixtures";

// What the transition looked like once it was ready
type Seen = { sceneLayer: string; pageFades: string[] };

// Tapping Rapid Fire on Practice
test("Glide: the card's scene travels above both pages, which fade", async ({ page }) => {
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // A phone-sized screen
  await page.setViewportSize({ width: 390, height: 844 });
  // Practice
  await page.goto("/practice");
  // The big card
  const card = page.locator("[data-way-card='big']");
  // (shown)
  await expect(card).toBeVisible();
  // Watch the next view transition: once ready, note the scene's layer and the page fades
  await page.evaluate(() => {
    // Where the notes go
    const w = window as unknown as { seen?: Seen };
    // The browser's own start
    const original = document.startViewTransition.bind(document);
    // Wrapped to look inside
    document.startViewTransition = ((arg: Parameters<typeof document.startViewTransition>[0]) => {
      // Start it as usual
      const transition = original(arg);
      // Once its pictures are taken
      void transition.ready.then(() => {
        // The page's root, where the pseudo-elements hang
        const root = document.documentElement;
        // The gliding scene's group
        const group = "::view-transition-group(scene-rapid-fire)";
        // The animations running on the pages' own pictures
        const pageFades = document.getAnimations().map((a) => a as CSSAnimation).filter((a) => /vl-page-(fade|rise)/.test(a.animationName)).map((a) => a.animationName);
        // Note them
        w.seen = { sceneLayer: getComputedStyle(root, group).zIndex, pageFades };
      });
      // Hand it back
      return transition;
    }) as typeof document.startViewTransition;
  });
  // Tap the card
  await card.click();
  // The start screen with its panel
  await expect(page.locator("[data-scene-panel='rapid-fire']")).toBeVisible();
  // What was seen
  const seen = await page.evaluate(() => (window as unknown as { seen?: Seen }).seen);
  // A transition ran
  expect(seen).toBeDefined();
  // The scene sits above the pages
  expect(seen?.sceneLayer).toBe("1");
  // The old page faded out and the new one faded in
  expect(seen?.pageFades.sort()).toEqual(["vl-page-fade", "vl-page-rise"]);
});
