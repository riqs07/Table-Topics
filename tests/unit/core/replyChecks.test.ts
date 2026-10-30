// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { mentions, mostPassed, replyCheck, replyChecks } from "@/core/replyChecks";

// What they said, for picking up their words
const SAID = "I keep thinking it'll calm down next week. It never does.";

// Group the checks about spoken replies (decisions 149 and 150)
describe("replyCheck", () => {
  // A good listening reply passes each listening check, with the words that showed it
  it("passes a good listening reply, quoting what showed each check", () => {
    // A reply that picks up his words, names the feeling and stays on him
    const reply = "Oh no, every week it never calms down. That sounds really draining. How are you holding up?";
    // The results
    const results = replyChecks(["react", "their-words", "their-feeling", "question", "stays", "no-advice"], reply, SAID);
    // Confirm every check passed, with quotes where there are words to quote
    expect(results.map((check) => [check.id, check.passed, check.evidence])).toEqual([["react", true, "“oh no”"], ["their-words", true, "“never”, “down”"], ["their-feeling", true, "“that sounds”"], ["question", true, null], ["stays", true, null], ["no-advice", true, null]]);
  });

  // Advice, a shift to yourself and a closed question each fail, quoting what got in the way
  it("fails advice, a shift to yourself and a yes-or-no question, saying why", () => {
    // A reply that shifts to you, advises, and asks a closed question
    const reply = "Same thing happened to me last year. You should talk to your manager. Did you tell them?";
    // The results
    const [stays, advice, open] = replyChecks(["stays", "no-advice", "open-question"], reply, SAID);
    // Confirm each failed with its reason
    expect([stays, advice, open].map((check) => [check!.passed, check!.evidence])).toEqual([[false, "“happened to me”"], [false, "“you should”"], [false, "A yes-or-no question: try “what” or “how”"]]);
  });

  // Answering checks: a dead end fails, a moment with a feeling and a hand-back passes
  it("checks an answer for a dead end, a feeling and a hand-back", () => {
    // A dead-end answer
    const dead = replyChecks(["no-dead-end", "own-feeling", "hand-back"], "Not much really.", "");
    // A good answer
    const good = replyChecks(["no-dead-end", "own-feeling", "hand-back"], "My sister's visiting and I'm so excited. What about you?", "");
    // An empty answer gives nothing to pick up
    const empty = replyCheck("no-dead-end", "   ", "");
    // Confirm the dead end fails all three, the good answer passes all three, and silence fails
    expect([dead.map((check) => check.passed), good.map((check) => check.passed), empty.passed]).toEqual([[false, false, false], [true, true, true], false]);
  });

  // Every check has a name to show
  it("names every check", () => {
    // One of each
    const all = replyChecks(["react", "their-words", "their-feeling", "question", "open-question", "stays", "no-advice", "hand-back", "no-dead-end", "own-feeling"], "", "");
    // Confirm every label is filled in
    expect(all.every((check) => check.label.length > 0)).toBe(true);
  });
});

// Group the checks about the overall verdict
describe("mostPassed", () => {
  // Half rounded up passes; fewer, or no checks at all, does not
  it("needs at least half the checks, rounded up", () => {
    // A check that passed or not
    const check = (passed: boolean) => ({ id: "react" as const, passed, label: "", evidence: null });
    // Two of four, one of three, none
    expect([mostPassed([check(true), check(true), check(false), check(false)]), mostPassed([check(true), check(false), check(false)]), mostPassed([])]).toEqual([true, false, false]);
  });
});

// Group the checks about finding a story's words in a reply
describe("mentions", () => {
  // Long words match by their first letters (so "clapping" finds "clapped"), short words and numbers only whole (so "clap" does not), phrases as words in order
  it("matches stems, whole short words, numbers and phrases", () => {
    // A reply
    const reply = "They all clapped at the finish? You ran 5 K, the whole thing, and came last!";
    // Each kind of term
    expect([mentions(reply, ["clap"]), mentions(reply, ["clapping"]), mentions(reply, ["5"]), mentions(reply, ["the whole thing"]), mentions(reply, ["last"]), mentions(reply, ["las"]), mentions(reply, ["ten", "10"]), mentions(reply, [""])]).toEqual([null, "clapping", "5", "the whole thing", "last", null, null, null]);
  });

  // A stem never matches a different word that only shares a short start
  it("does not match a word that only shares a few letters", () => {
    // "pastries" against "past"
    expect([mentions("In the past I ran", ["pastries"]), mentions("We had pastries after", ["pastr"])]).toEqual([null, "pastr"]);
  });
});
