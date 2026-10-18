"use client";
// The History screen: progress since the first recording, one trend line, and every session like a contents page

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the small-talk questions
import { findSmallTalk } from "@/content/smallTalk";
// Load the filter that leaves out private moment notes
import { practiceSessions } from "@/core/sessionHome";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
// Load the filled button link
import { PrimaryLink } from "@/components/script/Buttons";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the prompt library
import { BOOKENDS, findPrompt } from "@/content/prompts";
// Load the lookup for every text to read, full speeches included
import { findReading } from "@/content/readings";
// Load the lesson lookup
import { findLesson } from "@/content/lessons";
// Load the sentence builders
import { dayLabel, formatRate, progressSentence } from "@/core/copy";
// Load the progress calculations
import { baselineProgress, historyRows, trendSeries, type HistoryRow } from "@/core/progress";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// Size of the trend drawing (it stretches to fit its column)
const CHART = { width: 300, height: 80 };

// The trend line of fillers per minute, with a dotted guide at the first value, a caption and labels at each end
function Trend({ values }: { values: number[] }) {
  // Highest value, for scaling
  const top = Math.max(...values);
  // Lowest value, so the line uses the whole height
  const bottom = Math.min(...values);
  // Space kept above and below the line
  const pad = 8;
  // Vertical position of a value: highest at the top, lowest at the bottom, a flat line in the middle
  const y = (value: number) => (top === bottom ? CHART.height / 2 : pad + ((top - value) / (top - bottom)) * (CHART.height - 2 * pad));
  // The line's points
  const points = values.map((value, index) => `${(index / (values.length - 1)) * CHART.width},${y(value)}`).join(" ");
  // Draw it in the accent color, inside a captioned figure
  return (
    <figure aria-label="Fillers a minute, first try of each session" className="mt-5">
      {/* What the line measures */}
      <figcaption className="text-footnote italic text-ink-muted">Fillers a minute, first try of each session. Lower is better.</figcaption>
      {/* The drawing, stretched to the column */}
      <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} preserveAspectRatio="none" className="mt-3 h-20 w-full text-accent" role="img" aria-label={`Fillers per minute, from ${formatRate(values[0] ?? 0)} to ${formatRate(values.at(-1) ?? 0)}`}>
        {/* Dotted guide at the first recording's value */}
        <line x1="0" x2={CHART.width} y1={y(values[0] ?? 0)} y2={y(values[0] ?? 0)} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        {/* The trend line */}
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* The values at each end */}
      <p className="mt-1 flex justify-between text-footnote text-ink-muted">
        {/* Where it started */}
        <span>{`First: ${formatRate(values[0] ?? 0)}`}</span>
        {/* Where it is now */}
        <span className="text-ink">{`Latest: ${formatRate(values.at(-1) ?? 0)}`}</span>
      </p>
    </figure>
  );
}

// Find a prompt's text by id (talk titles come from the user's saved talks)
function promptText(session: SessionRecord, talkTitles: ReadonlyMap<string, string>): string {
  // The first recording is named as such
  if (session.isBaseline) return "Your first recording";
  // Look up the prompt, falling back to a plain label
  const text = findPrompt(session.promptId)?.text ?? "A prompt";
  // Mark warm-ups so they read differently from full sessions
  if (session.mode === "warmup") return `Warm-up: ${text}`;
  // Mark Table Topics the same way
  if (session.mode === "talk") return `Table Topic: ${text}`;
  // And readings, by their title (a part of a full speech says which part)
  if (session.mode === "read") return `Read aloud: ${findReading(session.promptId)?.title ?? text}`;
  // And pause drills
  if (session.mode === "pause") return `Pause drill: ${text}`;
  // And Q&A answers, by their question
  if (session.mode === "qa") return `Q&A: ${session.question ?? "a question"}`;
  // And openings and closings drills
  if (session.mode === "bookend") return `${BOOKENDS.find((item) => item.id === session.promptId)?.part === "close" ? "Closing" : "Opening"} drill: ${text}`;
  // And lessons, with their number
  if (session.mode === "lesson") {
    // The lesson
    const lesson = findLesson(session.promptId);
    // Its number and title, or a plain label
    return lesson ? `Lesson ${lesson.number}: ${lesson.title}` : "Lesson";
  }
  // And rehearsals, named after the talk (or plainly, if the talk was deleted)
  if (session.mode === "rehearse") return talkTitles.has(session.promptId) ? `Rehearsal: ${talkTitles.get(session.promptId)}` : "Rehearsal";
  // And small-talk answers, by their question
  if (session.mode === "smalltalk") {
    // What was said, and its unit
    const found = findSmallTalk(session.promptId);
    // Asking and listening say which, with a story cut short
    return found?.unit === "asking" ? `Follow-up: ${found.question}` : found?.unit === "listening" ? `Listening: ${shorten(found.question)}` : `Small talk: ${found?.question ?? text}`;
  }
  // And prepared speeches
  return session.mode === "response" ? `Prepared speech: ${text}` : text;
}

// One line of the contents: day, prompt, dotted leader, result
function Row({ row, now, talkTitles }: { row: HistoryRow; now: Date; talkTitles: ReadonlyMap<string, string> }) {
  // First try's rate, and the retry's if there was one
  const result = row.retry ? `${formatRate(row.session.fillersPerMinute)}, then ${formatRate(row.retry.fillersPerMinute)}` : formatRate(row.session.fillersPerMinute);
  // A link to the session, laid out as a baseline-aligned row
  return (
    <li>
      <Link href={`/sessions?id=${row.session.id}`} className="flex min-h-11 items-baseline gap-3 py-3 hover:text-accent">
        {/* Day in italic, fixed width so prompts line up */}
        <span className="w-20 flex-none italic text-ink-muted max-md:w-16">{dayLabel(new Date(row.session.createdAt), now)}</span>
        {/* The prompt: wraps on a phone, cut short on a computer where the leader takes the space */}
        <span className="min-w-0 flex-1 md:flex-none md:truncate">{promptText(row.session, talkTitles)}</span>
        {/* Dotted leader, on a computer only */}
        <span className="hidden min-w-6 flex-1 border-b border-dotted border-ink-muted md:block" />
        {/* The result */}
        <span className="flex-none">{result}</span>
      </Link>
    </li>
  );
}

// Draw the History screen
export function HistoryScreen(props: ScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // Saved sessions, once loaded
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  // Titles of the user's saved talks, by id, for naming rehearsals
  const [talkTitles, setTalkTitles] = useState<ReadonlyMap<string, string>>(new Map());

  // Load the sessions once the date is known
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Load and keep the sessions
    repo.listSessions().then((loaded) => {
      // Keep the speech practice only, if the screen is still open (small-talk answers are listed on their own page)
      if (!cancelled) setSessions(practiceSessions(loaded));
    });
    // Load the talk titles too
    repo.listTalks().then((talks) => {
      // Keep them only if the screen is still open
      if (!cancelled) setTalkTitles(new Map(talks.map((talk) => [talk.id, talk.title])));
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today]);

  // Work out progress, the trend, and the rows
  const progress = sessions ? baselineProgress(sessions) : null;
  // Trend values
  const trend = sessions ? trendSeries(sessions) : [];
  // List rows
  const rows = sessions ? historyRows(sessions) : [];
  // The first recording, for the listen link
  const baseline = sessions?.find((session) => session.isBaseline);

  // Draw the page
  return (
    // One column on a phone, margin plus main column on a computer
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col bg-paper-raised px-6 pt-6 pb-10 md:px-14 md:pt-10">
      {/* Title and a link home */}
      <Masthead title="History" section="history" />

      {/* Empty state */}
      {sessions && sessions.length === 0 && (
        <div className="mt-6">
          {/* What will appear */}
          <p className="text-lede text-ink-muted">Nothing here yet. Your first recording will start the page.</p>
          {/* The one thing to do */}
          <p className="mt-5"><PrimaryLink href="/">Record your first session</PrimaryLink></p>
        </div>
      )}

      {/* Progress and sessions */}
      {sessions && sessions.length > 0 && today && (
        <div className="md:grid md:grid-cols-[280px_1fr] md:gap-14 md:pt-8">
          {/* Progress (top on a phone, margin on a computer) */}
          <aside className="mt-5 md:mt-0">
            {/* Progress as one sentence, or a note that there is only one recording so far */}
            <p className="font-display text-cue">{progress ? progressSentence(progress) : "Your first recording is in. Progress shows from your second."}</p>
            {/* The trend, once there are two first tries */}
            {trend.length >= 2 && <Trend values={trend} />}
            {/* Listen to the first recording, if its audio is kept */}
            {baseline?.audioKey && (
              <p className="mt-6 border-t border-rule pt-3 text-footnote">
                <Link href={`/sessions?id=${baseline.id}`} className="inline-flex min-h-11 items-center underline underline-offset-4">Listen to your first recording.</Link>
              </p>
            )}
          </aside>
          {/* The contents list */}
          <ul className="mt-6 border-t border-ink pt-2 text-lede md:mt-0 md:border-t-0 md:pt-0">
            {/* One row per first try, newest first */}
            {rows.map((row) => <Row key={row.session.id} row={row} now={today} talkTitles={talkTitles} />)}
          </ul>
        </div>
      )}
    </main>
  );
}

// A story's first few words, for a one-line label
function shorten(story: string): string {
  // The words
  const words = story.split(/\s+/);
  // The first eight, with an ellipsis when cut
  return words.length > 8 ? `${words.slice(0, 8).join(" ")}…` : story;
}
