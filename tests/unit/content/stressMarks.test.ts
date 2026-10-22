// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the content
import { PASSAGES, PAUSE_DRILLS, TRICKY_WORDS } from "@/content/prompts";
import { CHECK_IN_PASSAGE } from "@/content/checkIn";
import { LESSONS } from "@/content/lessons";
import { VOICE_DRILLS } from "@/content/voice";
// Load the stress helpers
import { stressRows } from "@/core/plannedStress";
import { markCount, markStress } from "@/core/stressMarks";
// Load the script splitter
import { readingTokens, scriptWords } from "@/core/liveReading";

// Every text that can carry stress marks
const TEXTS = [...PASSAGES, ...PAUSE_DRILLS, ...TRICKY_WORDS, CHECK_IN_PASSAGE];

// Group the checks on the key-word stress marks (decision 111)
describe("stress marks", () => {
  // The short practice passages and the check-in passage have them
  it("are on the practice passages and the check-in passage", () => {
    // The texts with marks
    expect(TEXTS.filter((text) => text.stress && text.stress.length > 0).map((text) => text.id)).toEqual(["r007", "r008", "r009", "r010", "r011", "r012", "ci-read"]);
  });

  // Each mark is a stretch of the text as written, found exactly once, with one key word in stars
  for (const text of TEXTS.filter((item) => item.stress)) {
    // One check per text
    it(`are each found once with one key word: ${text.id}`, () => {
      // Each mark
      for (const mark of text.stress!) {
        // Found once, one starred stretch of a single word
        expect([mark, markCount(text.body, mark), (mark.match(/\*[^*\s]+\*/g) ?? []).length, (mark.match(/\*/g) ?? []).length]).toEqual([mark, 1, 1, 2]);
      }
      // Marked, the words to read are the same as the plain text's, so word times still line up
      expect(scriptWords(readingTokens(markStress(text.body, text.stress!)))).toEqual(scriptWords(readingTokens(text.body)));
      // Every mark becomes a target in a row
      expect(stressRows(markStress(text.body, text.stress!)).flatMap((row) => row.targets).length).toBe(text.stress!.length);
    });
  }

  // Only the stress lesson's stars are planned stress (other lessons star signposts)
  it("plan stress in the stress lesson only", () => {
    // The lessons that plan stress, each with stars in its text
    expect(LESSONS.filter((lesson) => lesson.plannedStress).map((lesson) => [lesson.id, stressRows(lesson.body).length])).toEqual([["l006", 4]]);
  });

  // The stress drill names its key word, and the word is in the line
  it("name the key word in the stress drill", () => {
    // Every take of a drill with a key word, in every sentence set (decision 117)
    const takes = VOICE_DRILLS.flatMap((drill) => (drill.sets ?? [drill.takes]).flatMap((set) => set.filter((take) => take.stress).map((take) => ({ drill: drill.id, word: take.stress!, text: take.text }))));
    // Six in the stress drill and twenty-one across "Same sentence, different stress", each in its line
    expect([takes.filter((take) => take.drill === "p04").length, takes.filter((take) => take.drill === "p05").length, takes.every((take) => ["p04", "p05"].includes(take.drill) && take.text.split(/[\s.,?]+/).includes(take.word))]).toEqual([6, 21, true]);
  });
});
