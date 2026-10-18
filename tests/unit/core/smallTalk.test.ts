// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the checks being tested
import { answerLength, beatCount, butPhrase, beatFound, deadEndOpening, feelingWords, handBack, namesTheirFeeling, questionKind, reaction, sharedWords, shiftPhrase, smallTalkChange, staysOnStory, staysOnThem, stripLevel } from "@/core/smallTalk";
// Load the content, to check it hangs together
import { ASKING_DRILLS, BEATS, LISTENING_STORIES, SMALL_TALK_LESSONS, SMALL_TALK_QUESTIONS, UNITS, drillForDay, findSmallTalk, lessonsFor, nextInUnit, smallTalkForDay, unitOf } from "@/content/smallTalk";
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
    const ids = [...SMALL_TALK_QUESTIONS.map((item) => item.id), ...SMALL_TALK_LESSONS.map((item) => item.id), ...ASKING_DRILLS.map((item) => item.id), ...LISTENING_STORIES.map((item) => item.id)];
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

// A follow-up question or a reply, said to the given prompt
const reply = (promptId: string, transcript: string, durationSec = 5) => makeSession({ mode: "smalltalk", promptId, transcript, durationSec });

// Group the checks about asking and listening
describe("asking and listening", () => {
  // Every unit has four beats, its lessons, and each lesson's beat is one of its own
  it("gives each unit four beats and lessons that teach its own beats", () => {
    // Confirm per unit: four beats, lessons, beats in the unit
    expect(UNITS.map((unit) => [unit.beats.length, lessonsFor(unit.id).length, lessonsFor(unit.id).every((lesson) => lesson.beat === null || unit.beats.some((beat) => beat.id === lesson.beat))])).toEqual([[4, 6, true], [4, 3, true], [4, 3, true], [4, 3, true]]);
  });

  // The unit comes from the prompt id
  it("finds the unit from the prompt", () => {
    // An everyday question, a remark, a story, a listening lesson, and something unknown
    expect(["st01", "sa01", "sls01", "sll2", "nope"].map(unitOf)).toEqual(["answering", "asking", "listening", "listening", "answering"]);
  });

  // Open or yes-or-no, from the first question word
  it("tells open questions from yes-or-no ones", () => {
    // Open after a reaction, closed, and no question at all
    expect([questionKind("oh nice what got you started"), questionKind("did it take long"), questionKind("that sounds great")]).toEqual(["open", "closed", null]);
  });

  // Picking up their words, by their first letters
  it("finds the words picked up from what they said", () => {
    // Painting matches paint; common words do not count
    expect([sharedWords("how did you pick the paint colour", "We finally finished painting the house."), sharedWords("what was that like", "We finally finished painting the house.")]).toEqual([["paint"], []]);
  });

  // Boomerasking: talking about yourself after asking
  it("spots a question turned to yourself", () => {
    // A reaction about yourself first is fine; after the question it is not
    expect([staysOnThem("oh I love that what got you started"), staysOnThem("how far do you go I've been doing ten k")]).toEqual([true, false]);
  });

  // A reply to a story: a reaction, the feeling, and no shift
  it("hears a reaction, a feeling and a shift in a reply to a story", () => {
    // A good reply, and one that shifts
    const good = "no way he fell asleep on your shoulder that must have been so awkward what did your boss say";
    // The shift
    const shifted = "oh that happened to me too I was on a bus once";
    // Confirm
    expect([reaction(good), namesTheirFeeling(good), staysOnStory(good), shiftPhrase(shifted), staysOnStory(shifted)]).toEqual(["no way", true, true, "me too", false]);
  });

  // The phone finds all four beats of a follow-up by itself
  it("counts a good follow-up's beats by itself", () => {
    // Lisbon, asked about well, and turned to yourself with no question at all
    expect([beatCount(reply("sa01", "Lisbon what was the best thing you ate there")), beatCount(reply("sa01", "cool I went to Spain once"))]).toEqual([4, 0]);
  });

  // One change for a follow-up, in order
  it("picks one change for a follow-up: no question, too long, closed, not their detail, about you", () => {
    // Each case, said to "We got a kitten last week."
    const changes = [
      reply("sa08", "aw that's lovely"),
      reply("sa08", "what is the kitten called and how old is it and where did you get it from and have you got a litter box and does it sleep on the bed yet"),
      reply("sa08", "did it settle in"),
      reply("sa08", "what made you decide now"),
      reply("sa08", "what is the kitten like mine is called Max"),
      reply("sa08", "what is the kitten called"),
    ].map(smallTalkChange);
    // Confirm the first words of each
    expect(changes.map((change) => change.change.split(".")[0])).toEqual(["Ask a question", "Just one short question", "Make it open", "Pick up their detail", "Keep it on them", "Open, about their detail, and about them: that is a good follow-up"]);
  });

  // One change for a reply to a story, in order
  it("picks one change for a reply to a story: shift, reaction, their words, feeling", () => {
    // Each case, said to the train story
    const changes = [
      reply("sls01", "oh that reminds me of when I fell asleep on a plane"),
      reply("sls01", "so your boss was waiting in the lobby"),
      reply("sls01", "wow what then"),
      reply("sls01", "no way you missed your stop and your boss was waiting"),
      reply("sls01", "no way you missed your stop and your boss was waiting that must have been so awkward"),
    ].map(smallTalkChange);
    // Confirm the first words of each
    expect(changes.map((change) => change.change.split(/[.:]/)[0])).toEqual(["Stay with their story", "React first", "Mention something from their story, so they know you heard it", "Say how it must have felt for them", "A reaction, their details, the feeling, and it stayed on them"]);
  });

  // The windows: a follow-up is a few seconds, a reply under half a minute
  it("sorts length by the unit's window", () => {
    // A follow-up of 1, 5 and 20 seconds; a reply of 40
    expect([answerLength(1, "sa01"), answerLength(5, "sa01"), answerLength(20, "sa01"), answerLength(40, "sls01")]).toEqual(["short", "ok", "long", "long"]);
  });

  // The coach's beats win, and only the unit's beats show on the strip
  it("takes the coach's beats and keeps the strip to the unit", () => {
    // A reply the phone would score fully, but the coach found only a reaction
    const coached = { ...reply("sls01", "no way you missed your stop and your boss was waiting that must have been so awkward"), feedback: { keep: "k", change: "c", retryCue: "r", connection: { found: [{ beat: "react", quote: "no way" }], better: "B" } } };
    // Confirm the coach's count, and that an answering strip ignores listening replies
    expect([beatCount(coached), beatFound(coached, "stay"), stripLevel([coached, coached, coached]).beats, Object.keys(stripLevel([], "listening").beats)]).toEqual([1, false, { moment: "full", hook: "full", feeling: "full", "hand-back": "full" }, ["react", "their-words", "their-feeling", "stay"]]);
  });

  // Drills come in turn by day, from their own bank
  it("takes each unit's drills in turn", () => {
    // A day
    const day = new Date(2026, 9, 17);
    // Confirm the banks and that they move along
    expect([drillForDay("asking", day).id.startsWith("sa"), drillForDay("listening", day).id.startsWith("sls"), drillForDay("asking", day).id === drillForDay("asking", day, 1).id, drillForDay("answering", day).id]).toEqual([true, true, false, smallTalkForDay(day).id]);
  });

  // "Next one": the next lesson in the unit, then its first drill, and drills wrap round
  it("finds the next one in a unit", () => {
    // A middle lesson, the last asking lesson, a drill, and the last story
    expect([nextInUnit("sal1").id, nextInUnit("sal3").id, nextInUnit("sa01").id, nextInUnit("sls08").id]).toEqual(["sal2", "sa01", "sa02", "sls01"]);
  });

  // Responding to news: a reaction, a question, staying on them, and no buts, in that order of changes
  it("checks a response to news and picks one change", () => {
    // Said to "I got the job!"
    const good = reply("sn01", "no way you got it how did it feel when they called");
    // With a downside
    const but = reply("sn01", "wow congrats you should check the contract carefully though");
    // About you
    const shifted = reply("sn01", "nice me too I got a new job last month");
    // Confirm all four beats, the "but" found, and the changes for each
    expect([beatCount(good), butPhrase(but.transcript), smallTalkChange(but).change.split(".")[0], smallTalkChange(shifted).change.split(".")[0], smallTalkChange(reply("sn01", "wow that is great")).change.split(".")[0], smallTalkChange(good).change.split(":")[0]]).toEqual([4, "you should", "Hold the “you should” for now", "Stay with their news", "Ask about it", "A real reaction, a question, and it stayed on them"]);
  });
});
