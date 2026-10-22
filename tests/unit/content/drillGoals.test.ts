// Checks on the goal line shown before every drill and lesson (decision 117), and on the two intonation drills' sentences
import { describe, expect, it } from "vitest";
// Load the content
import { DIALBACK_LINES, drillWithSet, findVoiceDrill, SHADOW_PASSAGES, SHIFT_SENTENCES, VOICE_DRILLS } from "@/content/voice";
import { LESSONS } from "@/content/lessons";
import { PAUSE_DRILLS, TRICKY_WORDS } from "@/content/prompts";
// Load the key-word starring
import { markWord } from "@/core/stressMarks";

// The most words a goal may have, so the line stays one line's worth on a phone
const GOAL_WORDS = 25;

// Every drill and lesson with its goal, by name
const GOALS: ReadonlyArray<{ name: string; goal: string | undefined }> = [
  // The voice drills
  ...VOICE_DRILLS.map((drill) => ({ name: drill.id, goal: drill.goal })),
  // The lessons
  ...LESSONS.map((lesson) => ({ name: lesson.id, goal: lesson.goal })),
  // The pause drills
  ...PAUSE_DRILLS.map((drill) => ({ name: drill.id, goal: drill.goal })),
  // The tricky-word lists
  ...TRICKY_WORDS.map((list) => ({ name: list.id, goal: list.goal })),
  // The passages to shadow
  ...SHADOW_PASSAGES.map((passage) => ({ name: passage.id, goal: passage.goal })),
];

// A word in a line, without its punctuation, in lower case
const bare = (word: string) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’]+$/gu, "").toLowerCase();

// The goals
describe("goals", () => {
  // Every drill and lesson has one, short, saying what good looks like and how it will be shown
  it("gives every drill and lesson a short goal that says how it will be shown", () => {
    // The ones missing, too long, or not saying how it is shown
    const problems = GOALS.filter(({ goal }) => !goal || goal.split(/\s+/).length > GOAL_WORDS || !goal.includes("You’ll see") || /[A-Z]{3,}/.test(goal) || /!/.test(goal)).map(({ name }) => name);
    // None
    expect(problems).toEqual([]);
    // And there are as many as the content has
    expect(GOALS.length).toBe(VOICE_DRILLS.length + LESSONS.length + PAUSE_DRILLS.length + TRICKY_WORDS.length + SHADOW_PASSAGES.length);
  });
});

// The two new drills' sentences
describe("intonation drill sentences", () => {
  // Six sentences of three or four targets, each target a word found exactly once in its sentence
  it("marks each stress target once, on a word that is there", () => {
    // Six
    expect(SHIFT_SENTENCES.length).toBe(6);
    // Each sentence
    for (const sentence of SHIFT_SENTENCES) {
      // Three or four takes
      expect([3, 4]).toContain(sentence.targets.length);
      // Each target once in the sentence, as a whole word
      for (const target of sentence.targets) expect(sentence.text.split(" ").filter((word) => bare(word) === target.toLowerCase()).length, `${target} in ${sentence.text}`).toBe(1);
      // No target twice
      expect(new Set(sentence.targets.map((target) => target.toLowerCase())).size).toBe(sentence.targets.length);
      // Starring a target stars exactly one word
      for (const target of sentence.targets) expect(markWord(sentence.text, target).match(/\*[^*]+\*/g)).toHaveLength(1);
    }
  });

  // Six lines to dial back, each different, none the same as "Stretch the range"
  it("has six different lines to dial back", () => {
    // Six, all different
    expect(new Set(DIALBACK_LINES).size).toBe(6);
    // Not the older drill's line
    expect(DIALBACK_LINES).not.toContain(findVoiceDrill("p03")!.takes[0]!.text);
  });

  // Each drill turns through its sentences, its takes following the sentence
  it("turns through each drill's sentences", () => {
    // The stress drill's third sentence
    const third = drillWithSet(findVoiceDrill("p05")!, 2);
    // Its takes and their targets
    expect(third.takes.map((take) => [take.text, take.stress])).toEqual(SHIFT_SENTENCES[2]!.targets.map((target) => [SHIFT_SENTENCES[2]!.text, target]));
    // Wrapping round, both ways
    expect([drillWithSet(findVoiceDrill("p06")!, 6).takes[0]!.text, drillWithSet(findVoiceDrill("p06")!, -1).takes[0]!.text]).toEqual([DIALBACK_LINES[0], DIALBACK_LINES[5]]);
    // Flat, exaggerated, natural
    expect(third && drillWithSet(findVoiceDrill("p06")!, 1).takes.map((take) => take.label)).toEqual(["Flat", "Exaggerated", "Natural"]);
    // A drill without sentences is unchanged
    expect(drillWithSet(findVoiceDrill("v01")!, 3)).toBe(findVoiceDrill("v01"));
  });
});
