// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { afterTakeHref, compareLine, courseCount, courseTakeFromQuery, courseToOffer, coursePlaces, findCourse, findPart, isPartDone, lessonCount, measureText, nextPart, partHref, partMinutes, partSteps, practicePromptText, revisitsDue, takeHref } from "@/core/courses";
// Load the courses and their types
import { COURSES, type Course } from "@/content/courses";
// Load the focus areas, so every one can be checked for a course
import { FOCUS_AREAS } from "@/core/practiceFocus";
// Load the Learn card finder, for the research a part points to
import { findCard } from "@/content/learn";
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

// Group the checks about the courses' content (decisions 131 and 144)
describe("course content", () => {
  // Every part
  const parts = COURSES.flatMap((course) => coursePlaces(course).map((place) => place.part));

  // Ids unique, prompts real, the first course for thinking on your feet
  it("has unique part ids and real prompts", () => {
    // Confirm unique ids, every prompt found (a story prompt for a story, any other prompt otherwise), and the first course's focus
    expect([new Set(parts.map((part) => part.id)).size === parts.length, parts.filter((part) => part.practice && !practicePromptText(part.practice)).map((part) => part.id), COURSES[0]?.focus]).toEqual([true, [], "spot"]);
  });

  // One course for each focus area, so every answer to the welcome question leads to one
  it("has one course for each focus area", () => {
    // Confirm each focus has exactly one
    expect(FOCUS_AREAS.map((area) => [area.id, COURSES.filter((course) => course.focus === area.id).length])).toEqual(FOCUS_AREAS.map((area) => [area.id, 1]));
  });

  // Each part's prompt is its own, so a prompt coming back days later belongs to one part only
  it("gives every part with practice a prompt of its own", () => {
    // The prompts used, with the kind of session (the same id can name a lesson and a reading of it in different modes)
    const used = parts.flatMap((part) => (part.practice ? [`${part.practice.mode}:${part.practice.promptId}`] : []));
    // Confirm none repeats
    expect(used.filter((key, index) => used.indexOf(key) !== index)).toEqual([]);
  });

  // The research and the links a part points to exist
  it("points only to real Learn cards and in-app pages", () => {
    // Confirm every card is found and every link is an address inside the app
    expect([parts.filter((part) => part.learn.card && !findCard(part.learn.card)).map((part) => part.id), parts.filter((part) => part.learn.link && !part.learn.link.href.startsWith("/")).map((part) => part.id)]).toEqual([[], []]);
  });

  // No course is a draft any more, and every lesson in a course has its own id
  it("has final words and unique lesson ids in each course", () => {
    // Confirm both
    expect([COURSES.filter((course) => course.draft).map((course) => course.id), COURSES.filter((course) => new Set(course.lessons.map((lesson) => lesson.id)).size !== course.lessons.length).map((course) => course.id)]).toEqual([[], []]);
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

  // A story part carries its set-up to the recorder, on the try and when it comes back (decision 144)
  it("builds a story part's address with its set-up", () => {
    // A story part with a shape and a focus
    const story = { id: "s-story", title: "S", learn: { headline: "h", body: "b" }, practice: { mode: "story" as const, promptId: "sp03", story: { shape: "but-therefore" as const, focus: "detail" as const, length: "full" as const }, goal: "g", tries: 1 as const, measure: "length" as const } };
    // Confirm the try's and the comeback's addresses
    expect([takeHref(story, 1), takeHref(story, 1, true)]).toEqual(["/session?mode=story&prompt=sp03&shape=but-therefore&focus=detail&length=full&course=s-story&try=1", "/session?mode=story&prompt=sp03&shape=but-therefore&focus=detail&length=full&course=s-story&revisit=1"]);
  });

  // A part's question comes from the story bank for a story and from the prompt lists otherwise; an unknown id has none
  it("finds a part's question in the right list", () => {
    // A story prompt, a small-talk question, a reading's title, and an unknown id
    const texts = [practicePromptText({ mode: "story", promptId: "sp03", goal: "g", tries: 1, measure: "length" }), practicePromptText({ mode: "smalltalk", promptId: "st01", goal: "g", tries: 1, measure: "length" }), practicePromptText({ mode: "read", promptId: "r004", goal: "g", tries: 1, measure: "pace" }), practicePromptText({ mode: "story", promptId: "t001", goal: "g", tries: 1, measure: "length" })];
    // Confirm each
    expect(texts).toEqual(["Tell me about a time a recipe or a repair did not go to plan.", "How was your weekend?", "Ask not", undefined]);
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
