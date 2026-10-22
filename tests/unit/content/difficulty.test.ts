// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the content being checked
import { DIFFICULTIES, difficultyOf, findDifficulty, findPersona, findScenario, liveVoiceOf } from "@/content/conversations";
// Load the writer's message
import { writeMessage } from "@/core/conversationTurn";

// Maya at the party
const [MAYA, PARTY] = [findPersona("maya")!, findScenario("party")!];

// Group the checks on the persona difficulty (decision 141)
describe("conversation difficulty", () => {
  // Three levels, easiest first; only normal leaves the instructions as they were; only hard cuts in
  it("has easy, normal and hard, with a rule for each but normal", () => {
    // The levels
    expect(DIFFICULTIES.map((level) => [level.id, level.name, level.rule === null, level.cutInSeconds])).toEqual([["easy", "Easy", false, null], ["normal", "Normal", true, null], ["hard", "Hard", false, 25]]);
  });

  // Every rule keeps the house rules: in character, never coaching, never about the app or AI, never rude
  it("keeps every rule within the house rules", () => {
    // The rules' words
    const rules = DIFFICULTIES.flatMap((level) => (level.rule ? [level.rule.toLowerCase()] : []));
    // None mention the app, practice, AI or coaching; hard stays polite
    expect([rules.some((rule) => /\b(ai|app|voicelab|coach|practi[cs]e|skill)\b/.test(rule)), findDifficulty("hard").rule!.includes("polite")]).toEqual([false, true]);
  });

  // The writer's message carries the rule for easy and hard, and is unchanged for normal
  it("adds the rule to the writer's message, before the conversation", () => {
    // Each level's message
    const [easy, normal, hard, plain] = [writeMessage(MAYA, PARTY, 0, [], "talk", true, "easy"), writeMessage(MAYA, PARTY, 0, [], "talk", true, "normal"), writeMessage(MAYA, PARTY, 0, [], "talk", true, "hard"), writeMessage(MAYA, PARTY, 0, [], "talk")];
    // Easy and hard named before the fence; normal is the message as before
    expect([easy.includes(`Difficulty: ${findDifficulty("easy").rule}`), hard.indexOf("Difficulty:") < hard.indexOf("<conversation>"), normal === plain, normal.includes("Difficulty:")]).toEqual([true, true, true, false]);
  });

  // A saved level is made safe
  it("reads a saved level safely", () => {
    // Known, unknown, missing
    expect([difficultyOf("hard"), difficultyOf("brutal"), difficultyOf(undefined)]).toEqual(["hard", "normal", "normal"]);
  });

  // Maya's phone-call voice is the stand-in; the others keep theirs (decision 142)
  it("gives Maya a stand-in voice for phone calls", () => {
    // Each persona's call voice
    expect(["maya", "theo", "chris", "priya"].map((id) => liveVoiceOf(findPersona(id)!))).toEqual(["Mac2FKpSgaGIsaNRXt8A", "wQe0SgyTHHi5SKbNXlNd", "iP95p4xoKVk53GoZ742B", "lzneF1PdZ5qTfp2KKdnF"]);
  });
});
