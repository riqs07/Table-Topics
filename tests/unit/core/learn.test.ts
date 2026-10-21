// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the file tools, to check that a link's page exists in the app
import { existsSync, readFileSync } from "node:fs";
// Load the rules being checked
import { firstRead, nextCard, setProgress } from "@/core/learn";
// Load the cards
import { EVIDENCE_LABELS, LEARN_CARDS, LEARN_GROUPS, LEARN_SETS, PROFILE_TRENDS_MEANING, RETIRED_CARDS, findCard } from "@/content/learn";
// Load the lessons, to check the cards' links to them
import { findLesson } from "@/content/lessons";
// Load the story prompts, shapes and focuses, to check the cards' links to telling a story
import { isStoryFocus, isStoryShape, seedText } from "@/content/stories";
// Load the small-talk lessons, drills, units and the moment prompt, to check the cards' links to them
import { MOMENT_PROMPT, UNITS, findSmallTalk } from "@/content/smallTalk";
// Load the spoken prompts and texts, to check links to Rapid Fire, prepared speeches, openings, pause drills and readings
import { BOOKENDS, PAUSE_DRILLS, PROMPTS, TABLE_TOPICS, findPassage } from "@/content/prompts";
// Load the voice drills and shadowing passages, to check links to them
import { findShadowPassage, findVoiceDrill } from "@/content/voice";
// Load the conversation people, to check links to a conversation
import { findPersona } from "@/content/conversations";
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
    const broken = LEARN_CARDS.flatMap((card) => (card.tryIt.href.startsWith("/session?mode=lesson&prompt=") && !findLesson(card.tryIt.href.split("prompt=")[1] ?? "") ? [card.id] : []));
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

  // Every card's practice link leads to a page the app has, naming a session, drill, story set-up or person that exists (decision 96: every card has one)
  it("links every card to a real page, lesson, drill, story, shape, focus or person", () => {
    // Links that lead nowhere, with the reason
    const broken = LEARN_CARDS.flatMap((card) => {
      // The link's parts
      const url = new URL(card.tryIt.href, "https://voicelab.test");
      // Its page's file in the app
      const page = `src/app${url.pathname === "/" ? "" : url.pathname}/page.tsx`;
      // What the link names
      const query = url.searchParams;
      // The session kind and prompt, on a recording page
      const [mode, prompt] = [query.get("mode"), query.get("prompt") ?? ""];
      // Problems with it
      const problems = [
        // The page exists
        existsSync(page) ? null : "no page",
        // A lesson link names a real lesson
        mode === "lesson" && !findLesson(prompt) ? "no lesson" : null,
        // A small-talk link names a real small-talk lesson or drill
        mode === "smalltalk" && !findSmallTalk(prompt) ? "no small-talk lesson or drill" : null,
        // A Rapid Fire, prepared speech or opening and closing link names a real prompt of that kind
        (mode === "talk" && !TABLE_TOPICS.some((item) => item.id === prompt)) || (mode === "response" && !PROMPTS.some((item) => item.id === prompt)) || (mode === "bookend" && !BOOKENDS.some((item) => item.id === prompt)) ? "no such prompt" : null,
        // A pause drill or reading names a real text
        (mode === "pause" && !PAUSE_DRILLS.some((item) => item.id === prompt)) || (mode === "read" && !findPassage(prompt)) ? "no such text" : null,
        // A moment note or free talk uses its fixed prompt
        (mode === "moment" && prompt !== MOMENT_PROMPT.id) || (mode === "free" && prompt !== "free") ? "wrong fixed prompt" : null,
        // A voice drill or shadowing link names a real one
        (url.pathname === "/voice/drill" && !findVoiceDrill(query.get("id") ?? "")) || (url.pathname === "/voice/shadow" && !findShadowPassage(query.get("id") ?? "")) ? "no such voice drill" : null,
        // A conversation names a real person
        url.pathname === "/conversations/talk" && !findPersona(query.get("id") ?? "") ? "no such person" : null,
        // A small-talk unit link names a real unit
        url.pathname === "/small-talk/unit" && !UNITS.some((unit) => unit.id === query.get("id")) ? "no unit" : null,
        // A story link names a real prompt or guided story, and any shape or focus is a real one
        url.pathname === "/stories/tell" && (!seedText(query.get("prompt") ?? "") || (query.has("shape") && !isStoryShape(query.get("shape"))) || (query.has("focus") && !isStoryFocus(query.get("focus")))) ? "no such story set-up" : null,
      ].filter((problem) => problem !== null);
      // The card's problems, named
      return problems.map((problem) => `${card.id}: ${problem}`);
    });
    // Confirm none (the anchors after "#" are checked in the browser suite, where the pages are drawn)
    expect(broken).toEqual([]);
  });

  // Every card has a link that starts something specific, not a menu: no bare Practice, Small talk, Stories or Your voice page (decision 96)
  it("gives every card a specific practice, never a general page", () => {
    // Pages that only list practice
    const general = ["/practice", "/small-talk", "/stories", "/voice", "/skills", "/learn", "/conversations", "/rehearse"];
    // Cards whose link has a label and leads to a page more specific than a menu (a place on a page counts as specific)
    const vague = LEARN_CARDS.filter((card) => !card.tryIt.label.trim() || general.includes(card.tryIt.href)).map((card) => card.id);
    // Cards linking to their own explanation's page rather than a practice: only the profile cards, whose practice is reading the numbers
    const toProfile = LEARN_CARDS.filter((card) => card.tryIt.href === "/profile").map((card) => card.id).sort();
    // Confirm: none vague, and only understanding cards go to the profile
    expect([vague, toProfile]).toEqual([[], ["profile-trends", "profile-variety", "voice-phone-mic", "words-variety"]]);
  });

  // The card-to-practice table in plan-learn.md matches the cards, so the links stay reviewable in one place (decision 96)
  it("keeps the plan's card-to-practice table in step with the cards", () => {
    // The plan's text
    const plan = readFileSync("documents/plan-learn.md", "utf8");
    // Each card's row as the table writes it
    const missing = LEARN_CARDS.filter((card) => !plan.includes(`| \`${card.id}\` | ${card.tryIt.label} | \`${card.tryIt.href}\` |`)).map((card) => card.id);
    // Confirm every card's row is there as it is now
    expect(missing).toEqual([]);
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
