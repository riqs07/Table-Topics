// The lenses on a take's words (decision 115): the words as heard, pauses and ums, pace, word choice and clarity, worked out from hand-made words with known times
import { describe, expect, it } from "vitest";
// Load the lenses
import { fillerTimes, lensWords, type LensText, type LensWord } from "@/core/lenses/lensWords";
import { fillerCount, pauseLens, pauseMarks } from "@/core/lenses/pauseLens";
import { paceLens, usualPace } from "@/core/lenses/paceLens";
import { isConcrete, wordsLens } from "@/core/lenses/wordsLens";
import { clarityHeadline, clarityLens, clarityNote, drillFor } from "@/core/lenses/clarityLens";
// Load the filler-piece marker
import { fillerPieces } from "@/core/fillers";
// Load the record types
import type { FullSession, ServerWord, SessionRecord } from "@/data/records";

// Words said one after another at a steady pace: each a third of a second, with a pause (in seconds) after the word at any place listed
function said(text: string, pauses: Record<number, number> = {}, options: { punctuated?: boolean; fillers?: ReadonlyArray<number>; conf?: Record<number, number> } = {}): LensText {
  // The running clock
  let clock = 0.5;
  // Each word
  const words: LensWord[] = text.split(" ").map((piece, index) => {
    // Its times
    const [start, end] = [clock, clock + 0.3];
    // Move on, past any pause after it
    clock = end + 0.05 + (pauses[index] ?? 0);
    // The word
    return { text: piece, w: piece.toLowerCase().replace(/[^a-z0-9']+/g, ""), start, end, filler: options.fillers?.includes(index) ?? false, conf: options.conf ? (options.conf[index] ?? 0.95) : null };
  });
  // The text
  return { words, timed: true, precision: options.punctuated ? "exact" : "rough", punctuated: options.punctuated ?? false, deep: options.conf !== undefined };
}

describe("fillerPieces and lensWords", () => {
  // Pieces of a transcript
  it("marks each space-separated piece that is a pause word, a phrase on each of its words", () => {
    // "um" and "you know" are pause words; "like" after "I" is a verb
    expect(fillerPieces("um and I like it you know")).toEqual([true, false, false, false, false, true, true]);
  });

  // The service's words when deeper analysis ran
  it("uses the service's words, exact and punctuated, with their confidence", () => {
    // Two words and an "um"
    const words: ServerWord[] = [{ text: "Hello,", w: "hello", s: 0.1, e: 0.4, conf: 0.9 }, { text: "um", w: "um", s: 0.6, e: 0.8, conf: 0.99 }, { text: "world.", w: "world", s: 1, e: 1.4, conf: 0.4 }];
    // Read
    const text = lensWords({ transcript: "hello world", spokenTimes: [0.9, 1.9] } as FullSession, words)!;
    // Exact, punctuated, deep, the "um" marked
    expect(text).toMatchObject({ timed: true, precision: "exact", punctuated: true, deep: true });
    // (each word)
    expect(text.words.map((word) => [word.text, word.filler, word.conf])).toEqual([["Hello,", false, 0.9], ["um", true, 0.99], ["world.", false, 0.4]]);
    // The pause word's moment
    expect(fillerTimes(text)).toEqual([0.6]);
  });

  // The phone's words
  it("falls back to the phone's words, rough, and to untimed words when no times were kept", () => {
    // With times
    const timed = lensWords({ transcript: "and um I went", spokenTimes: [1, 1.2, 1.6, 2], loudness: Array.from({ length: 30 }, (_, index) => (index > 3 ? 0.2 : 0.01)) } as FullSession, null)!;
    // Rough and timed, the "um" marked
    expect(timed).toMatchObject({ timed: true, precision: "rough", deep: false });
    // (the um)
    expect(timed.words.filter((word) => word.filler).map((word) => word.w)).toEqual(["um"]);
    // Without times (an older take whose readings were dropped)
    const untimed = lensWords({ transcript: "and um I went" } as FullSession, null)!;
    // Its words, untimed
    expect(untimed).toMatchObject({ timed: false });
    // (no moments)
    expect(fillerTimes(untimed)).toEqual([]);
    // Nothing said
    expect(lensWords({ transcript: "  " } as FullSession, null)).toBeNull();
  });
});

describe("pauseLens", () => {
  // Placement without punctuation: by the word lists
  it("places a pause before a clause starter between thoughts, and one inside a clause mid-sentence", () => {
    // "zoo [0.8] I bought ... a seagull [0.9] stole"
    const text = said("so I went to the zoo I bought a hot dog and a seagull stole it", { 5: 0.8, 13: 0.9 });
    // The marks, with their lengths to a tenth
    expect(pauseMarks(text).map((mark) => [mark.after, mark.kind, Math.abs(mark.seconds - 0.9) <= 0.1])).toEqual([[5, "between", true], [13, "mid", true]]);
  });

  // With punctuation: by the mark before the pause
  it("places pauses by the service's punctuation when it ran", () => {
    // "zoo. [0.8] Then the gorilla [0.6] stared"
    const text = said("I went to the zoo. Then the gorilla stared.", { 4: 0.8, 7: 0.6 }, { punctuated: true });
    // Between, then mid
    expect(pauseMarks(text).map((mark) => mark.kind)).toEqual(["between", "mid"]);
  });

  // Short gaps are not pauses
  it("ignores gaps under a quarter second, and untimed words have no pauses", () => {
    // A 0.15 s gap (0.05 is always there)
    expect(pauseMarks(said("one two three", { 0: 0.15 }))).toEqual([]);
    // Untimed
    expect(pauseMarks({ ...said("one two"), timed: false })).toEqual([]);
  });

  // The counts and a fix that suggests a better place
  it("counts the three kinds and suggests holding a split pause until the thought ends", () => {
    // A split after "seagull", ending at "hand", then a calm pause; an "um" in place
    const text = said("and a seagull stole it right out of my hand then um the gorilla stared", { 2: 0.9, 9: 0.7 }, { fillers: [11] });
    // The lens
    const lens = pauseLens(text);
    // The counts
    expect(lens.counts).toEqual({ between: 1, mid: 1, fillers: 1 });
    // The fix
    expect(lens.notes[0]).toEqual({ tone: "work", lead: "The pause after “seagull” split the sentence.", rest: " Hold it until the thought ends, after “hand”." });
  });

  // A pause right before a peak is a beat, said as a strength
  it("calls a pause just before a pitch peak a beat, not a split", () => {
    // Same words, the peak on "stole" (place 3)
    const lens = pauseLens(said("and a seagull stole it right out of my hand", { 2: 0.9 }), new Set([3]));
    // Marked as a beat and not counted mid-sentence
    expect([lens.marks[0]!.beat, lens.counts.mid]).toEqual([true, 0]);
    // No fix; the strength names the word
    expect(lens.notes).toEqual([{ tone: "good", lead: "A beat of silence before “stole”.", rest: " A pause right before the word that matters makes people listen for it." }]);
  });

  // Calm pauses between thoughts, as a strength, after one fix at most
  it("gives at most one fix and one strength", () => {
    // Three calm pauses at boundaries, and many pause words
    const text = said("I went home um and then I sat down uh but you know I was tired um so I slept", { 2: 0.6, 8: 0.6, 15: 0.7 }, { fillers: [3, 9, 11, 12, 16] });
    // The lens
    const lens = pauseLens(text);
    // A fix about the pause words, then the calm pauses
    expect(lens.notes.map((note) => note.tone)).toEqual(["work", "good"]);
    // ("you know" counts once)
    expect(fillerCount(text.words)).toBe(4);
  });

  // A long run without a pause between thoughts
  it("says when a long stretch went by without a pause between thoughts", () => {
    // Eighty words with no pauses: about 28 seconds
    const text = said(Array.from({ length: 80 }, () => "word").join(" "));
    // The fix
    expect(pauseLens(text).notes[0]?.lead).toMatch(/^2\d seconds went by without a pause between thoughts\.$/);
  });

  // Nothing to say
  it("gives no notes on a short, plain take", () => {
    // Four words
    expect(pauseLens(said("one two three four")).notes).toEqual([]);
  });
});

describe("paceLens", () => {
  // A take that speeds up
  it("marks slow and fast phrases against the usual band and says where it sped up", () => {
    // Ten slow words (a word every 0.6 s), a pause, then fifty fast ones (a word every 0.2 s)
    const words: LensWord[] = [...Array.from({ length: 10 }, (_, index) => ({ text: "slow", w: "slow", start: index * 0.6, end: index * 0.6 + 0.4, filler: false, conf: null })), ...Array.from({ length: 50 }, (_, index) => ({ text: "fast", w: "fast", start: 7 + index * 0.2, end: 7 + index * 0.2 + 0.15, filler: false, conf: null }))];
    // Against a usual of 140 ± 15
    const lens = paceLens({ words, timed: true, precision: "exact", punctuated: false, deep: false }, { usual: 140, spread: 15 })!;
    // The band
    expect(lens.band).toEqual({ low: 125, high: 155, usual: true });
    // Slow at the start, fast at the end
    expect([lens.phrases[0]!.pace, lens.phrases.at(-1)!.pace]).toEqual(["slow", "fast"]);
    // The line
    expect(lens.summary).toBe("You sped up near the end, above your usual pace.");
  });

  // Without earlier takes
  it("uses this take's own middle pace as the band without five earlier takes, and says so", () => {
    // Steady words
    const lens = paceLens(said(Array.from({ length: 30 }, () => "word").join(" ")), null)!;
    // Its own band
    expect(lens.band.usual).toBe(false);
    // Steady
    expect(lens.summary).toBe("You stayed close to this take’s middle pace throughout.");
  });

  // Too little
  it("shows nothing for untimed or very short takes", () => {
    // Untimed
    expect(paceLens({ ...said("a b c d e f g h i j"), timed: false }, null)).toBeNull();
    // Five words
    expect(paceLens(said("a b c d e"), null)).toBeNull();
  });

  // The usual pace from earlier takes of the same family
  it("takes the usual pace from earlier takes of the same family only", () => {
    // Six earlier Rapid Fire takes and a reading
    const earlier = [120, 130, 140, 150, 160, 170].map((wpm, index) => ({ id: `s${index}`, mode: "talk", createdAt: `2026-10-0${index + 1}T09:00:00Z`, wordsPerMinute: wpm }) as SessionRecord);
    // A reading, a later take and this one
    const all = [...earlier, { id: "r", mode: "read", createdAt: "2026-10-05T09:00:00Z", wordsPerMinute: 300 } as SessionRecord];
    // The usual
    expect(usualPace(all, { id: "now", mode: "response", createdAt: "2026-10-20T09:00:00Z" })).toEqual({ usual: 145, spread: expect.any(Number) });
    // Too few for a story
    expect(usualPace(all, { id: "now", mode: "story", createdAt: "2026-10-20T09:00:00Z" })).toBeNull();
  });
});

describe("wordsLens", () => {
  // The lists
  it("marks hedges, vague words and intensifiers from the lists, longest first", () => {
    // A take with each
    const lens = wordsLens(said("I kind of just went and it was really good stuff").words);
    // The marked runs
    expect(lens.spans.filter((span) => span.kind !== "concrete").map((span) => [span.phrase, span.kind])).toEqual([["kind of", "hedge"], ["just", "hedge"], ["really", "intensifier"], ["good", "vague"], ["stuff", "vague"]]);
  });

  // "so" only as an intensifier before a word it pushes up
  it("does not call a clause-opening “so” an intensifier", () => {
    // "so I went" and "so tired"
    const kinds = wordsLens(said("so I went home and I was so tired").words).spans.filter((span) => span.kind === "intensifier").map((span) => span.from);
    // Only the second
    expect(kinds).toEqual([7]);
  });

  // Concrete words
  it("bolds words a listener can picture, not small, general or abstract ones", () => {
    // Each kind
    const marked = wordsLens(said("the seagull stole my hot dog at 3 because of the situation and people").words).spans.filter((span) => span.kind === "concrete").map((span) => span.phrase);
    // The picturable ones
    expect(marked).toEqual(["seagull", "stole", "hot", "dog", "3"]);
    // A pause word is never concrete
    expect(isConcrete({ text: "basically", w: "basically", start: 0, end: 0, filler: true, conf: null })).toBe(false);
  });

  // The coach's swap wins
  it("uses the coach's word swap for the words it named, and a plain line otherwise", () => {
    // A swap for "really good"
    const lens = wordsLens(said("the hot dog was really good").words, [{ said: "really good", stronger: "still warm", why: "Name what made it good." }]);
    // One run with the swap
    const span = lens.spans.find((item) => item.phrase === "really good")!;
    // Its swap and why
    expect(span).toMatchObject({ from: 4, to: 5, kind: "intensifier", swap: { stronger: "still warm" }, explain: "Name what made it good." });
    // A hedge with no swap: the plain line
    expect(wordsLens(said("maybe we go").words).spans[0]!.explain).toBe("“maybe” softens what comes next. If you mean it, say it without; keep it where you really are unsure.");
  });

  // A coach swap for a word on no list
  it("marks a word the coach suggested a swap for even when it is on no list", () => {
    // "said" → "whispered"
    const span = wordsLens(said("she said hello").words, [{ said: "said", stronger: "whispered", why: "" }]).spans.find((item) => item.kind === "swap")!;
    // Marked, with a line naming the swap
    expect(span).toMatchObject({ phrase: "said", explain: "The coach suggests “whispered”." });
  });

  // Pause words are left to the other lens
  it("leaves pause words unmarked", () => {
    // "like" as a filler
    expect(wordsLens(said("um like whatever", {}, { fillers: [0, 1] }).words).spans.map((span) => span.phrase)).toEqual(["whatever"]);
  });
});

describe("clarityLens", () => {
  // The share and the unclear words
  it("counts the share of clear words and lists the ones the service was unsure of", () => {
    // Ten words, two unclear
    const text = said("and a seagull stole it right out of my hand", {}, { conf: { 2: 0.4, 3: 0.5 } });
    // The lens
    const lens = clarityLens(text.words)!;
    // 80%, places 2 and 3
    expect([lens.percent, lens.unclear]).toEqual([80, [2, 3]]);
    // The lines
    expect(clarityHeadline(lens)).toBe("80% of your words came through clearly. These two were harder to catch.");
    // (the note)
    expect(clarityNote(lens, text.words)).toBe("“seagull” and “stole” were harder to catch. Crisp consonants make words easier to catch.");
  });

  // Pause words do not count
  it("leaves pause words out of the share", () => {
    // An unsure "um"
    expect(clarityLens(said("um one two three four five", {}, { fillers: [0], conf: { 0: 0.1 } }).words)!.percent).toBe(100);
  });

  // No confidence, no lens
  it("shows nothing without deeper analysis or with too few words", () => {
    // No confidence
    expect(clarityLens(said("one two three four five six").words)).toBeNull();
    // Three words
    expect(clarityLens(said("one two three", {}, { conf: {} }).words)).toBeNull();
  });

  // The drill heuristic
  it("picks word endings, long words or crisp consonants by the unclear words", () => {
    // Mostly swallowed endings
    expect(drillFor(["stared", "fact", "hand"])?.id).toBe("c01");
    // Mostly long words
    expect(drillFor(["particularly", "temperature", "me"])?.id).toBe("c02");
    // Otherwise consonants
    expect(drillFor(["seagull", "three"])?.id).toBe("c03");
    // None
    expect(drillFor([])).toBeNull();
  });
});
