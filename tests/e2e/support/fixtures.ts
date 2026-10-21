// Shared set-up for the browser checks: stand-in microphone and speech, and a console that must stay clean
import { test as base, expect, type Page } from "@playwright/test";

// What the stand-in speech recognition "hears", a word at a time
export const SPOKEN = "Um so the best part of my week was uh walking home and seeing a tiny dog in a raincoat";

// A story the stand-in speech "tells" (decision 92): a start in the action, a detail, a turn, someone's words, a feeling and an ending on the point
export const STORY_SPOKEN = "The train stopped dead outside Reading at six but then the guard came through and she goes don't worry love two minutes and I was so relieved since then I always carry a charger";

// The coach's reply for a told story, stood in (the story schema: feedback with beats and one line made better, the rubric with the story scores; decision 92)
export const STORY_COACH_REPLY = {
  // What the route sends back
  feedback: {
    // One thing that worked
    keep: "You opened right in the action: “the train stopped dead”.",
    // One change
    change: "Give the guard's line its own moment: pause, then say her words.",
    // The cue for the next telling
    retryCue: "Slow down at the guard's words.",
    // The story notes
    story: { beats: [{ beat: "setting", quote: "outside Reading" }, { beat: "turn", quote: "but then the guard came through" }, { beat: "meaning", quote: "since then I always carry a charger" }], yours: "she goes don't worry love two minutes", better: "Then the guard leans in: “Don't worry, love. Two minutes.” [how you felt]" },
  },
  // The internal rubric with the story scores
  rubric: { pointFirst: { score: 2, quote: "the train stopped" }, answersQuestion: { score: 3, quote: "the train stopped" }, structure: { score: 2, quote: "" }, ending: { score: 3, quote: "since then" }, concreteExample: { score: 3, quote: "Reading" }, wordChoice: { score: 2, quote: "stopped dead" }, devices: ["story"], unnecessaryHedges: 0, wordSwaps: [], model: "stand-in", story: { hook: { score: 3, quote: "the train stopped dead" }, stakes: { score: 2, quote: "" }, detail: { score: 3, quote: "Reading" }, dialogue: { score: 2, quote: "she goes" }, turn: { score: 2, quote: "but then" }, point: { score: 3, quote: "since then" } } },
};

// A guided zoo story the stand-in speech "tells" (decision 93): every fact kept, with a detail, a turn, someone's words, a feeling and a point added
export const GUIDED_SPOKEN = "The hot dog was sticky with mustard at the zoo on Saturday but the gorilla was staring right at me and she goes don't move and I was terrified and since then I always eat before I see a gorilla";

// The coach's reply for a guided story, stood in: the story reply plus what was brought to life beyond the facts, and the seventh story score (decision 93)
export const GUIDED_COACH_REPLY = {
  // What the route sends back
  feedback: {
    // One thing that worked
    keep: "The mustard makes the hot dog real: “sticky with mustard”.",
    // One change
    change: "Slow down when the gorilla stares: give that moment a beat of silence.",
    // The cue for the next telling
    retryCue: "Pause when the gorilla looks at you.",
    // The story notes, with what was brought to life
    story: { beats: [{ beat: "setting", quote: "at the zoo on Saturday" }, { beat: "turn", quote: "but the gorilla was staring right at me" }, { beat: "meaning", quote: "since then I always eat before I see a gorilla" }], yours: "the gorilla was staring right at me", better: "Then the gorilla stops chewing and stares right at me. [what you did next]", broughtToLife: "You added the mustard, Saturday and how scared you were; the gorilla itself is still as flat as the fact." },
  },
  // The internal rubric with the story scores, the guided one too
  rubric: { ...STORY_COACH_REPLY.rubric, story: { ...STORY_COACH_REPLY.rubric.story, alive: { score: 2, quote: "sticky with mustard" } } },
};

// Stand in for the coach on guided stories: every feedback request gets the guided reply
export async function useGuidedCoach(page: Page): Promise<void> {
  // Answer the feedback route with the guided reply
  await page.route("**/api/feedback", (route) => route.fulfill({ json: GUIDED_COACH_REPLY }));
}

// Stand in for the coach on told stories: every feedback request gets the story reply
export async function useStoryCoach(page: Page): Promise<void> {
  // Answer the feedback route with the story reply
  await page.route("**/api/feedback", (route) => route.fulfill({ json: STORY_COACH_REPLY }));
}

// Every page the app has, as a user would type it in (rule T5: load each one directly)
export const ROUTES: ReadonlyArray<string> = [
  // Today
  "/",
  // Practice
  "/practice",
  // Your voice, the warm-up, a voice drill, shadowing, and a drill that does not exist (decision 80)
  "/voice",
  "/voice/warmup",
  "/voice/drill?id=p04",
  "/voice/shadow?id=s01",
  "/voice/drill?id=missing",
  // The old Lessons and Library addresses, which now lead to Skills
  "/lessons",
  "/library",
  // Skills
  "/skills",
  // Talks
  "/rehearse",
  // Every Connect unit (the old Connect address, a redirect to Learn from decision 66 until decision 95)
  "/small-talk",
  // History
  "/history",
  // Settings
  "/settings",
  // Your speaking profile, and one take's measures for a take that does not exist (decision 90)
  "/profile",
  "/profile?session=missing",
  // A small-talk question, and a small-talk lesson
  "/session?mode=smalltalk&prompt=st01",
  "/session?mode=smalltalk&prompt=stl3",
  // Responding to news
  "/session?mode=smalltalk&prompt=sn01",
  // A moment note
  "/session?mode=moment&prompt=moment",
  // Talk with someone, a conversation, and a person who does not exist (decision 83)
  "/conversations",
  "/conversations/talk?id=maya",
  "/conversations/talk?id=missing",
  // Learn, a card, and the review
  "/learn",
  "/learn/card?id=body-93",
  // Quick scenarios, and a card with a scenario
  "/learn/scenarios",
  // A Learn set
  "/learn/set?id=warmth",
  // The new sets' pages, the corrected vocal fry card, and the old fry card's address, which opens it (decision 94)
  "/learn/set?id=stories",
  "/learn/set?id=words",
  "/learn/card?id=voice-fry-mixed",
  "/learn/card?id=voice-fry",
  "/learn/card?id=profile-trends",
  // Telling a story, started from a Learn card's link with a shape and a focus
  "/stories/tell?prompt=sp04&shape=then-now&focus=middle",
  // A small-talk unit
  "/small-talk/unit?id=news",
  // The units added in decision 95, a drill of each and a lesson
  "/small-talk/unit?id=room",
  "/small-talk/unit?id=starting",
  "/small-talk/unit?id=deeper",
  "/session?mode=smalltalk&prompt=sr01",
  "/session?mode=smalltalk&prompt=se01",
  "/session?mode=smalltalk&prompt=sd01",
  "/session?mode=smalltalk&prompt=srl5",
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
  // An opening drill
  "/session?mode=bookend&prompt=b001",
  // A full speech's page
  "/speech?id=jfk-inaugural",
  // A speech that does not exist
  "/speech?id=missing",
  // A part of a full speech, to read
  "/session?mode=read&prompt=jfk-inaugural-2",
  // Stories, setting up a story, a moment that does not exist, and telling one (decision 92)
  "/stories",
  "/stories/tell?prompt=sp01",
  "/stories/tell?moment=missing",
  "/session?mode=story&prompt=sp01&shape=but-therefore&focus=dialogue&length=short",
  // A guided story set up and told (decision 93)
  "/stories/tell?prompt=gs13",
  "/session?mode=story&prompt=gs13&shape=classic&focus=middle&length=short",
  // The weekly check-in: its page, the check-in itself, the comparison, and a comparison of check-ins that do not exist (decision 100)
  "/check-in",
  "/check-in/run",
  "/check-in/compare",
  "/check-in/compare?a=ci-1999-01-01&b=missing",
  // A check-in part, opened directly
  "/session?mode=outline&prompt=ci-pitch&checkin=ci-2026-10-13&part=pitch",
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
  // A small-talk unit belongs to Practice (Connect folded into Learn and Practice, decision 66)
  { path: "/small-talk/unit?id=answering", current: "Practice" },
  // Every Connect unit (decision 95)
  { path: "/small-talk", current: "Practice" },
  // Talk with someone belongs to Practice (decision 83)
  { path: "/conversations", current: "Practice" },
  // Learn marks Learn
  { path: "/learn", current: "Learn" },
  // History lives in Settings, so no tab is marked
  { path: "/history", current: null },
  // Settings marks nothing in the tab bar (its gear is marked instead)
  { path: "/settings", current: null },
  // The speaking profile lives in Settings (decision 90)
  { path: "/profile", current: null },
  // A saved-session page that does not exist still offers the way out
  { path: "/sessions?id=missing", current: null },
  // A talk's page belongs to Practice
  { path: "/talk?id=missing", current: "Practice" },
  // Openings and closings belong to Practice
  { path: "/bookends", current: "Practice" },
  // Stories belong to Practice (decision 92)
  { path: "/stories", current: "Practice" },
  // Your check-ins and their comparison belong to Today (decision 100)
  { path: "/check-in", current: "Today" },
  // (the comparison)
  { path: "/check-in/compare", current: "Today" },
  // A full speech belongs to Skills, a page inside Practice
  { path: "/speech?id=jfk-inaugural", current: "Practice" },
];

// Where each main navigation link should lead
export const NAV_LINKS: ReadonlyArray<{ name: string; path: string }> = [
  // Today
  { name: "Today", path: "/" },
  // Practice
  { name: "Practice", path: "/practice" },
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
