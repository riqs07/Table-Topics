"use client";
// One saved session: the Feedback screen for a first try, or the Retry result screen for a retry

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { Footnote } from "@/components/script/Footnote";
import { Masthead } from "@/components/script/Masthead";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the sentence helpers
import { dayLabel, formatRate } from "@/core/copy";
// Load the filler marker
import { markFillers } from "@/core/fillers";
// Load the retry comparison
import { retryComparison } from "@/core/progress";
// Load the daily prompt picker, for the step after a warm-up
import { promptForDay } from "@/content/prompts";
// Load the session record type
import type { SessionRecord } from "@/data/records";

// What the screen needs: which session, plus the shared props
interface SessionScreenProps extends ScreenProps {
  // Id of the session to show
  sessionId: string;
}

// What was loaded: the session (or null if missing) and, for a retry, its first try
interface Loaded {
  // The session, or null if it is not on this device
  session: SessionRecord | null;
  // The first try, when the session is a retry
  original: SessionRecord | null;
}

// The transcript with fillers marked quietly
function Transcript({ text }: { text: string }) {
  // Draw each piece, marking fillers
  return (
    <p className="text-running">
      {/* One span per piece */}
      {markFillers(text).map((piece, index) =>
        // Fillers in the quiet filler style, everything else plain
        piece.filler ? <span key={index} className="text-filler underline decoration-dotted underline-offset-4">{piece.text}</span> : <span key={index}>{piece.text}</span>,
      )}
    </p>
  );
}

// The Feedback screen for a first try or a warm-up
function FeedbackView({ session, now }: { session: SessionRecord; now: Date }) {
  // Whether this was a warm-up (it leads into the full minute instead of a retry)
  const warmup = session.mode === "warmup";
  // Whether the transcript is open on a phone (it is always shown on a computer)
  const [showTranscript, setShowTranscript] = useState(false);
  // Draw the page
  return (
    <>
      {/* Title and the secondary number */}
      <Masthead title={warmup ? "Warm-up" : "Your take"}>{Math.round(session.wordsPerMinute)} words a minute</Masthead>
      {/* Notes column and transcript column on a computer */}
      <div className="flex flex-1 flex-col md:grid md:grid-cols-[1fr_320px] md:gap-14 md:pt-8">
        {/* The transcript (main column on a computer, opened on demand on a phone) */}
        <div className={`${showTranscript ? "mt-6" : "hidden"} md:order-1 md:mt-0 md:block`}>
          {/* Small heading */}
          <p className="italic text-ink-muted">What you said</p>
          {/* The words */}
          <div className="mt-3 max-w-[46ch]"><Transcript text={session.transcript} /></div>
        </div>
        {/* The notes (first on a phone, margin on a computer) */}
        <aside className="order-first flex flex-1 flex-col md:order-2">
          {/* The focus number as a sentence */}
          <p className="mt-5 font-display text-3xl md:mt-0">{formatRate(session.fillersPerMinute)} fillers a minute.</p>
          {/* Feedback, or a note that it has not arrived */}
          {session.feedback ? (
            <>
              {/* What to keep */}
              <p className="mt-5 text-lede"><em>What to keep.</em> <span>{session.feedback.keep}</span></p>
              {/* One change, with the accent rule in the margin */}
              <p className="-ml-4 mt-4 border-l-2 border-accent pl-[14px] text-lede"><em>One change.</em> <span>{session.feedback.change}</span></p>
              {/* The cue, as a pull quote */}
              <div className="mt-6 border-y border-ink py-4">
                {/* Small heading */}
                <p className="text-footnote italic text-ink-muted">Before you try again</p>
                {/* The cue */}
                <p className="mt-1 font-display text-cue">{session.feedback.retryCue}</p>
              </div>
            </>
          ) : (
            // Feedback has not come back yet
            <p className="mt-5 text-lede text-ink-muted">Feedback is on its way. It appears here once it arrives; your session is saved.</p>
          )}
          {/* Push the footer down */}
          <div className="flex-1" />
          {/* Quieter options */}
          <Footnote>
            {/* Open the transcript on a phone */}
            <button type="button" onClick={() => setShowTranscript(!showTranscript)} className="underline underline-offset-4 md:hidden">
              {showTranscript ? "Hide what I said" : "Read what I said"}
            </button>
            {/* Separator on a phone */}
            <span className="md:hidden">·</span>
            {/* Finish */}
            <Link href="/" className="italic text-ink-muted underline underline-offset-4">or finish for today</Link>
          </Footnote>
          {/* After a warm-up, the full minute; after a full session, the retry */}
          {warmup ? (
            <ActionBand action="Now the full minute" aside="today’s prompt" href={`/session?prompt=${promptForDay(now).id}`} />
          ) : (
            <ActionBand action="Try it again" aside="same prompt" href={`/session?prompt=${session.promptId}&retryOf=${session.id}`} />
          )}
        </aside>
      </div>
    </>
  );
}

// The headline sentence for a retry
function retryHeadline(retry: SessionRecord, original: SessionRecord): string {
  // Compare the two tries
  const comparison = retryComparison(retry, original);
  // Too close to call: say it held
  if (comparison.same) return `Again about ${formatRate(comparison.after)} fillers a minute.`;
  // Otherwise state both numbers plainly
  return `From ${formatRate(comparison.before)} to ${formatRate(comparison.after)} fillers a minute.`;
}

// The Retry result screen
function RetryView({ retry, original, now }: { retry: SessionRecord; original: SessionRecord; now: Date }) {
  // Draw the page
  return (
    <>
      {/* Title and day */}
      <Masthead title="Second try">{dayLabel(new Date(retry.createdAt), now)}</Masthead>
      {/* Margin and main column on a computer */}
      <div className="flex flex-1 flex-col md:grid md:grid-cols-[240px_1fr] md:gap-14 md:pt-8">
        {/* Both tries, in the margin on a computer (the headline already says both numbers on a phone) */}
        <aside className="hidden text-footnote text-ink-muted md:block">
          {/* First try */}
          <p><em>First try.</em> {formatRate(original.fillersPerMinute)} fillers a minute.</p>
          {/* Second try */}
          <p className="mt-3 border-t border-rule pt-3"><em className="text-ink">Second try.</em> {formatRate(retry.fillersPerMinute)} fillers a minute.</p>
        </aside>
        {/* Main column */}
        <div className="flex flex-1 flex-col">
          {/* The change as one sentence */}
          <h1 className="mt-6 font-display text-statement tracking-tight md:mt-0 md:max-w-[18ch] md:text-statement-xl">{retryHeadline(retry, original)}</h1>
          {/* The coach's notes on the retry */}
          {retry.feedback && <p className="mt-5 max-w-[48ch] text-lede">{retry.feedback.keep} {retry.feedback.change}</p>}
          {/* Push the action down */}
          <div className="flex-1" />
          {/* Finish */}
          <div className="mt-8"><ActionBand action="Finish" aside="saved" href="/" /></div>
        </div>
      </div>
    </>
  );
}

// Draw the session page
export function SessionScreen({ sessionId, ...props }: SessionScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // What was loaded
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  // Load the session (and its first try, for a retry) once the date is known
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Load the session and, if it is a retry, its first try
    (async () => {
      // Read the session
      const session = (await repo.getSession(sessionId)) ?? null;
      // Read the first try if this is a retry
      const original = session?.retryOf ? ((await repo.getSession(session.retryOf)) ?? null) : null;
      // Keep the result if the screen is still open
      if (!cancelled) setLoaded({ session, original });
    })();
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today, sessionId]);

  // Draw the page
  return (
    // One column on a phone, two on a computer
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Nothing yet while loading */}
      {loaded && !loaded.session && (
        <>
          {/* Title */}
          <Masthead title="Session" />
          {/* Explanation and a way back */}
          <p className="mt-6 text-lede text-ink-muted">This session is not on this device. <Link href="/history" className="underline underline-offset-4">Back to history</Link></p>
        </>
      )}
      {/* A retry with its first try */}
      {loaded?.session && loaded.original && today && <RetryView retry={loaded.session} original={loaded.original} now={today} />}
      {/* A first try (or a retry whose first try is missing) */}
      {loaded?.session && !loaded.original && today && <FeedbackView session={loaded.session} now={today} />}
    </main>
  );
}
