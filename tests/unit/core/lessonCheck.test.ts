// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the lesson check being checked
import { lessonResult } from "@/core/lessonCheck";
// Load the lessons
import { findLesson } from "@/content/lessons";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A run of the same loudness reading, one per tenth of a second
const run = (level: number, ticks: number) => Array<number>(ticks).fill(level);
// Look up a lesson that must exist
const lesson = (id: string) => findLesson(id)!;

// Group the checks about each lesson's result
describe("lessonResult", () => {
  // Lesson 1 measures the silence before the first word
  it("measures the opening pause", () => {
    // 1.5 seconds of quiet, then speech
    const good = lessonResult(lesson("l001"), makeSession({ loudness: [...run(0.01, 15), ...run(0.3, 30)] }));
    // Only 0.3 seconds
    const rushed = lessonResult(lesson("l001"), makeSession({ loudness: [...run(0.01, 3), ...run(0.3, 30)] }));
    // Confirm both headlines
    expect([good.headline, rushed.headline]).toEqual(["You waited 1.5 seconds before your first word. Good.", "You started after 0.3 seconds. Try waiting a full breath."]);
  });

  // Crisp consonants measures how many words were heard clearly
  it("measures clear words for crisp consonants", () => {
    // Read the first few words only
    const result = lessonResult(lesson("l002"), makeSession({ transcript: "clear speech starts with the ends of words" }));
    // Confirm the wording
    expect(result.headline).toMatch(/^You read \d+% of the words clearly\.$/);
  });

  // Numbers lesson checks the pace stays unhurried
  it("checks the pace on numbers and names", () => {
    // Fast and slow readings
    const fast = lessonResult(lesson("l003"), makeSession({ wordsPerMinute: 171.4 }));
    // Slow
    const slow = lessonResult(lesson("l003"), makeSession({ wordsPerMinute: 128 }));
    // Confirm both
    expect([fast.headline, slow.headline]).toEqual(["171 words a minute. Aim for under 140 on numbers and names.", "128 words a minute: unhurried, as it should be."]);
  });

  // Landing the ending counts stretches of speech that faded at the end
  it("counts endings that faded", () => {
    // One stretch fades (last 0.3 s much quieter), one holds, with a pause between
    const loudness = [...run(0.3, 17), ...run(0.12, 3), ...run(0.01, 10), ...run(0.3, 20)];
    // Confirm the headline
    expect(lessonResult(lesson("l005"), makeSession({ loudness })).headline).toBe("1 of 2 stretches faded at the end.");
  });

  // Recovering from a blank: a long pause followed by more speech is the recovery
  it("finds the recovery pause in the blank-recovery lesson", () => {
    // Speech, a 3-second pause, then speech again
    const recovered = lessonResult(lesson("l015"), makeSession({ loudness: [...run(0.3, 30), ...run(0.01, 30), ...run(0.3, 30)] }));
    // Speech with only short pauses
    const rushed = lessonResult(lesson("l015"), makeSession({ loudness: [...run(0.3, 30), ...run(0.01, 8), ...run(0.3, 30)] }));
    // Confirm both
    expect([recovered.headline, rushed.headline]).toEqual(["You stopped for 3.0 seconds and carried on. That is the recovery.", "Your longest pause was 0.8 seconds. Stop for a full three seconds where the text says, then carry on."]);
  });

  // Instructions in square brackets are not words to read, so they do not count as missed
  it("leaves bracketed instructions out of the reading check", () => {
    // The text without its bracketed instruction, read in full
    const body = lesson("l015").body.replace(/\[[^\]]*\]/g, " ").replace(/\*/g, "");
    // Confirm every word counts as read
    expect(lessonResult(lesson("l015"), makeSession({ transcript: body })).detail).toBe("You read 100% of the words.");
  });

  // The closing lesson looks for fillers near the end
  it("looks for fillers in the closing", () => {
    // A clean close and one with fillers
    const clean = lessonResult(lesson("l010"), makeSession({ transcript: "and that is why it matters thank you" }));
    // With fillers at the end
    const messy = lessonResult(lesson("l010"), makeSession({ transcript: "and that is why it matters so um yeah thank you" }));
    // Confirm both
    expect([clean.headline, messy.headline.startsWith("Pause words crept into your closing")]).toEqual(["No pause words in your closing.", true]);
  });

  // Lessons that need judgement wait for the coach
  it("leaves judgement lessons to the coach", () => {
    // Confirm the wording for the key-word lesson
    expect(lessonResult(lesson("l006"), makeSession({ transcript: "words" })).headline).toBe("Your coach comments on this one once feedback is set up.");
  });

  // Every result also says how much of the text was read
  it("always reports how much of the text was read", () => {
    // Confirm the detail line
    expect(lessonResult(lesson("l002"), makeSession({ transcript: "clear" })).detail).toMatch(/^You read \d+% of the words\.$/);
  });
});
