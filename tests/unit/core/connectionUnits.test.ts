// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the checks being tested
import { aroundWords, appreciation, beatCount, beatFound, depthPhrase, guiltPhrase, leadPhrase, noticedPhrase, openerAsks, phoneQuotes, sendOff, smallTalkChange, stripLevel } from "@/core/smallTalk";
// Load the content, to check it hangs together
import { ASKING_DRILLS, DEEPER_DRILLS, LISTENING_STORIES, NEWS_DRILLS, ROOM_DRILLS, SMALL_TALK_LESSONS, SMALL_TALK_PROMPTS, SMALL_TALK_QUESTIONS, STARTING_DRILLS, UNITS, drillBank, drillForDay, findSmallTalk, findUnit, lessonsFor, nextInUnit, responseLabel, unitOf } from "@/content/smallTalk";
// Load the app's prompt lookup
import { findPrompt } from "@/content/prompts";
// Load the timing rules
import { maxSeconds, minSeconds, smallTalkWindow } from "@/core/recordingRules";
// Load the units' progress
import { nextUnit, unitProgress } from "@/core/units";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A reply to the given prompt, a few seconds long
const reply = (promptId: string, transcript: string, durationSec = 8) => makeSession({ mode: "smalltalk", promptId, transcript, durationSec });

// The first words of a change, up to its first full stop or colon
const opening = (promptId: string, transcript: string) => smallTalkChange(reply(promptId, transcript)).change.split(/[.:]/)[0];

// Group the checks about the three units' content (decision 95)
describe("the units added in decision 95: content", () => {
  // Seven units, the three new ones read on a card, each with its own words
  it("adds three units read on a card, in order after the first four", () => {
    // Confirm the order and how each drill reaches you
    expect(UNITS.map((unit) => [unit.id, unit.drill])).toEqual([["answering", "heard"], ["asking", "heard"], ["listening", "heard"], ["news", "heard"], ["room", "situation"], ["starting", "situation"], ["deeper", "question"]]);
  });

  // About twelve drills each, six lessons each, and every lesson complete with its research line
  it("gives each new unit twelve drills and six complete lessons", () => {
    // The new units
    const units = ["room", "starting", "deeper"] as const;
    // Lessons missing a part
    const incomplete = units.flatMap((unit) => lessonsFor(unit).filter((lesson) => !lesson.idea || !lesson.good || !lesson.question || !lesson.why || !/\(|research/.test(lesson.why)).map((lesson) => lesson.id));
    // Confirm the counts, the lessons numbered in order, and nothing missing
    expect([units.map((unit) => drillBank(unit).length), units.map((unit) => lessonsFor(unit).map((lesson) => lesson.number)), incomplete]).toEqual([[12, 12, 12], [[1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6]], []]);
  });

  // Ids are unique across every small-talk prompt, and both lookups find the new ones
  it("keeps every id unique, and finds the new ones", () => {
    // Every id
    const ids = [...SMALL_TALK_QUESTIONS, ...SMALL_TALK_LESSONS, ...ASKING_DRILLS, ...LISTENING_STORIES, ...NEWS_DRILLS, ...ROOM_DRILLS, ...STARTING_DRILLS, ...DEEPER_DRILLS].map((item) => item.id);
    // The new ones
    const added = [...ROOM_DRILLS, ...STARTING_DRILLS, ...DEEPER_DRILLS, ...SMALL_TALK_LESSONS.filter((lesson) => ["room", "starting", "deeper"].includes(lesson.unit))].map((item) => item.id);
    // Confirm unique, every prompt listed once, and each new one found with its unit
    expect([new Set(ids).size === ids.length, SMALL_TALK_PROMPTS.length === new Set(SMALL_TALK_PROMPTS.map((item) => item.id)).size, added.every((id) => findSmallTalk(id) && findPrompt(id)), ["sr01", "se01", "sd01", "srl2", "sel4", "sdl6"].map(unitOf)]).toEqual([true, true, true, ["room", "starting", "deeper", "room", "starting", "deeper"]]);
  });

  // Each lesson teaches one of its own unit's beats (or none)
  it("teaches each new unit's own beats in its lessons", () => {
    // Lessons whose beat is not in their unit
    const strays = SMALL_TALK_LESSONS.filter((lesson) => lesson.beat !== null && !findUnit(lesson.unit).beats.some((beat) => beat.id === lesson.beat)).map((lesson) => lesson.id);
    // Confirm none
    expect(strays).toEqual([]);
  });

  // Next one: the lessons in order, then the unit's first drill; drills wrap round with the unit's own words
  it("moves on within a new unit", () => {
    // The last room lesson, a middle drill, the last drill
    expect([nextInUnit("srl6"), nextInUnit("se03"), nextInUnit("sd12")]).toEqual([{ id: "sr01", label: "now practise it" }, { id: "se04", label: "another situation" }, { id: "sd01", label: "another question" }]);
  });

  // A drill a day, in turn, and "another" moves along
  it("takes a new unit's drills in turn by day", () => {
    // A day
    const day = new Date(2026, 9, 21);
    // Confirm the offset matches the next day
    expect(drillForDay("room", day, 1).id).toBe(drillForDay("room", new Date(2026, 9, 22)).id);
  });

  // History's label: the unit's word, with a long moment or situation cut short and a flat question whole
  it("labels responses for History", () => {
    // A long moment, a short situation, a flat question, an everyday question, and something unknown
    expect([responseLabel("sr12"), responseLabel("se04"), responseLabel("sd01"), responseLabel("st01"), responseLabel("nope")]).toEqual(["Reading the room: A quiet new colleague gives one-word answers, then…", "Starting and ending: In the queue at a café that has…", "Going deeper: What do you do?", "Small talk: How was your weekend?", null]);
  });
});

// Group the checks about reading the room
describe("reading the room", () => {
  // Naming what was noticed
  it("hears what was noticed", () => {
    // A noticed change, a lit-up topic, nothing noticed, and empty input
    expect([noticedPhrase("You've gone a bit quiet. Long day?"), noticedPhrase("wait you lit up at the allotment"), noticedPhrase("so anyway the landlord said no"), noticedPhrase("")]).toEqual(["you've gone", "you lit up", null, null]);
  });

  // An easy out first, then an invitation to say more
  it("hears an easy out or an invitation to say more", () => {
    // An out, more of their topic, room to think, and neither
    expect([leadPhrase("Do you need to get that? Go ahead, I don't mind."), leadPhrase("Tell me more about the allotment"), leadPhrase("Take your time"), leadPhrase("So then I went to the shop"), leadPhrase("")]).toEqual(["go ahead", "tell me more", "take your time", null, null]);
  });

  // Guilt or a call for reassurance
  it("hears a guilt trip or a call for reassurance", () => {
    // Two kinds, a kind line, and empty input
    expect([guiltPhrase("Sorry am I boring you"), guiltPhrase("You're not listening, are you"), guiltPhrase("You seem tired, want to grab a coffee another time"), guiltPhrase("")]).toEqual(["am i boring", "you're not listening", null, null]);
  });

  // A good reply finds all four beats by itself; silence finds none
  it("counts a good reply's beats, and none for silence", () => {
    // Noticed, asked, an out, and no guilt
    const good = reply("sr01", "You seem a bit busy today. Do you need to go? No worries if so, we can catch up another time.");
    // Nothing said
    const silent = reply("sr01", "");
    // Confirm four, then none
    expect([beatCount(good), beatCount(silent)]).toEqual([4, 0]);
  });

  // One change, in order: silence, guilt, nothing noticed, no question, no lead, all there
  it("picks one change in order", () => {
    // Each case
    expect([
      opening("sr01", ""),
      opening("sr01", "Am I boring you? You seem distracted."),
      opening("sr01", "So what do you think of the new office?"),
      opening("sr01", "You seem busy. No worries."),
      opening("sr01", "You seem busy. Are you okay?"),
      opening("sr01", "You seem busy. Do you need to go? No worries."),
    ]).toEqual(["Say something out loud, even one short line", "Leave out “am i boring”", "Say what you noticed, kindly", "Treat it as a question, not an answer", "Follow their lead", "You named the change, asked, and followed their lead, without guilt"]);
  });

  // The phone's quotes for the results
  it("quotes what the phone heard", () => {
    // A reply
    const session = reply("sr02", "You lit up at the allotment. Tell me more?");
    // Confirm the noticed phrase and the lead
    expect([phoneQuotes(session, "noticed"), phoneQuotes(session, "follow"), phoneQuotes(session, "no-blame")]).toEqual([["you lit up"], ["tell me more"], []]);
  });
});

// Group the checks about starting and ending
describe("starting and ending", () => {
  // The kettle situation, opened and closed well
  const GOOD = "This kettle takes forever doesn't it are you on this floor too ... great chatting I'll let you get back to it good luck with the launch";

  // The opener: something around them, and an easy question
  it("hears something around them and an easy question in the opener", () => {
    // Words from the situation, a shared-moment phrase, nothing around, and empty input
    expect([aroundWords(GOOD, "Waiting for the kettle in the office kitchen with a coworker you haven't met."), aroundWords("Is it always this busy in here", "On a delayed train."), aroundWords("So what do you do for a living", "Waiting for the kettle."), aroundWords("", "Waiting for the kettle.")]).toEqual([["kettle"], ["in here"], [], []]);
  });

  // The question must be in the opening half, not only at the end
  it("needs the question in the opener, not the goodbye", () => {
    // A question first, a question only at the end, and empty input
    expect([openerAsks(GOOD), openerAsks("Nice weather today anyway lovely to meet you see you around are you coming tomorrow"), openerAsks("")]).toEqual([true, false, false]);
  });

  // The goodbye: what they enjoyed, a reason and a wish, looked for at the end
  it("hears what they enjoyed, a reason and a wish in the goodbye", () => {
    // The good one, one with thanks only at the start, and empty input
    expect([appreciation(GOOD), sendOff(GOOD), appreciation("Great to meet you is this your first time here I think it is mine too"), sendOff("")]).toEqual(["great chatting", { reason: "i'll let you", wish: "good luck" }, null, { reason: null, wish: null }]);
  });

  // All four for a good pair; the send-off needs both a reason and a wish
  it("counts the beats, needing a reason and a wish for the goodbye", () => {
    // The good one, and one with a wish but no reason
    expect([beatCount(reply("se01", GOOD)), beatFound(reply("se01", "This kettle takes forever are you on this floor too ... great chatting good luck with the launch"), "send-off"), beatCount(reply("se01", ""))]).toEqual([4, false, 0]);
  });

  // One change, in order: silence, no question, nothing around, no warm word, no reason, no wish, all there
  it("picks one change in order", () => {
    // Each case, for the kettle
    expect([
      opening("se01", ""),
      opening("se01", "Hello there nice kettle ... bye then"),
      opening("se01", "So what do you do for work ... bye then"),
      opening("se01", "This kettle is slow are you new here ... I'll let you go good luck"),
      opening("se01", "This kettle is slow are you new here ... great chatting good luck"),
      opening("se01", "This kettle is slow are you new here ... great chatting I'll let you get on"),
      opening("se01", GOOD),
    ]).toEqual(["Say both out loud", "Ask an easy question in your opener, about here and now", "Open on something you can both see or share", "Before you go, say what you enjoyed", "Give a reason to go", "End with a warm wish", "An easy opener about the moment, and a warm goodbye with a reason and a wish"]);
  });

  // The phone's quotes for the results
  it("quotes what the phone heard", () => {
    // The good pair
    const session = reply("se01", GOOD);
    // Confirm the shared word, the warm word, and the reason with the wish
    expect([phoneQuotes(session, "around"), phoneQuotes(session, "thanks"), phoneQuotes(session, "send-off")]).toEqual([["kettle"], ["great chatting"], ["i'll let you", "good luck"]]);
  });
});

// Group the checks about going deeper
describe("going deeper", () => {
  // A deeper question asks about meaning, and about them
  it("hears a question about meaning, only when it is about them", () => {
    // About them, not about them, about facts, and empty input
    expect([depthPhrase("What's the best part of what you do?"), depthPhrase("Why is the sky blue"), depthPhrase("How many years have you lived here"), depthPhrase("")]).toEqual(["best part", null, null, null]);
  });

  // All four beats for a good upgrade; the flat question itself finds fewer; silence finds none
  it("counts the beats of an upgraded question", () => {
    // A good upgrade, the flat question, sharing first then asking, and silence
    expect([beatCount(reply("sd01", "What's the best part of what you do")), beatCount(reply("sd01", "What do you do")), beatCount(reply("sd11", "Mine have been a lot this week honestly what's been the best part of yours")), beatCount(reply("sd01", ""))]).toEqual([4, 3, 4, 0]);
  });

  // One change, in order: no question, too long, yes-or-no, facts only, about you, all there
  it("picks one change in order", () => {
    // Each case
    expect([
      opening("sd01", ""),
      opening("sd01", "What do you love about your work and how did you get into it and what would you change if you could and where do you see it going in the next few years honestly"),
      opening("sd01", "Do you enjoy your job"),
      opening("sd01", "What time do you start work"),
      opening("sd01", "What's the best part of your job because I love mine"),
      opening("sd01", "What got you into your line of work"),
    ]).toEqual(["Ask it as a question", "Just one question", "Make it open", "Ask about meaning, not facts", "Keep the question on them", "Open, about what matters to them, and one question"]);
  });
});

// Group the checks about timing and the strip for the new units
describe("the new units' timing and strip", () => {
  // Each unit has its own window, and replies are kept from two seconds
  it("gives each new unit its window and limits", () => {
    // Confirm the windows, the limits and the minimum
    expect([smallTalkWindow("sr01").end, smallTalkWindow("se01").end, smallTalkWindow("sd01").end, maxSeconds("smalltalk", "sd01"), maxSeconds("smalltalk", "se01"), minSeconds("smalltalk", "sr01")]).toEqual([20, 30, 12, 30, 60, 2]);
  });

  // The strip fades by unit, counting only that unit's answers
  it("fades a new unit's strip from its own answers only", () => {
    // Three good upgrades, and three answers in another unit
    const answers = [...Array.from({ length: 3 }, () => reply("sd01", "What's the best part of what you do")), ...Array.from({ length: 3 }, () => reply("sr01", "You seem busy"))];
    // Confirm the deeper strip hidden, the room strip still showing its reminders
    expect([stripLevel(answers, "deeper").hidden, stripLevel(answers, "room").beats.check]).toEqual([true, "full"]);
  });
});

// Group the checks about the units as a path (decision 95)
describe("units", () => {
  // Progress by unit, from small-talk answers only
  it("counts lessons done by unit", () => {
    // Two room lessons (one twice), a room drill, and a speech session
    const sessions = [reply("srl1", "x"), reply("srl1", "x"), reply("srl2", "x"), reply("sr01", "x"), makeSession({ mode: "talk", promptId: "srl3" })];
    // The room unit's progress
    const room = unitProgress(sessions).find((item) => item.unit.id === "room")!;
    // Confirm two of six, the next lesson, and one drill
    expect([room.lessonsDone, room.lessonsTotal, room.nextLesson?.id, room.drills]).toEqual([2, 6, "srl3", 1]);
  });

  // The next unit: the first with a lesson to do; once all are done, the least practised
  it("suggests the next unit", () => {
    // Every lesson answered once
    const allLessons = SMALL_TALK_LESSONS.map((lesson) => reply(lesson.id, "x"));
    // Every lesson but the room unit's
    const roomLeft = allLessons.filter((session) => unitOf(session.promptId) !== "room");
    // Every lesson, plus drills in every unit but going deeper
    const practised = [...allLessons, ...["st01", "sa01", "sls01", "sn01", "sr01", "se01"].map((id) => reply(id, "x"))];
    // Confirm: answering for a new user, room when only it is left, then deeper as the least practised
    expect([nextUnit([]).unit.id, nextUnit(roomLeft).unit.id, nextUnit(practised).unit.id]).toEqual(["answering", "room", "deeper"]);
  });
});
