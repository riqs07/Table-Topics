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
// Load the plan's time and addresses
import { nextStepIndex, planHref, planMinutes } from "@/core/planSteps";
// Load the done and next marks on a path
import { PathMark } from "@/components/script/PathMark";
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
// Load the hand-drawn welcome (decision 134)
import { Drawing } from "@/components/script/Drawing";
// Load the step's scene as its mark, and which scene each step shows (decision 137)
import { SceneMark } from "@/components/scenes/SceneMark";
import { stepScene } from "@/components/scenes/sceneFor";
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
import { WayCard } from "@/components/script/WayCard";
import { ShuffleIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
// Load the shared heading and card looks
import { CARD, SECTION_HEADING } from "@/components/script/textStyles";
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
      <h2 id="look-back" className="font-display text-cue font-semibold tracking-tight">Hear how far you’ve come</h2>
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
      <h2 id="focus-ask" className="font-display text-cue font-semibold tracking-tight">What do you want to get better at most?</h2>
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
  // The next step, in words for the action band ("Step 1 · a Learn card")
  const nextStep = plan && nextIndex !== -1 ? plan.steps[nextIndex] : undefined;
  // Whether today's check-in is the step waiting, so the card leads with it (decision 100)
  const checkInWaiting = nextStep?.kind === "checkin";
  // This week's focus, once there is practice it can be about (with none yet, "This week: strong opening." read as a verdict on nothing; round 4)
  const showFocus = !!data && !data.showWelcome && data.run.any;
  // The lesson the user is on, unless it is already one of today's open steps (one link to it is enough)
  const lesson = plan && data?.lesson && !plan.steps.some((step, index) => step.promptId === data.lesson?.promptId && !plan.done[index]) ? data.lesson : null;
  // Whether the margin has anything in it; with nothing, the page is one centred column instead of an empty left column on a computer
  const margin = !!data && !data.showWelcome && (runLines.length > 0 || (!data.hideStreak && data.run.any) || showFocus || !!data.anchor || !!data.practiceFocus?.length);

  // Draw the page
  return (
    // Full-height page: one column on a phone, margin plus main column on a computer
    <main id="main" className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Name and links */}
      <Masthead title="VoiceLab" section="today" nav={!data?.showWelcome} />

      {/* Until saved data is read, a quiet placeholder, so the page appears in one piece (decision 76) */}
      {!data && !loadError && <Skeleton blocks={["h-24", "h-96"]} />}
      {/* Saved data could not be read: why, and the ways forward */}
      {!data && loadError !== null && (
        <section role="alert" className="mt-8 max-w-[48ch] text-lede">
          {/* What happened */}
          <h1 className="font-display text-statement font-semibold tracking-tight">Your practice could not be loaded.</h1>
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
      {/* Two columns on a computer */}
      {data && <div className={`flex flex-1 flex-col md:pt-8 ${margin ? "md:grid md:grid-cols-[240px_1fr] md:gap-14" : "md:mx-auto md:w-full md:max-w-2xl"}`}>
        {/* Context: streak and focus (above the step on a phone, in the margin on a computer; left out when there is nothing to say yet) */}
        {margin && <aside className="mt-5 text-lede text-ink-muted md:mt-0 md:text-footnote md:leading-relaxed">
          {/* Where practice stands: days in the last seven, and the run from a week of practice; never a broken run (decision 78) */}
          {runLines.map((line) => <p key={line}>{line}</p>)}
          {/* The last seven days as squares, filled where there was practice */}
          {data && !data.showWelcome && !data.hideStreak && data.run.any && (
            <ul aria-label="The last seven days" className="mt-3 mb-4 flex gap-1.5">
              {/* Each day, popping in one after another */}
              {data.strip.map((day, index) => (
                // One rounded square with the day's letter: green where practised, warm for today, ringed in the warm tint
                <li key={day.key} aria-label={`${day.name}${day.isToday ? ", today" : ""}: ${day.practised ? "practised" : "not yet"}`} className={`flex size-8 items-center justify-center rounded-[10px] text-tab motion-safe:animate-pop ${day.practised ? "bg-fill text-fill-ink" : day.isToday ? "bg-warm text-on-warm" : "bg-paper text-ink-muted"} ${day.isToday ? "outline-3 outline-warm-tint" : ""}`} style={{ animationDelay: `${100 + index * 60}ms` }}>
                  {/* The letter, which the label already says */}
                  <span aria-hidden="true">{day.letter}</span>
                </li>
              ))}
            </ul>
          )}
          {/* This week's focus, in a few words (held back during the welcome, which asks one thing only) */}
          {showFocus && <p className="md:mt-3">This week: <em className="text-ink">{data.focus.title.toLowerCase()}</em>.</p>}
          {/* What the user wants to get better at most, once chosen (decision 97) */}
          {data && !data.showWelcome && !!data.practiceFocus?.length && <p className="mt-1">Getting better at: <em className="text-ink">{focusPhrase(data.practiceFocus)}</em>.</p>}
          {/* When the user practises, in their words (decision 78) */}
          {data && !data.showWelcome && data.anchor && <p className="mt-1">Your time: <em className="text-ink">{data.anchor}</em>.</p>}
        </aside>}

        {/* Main column */}
        <div className="flex flex-1 flex-col">
          {/* A first visit: one question, then straight to the right place */}
          {data?.showWelcome && (
            <section aria-label="Welcome" className="mt-8 md:mt-0">
              {/* Someone mid-explanation, to say hello (decision 134) */}
              <Drawing name="welcome" className="mb-4 block h-40 motion-safe:animate-rise md:h-52" />
              {/* The greeting */}
              <h1 className="font-display text-prompt font-semibold tracking-tight motion-safe:animate-rise md:text-prompt-xl">Welcome to VoiceLab</h1>
              {/* What it is, and what VoiceLab keeps (the speech recognition is explained before the microphone is first used; decision 97) */}
              <p className="mt-3 max-w-[52ch] text-lede">Practise speaking, privately. VoiceLab keeps your recordings on this device.</p>
              {/* What a session gives (decision 78) */}
              <p className="mt-2 max-w-[52ch] text-lede">Every take ends with one change to try.</p>
              {/* One question: what to get better at most, which steers the day's practice (decision 97) */}
              <h2 id="focus-question" className="mt-8 font-display text-statement font-semibold tracking-tight">What do you want to get better at most?</h2>
              {/* How many */}
              <p className="mt-1 text-ink-muted">Pick one or two. You can change it in Settings.</p>
              {/* The choices */}
              <FocusPicker value={welcomePicks} onChange={setWelcomePicks} label="What do you want to get better at most?" />
              {/* One way in: today's first step, which on day one is speaking (decisions 37 and 78); Start works with nothing picked */}
              <p className="mt-6"><Link href={firstStep} onClick={finishWelcome} className={PRIMARY}>Start</Link></p>
            </section>
          )}

          {/* Today's practice: the steps, with done and next marks */}
          {plan && (
            <section aria-label="Today's practice" className={`-mx-2 mt-6 p-5 motion-safe:animate-rise md:mx-0 md:mt-0 md:p-7 ${CARD}`}>
              {/* Once done: the full ring, badge and (the first time) sparks */}
              {allDone && <DoneBurst celebrate={data?.celebrate ?? false} />}
              {/* What it is and how long, with how far through */}
              <p className="flex justify-between text-footnote text-ink-muted"><span>Today · about {planMinutes(plan.steps)} min</span>{!allDone && doneCount > 0 && <span className="font-semibold text-warm-ink">{doneCount} of {plan.steps.length}</span>}</p>
              {/* Where things stand, set like a headline */}
              <h1 className="mt-2 font-display text-statement font-semibold tracking-tight md:text-statement-xl">{allDone ? "Done for today." : nextIndex === -1 ? "The rest can wait." : checkInWaiting ? (plan.checkIn?.baseline ? "Your first check-in." : "Check-in day.") : doneCount === 0 ? `${STEP_COUNTS[plan.steps.length] ?? "A few"} short steps.` : "Pick up where you left off."}</h1>
              {/* On a check-in day, what it is in a line (decision 100) */}
              {checkInWaiting && <p className="mt-2 max-w-[48ch] text-lede">{plan.checkIn?.baseline ? `Four short parts, about ${CHECK_IN_MINUTES} minutes. Next week you’ll hear the change.` : `The same four parts as last time, about ${CHECK_IN_MINUTES} minutes.${plan.checkIn?.late ? " Still open today." : ""}`}</p>}
              {/* Once done: the time spoken today, and which day of the week this is */}
              {allDone && data && <p className="mt-2 text-lede">{spokenSentence(plan.today)}{data.hideStreak ? "" : ` ${data.weekLine}`}</p>}
              {/* How far through, as a bar that fills in, once a step is done (an empty bar first thing reads as a zero; decision 78) */}
              {doneCount > 0 && (
                <span aria-hidden="true" className="mt-4 block h-2 overflow-hidden rounded-full bg-paper">
                  {/* The filled part */}
                  <span className="block h-full origin-left rounded-full bg-accent motion-safe:animate-fill" style={{ width: `${(doneCount / Math.max(1, plan.steps.length)) * 100}%`, animationDelay: "300ms" }} />
                </span>
              )}
              {/* The steps */}
              <ol aria-label="Steps" className="mt-4 flex flex-col gap-2">
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
                  // Its blob scene, if its kind has one (decision 137)
                  const scene = stepScene(step);
                  // Whether it was done since Today last showed it, and whether it takes over as the next step after one was (decision 141)
                  const justDone = !!data?.ticked.includes(stepKey(step));
                  // (taking over)
                  const arriving = mark === "next" && !!data?.ticked.length;
                  // One step
                  return (
                    <li key={step.lane} data-step-lane={step.lane} className="motion-safe:animate-rise" style={{ animationDelay: `${150 + index * 70}ms` }}>
                      {/* The whole row starts the step: a rounded tile, warm when next (and marked as the current step, since no band names it; decision 138) */}
                      <Link href={planHref(step, index + 1)} aria-label={`Step ${index + 1}: ${step.label}`} aria-current={mark === "next" ? "step" : undefined} className={`flex items-center gap-x-3 rounded-2xl px-3 py-2.5 ${PRESS} ${mark === "next" ? "bg-warm-tint" : "bg-paper-raised hover:bg-paper"}`}>
                        {/* Its mark: its scene where its kind has one, else its number (decision 137), each in the same width so the words line up; when the day is first done, the marks grow in one by one, unless motion is unwelcome */}
                        <span className={`flex w-14 flex-none justify-center ${data?.celebrate ? "motion-safe:animate-pop" : ""}`} style={data?.celebrate ? { animationDelay: `${850 + index * 120}ms` } : undefined}>{scene ? <SceneMark scene={scene} mark={mark} faded={!!(plan.done[index] || plan.skipped[index])} justDone={justDone} arriving={arriving} /> : <span className={justDone || arriving ? "motion-safe:animate-pop" : undefined} style={justDone || arriving ? { animationDelay: justDone ? "900ms" : "1400ms" } : undefined}><PathMark mark={mark} number={index + 1} /></span>}</span>
                        {/* What it is */}
                        <span className="min-w-0 flex-1">
                          {/* Its name and time */}
                          <span className={`block text-footnote ${mark === "next" ? "font-semibold text-warm-ink" : "text-ink-muted"}`}>{step.label} · {step.minutes} min</span>
                          {/* What it uses */}
                          <span data-step-title className="block leading-snug">{step.title}</span>
                          {/* How it went, once done */}
                          {result && <span className="block text-footnote text-ink-muted">{result}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              {/* Once done, a word on what is next */}
              {nextIndex === -1 && <p className="mt-3 max-w-[52ch] text-ink-muted">{allDone ? "A new practice is ready tomorrow." : "Skipped steps are still here if a moment comes up."}</p>}
              {/* Once done, and no practice time chosen yet: a way to choose one (decision 78) */}
              {allDone && data && !data.anchor && <p><Link href="/settings#practice-time" className={TEXT_LINK}>Choose when you’ll practise tomorrow</Link></p>}
            </section>
          )}

          {/* A course prompt coming back: the same question again, then both answers side by side (decision 131) */}
          {plan?.revisit && (
            <Link href={plan.revisit.href} data-revisit className={`mt-6 flex items-center gap-3 rounded-2xl border border-rule px-4 py-3 ${PRESS} hover:bg-paper`}>
              {/* The mark */}
              <span aria-hidden="true" className="flex size-9 flex-none items-center justify-center rounded-xl bg-warm-tint text-warm-ink"><ArrowCounterClockwiseIcon className="size-5" /></span>
              {/* What it is */}
              <span className="min-w-0 flex-1">
                {/* Heading and where it comes from */}
                <span className="block text-footnote text-ink-muted">Back again · from {plan.revisit.from}</span>
                {/* The question */}
                <span className="block leading-snug">{plan.revisit.question}</span>
                {/* What happens */}
                <span className="block text-footnote text-ink-muted">Answer it again, then hear both side by side.</span>
              </span>
            </Link>
          )}

          {/* Beside today's steps, as two scene tiles: the lesson the user is on, and Quick play, a kind of practice at random (decisions 135 and 138) */}
          {plan && data && (
            <section aria-labelledby="also-today" className="mt-8">
              {/* Run-in heading */}
              <h2 id="also-today" className={SECTION_HEADING}>Also today</h2>
              {/* The tiles, two by two */}
              <ul className="mt-3 grid grid-cols-2 gap-3">
                {/* The lesson the user is on, straight into it (its unit and place under its title) */}
                {lesson && <li><WayCard way={{ name: lesson.title, detail: `Your lesson · ${lesson.unit} ${lesson.number}/${lesson.total}`, href: `/session?mode=smalltalk&prompt=${lesson.promptId}`, icon: UsersThreeIcon, scene: "conversation" }} /></li>}
                {/* Quick play: what it is, not what it picked, so the pick stays a surprise */}
                <li><WayCard way={{ name: "Quick play", detail: "A random kind of practice", href: data.quick.href, icon: ShuffleIcon }} delay={70} /></li>
              </ul>
            </section>
          )}

          {/* The reminder to hear the first check-in beside the latest (decision 100) */}
          {data?.reminder && today && <ReminderCard days={data.reminder.days} onSeen={async () => { await markReminderSeen(repo, data.reminder!.days, today); setData({ ...data, reminder: null }); }} />}

          {/* Someone who was here before the question: asked once, gently, under the steps (decision 97) */}
          {plan && data && data.practiceFocus === undefined && <FocusAsk onAnswer={answerFocus} />}

          {/* A reminder to keep practice safe, when one is due (decision 64) */}
          {data?.nudge && today && (
            <div className="mt-8">
              <SafetyNote nudge={data.nudge} onDismiss={() => { markNudgeDismissed(today); setData({ ...data, nudge: null }); }} />
            </div>
          )}


          {/* Once done: more to do, for anyone who wants to keep going */}
          {plan && nextIndex === -1 && plan.more.length > 0 && (
            <section aria-labelledby="keep-going" className="mt-8">
              {/* Run-in heading */}
              <h2 id="keep-going" className={SECTION_HEADING}>Keep going</h2>
              {/* The suggestions */}
              <ul className={`mt-3 divide-y divide-rule px-4 ${CARD}`}>
                {/* Each one */}
                {plan.more.map((step) => (
                  // One suggestion: what kind, then what it uses
                  <li key={`${step.lane}-${step.promptId}`}>
                    <RowLink href={step.href} meta={`${step.minutes} min`}>
                      {/* Its kind */}
                      <span className="block text-footnote text-ink-muted">{step.label}</span>
                      {/* What it uses */}
                      <span className="block">{step.title}</span>
                    </RowLink>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Push the action down */}
          <div className="flex-1" />
          {/* Once the day is done, the one main action: with a focus, its next thing; otherwise everything in Practice (decision 97). While steps are left there is no band: the next step is the warm row in the list (decision 138) */}
          {plan && nextIndex === -1 && (plan.suggestion ? <ActionBand action={plan.suggestion.action} aside={`for ${plan.suggestion.phrase}`} href={plan.suggestion.href} /> : <ActionBand action="Practise more" aside="everything in Practice" href="/practice" />)}
        </div>
      </div>}
    </main>
  );
}
