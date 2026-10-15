"use client";
// One saved session: the Feedback screen for a first try, or the Retry result screen for a retry

// Load React's state and effect tools
import { useEffect, useRef, useState } from "react";
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
// Load the then-and-now helpers
import { earlierTake, practiceDay } from "@/core/compare";
// Load the pause finder
import { findPauses, pauseDrillSentence, pauseSentence } from "@/core/pauses";
// Load the reading check
import { alignReading, countPauseMarks, type ReadingCheck } from "@/core/readAlong";
// Load the Table Topics timing sentence
import { LOUDNESS_TICK_MS, timingSentence } from "@/core/recordingRules";
// Load the focus-based headlines and numbers
import { headlineFor, measureFor, retryHeadline } from "@/core/focusMeasure";
// Load the daily prompt picker, for the step after a warm-up
import { findPassage, promptForDay } from "@/content/prompts";
// Load the session record type
import type { SessionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load the feedback requester and its outcomes
import { requestFeedback, type FeedbackOutcome } from "@/data/feedbackClient";
// Load the saved passphrase
import { readPassphrase } from "@/data/passphrase";

// What the screen needs: which session, plus the shared props
interface SessionScreenProps extends ScreenProps {
  // Id of the session to show
  sessionId: string;
  // Network function for asking the coach (replaced in tests)
  fetchFn?: typeof fetch;
}

// What to say while feedback is being asked for, or why it has not come
const FEEDBACK_NOTES: Record<FeedbackOutcome | "asking", string> = {
  // Request under way
  asking: "Asking the coach…",
  // Arrived (not shown; the feedback replaces the note)
  done: "",
  // No passphrase saved, or a wrong one
  "needs-passphrase": "Add your passphrase in Settings to get feedback. Your session is saved.",
  // Server missing a setting
  "not-set-up": "The server is missing a setting, so feedback is paused. Your session is saved.",
  // Offline or busy
  "retry-later": "The coach could not be reached. Feedback will arrive when you are back online; your session is saved.",
  // Declined
  declined: "The coach could not review this session.",
  // Refused as invalid
  invalid: "The coach could not review this session.",
};

// What was loaded: the session (or null if missing) and, for a retry, its first try
interface Loaded {
  // The session, or null if it is not on this device
  session: SessionRecord | null;
  // The first try, when the session is a retry
  original: SessionRecord | null;
  // An earlier day's recording of the same prompt, with both practice day numbers, for "then and now"
  earlier: { then: SessionRecord; thenDay: number; nowDay: number } | null;
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

// Load a session's saved audio and make a temporary address for it (null while loading or if the audio is gone)
function useAudioUrl(repo: Repository, audioKey: string | null): string | null {
  // Temporary address of the audio in this browser
  const [url, setUrl] = useState<string | null>(null);

  // Load the audio and make an address for it; release it when leaving
  useEffect(() => {
    // Nothing to load if the audio was pruned
    if (!audioKey) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // The address made, so it can be released
    let made: string | null = null;
    // Read the audio
    repo.getAudio(audioKey).then((audio) => {
      // Stop if the screen closed or the audio is missing
      if (cancelled || !audio) return;
      // Make the address
      made = URL.createObjectURL(audio);
      // Show the player
      setUrl(made);
    });
    // Release the address when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
      // Free the memory behind the address
      if (made) URL.revokeObjectURL(made);
    };
  }, [repo, audioKey]);

  // Hand back the address
  return url;
}

// A player for a session's saved audio (draws nothing if the audio is gone)
function Playback({ repo, session }: { repo: Repository; session: SessionRecord }) {
  // The audio's address
  const url = useAudioUrl(repo, session.audioKey);
  // Nothing to play
  if (!url) return null;
  // The player, with a note when this is the baseline
  return (
    <div className="mt-5">
      {/* Small heading */}
      <p className="text-footnote italic text-ink-muted">{session.isBaseline ? "Your first recording, the one progress is measured against" : "Listen back"}</p>
      {/* The browser's own audio player */}
      <audio controls src={url} aria-label="Your recording" className="mt-2 w-full" />
    </div>
  );
}

// One line of numbers for a take, such as "Day 1: 4.2 fillers a minute, 172 words a minute."
function takeNumbers(day: number, session: SessionRecord): string {
  // Day, filler rate, and speed
  return `Day ${day}: ${formatRate(session.fillersPerMinute)} fillers a minute, ${Math.round(session.wordsPerMinute)} words a minute.`;
}

// Then and now: an earlier day's recording of the same prompt beside this one, with a button to hear them in turn
function ThenAndNow({ repo, then, now, thenDay, nowDay }: { repo: Repository; then: SessionRecord; now: SessionRecord; thenDay: number; nowDay: number }) {
  // The earlier audio's address
  const thenUrl = useAudioUrl(repo, then.audioKey);
  // This session's audio address
  const nowUrl = useAudioUrl(repo, now.audioKey);
  // The earlier player
  const thenPlayer = useRef<HTMLAudioElement>(null);
  // This session's player
  const nowPlayer = useRef<HTMLAudioElement>(null);

  // Play the earlier take, then this one when it ends
  function playBoth() {
    // Both players are needed
    const first = thenPlayer.current;
    // (and the second)
    const second = nowPlayer.current;
    // Nothing to do without both
    if (!first || !second) return;
    // Start the second when the first finishes
    first.onended = () => {
      // Only once
      first.onended = null;
      // Play from the start
      second.currentTime = 0;
      // Start it (the browser may refuse without a click, which is fine)
      void second.play().catch(() => {});
    };
    // Play the first from the start
    first.currentTime = 0;
    // Start it
    void first.play().catch(() => {});
  }

  // Draw both takes
  return (
    <div className="mt-5 border-y border-rule py-4">
      {/* Small heading */}
      <p className="text-footnote italic text-ink-muted">Then and now, same prompt</p>
      {/* The earlier take */}
      <p className="mt-3 text-footnote">{takeNumbers(thenDay, then)}</p>
      {/* Its player, if the audio is still on this device */}
      {thenUrl && <audio ref={thenPlayer} controls src={thenUrl} aria-label={`Your recording from day ${thenDay}`} className="mt-1 w-full" />}
      {/* This take */}
      <p className="mt-3 text-footnote">{takeNumbers(nowDay, now)}</p>
      {/* Its player */}
      {nowUrl && <audio ref={nowPlayer} controls src={nowUrl} aria-label={`Your recording from day ${nowDay}`} className="mt-1 w-full" />}
      {/* Hear both in turn */}
      {thenUrl && nowUrl && (
        <button type="button" onClick={playBoth} className="mt-3 italic underline underline-offset-4">
          Play both, then and now
        </button>
      )}
    </div>
  );
}

// A read-aloud passage with each word marked as heard or not
function MarkedPassage({ check }: { check: ReadingCheck }) {
  // Words in order, separated by spaces; unheard words struck through in the quiet filler color
  return (
    <p className="text-running">
      {/* One span per word */}
      {check.words.map((word, index) => (
        // A single word
        <span key={index}>
          {/* The word, marked */}
          <span data-read={word.read ? "true" : "false"} className={word.read ? "" : "text-filler line-through decoration-1"}>{word.text}</span>
          {/* The space after it */}
          {" "}
        </span>
      ))}
    </p>
  );
}

// The secondary number shown under the title: whichever the headline does not already say
function sideNumber(session: SessionRecord): string {
  // In pace week the headline says the speed, so show the fillers
  if (measureFor(session.focus)?.unit === "words a minute") return `${formatRate(session.fillersPerMinute)} fillers a minute`;
  // Otherwise show the speed
  return `${Math.round(session.wordsPerMinute)} words a minute`;
}

// The Feedback screen for a first try or a warm-up
function FeedbackView({ repo, session, now, note, earlier }: { repo: Repository; session: SessionRecord; now: Date; note: string; earlier: Loaded["earlier"] }) {
  // The passage, for a read-aloud session
  const passage = session.mode === "read" || session.mode === "pause" ? findPassage(session.promptId) : undefined;
  // The pauses, when loudness was recorded
  const pauses = session.loudness && session.loudness.length > 0 ? findPauses(session.loudness, LOUDNESS_TICK_MS) : null;
  // How much of the passage was heard
  const reading = passage ? alignReading(passage.body, session.transcript) : null;
  // Whether this was an old warm-up (it leads into a Record Response instead of a retry)
  const warmup = session.mode === "warmup";
  // Whether this was a Table Topic
  const talk = session.mode === "talk";
  // Whether this kind of session has a timing line and a retry of the same kind (Table Topic or Record Response)
  const timed = talk || session.mode === "response";
  // Whether the transcript is open on a phone (it is always shown on a computer)
  const [showTranscript, setShowTranscript] = useState(false);
  // Draw the page
  return (
    <>
      {/* Title and the secondary number */}
      <Masthead title={warmup ? "Warm-up" : talk ? "Table Topic" : session.mode === "pause" ? "Pause drill" : reading ? "Read aloud" : timed ? "Your response" : "Your take"}>{sideNumber(session)}</Masthead>
      {/* Notes column and transcript column on a computer */}
      <div className="flex flex-1 flex-col md:grid md:grid-cols-[1fr_320px] md:gap-14 md:pt-8">
        {/* The transcript (main column on a computer, opened on demand on a phone) */}
        <div className={`${showTranscript ? "mt-6" : "hidden"} md:order-1 md:mt-0 md:block`}>
          {/* Small heading */}
          <p className="italic text-ink-muted">{passage ? `${passage.title}, as heard` : "What you said"}</p>
          {/* The words: the passage marked for a reading, otherwise the transcript */}
          <div className="mt-3 max-w-[46ch]">{reading ? <MarkedPassage check={reading} /> : <Transcript text={session.transcript} />}</div>
          {/* For a reading, what the marks mean */}
          {reading && <p className="mt-3 max-w-[46ch] text-footnote italic text-ink-muted">Struck-through words were not heard. Some may be the speech service mishearing you rather than a skipped word.</p>}
        </div>
        {/* The notes (first on a phone, margin on a computer) */}
        <aside className="order-first flex flex-1 flex-col md:order-2">
          {/* The focus number as a sentence (or the focus's name when no number measures it) */}
          {reading ? (
            <>
              {/* How much of the passage was read */}
              <p data-testid="reading-headline" className="mt-5 font-display text-3xl md:mt-0">{session.mode === "pause" && passage ? (pauses ? pauseDrillSentence(pauses.count, countPauseMarks(passage.body)) : `The passage has ${countPauseMarks(passage.body)} pause marks.`) : `You read ${reading.percentRead}% of the words.`}</p>
              {/* The detail */}
              <p className="mt-2 text-footnote italic text-ink-muted">{session.mode === "pause" ? `You read ${reading.percentRead}% of the words; ` : ""}{reading.missed} not heard, {reading.repeated} repeated, {reading.extra} extra (fillers and added words).</p>
            </>
          ) : (
            // The focus number as a sentence
            <p className="mt-5 font-display text-3xl md:mt-0">{headlineFor(session)}</p>
          )}
          {/* When there is no number, say why */}
          {!reading && !measureFor(session.focus) && <p className="mt-2 text-footnote italic text-ink-muted">No number measures this from a transcript; the notes are what count.</p>}
          {/* How the pauses went, when loudness was recorded */}
          {pauses && <p className="mt-2 text-footnote italic text-ink-muted">{pauseSentence(pauses)}</p>}
          {/* After a Table Topic or Record Response, how the timing went */}
          {timed && <p className="mt-2 text-footnote italic text-ink-muted">{timingSentence(session.mode, session.durationSec)}</p>}
          {/* Listen back */}
          {earlier ? <ThenAndNow repo={repo} then={earlier.then} now={session} thenDay={earlier.thenDay} nowDay={earlier.nowDay} /> : <Playback repo={repo} session={session} />}
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
                <p className="text-footnote italic text-ink-muted">{warmup ? "Before your response" : "Before you try again"}</p>
                {/* The cue */}
                <p className="mt-1 font-display text-cue">{session.feedback.retryCue}</p>
              </div>
            </>
          ) : (
            // Feedback has not come back yet
            <p className="mt-5 text-lede text-ink-muted">{note || "Feedback is on its way. It appears here once it arrives; your session is saved."}</p>
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
          {/* After an old warm-up, a Record Response; otherwise the retry */}
          {warmup ? (
            <ActionBand action="Now record a response" aside="today’s prompt" href={`/session?mode=response&prompt=${promptForDay(now).id}`} />
          ) : (
            <ActionBand action="Try it again" aside="same prompt" href={`/session?${timed || reading ? `mode=${session.mode}&` : ""}prompt=${session.promptId}&retryOf=${session.id}`} />
          )}
        </aside>
      </div>
    </>
  );
}

// The Retry result screen
function RetryView({ repo, retry, original, now }: { repo: Repository; retry: SessionRecord; original: SessionRecord; now: Date }) {
  // The number for the focus, or the filler rate when the focus has none
  const measure = measureFor(original.focus) ?? measureFor("cut-fillers");
  // Write one try's number with its unit
  const numberOf = (session: SessionRecord) => (measure ? `${measure.format(measure.read(session))} ${measure.unit}.` : "");
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
          <p><em>First try.</em> {numberOf(original)}</p>
          {/* Second try */}
          <p className="mt-3 border-t border-rule pt-3"><em className="text-ink">Second try.</em> {numberOf(retry)}</p>
        </aside>
        {/* Main column */}
        <div className="flex flex-1 flex-col">
          {/* The change as one sentence */}
          <h1 className="mt-6 font-display text-statement tracking-tight md:mt-0 md:max-w-[18ch] md:text-statement-xl">{retryHeadline(retry, original)}</h1>
          {/* The coach's notes on the retry */}
          {retry.feedback && <p className="mt-5 max-w-[48ch] text-lede">{retry.feedback.keep} {retry.feedback.change}</p>}
          {/* Listen back to the second try */}
          <div className="max-w-[48ch]"><Playback repo={repo} session={retry} /></div>
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
export function SessionScreen({ sessionId, fetchFn, ...props }: SessionScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // What was loaded
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // A note about feedback being asked for, or why it has not come
  const [note, setNote] = useState("");

  // Load the session (and its first try, for a retry) once the date is known
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Read the session and, if it is a retry, its first try
    const load = async (): Promise<Loaded> => {
      // Read the session
      const session = (await repo.getSession(sessionId)) ?? null;
      // Read the first try if this is a retry
      const original = session?.retryOf ? ((await repo.getSession(session.retryOf)) ?? null) : null;
      // Every session, to find an earlier take of the same prompt
      const all = session ? await repo.listSessions() : [];
      // The first earlier day's recording of this prompt
      const then = session ? earlierTake(all, session) : null;
      // With its practice day number and this session's
      const earlier = session && then ? { then, thenDay: practiceDay(all, new Date(then.createdAt)), nowDay: practiceDay(all, new Date(session.createdAt)) } : null;
      // Hand them back
      return { session, original, earlier };
    };
    // Load, then ask the coach if feedback is still waiting
    (async () => {
      // Load the session
      const first = await load();
      // Show it if the screen is still open
      if (cancelled) return;
      // Show what was loaded
      setLoaded(first);
      // Nothing more to do unless feedback is waiting
      if (first.session?.feedbackStatus !== "pending") return;
      // Say the coach is being asked
      setNote(FEEDBACK_NOTES.asking);
      // Ask the coach
      const outcome = await requestFeedback(repo, sessionId, { passphrase: readPassphrase(), ...(fetchFn ? { fetchFn } : {}) });
      // Stop if the screen closed meanwhile
      if (cancelled) return;
      // Say how it went
      setNote(FEEDBACK_NOTES[outcome]);
      // Reload to show the feedback (or the new status)
      setLoaded(await load());
    })();
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today, sessionId, fetchFn]);

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
      {loaded?.session && loaded.original && today && <RetryView repo={repo} retry={loaded.session} original={loaded.original} now={today} />}
      {/* A first try (or a retry whose first try is missing) */}
      {loaded?.session && !loaded.original && today && <FeedbackView repo={repo} session={loaded.session} now={today} note={note} earlier={loaded.earlier} />}
    </main>
  );
}
