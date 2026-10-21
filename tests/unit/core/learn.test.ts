// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the file tools, to check that a link's page exists in the app
import { existsSync } from "node:fs";
// Load the rules being checked
import { firstRead, nextCard, setProgress } from "@/core/learn";
// Load the cards
import { EVIDENCE_LABELS, LEARN_CARDS, LEARN_GROUPS, LEARN_SETS, PROFILE_TRENDS_MEANING, RETIRED_CARDS, findCard } from "@/content/learn";
// Load the lessons, to check the cards' links to them
import { findLesson } from "@/content/lessons";
// Load the story prompts, shapes and focuses, to check the cards' links to telling a story
import { findStoryPrompt, isStoryFocus, isStoryShape } from "@/content/stories";
// Load the small-talk lessons and units, to check the cards' links to them
import { findSmallTalk } from "@/content/smallTalk";
// Load the daily plan, to check old progress does not upset it
import { dailyPlan } from "@/core/dailyPlan";
// Load the profile's take counts and its summary, to check the trends card says what the profile does
import { PROFILE_RULES } from "@/core/analysis/profileRules";
import { summarizeMetric, type ProfileTake } from "@/core/analysis/profile";
import { findMetric } from "@/core/analysis/metrics";
// Load the sample session builder
import { makeSession } from "../../support/fixtures";

// A fixed "now"
const NOW = new Date(2026, 9, 18, 9);

// Group the checks about Learn's rules
describe("learn", () => {
  // Progress per set, and the next unread card
  it("counts each set's read cards and finds the next card", () => {
    // One body-language card read
    const progress = { "body-93": firstRead(NOW) };
    // Confirm the count and that the next card is the very first
    expect([setProgress("body", progress), nextCard(progress)?.id]).toEqual([{ read: 1, total: LEARN_CARDS.filter((card) => card.set === "body").length }, LEARN_CARDS[0]?.id]);
  });

  // The cards are complete: unique ids, every set used, three answers with a valid right one, a label and a source
  it("has complete cards", () => {
    // Problems found
    const problems = LEARN_CARDS.filter((card) => !card.finding || !card.meaning || !card.doThis || !card.keyLine || card.recall.options.length !== 3 || card.recall.answer < 0 || card.recall.answer > 2 || !EVIDENCE_LABELS[card.evidence] || !card.source.text || (card.kind === "myth-or-fact" && !card.verdict) || (card.kind === "try-it" && !card.exercise)).map((card) => card.id);
    // Every id once
    const ids = LEARN_CARDS.map((card) => card.id);
    // Confirm
    expect([problems, new Set(ids).size === ids.length, LEARN_SETS.every((set) => LEARN_CARDS.some((card) => card.set === set.id)), LEARN_CARDS.length >= 35, findCard("body-faces")?.evidence]).toEqual([[], true, true, true, "strong"]);
  });

  // Decision 71: the new sets, each card with a small step to try for real, and links that lead somewhere
  it("adds voice, point, minds and hard conversations, every new card with a real-world step and working lesson links", () => {
    // The new sets
    const added = ["voice", "point", "minds", "hard"];
    // Their cards, plus the ones added to older sets
    const fresh = LEARN_CARDS.filter((card) => added.includes(card.set) || ["nerves-own-name", "warm-thanks-note", "body-look-away", "body-stillness", "body-not-face", "body-voice-feelings", "body-read-room"].includes(card.id));
    // Lesson links that name a lesson that does not exist
    const broken = LEARN_CARDS.flatMap((card) => (card.tryIt?.href.startsWith("/session?mode=lesson&prompt=") && !findLesson(card.tryIt.href.split("prompt=")[1] ?? "") ? [card.id] : []));
    // Confirm each new set has at least five cards, every new card has its step, and no link is broken (voice has gained four more since, in decision 94)
    expect([added.map((set) => LEARN_CARDS.filter((card) => card.set === set).length >= 5), fresh.length, fresh.filter((card) => !card.outThere).map((card) => card.id), broken]).toEqual([[true, true, true, true], 31, [], []]);
  });
});

// The most words each part of a card may hold: the longest the cards had before decision 94, so new cards keep to the house length
const WORD_BUDGET = { title: 14, finding: 53, meaning: 32, doThis: 28, exercise: 23, keyLine: 13, outThere: 24, question: 14, option: 10 } as const;

// Count the words in a piece of text
const words = (text: string | undefined) => (text ?? "").split(/\s+/).filter(Boolean).length;

// Decision 94: the new and grown sets, the retired vocal fry card, the house length, and links that lead somewhere real
describe("learn content (decision 94)", () => {
  // Every set is in exactly one group, the four new sets have their cards, and every new card has a real-world step
  it("adds word choice, reading your profile, humour and speaking at work, and grows stories, voice and charisma", () => {
    // Sets listed in the groups, in order
    const grouped = LEARN_GROUPS.flatMap((group) => group.sets);
    // Cards per set
    const count = (set: string) => LEARN_CARDS.filter((card) => card.set === set).length;
    // The cards decision 94 added (all but the moved humour card, which predates it)
    const added = LEARN_CARDS.filter((card) => ["words", "profile", "humour", "work"].includes(card.set) && card.id !== "warm-funny");
    // Confirm each set once in the groups, Stories leading Speaking, the counts, and every added card's step
    expect([[...grouped].sort(), LEARN_GROUPS[0]?.sets[0], ["stories", "voice", "charisma", "words", "profile", "humour", "work", "warmth"].map(count), added.filter((card) => !card.outThere).map((card) => card.id)]).toEqual([LEARN_SETS.map((set) => set.id).sort(), "stories", [17, 9, 10, 7, 5, 6, 7, 9], []]);
  });

  // Every card keeps to the house length, with three options and the right one among them
  it("keeps every card within the house word budget", () => {
    // Each card's parts over budget, by name
    const over = LEARN_CARDS.flatMap((card) => {
      // The parts and their limits
      const parts: Array<[string, string | undefined, number]> = [["title", card.title, WORD_BUDGET.title], ["finding", card.finding, WORD_BUDGET.finding], ["meaning", card.meaning, WORD_BUDGET.meaning], ["doThis", card.doThis, WORD_BUDGET.doThis], ["exercise", card.exercise, WORD_BUDGET.exercise], ["keyLine", card.keyLine, WORD_BUDGET.keyLine], ["outThere", card.outThere, WORD_BUDGET.outThere], ["question", card.recall.question, WORD_BUDGET.question], ...card.recall.options.map((option): [string, string, number] => ["option", option, WORD_BUDGET.option])];
      // The ones too long
      return parts.filter(([, text, limit]) => words(text) > limit).map(([name]) => `${card.id}.${name}`);
    });
    // Confirm none, and that every recall has three different options with a valid answer
    expect([over, LEARN_CARDS.filter((card) => new Set(card.recall.options).size !== 3 || !Number.isInteger(card.recall.answer) || card.recall.options[card.recall.answer] === undefined).map((card) => card.id)]).toEqual([[], []]);
  });

  // Every "Try it" link leads to a page the app has, with a lesson, story, shape or focus that exists
  it("links every card to a real page, lesson, story, shape or focus", () => {
    // Links that lead nowhere, with the reason
    const broken = LEARN_CARDS.flatMap((card) => {
      // No link: nothing to check
      if (!card.tryIt) return [];
      // The link's parts
      const url = new URL(card.tryIt.href, "https://voicelab.test");
      // Its page's file in the app
      const page = `src/app${url.pathname === "/" ? "" : url.pathname}/page.tsx`;
      // What the link names
      const query = url.searchParams;
      // Problems with it
      const problems = [
        // The page exists
        existsSync(page) ? null : "no page",
        // A lesson link names a real lesson
        query.get("mode") === "lesson" && !findLesson(query.get("prompt") ?? "") ? "no lesson" : null,
        // A small-talk link names a real small-talk lesson
        query.get("mode") === "smalltalk" && !findSmallTalk(query.get("prompt") ?? "") ? "no small-talk lesson" : null,
        // A small-talk unit link names a real unit
        url.pathname === "/small-talk/unit" && !["answering", "asking", "listening", "news"].includes(query.get("id") ?? "") ? "no unit" : null,
        // A story link names a real prompt, and any shape or focus is a real one
        url.pathname === "/stories/tell" && (!findStoryPrompt(query.get("prompt") ?? "") || (query.has("shape") && !isStoryShape(query.get("shape"))) || (query.has("focus") && !isStoryFocus(query.get("focus")))) ? "no such story set-up" : null,
      ].filter((problem) => problem !== null);
      // The card's problems, named
      return problems.map((problem) => `${card.id}: ${problem}`);
    });
    // Confirm none (the anchors after "#" are checked in the browser suite, where the pages are drawn)
    expect(broken).toEqual([]);
  });

  // The corrected vocal fry card has a new id; the old id is retired, opens the replacement, and saved progress for it upsets nothing
  it("retires the old vocal fry card without breaking saved progress or old links", () => {
    // Progress from before: the old fry card read, a card id nobody knows, and the moved humour card read
    const progress = { "voice-fry": firstRead(new Date(2026, 9, 19, 9)), "no-such-card": firstRead(new Date(2026, 9, 19, 9)), "warm-funny": firstRead(new Date(2026, 9, 19, 9)) };
    // Every card read but the corrected fry card, plus the leftovers
    const almostAll = { ...Object.fromEntries(LEARN_CARDS.filter((card) => card.id !== "voice-fry-mixed").map((card) => [card.id, firstRead(new Date(2026, 9, 19, 9))])), ...progress };
    // A day's plan from that progress
    const plan = dailyPlan({ day: new Date(2026, 9, 21, 9), sessions: [makeSession({ id: "s1", createdAt: new Date(2026, 9, 18, 9).toISOString() })], focusId: "pausing", nextTalk: null, learn: almostAll });
    // Confirm: retired ids map to live cards and are not live themselves; the old id opens the corrected card; the leftovers count for nothing; the corrected card still comes up to read; the moved card counts in Humour
    expect([
      Object.entries(RETIRED_CARDS).every(([old, replacement]) => !LEARN_CARDS.some((card) => card.id === old) && LEARN_CARDS.some((card) => card.id === replacement)),
      [findCard("voice-fry")?.id, findCard("voice-fry")?.verdict, findCard("voice-fry")?.evidence],
      [findCard("no-such-card"), findCard("toString")],
      setProgress("voice", progress),
      setProgress("humour", progress).read,
      nextCard(almostAll)?.id,
      plan.find((step) => step.kind === "card")?.promptId,
    ]).toEqual([true, ["voice-fry-mixed", "mixed", "mixed"], [undefined, undefined], { read: 0, total: LEARN_CARDS.filter((card) => card.set === "voice").length }, 1, "voice-fry-mixed", "voice-fry-mixed"]);
  });

  // The trends card says the profile's own numbers, and the profile really works that way
  it("explains the profile's trend rules with the numbers the profile uses", () => {
    // The card
    const card = findCard("profile-trends");
    // A take with one measure, n days ago
    const take = (index: number, value: number, total: number): ProfileTake => ({ session: makeSession({ id: `t${index}`, mode: "talk", createdAt: new Date(2026, 9, 21 - (total - index)).toISOString() }), analysis: { sessionId: `t${index}`, schemaVersion: 1, computedAt: "2026-10-21T00:00:00.000Z", engines: { device: { name: "device", version: "1", at: "2026-10-21T00:00:00.000Z" } }, metrics: { "lang.wpm": { value, unit: "wpm", source: "device" as const, engine: "device-v1" } }, raw: { mode: "talk" as const, durationSec: 60, fillersPerMinute: 0, timedWords: [], pauses: [], pauseSource: "none" as const, speech: null, loudness: null, pitch: null, fading: null, firstPart: null, contentWords: {} } } });
    // A history of rising values, the given number of takes long
    const history = (length: number) => Array.from({ length }, (_, index) => take(index, 100 + index * 10, length));
    // The measure
    const metric = findMetric("lang.wpm")!;
    // Just short of a trend, and just enough for one
    const [short, enough] = [summarizeMetric(metric, history(PROFILE_RULES.minForTrend - 1)), summarizeMetric(metric, history(PROFILE_RULES.minForTrend))];
    // A long history: usual is the middle of the first few takes, recent the middle of the latest few
    const long = summarizeMetric(metric, history(20));
    // The middle of the first and the latest takes in the rising history
    const middle = (from: number, length: number) => 100 + (from + (length - 1) / 2) * 10;
    // Confirm the card's words come from the rules, and that the profile follows the same rules
    expect([card?.meaning, short?.trend, enough?.trend !== null, long?.usual, long?.recent]).toEqual([PROFILE_TRENDS_MEANING, null, true, middle(0, PROFILE_RULES.usualTakes), middle(20 - PROFILE_RULES.recentTakes, PROFILE_RULES.recentTakes)]);
    // Confirm the sentence names the three numbers in words today (if a rule changes, the sentence changes with it)
    expect(PROFILE_TRENDS_MEANING).toBe("Your profile compares your “usual” (the middle of your first five takes) with your “recent” (the middle of your latest seven), and calls a trend only after six takes.");
  });
});
