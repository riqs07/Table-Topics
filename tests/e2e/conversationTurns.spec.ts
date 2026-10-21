// Browser checks for turns that end by themselves (decision 101): an automatic end with no tap, "I wasn't finished", and tapping to interrupt
import { readFileSync } from "node:fs";
// Load the checks' own test, stand-ins and expect
import { expect, test, useStandIns } from "./support/fixtures";

// The words the stand-in speech hears each turn
const WORDS = "I went climbing on Saturday";

// Settle the welcome, so the conversation opens straight away
test.beforeEach(async ({ page }) => {
  // The welcome was seen
  await page.addInitScript(() => localStorage.setItem("voicelab-welcome-seen", "yes"));
});

// With no coach, Maya's recorded reply follows a turn that ended by itself: no tap on Done
test("a turn ends by itself when you stop talking", async ({ page }) => {
  // A voice for three seconds each turn, then quiet
  await useStandIns(page, WORDS, { speakMs: 3_000 });
  // Maya
  await page.goto("/conversations/talk?id=maya");
  // Start
  await page.getByRole("button", { name: "Start" }).click();
  // Your turn, with the countdown under the shape
  await expect(page.locator("[data-turn-cue]")).toBeVisible({ timeout: 20_000 });
  // Her scripted reply arrives without Done being tapped
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("So how was your weekend?", { timeout: 20_000 });
});

// With the coach: the reply is slow, "I wasn't finished" cancels it and listens again, and the next request carries both turns' words joined
test("I wasn't finished gives the turn back", async ({ page }) => {
  // A voice for three seconds each turn, then quiet
  await useStandIns(page, WORDS, { speakMs: 3_000 });
  // The passphrase is saved, so lines are written
  await page.addInitScript(() => localStorage.setItem("voicelab-passphrase", "a long passphrase for testing"));
  // What the browser sent
  const sent: Array<{ turns: Array<{ who: string; text: string }> }> = [];
  // The conversation route, stood in: the reply to the first turn is slow
  await page.route("**/api/conversation", async (route) => {
    // Noted
    sent.push(JSON.parse(route.request().postData() ?? "{}") as { turns: Array<{ who: string; text: string }> });
    // The second request waits, so it can be cancelled
    if (sent.length === 2) await new Promise((resolve) => setTimeout(resolve, 4_000));
    // Answer; a cancelled request can no longer be answered
    await route.fulfill({ json: { text: sent.length === 1 ? "Hi! I'm Maya." : "Oh, climbing! Where?", audio: null, goodbye: false } }).catch(() => undefined);
  });
  // Maya
  await page.goto("/conversations/talk?id=maya");
  // Start
  await page.getByRole("button", { name: "Start" }).click();
  // The turn ends by itself, and the offer appears
  await page.getByRole("button", { name: "I wasn’t finished" }).click({ timeout: 30_000 });
  // Listening again
  await expect(page.locator("[data-turn-cue]")).toBeVisible({ timeout: 10_000 });
  // Her reply to the joined turn
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Oh, climbing! Where?", { timeout: 30_000 });
  // Three requests: the opening, the cancelled one, and one with your words joined once
  expect([sent.length, sent[2]?.turns.filter((turn) => turn.who === "you").map((turn) => turn.text)]).toEqual([3, [`${WORDS} ${WORDS}`]]);
});

// Tapping while she talks stops her line and starts your turn
test("tap to interrupt", async ({ page }) => {
  // The stand-ins, with a steady tone (turns never end by themselves)
  await useStandIns(page, WORDS);
  // The passphrase is saved, so lines are written
  await page.addInitScript(() => localStorage.setItem("voicelab-passphrase", "a long passphrase for testing"));
  // Count the player being paused
  await page.addInitScript(() => {
    // The real pause
    const pause = HTMLMediaElement.prototype.pause;
    // Counted, then paused
    HTMLMediaElement.prototype.pause = function counted(this: HTMLMediaElement) {
      // Counted
      (window as unknown as { pauses: number }).pauses = ((window as unknown as { pauses?: number }).pauses ?? 0) + 1;
      // Paused
      pause.call(this);
    };
  });
  // A long real recording, as the route would send it
  const audio = readFileSync("public/clips/theo-14.mp3").toString("base64");
  // The conversation route, stood in
  await page.route("**/api/conversation", (route) => route.fulfill({ json: { text: "Oh hi! I'm Maya, I'm new on the design team.", audio, goodbye: false } }));
  // Maya
  await page.goto("/conversations/talk?id=maya");
  // Start
  await page.getByRole("button", { name: "Start" }).click();
  // Tap her while she talks
  await page.getByRole("button", { name: "Interrupt Maya and start your turn" }).click({ timeout: 20_000 });
  // Your turn at once
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 5_000 });
  // Her line was stopped
  expect(await page.evaluate(() => (window as unknown as { pauses?: number }).pauses ?? 0)).toBeGreaterThan(0);
});
