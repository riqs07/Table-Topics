// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the personas and situations being checked
import { PERSONAS, SCENARIOS, findLine, findPersona, findScenario, pickSituation, scenarioText } from "@/content/conversations";
// Load the small-talk units
import { UNITS } from "@/content/smallTalk";

// The skills that have conversations so far (the units added in decision 95 have none yet)
const CONVERSATION_SKILLS = ["answering", "asking", "listening", "news"];

// Group the checks about the personas (decisions 83 and 84)
describe("PERSONAS", () => {
  // Each persona's own situation covers a different skill, in the units' order
  it("gives each persona their own situation, one per skill", () => {
    // The skills of their own situations
    expect(PERSONAS.map((persona) => findScenario(persona.home)?.unit)).toEqual(CONVERSATION_SKILLS);
  });

  // A personality, a life and a voice of their own, and the recorded lines the fallback needs
  it("gives every persona a personality, a voice and the recorded lines the fallback needs", () => {
    // Problems found, by persona
    const problems = PERSONAS.flatMap((persona) => {
      // How many recorded lines of a kind
      const count = (kind: string) => persona.lines.filter((line) => line.kind === kind).length;
      // Each check that fails
      return [
        // A short tagline, and a personality and background worth writing from
        persona.tagline.length > 0 && persona.tagline.length <= 50 && persona.personality.length > 100 && persona.background.length > 100 ? null : `${persona.id}: who`,
        // An ElevenLabs voice id
        /^[A-Za-z0-9]{20}$/.test(persona.voiceId) ? null : `${persona.id}: voice`,
        // Two openings, four listening sounds, two goodbyes
        count("opening") === 2 && count("listening") === 4 && count("goodbye") === 2 ? null : `${persona.id}: kinds`,
        // Ids unique and starting with the persona's id
        new Set(persona.lines.map((line) => line.id)).size === persona.lines.length && persona.lines.every((line) => line.id.startsWith(`${persona.id}-`)) ? null : `${persona.id}: ids`,
        // The script names only their own sharing, question and reaction lines
        persona.script.flat().every((id) => ["share", "short", "question", "reaction", "turn"].includes(findLine(persona, id)?.kind ?? "")) ? null : `${persona.id}: script`,
        // The line for not catching what was said is one of their turns
        findLine(persona, persona.again)?.kind === "turn" ? null : `${persona.id}: again`,
      ].filter(Boolean);
    });
    // None, and four different voices
    expect([problems, new Set(PERSONAS.map((persona) => persona.voiceId)).size]).toEqual([[], 4]);
  });

  // Found by id; nothing for an unknown one
  it("finds a persona by id", () => {
    // Known and unknown
    expect([findPersona("theo")?.name, findPersona("nope")]).toEqual(["Theo", undefined]);
  });
});

// Group the checks about the situations (decision 84)
describe("SCENARIOS", () => {
  // Two situations for each skill, each with what to practise, how the persona behaves and several twists, all naming the persona
  it("has two situations per skill, each ready to fill in", () => {
    // Problems found, by situation
    const problems = SCENARIOS.flatMap((scenario) => [
      // The setting, what to practise and the direction name the persona
      [scenario.setting, scenario.direction].every((text) => text.includes("{name}")) && scenario.practise.length > 0 ? null : `${scenario.id}: text`,
      // At least four twists, each a sentence naming the persona
      scenario.twists.length >= 4 && scenario.twists.every((twist) => twist.includes("{name}") && /[.]$/.test(twist)) ? null : `${scenario.id}: twists`,
    ].filter(Boolean));
    // None, unique ids, and two per skill
    expect([problems, new Set(SCENARIOS.map((scenario) => scenario.id)).size, UNITS.map((unit) => SCENARIOS.filter((scenario) => scenario.unit === unit.id).length)]).toEqual([[], SCENARIOS.length, [2, 2, 2, 2, 0, 0, 0]]);
  });

  // The persona's name fills every "{name}"
  it("fills in the persona's name", () => {
    // Coffee with Maya
    expect(scenarioText(findScenario("coffee")!.setting, findPersona("maya")!)).toBe("You’ve met your friend Maya for coffee. Maya looks tired.");
  });
});

// Group the checks about picking the situation
describe("pickSituation", () => {
  // Their own situation first, then round the rest, never the same twice in a row; the twist moves on each time round
  it("starts with their own situation, then moves on", () => {
    // Chris
    const chris = findPersona("chris")!;
    // The first nine conversations' situations
    const picks = Array.from({ length: 9 }, (_, turn) => pickSituation(chris, turn));
    // Coffee first, eight different situations, then coffee again with another twist
    expect([picks[0]?.scenario.id, new Set(picks.slice(0, 8).map((pick) => pick.scenario.id)).size, picks[8]?.scenario.id, picks[8]?.twist !== picks[0]?.twist]).toEqual(["coffee", 8, "coffee", true]);
  });

  // From a unit page, only that skill's situations
  it("keeps to one skill when asked", () => {
    // Theo, practising listening
    const theo = findPersona("theo")!;
    // Four in a row
    expect(Array.from({ length: 4 }, (_, turn) => pickSituation(theo, turn, "listening").scenario.id)).toEqual(["coffee", "walk", "coffee", "walk"]);
  });

  // A skill with no conversation yet (such as reading the room, decision 95) falls back to every situation rather than failing
  it("falls back to every situation for a skill that has none", () => {
    // Theo, asked for reading the room
    const theo = findPersona("theo")!;
    // The same as with no skill at all
    expect([pickSituation(theo, 0, "room").scenario.id, pickSituation(theo, 3, "deeper").scenario.id]).toEqual([pickSituation(theo, 0).scenario.id, pickSituation(theo, 3).scenario.id]);
  });
});
