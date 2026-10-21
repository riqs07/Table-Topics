// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the story checks being tested
import { andThenCount, closingWords, detailsIn, dialogueIn, feelingIn, heardList, openingWords, pointIn, preambleIn, storyChange, storyChecks, storyRaw, trailsOff, turnIn } from "@/core/storyChecks";

// A well-told story as the speech service hands it over: no punctuation
const GOOD = "the train stopped dead outside Reading at 6 o'clock and my phone was on two percent but then the guard came through and she goes don't worry we'll be moving in a minute and I was so relieved since then I always carry a charger";

// Group the checks about the story checks
describe("story checks", () => {
  // An empty transcript finds nothing and does not claim a start in the action
  it("finds nothing in an empty transcript", () => {
    // The checks on nothing, and on spaces
    expect([storyChecks(""), storyChecks("   ")]).toEqual([
      { dialogue: null, details: [], turn: null, andThen: 0, startsInAction: null, preamble: null, feeling: null, endsOnPoint: null },
      { dialogue: null, details: [], turn: null, andThen: 0, startsInAction: null, preamble: null, feeling: null, endsOnPoint: null },
    ]);
  });

  // A good story without punctuation is heard in full
  it("hears every beat in an unpunctuated story", () => {
    // The checks
    const checks = storyChecks(GOOD);
    // Confirm each
    expect([checks.dialogue, checks.details, checks.turn, checks.andThen, checks.startsInAction, checks.feeling, checks.endsOnPoint]).toEqual(["she goes", ["Reading", "6", "o'clock", "two"], "but", 0, true, "relieved", "since then"]);
  });

  // Reported speech in several forms, but not movement or a bare "told"
  it("tells reported speech from movement", () => {
    // Each case
    expect([dialogueIn("and I was like are you serious"), dialogueIn("I'm like no way"), dialogueIn("she said hold on"), dialogueIn("he told me to wait"), dialogueIn("he went home early"), dialogueIn("she goes to the gym"), dialogueIn("he goes wait for it"), dialogueIn("I told the story"), dialogue("He said, “Run!”")]).toEqual(["i was like", "i'm like", "she said", "told me", null, null, "he goes", null, "“Run!”"]);
  });

  // Details: numbers, number words, times and capitalised names, never a sentence's first word or "I"
  it("finds numbers, times and names, not sentence starts", () => {
    // A punctuated story
    expect(detailsIn("We left on Friday. It took three hours. Then I met Priya at the 24-hour diner. Then we went home.")).toEqual(["Friday", "three", "Priya", "24-hour"]);
  });

  // At most five details, each once
  it("keeps five details at most, without repeats", () => {
    // Many numbers, one repeated
    expect(detailsIn("1 2 2 3 4 5 6 7")).toEqual(["1", "2", "3", "4", "5"]);
  });

  // A turn word, as a whole word only
  it("finds a turn as a whole word", () => {
    // "butter" is not "but"; "turns out" is a turn
    expect([turnIn("I spread the butter"), turnIn("it turns out the shop was shut"), turnIn("everything was fine until the lights went out")]).toEqual([null, "turns out", "until"]);
  });

  // A list of events: "and then" counted, no turn
  it("counts and then in a list of events", () => {
    // A list, not a story
    const list = "we went to the beach and then we had lunch and then we went home and then we slept";
    // Confirm the count and that no turn was heard
    expect([andThenCount(list), turnIn(list)]).toEqual([3, null]);
  });

  // Lead-ins at the start, past any fillers, but only near the start
  it("spots a lead-in before the story", () => {
    // Each case
    expect([preambleIn("um so basically I was at work"), preambleIn("Let me tell you about my cat."), preambleIn("this one time at band camp"), preambleIn("so I was standing on the platform"), preambleIn("I was standing there and so basically nothing")]).toEqual(["so basically", "let me tell you", "this one time", null, null]);
  });

  // With punctuation, the first and last sentences are used; without, the first twelve and last fifteen words
  it("reads the opening and closing by sentence when it can", () => {
    // Punctuated and not
    expect([openingWords("It rained. We ran."), closingWords("It rained. We ran."), openingWords(Array.from({ length: 20 }, (_, index) => `w${index}`).join(" ")).length, closingWords(Array.from({ length: 20 }, (_, index) => `w${index}`).join(" ")).length]).toEqual([["it", "rained"], ["we", "ran"], 12, 15]);
  });

  // The ending: a point or a change in the last sentence, not earlier; trailing endings noticed
  it("finds a point only at the end", () => {
    // Each case
    expect([pointIn("Since then I always check. Then I went home."), pointIn("I went home. That's when I realized I was wrong."), trailsOff("and that was it so yeah"), trailsOff("I always carry a charger now")]).toEqual([null, "i realized", true, false]);
  });

  // Feeling words from the story list first, then small talk's, never "love" as a name for someone (found in the screenshot check)
  it("hears a feeling word", () => {
    // Each
    expect([feelingIn("I was mortified"), feelingIn("it was fun"), feelingIn("we walked"), feelingIn("she goes don't worry love and I was so relieved"), feelingIn("thanks love")]).toEqual(["mortified", "fun", null, "relieved", null]);
  });

  // The kept form is yes-or-no and counts
  it("keeps the checks as yes-or-no and counts", () => {
    // The raw form of the good story
    expect(storyRaw(GOOD)).toEqual({ dialogue: true, details: 4, turn: true, andThen: 0, startsInAction: true, feeling: true, endsOnPoint: true });
  });

  // The checklist says what showed each line, or what to try
  it("lists what it heard, with what to try where it heard nothing", () => {
    // The list for a flat story
    const lines = heardList(storyChecks("so basically we went to the shop and then we came home"));
    // Confirm the marks and two notes
    expect([lines.map((line) => line.heard), lines[0]?.note, lines[1]?.note]).toEqual([[false, false, false, false, false, false], "Opened with “so basically”.", "Say one line the way they said it."]);
  });
});

// Group the checks about the change picked without the coach
describe("storyChange", () => {
  // Too little said
  it("asks for more when hardly anything was said", () => {
    // A few words
    expect(storyChange("we went out", 12).retryCue).toBe("Tell it as if a friend just asked, “What happened?”");
  });

  // The chosen focus comes first when it was missed
  it("puts a missed focus first", () => {
    // A good story with no dialogue, focus on dialogue
    expect(storyChange("the train stopped outside Reading at six but the guard came through and I was so relieved since then I always carry a charger", 50, { focus: "dialogue" }).retryCue).toBe("Say one line the way they said it.");
  });

  // "And then" in place of a turn
  it("swaps and then for but or so", () => {
    // A list
    expect(storyChange("first we drove to the coast and then we parked the car and then we walked along the sand for a while", 40).change).toContain("it came 2 times");
  });

  // The "but and so" shape notices even one "and then"
  it("notices one and then in the but and so shape", () => {
    // One "and then"
    expect(storyChange("the train stopped at six and then the guard said wait but I was so relieved since then I always carry a charger", 40, { shape: "but-therefore" }).change).toContain("once");
  });

  // A one-minute focus that ran long
  it("says when a one-minute story ran long", () => {
    // Everything heard, but 90 seconds
    expect(storyChange(GOOD, 90, { focus: "minute" }).change).toContain("90 seconds");
  });

  // Everything there
  it("moves on to the turn when every beat was heard", () => {
    // The good story
    expect(storyChange(GOOD, 50).retryCue).toBe("Pause just before the turn.");
  });
});

// A helper that reads dialogue from punctuated text with a quote
function dialogue(text: string): string | null {
  // The same check
  return dialogueIn(text);
}
