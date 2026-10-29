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

// Every step on Today animates into its screen (the user once saw none, B9): the page fades, and a step whose scene is the only one of its kind carries it along into the panel waiting there
test("Glide: every Today step fades into its screen, its scene gliding when it is the only one of its kind", async ({ page }) => {
  // Past the welcome
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
  // On every page, note what each view transition runs once it is ready
  await page.addInitScript(() => {
    // The browser's own start
    const original = document.startViewTransition.bind(document);
    // Wrapped to look inside
    document.startViewTransition = ((arg: Parameters<typeof document.startViewTransition>[0]) => {
      // Start it as usual
      const transition = original(arg);
      // Once ready, the CSS animations it runs
      void transition.ready.then(() => { (window as unknown as { ran?: string[] }).ran = document.getAnimations().map((a) => `${(a.effect as KeyframeEffect).pseudoElement ?? ""}${(a as CSSAnimation).animationName ?? ""}`); });
      // Hand it back
      return transition;
    }) as typeof document.startViewTransition;
  });
  // A phone-sized screen
  await page.setViewportSize({ width: 390, height: 844 });
  // Today, to count its steps
  await page.goto("/");
  // The steps
  const steps = page.locator("a[aria-label^='Step ']");
  // (shown)
  await expect(steps.first()).toBeVisible();
  // How many
  const count = await steps.count();
  // What each step did: its scene when it carries one, and whether its scene glided and the pages faded
  const results: Array<[string | null, string | null, boolean, boolean]> = [];
  // Each step in turn, from a fresh Today
  for (let index = 0; index < count; index += 1) {
    // Today
    await page.goto("/");
    // The step
    const step = steps.nth(index);
    // (shown)
    await expect(step).toBeVisible();
    // Its name and the scene it carries along, if any
    const [label, shared] = await step.evaluate((link) => [link.getAttribute("aria-label"), link.querySelector("[data-shared]")?.getAttribute("data-step-scene") ?? null]);
    // Tap it
    await step.click();
    // Its screen
    await page.waitForURL((url) => url.pathname !== "/");
    // The transition's animations, once noted
    const ran = await page.waitForFunction(() => (window as unknown as { ran?: string[] }).ran ?? false).then((handle) => handle.jsonValue() as Promise<string[]>);
    // Note what it did
    results.push([label, shared, shared ? ran.some((name) => name.startsWith(`::view-transition-group(scene-${shared})`)) : false, ran.some((name) => name.endsWith("vl-page-fade")) && ran.some((name) => name.endsWith("vl-page-rise"))]);
  }
  // Confirm every step faded, and every step carrying a scene glided it
  expect(results).toEqual(results.map(([label, shared]) => [label, shared, shared !== null, true]));
});
