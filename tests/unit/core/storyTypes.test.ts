// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { typeChecks } from "@/core/storyTypes";
// Load the templates
import { STORY_TEMPLATES, findStoryTemplate } from "@/content/stories";

// Group the checks about the stories you'll need (decision 152)
describe("typeChecks", () => {
  // Each new template's own worked example passes every check of its kind, so the checks can be met and the example teaches them
  it("passes each needed template's own example", () => {
    // The needed templates' examples, failing checks listed
    const failing = STORY_TEMPLATES.filter((template) => template.family === "needed").flatMap((template) => typeChecks(template.id, template.example.join(" ")).filter((check) => !check.passed).map((check) => `${template.id}: ${check.id}`));
    // Confirm none
    expect(failing).toEqual([]);
  });

  // Three checks for each needed kind, none for the everyday ones, none for nothing said
  it("gives three checks to each needed kind and none otherwise", () => {
    // The count for each template
    const counts = Object.fromEntries(STORY_TEMPLATES.map((template) => [template.id, typeChecks(template.id, "I said something.").length]));
    // Confirm, and nothing for an empty telling or no template
    expect([counts, typeChecks("toast", "  "), typeChecks(undefined, "Some words")]).toEqual([{ lesson: 0, "client-win": 0, "turning-point": 0, funny: 0, "who-i-am": 3, interview: 3, toast: 3, choice: 3 }, [], []]);
  });

  // Who I am: a list of jobs fails the moment and the link to now; a moment linked to now passes
  it("checks a who-I-am story for a moment, a link to now and a reason", () => {
    // A list
    const list = typeChecks("who-i-am", "I studied economics. Then I worked in a bank. Then I moved into marketing.");
    // A story
    const story = typeChecks("who-i-am", "When I was nine my dad gave me a broken radio. I loved finding out why it stopped. That's why I fix machines today.");
    // Confirm which passed
    expect([list.map((check) => check.passed), story.map((check) => check.passed)]).toEqual([[false, false, false], [true, true, true]]);
  });

  // An interview answer: "we" all the way through, no number and no reflection fail; a good one passes with its evidence
  it("checks an interview answer for I, a number and what you'd keep", () => {
    // All "we"
    const we = typeChecks("interview", "We had a problem with the site. We worked on it as a team and we fixed it.");
    // A good one, with digits
    const good = typeChecks("interview", "The queue had 400 tickets. I was asked to fix it. I sorted them and I wrote three fixes. We got it under 50. Since then I always look for the pattern first.");
    // Confirm, with the evidence for the good one
    expect([we.map((check) => check.passed), good.map((check) => [check.passed, check.evidence])]).toEqual([[false, false, false], [[true, "“I” 4 times, “we” 1"], [true, "“400”"], [true, "“since then”"]]]);
  });

  // A toast: no glass raised fails that check, with a note on how to end
  it("checks a toast for a moment, a quality and a raised glass", () => {
    // A toast that never raises a glass
    const checks = typeChecks("toast", "I remember the day Priya carried my boxes up four floors. She is the kindest person I know. Anyway that's it.");
    // Confirm the first two pass and the last fails with its note
    expect(checks.map((check) => [check.id, check.passed, check.passed ? null : check.evidence])).toEqual([["moment", true, null], ["quality", true, null], ["raise", false, "Finish with “please raise your glasses: to…”"]]);
  });

  // A choice: the choice and its cost found; with no reason, why it mattered fails
  it("checks a choice story for the choice, its cost and why it mattered", () => {
    // A choice with a cost and no reason
    const checks = typeChecks("choice", "My manager wanted the numbers changed. I said no. It cost me the promotion.");
    // Confirm
    expect(checks.map((check) => [check.id, check.passed])).toEqual([["choice", true], ["cost", true], ["why", false]]);
  });

  // Every needed template has its beats, example piece per beat, a line on what it needs and how a guided story asks for it
  it("gives every needed template a full set of parts", () => {
    // The needed ones
    const needed = STORY_TEMPLATES.filter((template) => template.family === "needed");
    // Confirm each
    expect([needed.map((template) => template.id), needed.every((template) => template.beats.length === template.example.length && !!template.needs && !!template.makeIt), findStoryTemplate("toast").makeIt]).toEqual([["who-i-am", "interview", "toast", "choice"], true, "Make it a toast"]);
  });
});
