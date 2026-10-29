// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { afterTakeHref, compareLine, courseCount, courseTakeFromQuery, courseToOffer, coursePlaces, findCourse, findPart, isPartDone, lessonCount, measureText, nextPart, partHref, partMinutes, partSteps, revisitsDue, takeHref } from "@/core/courses";
// Load the courses and their types
import { COURSES, type Course } from "@/content/courses";
// Load the prompt lookup
import { findPrompt } from "@/content/prompts";
// Load the session builder
import { makeSession } from "../../support/fixtures";

// A small course for the checks: two lessons, three parts, one with nothing to practise
const SMALL: Course = {
  id: "small",
  focus: "spot",
  title: "Small",
  blurb: "b",
  outcomes: [],
  draft: true,
  lessons: [
    // Lesson 1: two parts
    { id: "a", title: "A", blurb: "", parts: [{ id: "s-a-1", title: "A1", learn: { headline: "h", body: "b" }, see: { model: { question: "q", answer: "x y", highlight: "x", notice: "n" } }, practice: { mode: "talk", promptId: "t001", goal: "g", tries: 2, measure: "fillers" } }, { id: "s-a-2", title: "A2", learn: { headline: "h", body: "b" } }] },
    // Lesson 2: one part
    { id: "b", title: "B", blurb: "", parts: [{ id: "s-b-1", title: "B1", learn: { headline: "h", body: "b" }, practice: { mode: "talk", promptId: "t002", goal: "g", tries: 1, measure: "length" } }] },
  ],
};

// Progress for a part finished on a day
const doneOn = (iso: string, takeId: string | null = "take") => ({ doneAt: iso, takeId });

// Group the checks about the courses' content (decision 131)
describe("course content", () => {
  // Ids unique, prompts real, at least one course for thinking on your feet
  it("has unique part ids and real prompts", () => {
    // Every part
    const parts = COURSES.flatMap((course) => coursePlaces(course).map((place) => place.part));
    // Confirm unique ids, every prompt found, and the first course's focus
    expect([new Set(parts.map((part) => part.id)).size === parts.length, parts.every((part) => !part.practice || !!findPrompt(part.practice.promptId)), COURSES[0]?.focus]).toEqual([true, true, "spot"]);
  });
});

// Group the checks about finding and ordering parts (decision 131)
describe("course places", () => {
  // Parts in order with their numbers, and lookups by id
  it("numbers parts and finds them", () => {
    // The places
    const places = coursePlaces(SMALL).map((place) => `${place.lessonNumber}.${place.partNumber}`);
    // Confirm the order, a found part, a missing one, and a course lookup
    expect([places, findPart("s-b-1", [SMALL])?.lesson.id, findPart("nope", [SMALL]), findCourse("small", [SMALL])?.title]).toEqual([["1.1", "1.2", "2.1"], "b", undefined, "Small"]);
  });

  // The next part skips finished ones; a part finished today does not count before today
  it("finds the next part, counting only what was done before a moment", () => {
    // Part 1 done on the 20th, part 2 on the 22nd
    const progress = { "s-a-1": doneOn("2026-10-20T10:00:00Z"), "s-a-2": doneOn("2026-10-22T10:00:00Z", null) };
    // Confirm the next now, the next as of the 21st, counts, and done-ness
    expect([nextPart(SMALL, progress)?.part.id, nextPart(SMALL, progress, new Date("2026-10-21T00:00:00Z"))?.part.id, courseCount(SMALL, progress), lessonCount(SMALL.lessons[0]!, progress), isPartDone(progress, "s-a-2", new Date("2026-10-21T00:00:00Z"))]).toEqual(["s-b-1", "s-a-2", { done: 2, total: 3 }, { done: 2, total: 2 }, false]);
  });

  // Every part done: none next
  it("has no next part once every part is done", () => {
    // All three done
    const progress = { "s-a-1": doneOn("2026-10-20T10:00:00Z"), "s-a-2": doneOn("2026-10-20T10:00:00Z"), "s-b-1": doneOn("2026-10-20T10:00:00Z") };
    // Confirm none
    expect(nextPart(SMALL, progress)).toBeNull();
  });
});

// Group the checks about which course Today offers (decision 131)
describe("courseToOffer", () => {
  // A second course for another focus
  const OTHER: Course = { ...SMALL, id: "other", focus: "work", lessons: [{ id: "x", title: "X", blurb: "", parts: [{ id: "o-1", title: "O", learn: { headline: "h", body: "b" } }] }] };

  // By focus when nothing is started; a started course wins whatever the focus; nothing without a match
  it("offers a started course first, then one for the focus", () => {
    // Nothing started, focus on work
    const byFocus = courseToOffer(["work"], {}, undefined, [SMALL, OTHER])?.id;
    // The small course started, focus on work
    const started = courseToOffer(["work"], { "s-a-1": doneOn("2026-10-20T10:00:00Z") }, undefined, [SMALL, OTHER])?.id;
    // No focus, nothing started
    const none = courseToOffer([], {}, undefined, [SMALL, OTHER]);
    // Confirm each
    expect([byFocus, started, none]).toEqual(["other", "small", null]);
  });

  // A finished course is not offered
  it("skips a finished course", () => {
    // The other course finished
    expect(courseToOffer(["work"], { "o-1": doneOn("2026-10-20T10:00:00Z") }, undefined, [SMALL, OTHER])).toBeNull();
  });
});

// Group the checks about a part's steps and addresses (decision 131)
describe("part steps and addresses", () => {
  // Steps follow what the part has; minutes add up
  it("lists steps and minutes from what the part has", () => {
    // The three parts
    const [first, second, third] = coursePlaces(SMALL).map((place) => place.part);
    // Confirm the steps and minutes
    expect([partSteps(first!), partSteps(second!), partSteps(third!), partMinutes(first!), partMinutes(second!), partMinutes(third!)]).toEqual([["learn", "see", "try", "wrap"], ["learn", "wrap"], ["learn", "try", "wrap"], 6, 1, 3]);
  });

  // The part's page, the recording page, and where a take goes once saved
  it("builds the addresses", () => {
    // The first part
    const part = SMALL.lessons[0]!.parts[0]!;
    // Confirm each address
    expect([partHref("x"), partHref("x", "try", 2), takeHref(part, 2), takeHref(part, 1, true), takeHref(SMALL.lessons[0]!.parts[1]!, 1)]).toEqual(["/courses/part?id=x", "/courses/part?id=x&step=try&try=2", "/session?mode=talk&prompt=t001&course=s-a-1&try=2", "/session?mode=talk&prompt=t001&course=s-a-1&revisit=1", null]);
  });

  // Where a saved course take goes: the next try, the wrap-up, or the comparison
  it("sends a saved take on", () => {
    // A real two-try part
    const partId = COURSES[0]!.lessons[0]!.parts[0]!.id;
    // Confirm try 1, try 2 and a comeback
    expect([afterTakeHref({ part: partId, attempt: 1 }, "k"), afterTakeHref({ part: partId, attempt: 2 }, "k"), afterTakeHref({ part: partId, attempt: 1, revisit: true }, "k")]).toEqual([`/courses/part?id=${partId}&step=try&try=2`, `/courses/part?id=${partId}&step=wrap`, `/courses/revisit?id=${partId}&take=k`]);
  });

  // The address's course take, only for a real part with practice and a sensible try
  it("reads a course take from the address", () => {
    // A real part
    const partId = COURSES[0]!.lessons[0]!.parts[0]!.id;
    // Read a query
    const read = (query: string) => courseTakeFromQuery(new URLSearchParams(query));
    // Confirm each
    expect([read(`course=${partId}`), read(`course=${partId}&try=2`), read(`course=${partId}&revisit=1`), read(`course=${partId}&try=7`), read("course=nope"), read("")]).toEqual([{ part: partId, attempt: 1 }, { part: partId, attempt: 2 }, { part: partId, attempt: 1, revisit: true }, null, null, null]);
  });
});

// Group the checks about prompts coming back (decision 131)
describe("revisitsDue", () => {
  // Three days or more, with a take, not yet answered again; oldest first
  it("lists parts finished three days ago or more", () => {
    // The real course's first three practice parts
    const [a, b, c] = coursePlaces(COURSES[0]!).filter((place) => place.part.practice).map((place) => place.part.id);
    // A on the 20th, B on the 18th, C yesterday; A has no take on another; one already answered again
    const progress = { [a!]: doneOn("2026-10-20T10:00:00Z"), [b!]: doneOn("2026-10-18T10:00:00Z"), [c!]: doneOn("2026-10-27T10:00:00Z"), "sf-beat-x": doneOn("2026-10-01T10:00:00Z"), [COURSES[0]!.lessons[4]!.parts[0]!.id]: { ...doneOn("2026-10-01T10:00:00Z"), revisitedAt: "2026-10-05T10:00:00Z" } };
    // Confirm B then A (C too recent, an unknown part dropped, an answered one left out)
    expect(revisitsDue(progress, new Date("2026-10-28T12:00:00Z")).map((place) => place.part.id)).toEqual([b, a]);
  });
});

// Group the checks about comparing two takes (decision 131)
describe("compareLine", () => {
  // Each measure in neutral words
  it("compares on the part's measure", () => {
    // Two takes
    const [first, second] = [makeSession({ fillersPerMinute: 4.25, wordsPerMinute: 150, durationSec: 42 }), makeSession({ fillersPerMinute: 1, wordsPerMinute: 132, durationSec: 65 })];
    // Confirm each line, the reverse, and a held value
    expect([compareLine("fillers", first, second), compareLine("fillers", second, first), compareLine("fillers", second, second), compareLine("pace", first, second), compareLine("length", first, second)]).toEqual(["Fewer pause words: 4.3 a minute, then 1.", "More pause words this time: 1 a minute, then 4.3.", "Pause words held at 1 a minute.", "Pace: 150 words a minute, then 132.", "Length: 0:42, then 1:05."]);
  });

  // A missing value says nothing
  it("says nothing without both values", () => {
    // A take with no words
    expect([compareLine("pace", makeSession({ wordsPerMinute: 0 }), makeSession()), measureText("length", 125)]).toEqual([null, "2:05"]);
  });
});
