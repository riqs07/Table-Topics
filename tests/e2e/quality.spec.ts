// Quality checks from the 2026-10-19 UX review (decision 76): focus after a page change, no jumping while data loads, fonts kept lean, and a frame instead of a blank page
import { expect, test } from "./support/fixtures";

// Moving to another page puts focus on its main heading, as a fresh page load would
test("moves focus to the new page's heading after navigating", async ({ page }) => {
  // Open Practice
  await page.goto("/practice");
  // Let it settle
  await page.waitForLoadState("networkidle");
  // Go to Learn with the main navigation
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Learn" }).click();
  // Wait for Learn's heading
  await expect(page.getByRole("heading", { level: 1, name: "Learn" })).toBeVisible();
  // Focus lands on it
  await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe("H1");
});

// Learn used to shift by 0.37 as today's mission arrived late; now the page appears in one piece
test("keeps Learn still while it loads", async ({ page }) => {
  // Add up layout shifts from the start
  await page.addInitScript(() => {
    // The running total
    (window as unknown as { shift: number }).shift = 0;
    // Watch for shifts not caused by input
    new PerformanceObserver((list) => {
      // Each shift
      for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!entry.hadRecentInput) (window as unknown as { shift: number }).shift += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  // A phone-sized window
  await page.setViewportSize({ width: 390, height: 844 });
  // Open Learn
  await page.goto("/learn");
  // Wait for the mission to arrive
  await expect(page.getByText("Today’s mission")).toBeVisible();
  // Let any late shifts land
  await page.waitForTimeout(500);
  // Under the "good" line for layout shift
  expect(await page.evaluate(() => (window as unknown as { shift: number }).shift)).toBeLessThan(0.1);
});

// Only the fonts every page uses are fetched up front (two others are for the style page)
test("preloads only the two fonts the app uses", async ({ page }) => {
  // Open Today
  await page.goto("/");
  // Count font preloads
  const preloads = await page.locator('link[rel="preload"][as="font"]').count();
  // At most the two families in use (one file each)
  expect(preloads).toBeLessThanOrEqual(2);
});

// A page that reads its address shows its frame before the code arrives, not a blank screen
test("sends the recording page with a frame to show while it loads", async ({ request }) => {
  // The page as first sent
  const html = await (await request.get("/session?mode=talk&prompt=t001")).text();
  // The loading frame is in it
  expect(html).toContain("Loading");
});

// Pages carry the content policy and HTTPS-only, and sound still plays from memory and from a data address under it (decision 87)
test("sends the security headers and still plays sound from blob and data addresses", async ({ page }) => {
  // Open Today
  const response = await page.goto("/");
  // Its headers
  const headers = response?.headers() ?? {};
  // Confirm the policy limits network requests to this site, and HTTPS-only is set
  expect([headers["content-security-policy"]?.includes("connect-src 'self'"), headers["strict-transport-security"]]).toEqual([true, "max-age=63072000; includeSubDomains"]);
  // Load a short silence from a data address and the same bytes from memory, as the app does to unlock and play sound
  const loaded = await page.evaluate(async () => {
    // The silence the app plays on a tap (a tiny WAV file)
    const silence = "data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";
    // Whether an address loads as audio, or fails (a blocked address fails)
    const loads = (url: string) => new Promise<boolean>((resolve) => {
      // A fresh audio element
      const audio = new Audio();
      // Loaded enough to play
      audio.addEventListener("canplaythrough", () => resolve(true), { once: true });
      // Refused or broken
      audio.addEventListener("error", () => resolve(false), { once: true });
      // Start loading
      audio.src = url;
      // Load it
      audio.load();
    });
    // The same bytes, from memory (decoded here, since fetching a data address is not a request to this site)
    const blobUrl = URL.createObjectURL(new Blob([Uint8Array.from(atob(silence.split(",")[1] ?? ""), (character) => character.charCodeAt(0))], { type: "audio/wav" }));
    // Both results
    return [await loads(silence), await loads(blobUrl)];
  });
  // Confirm both load
  expect(loaded).toEqual([true, true]);
});

// The first Tab stop is a way past the masthead and tabs to the page's content (round 5; on a phone the tab bar and gear came first)
test("offers a skip link to the content as the first Tab stop", async ({ page }) => {
  // A phone-sized window
  await page.setViewportSize({ width: 390, height: 844 });
  // Open Practice
  await page.goto("/practice");
  // Let it settle
  await page.waitForLoadState("networkidle");
  // The first Tab
  await page.keyboard.press("Tab");
  // The focused control
  const first = page.locator(":focus");
  // It is the skip link, and it shows once focused
  await expect(first).toHaveText("Skip to content");
  // Visible, not a one-pixel square
  expect((await first.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
  // Follow it
  await page.keyboard.press("Enter");
  // The next Tab lands inside the page's content, not on the tab bar
  await page.keyboard.press("Tab");
  // Confirm it is inside the main area and outside the navigation
  expect(await page.evaluate(() => !!document.activeElement?.closest("main") && !document.activeElement?.closest("nav, header"))).toBe(true);
});

// The read-aloud start shape never covers the text: under the length in the margin on a computer, in a bar at the bottom centre of a phone with the text at full width (round 4)
test("keeps the read-aloud shape off the text at both widths", async ({ page }) => {
  // A computer-sized window
  await page.setViewportSize({ width: 1280, height: 900 });
  // Open a reading
  await page.goto("/session?mode=read&prompt=r001");
  // The passage and the start shape
  const passage = page.getByTestId("passage");
  const start = page.getByRole("button", { name: /Start reading/ });
  // Where each is
  const [text, shape] = [await passage.boundingBox(), await start.boundingBox()];
  // On a computer the shape sits left of the text
  expect((shape?.x ?? 0) + (shape?.width ?? 0)).toBeLessThan(text?.x ?? 0);
  // Now a phone
  await page.setViewportSize({ width: 390, height: 844 });
  // Scroll to the end
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  // Where they are now
  const [phoneText, phoneShape] = [await passage.boundingBox(), await start.boundingBox()];
  // The text uses the column's full width (more than 300 pixels of 342), and its last line ends above the shape's bar
  expect([(phoneText?.width ?? 0) > 300, (phoneText?.y ?? 0) + (phoneText?.height ?? 0) <= (phoneShape?.y ?? 0)]).toEqual([true, true]);
});

// At the end of a page with a floating action band, nothing is left under it (round 4)
for (const path of ["/", "/learn", "/small-talk/unit?id=answering"]) {
  test(`leaves nothing under the action band at the end of the page: ${path}`, async ({ page }) => {
    // A phone-sized window
    await page.setViewportSize({ width: 390, height: 844 });
    // Skip the welcome so Today shows its usual page
    await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
    // Open the page
    await page.goto(path);
    // Let it settle
    await page.waitForLoadState("networkidle");
    // Scroll to the end
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    // The lowest bottom edge of any visible content in the main area other than the band, against the band's top
    const overlap = await page.evaluate(() => {
      // The band's top
      const band = document.querySelector("[data-action-band]")!.getBoundingClientRect().top;
      // Every visible element with its own text or image, outside the band
      const bottoms = [...document.querySelectorAll("main *")].filter((element) => !element.closest("[data-action-band], nav") && element.checkVisibility() && (element.childElementCount === 0 || element.tagName === "svg")).map((element) => element.getBoundingClientRect()).filter((box) => box.height > 0 && box.width > 0).map((box) => box.bottom);
      // How far the lowest one reaches past the band's top
      return Math.max(...bottoms) - band;
    });
    // Nothing reaches under it
    expect(overlap).toBeLessThanOrEqual(0);
  });
}

// Keyboard hints are for keyboards: shown with a mouse and keyboard, hidden on a touch screen (round 4)
test("shows keyboard hints only on a device with a keyboard", async ({ page, browser }) => {
  // On this desktop browser
  await page.goto("/session?mode=talk&prompt=t001");
  // The hint shows, in sentence case
  await expect(page.locator("[data-keyboard-hint]")).toHaveText("Space to see your topic");
  await expect(page.locator("[data-keyboard-hint]")).toBeVisible();
  // A phone with a touch screen and no mouse
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  // A page in it
  const touch = await phone.newPage();
  // The same page
  await touch.goto(new URL("/session?mode=talk&prompt=t001", page.url()).toString());
  // The hint is hidden
  await expect(touch.locator("[data-keyboard-hint]")).toBeHidden();
  // And Settings leaves out the space bar switch
  await touch.goto(new URL("/settings", page.url()).toString());
  // Wait for the section
  await expect(touch.getByRole("heading", { name: "While speaking" })).toBeVisible();
  // The switch is hidden
  await expect(touch.getByText("Space bar starts and stops recording")).toBeHidden();
  // Done with the phone
  await phone.close();
});
