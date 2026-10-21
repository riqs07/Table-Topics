// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the comparison being checked
import { addedList, compareWithFacts, contentStems, factChecks, guidedChange, guidedRaw, newDetails, stem, tellingChange } from "@/core/guidedStory";
// Load the guided stories, for the zoo's facts
import { factsOf, findGuidedStory } from "@/content/guidedStories";
// Load the open story change, to compare with
import { storyChange } from "@/core/storyChecks";

// The zoo's facts, the twist last
const ZOO = factsOf(findGuidedStory("gs13")!);
// A flat telling: just the facts, read back
const FLAT = "I went to the zoo and then I got a hot dog and then I saw a gorilla and the gorilla was staring right at me";
// A telling brought to life: a detail, a feeling, someone's words, a turn and a point, every fact kept
const ALIVE = "The hot dog was sticky with mustard when I reached the gorilla cage at the zoo on Saturday but the gorilla was staring right at me and my friend leans in and she goes don't move and I was terrified and since then I always eat before the zoo";

// Group the checks about stems and content words
describe("guided story words", () => {
  // Endings are cut so forms of a word meet, and both sides use the same rule
  it("cuts words to rough stems", () => {
    // Each pair should meet
    expect([[stem("burned"), stem("burn")], [stem("boxes"), stem("box")], [stem("cakes"), stem("cake")], [stem("running"), stem("run")], [stem("Friend's"), stem("friend")], [stem("lorries"), stem("lorry")], [stem("stopped"), stem("stop")]].map(([a, b]) => a === b)).toEqual([true, true, true, true, true, true, true]);
  });

  // A fact is matched on the words that carry meaning
  it("keeps only the content words of a fact", () => {
    // Facts with stop words, and one with none
    expect([contentStems("You saw a gorilla."), contentStems("You got a hot dog."), contentStems("It was the last minute."), contentStems("You did it.")]).toEqual([["gorilla"], ["hot", "dog"], ["last", "minut"], []]);
  });
});

// Group the checks about the facts kept
describe("factChecks", () => {
  // Every fact heard in a telling that keeps them
  it("hears every fact in a telling that keeps them", () => {
    // Confirm all kept
    expect(factChecks(ZOO, ALIVE).map((check) => check.heard)).toEqual([true, true, true, true]);
  });

  // A fact whose words were never said is flagged, with the words listened for
  it("flags a fact that went missing, with its words", () => {
    // A telling without the gorilla
    const checks = factChecks(ZOO, "I went to the zoo and bought a hot dog and it was lovely");
    // Confirm which, and the word not heard
    expect(checks.map((check) => [check.heard, check.notHeard])).toEqual([[true, []], [true, []], [false, ["gorilla"]], [false, ["gorilla", "staring", "right"]]]);
  });

  // At least half the content words is enough, so a fact said in other words mostly still counts
  it("counts a fact as heard when half its words were said", () => {
    // "Dog" without "hot"; "minute" without "last"
    expect([factChecks(["You got a hot dog."], "the dog was cold")[0]!.heard, factChecks(["The ceremony started late."], "the ceremony was lovely")[0]!.heard]).toEqual([true, false]);
  });

  // Words said run together still meet a fact's two words, and the other way round
  it("matches words run together", () => {
    // "hotdog" for "hot dog", and "sand castle" for "sandcastle"
    expect([factChecks(["You got a hot dog."], "a hotdog")[0]!.notHeard, factChecks(["You built a sandcastle."], "we built a sand castle")[0]!.heard]).toEqual([[], true]);
  });

  // Nothing said: every fact is missing; a fact of only stop words is never flagged; no facts, nothing to check
  it("handles an empty telling, a fact with no content words and no facts", () => {
    // Each edge
    expect([factChecks(ZOO, "").every((check) => !check.heard), factChecks(["You did it."], "")[0]!.heard, factChecks([], "words")]).toEqual([true, true, []]);
  });

  // Case, punctuation and curly apostrophes do not matter
  it("ignores case and punctuation", () => {
    // Shouted and punctuated
    expect(factChecks(["You baked a cake for a friend's birthday."], "BAKED! A CAKE, for my friend’s BIRTHDAY.")[0]!.heard).toBe(true);
  });
});

// Group the checks about what was added
describe("addedList", () => {
  // A flat telling adds nothing; a lively one adds all five
  it("finds nothing added to a flat telling and all five in a lively one", () => {
    // Both
    expect([addedList(FLAT, ZOO).map((line) => line.added), addedList(ALIVE, ZOO).map((line) => line.added)]).toEqual([[false, false, false, false, false], [true, true, true, true, true]]);
  });

  // What showed each thing added, quoted
  it("quotes what showed each thing added", () => {
    // The lively telling's notes
    expect(addedList(ALIVE, ZOO).map((line) => line.note)).toEqual(["“terrified”", "“she goes”", "“but”", "“Saturday”, “sticky”", "“since then”"]);
  });

  // Words the facts already had never count as added
  it("does not count words the facts already gave", () => {
    // Facts that name a colour and a feeling; a telling that only repeats them
    const facts = ["You wore a red hat.", "You felt nervous."];
    // Confirm no detail and no feeling were added
    expect([newDetails("I wore a red hat and I felt nervous", facts), addedList("I wore a red hat and I felt nervous", facts).find((line) => line.id === "feeling")?.added]).toEqual([[], false]);
  });

  // New details: names, numbers and picture words not in the facts, five at most, each once
  it("lists new details, five at most, each once", () => {
    // Many details
    expect(newDetails("At 6 we met Sam and Priya by the red red door near Leeds with a huge tiny loud dog", ZOO)).toEqual(["6", "Sam", "Priya", "Leeds", "red"]);
  });

  // "We went camping" is an outing, not someone's words
  it("does not hear an outing as someone's words", () => {
    // The camping facts and an outing
    expect(addedList("we went camping with friends and it rained", ["You went camping with friends."]).find((line) => line.id === "dialogue")?.added).toBe(false);
  });
});

// Group the checks about the whole comparison and its change
describe("compareWithFacts and guidedChange", () => {
  // The counts
  it("counts what was added and the facts kept", () => {
    // Both tellings
    expect([guidedRaw(FLAT, ZOO), guidedRaw(ALIVE, ZOO), compareWithFacts(ZOO, "").addedCount]).toEqual([{ added: 0, factsHeard: 4, facts: 4 }, { added: 5, factsHeard: 4, facts: 4 }, 0]);
  });

  // Too little said comes first
  it("asks for more when hardly anything was said", () => {
    // A few words
    expect(guidedChange("the zoo", ZOO, 5).retryCue).toBe("Tell it as if a friend just asked, “What happened?”");
  });

  // The chosen focus comes first when missed, then a missing fact, then "and then", then the first thing not added
  it("picks the focus first, then a missing fact, then and-then, then what to add", () => {
    // Each case
    const [focusFirst, lostFact, andThen, addTurn] = [guidedChange(FLAT, ZOO, 40, { focus: "dialogue" }), guidedChange("I went to the zoo and I bought a hot dog with mustard and the sun was out and it was a lovely warm day for it", ZOO, 40), guidedChange(FLAT, ZOO, 40), guidedChange("I went to the zoo and bought a hot dog and saw a gorilla and the gorilla was staring right at me all day long", ZOO, 40)];
    // Confirm each
    expect([focusFirst.retryCue, lostFact.change.startsWith("Keep every fact in. I didn’t hear “You saw a gorilla.”"), andThen.retryCue, addTurn.retryCue]).toEqual(["Say one line the way they said it.", true, "Link each fact with “but” or “so”.", "Find the “but” and slow down there."]);
  });

  // A lead-in breaks "Start in the middle"; going long breaks "Under a minute"; everything there gets a next step
  it("checks the opening and the minute, and praises a full telling", () => {
    // Each case
    expect([guidedChange(`so basically ${ALIVE}`, ZOO, 40, { focus: "middle" }).retryCue, guidedChange(ALIVE, ZOO, 90, { focus: "minute" }).retryCue, guidedChange(ALIVE, ZOO, 40).retryCue]).toEqual(["Open with the moment things start moving.", "Start at the moment it turned.", "Pause just before the turn."]);
  });

  // The change for any telling: guided ones against their facts, open ones by the story checks
  it("routes a telling to the right change", () => {
    // A guided and an open telling of the same words
    expect([tellingChange("gs13", FLAT, 40).retryCue, tellingChange("sp01", FLAT, 40)]).toEqual(["Link each fact with “but” or “so”.", storyChange(FLAT, 40)]);
  });
});
