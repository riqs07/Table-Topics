// Shared set-up for the browser checks: stand-in microphone and speech, and a console that must stay clean
import { test as base, expect, type Page } from "@playwright/test";

// What the stand-in speech recognition "hears", a word at a time
export const SPOKEN = "Um so the best part of my week was uh walking home and seeing a tiny dog in a raincoat";

// Every page the app has, as a user would type it in (rule T5: load each one directly)
export const ROUTES: ReadonlyArray<string> = [
  // Today
  "/",
  // Practice
  "/practice",
  // The old Lessons and Library addresses, which now lead to Skills
  "/lessons",
  "/library",
  // Skills
  "/skills",
  // Talks
  "/rehearse",
  // Small talk
  "/small-talk",
  // History
  "/history",
  // Settings
  "/settings",
  // A small-talk question, and a small-talk lesson
  "/session?mode=smalltalk&prompt=st01",
  "/session?mode=smalltalk&prompt=stl3",
  // Responding to news
  "/session?mode=smalltalk&prompt=sn01",
  // A moment note
  "/session?mode=moment&prompt=moment",
  // Learn, a card, and the review
  "/learn",
  "/learn/card?id=body-93",
  "/learn/review",
  // Quick scenarios, and a card with a scenario
  "/learn/scenarios",
  // A Learn set
  "/learn/set?id=warmth",
  // A Connect unit
  "/small-talk/unit?id=news",
  "/learn/card?id=warm-good-news",
  // A mission debrief that does not exist (the page explains)
  "/mission?id=missing",
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
  // Q&A practice for a session that does not exist
  "/qa?from=missing",
  // An opening drill
  "/session?mode=bookend&prompt=b001",
  // A full speech's page
  "/speech?id=jfk-inaugural",
  // A speech that does not exist
  "/speech?id=missing",
  // A part of a full speech, to read
  "/session?mode=read&prompt=jfk-inaugural-2",
  // The design style tile
  "/style",
  // The wireframes
  "/wireframes",
];

// Pages that carry the main navigation, with the section each one marks as current
export const NAV_PAGES: ReadonlyArray<{ path: string; current: string | null }> = [
  // Today marks Today
  { path: "/", current: "Today" },
  // Practice marks Practice
  { path: "/practice", current: "Practice" },
  // Skills marks Skills
  { path: "/skills", current: "Practice" },
  // Your talks belong to Practice
  { path: "/rehearse", current: "Practice" },
  // Small talk marks Small talk
  { path: "/small-talk", current: "Connect" },
  // Learn marks Learn
  { path: "/learn", current: "Learn" },
  // History lives in Settings, so no tab is marked
  { path: "/history", current: null },
  // Settings marks nothing in the tab bar (its gear is marked instead)
  { path: "/settings", current: null },
  // A saved-session page that does not exist still offers the way out
  { path: "/sessions?id=missing", current: null },
  // A talk's page belongs to Practice
  { path: "/talk?id=missing", current: "Practice" },
  // Openings and closings belong to Practice
  { path: "/bookends", current: "Practice" },
  // A full speech belongs to Skills, a page inside Practice
  { path: "/speech?id=jfk-inaugural", current: "Practice" },
];

// Where each main navigation link should lead
export const NAV_LINKS: ReadonlyArray<{ name: string; path: string }> = [
  // Today
  { name: "Today", path: "/" },
  // Practice
  { name: "Practice", path: "/practice" },
  // Everyday conversation
  { name: "Connect", path: "/small-talk" },
  // Learn
  { name: "Learn", path: "/learn" },
  // Settings
  { name: "Settings", path: "/settings" },
];

// Replace the microphone and speech recognition before any page script runs (the stand-in "hears" the given words, by default SPOKEN)
export async function useStandIns(page: Page, spoken: string = SPOKEN): Promise<void> {
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
  }, spoken);
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
