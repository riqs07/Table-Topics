// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the library rules being checked
import { cleanStoryTitle, defaultStoryTitle, heardCount, mergeStory, retellHeadline, storyCompareRows, storyLibrary, storyVersions } from "@/core/storyLibrary";
// Load the timing, home, prompt and change rules that know about stories
import { maxSeconds, speakingWindow, targetSeconds, thinkSeconds, timeSignal, timingSentence } from "@/core/recordingRules";
import { sessionHome } from "@/core/sessionHome";
import { answeredPrompt } from "@/core/answeredPrompt";
import { localChange } from "@/core/localChange";
// Load the analysis builder, for the story measures
import { buildAnalysis } from "@/core/analysis/analysis";
// Load the sample session builder
import { makeSession } from "../../support/fixtures";

// A flat telling
const FLAT = "so basically we went to the shop on the corner and then we bought some bread and came home after";
// A well-told telling
const GOOD = "the train stopped dead outside Reading at 6 o'clock but then the guard came through and she goes don't worry we'll be moving and I was so relieved since then I always carry a charger";
// A telling of a story
const telling = (id: string, createdAt: string, overrides = {}) => makeSession({ id, mode: "story", promptId: "sp04", createdAt, transcript: FLAT, story: { shape: "classic", focus: null, length: "full" }, ...overrides });

// Group the checks about the library
describe("story library", () => {
  // Tellings are grouped by story, most recently told first, with the count, the latest and its takeaway
  it("groups tellings into stories, most recent first", () => {
    // Two tellings of one story, one of another, and a talk
    const sessions = [telling("a", "2026-10-10T10:00:00.000Z"), telling("b", "2026-10-12T10:00:00.000Z", { feedback: { keep: "k", change: "c", retryCue: "Pause before the turn." } }), telling("c", "2026-10-11T10:00:00.000Z", { promptId: "sp10" }), makeSession({ id: "t", mode: "talk" })];
    // The library, with a renamed story
    const library = storyLibrary(sessions, [{ id: "sp04", title: "The night bus", createdAt: "x", updatedAt: "x" }]);
    // Confirm the order, titles, counts, latest and takeaways
    expect(library.map((story) => [story.id, story.title, story.tellings, story.latest.id, story.takeaway])).toEqual([["sp04", "The night bus", 2, "b", "Pause before the turn."], ["sp10", "The yes I was glad of", 1, "c", "Open with the moment things start moving."]]);
  });

  // Nothing told yet
  it("is empty with no stories", () => {
    // Confirm
    expect(storyLibrary([makeSession()], [])).toEqual([]);
  });

  // Versions, oldest first
  it("lists a story's tellings oldest first", () => {
    // Out of order
    expect(storyVersions([telling("b", "2026-10-12T10:00:00.000Z"), telling("a", "2026-10-10T10:00:00.000Z"), telling("x", "2026-10-11T10:00:00.000Z", { promptId: "sp10" })], "sp04").map((session) => session.id)).toEqual(["a", "b"]);
  });

  // Titles: a prompt's, a moment's first words, a plain one; typed ones tidied
  it("gives every story a title, and tidies a typed one", () => {
    // Each case
    expect([defaultStoryTitle("sp04", []), defaultStoryTitle("moment-m", [makeSession({ id: "m", mode: "moment", transcript: "the kettle sang" })]), defaultStoryTitle("moment-gone", []), cleanStoryTitle("  a   b "), cleanStoryTitle("   "), cleanStoryTitle("x".repeat(100))?.length]).toEqual(["Running late", "the kettle sang", "A story", "a b", null, 80]);
  });

  // The merge rule: new ones added, the later title wins, the earlier first-told date stays
  it("joins a story from a backup", () => {
    // Here and in the file
    const here = { id: "s", title: "Here", createdAt: "2026-10-02", updatedAt: "2026-10-05" };
    // (the file)
    const file = { id: "s", title: "File", createdAt: "2026-10-01", updatedAt: "2026-10-03" };
    // Each case
    expect([mergeStory(undefined, file), mergeStory(here, file), mergeStory(file, { ...here, updatedAt: "2026-10-04" })]).toEqual([file, { ...here, createdAt: "2026-10-01" }, { ...here, createdAt: "2026-10-01", updatedAt: "2026-10-04" }]);
  });

  // The retelling's comparison: each check on both, then "and then"; and a headline that never scolds
  it("compares a retelling with the telling before", () => {
    // Before and after
    const [before, after] = [telling("a", "2026-10-10T10:00:00.000Z"), telling("b", "2026-10-10T10:05:00.000Z", { transcript: GOOD })];
    // The rows
    const rows = storyCompareRows(before, after);
    // Confirm the counts, the first and last rows, and the three headlines
    expect([heardCount(before), heardCount(after), rows[0], rows.at(-1), retellHeadline(before, after), retellHeadline(after, after), retellHeadline(after, before)]).toEqual([0, 6, { label: "Started in the action", before: "–", after: "Heard" }, { label: "“And then”", before: "1", after: "0" }, "6 of 6 this time, up from 0.", "6 of 6 again. Same story, new telling.", "0 of 6 this time, 6 last time."]);
  });
});

// Group the checks about the rules that know about stories
describe("stories across the app", () => {
  // A short story is about a minute, a full one two to three; planning is up to a minute
  it("times a story by its length", () => {
    // The windows, goals, limits and planning time
    expect([speakingWindow("story", "sp01", "short"), speakingWindow("story", "sp01")?.end, targetSeconds("story", "", "short"), maxSeconds("story", "", "short"), maxSeconds("story"), thinkSeconds("story")]).toEqual([{ start: 45, yellow: 60, end: 75, limit: 90 }, 180, 75, 120, 240, 60]);
  });

  // The lights, and the sentence afterwards
  it("lights a story's timing like a prepared speech", () => {
    // Signals through a short story, and two sentences
    expect([[30, 50, 65, 80, 95].map((seconds) => timeSignal("story", seconds, undefined, "sp01", "short")), timingSentence("story", 70, undefined, "sp01", "short"), timingSentence("story", 100, undefined, "sp01", "full")]).toEqual([["none", "green", "yellow", "red", "overtime"], "1:10, inside the 0:45 to 1:15 window.", "1:40, under the 2:00 minimum."]);
  });

  // A story goes back to Stories, or Today inside the plan
  it("closes back to Stories", () => {
    // Both
    expect([sessionHome("story", "sp01", false), sessionHome("story", "sp01", true).href]).toEqual([{ section: "practice", href: "/stories", label: "Close, back to Stories" }, "/"]);
  });

  // A story from the bank shows its prompt on the results; one from a moment shows its own label instead
  it("shows a bank story's prompt on its results", () => {
    // Both
    expect([answeredPrompt(makeSession({ mode: "story", promptId: "sp04" })), answeredPrompt(makeSession({ mode: "story", promptId: "moment-x" }))]).toEqual([{ label: "Your story", text: "Tell me about a time you were running late for something that mattered." }, null]);
  });

  // Without the coach, the change comes from the story checks, or from the timing when well over
  it("picks a story's change from its checks, or its timing when far over", () => {
    // A flat short story, and a long one
    expect([localChange(telling("a", "2026-10-10T10:00:00.000Z", { durationSec: 40 })).retryCue, localChange(telling("b", "2026-10-10T10:00:00.000Z", { durationSec: 100, transcript: GOOD, story: { shape: "classic", focus: null, length: "short" } })).aboutTiming]).toEqual(["Open with the moment things start moving.", true]);
  });

  // A story's analysis carries the story measures from the phone; other takes do not
  it("measures a story's checks on the phone", () => {
    // A told story and a Rapid Fire take with the same words
    const [story, talk] = [buildAnalysis(makeSession({ mode: "story", transcript: GOOD }), new Date()), buildAnalysis(makeSession({ mode: "talk", transcript: GOOD }), new Date())];
    // Confirm the values, engine and absence
    expect([story.metrics["story.dialogue"], story.metrics["story.details"]?.value, story.metrics["story.and_then"]?.value, story.metrics["story.starts_in_action"]?.value, story.metrics["story.ends_on_point"]?.value, Object.keys(talk.metrics).some((id) => id.startsWith("story."))]).toEqual([{ value: 1, unit: "yes/no", source: "device", engine: "device-story-v1" }, 3, 0, 1, 1, false]);
  });
});
