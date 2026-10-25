// Focus first (decision 115): which views each kind of take shows, its length bands at their boundaries, and "Look closer" on every take with words
import { describe, expect, it } from "vitest";
// Load the selector
import { lengthBand, takeViews, type TakeFacts } from "@/core/takeViews";
// Load every kind of session and the lessons
import { SESSION_MODES } from "@/data/records";
import { LESSONS } from "@/content/lessons";
import { TRICKY_WORDS } from "@/content/prompts";

// A take of a kind and length
function take(mode: TakeFacts["mode"], durationSec: number, extra: Partial<TakeFacts> = {}): TakeFacts {
  // The facts
  return { mode, promptId: "x001", durationSec, ...extra };
}

describe("lengthBand", () => {
  // The boundaries the user named
  it("puts 59 s in short, 60 and 120 s in medium, and 121 s in long", () => {
    // Under a minute
    expect(lengthBand(59)).toBe("short");
    // A minute
    expect(lengthBand(60)).toBe("medium");
    // Two minutes
    expect(lengthBand(120)).toBe("medium");
    // Just over
    expect(lengthBand(121)).toBe("long");
  });
});

describe("takeViews: the length rule", () => {
  // A 40-second Rapid Fire answer
  it("shows only the pitch in the words on a short take, with Look closer", () => {
    // The plan
    const plan = takeViews(take("talk", 40));
    // By length, one view, Look closer
    expect(plan).toMatchObject({ rule: "length", band: "short", views: ["pitch-text"], lookCloser: true });
  });

  // 59 and 60 seconds draw the same
  it("treats 59 s and 60 s alike on the page (one view, the tabs folded)", () => {
    // Both the pitch in the words only
    expect(takeViews(take("response", 59)).views).toEqual(["pitch-text"]);
    // (a minute)
    expect(takeViews(take("response", 60)).views).toEqual(["pitch-text"]);
  });

  // 120 is still medium; 121 opens up
  it("opens the fingerprint, the tabs, the best moment and the energy arc only past 120 s", () => {
    // Two minutes exactly
    expect(takeViews(take("response", 120)).views).toEqual(["pitch-text"]);
    // A second more
    expect(takeViews(take("response", 121)).views).toEqual(["fingerprint", "lens-tabs", "best-moment", "energy-arc"]);
  });

  // Every length-rule kind
  it.each(["talk", "response", "free", "outline", "rehearse", "smalltalk", "standard", "warmup", "bookend", "qa", "moment"] as const)("goes by length for %s", (mode) => {
    // A long take of the kind
    expect(takeViews(take(mode, 180))).toMatchObject({ rule: "length", band: "long", lens: "pitch", lookCloser: true });
  });

  // The check-in's pitch and surprise question are ordinary talk
  it("goes by length for the check-in's pitch (a two-minute outline)", () => {
    // Two and a half minutes
    expect(takeViews(take("outline", 150, { checkIn: { part: "pitch" } })).views).toContain("fingerprint");
  });
});

describe("takeViews: drills and lessons show only their own view", () => {
  // A pause drill
  it("shows only the pauses lens on a pause drill, whatever its length", () => {
    // Short and long
    for (const seconds of [30, 200]) expect(takeViews(take("pause", seconds, { promptId: "d001" }))).toMatchObject({ rule: "focus", views: ["pauses"], lens: "pauses", lookCloser: true });
  });

  // Each lesson, deliberately
  it.each([
    ["l001", ["pauses"]], ["l004", ["pauses"]], ["l015", ["pauses"]],
    ["l002", ["clarity"]], ["l009", ["clarity"]],
    ["l003", ["pace"]],
    ["l014", ["words"]],
    ["l006", ["planned-stress"]],
    ["l005", ["pitch-text", "planned-stress"]], ["l007", ["pitch-text", "planned-stress"]], ["l008", ["pitch-text", "planned-stress"]], ["l010", ["pitch-text", "planned-stress"]], ["l011", ["pitch-text", "planned-stress"]], ["l012", ["pitch-text", "planned-stress"]], ["l013", ["pitch-text", "planned-stress"]], ["l016", ["pitch-text", "planned-stress"]],
  ])("maps lesson %s to %j", (promptId, views) => {
    // Its own views, never the long-take set
    expect(takeViews(take("lesson", 150, { promptId }))).toMatchObject({ rule: "focus", views });
  });

  // No lesson is left out of the table above
  it("covers every lesson", () => {
    // Sixteen lessons
    expect(LESSONS.map((lesson) => lesson.id).sort()).toEqual(["l001", "l002", "l003", "l004", "l005", "l006", "l007", "l008", "l009", "l010", "l011", "l012", "l013", "l014", "l015", "l016"]);
  });

  // The tricky-word lists are clear sounds
  it("shows the clarity lens on every tricky-word list", () => {
    // Each list
    for (const list of TRICKY_WORDS) expect(takeViews(take("read", 40, { promptId: list.id })).views).toEqual(["clarity"]);
  });

  // Reading aloud
  it("shows pitch with planned stress on a reading, however long", () => {
    // A passage and a long speech part
    for (const seconds of [50, 200]) expect(takeViews(take("read", seconds, { promptId: "r007" }))).toMatchObject({ rule: "focus", views: ["pitch-text", "planned-stress"] });
  });

  // Voice drills keep their own pictures, with no lenses (one line a take, readings not saved)
  it.each([
    [{ kind: "volume" as const }, "v01", ["thickness"]],
    [{ kind: "pitch" as const }, "p04", ["planned-stress"]],
    // Same sentence, different stress (decision 117)
    [{ kind: "pitch" as const }, "p05", ["planned-stress"]],
    // Exaggerate, then dial back: its pitch line, drawn over the words
    [{ kind: "pitch" as const }, "p06", ["pitch-line"]],
    [{ kind: "pitch" as const }, "p01", ["pitch-line"]],
    [{ kind: "tone" as const }, "t01", ["pitch-line"]],
    [{ kind: "shadow" as const }, "s01", ["shadow"]],
    [{ kind: "clear" as const }, "c01", ["word-check"]],
  ])("maps a %j drill (%s) to %j", (voice, promptId, views) => {
    // Its own view, without Look closer
    expect(takeViews(take("voice", 12, { promptId, voice }))).toMatchObject({ rule: "focus", views, lookCloser: false });
  });

  // A conversation
  it("shows the conversation timeline on a talk with someone", () => {
    // Its own view
    expect(takeViews(take("conversation", 200))).toMatchObject({ rule: "focus", views: ["conversation"], lookCloser: false });
  });

  // A story: the length rule only, its beats being on the results above (decision 126)
  it("gives a story the length rule's views, with no shape strip", () => {
    // A short story
    expect(takeViews(take("story", 45)).views).toEqual(["pitch-text"]);
    // A long one
    expect(takeViews(take("story", 170)).views).toEqual(["fingerprint", "lens-tabs", "best-moment", "energy-arc"]);
  });
});

describe("takeViews: every kind", () => {
  // Nothing falls through without a plan
  it("gives every kind of session a plan with at least one view", () => {
    // Each kind
    for (const mode of SESSION_MODES) expect(takeViews(take(mode, 90)).views.length).toBeGreaterThan(0);
  });
});
