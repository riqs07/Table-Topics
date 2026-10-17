"use client";
// The Home screen: today's practice, the three main ways to practise on your own, and a short line on the streak and the week's focus

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Masthead } from "@/components/script/Masthead";
// Load the day's prompts for practising on your own
import { promptForDay, tableTopicForDay } from "@/content/prompts";
// Load the icons for the three ways to practise
import { BookOpenTextIcon, LightningIcon, PresentationIcon } from "@phosphor-icons/react/dist/ssr";
// Load the streak sentence
import { streakSentence } from "@/core/copy";
// Load the weekly focus rules
import { currentFocus, type Focus } from "@/core/focus";
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
  // The saved talks
  const talks = await repository.listTalks();
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
          {/* This week's focus, in a few words (held back during the welcome, which asks one thing only) */}
          {data && !data.showWelcome && <p className="md:mt-3">This week: <em className="text-ink">{data.focus.title.toLowerCase()}</em>.</p>}
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

          {/* The three main ways to practise on your own (held back during the welcome) */}
          {data && !data.showWelcome && today && (
            <section aria-labelledby="on-your-own" className="mt-10 mb-8">
              {/* Small heading */}
              <h2 id="on-your-own" className="text-footnote italic text-ink-muted">Or practise on your own</h2>
              {/* Three tiles, one row on a wider screen */}
              <ul className="mt-2 grid gap-3 sm:grid-cols-3">
                {/* Each way */}
                {[
                  // Reading a speech aloud
                  { href: "/skills#readings", icon: BookOpenTextIcon, name: "Read aloud", detail: "A famous speech, a minute at a time" },
                  // A Table Topic
                  { href: `/session?mode=talk&prompt=${tableTopicForDay(today, 1).id}`, icon: LightningIcon, name: "Table Topic", detail: "A surprise question, 1 to 2 minutes" },
                  // A prepared speech
                  { href: `/session?mode=response&prompt=${promptForDay(today, 1).id}`, icon: PresentationIcon, name: "Prepared speech", detail: "Plan for 2 minutes, speak for 2 to 4" },
                ].map((way) => (
                  // One tile
                  <li key={way.name}>
                    {/* The whole tile starts it */}
                    <Link href={way.href} className="flex h-full min-h-20 items-center gap-3 border border-rule bg-paper px-4 py-3 hover:border-accent sm:flex-col sm:items-start">
                      {/* Its icon */}
                      <way.icon aria-hidden="true" className="size-7 flex-none text-accent" />
                      {/* Its name and what it is */}
                      <span>
                        {/* The name */}
                        <span className="block font-display text-cue leading-tight">{way.name}</span>
                        {/* What it is */}
                        <span className="block text-footnote text-ink-muted">{way.detail}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Push the action down */}
          <div className="flex-1" />
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
