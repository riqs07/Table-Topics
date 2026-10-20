// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the characters being checked
import { CHARACTERS, findCharacter, findLine } from "@/content/conversations";
// Load the small-talk units
import { UNITS } from "@/content/smallTalk";

// Group the checks about the conversation characters (decision 83)
describe("CHARACTERS", () => {
  // One character per small-talk unit, in the units' order
  it("has one character per small-talk unit", () => {
    // The units they practise
    expect(CHARACTERS.map((character) => character.unit)).toEqual(UNITS.map((unit) => unit.id));
  });

  // Every character can open, listen, react and say goodbye, with ids that are unique and their own
  it("gives every character the lines a conversation needs", () => {
    // Problems found, by character
    const problems = CHARACTERS.flatMap((character) => {
      // How many of a kind
      const count = (kind: string) => character.lines.filter((line) => line.kind === kind).length;
      // Each check that fails
      return [
        // Two openings, four listening sounds, two goodbyes, and something to share
        count("opening") === 2 && count("listening") === 4 && count("goodbye") === 2 && count("share") >= 8 ? null : `${character.id}: kinds`,
        // Ids unique and starting with the character's id
        new Set(character.lines.map((line) => line.id)).size === character.lines.length && character.lines.every((line) => line.id.startsWith(`${character.id}-`)) ? null : `${character.id}: ids`,
        // The script names only their own sharing, question and reaction lines
        character.script.flat().every((id) => ["share", "short", "question", "reaction", "turn"].includes(findLine(character, id)?.kind ?? "")) ? null : `${character.id}: script`,
        // The line for not catching what was said is one of their turns
        findLine(character, character.again)?.kind === "turn" ? null : `${character.id}: again`,
      ].filter(Boolean);
    });
    // None
    expect(problems).toEqual([]);
  });

  // Found by id; nothing for an unknown one
  it("finds a character by id", () => {
    // Known and unknown
    expect([findCharacter("theo")?.name, findCharacter("nope")]).toEqual(["Theo", undefined]);
  });
});
