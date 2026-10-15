// Shared set-up for the browser checks: stand-in microphone and speech, and a console that must stay clean
import { test as base, expect, type Page } from "@playwright/test";

// What the stand-in speech recognition "hears", a word at a time
export const SPOKEN = "Um so the best part of my week was uh walking home and seeing a tiny dog in a raincoat";

// Every page the app has, as a user would type it in (rule T5: load each one directly)
export const ROUTES: ReadonlyArray<string> = [
  // Home
  "/",
  // Skill path
  "/lessons",
  // Practice library
  "/library",
  // Rehearse my talk
  "/rehearse",
  // History
  "/history",
  // Settings
  "/settings",
  // A Table Topic
  "/session?mode=talk&prompt=t001",
  // A prepared response
  "/session?mode=response&prompt=p001",
  // A reading from the library
  "/session?mode=read&prompt=r001",
  // A pause drill
  "/session?mode=pause&prompt=d001",
  // A lesson
  "/session?mode=lesson&prompt=l001",
  // A rehearsal of a talk that does not exist
  "/session?mode=rehearse&prompt=missing",
  // A session that does not exist
  "/sessions?id=missing",
  // A talk's page for a talk that does not exist
  "/talk?id=missing",
  // Openings and closings
  "/bookends",
  // An opening drill
  "/session?mode=bookend&prompt=b001",
  // The design style tile
  "/style",
  // The wireframes
  "/wireframes",
];

// Pages that carry the main navigation, with the section each one marks as current
export const NAV_PAGES: ReadonlyArray<{ path: string; current: string | null }> = [
  // Home marks Home
  { path: "/", current: "Home" },
  // Lessons marks Lessons
  { path: "/lessons", current: "Lessons" },
  // Library marks Library
  { path: "/library", current: "Library" },
  // Rehearse marks Rehearse
  { path: "/rehearse", current: "Rehearse" },
  // History marks History
  { path: "/history", current: "History" },
  // Settings marks Settings
  { path: "/settings", current: "Settings" },
  // A session before recording marks nothing
  { path: "/session?mode=response&prompt=p001", current: null },
  // A saved-session page that does not exist still offers the way out
  { path: "/sessions?id=missing", current: null },
  // A talk's page belongs to Rehearse
  { path: "/talk?id=missing", current: "Rehearse" },
  // So do openings and closings
  { path: "/bookends", current: "Rehearse" },
];

// Where each main navigation link should lead
export const NAV_LINKS: ReadonlyArray<{ name: string; path: string }> = [
  // Home
  { name: "Home", path: "/" },
  // Lessons
  { name: "Lessons", path: "/lessons" },
  // Library
  { name: "Library", path: "/library" },
  // Rehearse
  { name: "Rehearse", path: "/rehearse" },
  // History
  { name: "History", path: "/history" },
  // Settings
  { name: "Settings", path: "/settings" },
];

// Replace the microphone and speech recognition before any page script runs
export async function useStandIns(page: Page): Promise<void> {
  // Runs inside the browser on every page load
  await page.addInitScript((spoken: string) => {
    // The words, one at a time
    const words = spoken.split(" ");
    // A stand-in for the browser's speech recognition that "hears" one word every quarter second
    class StandInRecognition {
      // Handlers the app sets
      onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null = null;
      // Called when recognition ends
      onend: (() => void) | null = null;
      // Called on a recognition problem
      onerror: ((event: { error: string }) => void) | null = null;
      // Whether to keep listening (set by the app)
      continuous = false;
      // Whether to report partial words (set by the app)
      interimResults = false;
      // Language (set by the app)
      lang = "en-US";
      // The word timer
      private timer: ReturnType<typeof setInterval> | undefined;
      // Start "hearing" words
      start(): void {
        // How many words so far
        let count = 0;
        // One word every 250 ms
        this.timer = setInterval(() => {
          // One more word
          count += 1;
          // Everything heard so far, as one result
          const result = Object.assign([{ transcript: words.slice(0, count).join(" ") }], { isFinal: count === words.length });
          // Tell the app
          this.onresult?.({ results: [result] });
          // Stop after the last word
          if (count >= words.length) clearInterval(this.timer);
        }, 250);
      }
      // Stop, then report the end as the real one does
      stop(): void {
        // No more words
        clearInterval(this.timer);
        // End shortly after, like the browser
        setTimeout(() => this.onend?.(), 50);
      }
      // Abort behaves like stop
      abort(): void {
        // Same as stop
        this.stop();
      }
    }
    // Install the stand-in under both names browsers use
    Object.assign(window, { SpeechRecognition: StandInRecognition, webkitSpeechRecognition: StandInRecognition });
    // A stand-in microphone: a steady tone, so the level meter and pause finder have sound to read
    navigator.mediaDevices.getUserMedia = async () => {
      // An audio graph
      const context = new AudioContext();
      // Where the tone goes, as a stream
      const destination = context.createMediaStreamDestination();
      // The tone
      const tone = context.createOscillator();
      // Connect and start it
      tone.connect(destination);
      // Start the tone
      tone.start();
      // Hand the stream to the app
      return destination.stream;
    };
  }, SPOKEN);
}

// The checks' own "test", which fails any check whose page logged an error (rule T5)
export const test = base.extend<{ consoleErrors: string[] }>({
  // Collect errors for every check automatically
  consoleErrors: [
    async ({ page }, use) => {
      // Errors seen so far
      const errors: string[] = [];
      // Console errors from the app
      page.on("console", (message) => {
        // Only errors count
        if (message.type() === "error") errors.push(message.text());
      });
      // Uncaught exceptions
      page.on("pageerror", (error) => errors.push(error.message));
      // Run the check
      await use(errors);
      // Then require a clean console
      expect(errors, "console errors").toEqual([]);
    },
    // Apply to every check without asking for it
    { auto: true },
  ],
});

// Re-export expect so checks import everything from here
export { expect };
