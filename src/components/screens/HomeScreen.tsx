"use client";
// The Home screen: today's practice, with a short line on the streak and the week's focus, the Connect lesson the user is on and Quick play (everything else is in Practice; decision 135)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the icon for a course prompt coming back (decision 131)
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { PRESS, PRIMARY, RowLink, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
import { Masthead } from "@/components/script/Masthead";
// Load the streak sentence
import { streakLines } from "@/core/copy";
// Load the weekly focus rules
import { currentFocus, type Focus } from "@/core/focus";
// Load the streak calculator
import { practiceRun, type PracticeRun } from "@/core/streak";
// Load the seven-day strip
import { weekStrip, type StripDay } from "@/core/weekStrip";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load the loaded-plan type
import type { LoadedPlan } from "@/data/dailyPlan";
// Load the plan loader (the plan's code and content load beside the saved data, not with the page; decision 88)
import { loadDailyPlanLater } from "@/data/loadDailyPlanLater";
// Load the plan's time and addresses, and the step type
import { nextStepIndex, planHref, planMinutes, type PlanStep } from "@/core/planSteps";
// Load the kind-of-session type
import type { SessionMode } from "@/data/records";
// Load the done and next marks on a path
// Load the day's summary wording
import { spokenSentence, stepNote, weekSentence } from "@/core/daySummary";
// Load the calendar-day key
import { dayKey } from "@/core/dates";
// Load the once-a-day completion flag, kept in this browser
import { firstFinishToday } from "@/data/dayCelebrated";
// Load the record of steps already ticked off today (decision 141)
import { newlyTicked } from "@/data/stepsTicked";
// Load a step's key
import { stepKey } from "@/core/planSteps";
// Load the filter that leaves out private moment notes
import { practiceSessions } from "@/core/sessionHome";
// Load the step's scene as its mark, and which scene each step shows (decision 137)
import { GLIDE, PageFade, SharedScene, onlyOnce } from "@/components/scenes/SharedScene";
import { stepTile } from "@/components/scenes/modeTileFor";
import { stepScene } from "@/components/scenes/sceneFor";
import { GROUND_TINT, ModeTile } from "@/components/scenes/ModeTile";
// Load the cast: Sage greets, the blob celebrates
import { Cast } from "@/components/scenes/Cast";
// Load the tick, the sparkle on "Since day 1" and the chevron
import { CaretRightIcon, CheckIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
// Load the comparison of the first recording with the latest, and the rate's wording
import { baselineProgress } from "@/core/progress";
import { formatRate } from "@/core/copy";
// Load the pause-word setting rule, so "Since day 1" never counts hidden pause words
import { pauseWordsShown } from "@/core/pauseWords";
// Load the welcome flag, kept in this browser
import { markWelcomeSeen, readWelcomeSeen } from "@/data/welcome";
// Load what the user wants to get better at most: the reader, the words for it, and saving it (decision 97)
import { focusPhrase, readPracticeFocus, type FocusAreaId } from "@/core/practiceFocus";
import { savePracticeFocus } from "@/data/practiceFocus";
// Load the choice of areas
import { FocusPicker } from "@/components/script/FocusPicker";

// The number of steps as a word, for the headline ("Four short steps.")
const STEP_COUNTS: Readonly<Record<number, string>> = { 1: "One", 2: "Two", 3: "Three", 4: "Four" };

// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the mission days, which count towards the run
import { missionDays } from "@/core/missions";
// Load the scene tile and the icons for Today's two tiles (decision 138)
// Load the shared heading and card looks
import { BUBBLE, CARD, CARD_LIST, CHIP, CHIP_GOOD, LAB, PBAR, PBAR_FILL, SECTION_HEADING } from "@/components/script/textStyles";
// Load the end-of-day moment
import { DoneBurst } from "@/components/script/DoneBurst";
// Load the loading placeholder
import { Skeleton } from "@/components/script/Skeleton";
// Load the reminder to keep practice safe
import { SafetyNote } from "@/components/script/SafetyNote";
// Load the rule for which reminder to show
import { safetyNudge, type SafetyNudge } from "@/core/storageSafety";
// Load the browser facts behind it, and the way to put it aside
import { markNudgeDismissed, readSafetyFacts } from "@/data/storageSafety";
// Load the check-in rules for the reminder to look back (decision 100)
import { CHECK_IN_MINUTES, CHECK_IN_PARTS, groupCheckIns, readCheckInSettings, resurfaceDue, sinceWords } from "@/core/checkIn";
// Load the way to put the reminder aside
import { markReminderSeen } from "@/data/checkIns";
// Load the Quick play pick's type (types only; its code and content load after the page has shown, decision 88)
import type { QuickPlayPick } from "@/core/quickPlay";
// Load the saved passphrase, which means the coach can write lines for any conversation
import { readPassphrase } from "@/data/passphrase";

// Everything Home shows that comes from saved data
interface HomeData {
  // Number of sessions so far
  sessionCount: number;
  // Where practice stands: days in the last seven and the forgiving run (decision 78)
  run: PracticeRun;
  // Whether the run and the week's squares are hidden (a setting)
  hideStreak: boolean;
  // When the user practises, in their words, or empty
  anchor: string;
  // The last seven days, marked where there was practice
  strip: StripDay[];
  // This week's focus
  focus: Focus;
  // Whether to ask the welcome question: a first visit with nothing saved yet
  showWelcome: boolean;
  // Today's practice
  plan: LoadedPlan;
  // Which day of the week's practice today is, such as "Fourth day this week."
  weekLine: string;
  // Whether to play the small completion moment (the first time Today shows the day done)
  celebrate: boolean;
  // The steps done since Today last showed them, to tick off with a small moment (none on the day's finish, which has its own; decision 141)
  ticked: string[];
  // The one reminder to keep practice safe, if any (decision 64)
  nudge: SafetyNudge;
  // What the user wants to get better at most: missing until asked, empty when left open (decision 97)
  practiceFocus: FocusAreaId[] | undefined;
  // The reminder to hear the first check-in beside the latest, when one is due (decision 100)
  reminder: { days: number } | null;
  // The Connect lesson the user is on, or none once every lesson is done (decision 135)
  lesson: CurrentLesson | null;
  // Quick play's pick for this visit: a kind of practice at random (decision 135)
  quick: QuickPlayPick;
  // Since the first recording, in words ("1.5 fewer pause words a minute"), or null when there is no real gain to show
  since: string | null;
}

// The Connect lesson the user is on: the first lesson not yet answered, in the units' order (decision 95)
interface CurrentLesson {
  // Its unit's name
  unit: string;
  // Its number in the unit
  number: number;
  // Lessons in the unit
  total: number;
  // Its title
  title: string;
  // What it uses, to tell it apart from today's steps
  promptId: string;
}

// Load and prepare everything Home shows, saving the weekly focus if it moved on
async function loadHome(repository: Repository, now: Date, random: () => number): Promise<HomeData> {
  // Start fetching the plan's code at once, so it arrives while the saved data is read (a failure shows when the plan is loaded below)
  void import("@/data/dailyPlan").catch(() => undefined);
  // Read every session that counts (private moment notes are left out)
  const sessions = practiceSessions(await repository.listSessions());
  // Read the settings (defaults for a new user)
  const settings = await repository.getSettings(now);
  // Work out the focus, advancing one step per full week
  const active = currentFocus({ focusIndex: settings.focusIndex, focusStartedOn: new Date(settings.focusStartedOn) }, now);
  // Save the settings so a new user's start date sticks and any advance is kept
  await repository.saveSettings({ ...settings, focusIndex: active.focusIndex, focusStartedOn: active.focusStartedOn.toISOString() });
  // The saved talks
  const talks = await repository.listTalks();
  // Today's practice (after the focus is saved, so both agree)
  const plan = await loadDailyPlanLater(repository, now);
  // The lesson and Quick play's code, fetched after the page has shown like the plan's (decision 88)
  const [{ nextUnit }, { quickPlay }] = await Promise.all([import("@/core/units"), import("@/core/quickPlay")]);
  // The unit the user is in, with its next lesson
  const unit = nextUnit(sessions);
  // The first recording against the latest, for "Since day 1"
  const progress = baselineProgress(sessions);
  // Fewer pause words a minute since then (none when pause words are hidden; decision 79)
  const fewer = progress && pauseWordsShown(settings) ? progress.baseline - progress.latest : 0;
  // Put everything together
  return {
    // How many sessions there are
    sessionCount: sessions.length,
    // Days in the last seven and the forgiving run (sessions and missions count)
    run: practiceRun([...sessions.map((session) => new Date(session.createdAt)), ...missionDays(settings.missions ?? [])], now),
    // Whether to hide it
    hideStreak: settings.hideStreak === true,
    // The practice time in the user's words
    anchor: settings.anchor?.trim() ?? "",
    // The last seven days
    strip: weekStrip([...sessions.map((session) => new Date(session.createdAt)), ...missionDays(settings.missions ?? [])], now),
    // This week's focus
    focus: active.focus,
    // A first visit: nothing saved, and the welcome not yet answered in this browser
    showWelcome: sessions.length === 0 && talks.length === 0 && !readWelcomeSeen(),
    // Today's practice
    plan,
    // The days practised this week
    weekLine: weekSentence(sessions, now),
    // The moment, once a day, when every step is done
    celebrate: plan.done.length > 0 && plan.done.every(Boolean) && firstFinishToday(dayKey(now)),
    // The steps to tick off now: done since Today last showed them, unless the whole day is done
    ticked: plan.done.length > 0 && plan.done.every(Boolean) ? [] : newlyTicked(dayKey(now), plan.steps.filter((_, index) => plan.done[index]).map(stepKey)),
    // The one reminder to keep practice safe, if any
    nudge: safetyNudge(await readSafetyFacts(sessions.length, now)),
    // What the user wants to get better at most
    practiceFocus: readPracticeFocus(settings.practiceFocus),
    // The reminder to look back, from the sessions already read; held back while today's check-in waits, so Today asks one thing at a time
    // The lesson the user is on
    lesson: unit.nextLesson ? { unit: unit.unit.name, number: unit.nextLesson.number, total: unit.lessonsTotal, title: unit.nextLesson.title, promptId: unit.nextLesson.id } : null,
    // A kind of practice at random, with conversations picked as their own Quick play picks them
    quick: quickPlay({ conversations: sessions.filter((session) => session.mode === "conversation").map((session) => ({ scenarioId: session.conversation?.scenarioId })), written: readPassphrase() !== "" }, random),
    // Since day 1: only a real gain, rounded as the rest of the app rounds rates
    since: fewer >= 0.2 ? `${formatRate(fewer)} fewer pause words a minute` : null,
    // The reminder to look back (below)
    reminder: plan.checkIn && !plan.done[plan.steps.findIndex((step) => step.kind === "checkin")] ? null : resurfaceDue({ today: now, checkIns: groupCheckIns(sessions, readCheckInSettings(settings.checkIn)), settings: readCheckInSettings(settings.checkIn) }),
  };
}

// The reminder to look back (decision 100): the first check-in beside the latest, at a week, two weeks, a month and then monthly; opening it or "Not now" puts it aside for good
function ReminderCard({ days, onSeen }: { days: number; onSeen: () => Promise<void> }) {
  // What went wrong putting it aside, if anything
  const [problem, setProblem] = useState<string | null>(null);
  // Put it aside, saying so if that fails
  async function putAside() {
    // Try to save
    try {
      // Saved, and the card goes
      await onSeen();
    } catch (error: unknown) {
      // Said, so it can be tried again
      setProblem(error instanceof Error ? error.message : String(error));
    }
  }
  // The card
  return (
    <section aria-labelledby="look-back" className={`mt-8 p-5 ${CARD}`}>
      {/* The invitation */}
      <h2 id="look-back" className="font-display text-cue font-semibold">Hear how far you’ve come</h2>
      {/* Why now */}
      <p className="mt-1 text-footnote text-ink-muted">It’s been {sinceWords(days)} since your first check-in. Hear it beside your latest.</p>
      {/* A failure to put it aside */}
      {problem !== null && <p role="alert" className="mt-3 text-footnote">That could not be saved. The browser said: “{problem}” Try again.</p>}
      {/* Open it, or not now */}
      <p className="mt-4 flex flex-wrap gap-3">
        {/* Open the comparison (and put the reminder aside on the way) */}
        <Link href="/check-in/compare" onClick={() => void onSeen().catch(() => undefined)} className={PRIMARY}>Compare</Link>
        {/* Not now */}
        <button type="button" onClick={() => void putAside()} className={SECONDARY}>Not now</button>
      </p>
    </section>
  );
}

// The question for someone who was here before it was asked (decision 97): a short card under today's steps, answered or put aside once
function FocusAsk({ onAnswer }: { onAnswer: (picks: FocusAreaId[]) => Promise<void> }) {
  // The areas picked so far
  const [picks, setPicks] = useState<FocusAreaId[]>([]);
  // Whether an answer is being saved
  const [saving, setSaving] = useState(false);
  // What went wrong saving, if anything
  const [problem, setProblem] = useState<string | null>(null);
  // Save an answer (an empty one puts the question aside), saying so if it fails
  async function answer(chosen: FocusAreaId[]) {
    // Saving
    setSaving(true);
    // Clear any earlier problem
    setProblem(null);
    // Try to save
    try {
      // Save it (the card goes once Today reloads)
      await onAnswer(chosen);
    } catch (error: unknown) {
      // Say why, so it can be tried again
      setProblem(error instanceof Error ? error.message : String(error));
      // Ready to try again
      setSaving(false);
    }
  }
  // The card
  return (
    <section aria-labelledby="focus-ask" className={`mt-8 p-5 ${CARD}`}>
      {/* The question */}
      <h2 id="focus-ask" className="font-display text-cue font-semibold">What do you want to get better at most?</h2>
      {/* What it does */}
      <p className="mt-1 text-footnote text-ink-muted">Pick one or two.</p>
      {/* The choices, names only */}
      <FocusPicker value={picks} onChange={setPicks} label="What do you want to get better at most?" compact />
      {/* A save that failed: why, with the buttons still there to try again */}
      {problem !== null && <p role="alert" className="mt-3 text-footnote">That could not be saved. The browser said: “{problem}” Try again.</p>}
      {/* Save, or put it aside */}
      <p className="mt-4 flex flex-wrap gap-3">
        {/* Save the picks */}
        <button type="button" disabled={saving || picks.length === 0} onClick={() => void answer(picks)} className={PRIMARY}>Save</button>
        {/* Not now: answered with nothing, so it does not come back (Settings can still set it) */}
        <button type="button" disabled={saving} onClick={() => void answer([])} className={SECONDARY}>Not now</button>
      </p>
    </section>
  );
}

// What each kind of step is, in a line under its title (a step's own result replaces it once done)
const KIND_LINES: Partial<Record<PlanStep["kind"], string>> = {
  // A Learn card
  card: "One idea and a move to try",
  // Quick scenarios
  scenarios: "Pick the best reply, then say it",
  // The warm-up routine
  warmup: "Loosen up before you speak",
  // The weekly check-in
  checkin: "The same four parts each week",
  // A scene
  scene: "Step into a moment and reply",
  // Active listening
  listening: "Listen, then answer what mattered",
};

// The same for a recorded step, by its kind of session
const MODE_LINES: Partial<Record<SessionMode, string>> = {
  // Rapid Fire (its title already says what it is)
  talk: "Hidden until you start, 1 to 2 minutes",
  // Free talk
  free: "Talk as long as you like",
  // A prepared speech
  response: "Plan for 2 minutes, speak for 2 to 4",
  // Read aloud
  read: "Read it out loud",
  // A pause drill
  pause: "Pause at each mark",
  // A lesson
  lesson: "A tip, then read it out loud",
  // A story
  story: "Tell it out loud, start to finish",
  // Small talk
  smalltalk: "A quick chat, about a minute",
  // Your talk
  rehearse: "Run it start to finish",
  // A voice drill
  voice: "A short drill for your voice",
};

// A step's label as the small label shows it ("Course: Stop freezing" reads "Course · Stop freezing")
function stepLab(step: PlanStep): string {
  // The colon as a dot
  return step.label.replace(": ", " · ");
}

// The last seven days as tick squares, with the run in words under them (a phone's Today; the side rail shows the week on a computer)
function WeekTicks({ strip, lines, className = "" }: { strip: ReadonlyArray<StripDay>; lines: ReadonlyArray<string>; className?: string }) {
  // A card with a row of squares
  return (
    <div className={`flex flex-col gap-2 px-3.5 py-3 ${CARD} ${className}`}>
      {/* The squares */}
      <ul aria-label="The last seven days" className="flex justify-between gap-1.5">
        {/* Each day, popping in one after another */}
        {strip.map((day, index) => (
          // One square with the day's letter under it: green with a tick where practised, dashed for today
          <li key={day.key} aria-label={`${day.name}${day.isToday ? ", today" : ""}: ${day.practised ? "practised" : "not yet"}`} className="flex flex-col items-center gap-1 motion-safe:animate-pop" style={{ animationDelay: `${100 + index * 60}ms` }}>
            {/* The square */}
            <span aria-hidden="true" className={`flex size-9 items-center justify-center rounded-[10px] ${day.practised ? "bg-fill text-fill-ink shadow-chunky-pressed" : day.isToday ? "border-3 border-dashed border-accent" : "bg-paper"}`}>{day.practised && <CheckIcon weight="bold" className="size-5" />}</span>
            {/* The letter, which the label already says */}
            <span aria-hidden="true" className="text-tab font-extrabold text-ink-muted">{day.letter}</span>
          </li>
        ))}
      </ul>
      {/* The run, in words */}
      {lines.map((line) => <p key={line} className="text-footnote font-extrabold">{line}</p>)}
    </div>
  );
}

// Since the first recording: one real gain, leading to the progress page
function SinceCard({ since, className = "" }: { since: string; className?: string }) {
  // The whole card is the link
  return (
    <Link href="/profile" data-since className={`flex items-center gap-3.5 px-4 py-3 ${CARD} ${PRESS} hover:-translate-y-0.5 ${className}`}>
      {/* The sparkle on plum */}
      <span aria-hidden="true" className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-art-plum text-art-cream"><SparkleIcon weight="fill" className="size-6" /></span>
      {/* What changed */}
      <span className="flex min-w-0 flex-1 flex-col">
        {/* The heading */}
        <b className="font-extrabold">Since day 1</b>
        {/* The gain */}
        <span className="text-sm font-bold text-ink-muted">{since}</span>
      </span>
      {/* It leads somewhere */}
      <CaretRightIcon aria-hidden="true" weight="bold" className="size-4 flex-none text-ink-muted" />
    </Link>
  );
}

// On a phone, the step waiting now on top of the day's deck, with the next two peeking out under it (storyboard "Today")
function NowDeck({ step, index, total }: { step: PlanStep; index: number; total: number }) {
  // Its picture
  const tile = stepTile(step);
  // The stack
  return (
    <div className={`relative md:hidden ${total > 2 ? "pb-5" : total > 1 ? "pb-2.5" : ""}`}>
      {/* The third card, furthest back */}
      {total > 2 && <span aria-hidden="true" className="absolute inset-x-6 bottom-0 h-12 rounded-[22px] border-2 border-rule bg-card shadow-card" />}
      {/* The second card */}
      {total > 1 && <span aria-hidden="true" className="absolute inset-x-3 bottom-2.5 h-12 rounded-[22px] border-2 border-rule bg-card shadow-card" />}
      {/* The card on top, edged in sun: starts the step */}
      <Link href={planHref(step, index + 1)} aria-label={`Now: ${step.label}, step ${index + 1} of ${total}`} className={`relative flex items-center gap-4 rounded-[22px] border-2 border-art-sun bg-card p-4 shadow-next ${PRESS}`}>
        {/* The picture */}
        <ModeTile ground={tile.ground} prop={tile.prop} face={tile.face} tilt={-4} className="size-24 flex-none" />
        {/* What it is */}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Now, and its kind */}
          <span className={LAB}>Now · {stepLab(step)}</span>
          {/* What it uses */}
          <span className="font-display text-xl leading-tight font-semibold">{step.title}</span>
          {/* Its time and place in the day */}
          <span className="mt-1 flex flex-wrap gap-1.5"><span className={CHIP}>{step.minutes} min</span><span className={CHIP}>{index + 1} of {total}</span></span>
        </span>
      </Link>
    </div>
  );
}

// Draw the Home screen
export function HomeScreen({ random = Math.random, ...props }: ScreenProps & { random?: () => number }) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // Saved data, once loaded
  const [data, setData] = useState<HomeData | null>(null);
  // The browser's reason when saved data could not be read, so the page explains instead of waiting forever
  const [loadError, setLoadError] = useState<string | null>(null);
  // How many times loading was tried, so "Try again" loads afresh
  const [attempt, setAttempt] = useState(0);

  // Load saved data once the time is known
  useEffect(() => {
    // Wait for the time
    if (!today) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Load and store the data
    loadHome(repo, today, random).then((loaded) => {
      // Keep it only if the screen is still open
      if (!cancelled) setData(loaded);
    }).catch((error: unknown) => {
      // Keep the reason to show, if still open
      if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today, attempt, random]);

  // Try loading again after a problem
  function retryLoad() {
    // Clear the problem, back to the placeholder
    setLoadError(null);
    // Load afresh
    setAttempt(attempt + 1);
  }

  // The areas picked at the welcome, before Start
  const [welcomePicks, setWelcomePicks] = useState<FocusAreaId[]>([]);
  // Which of the welcome's two screens shows: Sage saying hello, then the question (storyboard "Welcome" and "What to work on")
  const [welcomeStep, setWelcomeStep] = useState<"hello" | "focus">("hello");

  // Answer the welcome with what was picked (or nothing), so it does not come back; Start goes on to the first step at once, and the plan reloads with the focus behind it
  function finishWelcome() {
    // Remember it in this browser
    markWelcomeSeen();
    // Show Today as usual
    if (data) setData({ ...data, showWelcome: false });
    // Nothing to save before the time is known
    if (!today) return;
    // Save the picks (an empty list too, so Today does not ask again), then reload today's plan with them; if saving fails, Today simply asks again next time
    void savePracticeFocus(repo, welcomePicks, today).then(() => setAttempt((count) => count + 1), () => undefined);
  }

  // Save the answer from Today's card (or put the question aside with an empty answer), then reload the plan with it
  async function answerFocus(picks: FocusAreaId[]) {
    // Nothing to save before the time is known
    if (!today) return;
    // Save it
    await savePracticeFocus(repo, picks, today);
    // Reload today's plan and the rest with it
    setAttempt((count) => count + 1);
  }

  // Today's practice, once the data is in
  const plan = data && !data.showWelcome ? data.plan : null;
  // Where the welcome leads by default: the first step of today's practice, so the first win comes in about a minute
  const firstStep = data?.plan.steps[0] ? planHref(data.plan.steps[0], 1) : "/practice";
  // The first step neither done nor put off today (-1 when none is left)
  const nextIndex = plan ? nextStepIndex(plan.done, plan.skipped) : -1;
  // Whether every step is done (put-off steps are not done; decision 77)
  const allDone = !!plan && plan.done.every(Boolean);
  // Steps done
  const doneCount = plan ? plan.done.filter(Boolean).length : 0;
  // The run's lines, unless hidden
  const runLines = data && !data.showWelcome && !data.hideStreak ? streakLines(data.run) : [];
  // The next step
  const nextStep = plan && nextIndex !== -1 ? plan.steps[nextIndex] : undefined;
  // Whether today's check-in is the step waiting, so the card leads with it (decision 100)
  const checkInWaiting = nextStep?.kind === "checkin";
  // This week's focus, once there is practice it can be about (with none yet, "This week: strong opening." read as a verdict on nothing; round 4)
  const showFocus = !!data && !data.showWelcome && data.run.any;
  // The lesson the user is on, unless it is already one of today's open steps (one link to it is enough)
  const lesson = plan && data?.lesson && !plan.steps.some((step, index) => step.promptId === data.lesson?.promptId && !plan.done[index]) ? data.lesson : null;
  // The kinds that appear once on Today, whose tile may glide into its screen (decision 141)
  const uniqueScenes = onlyOnce(plan ? plan.steps.map(stepScene) : []);
  // The steps still to do, and their minutes
  const openSteps = plan ? plan.steps.filter((_, index) => !plan.done[index]) : [];
  // "Evening" and the like, for the greeting and the heading
  const dayPart = partOfDay(today);
  // Sage's line in the bubble: a greeting for the time of day and what is left
  const greeting = !plan ? "" : checkInWaiting ? (plan.checkIn?.baseline ? `Today is your first check-in. About ${CHECK_IN_MINUTES} minutes.` : `Check-in day. About ${CHECK_IN_MINUTES} minutes.`) : nextIndex === -1 ? "The rest can wait. Come back if a moment comes up." : `${dayPart}. ${doneCount === 0 ? `${STEP_COUNTS[plan.steps.length] ?? "A few"} short ones ${dayPart === "Evening" ? "tonight" : "today"}` : `${plan.steps.length - doneCount} to go`}, about ${planMinutes(openSteps)} minutes.`;
  // The next step's address, for the Start button
  const nextHref = plan && nextStep ? planHref(nextStep, nextIndex + 1) : null;
  // The heading: "Tonight" in the evening, otherwise "Today", or where things stand
  const heading = !plan ? "" : nextIndex === -1 ? "The rest can wait." : checkInWaiting ? (plan.checkIn?.baseline ? "Your first check-in." : "Check-in day.") : doneCount > 0 ? "Pick up where you left off." : dayPart === "Evening" ? "Tonight" : "Today";
  // Under it: the steps and minutes, and how far through
  const stepsLine = plan ? `${plan.steps.length} ${plan.steps.length === 1 ? "step" : "steps"} · about ${planMinutes(plan.steps)} minutes${doneCount > 0 ? ` · ${doneCount} done` : ""}` : "";
  // The one main action beside the heading
  const startLabel = doneCount === 0 ? "Start" : "Continue";

  // Draw the page
  return (
    // Full-height page, wide on a computer
    <PageFade>
      <main id="main" className="mx-auto flex min-h-dvh w-full max-w-[1232px] flex-col bg-paper-raised px-4 pt-5 pb-16 sm:px-6 md:px-14 md:pt-4">
        {/* Name and links */}
        <Masthead title="VoiceLab" section="today" nav={!data?.showWelcome} />

        {/* Until saved data is read, a quiet placeholder, so the page appears in one piece (decision 76) */}
        {!data && !loadError && <Skeleton blocks={["h-24", "h-96"]} />}
        {/* Saved data could not be read: why, and the ways forward */}
        {!data && loadError !== null && (
          <section role="alert" className="mt-8 max-w-[48ch] text-lede">
            {/* What happened */}
            <h1 className="font-display text-statement font-semibold">Your practice could not be loaded.</h1>
            {/* The browser's reason, so the problem can be pinned down */}
            <p className="mt-3">The browser said: “{loadError}” Try again; if it keeps happening, reload the page or check that this site may store data on this device.</p>
            {/* Try again, or practise anyway */}
            <p className="mt-6 flex flex-wrap gap-3">
              {/* Try again */}
              <button type="button" onClick={retryLoad} className={SECONDARY}>Try again</button>
              {/* Practise anyway */}
              <Link href="/practice" className={TEXT_LINK}>Go to Practice</Link>
            </p>
          </section>
        )}

        {/* A first visit, first screen: Sage says hello, one button (storyboard "Welcome") */}
        {data?.showWelcome && welcomeStep === "hello" && (
          <section aria-label="Welcome" className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center pt-6 text-center md:pt-12">
            {/* Sage, big, in a soft warm glow */}
            <span className="relative flex items-center justify-center motion-safe:animate-rise">
              {/* The glow */}
              <span aria-hidden="true" className="absolute size-72 rounded-full bg-art-sun/20 blur-2xl" />
              {/* The coach */}
              <Cast who="sage" mood="encouraging" className="relative size-56 md:size-64" />
            </span>
            {/* Who this is */}
            <h1 className="mt-6 font-display text-statement font-semibold motion-safe:animate-rise">Hi. I’m Sage.</h1>
            {/* What VoiceLab does, and where recordings go */}
            <p className="mt-3 max-w-[40ch] text-lede font-bold text-ink-muted">I’ll help you speak with more ease, a few minutes a day. Every take ends with one change to try. VoiceLab keeps your recordings on this device.</p>
            {/* Push the buttons down on a phone */}
            <div className="min-h-8 flex-1" />
            {/* On to the question */}
            <button type="button" onClick={() => setWelcomeStep("focus")} className={`${PRIMARY} mt-8 w-full max-w-sm`}>Let’s start</button>
            {/* Someone with a saved copy: Settings can bring it back */}
            <Link href="/settings#your-data" onClick={() => markWelcomeSeen()} className={`${TEXT_LINK} mt-2 uppercase tracking-[.04em]`}>I’ve been here before</Link>
          </section>
        )}

        {/* A first visit, second screen: Sage asks what to work on, big picture rows, Continue (storyboard "What to work on") */}
        {data?.showWelcome && welcomeStep === "focus" && (
          <section aria-label="What to work on" className="mx-auto flex w-full max-w-2xl flex-1 flex-col pt-2 md:pt-8">
            {/* How far through the welcome */}
            <span aria-hidden="true" className={PBAR}><span className={`${PBAR_FILL} w-1/3 motion-safe:animate-fill`} /></span>
            {/* Sage asks, in a bubble (the question is the page's heading) */}
            <div className="mt-6 flex items-end gap-3">
              {/* The coach */}
              <Cast who="sage" mood="curious" className="size-20 flex-none md:size-24" />
              {/* The question */}
              <h1 id="focus-question" className={`${BUBBLE} mb-2 font-display text-xl font-semibold md:text-2xl`}>What do you want to get better at most?</h1>
            </div>
            {/* How many */}
            <p className="mt-3 font-bold text-ink-muted">Pick one or two. You can change it in Settings.</p>
            {/* The choices */}
            <FocusPicker value={welcomePicks} onChange={setWelcomePicks} label="What do you want to get better at most?" />
            {/* Push the button down on a phone */}
            <div className="min-h-6 flex-1" />
            {/* One way in: today's first step, which on day one is speaking (decisions 37 and 78); it works with nothing picked */}
            <Link href={firstStep} onClick={finishWelcome} className={`${PRIMARY} mt-6 w-full max-md:sticky max-md:bottom-4 md:max-w-sm md:self-start`}>Continue</Link>
          </section>
        )}

        {/* Today */}
        {plan && data && (
          <div className="flex flex-1 flex-col gap-6 md:gap-8">
            {/* The day done: the blob celebrating, what was spoken, the week, and Sage's one suggestion (storyboard "Day done") */}
            {allDone && (
              <section aria-labelledby="done-heading" className="flex flex-col items-center text-center">
                {/* The blob and its confetti */}
                <DoneBurst celebrate={data.celebrate} />
                {/* Where things stand */}
                <h1 id="done-heading" className="font-display text-statement font-semibold motion-safe:animate-rise">Done for today.</h1>
                {/* The time spoken today, and which day of the week this is */}
                <p className="mt-2 max-w-[40ch] text-lede font-bold text-ink-muted">{`${spokenSentence(plan.today)}${data.hideStreak ? "" : ` ${data.weekLine}`}`}</p>
                {/* The week, its ticks filled */}
                {!data.hideStreak && data.run.any && <WeekTicks strip={data.strip} lines={[]} className="mt-5 w-full max-w-sm" />}
                {/* Sage suggests one extra, never pushes */}
                <div className="mt-6 flex w-full max-w-md items-end gap-3 text-left">
                  {/* The coach */}
                  <Cast who="sage" mood="proud" className="size-16 flex-none md:size-20" />
                  {/* The suggestion */}
                  <p className={`${BUBBLE} mb-2`}>{plan.suggestion ? `One more? ${plan.suggestion.action}, for ${plan.suggestion.phrase}.` : "Lovely work. A new practice is ready tomorrow."}</p>
                </div>
                {/* The one main action */}
                {plan.suggestion ? <Link href={plan.suggestion.href} className={`${PRIMARY} mt-6 w-full max-w-md`}>{plan.suggestion.action}</Link> : <Link href="/practice" className={`${PRIMARY} mt-6 w-full max-w-md`}>Practise more</Link>}
                {/* No practice time chosen yet: a way to choose one (decision 78) */}
                {!data.anchor && <Link href="/settings#practice-time" className={`${TEXT_LINK} mt-2`}>Choose when you’ll practise tomorrow</Link>}
              </section>
            )}

            {/* Sage's greeting, and since day 1 */}
            {!allDone && (
              <div className="flex flex-wrap items-center justify-between gap-5">
                {/* The coach and the bubble */}
                <div className="flex min-w-0 flex-[1_1_460px] items-end gap-3 md:gap-4">
                  {/* The coach */}
                  <Cast who="sage" mood="encouraging" className="size-20 flex-none md:size-28" />
                  {/* What today holds */}
                  <p data-greeting className={`${BUBBLE} mb-3.5 max-w-[520px] flex-1 text-lg md:text-xl`}>{greeting}</p>
                </div>
                {/* One real gain since the first recording, on a computer */}
                {data.since && <SinceCard since={data.since} className="max-md:hidden" />}
              </div>
            )}

            {/* The week as ticks, on a phone (the rail shows it on a computer) */}
            {!allDone && !data.hideStreak && data.run.any && <WeekTicks strip={data.strip} lines={runLines} className="md:hidden" />}

            {/* Today's practice: the steps as picture cards */}
            <section aria-label="Today's practice" className="flex flex-col gap-4.5">
              {/* The heading, its steps and minutes, and the one Start beside it */}
              {!allDone && (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* What it is and how long (on a phone the bubble and the deck say it, so it is read out only) */}
                  <div className="flex flex-col gap-0.5 max-md:sr-only">
                    {/* Where things stand, set like a headline */}
                    <h1 className="font-display text-4xl leading-tight font-semibold">{heading}</h1>
                    {/* The steps and minutes */}
                    <p className="font-bold text-ink-muted">{stepsLine}</p>
                  </div>
                  {/* Start the next step, on a computer */}
                  {nextHref && nextStep && <Link href={nextHref} aria-label={`${startLabel} step ${nextIndex + 1}: ${nextStep.label}`} className={`${PRIMARY} max-md:hidden`}>{startLabel}</Link>}
                </div>
              )}
              {/* On a check-in day, what it is in a line (decision 100) */}
              {checkInWaiting && <p className="-mt-2 max-w-[56ch] text-lede font-semibold text-ink-muted">{plan.checkIn?.baseline ? `Four short parts, about ${CHECK_IN_MINUTES} minutes. Next week you’ll hear the change.` : `The same four parts as last time, about ${CHECK_IN_MINUTES} minutes.${plan.checkIn?.late ? " Still open today." : ""}`}</p>}
              {/* On a phone: the step waiting now on top of the deck, then one big Start, then since day 1 */}
              {nextStep && nextHref && (
                <div className="flex flex-col gap-4 md:hidden">
                  {/* The deck */}
                  <NowDeck step={nextStep} index={nextIndex} total={plan.steps.length} />
                  {/* Start */}
                  <Link href={nextHref} aria-label={`${startLabel} step ${nextIndex + 1}: ${nextStep.label}`} className={`${PRIMARY} min-h-14 w-full`}>{startLabel}</Link>
                  {/* Since day 1 */}
                  {data.since && <SinceCard since={data.since} />}
                </div>
              )}
              {/* On a phone, every step under a small heading */}
              <h2 className={`${SECTION_HEADING} mt-2 md:hidden`}>{allDone ? "Today’s steps" : "All steps"}</h2>
              {/* The steps, as picture cards */}
              <ol aria-label="Steps" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] lg:gap-5.5">
                {/* Each step */}
                {plan.steps.map((step, index) => {
                  // Done, next, or still to come
                  const mark = plan.done[index] ? "done" : index === nextIndex ? "next" : "open";
                  // When done, a line from today's session: the user's note, or how long they spoke (never a filler count)
                  const session = plan.done[index] ? plan.today.find((item) => item.mode === step.mode && item.promptId === step.promptId) : undefined;
                  // How far the check-in has got, in parts (decision 100)
                  const parts = step.kind === "checkin" && plan.checkIn ? plan.checkIn.parts.filter((part) => part.status !== "open").length : 0;
                  // That line (or, for a step put off today, saying so; for the check-in, its parts)
                  const result = step.kind === "checkin" ? (plan.done[index] ? "Done" : parts > 0 ? `${parts} of ${CHECK_IN_PARTS.length} parts` : plan.skipped[index] ? "Skipped for today" : null) : step.kind === "course" && plan.done[index] ? "Part done" : session ? stepNote(session) : plan.skipped[index] && !plan.done[index] ? "Skipped for today" : null;
                  // What it is, in a line, until there is a result
                  const line = result ?? (step.mode ? MODE_LINES[step.mode] : KIND_LINES[step.kind]) ?? null;
                  // Its picture
                  const tile = stepTile(step);
                  // Whether it was done since Today last showed it (decision 141)
                  const justDone = !!data.ticked.includes(stepKey(step));
                  // (taking over as the next step after one was)
                  const arriving = mark === "next" && !!data.ticked.length;
                  // Done or put off: quieter
                  const faded = !!(plan.done[index] || plan.skipped[index]);
                  // Its kind's scene name, kept on the picture so the step's kind can be read (decision 137)
                  const scene = stepScene(step);
                  // Whether the picture pops in: a step just ticked off, the step taking over, or every step when the day is first done (decision 141)
                  const pop = justDone || arriving || data.celebrate;
                  // The tile, gliding into its screen when its kind shows once
                  const picture = <ModeTile ground={tile.ground} prop={tile.prop} face={plan.done[index] ? "happy" : tile.face} tilt={index % 2 ? 4 : -4} still={faded || mark !== "next"} scene={scene && uniqueScenes.has(scene) ? scene : undefined} className="size-22 sm:size-39" />;
                  // One step
                  return (
                    <li key={step.lane} data-step-lane={step.lane} className="motion-safe:animate-rise" style={{ animationDelay: `${150 + index * 70}ms` }}>
                      {/* The whole card starts the step; the next one is edged in sun with a sun ledge and marked as the current step */}
                      <Link href={planHref(step, index + 1)} transitionTypes={GLIDE} aria-label={`Step ${index + 1}: ${step.label}`} aria-current={mark === "next" ? "step" : undefined} className={`flex h-full flex-row overflow-hidden rounded-[22px] border-2 bg-card sm:flex-col ${PRESS} hover:-translate-y-0.5 ${mark === "next" ? "border-art-sun shadow-next" : "border-rule shadow-card"}`}>
                        {/* The picture on its ground's tint, with a tick once done */}
                        <span data-step-scene={scene ?? undefined} data-tick={justDone ? "done" : arriving ? "arriving" : undefined} className={`relative flex w-28 flex-none items-center justify-center sm:h-44 sm:w-auto ${GROUND_TINT[tile.ground]}`}>
                          {/* The tile */}
                          <span className={`flex ${faded ? "opacity-55" : ""} ${pop ? "motion-safe:animate-pop" : ""}`} style={pop ? { animationDelay: data.celebrate ? `${850 + index * 120}ms` : justDone ? "900ms" : "1400ms" } : undefined}>{scene && uniqueScenes.has(scene) ? <SharedScene scene={scene}><span className="flex" data-shared>{picture}</span></SharedScene> : picture}</span>
                          {/* The done tick */}
                          {plan.done[index] && <span className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-fill text-fill-ink shadow-chunky-pressed sm:top-3 sm:right-3 sm:size-9"><CheckIcon aria-hidden="true" weight="bold" className="size-5" /><span className="sr-only">Done</span></span>}
                        </span>
                        {/* What it is */}
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5 sm:px-4.5 sm:pt-4 sm:pb-4.5">
                          {/* Now (for the one waiting), its kind */}
                          <span className={LAB}>{mark === "next" ? `Now · ${stepLab(step)}` : stepLab(step)}</span>
                          {/* What it uses */}
                          <span data-step-title className="font-display text-lg leading-tight font-semibold sm:text-xl">{step.title}</span>
                          {/* How it went, once done, or what it is */}
                          {line && <span className={`text-sm font-bold ${result ? "text-accent-tint-ink" : "text-ink-muted"}`}>{line}</span>}
                          {/* Its time, and "Up next" on the one waiting */}
                          <span className="mt-1 flex flex-wrap gap-1.5"><span className={CHIP}>{step.minutes} min</span>{mark === "next" && <span className={CHIP_GOOD}>Up next</span>}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              {/* With steps put off, a word on what is next */}
              {nextIndex === -1 && !allDone && <p className="max-w-[52ch] font-semibold text-ink-muted">Skipped steps are still here if a moment comes up.</p>}
            </section>

            {/* A course prompt coming back: the same question again, then both answers side by side (decision 131) */}
            {plan.revisit && (
              <Link href={plan.revisit.href} data-revisit className={`flex items-center gap-4 p-4 ${CARD} ${PRESS}`}>
                {/* The mark */}
                <span aria-hidden="true" className="flex size-12 flex-none items-center justify-center rounded-2xl bg-warm-tint text-warm-ink"><ArrowCounterClockwiseIcon weight="bold" className="size-6" /></span>
                {/* What it is */}
                <span className="min-w-0 flex-1">
                  {/* Heading and where it comes from */}
                  <span className={`block ${LAB}`}>Back again · from {plan.revisit.from}</span>
                  {/* The question */}
                  <span className="block font-display text-lg leading-snug font-semibold">{plan.revisit.question}</span>
                  {/* What happens */}
                  <span className="block text-footnote font-semibold text-ink-muted">Answer it again, then hear both side by side.</span>
                </span>
              </Link>
            )}

            {/* Beside today's steps: the lesson the user is on and Quick play (decisions 135 and 138) */}
            <section aria-labelledby="also-today" className="flex flex-col gap-3.5">
              {/* Heading */}
              <h2 id="also-today" className={SECTION_HEADING}>Also today</h2>
              {/* The cards */}
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] md:gap-5.5">
                {/* Keep going: the lesson the user is on, with how far through its unit, straight into it */}
                {lesson && (
                  <li>
                    <Link href={`/session?mode=smalltalk&prompt=${lesson.promptId}`} className={`flex h-full items-center gap-4.5 px-4.5 py-4 ${CARD} ${PRESS} hover:-translate-y-0.5`}>
                      {/* The picture */}
                      <ModeTile ground="bloom" prop="chat" face="wow" tilt={-4} className="size-20 flex-none md:size-24" />
                      {/* What it is */}
                      <span className="flex min-w-0 flex-1 flex-col gap-2">
                        {/* The small label */}
                        <span className={LAB}>Keep going</span>
                        {/* The unit */}
                        <span className="font-display text-xl leading-tight font-semibold">{lesson.unit}</span>
                        {/* How far through, as a bar */}
                        <span role="img" aria-label={`${lesson.number - 1} of ${lesson.total} lessons done`} className={PBAR}><span className={PBAR_FILL} style={{ width: `${Math.max(4, ((lesson.number - 1) / Math.max(1, lesson.total)) * 100)}%` }} /></span>
                        {/* And in words, with the next lesson */}
                        <span className="text-sm font-bold text-ink-muted">{lesson.number - 1} of {lesson.total} lessons · next: {lesson.title}</span>
                      </span>
                    </Link>
                  </li>
                )}
                {/* Quick play: what it is, not what it picked, so the pick stays a surprise */}
                <li>
                  <Link href={data.quick.href} className={`flex h-full items-center gap-4.5 px-4.5 py-4 ${CARD} ${PRESS} hover:-translate-y-0.5`}>
                    {/* The picture */}
                    <ModeTile ground="plum" prop="star" face="happy" tilt={4} className="size-20 flex-none md:size-24" />
                    {/* What it is */}
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      {/* The small label */}
                      <span className={LAB}>Quick play</span>
                      {/* What it does */}
                      <span className="font-display text-xl leading-tight font-semibold">A random kind of practice</span>
                      {/* The surprise */}
                      <span className="text-sm font-bold text-ink-muted">We won’t say which until you start.</span>
                    </span>
                  </Link>
                </li>
              </ul>
            </section>

            {/* The reminder to hear the first check-in beside the latest (decision 100) */}
            {data.reminder && today && <ReminderCard days={data.reminder.days} onSeen={async () => { await markReminderSeen(repo, data.reminder!.days, today); setData({ ...data, reminder: null }); }} />}

            {/* Someone who was here before the question: asked once, gently, under the steps (decision 97) */}
            {data.practiceFocus === undefined && <FocusAsk onAnswer={answerFocus} />}

            {/* A reminder to keep practice safe, when one is due (decision 64) */}
            {data.nudge && today && <SafetyNote nudge={data.nudge} onDismiss={() => { markNudgeDismissed(today); setData({ ...data, nudge: null }); }} />}

            {/* Once done: more to do, for anyone who wants to keep going */}
            {nextIndex === -1 && plan.more.length > 0 && (
              <section aria-labelledby="keep-going" className="flex flex-col gap-3.5">
                {/* Heading */}
                <h2 id="keep-going" className={SECTION_HEADING}>Keep going</h2>
                {/* The suggestions */}
                <ul className={CARD_LIST}>
                  {/* Each one */}
                  {plan.more.map((step) => (
                    // One suggestion: what kind, then what it uses
                    <li key={`${step.lane}-${step.promptId}`}>
                      <RowLink href={step.href} meta={`${step.minutes} min`}>
                        {/* Its kind */}
                        <span className={`block ${LAB}`}>{step.label}</span>
                        {/* What it uses */}
                        <span className="block font-semibold">{step.title}</span>
                      </RowLink>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* About your practice, quietly: the run on a computer, the week's focus, what you are getting better at and your time */}
            {(runLines.length > 0 || showFocus || !!data.practiceFocus?.length || !!data.anchor) && (
              <footer className="flex flex-col gap-1 text-footnote font-semibold text-ink-muted">
                {/* The run, in words, once the day is done (before then the week's ticks on a phone and the rail on a computer say it) */}
                {allDone && runLines.map((line) => <p key={line}>{line}</p>)}
                {/* This week's focus, in a few words */}
                {showFocus && <p>This week: <em className="not-italic text-ink">{data.focus.title.toLowerCase()}</em>.</p>}
                {/* What the user wants to get better at most, once chosen (decision 97) */}
                {!!data.practiceFocus?.length && <p>Getting better at: <em className="not-italic text-ink">{focusPhrase(data.practiceFocus)}</em>.</p>}
                {/* When the user practises, in their words (decision 78) */}
                {data.anchor && <p>Your time: <em className="not-italic text-ink">{data.anchor}</em>.</p>}
                {/* Where the run leads: progress against your own past self */}
                {runLines.length > 0 && <Link href="/profile" className={`${TEXT_LINK} min-h-9 self-start`}>See your progress</Link>}
              </footer>
            )}

            {/* Push the action down */}
            <div className="flex-1" />
            {/* With steps put off and none left: the one main action, with a focus its next thing, otherwise everything in Practice (decision 97) */}
            {nextIndex === -1 && !allDone && (plan.suggestion ? <ActionBand action={plan.suggestion.action} aside={`for ${plan.suggestion.phrase}`} href={plan.suggestion.href} /> : <ActionBand action="Practise more" aside="everything in Practice" href="/practice" />)}
          </div>
        )}
      </main>
    </PageFade>
  );
}

// "Morning", "Afternoon" or "Evening", for Sage's greeting
function partOfDay(now: Date | null): string {
  // The hour, or midday before the date is known
  const hour = now ? now.getHours() : 12;
  // The part of the day
  return hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
}
