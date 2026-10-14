"use client";
// The History screen: progress since the first recording, one trend line, and every session like a contents page

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the prompt library
import { findPrompt } from "@/content/prompts";
// Load the sentence builders
import { dayLabel, formatRate, progressSentence } from "@/core/copy";
// Load the progress calculations
import { baselineProgress, historyRows, trendSeries, type HistoryRow } from "@/core/progress";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// Size of the trend drawing (it stretches to fit its column)
const CHART = { width: 300, height: 80 };

// The trend line of fillers per minute, with a dotted guide at the first value
function Trend({ values }: { values: number[] }) {
  // Highest value, for scaling
  const top = Math.max(...values);
  // Vertical position of a value
  const y = (value: number) => CHART.height - (top === 0 ? 0 : (value / top) * (CHART.height - 8));
  // The line's points
  const points = values.map((value, index) => `${(index / (values.length - 1)) * CHART.width},${y(value)}`).join(" ");
  // Draw it in the accent color
  return (
    <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} preserveAspectRatio="none" className="mt-5 h-20 w-full text-accent" role="img" aria-label={`Fillers per minute, from ${formatRate(values[0] ?? 0)} to ${formatRate(values.at(-1) ?? 0)}`}>
      {/* Dotted guide at the first recording's value */}
      <line x1="0" x2={CHART.width} y1={y(values[0] ?? 0)} y2={y(values[0] ?? 0)} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
      {/* The trend line */}
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// Find a prompt's text by id
function promptText(session: SessionRecord): string {
  // The first recording is named as such
  if (session.isBaseline) return "Your first recording";
  // Look up the prompt, falling back to a plain label
  const text = findPrompt(session.promptId)?.text ?? "A prompt";
  // Mark warm-ups so they read differently from full sessions
  if (session.mode === "warmup") return `Warm-up: ${text}`;
  // Mark three-minute talks the same way
  return session.mode === "talk" ? `Three-minute talk: ${text}` : text;
}

// One line of the contents: day, prompt, dotted leader, result
function Row({ row, now }: { row: HistoryRow; now: Date }) {
  // First try's rate, and the retry's if there was one
  const result = row.retry ? `${formatRate(row.session.fillersPerMinute)}, then ${formatRate(row.retry.fillersPerMinute)}` : formatRate(row.session.fillersPerMinute);
  // A link to the session, laid out as a baseline-aligned row
  return (
    <li>
      <Link href={`/sessions?id=${row.session.id}`} className="flex items-baseline gap-3 py-2 hover:text-accent">
        {/* Day in italic, fixed width so prompts line up */}
        <span className="w-20 flex-none italic text-ink-muted max-md:w-16">{dayLabel(new Date(row.session.createdAt), now)}</span>
        {/* The prompt: wraps on a phone, cut short on a computer where the leader takes the space */}
        <span className="min-w-0 flex-1 md:flex-none md:truncate">{promptText(row.session)}</span>
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

  // Load the sessions once the date is known
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Load and keep the sessions
    repo.listSessions().then((loaded) => {
      // Keep them only if the screen is still open
      if (!cancelled) setSessions(loaded);
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
      <Masthead title="History">
        <Link href="/" className="hover:underline">Back to the prompt</Link>
      </Masthead>

      {/* Empty state */}
      {sessions && sessions.length === 0 && <p className="mt-6 text-lede text-ink-muted">Nothing here yet. Your first recording will start the page.</p>}

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
                <Link href={`/sessions?id=${baseline.id}`} className="underline underline-offset-4">Listen to your first recording.</Link>
              </p>
            )}
          </aside>
          {/* The contents list */}
          <ul className="mt-6 border-t border-ink pt-2 text-lede md:mt-0 md:border-t-0 md:pt-0">
            {/* One row per first try, newest first */}
            {rows.map((row) => <Row key={row.session.id} row={row} now={today} />)}
          </ul>
        </div>
      )}
    </main>
  );
}
