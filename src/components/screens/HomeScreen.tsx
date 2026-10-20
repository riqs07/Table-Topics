"use client";
// The Home screen: today's practice only, with a short line on the streak and the week's focus (everything else is in Practice)

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
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
// Load the week's summary
import { yourWeek, type YourWeek } from "@/core/yourWeek";
// Load the pause-word setting rule
import { pauseWordsShown } from "@/core/pauseWords";
// Load the card that shows it
import { YourWeekCard } from "@/components/script/YourWeekCard";
// Load the seven-day strip
import { weekStrip, type StripDay } from "@/core/weekStrip";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load the loaded-plan type
import type { LoadedPlan } from "@/data/dailyPlan";
// Load the plan loader (the plan's code and content load beside the saved data, not with the page; decision 88)
import { loadDailyPlanLater } from "@/data/loadDailyPlanLater";
// Load the plan's time and addresses
import { nextStepIndex, planHref, planMinutes, type PlanStep } from "@/core/planSteps";
// Load the done and next marks on a path
import { PathMark } from "@/components/script/PathMark";
// Load the day's summary wording
import { spokenSentence, stepNote, weekSentence } from "@/core/daySummary";
// Load the calendar-day key
import { dayKey } from "@/core/dates";
// Load the once-a-day completion flag, kept in this browser
import { firstFinishToday } from "@/data/dayCelebrated";
// Load the filter that leaves out private moment notes
import { practiceSessions } from "@/core/sessionHome";
// Load the welcome flag, kept in this browser
import { markWelcomeSeen, readWelcomeSeen } from "@/data/welcome";

// The number of steps as a word, for the headline ("Four short steps.")
const STEP_COUNTS: Readonly<Record<number, string>> = { 1: "One", 2: "Two", 3: "Three", 4: "Four" };

// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the mission card and rules
import { MissionCard } from "@/components/script/MissionCard";
import { missionDays, missionToday } from "@/core/missions";
// Load the record type for mission tries
import type { MissionRecord } from "@/data/records";
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

// A step in a few words for the action band, so its side text never reads like a tab name ("a Learn card", "Warm up")
function stepWords(step: PlanStep): string {
  // A card, or the step's own name
  return step.kind === "card" ? "a Learn card" : step.label;
}

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
  // Fillers over three weeks and one suggestion, once there are three sessions
  week: YourWeek | null;
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
  // Every mission try, oldest first
  missions: MissionRecord[];
  // The one reminder to keep practice safe, if any (decision 64)
  nudge: SafetyNudge;
}

// Load and prepare everything Home shows, saving the weekly focus if it moved on
async function loadHome(repository: Repository, now: Date): Promise<HomeData> {
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
    // The week's summary
    week: yourWeek(sessions, now, { pauseWords: pauseWordsShown(settings) }),
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
    // Mission tries
    missions: settings.missions ?? [],
    // The moment, once a day, when every step is done
    celebrate: plan.done.length > 0 && plan.done.every(Boolean) && firstFinishToday(dayKey(now)),
    // The one reminder to keep practice safe, if any
    nudge: safetyNudge(await readSafetyFacts(sessions.length, now)),
  };
}

// Draw the Home screen
export function HomeScreen(props: ScreenProps) {
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
    loadHome(repo, today).then((loaded) => {
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
  }, [repo, today, attempt]);

  // Try loading again after a problem
  function retryLoad() {
    // Clear the problem, back to the placeholder
    setLoadError(null);
    // Load afresh
    setAttempt(attempt + 1);
  }

  // Answer or skip the welcome, so it does not come back
  function finishWelcome() {
    // Remember it in this browser
    markWelcomeSeen();
    // Show Today as usual
    if (data) setData({ ...data, showWelcome: false });
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

  // Draw the page
  return (
    // Full-height page: one column on a phone, margin plus main column on a computer
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
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
      {data && <div className="flex flex-1 flex-col md:grid md:grid-cols-[240px_1fr] md:gap-14 md:pt-8">
        {/* Context: streak and focus (above the step on a phone, in the margin on a computer) */}
        <aside className="mt-5 text-lede text-ink-muted md:mt-0 md:text-footnote md:leading-relaxed">
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
          {data && !data.showWelcome && <p className="md:mt-3">This week: <em className="text-ink">{data.focus.title.toLowerCase()}</em>.</p>}
          {/* When the user practises, in their words (decision 78) */}
          {data && !data.showWelcome && data.anchor && <p className="mt-1">Your time: <em className="text-ink">{data.anchor}</em>.</p>}
          {/* On a computer, the week's summary in this column */}
          {data && !data.showWelcome && data.week && <div className="mt-8 hidden md:block"><YourWeekCard week={data.week} /></div>}
        </aside>

        {/* Main column */}
        <div className="flex flex-1 flex-col">
          {/* A first visit: one question, then straight to the right place */}
          {data?.showWelcome && (
            <section aria-label="Welcome" className="mt-8 md:mt-0">
              {/* The greeting */}
              <h1 className="font-display text-prompt font-semibold tracking-tight motion-safe:animate-rise md:text-prompt-xl">Welcome to VoiceLab</h1>
              {/* What it is, and the privacy promise */}
              <p className="mt-3 max-w-[52ch] text-lede">Practise speaking, privately. Your recordings stay on this device.</p>
              {/* What a session gives (decision 78) */}
              <p className="mt-2 max-w-[52ch] text-lede">Every take ends with one change to try.</p>
              {/* One way in: today's first step (the "what brings you here?" question went with decision 67; two of its three answers led to the same place) */}
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
              <h1 className="mt-2 font-display text-statement font-semibold tracking-tight md:text-statement-xl">{allDone ? "Done for today." : nextIndex === -1 ? "The rest can wait." : doneCount === 0 ? `${STEP_COUNTS[plan.steps.length] ?? "A few"} short steps.` : "Pick up where you left off."}</h1>
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
                  // That line (or, for a step put off today, saying so)
                  const result = session ? stepNote(session) : plan.skipped[index] && !plan.done[index] ? "Skipped for today" : null;
                  // One step
                  return (
                    <li key={step.lane} className="motion-safe:animate-rise" style={{ animationDelay: `${150 + index * 70}ms` }}>
                      {/* The whole row starts the step: a rounded tile, warm when next */}
                      <Link href={planHref(step, index + 1)} aria-label={`Step ${index + 1}: ${step.label}`} className={`flex items-center gap-x-3 rounded-2xl px-3 py-2.5 ${PRESS} ${mark === "next" ? "bg-warm-tint" : "bg-paper-raised hover:bg-paper"}`}>
                        {/* Its mark (when the day is first done, the ticks grow in one by one, unless motion is unwelcome) */}
                        <span className={data?.celebrate ? "motion-safe:animate-pop" : undefined} style={data?.celebrate ? { animationDelay: `${850 + index * 120}ms` } : undefined}><PathMark mark={mark} number={index + 1} /></span>
                        {/* What it is */}
                        <span className="min-w-0 flex-1">
                          {/* Its name and time */}
                          <span className={`block text-footnote ${mark === "next" ? "font-semibold text-warm-ink" : "text-ink-muted"}`}>{step.label} · {step.minutes} min</span>
                          {/* What it uses */}
                          <span className="block leading-snug">{step.title}</span>
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

          {/* A reminder to keep practice safe, when one is due (decision 64) */}
          {data?.nudge && today && (
            <div className="mt-8">
              <SafetyNote nudge={data.nudge} onDismiss={() => { markNudgeDismissed(today); setData({ ...data, nudge: null }); }} />
            </div>
          )}

          {/* Today's mission: a small real-world try, under the steps (the task and a link; the prediction lives on Learn, decisions 62 and 66) */}
          {plan && data && today && (
            <div className="mt-8">
              <MissionCard key={data.missions.length} repo={repo} now={today} state={missionToday(data.missions, today)} onChange={(missions) => setData({ ...data, missions })} compact />
            </div>
          )}

          {/* On a phone, the week's summary under the mission (on a computer it sits in the margin) */}
          {data && !data.showWelcome && data.week && <div className="mt-8 md:hidden"><YourWeekCard week={data.week} /></div>}

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
          {/* The main action: start or carry on with today's practice, or practise more once it is done */}
          {plan && (nextIndex === -1 ? (
            <ActionBand action="Practise more" aside="everything in Practice" href="/practice" />
          ) : (
            <ActionBand action={doneCount === 0 ? "Start today’s practice" : `Continue: step ${nextIndex + 1}`} aside={nextStep ? `Step ${nextIndex + 1} · ${stepWords(nextStep)}` : ""} href={planHref(plan.steps[nextIndex]!, nextIndex + 1)} />
          ))}
        </div>
      </div>}
    </main>
  );
}
