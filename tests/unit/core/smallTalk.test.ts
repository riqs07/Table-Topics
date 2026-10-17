// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the checks being tested
import { answerLength, beatCount, deadEndOpening, feelingWords, handBack, smallTalkChange, stripLevel } from "@/core/smallTalk";
// Load the content, to check it hangs together
import { BEATS, SMALL_TALK_LESSONS, SMALL_TALK_QUESTIONS, findSmallTalk, smallTalkForDay } from "@/content/smallTalk";
// Load the app's prompt lookup
import { findPrompt } from "@/content/prompts";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A full answer with every beat
const FULL = "Kind of a nerdy weekend I built an app that coaches me on public speaking way more fun than it sounds did you get up to anything good";

// A small-talk answer with notes ticking the given beats
const answer = (transcript: string, ticks: string[] = []) => makeSession({ mode: "smalltalk", transcript, durationSec: 30, selfReview: { worked: "", change: "", tags: ticks, skipped: false, savedAt: "2026-10-17T10:00:00.000Z" } });

// Group the checks about small talk
describe("small talk", () => {
  // A dead end is an answer that stops at "good"
  it("spots a dead-end opening only when nothing follows", () => {
    // Dead ends, and an answer that goes on
    expect([deadEndOpening("Good, not much."), deadEndOpening("Pretty chill."), deadEndOpening("Good, I finally fixed my bike and rode down to the river with my sister on Saturday morning")]).toEqual([true, true, false]);
  });

  // Feeling words and the hand-back
  it("finds feeling words and a hand-back near the end", () => {
    // The full answer, and one with a question only at the start
    expect([feelingWords(FULL), handBack(FULL), handBack("did you know I went to the market and bought some peaches and then went home and slept for hours")]).toEqual([["fun"], "did you", null]);
  });

  // The window is 20 to 45 seconds
  it("sorts the length against the window", () => {
    // Short, inside, long
    expect([answerLength(12), answerLength(30), answerLength(50)]).toEqual(["short", "ok", "long"]);
  });

  // One change, in order
  it("picks one change in order: dead end, short, feeling, hand-back, long", () => {
    // Each case
    const changes = [
      smallTalkChange(makeSession({ mode: "smalltalk", transcript: "Good, not much.", durationSec: 25 })),
      smallTalkChange(makeSession({ mode: "smalltalk", transcript: "I went to the market and bought peaches", durationSec: 12 })),
      smallTalkChange(makeSession({ mode: "smalltalk", transcript: "I went to the market and bought peaches", durationSec: 25 })),
      smallTalkChange(makeSession({ mode: "smalltalk", transcript: "I went to the market and it was fun", durationSec: 25 })),
      smallTalkChange(makeSession({ mode: "smalltalk", transcript: FULL, durationSec: 55 })),
    ];
    // Confirm the first words of each
    expect(changes.map((change) => change.change.split(":")[0]?.split(".")[0])).toEqual(["Do not stop at “good”", "A little more", "Say how it felt", "Hand it back", "Shorter is friendlier"]);
  });

  // The strip fades beat by beat, then hides
  it("fades the strip as beats become habits", () => {
    // No answers: everything in full
    const fresh = stripLevel([]);
    // Three answers with feeling and a hand-back found by the phone, and moment ticked
    const some = stripLevel([answer(FULL, ["moment"]), answer(FULL, ["moment"]), answer(FULL, ["moment"])]);
    // Three answers with every beat
    const all = stripLevel([answer(FULL, ["moment", "hook"]), answer(FULL, ["moment", "hook"]), answer(FULL, ["moment", "hook"])]);
    // Confirm the levels
    expect([fresh.beats.moment, fresh.hidden, some.beats, some.hidden, all.hidden]).toEqual(["full", false, { moment: "word", hook: "full", feeling: "word", "hand-back": "word" }, false, true]);
  });

  // The content hangs together: unique ids, a question for every lesson, and the app's lookup finds them
  it("has unique ids that the app's lookups find", () => {
    // Every id
    const ids = [...SMALL_TALK_QUESTIONS.map((item) => item.id), ...SMALL_TALK_LESSONS.map((item) => item.id)];
    // Confirm unique, found by both lookups, and four beats
    expect([new Set(ids).size === ids.length, ids.every((id) => findSmallTalk(id) && findPrompt(id)), BEATS.length, findSmallTalk("stl3")?.question]).toEqual([true, true, 4, "Seen anything good lately?"]);
  });

  // The coach's reading wins over the user's ticks and the phone's checks
  it("counts beats from the coach when its notes are there", () => {
    // The full answer, ticked for everything, but the coach found no feeling and no hand-back
    const session = { ...answer(FULL, ["moment", "hook", "feeling", "hand-back"]), feedback: { keep: "k", change: "c", retryCue: "r", smallTalk: { moment: "I built an app", hooks: ["coaches me"], feeling: "", handBack: "", livelier: "L" } } };
    // Confirm two from the coach, and four without it
    expect([beatCount(session), beatCount(answer(FULL, ["moment", "hook"]))]).toEqual([2, 4]);
  });

  // A question a day, in turn
  it("takes the everyday questions in turn by day", () => {
    // Two days in a row, and the same day moved along
    const day = new Date(2026, 9, 17);
    // Confirm they differ, and the offset matches the next day
    expect([smallTalkForDay(day).id === smallTalkForDay(new Date(2026, 9, 18)).id, smallTalkForDay(day, 1).id === smallTalkForDay(new Date(2026, 9, 18)).id]).toEqual([false, true]);
  });
});
