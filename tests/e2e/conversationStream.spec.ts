// Browser check for a streamed reply (decision 102): a stand-in streaming server, inside the page in place of the network (the browser checks cannot send a page's request to another server), sends the persona's line in two pieces with a pause between; the first piece must start playing before the line has finished arriving, and the pieces must play in order on the shared player
import { readFileSync } from "node:fs";
// Load the checks' own test, stand-ins and expect
import { expect, test, useStandIns } from "./support/fixtures";

// Two real recordings of different sizes, as the two pieces' audio
const [FIRST, SECOND] = ["public/clips/maya-01.mp3", "public/clips/maya-02.mp3"].map((path) => readFileSync(path));

// The first piece plays before the line has finished arriving, and the pieces play in order
test("a streamed reply starts playing before it has all arrived", async ({ page }) => {
  // The stand-ins, with a steady tone (the turn waits)
  await useStandIns(page);
  // The welcome seen, and the passphrase saved so lines are written
  await page.addInitScript(() => {
    // Seen
    localStorage.setItem("voicelab-welcome-seen", "yes");
    // The passphrase
    localStorage.setItem("voicelab-passphrase", "a long passphrase for testing");
  });
  // Note each recording made from the reply's audio (by its size) and when each starts playing
  await page.addInitScript(() => {
    // Sizes by address
    const sizes = new Map<string, number>();
    // The real address maker
    const make = URL.createObjectURL.bind(URL);
    // Noted, then made
    URL.createObjectURL = (object: Blob | MediaSource) => {
      // The address
      const url = make(object);
      // Its size, for a file
      if (object instanceof Blob) sizes.set(url, object.size);
      // Handed back
      return url;
    };
    // The plays seen
    const plays: Array<{ size: number; at: number }> = [];
    // Kept where the check can read it
    (window as unknown as { plays: typeof plays }).plays = plays;
    // The real play
    const play = HTMLMediaElement.prototype.play;
    // Noted, then played
    HTMLMediaElement.prototype.play = function noted(this: HTMLMediaElement) {
      // Only the reply's audio (made from a file)
      const size = sizes.get(this.src);
      // Noted with the time
      if (size !== undefined) plays.push({ size, at: Date.now() });
      // Played
      return play.call(this);
    };
  });
  // The stand-in streaming server: the conversation route answers with one piece at once, the second after two and a half seconds, then the end, noting when each was sent
  await page.addInitScript(({ first, second }: { first: string; second: string }) => {
    // The real network
    const real = window.fetch.bind(window);
    // When each part was sent
    const sentAt: Record<string, number> = {};
    // Kept where the check can read it
    (window as unknown as { sentAt: typeof sentAt }).sentAt = sentAt;
    // The conversation route stood in; everything else as usual
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      // Not the conversation route
      if (!String(input instanceof Request ? input.url : input).includes("/api/conversation")) return real(input, init);
      // Text to bytes
      const encoder = new TextEncoder();
      // One line of the stream
      const line = (event: unknown) => encoder.encode(`${JSON.stringify(event)}\n`);
      // The stream
      const body = new ReadableStream<Uint8Array>({
        // Sent over time
        start(controller) {
          // The first piece at once
          controller.enqueue(line({ type: "segment", index: 0, text: "Oh hi there!", audio: first }));
          // Noted
          sentAt.first = Date.now();
          // The rest after a pause
          setTimeout(() => {
            // The second piece
            controller.enqueue(line({ type: "segment", index: 1, text: "I'm Maya, I just joined design.", audio: second }));
            // The end
            controller.enqueue(line({ type: "done", text: "Oh hi there! I'm Maya, I just joined design.", goodbye: false }));
            // Noted
            sentAt.done = Date.now();
            // Closed
            controller.close();
          }, 2_500);
        },
      });
      // The reply
      return new Response(body, { status: 200, headers: { "content-type": "application/x-ndjson" } });
    };
  }, { first: FIRST!.toString("base64"), second: SECOND!.toString("base64") });
  // Maya
  await page.goto("/conversations/talk?id=maya");
  // Start
  await page.getByRole("button", { name: "Start" }).click();
  // The first piece shows while the rest is still on its way
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Oh hi there!", { timeout: 10_000 });
  // Then the whole line
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Oh hi there! I'm Maya, I just joined design.", { timeout: 15_000 });
  // Both pieces played
  await expect.poll(() => page.evaluate(() => (window as unknown as { plays: unknown[] }).plays.length), { timeout: 15_000 }).toBe(2);
  // The plays, and when the end was sent
  const [plays, sentAt] = await page.evaluate(() => [(window as unknown as { plays: Array<{ size: number; at: number }> }).plays, (window as unknown as { sentAt: Record<string, number> }).sentAt] as const);
  // In order (first piece's recording, then the second's), and the first began before the line finished arriving
  expect([plays.map((played) => played.size), plays[0]!.at < sentAt.done!]).toEqual([[FIRST!.length, SECOND!.length], true]);
});
