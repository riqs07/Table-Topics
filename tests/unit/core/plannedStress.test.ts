// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { judgeStress, stressCount, stressRows } from "@/core/plannedStress";
import { markCount, markStress, markWord } from "@/core/stressMarks";
// Load the phrase builder and word placement
import { pitchWords, type PitchWords } from "@/core/pitchPhrases";
import { alignFromServer } from "@/core/wordAlign";
// Load the made-up takes
import { makeTake, type SaidWord } from "../../support/pitchTake";

// One sentence of the stress lesson, with the voice's lift on one word
function sentence(lift: string): SaidWord[] {
  // Each word, the lifted one five steps up, the last falling
  return "I never said she took the money.".split(" ").map((text) => ({ text, step: text === lift ? 5 : 0, ...(text === "money." ? { to: -3 } : {}) }));
}

// Group the checks on planned stress (decision 111)
describe("planned stress", () => {
  // A passage's marks become stars in its text, found where they are written
  it("marks key words in a text", () => {
    // Marked
    expect(markStress("Ask not what your country can do for you.", ["Ask *not* what", "do for *you*."])).toBe("Ask *not* what your country can do for *you*.");
    // A mark that is not in the text changes nothing
    expect(markStress("Hello there.", ["*Goodbye*"])).toBe("Hello there.");
    // Counted for the content check
    expect([markCount("a b a", "*a*"), markCount("a b", "*c*")]).toEqual([2, 0]);
  });

  // Each clause with a key word is a row, numbered as the script's words
  it("finds the clauses with key words", () => {
    // Two sentences, a comma, and a key word in each clause but the last
    const rows = stressRows("I never said *she* took it. I never said she *took* it, and that is all.");
    // Two rows
    expect(rows.map((row) => [row.from, row.to, row.targets])).toEqual([[0, 5, [3]], [6, 11, [10]]]);
  });

  // The lift on the key word is a hit; elsewhere, a plain line naming both
  it("judges whether the lift landed on the key word", () => {
    // Two sentences: the first lifts "she" as planned, the second lifts "said" instead of "took"
    const take = makeTake([{ words: sentence("she"), pauseAfter: 0.6 }, { words: sentence("said"), pauseAfter: 0.6 }]);
    // Worked out (the service's words are the script's words, in order)
    const pitch = pitchWords({ pitch: take.pitch, alignment: alignFromServer(take.serverWords), tickMs: 100 }) as PitchWords;
    // The rows of the lesson's first two sentences
    const results = judgeStress(stressRows("I never said *she* took the money. I never said she *took* the money."), pitch);
    // A hit, then a miss
    expect(results.map((result) => [result.hit, result.highest?.text, result.line])).toEqual([[true, "she", { tone: "good", text: "Your lift landed on “she”, as planned." }], [false, "said", { tone: "work", text: "Your lift went to “said”. Lean on “took”, and let “said” stay low." }]]);
    // One line over both
    expect(stressCount(results)).toBe("1 of 2 key words got your lift.");
  });

  // A key word that was not heard cannot be judged, and says so plainly
  it("says when a key word was not heard", () => {
    // A take of only the first three words
    const take = makeTake([{ words: sentence("never").slice(0, 3), pauseAfter: 0.5 }]);
    // Worked out (the readings given twice, so there is enough voice)
    const pitch = pitchWords({ pitch: [...take.pitch, ...take.pitch], alignment: alignFromServer(take.serverWords), tickMs: 100 }) as PitchWords;
    // The row's key word is the fourth word, never said
    const [result] = judgeStress(stressRows("I never said *she* took the money."), pitch);
    // Not judged
    expect([result!.hit, result!.line.text]).toEqual([null, "“she” wasn’t heard clearly, so the lift can’t be checked."]);
    // No count over a single row
    expect(stressCount([result!])).toBeNull();
  });
});

// Group the checks on starring a drill's key word
describe("markWord", () => {
  // The first matching word is starred, its punctuation left outside
  it("stars the key word of a line", () => {
    // Inside the line, at the end, and a word not there
    expect([markWord("I didn’t say she took the money.", "she"), markWord("I didn’t say she took the money.", "money"), markWord("Hello.", "bye")]).toEqual(["I didn’t say *she* took the money.", "I didn’t say she took the *money*.", "Hello."]);
  });
});
