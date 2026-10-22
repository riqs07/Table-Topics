// @vitest-environment jsdom
// Focus first on a take's page (decision 115): a short take shows its pitch in the words and "Look closer", a long take its fingerprint, the lens tabs, its best moment and its energy arc, a pause drill only its pauses, a story its shape, a conversation its timeline; each lens and its fallbacks (no deeper analysis, a trimmed take, no words); History's tiny fingerprints and the usual zone
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens and pieces being checked
import { SessionScreen } from "@/components/screens/SessionScreen";
import { HistoryContent } from "@/components/screens/HistoryScreen";
import { UsualZone } from "@/components/script/UsualZone";
import { MiniFingerprint } from "@/components/script/MiniFingerprint";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the analysis builder and the fingerprint backfill
import { buildAnalysis } from "@/core/analysis/analysis";
import { backfillFingerprints } from "@/data/fingerprints";
import { sessionMiniFingerprint } from "@/core/fingerprint";
import { findMetric } from "@/core/analysis/metrics";
// Load the made-up takes
import { madeSession, makeTake, ZOO_PHRASES, type MadeTake, type SaidPhrase } from "../support/pitchTake";
// Load the record types
import type { FullSession } from "@/data/records";

// A fixed "now"
const NOW = new Date(2026, 9, 21, 18);
// The zoo story, gliding
const zoo = makeTake(ZOO_PHRASES, { glide: true });
// A phrase with a beat before "stole", and the rest of the line
const BEAT: SaidPhrase[] = [{ words: [{ text: "and", step: 0 }, { text: "a", step: 0 }, { text: "seagull", step: 0.5 }], pauseAfter: 0.7 }, { words: [{ text: "stole", step: 7, level: 0.35 }, { text: "it", step: 1 }, { text: "right", step: 0.5 }, { text: "out", step: 0.4 }, { text: "of", step: 0.2 }, { text: "my", step: 0 }, { text: "hand.", step: -1, to: -4 }], pauseAfter: 1 }];
// The zoo story with an "um" before the gorilla
const withUm = makeTake(ZOO_PHRASES.map((phrase, index) => (index === 3 ? { ...phrase, words: [phrase.words[0]!, { text: "um", step: -0.5 }, ...phrase.words.slice(1)] } : phrase)), { glide: true });
// A three-minute speech: the zoo story and the beat, again and again
const long = makeTake(Array.from({ length: 8 }, () => [...ZOO_PHRASES, ...BEAT]).flat(), { glide: true });

// Remove the drawn screen after each check
afterEach(() => {
  // Drawn screens
  cleanup();
  // Stand-ins
  vi.restoreAllMocks();
});

// Recordings get a stand-in address in this test browser
beforeEach(() => {
  // A fixed address for any recording
  Object.assign(URL, { createObjectURL: vi.fn(() => "blob:take"), revokeObjectURL: vi.fn() });
});

// A repository holding takes, each with a recording, with the service's words for the ones named
async function repositoryWith(sessions: ReadonlyArray<FullSession>, deep: Readonly<Record<string, MadeTake>> = {}): Promise<Repository> {
  // An empty store
  const repository = createRepository(new MemoryStore());
  // Each take
  for (const session of sessions) {
    // Saved with its readings
    await repository.saveSession(session);
    // Its recording
    if (session.audioKey) await repository.saveAudio(session.audioKey, new Blob(["voice"]));
    // The service's words, with an unsure word or two
    if (deep[session.id]) await repository.saveAnalysis({ ...buildAnalysis(session, NOW), server: { transcript: { engine: "stand-in", text: "", words: deep[session.id]!.serverWords.map((word) => ({ ...word, conf: word.w === "stared" || word.w === "stole" ? 0.4 : 0.95 })), at: NOW.toISOString() }, voice: null } });
  }
  // Hand it back
  return repository;
}

describe("a short take", () => {
  // A 40-second Rapid Fire answer
  it("shows only the pitch in the words and Look closer, then the tabs in place", async () => {
    // Playing is stood in
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    // The zoo story as a Rapid Fire answer, with an "um"
    const session = madeSession("short", withUm, { mode: "talk", promptId: "t001", audioKey: "audio-short" });
    // Drawn
    render(<SessionScreen sessionId="short" repository={await repositoryWith([session])} now={NOW} />);
    // The pitch in the words, and Look closer
    await screen.findByRole("region", { name: "Your voice" });
    // No tabs, no fingerprint, no best moment
    expect([await screen.findByRole("button", { name: "Look closer" }), screen.queryByRole("tablist"), document.querySelector("[data-fingerprint]"), document.querySelector("[data-best-moment]")].map(Boolean)).toEqual([true, false, false, false]);
    // Open them
    fireEvent.click(screen.getByRole("button", { name: "Look closer" }));
    // The tabs, on Pitch, without Clarity (no deeper analysis)
    expect(within(screen.getByRole("tablist")).getAllByRole("tab").map((tab) => [tab.textContent, tab.getAttribute("aria-selected")])).toEqual([["Pitch", "true"], ["Pauses and ums", "false"], ["Pace", "false"], ["Words", "false"]]);
    // And the quiet line about it
    expect(screen.getByText("Clarity needs deeper analysis (Settings, Coach and services).")).toBeTruthy();
    // The pauses
    fireEvent.click(screen.getByRole("tab", { name: "Pauses and ums" }));
    // Pills and counts
    expect(document.querySelectorAll("[data-pause]").length).toBeGreaterThan(2);
    // Tap the "um"
    const um = screen.getByRole("button", { name: /^um, 0:\d\d, play$/ });
    // Played from just before it
    fireEvent.click(um);
    // The recording moved there
    expect(document.querySelector("audio")!.currentTime).toBeGreaterThan(8);
  });

  // Each lens draws
  it("draws the pace and word-choice lenses, and a tapped word shows its explanation", async () => {
    // The take
    const session = madeSession("short", zoo, { mode: "talk", promptId: "t001", transcript: "so last saturday I kind of just went to the zoo and it was really good", spokenTimes: [1, 1.3, 2, 2.4, 2.7, 2.9, 3.2, 3.5, 3.7, 4, 4.3, 4.6, 4.8, 5.1, 5.5, 5.8] });
    // Drawn
    render(<SessionScreen sessionId="short" repository={await repositoryWith([session])} now={NOW} />);
    // Open
    fireEvent.click(await screen.findByRole("button", { name: "Look closer" }));
    // Pace
    fireEvent.click(screen.getByRole("tab", { name: "Pace" }));
    // The spaced words and the line
    expect([document.querySelectorAll("[data-pace]").length > 0, !!screen.getByRole("img", { name: /^Speaking speed across the take/ })]).toEqual([true, true]);
    // Words
    fireEvent.click(screen.getByRole("tab", { name: "Words" }));
    // Tap "kind of"
    fireEvent.click(screen.getByRole("button", { name: "kind of" }));
    // Its explanation
    expect(screen.getByRole("status").textContent).toContain("“kind of” softens what comes next.");
  });

  // Deeper analysis: the clarity tab
  it("offers the clarity lens with deeper analysis, linking the drill that fits", async () => {
    // The take with the service's words
    const session = madeSession("deep", zoo, { mode: "talk", promptId: "t001" });
    // Drawn
    render(<SessionScreen sessionId="deep" repository={await repositoryWith([session], { deep: zoo })} now={NOW} />);
    // Open on Clarity
    fireEvent.click(await screen.findByRole("button", { name: "Look closer" }));
    // Clarity
    fireEvent.click(screen.getByRole("tab", { name: "Clarity" }));
    // The two unsure words, the share and the drill
    expect([[...document.querySelectorAll("[data-unclear]")].map((word) => word.textContent), screen.getByText(/of your words came through clearly/).textContent, screen.getByRole("link", { name: /^Practise: Clear sounds/ }).getAttribute("href")]).toEqual([["stole", "stared"], expect.stringMatching(/^9\d% of your words came through clearly\. These two were harder to catch\.$/), "/voice/drill?id=c01"]);
  });
});

describe("a long take", () => {
  // A three-minute prepared speech
  it("shows the fingerprint at the top, the tabs open, the best moment and the energy arc", async () => {
    // Playing is stood in
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    // The speech
    const session = madeSession("long", long, { mode: "response", promptId: "p001", audioKey: "audio-long" });
    // Drawn
    render(<SessionScreen sessionId="long" repository={await repositoryWith([session], { long })} now={NOW} />);
    // The fingerprint, first among the views, with its headline and strip
    const print = await waitFor(() => {
      // The card, once drawn
      const card = document.querySelector<HTMLElement>("[data-fingerprint]");
      // Not yet
      if (!card) throw new Error("not drawn yet");
      // Hand it back
      return card;
    });
    // Its stretches and its plain headline
    expect([print.querySelectorAll("[data-stretch]").length > 10, within(print).getByRole("heading").textContent]).toEqual([true, expect.stringMatching(/\.$/)]);
    // At the top: before the tabs
    expect(print.compareDocumentPosition(screen.getByRole("tablist")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The tabs open on Pitch, with Clarity
    expect(within(screen.getByRole("tablist")).getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Pitch", "Pauses and ums", "Pace", "Words", "Clarity"]);
    // The best moment, with the beat before "stole"
    const moment = screen.getByRole("region", { name: "Your best moment" });
    // Its words
    expect(within(moment).getByText(/seagull… stole/)).toBeTruthy();
    // Play it
    fireEvent.click(within(moment).getByRole("button", { name: "Play your best moment" }));
    // The recording moved to its start
    expect(document.querySelector("audio")!.currentTime).toBeGreaterThan(0);
    // The energy arc
    expect(screen.getByRole("region", { name: "Energy" })).toBeTruthy();
    // No Look closer: the tabs are already open
    expect(screen.queryByRole("button", { name: "Look closer" })).toBeNull();
  });
});

describe("a drill", () => {
  // A pause drill
  it("shows only the pauses lens on a pause drill, with Look closer", async () => {
    // A pause drill take, with the phone's word times
    const session = madeSession("drill", zoo, { mode: "pause", promptId: "d001" });
    // Drawn
    render(<SessionScreen sessionId="drill" repository={await repositoryWith([session])} now={NOW} />);
    // The pauses lens under its own heading
    const lens = await screen.findByRole("region", { name: "Pauses and ums" });
    // Its counts and words
    expect(!!lens.querySelector("[data-lens='pauses']")).toBe(true);
    // No pitch section, no tabs
    expect([screen.queryByRole("region", { name: "Your voice" }), screen.queryByRole("tablist")]).toEqual([null, null]);
    // Look closer opens the tabs on Pauses
    fireEvent.click(screen.getByRole("button", { name: "Look closer" }));
    // Selected
    expect(screen.getByRole("tab", { name: "Pauses and ums" }).getAttribute("aria-selected")).toBe("true");
  });
});

describe("fallbacks", () => {
  // A trimmed take
  it("shows the older-take note, and Look closer still offers the words", async () => {
    // Its readings gone
    const session = madeSession("old", zoo, { mode: "talk", promptId: "t001", trimmedAt: "2026-09-01T00:00:00.000Z", pitch: undefined, loudness: undefined, spokenTimes: undefined });
    // Drawn
    render(<SessionScreen sessionId="old" repository={await repositoryWith([session])} now={NOW} />);
    // The note
    expect(await screen.findByText("Detailed charts aren’t kept for older takes. The words, numbers and feedback are all here.")).toBeTruthy();
    // Open
    fireEvent.click(screen.getByRole("button", { name: "Look closer" }));
    // Pauses are not kept
    fireEvent.click(screen.getByRole("tab", { name: "Pauses and ums" }));
    // Said
    expect(screen.getByText("Pauses aren’t kept for older takes.")).toBeTruthy();
    // Words still work
    fireEvent.click(screen.getByRole("tab", { name: "Words" }));
    // The words lens
    expect(document.querySelector("[data-lens='words']")).toBeTruthy();
  });

  // No words
  it("says no words were caught in the word lens", async () => {
    // Nothing caught
    const session = madeSession("quiet", zoo, { mode: "talk", promptId: "t001", transcript: "", spokenTimes: [] });
    // Drawn
    render(<SessionScreen sessionId="quiet" repository={await repositoryWith([session])} now={NOW} />);
    // Open
    fireEvent.click(await screen.findByRole("button", { name: "Look closer" }));
    // Words
    fireEvent.click(screen.getByRole("tab", { name: "Words" }));
    // Said
    expect(screen.getByText("No words were caught.")).toBeTruthy();
  });
});

describe("a story and a conversation", () => {
  // A story's shape
  it("shows a told story's shape strip from the coach's beats", async () => {
    // The story, with the coach's beats
    const session = madeSession("story", zoo, { mode: "story", promptId: "sp01", feedback: { keep: "k", change: "c", retryCue: "r", story: { beats: [{ beat: "turn", quote: "and a seagull stole it" }, { beat: "meaning", quote: "since then I always eat" }], yours: "", better: "" } } });
    // Drawn
    render(<SessionScreen sessionId="story" repository={await repositoryWith([session])} now={NOW} />);
    // The strip
    const strip = await screen.findByRole("region", { name: "Story shape" });
    // Its parts and source
    expect([[...strip.querySelectorAll("[data-part]")].map((part) => part.getAttribute("data-part")), !!within(strip).getByText("From the beats the coach heard.")]).toEqual([["setup", "turn", "point"], true]);
  });

  // A conversation's timeline
  it("shows a conversation's turns in two lanes", async () => {
    // A conversation
    const session: FullSession = { ...madeSession("talk", zoo), mode: "conversation", promptId: "maya", conversation: { turns: [{ who: "them", text: "Hi there!", seconds: 2 }, { who: "you", text: "hi how are you", seconds: 4 }, { who: "them", text: "Good thanks.", seconds: 2 }] } };
    // Drawn
    render(<SessionScreen sessionId="talk" repository={await repositoryWith([session])} now={NOW} />);
    // The timeline
    const timeline = await screen.findByRole("region", { name: /^The turns/ });
    // Three turns and one question
    expect([timeline.querySelectorAll("[data-turn]").length, timeline.querySelectorAll("[data-question]").length]).toEqual([3, 1]);
  });
});

describe("History and Your progress", () => {
  // Tiny fingerprints from the session list
  it("draws each take's tiny fingerprint in its History row, and backfills older takes", async () => {
    // A take saved before decision 115 (no fingerprint), and one with
    const older = madeSession("older", zoo, { mode: "talk", promptId: "t001" });
    // (with)
    const newer = madeSession("newer", zoo, { mode: "talk", promptId: "t002", createdAt: "2026-10-21T09:00:00.000Z", fingerprint: sessionMiniFingerprint({ transcript: zoo.transcript, loudness: zoo.loudness, spokenTimes: zoo.spokenTimes }) });
    // Saved
    const repository = await repositoryWith([older, newer]);
    // Backfilled at idle
    expect(await backfillFingerprints(repository, { pause: async () => {} })).toBe(1);
    // Running it again changes nothing
    expect(await backfillFingerprints(repository, { pause: async () => {} })).toBe(0);
    // History
    render(<HistoryContent repo={repository} today={NOW} />);
    // Both rows carry a shape
    await waitFor(() => expect(document.querySelectorAll("[data-mini-fingerprint]").length).toBe(2));
  });

  // A damaged value draws nothing
  it("draws nothing for a damaged tiny fingerprint", () => {
    // Drawn
    const { container } = render(<MiniFingerprint value={{ v: 1, bins: [3] }} />);
    // Empty
    expect(container.innerHTML).toBe("");
  });

  // The usual zone
  it("draws the usual band and the latest take with neutral words", () => {
    // Pace above the usual band
    render(<UsualZone metrics={[{ metric: findMetric("lang.wpm")!, source: "device", count: 9, usual: 140, recent: 170, latest: 175, spread: 10, trend: "up", verdict: "changed", best: null, flag: null }]} />);
    // The words and the picture
    expect([screen.getByText(/175 words\/min · faster than usual/), screen.getByRole("img", { name: /^Your usual overall pace/ })].every(Boolean)).toBe(true);
  });
});
