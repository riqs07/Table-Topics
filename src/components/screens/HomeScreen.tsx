"use client";
// The Home screen: today's prompt as the page, with streak, focus, and the weekly challenge around it

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Footnote } from "@/components/script/Footnote";
import { Masthead } from "@/components/script/Masthead";
// Load the weekly challenge picker
import { challengeForWeek, type Challenge } from "@/content/challenges";
// Load the three jobs
import { JOBS } from "@/content/modes";
// Load the streak sentence
import { streakSentence } from "@/core/copy";
// Load the day label helper
import { dayKey } from "@/core/dates";
// Load the weekly focus rules
import { currentFocus, type Focus } from "@/core/focus";
// Load the practice week calculator
import { practiceWeek } from "@/core/practiceWeek";
// Load the streak calculator
import { currentStreak } from "@/core/streak";
// Load the seven-day strip
import { weekStrip, type StripDay } from "@/core/weekStrip";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load today's practice and the next talk with a date
import { loadDailyPlan, type LoadedPlan } from "@/data/dailyPlan";
// Load the plan's time and addresses
import { planHref, planMinutes } from "@/core/dailyPlan";
// Load the done and next marks on a path
import { PathMark } from "@/components/script/PathMark";
// Load the rate formatter, for the summary
import { formatRate } from "@/core/copy";
// Load the welcome flag, kept in this browser
import { markWelcomeSeen, readWelcomeSeen } from "@/data/welcome";

// The welcome question's answers and where each leads
const WELCOME_CHOICES: ReadonlyArray<{ text: string; href: string }> = [
  // A talk coming up
  { text: "I have a talk coming up", href: "/rehearse" },
  // Speaking without a script
  { text: "I want to speak better on the spot", href: "/practice" },
  // One skill
  { text: "I want to work on one skill", href: "/skills" },
];
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";

// Everything Home shows that comes from saved data
interface HomeData {
  // Number of sessions so far
  sessionCount: number;
  // Consecutive practice days
  streak: number;
  // The last seven days, marked where there was practice
  strip: StripDay[];
  // This week's focus
  focus: Focus;
  // This week's challenge
  challenge: Challenge;
  // Id of this week's challenge record
  challengeRecordId: string;
  // Day this practice week began (ISO text)
  weekStart: string;
  // Whether the challenge is done
  challengeDone: boolean;
  // Whether to ask the welcome question: a first visit with nothing saved yet
  showWelcome: boolean;
  // Today's practice
  plan: LoadedPlan;
}

// Load and prepare everything Home shows, saving the weekly focus if it moved on
async function loadHome(repository: Repository, now: Date): Promise<HomeData> {
  // Read every session
  const sessions = await repository.listSessions();
  // Read the settings (defaults for a new user)
  const settings = await repository.getSettings(now);
  // Work out the focus, advancing one step per full week
  const active = currentFocus({ focusIndex: settings.focusIndex, focusStartedOn: new Date(settings.focusStartedOn) }, now);
  // Save the settings so a new user's start date sticks and any advance is kept
  await repository.saveSettings({ ...settings, focusIndex: active.focusIndex, focusStartedOn: active.focusStartedOn.toISOString() });
  // Find the first session's time (the list is newest first)
  const first = sessions.at(-1);
  // Work out which practice week it is
  const week = practiceWeek(first ? new Date(first.createdAt) : null, now);
  // Id of this week's challenge record
  const challengeRecordId = `week-${dayKey(week.weekStart)}`;
  // The saved talks
  const talks = await repository.listTalks();
  // Look for a saved record of this week's challenge
  const record = (await repository.listChallenges()).find((challenge) => challenge.id === challengeRecordId);
  // Put everything together
  return {
    // How many sessions there are
    sessionCount: sessions.length,
    // Consecutive days with a session
    streak: currentStreak(sessions.map((session) => new Date(session.createdAt)), now),
    // The last seven days
    strip: weekStrip(sessions.map((session) => new Date(session.createdAt)), now),
    // This week's focus
    focus: active.focus,
    // This week's challenge
    challenge: challengeForWeek(week.weekNumber),
    // Its record id
    challengeRecordId,
    // When the week began
    weekStart: week.weekStart.toISOString(),
    // Whether it is done
    challengeDone: Boolean(record?.completedAt),
    // A first visit: nothing saved, and the welcome not yet answered in this browser
    showWelcome: sessions.length === 0 && talks.length === 0 && !readWelcomeSeen(),
    // Today's practice (after the focus is saved, so both agree)
    plan: await loadDailyPlan(repository, now),
  };
}

// Draw the Home screen
export function HomeScreen(props: ScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // Saved data, once loaded
  const [data, setData] = useState<HomeData | null>(null);

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
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);

  // Save the weekly challenge as done (or not) when the box is ticked
  async function toggleChallenge(done: boolean) {
    // Nothing to do before data has loaded
    if (!data || !today) return;
    // Save the challenge record
    await repo.saveChallenge({ id: data.challengeRecordId, weekStart: data.weekStart, text: data.challenge.text, completedAt: done ? today.toISOString() : null });
    // Show the new state
    setData({ ...data, challengeDone: done });
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
  // The first step not yet done (-1 when all are)
  const nextIndex = plan ? plan.done.indexOf(false) : -1;
  // Steps done
  const doneCount = plan ? plan.done.filter(Boolean).length : 0;

  // Draw the page
  return (
    // Full-height page: one column on a phone, margin plus main column on a computer
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Name and links */}
      <Masthead title="VoiceLab" section="today" />

      {/* Two columns on a computer */}
      <div className="flex flex-1 flex-col md:grid md:grid-cols-[240px_1fr] md:gap-14 md:pt-8">
        {/* Context: streak and focus (above the step on a phone, in the margin on a computer) */}
        <aside className="mt-5 text-lede text-ink-muted md:mt-0 md:text-footnote md:leading-relaxed">
          {/* Streak, or a first-time line */}
          {data && !data.showWelcome && <p>{data.sessionCount === 0 ? "First time here? Start with the step below." : streakSentence(data.streak)}</p>}
          {/* The last seven days as squares, filled where there was practice */}
          {data && !data.showWelcome && data.sessionCount > 0 && (
            <ul aria-label="The last seven days" className="mt-3 mb-4 flex gap-1.5">
              {/* Each day */}
              {data.strip.map((day) => (
                // One square with the day's letter; today has a darker edge
                <li key={day.key} aria-label={`${day.name}${day.isToday ? ", today" : ""}: ${day.practised ? "practised" : "not yet"}`} className={`flex size-8 items-center justify-center border text-tab ${day.practised ? "border-accent bg-accent text-accent-ink" : "border-rule text-ink-muted"} ${day.isToday ? "outline-2 outline-offset-2 outline-ink" : ""}`}>
                  {/* The letter, which the label already says */}
                  <span aria-hidden="true">{day.letter}</span>
                </li>
              ))}
            </ul>
          )}
          {/* This week's focus (held back during the welcome, which asks one thing only) */}
          {data && !data.showWelcome && (
            <p className="md:mt-6 md:border-t md:border-rule md:pt-3">
              This week: <em className="text-ink">{data.focus.title.toLowerCase()}</em>. {data.focus.description}
            </p>
          )}
        </aside>

        {/* Main column */}
        <div className="flex flex-1 flex-col">
          {/* A first visit: one question, then straight to the right place */}
          {data?.showWelcome && (
            <section aria-label="Welcome" className="mt-8 md:mt-0">
              {/* The greeting */}
              <h1 className="font-display text-prompt tracking-tight md:text-prompt-xl">Welcome to VoiceLab</h1>
              {/* What it is, and the privacy promise */}
              <p className="mt-3 max-w-[52ch] text-lede">Practise speaking, privately. Your recordings stay on this device.</p>
              {/* The question */}
              <p className="mt-6 italic text-ink-muted">What brings you here?</p>
              {/* The three answers */}
              <ul aria-label="What brings you here?" className="mt-2 divide-y divide-rule border-y border-ink">
                {/* Each answer */}
                {WELCOME_CHOICES.map((choice) => (
                  // One answer
                  <li key={choice.href}>
                    {/* It leads to its job */}
                    <Link href={choice.href} onClick={finishWelcome} className="block py-3 font-display text-cue hover:text-accent">{choice.text}</Link>
                  </li>
                ))}
              </ul>
              {/* Skip */}
              <button type="button" onClick={finishWelcome} className="inline-flex min-h-11 items-center mt-4 italic text-ink-muted underline underline-offset-4">Skip</button>
            </section>
          )}

          {/* Today's practice: the steps, with done and next marks */}
          {plan && (
            <section aria-label="Today's practice" className="mt-8 md:mt-0">
              {/* What it is and how long */}
              <p className="text-footnote italic text-ink-muted">Today’s practice · about {planMinutes(plan.steps)} minutes with listening back</p>
              {/* Where things stand, set like a headline */}
              <h1 className="mt-2 font-display text-prompt tracking-tight md:text-prompt-xl">{nextIndex === -1 ? "Done for today." : doneCount === 0 ? (plan.steps.length === 2 ? "Two short steps." : "Three short steps.") : "Pick up where you left off."}</h1>
              {/* The steps */}
              <ol aria-label="Steps" className="mt-4">
                {/* Each step */}
                {plan.steps.map((step, index) => {
                  // Done, next, or still to come
                  const mark = plan.done[index] ? "done" : index === nextIndex ? "next" : "open";
                  // When done, a line from today's session: the user's note, or the filler count
                  const session = plan.done[index] ? plan.today.find((item) => item.mode === step.mode && item.promptId === step.promptId) : undefined;
                  // That line
                  const result = session ? (session.selfReview?.change || `${formatRate(session.fillersPerMinute)} fillers a minute`) : null;
                  // One step
                  return (
                    <li key={step.kind} className="relative">
                      {/* The line to the next step (not after the last) */}
                      {index < plan.steps.length - 1 && <span aria-hidden="true" className="absolute top-14 bottom-0 left-[17px] w-0.5 bg-rule" />}
                      {/* The whole row starts the step */}
                      <Link href={planHref(step, index + 1)} aria-label={`Step ${index + 1}: ${step.label}`} className="relative flex items-start gap-x-4 py-3 hover:text-accent">
                        {/* Its mark */}
                        <PathMark mark={mark} number={index + 1} />
                        {/* What it is */}
                        <span className="min-w-0 flex-1">
                          {/* Its name and time */}
                          <span className={`block text-footnote italic ${mark === "next" ? "text-accent" : "text-ink-muted"}`}>{step.label} · {step.minutes} min</span>
                          {/* What it uses */}
                          <span className="block text-lede">{step.title}</span>
                          {/* How it went, once done */}
                          {result && <span className="block text-footnote text-ink-muted">{result}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              {/* Once done, a word on what is next */}
              {nextIndex === -1 && <p className="mt-3 max-w-[52ch] italic text-ink-muted">A new practice is ready tomorrow. Anything else you want to practise is below.</p>}
            </section>
          )}

          {/* The three jobs (the welcome asks the same thing, so they wait until it is answered) */}
          {!data?.showWelcome && <nav aria-label="Or choose" className="mt-8">
            {/* Small heading */}
            <p className="text-footnote italic text-ink-muted">Or choose</p>
            {/* One row per job */}
            <ul aria-label="Or choose" className="mt-2 divide-y divide-rule border-y border-rule">
              {/* Each job */}
              {JOBS.map((job) => (
                // One job
                <li key={job.id}>
                  {/* The link, with its line of explanation */}
                  <Link href={job.href} className="flex min-h-14 flex-wrap items-baseline justify-between gap-x-4 py-3 hover:text-accent">
                    {/* Its name */}
                    <span className="font-display text-cue">{job.name} →</span>
                    {/* What it covers */}
                    <span className="text-footnote text-ink-muted">{job.blurb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>}

          {/* Push the footer down */}
          <div className="flex-1" />
          {/* This week's challenge as a footnote with a checkbox */}
          {data && (
            <Footnote>
              {/* Label wraps the box and text so either can be tapped */}
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                {/* Square checkbox, filled with the accent when ticked */}
                <input type="checkbox" checked={data.challengeDone} onChange={(event) => toggleChallenge(event.target.checked)} className="mt-0.5 size-6 flex-none appearance-none border-2 border-ink checked:border-accent checked:bg-accent" />
                {/* The challenge */}
                <span>Off the page this week: <span>{data.challenge.text.charAt(0).toLowerCase() + data.challenge.text.slice(1)}</span></span>
              </label>
            </Footnote>
          )}
          {/* The main action: start or carry on with today's practice, or practise more once it is done */}
          {plan && (nextIndex === -1 ? (
            <ActionBand action="Practise more" aside="on your own" href="/practice" />
          ) : (
            <ActionBand action={doneCount === 0 ? "Start today’s practice" : `Continue: step ${nextIndex + 1}`} aside={plan.steps[nextIndex]?.label ?? ""} href={planHref(plan.steps[nextIndex]!, nextIndex + 1)} />
          ))}
        </div>
      </div>
    </main>
  );
}
