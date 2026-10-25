// Story templates (decision 126): the four templates and their examples, the template suggested for a prompt, the set-up read from and written to an address, and the beat counts, headlines and comparison on the results
import { describe, expect, it } from "vitest";
// Load the templates and the address helpers
import { STORY_TEMPLATES, findStoryTemplate, isStoryTemplate, storyTakeFromQuery, storyTakeQuery, suggestedTemplate } from "@/content/stories";
// Load the beats on the results
import { beatCounts, beatsCompareRow, storyHeadline, templateBeatsOf } from "@/core/storyBeats";
// Load the record types
import type { Feedback, TemplateBeatNote } from "@/data/records";

// A telling's feedback with some beats
function told(statuses: ReadonlyArray<TemplateBeatNote["status"]>): { feedback: Feedback } {
  // The beats, named in order
  const templateBeats = statuses.map((status, index) => ({ beat: `b${index}`, status, quote: status === "missing" ? "" : "words" }));
  // The feedback
  return { feedback: { keep: "k", change: "c", retryCue: "r", story: { beats: [], templateBeats, yours: "y", better: "b" } } };
}

describe("the templates", () => {
  // Four, each with an example piece per beat
  it("has four templates, each example one piece per beat, and finds them by id", () => {
    // The ids and the example lengths
    expect([STORY_TEMPLATES.map((template) => template.id), STORY_TEMPLATES.every((template) => template.example.length === template.beats.length)]).toEqual([["lesson", "client-win", "turning-point", "funny"], true]);
    // A lookup, the fallback and the check
    expect([findStoryTemplate("funny").name, findStoryTemplate("nope").id, isStoryTemplate("client-win"), isStoryTemplate("classic")]).toEqual(["Funny moment", "lesson", true, false]);
  });

  // The suggestion follows the prompt's group
  it("suggests a template by the prompt's group, Lesson learned otherwise", () => {
    // Something went wrong, a small win, something funny, a moment note and a guided story
    expect(["sp01", "sp06", "sp36", "moment-abc", "gs13"].map(suggestedTemplate)).toEqual(["lesson", "client-win", "funny", "lesson", "lesson"]);
  });
});

describe("the set-up in an address", () => {
  // An address reader
  const params = (query: string) => new URLSearchParams(query);

  // Read: the template, an older shape, or the suggested one
  it("reads the template asked for, an older story's shape, or the suggested template", () => {
    // Each case
    expect([storyTakeFromQuery(params("template=funny&length=short"), "sp01"), storyTakeFromQuery(params("shape=then-now&focus=point"), "sp01"), storyTakeFromQuery(params("template=nope&focus=bad"), "sp06")]).toEqual([{ template: "funny", focus: null, length: "short" }, { shape: "then-now", focus: "point", length: "full" }, { template: "client-win", focus: null, length: "full" }]);
  });

  // Written: the template, or an older shape, with any focus and the length
  it("writes the set-up back the same way", () => {
    // A template, and an older shape with a focus
    expect([storyTakeQuery({ template: "lesson", focus: null, length: "full" }), storyTakeQuery({ shape: "classic", focus: "middle", length: "short" })]).toEqual(["&template=lesson&length=full", "&shape=classic&focus=middle&length=short"]);
  });
});

describe("the beats on the results", () => {
  // Counted
  it("counts strong, weak and missing beats, and finds none on older feedback", () => {
    // Counts
    expect(beatCounts(templateBeatsOf(told(["strong", "weak", "missing", "strong"]))!)).toEqual({ strong: 2, weak: 1, missing: 1, total: 4 });
    // No beats, or an empty list
    expect([templateBeatsOf({ feedback: null }), templateBeatsOf(told([]))]).toEqual([null, null]);
  });

  // The headline
  it("heads a first telling by its clear beats, and a retelling against the one before", () => {
    // A first telling, every beat clear, and before the coach answers
    expect([storyHeadline(told(["strong", "weak", "missing"]), null), storyHeadline(told(["strong", "strong"]), null), storyHeadline({ feedback: null }, null), storyHeadline({ feedback: null }, told(["strong"]))]).toEqual(["1 of 3 beats came through clearly.", "Every beat came through.", "Your story.", "Told again."]);
    // Better, the same and less clear than last time (a weak beat counts half)
    expect([storyHeadline(told(["strong", "weak"]), told(["weak", "missing"])), storyHeadline(told(["strong", "missing"]), told(["weak", "weak"])), storyHeadline(told(["missing", "weak"]), told(["strong", "weak"]))]).toEqual(["It landed better than last time.", "About the same as last time.", "Not quite as clear as last time."]);
  });

  // The comparison row
  it("compares two tellings' clear beats, only when both have them", () => {
    // Both, then one without
    expect([beatsCompareRow(told(["strong", "missing"]), told(["strong", "strong"])), beatsCompareRow({ feedback: null }, told(["strong"]))]).toEqual([{ label: "beats clear", before: "1 of 2", after: "2 of 2" }, null]);
  });
});
