// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load the plan rules being checked
import { dailyPlan, focusSuggestion, moreToDo, nextStepIndex, planHref, planMinutes, planProgress, planSkipped, stepKey, todaysFocusSuggestion } from "@/core/dailyPlan";
// Load the focus areas (decision 97)
import { FOCUS_AREAS, type FocusAreaId } from "@/core/practiceFocus";
// Load the Learn rules, for a card read
import { firstRead } from "@/core/learn";
// Load the cards
import { LEARN_CARDS } from "@/content/learn";
// Load the small-talk lessons
import { SMALL_TALK_LESSONS } from "@/content/smallTalk";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// Friday 16 October 2026, mid-morning
const DAY = new Date(2026, 9, 16, 10);
// A session on a given number of days before DAY
const daysAgo = (days: number, overrides = {}) => makeSession({ id: `s${days}-${Math.random()}`, createdAt: new Date(2026, 9, 16 - days, 9).toISOString(), ...overrides });
// Three earlier practice days, so the full plan applies
const regular = [daysAgo(1), daysAgo(2), daysAgo(3, { mode: "response", isBaseline: true })];
// A day a number of days after DAY
const dayAfter = (offset: number) => new Date(2026, 9, 16 + offset, 10);
// The plan for a regular user on a day
const regularPlan = (day: Date, extra: Partial<Parameters<typeof dailyPlan>[0]> = {}) => dailyPlan({ day, sessions: regular, focusId: "pausing", nextTalk: null, ...extra });

// Group the checks about today's practice
describe("dailyPlan", () => {
  // Every day: a Learn card, the warm-up reading, then two picks from the bank
  it("starts with a Learn card, then the warm-up, then two picks", () => {
    // A regular user's plan
    const plan = regularPlan(DAY);
    // Confirm its shape
    expect([plan.length, plan[0]?.kind, plan[0]?.promptId, plan[1]?.label, plan[1]?.mode]).toEqual([4, "card", LEARN_CARDS[0]?.id, "Warm up", "read"]);
  });

  // Day one opens with half a minute of free talk, then the card, then two picks: no reading aloud first (decision 78)
  it("opens day one with free talk", () => {
    // A new user's plan, and the same user's on day two (one session yesterday)
    const [first, second] = [dailyPlan({ day: DAY, sessions: [], focusId: "pausing", nextTalk: null }), dailyPlan({ day: DAY, sessions: [daysAgo(1)], focusId: "pausing", nextTalk: null })];
    // Confirm free talk then the card on day one, and the usual card then warm-up on day two
    expect([first.length, first[0]?.mode, first[0]?.title, first[1]?.kind, second[0]?.kind, second[1]?.label]).toEqual([4, "free", "Say anything about your day", "card", "card", "Warm up"]);
  });

  // The two picks come from two different groups, a different pair each day, and a group never offers the same kind twice in a row
  it("picks two kinds from different groups, varied by day", () => {
    // The picks over three weeks
    const days = Array.from({ length: 21 }, (_, offset) => regularPlan(dayAfter(offset)).slice(2));
    // Each group's kinds in the order they came up
    const byGroup = (lane: string) => days.flatMap((picks) => picks.filter((step) => step.lane === lane).map((step) => step.label.split(" ")[0]));
    // Whether a list repeats an item twice in a row
    const repeats = (items: ReadonlyArray<string | undefined>) => items.some((item, index) => index > 0 && item === items[index - 1]);
    // Every kind that came up
    const kinds = new Set(days.flatMap((picks) => picks.map((step) => step.mode)));
    // Confirm two groups a day, no repeats within a group, and every kind of practice comes up (in pausing week the pause pick is a practice reading)
    expect([days.every((picks) => picks.length === 2 && picks[0]?.lane !== picks[1]?.lane), repeats(byGroup("spot")), repeats(byGroup("delivery")), repeats(byGroup("connection")), ["talk", "bookend", "response", "story", "pause", "read", "smalltalk"].filter((kind) => !kinds.has(kind as never))]).toEqual([true, false, false, false, []]);
  });

  // A story comes up about twice a week, in the on-the-spot pick, open and guided in turn, set up on its own page and done by a telling of its prompt today (decisions 92 and 93)
  it("offers a story about twice a week, open and guided in turn, done by telling it", () => {
    // The picks over three weeks
    const days = Array.from({ length: 21 }, (_, offset) => regularPlan(dayAfter(offset)).slice(2));
    // The story steps
    const stories = days.flatMap((picks) => picks.filter((step) => step.mode === "story"));
    // The first one
    const first = stories[0]!;
    // Its day
    const day = dayAfter(days.findIndex((picks) => picks.includes(first)));
    // A telling of its prompt that day
    const told = makeSession({ id: "told", mode: "story", promptId: first.promptId, createdAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12).toISOString() });
    // Confirm how often, where, how long and where it starts, and that the telling marks it done
    // The labels in order, alternating open and guided
    const labels = stories.map((step) => step.label);
    // Confirm how often, where, how long, the alternation, where it starts, and that the telling marks it done
    expect([stories.length >= 5 && stories.length <= 7, stories.every((step) => step.lane === "spot" && ["Story", "Guided story"].includes(step.label) && step.minutes === 2), labels.every((label, index) => index === 0 || label !== labels[index - 1]), stories.filter((step) => step.label === "Guided story").every((step) => step.promptId.startsWith("gs") && step.href === `/stories/tell?prompt=${step.promptId}`), first.href, planProgress([first], [told], day)[0]]).toEqual([true, true, true, true, `/stories/tell?prompt=${first.promptId}`, true]);
  });

  // The first days keep the long prepared speech out
  it("keeps prepared speeches out of the first days", () => {
    // A new user's picks over three weeks
    const modes = Array.from({ length: 21 }, (_, offset) => dailyPlan({ day: dayAfter(offset), sessions: [], focusId: "pausing", nextTalk: null }).slice(2).map((step) => step.mode)).flat();
    // Confirm none
    expect(modes.includes("response")).toBe(false);
  });

  // The conversation pick is the next small-talk lesson
  it("offers the next small-talk lesson in the conversation pick", () => {
    // A day whose picks include the Connect lesson
    const step = Array.from({ length: 9 }, (_, offset) => regularPlan(dayAfter(offset)).find((item) => item.lane === "connection" && item.label.includes("lesson"))).find(Boolean);
    // Confirm the first lesson
    expect(step?.promptId).toBe("stl1");
  });

  // Once every card is read, there is no Learn step (cards have no review since decision 67)
  it("drops the Learn step once every card is read", () => {
    // Every card read a while ago
    const read = Object.fromEntries(LEARN_CARDS.map((card) => [card.id, firstRead(new Date(2026, 8, 1))]));
    // Confirm the warm-up comes first and no step is a card
    expect([regularPlan(DAY, { learn: read })[0]?.label, regularPlan(DAY, { learn: read }).some((step) => step.kind === "card")]).toEqual(["Warm up", false]);
  });

  // After the answering lessons come the asking, listening and news ones; once every lesson is done, a follow-up, a story and some news in turn
  it("moves on to asking, listening and news, then takes their drills in turn", () => {
    // Every answering lesson answered earlier
    const answered = SMALL_TALK_LESSONS.filter((lesson) => lesson.unit === "answering").map((lesson, index) => daysAgo(4 + index, { mode: "smalltalk", promptId: lesson.id }));
    // Every lesson answered earlier
    const allLessons = SMALL_TALK_LESSONS.map((lesson, index) => daysAgo(4 + index, { mode: "smalltalk", promptId: lesson.id }));
    // The Connect step on a day, if the day picks it
    const connect = (day: Date, sessions: ReturnType<typeof daysAgo>[]) => regularPlan(day, { sessions: [...regular, ...sessions] }).find((step) => step.lane === "connection" && step.label !== "Small talk");
    // The lesson after the answering ones, on the first day that picks it
    const lesson = Array.from({ length: 9 }, (_, offset) => connect(dayAfter(offset), answered)).find(Boolean);
    // A day whose picks include the Connect step
    const day = Array.from({ length: 9 }, (_, offset) => dayAfter(offset)).find((candidate) => connect(candidate, allLessons))!;
    // The drill after none, one and two earlier drills (they take turns by practice, not by date)
    const drills = [0, 1, 2].map((done) => connect(day, [...allLessons, ...["sa01", "sls01"].slice(0, done).map((promptId, index) => daysAgo(20 + index, { mode: "smalltalk", promptId }))]));
    // Confirm the first asking lesson, then follow-ups and stories (a story's text hidden)
    expect([lesson?.label, lesson?.promptId, new Set(drills.map((step) => step?.label)), drills.find((step) => step?.label === "Listening")?.title]).toEqual(["Asking lesson 1", "sal1", new Set(["Follow-up", "Listening", "News"]), "A short story to respond to"]);
  });

  // The units added in decision 95: after the first four units' lessons comes Reading the room; once every lesson is done, all six drill units take turns
  it("moves on to the new units' lessons, then takes all six units' drills in turn", () => {
    // Every lesson of the first four units, as someone who finished them before this change would have
    const oldLessons = SMALL_TALK_LESSONS.filter((lesson) => ["answering", "asking", "listening", "news"].includes(lesson.unit)).map((lesson, index) => daysAgo(4 + index, { mode: "smalltalk", promptId: lesson.id }));
    // Every lesson answered earlier
    const allLessons = SMALL_TALK_LESSONS.map((lesson, index) => daysAgo(4 + index, { mode: "smalltalk", promptId: lesson.id }));
    // The Connect step on a day, if the day picks it
    const connect = (day: Date, sessions: ReturnType<typeof daysAgo>[]) => regularPlan(day, { sessions: [...regular, ...sessions] }).find((step) => step.lane === "connection" && step.label !== "Small talk");
    // The lesson after the old ones, on the first day that picks it
    const lesson = Array.from({ length: 9 }, (_, offset) => connect(dayAfter(offset), oldLessons)).find(Boolean);
    // A day whose picks include the Connect step
    const day = Array.from({ length: 9 }, (_, offset) => dayAfter(offset)).find((candidate) => connect(candidate, allLessons))!;
    // The drill after none to five earlier drills
    const drills = [0, 1, 2, 3, 4, 5].map((done) => connect(day, [...allLessons, ...["sa01", "sls01", "sn01", "sr01", "se01"].slice(0, done).map((promptId, index) => daysAgo(40 + index, { mode: "smalltalk", promptId }))]));
    // Confirm the first room lesson, then each unit's drill once, in order
    expect([lesson?.label, lesson?.promptId, drills.map((step) => step?.label)]).toEqual(["Reading the room lesson 1", "srl1", ["Follow-up", "Listening", "News", "Reading the room", "Starting and ending", "Going deeper"]]);
    // Confirm the cards' steps lead to their own drills
    expect([drills[3]?.promptId.startsWith("sr"), drills[4]?.promptId.startsWith("se"), drills[5]?.promptId.startsWith("sd")]).toEqual([true, true, true]);
  });

  // Saved progress is unaffected: someone halfway through the news lessons still gets the next news lesson
  it("keeps someone's place in the old lessons", () => {
    // Every lesson before the second news lesson
    const upTo = SMALL_TALK_LESSONS.slice(0, SMALL_TALK_LESSONS.findIndex((item) => item.id === "snl2")).map((lesson, index) => daysAgo(4 + index, { mode: "smalltalk", promptId: lesson.id }));
    // The Connect step on the first day that picks it
    const step = Array.from({ length: 9 }, (_, offset) => regularPlan(dayAfter(offset), { sessions: [...regular, ...upTo] }).find((item) => item.lane === "connection" && item.label !== "Small talk")).find(Boolean);
    // Confirm the second news lesson
    expect([step?.label, step?.promptId]).toEqual(["News lesson 2", "snl2"]);
  });

  // What counts as read comes from before today, so reading a card today does not change today's plan
  it("uses only progress from before today", () => {
    // The plan in the morning
    const morning = regularPlan(DAY);
    // After reading that card today
    const later = regularPlan(DAY, { learn: { [morning[0]!.promptId]: firstRead(DAY) } });
    // Confirm the same plan
    expect(later).toEqual(morning);
  });

  // The warm-up continues the speech under way, from the next part
  it("continues the speech under way", () => {
    // A user who read parts 1 and 2 of Kennedy's inaugural
    const sessions = [...regular, daysAgo(1, { mode: "read", promptId: "jfk-inaugural-2" }), daysAgo(2, { mode: "read", promptId: "jfk-inaugural-1" })];
    // Confirm part 3
    expect(regularPlan(DAY, { sessions })[1]?.promptId).toBe("jfk-inaugural-3");
  });

  // A talk coming up takes the first pick
  it("puts a talk coming up in the first pick", () => {
    // The plan with a talk
    const step = regularPlan(DAY, { nextTalk: { id: "talk-1", title: "Pitch", headline: "Your talk is in 3 days." } })[2];
    // Confirm a rehearsal of it
    expect([step?.mode, step?.promptId, step?.title]).toEqual(["rehearse", "talk-1", "Your talk is in 3 days."]);
  });

  // The plan takes a few minutes, and its total is the steps' own minutes added up, so it matches what Today lists (decision 89)
  it("fits in a few minutes, with a total that matches its steps", () => {
    // The plans over three weeks
    const plans = Array.from({ length: 21 }, (_, offset) => regularPlan(dayAfter(offset)));
    // Their totals
    const totals = plans.map(planMinutes);
    // Confirm every day is between 4 and 16 minutes, and each total is the sum of its steps
    expect([totals.every((total) => total >= 4 && total <= 16), plans.every((plan, index) => totals[index] === plan.reduce((sum, step) => sum + step.minutes, 0)), planMinutes([{ ...plans[0]![0]!, kind: "session", minutes: 1 }, { ...plans[0]![0]!, kind: "session", minutes: 1 }])]).toEqual([true, true, 2]);
  });
});

// Group the checks about what to do after the plan
describe("moreToDo", () => {
  // Up to four more things, none already in the plan: one from each group, then another card
  it("suggests more from each group and another card, none from the plan", () => {
    // The plan and its suggestions, read the plan's card today
    const plan = regularPlan(DAY);
    // The suggestions once the day's card is read
    const more = moreToDo({ day: DAY, sessions: regular, focusId: "pausing", nextTalk: null, learn: { [plan[0]!.promptId]: firstRead(DAY) } }, plan);
    // Confirm at most four, none in the plan, and the last is the next card
    expect([more.length >= 3 && more.length <= 4, more.some((step) => plan.some((item) => item.mode === step.mode && item.promptId === step.promptId)), more.at(-1)?.promptId]).toEqual([true, false, LEARN_CARDS[1]?.id]);
  });
});

// Group the checks about progress through the plan
describe("planProgress", () => {
  // A session step is done by a session today; a card step by reading the card today
  it("marks steps done by today's sessions and cards", () => {
    // The day
    const day = DAY;
    // Its plan
    const plan = regularPlan(day);
    // The warm-up done today, the first pick done yesterday, the card read today
    const sessions = [makeSession({ id: "a", mode: plan[1]!.mode!, promptId: plan[1]!.promptId, createdAt: new Date(day.getTime() - 3_600_000).toISOString() }), makeSession({ id: "b", mode: plan[2]!.mode!, promptId: plan[2]!.promptId, createdAt: new Date(day.getTime() - 86_400_000).toISOString() })];
    // Confirm the card and the warm-up
    expect(planProgress(plan, sessions, day, { [plan[0]!.promptId]: firstRead(day) })).toEqual([true, true, false, false]);
  });

  // Quick scenarios are in the conversation group's turn (decision 72): no recording, counted once, done after a round's worth of answers today
  it("offers a round of quick scenarios, done after three answers today", () => {
    // A new user's plan on a day the conversation pick is scenarios
    const day = new Date(2026, 9, 13, 10);
    // The plan
    const plan = dailyPlan({ day, sessions: [], focusId: "pausing", nextTalk: null });
    // The scenarios step
    const step = plan.find((item) => item.kind === "scenarios")!;
    // An answer on a day
    const answer = (at: Date) => ({ firstTier: "best", lastTier: "best", firstAt: at.toISOString(), lastAt: at.toISOString() });
    // Two answered today, then three, then three yesterday
    const done = (count: number, at: Date) => planProgress([step], [], day, {}, Object.fromEntries(Array.from({ length: count }, (_, index) => [`sc-${index}`, answer(at)])))[0];
    // Confirm its look, its address in the plan, its time, and when it is done
    expect([step.label, step.lane, step.mode, planHref(step, 4), planMinutes([step]), done(2, day), done(3, day), done(3, new Date(2026, 9, 12, 10))]).toEqual(["Quick scenarios", "connection", null, "/learn/scenarios?plan=4", 2, false, true, false]);
  });

  // A step's address carries its number in the plan, cards included
  it("marks a step's address with its number", () => {
    // The plan
    const plan = regularPlan(DAY);
    // Confirm both markers
    expect([planHref(plan[0]!, 1), planHref(plan[1]!, 2)]).toEqual([`/learn/card?id=${LEARN_CARDS[0]?.id}&plan=1`, "/session?mode=read&prompt=lincoln-second-inaugural-1&plan=2"]);
  });
});

// Group the checks about putting a step off ("Can't speak now?", decision 77)
describe("planSkipped", () => {
  // Today's skips mark their steps; another day's mean nothing
  it("marks steps put off today only", () => {
    // The plan
    const plan = regularPlan(DAY);
    // The warm-up put off today, then the same list dated yesterday
    const today = planSkipped(plan, { day: "2026-10-16", steps: [stepKey(plan[1]!)] }, DAY);
    // Yesterday's
    const yesterday = planSkipped(plan, { day: "2026-10-15", steps: [stepKey(plan[1]!)] }, DAY);
    // Confirm both, and that nothing saved means nothing skipped
    expect([today, yesterday, planSkipped(plan, undefined, DAY)]).toEqual([[false, true, false, false], [false, false, false, false], [false, false, false, false]]);
  });

  // The next step passes over steps done or put off, and none is left once every step is one or the other
  it("offers the first step neither done nor put off", () => {
    // Card done, warm-up put off
    const partly = nextStepIndex([true, false, false, false], [false, true, false, false]);
    // Everything done or put off
    const none = nextStepIndex([true, false, true, true], [false, true, false, false]);
    // Confirm the third step, then none
    expect([partly, none]).toEqual([2, -1]);
  });
});

// Group the checks about voice drills in today's practice (decision 80)
describe("voice drills in the plan", () => {
  // The delivery group's voice pick goes warm-up, clear sounds, volume... by how many were done before today; a warm-up step is done when finished today
  it("takes the voice modes in turn", () => {
    // Days on which the delivery group offers its voice pick, over a month
    const days = Array.from({ length: 30 }, (_, offset) => dayAfter(offset)).filter((day) => regularPlan(day).some((step) => step.lane === "delivery" && (step.kind === "warmup" || step.mode === "voice")));
    // The first such day with nothing done, then with one warm-up and two voice sessions before it
    const day = days[0]!;
    // The voice step with nothing done
    const first = regularPlan(day).find((step) => step.lane === "delivery")!;
    // Two voice sessions and a warm-up before today
    const later = dailyPlan({ day, sessions: [...regular, daysAgo(4, { mode: "voice", promptId: "c01" }), daysAgo(5, { mode: "voice", promptId: "c02" })], focusId: "pausing", nextTalk: null, warmupDays: ["2026-01-02"] }).find((step) => step.lane === "delivery")!;
    // Confirm a warm-up first, done only once finished today, then the fourth mode in turn
    expect([days.length > 0, first.kind, first.href, planProgress([first], [], day, {}, {}, [])[0], planProgress([first], [], day, {}, {}, [`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`])[0], later.label]).toEqual([true, "warmup", "/voice/warmup", false, true, "Pitch and stress"]);
  });
});


// The user's focus steers about half the day: the Learn card and the first pick come from it, the rest stays mixed (decision 97)
describe("the plan with a focus", () => {
  // An area by its id
  const area = (id: FocusAreaId) => FOCUS_AREAS.find((item) => item.id === id)!;
  // The plan for a regular user with a focus
  const focused = (day: Date, practiceFocus: FocusAreaId[], extra: Partial<Parameters<typeof dailyPlan>[0]> = {}) => regularPlan(day, { practiceFocus, ...extra });
  // The kinds of practice a step is, by its label
  const storyStep = (label: string | undefined) => label === "Story" || label === "Guided story";

  // No focus, or an empty one, is exactly the plan as it was, every day
  it("keeps the usual plan without a focus", () => {
    // Three weeks of days
    const days = Array.from({ length: 21 }, (_, offset) => dayAfter(offset));
    // Confirm the plan and "keep going" are the same with no focus as with none given
    expect(days.every((day) => JSON.stringify(regularPlan(day)) === JSON.stringify(focused(day, [])) && JSON.stringify(moreToDo({ day, sessions: regular, focusId: "pausing", nextTalk: null }, regularPlan(day))) === JSON.stringify(moreToDo({ day, sessions: regular, focusId: "pausing", nextTalk: null, practiceFocus: [] }, regularPlan(day))))).toBe(true);
  });

  // With one focus: still four steps, card first, warm-up second, two picks in different lanes; the card and the first pick come from the focus every day
  it("takes the card and the first pick from one focus, keeping the plan's shape", () => {
    // Three weeks with a stories focus
    const days = Array.from({ length: 21 }, (_, offset) => focused(dayAfter(offset), ["stories"]));
    // The story cards
    const storyCards = new Set(LEARN_CARDS.filter((card) => card.set === "stories").map((card) => card.id));
    // Confirm the shape, a story card, a story pick, a different lane for the other pick, and that the other pick is not always a story
    expect([
      days.every((plan) => plan.length === 4 && plan[0]?.kind === "card" && plan[1]?.label === "Warm up"),
      days.every((plan) => storyCards.has(plan[0]?.promptId ?? "")),
      days.every((plan) => storyStep(plan[2]?.label)),
      days.every((plan) => plan[2]?.lane !== plan[3]?.lane),
      new Set(days.map((plan) => plan[3]?.lane)).size > 1,
      days.filter((plan) => storyStep(plan[2]?.label) && plan[2]?.label === "Story").length > 0 && days.some((plan) => plan[2]?.label === "Guided story"),
    ]).toEqual([true, true, true, true, true, true]);
  });

  // About half the steps come from the focus over a few weeks, and the rest still reaches every lane
  it("makes about half the steps the focus's, the rest mixed", () => {
    // Three weeks with a voice focus
    const days = Array.from({ length: 21 }, (_, offset) => focused(dayAfter(offset), ["voice"]));
    // Voice Learn cards
    const voiceCards = new Set(LEARN_CARDS.filter((card) => card.set === "voice").map((card) => card.id));
    // Steps that are the focus's: a voice card, or a delivery pick (voice drill, pause drill, skill drill)
    const fromFocus = days.flatMap((plan) => plan.filter((step) => (step.kind === "card" && voiceCards.has(step.promptId)) || (step.lane === "delivery")));
    // The other pick's lanes
    const otherLanes = new Set(days.map((plan) => plan[3]?.lane));
    // Confirm half of all steps, and that the other pick covers the other two lanes
    expect([fromFocus.length / days.flatMap((plan) => plan).length, [...otherLanes].sort()]).toEqual([0.5, ["connection", "spot"]]);
  });

  // The same day gives the same plan, however often it is worked out, and the next day may differ
  it("is the same all day, and takes the focus's kinds in turn", () => {
    // Morning and evening of one day
    const [morning, evening] = [focused(new Date(2026, 9, 16, 7), ["spot"]), focused(new Date(2026, 9, 16, 22), ["spot"])];
    // The focus pick's labels over a week
    const week = Array.from({ length: 7 }, (_, offset) => focused(dayAfter(offset), ["spot"])[2]?.label);
    // Confirm the day is stable and the kinds take turns (Rapid Fire, a prepared speech and a lesson, never the same twice running)
    expect([JSON.stringify(morning) === JSON.stringify(evening), new Set(week).size, week.some((label, index) => index > 0 && label === week[index - 1])]).toEqual([true, 3, false]);
  });

  // Two areas swap roles by day: one gives the card, the other the pick
  it("shares the day between two areas, swapping each day", () => {
    // Two days with stories and work
    const [first, second] = [focused(dayAfter(0), ["stories", "work"]), focused(dayAfter(1), ["stories", "work"])];
    // Which area each card and pick came from
    const cardSet = (plan: ReturnType<typeof focused>) => LEARN_CARDS.find((card) => card.id === plan[0]?.promptId)?.set;
    // A work pick is a work lesson, a work speech or an opening drill
    const isWork = (label: string | undefined) => label === "Lesson" || label === "Prepared speech" || label === "Opening drill" || label === "Closing drill";
    // The two days' roles
    const roles = [first, second].map((plan) => (storyStep(plan[2]?.label) ? `story pick, ${cardSet(plan)} card` : isWork(plan[2]?.label) ? `work pick, ${cardSet(plan)} card` : "other"));
    // Confirm they swap, and each card comes from the other area's sets
    expect([...roles].sort()).toEqual(["story pick, work card", "work pick, stories card"]);
  });

  // The first days stay gentle: no prepared speech from a focus either, and the card and pick still come from it
  it("keeps the first days gentle with a focus", () => {
    // A new user's first three weeks of picks (no earlier days, so always the first days)
    const picks = Array.from({ length: 21 }, (_, offset) => dailyPlan({ day: dayAfter(offset), sessions: [], focusId: "pausing", nextTalk: null, practiceFocus: ["work"] }));
    // Confirm day one starts with free talk and no step is a prepared speech
    expect([picks.every((plan) => plan[0]?.mode === "free"), picks.some((plan) => plan.some((step) => step.mode === "response"))]).toEqual([true, false]);
  });

  // A dated talk takes the focus's pick when the focus is that talk, and the other pick otherwise, so the focus is never lost
  it("fits a talk coming up around the focus", () => {
    // A talk with today's step
    const nextTalk = { id: "talk1", title: "Team update", headline: "Rehearse the opening" };
    // With the talk focus, and with a stories focus
    const [talkFocus, storyFocus] = [focused(DAY, ["talk"], { nextTalk }), focused(DAY, ["stories"], { nextTalk })];
    // Confirm where the rehearsal goes, and that the story pick stays
    expect([talkFocus[2]?.mode, storyFocus[2]?.label && storyStep(storyFocus[2]?.label), storyFocus[3]?.mode]).toEqual(["rehearse", true, "rehearse"]);
  });

  // "Keep going" leads with the focus's next kind, and the suggestion follows the area leading today
  it("leads 'keep going' and the suggestion with the focus", () => {
    // The input and plan for a stories focus
    const input = { day: DAY, sessions: regular, focusId: "pausing", nextTalk: null, practiceFocus: ["stories"] as FocusAreaId[] };
    // Its "keep going"
    const more = moreToDo(input, dailyPlan(input));
    // Confirm a story first, at most four, and the suggestion
    expect([storyStep(more[0]?.label), more.length <= 4, todaysFocusSuggestion(input)?.action, todaysFocusSuggestion(input)?.href.startsWith("/stories/tell?prompt="), todaysFocusSuggestion({ ...input, practiceFocus: [] }), focusSuggestion(area("talk"), DAY).href]).toEqual([true, true, "Tell another story", true, null, "/rehearse"]);
  });
});
