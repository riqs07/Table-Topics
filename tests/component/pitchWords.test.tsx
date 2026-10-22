// @vitest-environment jsdom
// Load the test helpers from the test runner
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Load the tools for drawing a screen and finding things on it
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
// Load the screens and pieces being checked
import { SessionScreen } from "@/components/screens/SessionScreen";
import { PhraseRowsScreen, PHRASES_PER_PAGE } from "@/components/screens/PhraseRowsScreen";
import { ShadowCurve, TakeStress, TakeThickness } from "@/components/script/DrillCurves";
// Load the in-memory store and repository
import { MemoryStore } from "@/data/memoryStore";
import { createRepository, type Repository } from "@/data/repository";
// Load the analysis builder, to give a take the deeper analysis's words
import { buildAnalysis } from "@/core/analysis/analysis";
// Load the made-up takes
import { madeSession, makeTake, ZOO_AGAIN_PHRASES, ZOO_PHRASES, type SaidPhrase } from "../support/pitchTake";
// Load the record type
import type { FullSession } from "@/data/records";

// A fixed "now"
const NOW = new Date(2026, 9, 21, 18);
// The zoo story, told once
const zoo = makeTake(ZOO_PHRASES);
// And told again, with "me" now falling
const again = makeTake(ZOO_AGAIN_PHRASES);

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

// A repository holding the given takes, each with a recording, and optionally the deeper analysis's words for some
async function repositoryWith(sessions: ReadonlyArray<FullSession>, options: { exact?: ReadonlyArray<string>; withAudio?: boolean } = {}): Promise<Repository> {
  // An empty store
  const repository = createRepository(new MemoryStore());
  // Each take
  for (const session of sessions) {
    // Saved with its readings
    await repository.saveSession(session);
    // Its recording, when asked
    if (options.withAudio !== false && session.audioKey) await repository.saveAudio(session.audioKey, new Blob(["voice"]));
    // Its analysis, with the service's words when asked
    if (options.exact?.includes(session.id)) await repository.saveAnalysis({ ...buildAnalysis(session, NOW), server: { transcript: { engine: "stand-in", text: "", words: (session.id === "again" ? again : zoo).serverWords, at: NOW.toISOString() }, voice: null } });
  }
  // Hand it back
  return repository;
}

// Group the checks on pitch shown in the text, the standard voice view (decision 111)
describe("pitch in the text, on a take's page", () => {
  // Words lifted by their pitch, peaks bold, each phrase's ending marked, a rising statement highlighted, a flat phrase muted, up to three lines, and the way to the phrase rows
  it("shows the words with their pitch and the summary lines", async () => {
    // The zoo story, told with the phone's own word times
    const session = madeSession("zoo", zoo, { audioKey: "audio-zoo" });
    // Drawn
    render(<SessionScreen sessionId="zoo" repository={await repositoryWith([session])} now={NOW} />);
    // The voice section
    const section = await screen.findByRole("region", { name: "Your voice" });
    // The words, once worked out
    const text = await waitFor(() => section.querySelector("[data-pitch-text]")!);
    // The peaks, the endings, the flat phrase, and the rising word's highlight
    expect([[...text.querySelectorAll("[data-peak]")].map((word) => word.textContent), within(section).getAllByRole("img").map((icon) => icon.getAttribute("aria-label")), !!text.querySelector("[data-flat]"), !!text.querySelector(".bg-warm-tint")]).toEqual([["saturday", "hot", "stole", "me"], ["ending fell", "ending held", "ending fell", "ending rose", "ending held"], true, true]);
    // The lines: the rising statement, the flat line, the peaks, then the range
    expect(within(section).getAllByRole("listitem").map((item) => item.textContent).slice(0, 3)).toEqual(["To work on: “me” went up at the end of a statement, so it sounds unsure.", "The last line stayed flat, shown in grey. Lift one word to end with energy.", "Went well: Your peaks landed on saturday, hot and stole: words that carry the meaning."]);
    // The way to the phrase rows, a play button, and the quiet note that the word times are rough
    expect([within(section).getByRole("link", { name: "See it phrase by phrase" }).getAttribute("href"), !!within(section).getByRole("button", { name: "Play" }), !!within(section).getByText(/their places are rough/)]).toEqual(["/sessions/voice?id=zoo", true, true]);
  });

  // With the deeper analysis's words, the times are exact and the words keep their punctuation
  it("uses the deeper analysis's exact words when it ran", async () => {
    // The take with its analysis
    const session = madeSession("zoo", zoo);
    // Drawn
    render(<SessionScreen sessionId="zoo" repository={await repositoryWith([session], { exact: ["zoo"] })} now={NOW} />);
    // The words
    const section = await screen.findByRole("region", { name: "Your voice" });
    // As the service wrote them, and no "rough" note
    await waitFor(() => expect(section.querySelector("[data-pitch-text]")?.textContent).toContain("Saturday"));
    // Exact
    expect([section.querySelector("[data-pitch-text]")?.textContent?.includes("hot dog,"), within(section).queryByText(/their places are rough/)]).toEqual([true, null]);
  });

  // No words caught: the voice alone, with a plain line
  it("shows the pitch alone when no words were caught", async () => {
    // The take without its words
    const session = madeSession("zoo", zoo, { transcript: "", spokenTimes: [] });
    // Drawn
    render(<SessionScreen sessionId="zoo" repository={await repositoryWith([session])} now={NOW} />);
    // The curve and its note
    const section = await screen.findByRole("region", { name: "Your voice" });
    // Shown
    expect([!!within(section).getByRole("img", { name: "Your pitch across the take" }), !!within(section).getByText(/No words were caught/), within(section).queryByRole("link", { name: "See it phrase by phrase" })]).toEqual([true, true, null]);
  });

  // An older take whose readings were dropped shows the agreed note instead (decision 98)
  it("shows the note for an older take", async () => {
    // Its readings gone
    const session = madeSession("old", zoo, { trimmedAt: "2026-09-01T00:00:00.000Z", pitch: undefined, loudness: undefined, spokenTimes: undefined });
    // Drawn
    render(<SessionScreen sessionId="old" repository={await repositoryWith([session])} now={NOW} />);
    // The note, and no voice section
    expect([!!(await screen.findByText("Detailed charts aren’t kept for older takes. The words, numbers and feedback are all here.")), screen.queryByRole("region", { name: "Your voice" })]).toEqual([true, null]);
  });
});

// Group the checks on the phrase rows page
describe("phrase rows", () => {
  // Each phrase with its curve, ending and words; the pauses between; notes only where useful
  it("shows each phrase with its curve, pauses and notes", async () => {
    // The take, exact
    const session = madeSession("zoo", zoo, { audioKey: "audio-zoo" });
    // Drawn
    render(<PhraseRowsScreen sessionId="zoo" repository={await repositoryWith([session], { exact: ["zoo"] })} now={NOW} />);
    // The rows
    const rows = await waitFor(() => {
      // Each phrase
      const found = document.querySelectorAll("[data-phrase-row]");
      // All five
      expect(found.length).toBe(5);
      // Hand them back
      return [...found];
    });
    // The endings named, the pauses, a curve described for screen readers, and the notes
    expect([rows.map((row) => row.querySelector(".font-semibold")?.textContent), screen.getAllByText(/s pause$/).map((pause) => pause.textContent), screen.getAllByRole("img", { name: /^Pitch rises on “stole”, then falls at the end\./ }).length > 0, !!screen.getByText("Went up at the end of a statement, so it sounds like a question. Try letting “me” drop."), !!screen.getByText("Word timings from deeper analysis.")]).toEqual([["Fell", "Held: more to come", "Fell", "Rose", "Held: more to come"], ["0.8 s pause", "0.3 s pause", "1.1 s pause", "0.6 s pause"], true, true, true]);
  });

  // Tapping a word moves the recording there and plays it, and the word and phrase are highlighted
  it("plays from a tapped word", async () => {
    // Playing is stood in
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    // The take, exact
    const session = madeSession("zoo", zoo, { audioKey: "audio-zoo" });
    // Drawn
    render(<PhraseRowsScreen sessionId="zoo" repository={await repositoryWith([session], { exact: ["zoo"] })} now={NOW} />);
    // The word "stole", a button named with its time
    const stole = await screen.findByRole("button", { name: "stole, 0:06, play from here" });
    // Tapped
    fireEvent.click(stole);
    // The recording
    const audio = document.querySelector("audio")!;
    // Moved to the word's start and played; the phrase marked as current
    expect([audio.currentTime, play.mock.calls.length, document.querySelector("[data-current]")?.getAttribute("data-phrase-row")]).toEqual([zoo.serverWords.find((word) => word.w === "stole")!.s, 1, "2"]);
  });

  // Without the recording, the words are not buttons and the page says why
  it("explains when the recording is gone", async () => {
    // The take, its recording deleted
    const session = madeSession("zoo", zoo, { audioKey: null });
    // Drawn
    render(<PhraseRowsScreen sessionId="zoo" repository={await repositoryWith([session])} now={NOW} />);
    // The note, rough timings, and no word buttons
    expect([!!(await screen.findByText(/The recording isn’t kept any more/)), !!screen.getByText(/Rough word timings/), screen.queryByRole("button", { name: /play from here/ })]).toEqual([true, true, null]);
  });

  // A very long take shows its phrases a page at a time
  it("shows a long take's phrases a page at a time", async () => {
    // Sixty short phrases
    const long = makeTake(Array.from({ length: 60 }, (): SaidPhrase => ({ words: [{ text: "We", step: 0 }, { text: "kept", step: 2 }, { text: "going.", step: 0, to: -3 }], pauseAfter: 0.5 })));
    // The take
    const session = madeSession("long", long);
    // Drawn
    render(<PhraseRowsScreen sessionId="long" repository={await repositoryWith([session], {})} now={NOW} />);
    // The first page
    await waitFor(() => expect(document.querySelectorAll("[data-phrase-row]").length).toBe(PHRASES_PER_PAGE));
    // The rest, on request
    fireEvent.click(screen.getByRole("button", { name: "Show the next 20 phrases" }));
    // All shown
    expect(document.querySelectorAll("[data-phrase-row]").length).toBe(60);
  });

  // An older take, a missing take, and a store that cannot be read are each explained
  it("explains an older take, a missing take and a failed read", async () => {
    // An older take
    const old = madeSession("old", zoo, { trimmedAt: "2026-09-01T00:00:00.000Z", pitch: undefined });
    // Drawn
    const { unmount } = render(<PhraseRowsScreen sessionId="old" repository={await repositoryWith([old])} now={NOW} />);
    // The agreed note
    expect(!!(await screen.findByText(/Detailed charts aren’t kept for older takes/))).toBe(true);
    // Gone
    unmount();
    // A missing take
    const view = render(<PhraseRowsScreen sessionId="missing" repository={await repositoryWith([])} now={NOW} />);
    // Said, with the way back
    expect(!!(await screen.findByText(/This take is not on this device/))).toBe(true);
    // Gone
    view.unmount();
    // A store that cannot be read
    const broken = { ...createRepository(new MemoryStore()), getFullSession: async () => { throw new Error("The database connection is closing."); } };
    // Drawn
    render(<PhraseRowsScreen sessionId="zoo" repository={broken} now={NOW} />);
    // The reason
    expect((await screen.findByRole("alert")).textContent).toContain("The database connection is closing.");
  });
});

// Group the checks on planned stress and on last try and this try
describe("planned stress and last try", () => {
  // The stress lesson: each sentence with its key word circled, the highest point marked, and a line on where the lift went
  it("shows the stress lesson's targets", async () => {
    // Two sentences of the lesson, the first lifting "she" as planned, the second lifting "said" instead of "took"
    const words = (lift: string) => "I never said she took the money.".split(" ").map((text) => ({ text, step: text === lift ? 5 : 0, ...(text === "money." ? { to: -3 } : {}) }));
    // The take
    const take = makeTake([{ words: words("she"), pauseAfter: 0.6 }, { words: words("said"), pauseAfter: 0.6 }]);
    // Saved as the lesson, its script words read at the times heard
    const session = madeSession("lesson", take, { mode: "lesson", promptId: "l006", scriptTimes: take.spokenTimes });
    // Drawn
    render(<SessionScreen sessionId="lesson" repository={await repositoryWith([session])} now={NOW} />);
    // The card
    const card = await screen.findByRole("region", { name: "Did the key word get the lift?" });
    // Its circles, its lines and the count
    await waitFor(() => expect(card.querySelectorAll("[data-target]").length).toBe(2));
    // Checked
    expect([!!within(card).getByText("Your lift landed on “she”, as planned."), !!within(card).getByText("Your lift went to “said”. Lean on “took”, and let “said” stay low."), !!within(card).getByText("1 of 2 key words got your lift."), card.querySelectorAll("[data-top]").length]).toEqual([true, true, true, 2]);
  });

  // A second try: the first try's curve dashed under the second's, with a headline for the clear change
  it("overlays the first try on a second try", async () => {
    // The first try and the second
    const first = madeSession("first", zoo, { mode: "talk", promptId: "t001", audioKey: "audio-first" });
    // The second, with "me" falling
    const second = madeSession("again", again, { mode: "talk", promptId: "t001", retryOf: "first", createdAt: "2026-10-21T09:00:00.000Z", audioKey: "audio-again" });
    // Drawn
    render(<SessionScreen sessionId="again" repository={await repositoryWith([first, second], { exact: ["first", "again"] })} now={NOW} />);
    // The card, headed by the change
    const card = await screen.findByRole("region", { name: "Your ending used to rise. Now it falls." });
    // The dashed curve under, the key and both play buttons
    expect([card.querySelectorAll("[data-under]").length > 0, !!within(card).getByText("First try"), !!within(card).getByRole("button", { name: "Play first try" }), !!within(card).getByRole("button", { name: "Play second try" })]).toEqual([true, true, true, true]);
  });

  // When the first try's readings were dropped, it says so and shows the second alone
  it("says so quietly when the last try's readings are gone", async () => {
    // The first try, trimmed
    const first = madeSession("first", zoo, { mode: "talk", promptId: "t001", trimmedAt: "2026-09-01T00:00:00.000Z", pitch: undefined });
    // The second
    const second = madeSession("again", again, { mode: "talk", promptId: "t001", retryOf: "first", createdAt: "2026-10-21T09:00:00.000Z" });
    // Drawn
    render(<SessionScreen sessionId="again" repository={await repositoryWith([first, second])} now={NOW} />);
    // The quiet line, and no dashed curve
    const line = await screen.findByText("The last try’s detailed readings aren’t kept any more, so only this try is shown.");
    // Checked
    expect(line.closest("[data-last-this]")?.querySelectorAll("[data-under]").length).toBe(0);
  });
});

// Group the checks on the drill pictures
describe("drill pictures", () => {
  // A take of a short line, made up
  const line = makeTake([{ words: [{ text: "I", step: 0 }, { text: "didn’t", step: 0 }, { text: "say", step: 0 }, { text: "she", step: 5, level: 0.4 }, { text: "took", step: 0 }, { text: "the", step: 0 }, { text: "money.", step: 0, to: -3 }], pauseAfter: 0.3 }]);
  // As a drill keeps it
  const take = { durationSec: line.durationSec, levels: line.loudness, pitches: line.pitch, transcript: "" };

  // The stress drill's take: the key word circled and judged
  it("checks the stress drill's key word", () => {
    // Drawn
    render(<TakeStress take={take} text="I didn’t say she took the money." stress="she" />);
    // The circle and the line
    expect([document.querySelectorAll("[data-target]").length, !!screen.getByText("Your lift landed on “she”, as planned.")]).toEqual([1, true]);
  });

  // Too little voice to check
  it("says when a drill take was too quiet to check", () => {
    // Drawn with no voice
    render(<TakeStress take={{ ...take, pitches: take.pitches.map(() => null) }} text="I didn’t say she took the money." stress="she" />);
    // Said plainly
    expect(!!screen.getByText("Too little voice was heard to check the key word.")).toBe(true);
  });

  // A volume drill's take: thicker where louder
  it("draws loudness as thickness", () => {
    // Drawn
    render(<TakeThickness take={take} text="I didn’t say she took the money." loudest={0.4} label="Meeting room" />);
    // The thick pieces, the loud word's thickest
    const widths = [...document.querySelectorAll("[data-thick]")].map((piece) => Number(piece.getAttribute("stroke-width")));
    // Several, the thickest at full thickness
    expect([widths.length > 5, Math.max(...widths)]).toEqual([true, 10]);
  });

  // Shadowing: the model's curve dashed under yours, or a plain line when it could not be read
  it("draws the model voice under your curve", () => {
    // Drawn with a model
    const { unmount } = render(<ShadowCurve take={take} text="I didn’t say she took the money." model={line.pitch} label="Phrase 1" />);
    // The dashed model curve and the key
    expect([document.querySelectorAll("[data-under]").length > 0, !!screen.getByText("Model voice")]).toEqual([true, true]);
    // Gone
    unmount();
    // Drawn without a readable model
    render(<ShadowCurve take={take} text="I didn’t say she took the money." model={[null, 120, null]} label="Phrase 1" />);
    // Said plainly
    expect([document.querySelectorAll("[data-under]").length, !!screen.getByText("The model voice’s pitch couldn’t be read for this phrase.")]).toEqual([0, true]);
  });
});
