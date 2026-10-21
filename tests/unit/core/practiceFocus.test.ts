// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the focus rules being checked
import { FOCUS_AREAS, MAX_FOCUS, focusAreas, focusForDay, focusPhrase, orderLearnGroups, orderPracticeGroups, readPracticeFocus, toggleFocus, type FocusAreaId, type PracticeGroupId } from "@/core/practiceFocus";
// Load the Learn sets and groups, and the next-card rule
import { LEARN_CARDS, LEARN_GROUPS, LEARN_SETS } from "@/content/learn";
import { firstRead, nextCard } from "@/core/learn";
// Load the lessons and prepared-speech tasks, to check each area's lists
import { findLesson } from "@/content/lessons";
import { PROMPTS } from "@/content/prompts";

// The Practice page's groups in their usual order
const USUAL: ReadonlyArray<PracticeGroupId> = ["on-the-spot", "stories", "conversation", "voice", "skills"];

// Group the checks about the user's focus (decision 97)
describe("practice focus", () => {
  // The six areas map to real Learn sets, Practice groups, lessons and speeches, with the mapping the user asked for
  it("maps each area to its practice, Learn sets and Practice group", () => {
    // Each area as id → [group, sets, kinds]
    const mapping = Object.fromEntries(FOCUS_AREAS.map((area) => [area.id, [area.practiceGroup, [...area.learnSets], [...area.picks]]]));
    // Every set, lesson and speech named exists
    const unknown = FOCUS_AREAS.flatMap((area) => [...area.learnSets.filter((set) => !LEARN_SETS.some((item) => item.id === set)), ...area.lessons.filter((id) => !findLesson(id)), ...area.speeches.filter((id) => !PROMPTS.some((prompt) => prompt.id === id))]);
    // Confirm the mapping and that nothing is unknown
    expect([mapping, unknown, FOCUS_AREAS.map((area) => area.name)]).toEqual([
      {
        stories: ["stories", ["stories"], ["story", "guided"]],
        conversation: ["conversation", ["conversation", "warmth"], ["connect", "smalltalk", "scenarios"]],
        spot: ["on-the-spot", ["point", "nerves"], ["talk", "response", "focus-lesson"]],
        voice: ["voice", ["voice"], ["voice", "pause", "skill"]],
        work: ["on-the-spot", ["work", "point"], ["focus-lesson", "focus-speech", "talk"]],
        talk: ["on-the-spot", ["nerves", "point"], ["response", "focus-lesson"]],
      },
      [],
      ["Telling stories", "Small talk and conversations", "Thinking on my feet", "How I sound", "Speaking at work", "A talk coming up"],
    ]);
  });

  // A saved choice is read safely: missing stays "never asked", junk becomes none, unknown ids drop, at most two
  it("reads a saved choice safely", () => {
    // Confirm each case
    expect([readPracticeFocus(undefined), readPracticeFocus("stories"), readPracticeFocus(["stories", "nonsense", "stories", "voice", "work"]), readPracticeFocus([])]).toEqual([undefined, [], ["stories", "voice"], []]);
  });

  // Tapping picks and unpicks; a third pick replaces the earlier of two
  it("picks one or two, a third replacing the earliest", () => {
    // A run of taps
    const one = toggleFocus([], "stories");
    // A second
    const two = toggleFocus(one, "voice");
    // A third
    const three = toggleFocus(two, "work");
    // Unpicking one
    const off = toggleFocus(three, "voice");
    // Confirm
    expect([one, two, three, off, MAX_FOCUS]).toEqual([["stories"], ["stories", "voice"], ["voice", "work"], ["work"], 2]);
  });

  // With one area it gives both the pick and the card; with two they swap by day; with none there is nothing
  it("gives each area a role each day, two swapping by day", () => {
    // Two areas over four days
    const days = [0, 1, 2, 3].map((day) => focusForDay(["stories", "voice"], day)).map((roles) => `${roles?.pick.id}/${roles?.card.id}/${roles?.turn}`);
    // Confirm none, one, and the swap (with turns counting each area's own days)
    expect([focusForDay([], 5), focusForDay(undefined, 5), focusForDay(["work"], 7)?.pick.id, focusForDay(["work"], 7)?.card.id, days, focusForDay(["stories", "voice"], -1)?.pick.id]).toEqual([null, null, "work", "work", ["stories/voice/0", "voice/stories/0", "stories/voice/1", "voice/stories/1"], "voice"]);
  });

  // Practice puts the picked areas' groups first, each once; no focus keeps the usual order
  it("puts the focus groups first on Practice", () => {
    // Confirm none, one, two in the same group, and two different
    expect([orderPracticeGroups([], USUAL), orderPracticeGroups(["voice"], USUAL), orderPracticeGroups(["work", "talk"], USUAL), orderPracticeGroups(["conversation", "stories"], USUAL)]).toEqual([USUAL, ["voice", "on-the-spot", "stories", "conversation", "skills"], USUAL, ["conversation", "stories", "on-the-spot", "voice", "skills"]]);
  });

  // Learn gains a "For your focus" group of the focus sets, taken out of their usual groups; no focus keeps the groups
  it("puts the focus sets first on Learn", () => {
    // With two areas
    const groups = orderLearnGroups(["work", "stories"], LEARN_GROUPS);
    // Every set still shown exactly once
    const shown = groups.flatMap((group) => group.sets);
    // Confirm the first group, that each set shows once, and that no focus changes nothing
    expect([groups[0], shown.length === LEARN_SETS.length && new Set(shown).size === LEARN_SETS.length, orderLearnGroups([], LEARN_GROUPS).map((group) => group.name)]).toEqual([{ name: "For your focus", sets: ["work", "point", "stories"] }, true, ["Speaking", "People"]]);
  });

  // The next card comes from the sets asked for first, then from anywhere once those are read
  it("offers the next card from the focus sets first", () => {
    // Every voice card read
    const voiceRead = Object.fromEntries(LEARN_CARDS.filter((card) => card.set === "voice").map((card) => [card.id, firstRead(new Date(2026, 9, 1))]));
    // Confirm: the first voice card; with all voice read, the first card of all; and no preference as before
    expect([nextCard({}, ["voice"])?.id, nextCard(voiceRead, ["voice"])?.id, nextCard({})?.id]).toEqual([LEARN_CARDS.find((card) => card.set === "voice")?.id, LEARN_CARDS[0]?.id, LEARN_CARDS[0]?.id]);
  });

  // The areas in words, for Today and Settings
  it("names the picked areas in a sentence", () => {
    // Confirm none, one and two
    expect([focusPhrase([]), focusPhrase(["voice"]), focusPhrase(["stories", "voice"] as FocusAreaId[]), focusAreas(["talk"]).map((area) => area.name)]).toEqual(["", "how I sound", "telling stories and how I sound", ["A talk coming up"]]);
  });
});
