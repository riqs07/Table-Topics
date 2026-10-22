// Browser checks for live conversations, step A (decision 119): a stand-in AssemblyAI streaming server inside the page (in place of the browser's WebSocket, since the checks cannot reach the real service) hears the stand-in microphone's tone, says a turn has ended after two seconds of it, and notes what it was sent; the live route is stood in too. The browser's own speech recognition hears different words, so the reply's words prove where they came from
import { expect, test, useStandIns } from "./support/fixtures";
// Load the page type
import type { Page } from "@playwright/test";

// The words the stand-in streaming server "hears"
const LIVE_WORDS = "I went climbing on Saturday";

// Replace the browser's WebSocket with a stand-in streaming server: Begin at once; while the audio it is sent is louder than silence it builds a turn, a partial after one second and the end after two; Terminate and ForceEndpoint are noted and answered as the service does
async function useStreamingStandIn(page: Page): Promise<void> {
  // Runs inside the browser on every page load
  await page.addInitScript((words: string) => {
    // What the stand-in saw, for the check
    const seen = { urls: [] as string[], loudMs: 0, silentMs: 0, terminated: false, forced: 0, turns: 0 };
    // Kept where the check can read it
    (window as unknown as { liveSeen: typeof seen }).liveSeen = seen;
    // The stand-in socket
    class StandInSocket extends EventTarget {
      // Connecting, then open
      readyState = 0;
      // Set by the app
      binaryType = "blob";
      // Loud audio in the turn being built, in milliseconds
      private loud = 0;
      // The service's turn number
      private order = 0;
      // Opens a moment later and begins the session
      constructor(readonly url: string) {
        // An event target
        super();
        // Noted
        seen.urls.push(url);
        // Open, then begin
        setTimeout(() => {
          // Open
          this.readyState = 1;
          // Said
          this.dispatchEvent(new Event("open"));
          // The session begins
          this.say({ type: "Begin", id: "stand-in", expires_at: 0 });
        }, 50);
      }
      // A message from the stand-in server
      private say(message: unknown) {
        // As the browser delivers it
        this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(message) }));
      }
      // The app sends audio or a control message
      send(data: string | ArrayBufferView | ArrayBuffer) {
        // Control messages
        if (typeof data === "string") {
          // Ending the session
          if (data.includes("Terminate")) seen.terminated = true;
          // Ending the turn now: the end, with whatever was heard
          if (data.includes("ForceEndpoint")) {
            // Counted
            seen.forced += 1;
            // The end
            this.say({ type: "Turn", turn_order: this.order, transcript: this.loud >= 1_000 ? words : "", end_of_turn: true, end_of_turn_confidence: 1, words: [] });
            // Next
            this.order += 1;
            // Reset
            this.loud = 0;
          }
          // Nothing more
          return;
        }
        // The samples
        const samples = data instanceof ArrayBuffer ? new Int16Array(data) : new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
        // Their length at 16 kHz
        const ms = (samples.length / 16_000) * 1_000;
        // Louder than silence anywhere
        const loud = samples.some((sample) => Math.abs(sample) > 200);
        // Silence: noted
        if (!loud) {
          // Counted
          seen.silentMs += ms;
          // Nothing more
          return;
        }
        // Loud: counted for the turn
        seen.loudMs += ms;
        // (and this turn)
        this.loud += ms;
        // A second in: the first words
        if (this.loud >= 1_000 && this.loud - ms < 1_000) this.say({ type: "Turn", turn_order: this.order, transcript: words.split(" ").slice(0, 3).join(" "), end_of_turn: false, end_of_turn_confidence: 0.1, words: [] });
        // Two seconds in: the end of the turn
        if (this.loud >= 2_000) {
          // The end
          this.say({ type: "Turn", turn_order: this.order, transcript: words, end_of_turn: true, end_of_turn_confidence: 0.9, words: [] });
          // Counted
          seen.turns += 1;
          // Next
          this.order += 1;
          // Reset
          this.loud = 0;
        }
      }
      // Closed by the app
      close() {
        // Closed
        this.readyState = 3;
      }
    }
    // Installed in place of the browser's
    Object.assign(window, { WebSocket: StandInSocket });
  }, LIVE_WORDS);
}

// Choose live turns in Settings
async function chooseLive(page: Page): Promise<void> {
  // This month's usage, stood in (Settings asks once a passphrase is saved; decision 122)
  await page.route("**/api/usage", (route) => route.fulfill({ json: { month: "2026-10", live: { used: 0, limit: 150, left: 150, setUp: false }, call: { used: 0, limit: 60, left: 60, setUp: false }, voiceCharacters: { turbo: 0, v4: 0 }, lines: 0, conversationMinutes: { used: 0, limit: 150 } } }));
  // Settings
  await page.goto("/settings");
  // Live
  await page.getByRole("button", { name: "Live (beta)" }).click();
  // Saved
  await expect(page.getByRole("button", { name: "Live (beta)" })).toHaveAttribute("aria-pressed", "true");
}

// The welcome seen and the passphrase saved, before each check
test.beforeEach(async ({ page }) => {
  // Settled
  await page.addInitScript(() => {
    // Seen
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // The passphrase
    localStorage.setItem("voicelab-passphrase", "a long passphrase for testing");
  });
});

// The live service ends the turn: the reply is asked for with the words it heard, silence was sent while Maya talked, and ending closes the socket cleanly and settles the minutes
test("a live turn ends when the streaming service says so, then she replies", async ({ page }) => {
  // The stand-in microphone (a steady tone) and recognition (different words)
  await useStandIns(page);
  // The stand-in streaming server
  await useStreamingStandIn(page);
  // The bodies the conversation route was sent, and the live routes' calls
  const sent: Array<{ turns: Array<{ who: string; text: string }> }> = [];
  // (live)
  const live: string[] = [];
  // The live route: a token
  await page.route("**/api/live", (route) => {
    // Noted
    live.push("start");
    // Granted
    return route.fulfill({ json: { kind: "a", token: "stand-in-token", grantedSeconds: 300, minutesLeft: 145, minutesPerMonth: 150 } });
  });
  // The settle route
  await page.route("**/api/live/end", (route) => {
    // Noted, with the seconds
    live.push(`end:${(JSON.parse(route.request().postData() ?? "{}") as { seconds: number }).seconds}`);
    // Done
    return route.fulfill({ json: { refunded: 4 } });
  });
  // The conversation route: the opening, then a reply
  await page.route("**/api/conversation", (route) => {
    // Settings' minutes check: nothing to note
    if (route.request().method() !== "POST") return route.fulfill({ json: { minutesUsed: 0, minutesPerMonth: 150, minutesLeft: 150 } });
    // Noted
    sent.push(JSON.parse(route.request().postData() ?? "{}") as { turns: Array<{ who: string; text: string }> });
    // Answered
    return route.fulfill({ json: { text: sent.length === 1 ? "Hi! I'm Maya." : "Climbing! Indoors or out?", audio: null, goodbye: false } });
  });
  // Live chosen
  await chooseLive(page);
  // Maya
  await page.goto("/conversations/talk?id=maya");
  // Start
  await page.getByRole("button", { name: "Start" }).click();
  // Live, on your turn
  await expect(page.locator("[data-live-turn]")).toBeVisible({ timeout: 20_000 });
  // Her reply, with no tap on Done
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Climbing! Indoors or out?", { timeout: 20_000 });
  // End the conversation
  await page.getByRole("button", { name: "End conversation" }).click();
  // Saved and on the results
  await expect(page).toHaveURL(/\/sessions\?id=/, { timeout: 20_000 });
  // What the stand-in saw
  const seen = await page.evaluate(() => (window as unknown as { liveSeen: { urls: string[]; silentMs: number; terminated: boolean } }).liveSeen);
  // The reply asked with the live words; the token in the address; silence sent while she talked; ended cleanly; settled
  expect([sent[1]?.turns.at(-1)?.text, new URL(seen.urls[0]!).searchParams.get("token"), seen.silentMs > 0, seen.terminated, live[0], live.some((call) => call.startsWith("end:"))]).toEqual([LIVE_WORDS, "stand-in-token", true, true, "start", true]);
});

// Over the month's minutes: one plain line, and the turn ends on the phone instead
test("over the live budget, turns end automatically with one line saying why", async ({ page }) => {
  // The stand-in microphone falls quiet after three seconds, so the phone ends the turn
  await useStandIns(page, "browser words here", { speakMs: 3_000 });
  // The stand-in streaming server (never used)
  await useStreamingStandIn(page);
  // The live route, stood in inside the page (a refusal through the network would log a failed request): out of minutes
  await page.addInitScript(() => {
    // The real network
    const real = window.fetch.bind(window);
    // The live route answered here; everything else as usual
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => (String(input instanceof Request ? input.url : input).endsWith("/api/live") ? new Response(JSON.stringify({ error: "This month’s live minutes are used up.", budget: true, minutesLeft: 0 }), { status: 429, headers: { "content-type": "application/json" } }) : real(input, init));
  });
  // The bodies the conversation route was sent
  const sent: Array<{ turns: Array<{ who: string; text: string }> }> = [];
  // The conversation route
  await page.route("**/api/conversation", (route) => {
    // Settings' minutes check: nothing to note
    if (route.request().method() !== "POST") return route.fulfill({ json: { minutesUsed: 0, minutesPerMonth: 150, minutesLeft: 150 } });
    // Noted
    sent.push(JSON.parse(route.request().postData() ?? "{}") as { turns: Array<{ who: string; text: string }> });
    // Answered
    return route.fulfill({ json: { text: sent.length === 1 ? "Hi! I'm Maya." : "Oh nice.", audio: null, goodbye: false } });
  });
  // Live chosen
  await chooseLive(page);
  // Maya
  await page.goto("/conversations/talk?id=maya");
  // Start
  await page.getByRole("button", { name: "Start" }).click();
  // The line
  await expect(page.getByText("This month’s live minutes are used up, so turns end automatically.")).toBeVisible({ timeout: 20_000 });
  // The phone's countdown runs instead
  await expect(page.locator("[data-turn-cue]")).toBeVisible({ timeout: 20_000 });
  // Her reply, with the browser's words
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Oh nice.", { timeout: 20_000 });
  // No socket was opened
  expect([sent[1]?.turns.at(-1)?.text, await page.evaluate(() => (window as unknown as { liveSeen: { urls: string[] } }).liveSeen.urls.length)]).toEqual(["browser words here", 0]);
});
