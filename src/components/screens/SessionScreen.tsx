"use client";
// One saved session: the Feedback screen for a first try, or the Retry result screen for a retry

// Load React's state and effect tools
import { useEffect, useRef, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { RowButton, RowLink } from "@/components/script/Buttons";
import { Masthead } from "@/components/script/Masthead";
import { Player } from "@/components/script/Player";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the saved-audio loader
import { useAudioUrl } from "@/components/screens/useAudioUrl";
// Load today's practice, to find the next step
import { loadDailyPlan } from "@/data/dailyPlan";
// Load the plan's addresses
import { planHref } from "@/core/dailyPlan";
// Load the plan navigation type
import type { PlanNav } from "@/components/screens/planNav";
// Load the listen-back step
import { ReviewStep } from "@/components/screens/ReviewStep";
// Load the quick tags, for showing the user's notes
import { CHANGE_TAGS, WORKED_TAGS } from "@/core/selfReview";
// Load the small-talk beats and checks
import { ASKING_BEATS, BEATS, LISTENING_BEATS, NEWS_BEATS, beatsFor, findSmallTalk, findUnit, nextInUnit, type BeatId } from "@/content/smallTalk";
import { beatCount, beatFound, deadEndOpening, feelingWords, handBack, questionKind, reaction, sharedWords, theirFeelingWords } from "@/core/smallTalk";
// Load the tick
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the comparison of notes with the numbers
import { compareNotes } from "@/core/notesCheck";
// Load the sentence helpers
import { dayLabel, formatRate } from "@/core/copy";
// Load the findings from word times
import { marksPaused, marksSentence, paceAcross } from "@/core/wordTiming";
// Load the script splitter, to place the pause marks among the timed words
import { readingTokens } from "@/core/liveReading";
// Load the compact row of numbers
import { resultNumbers } from "@/core/resultNumbers";
// Load the filler marker
import { markFillers } from "@/core/fillers";
// Load the then-and-now helpers
import { earlierTake, practiceDay } from "@/core/compare";
// Load the pause finder
import { findPauses, pauseDrillSentence, pauseSentence } from "@/core/pauses";
// Load the reading check
import { alignReading, countPauseMarks, type ReadingCheck } from "@/core/readAlong";
// Load where each kind of session belongs
import { sessionHome } from "@/core/sessionHome";
// Load the change picked from the numbers, for when the coach has not answered
import { localChange } from "@/core/localChange";
// Load the section splitter, for rehearsals of one section
import { talkSections } from "@/core/eventPrep";
// Load the Table Topics timing sentence
import { LOUDNESS_TICK_MS, timingSentence } from "@/core/recordingRules";
// Load the focus-based headlines and numbers
import { headlineFor, measureFor, retryHeadline } from "@/core/focusMeasure";
// Load the daily prompt picker, for the step after a warm-up
import { BOOKENDS, promptForDay } from "@/content/prompts";
// Load the lookup for every text to read, full speeches included
import { findReading, partId, partOf } from "@/content/readings";
// Load the lesson lookup
import { findLesson } from "@/content/lessons";
// Load the lesson checks
import { lessonResult } from "@/core/lessonCheck";
// Load the openings and closings drill check
import { bookendResult } from "@/core/bookend";
// Load the session record type
import type { SessionRecord, TalkRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load the feedback requester and its outcomes
import { requestFeedbackDetail, type FeedbackOutcome } from "@/data/feedbackClient";
// Load the saved passphrase
import { readPassphrase } from "@/data/passphrase";

// What the screen needs: which session, plus the shared props
interface SessionScreenProps extends ScreenProps {
  // Id of the session to show
  sessionId: string;
  // Network function for asking the coach (replaced in tests)
  fetchFn?: typeof fetch;
  // Inside today's practice: which step this is (counted from 1), or null
  planStep?: number | null;
  // Where to go next (the router in the app)
  navigate?: (path: string) => void;
}

// What to say while feedback is being asked for, or why it has not come
const FEEDBACK_NOTES: Record<FeedbackOutcome | "asking", string> = {
  // Request under way
  asking: "Asking the coach…",
  // Arrived (not shown; the feedback replaces the note)
  done: "",
  // No passphrase saved, or a wrong one (nothing said: the change from the numbers stands in, and the coach is set up in Settings)
  "needs-passphrase": "",
  // Server missing a setting (likewise)
  "not-set-up": "",
  // Offline or busy
  "retry-later": "The coach could not be reached. Feedback will arrive when you are back online; your session is saved.",
  // Declined
  declined: "The coach could not review this session.",
  // Refused as invalid
  invalid: "The coach could not review this session.",
  // Waiting for the notes the coach may read
  "awaiting-notes": "The coach will read your notes once you save them.",
};

// What was loaded: the session (or null if missing) and, for a retry, its first try
interface Loaded {
  // The session, or null if it is not on this device
  session: SessionRecord | null;
  // The first try, when the session is a retry
  original: SessionRecord | null;
  // An earlier day's recording of the same prompt, with both practice day numbers, for "then and now"
  earlier: { then: SessionRecord; thenDay: number; nowDay: number } | null;
  // For a rehearsal, the talk it rehearsed (null if deleted or not a rehearsal)
  talk: TalkRecord | null;
  // For a Q&A answer, which of its session's questions it answered (null if that question has since been replaced)
  qaIndex: number | null;
}

// The transcript with fillers marked quietly
function Transcript({ text }: { text: string }) {
  // Draw each piece, marking fillers
  return (
    <p className="text-running">
      {/* One span per piece */}
      {markFillers(text).map((piece, index) =>
        // Fillers as a soft highlight (not an underline, which reads as a link), everything else plain
        piece.filler ? <mark key={index} className="bg-filler/15 px-0.5 text-filler">{piece.text}</mark> : <span key={index}>{piece.text}</span>,
      )}
    </p>
  );
}

// A player for a session's saved audio (draws nothing if the audio is gone)
function Playback({ repo, session }: { repo: Repository; session: SessionRecord }) {
  // The audio's address
  const url = useAudioUrl(repo, session.audioKey).url;
  // Nothing to play
  if (!url) return null;
  // The player, with a note when this is the baseline
  return (
    <div className="mt-5">
      {/* Small heading */}
      <p className="text-footnote italic text-ink-muted">{session.isBaseline ? "Your first recording, the one progress is measured against" : "Listen back"}</p>
      {/* The player */}
      <div className="mt-2"><Player src={url} label="Your recording" name="your recording" durationSec={session.durationSec} /></div>
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
  const thenUrl = useAudioUrl(repo, then.audioKey).url;
  // This session's audio address
  const nowUrl = useAudioUrl(repo, now.audioKey).url;
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
      {thenUrl && <div className="mt-1"><Player src={thenUrl} label={`Your recording from day ${thenDay}`} name={`day ${thenDay}`} durationSec={then.durationSec} onAudio={(element) => { thenPlayer.current = element; }} /></div>}
      {/* This take */}
      <p className="mt-3 text-footnote">{takeNumbers(nowDay, now)}</p>
      {/* Its player */}
      {nowUrl && <div className="mt-1"><Player src={nowUrl} label={`Your recording from day ${nowDay}`} name={`day ${nowDay}`} durationSec={now.durationSec} onAudio={(element) => { nowPlayer.current = element; }} /></div>}
      {/* Hear both in turn */}
      {thenUrl && nowUrl && (
        <button type="button" onClick={playBoth} className="inline-flex min-h-11 items-center mt-3 italic underline underline-offset-4">
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
          {/* The word, marked: struck through if not heard, only dimmed after where a reading stopped early */}
          {check.stoppedEarly && index >= check.readTo ? <span data-read="not-reached" className="text-ink-muted">{word.text}</span> : <span data-read={word.read ? "true" : "false"} className={word.read ? "" : "text-filler line-through decoration-1"}>{word.text}</span>}
          {/* The space after it */}
          {" "}
        </span>
      ))}
    </p>
  );
}

// The compact row of numbers: fillers, speed, length, and pauses when measured
function NumbersRow({ session, pauseCount }: { session: SessionRecord; pauseCount: number | null }) {
  // One cell per number, the number large and its words small beneath
  return (
    <section aria-label="Your numbers" className="mt-5 flex border-y border-rule py-3">
      {/* Each number */}
      {resultNumbers(session, pauseCount).map((item) => (
        // One cell
        <div key={item.label} className="min-w-0 flex-1">
          {/* The number */}
          <p className="font-display text-cue">{item.value}</p>
          {/* Its words */}
          <p className="text-footnote leading-tight text-ink-muted">{item.label}</p>
        </div>
      ))}
    </section>
  );
}

// The text a rehearsal was checked against: one section, or the whole talk
function rehearsedText(talk: TalkRecord, sectionIndex: number | null): { title: string; body: string } {
  // The talk's sections
  const sections = talkSections(talk.body);
  // One section, if it still exists
  const section = sectionIndex !== null ? sections[sectionIndex] : undefined;
  // The section with its place, or the whole talk
  return section !== undefined ? { title: `${talk.title} · section ${(sectionIndex ?? 0) + 1} of ${sections.length}`, body: section } : { title: talk.title, body: talk.body };
}

// The Feedback screen for a first try or a warm-up
function FeedbackView({ repo, session, now, note, earlier, rehearsed, qaIndex, onReviewed, plan, navigate }: { repo: Repository; session: SessionRecord; now: Date; note: string; earlier: Loaded["earlier"]; rehearsed: TalkRecord | null; qaIndex: number | null; onReviewed: (updated: SessionRecord) => void; plan: PlanNav | null; navigate?: (path: string) => void }) {
  // The lesson, on the skill path
  const lesson = session.mode === "lesson" ? findLesson(session.promptId) : undefined;
  // The text that was read or rehearsed: a passage, a lesson's practice text (without stress marks), or the user's talk
  const passage = session.mode === "read" || session.mode === "pause" ? findReading(session.promptId) : lesson ? { title: `Lesson ${lesson.number}: ${lesson.title}`, body: lesson.body.replace(/\*/g, "") } : rehearsed ? rehearsedText(rehearsed, session.sectionIndex ?? null) : undefined;
  // A lesson's own result
  const lessonOutcome = lesson ? lessonResult(lesson, session) : null;
  // The pauses, when loudness was recorded
  const pauses = session.loudness && session.loudness.length > 0 ? findPauses(session.loudness, LOUDNESS_TICK_MS) : null;
  // How much of the passage was heard
  const reading = passage ? alignReading(passage.body, session.transcript) : null;
  // How the pace changed from start to finish, when word times were saved
  const pace = session.spokenTimes ? paceAcross(session.spokenTimes) : null;
  // In a pause drill with word times, which marks had a pause
  const marks = session.mode === "pause" && passage && session.scriptTimes ? marksSentence(marksPaused(readingTokens(passage.body), session.scriptTimes)) : "";
  // Whether this was an old warm-up (it leads into a Record Response instead of a retry)
  const warmup = session.mode === "warmup";
  // Whether this was a Table Topic
  const talk = session.mode === "talk";
  // Whether this kind of session has a timing line and a retry of the same kind (Table Topic or Record Response)
  const timed = talk || session.mode === "response" || session.mode === "bookend" || session.mode === "qa" || session.mode === "smalltalk";
  // Whether this is a small-talk answer (notes by beat, kept apart from the speech practice)
  const smallTalk = session.mode === "smalltalk";
  // Whether it is a follow-up question or a reply to a story: a few seconds long, so a lighter result that moves on to the next one
  const quick = smallTalk && findSmallTalk(session.promptId)?.unit !== "answering";
  // The next one in its unit
  const next = quick ? nextInUnit(session.promptId) : null;
  // Whether this is an answer to an audience question
  const qa = session.mode === "qa";
  // Where "try it again" leads: the same question for a Q&A answer (or its list, if the question was replaced), otherwise the same prompt
  const retryHref = qa && qaIndex === null ? `/qa?from=${session.promptId}` : `/session?${timed || reading ? `mode=${session.mode}&` : ""}prompt=${session.promptId}${typeof session.sectionIndex === "number" ? `&section=${session.sectionIndex}` : ""}${qa ? `&question=${qaIndex}` : ""}&retryOf=${session.id}${plan ? `&plan=${plan.step}` : ""}`;
  // An openings and closings drill's prompt, and what it measured
  const bookend = session.mode === "bookend" ? BOOKENDS.find((item) => item.id === session.promptId) : undefined;
  // The drill's two findings
  const bookendOutcome = bookend ? bookendResult(bookend.part, session) : null;
  // Whether the transcript is open on a phone (it is always shown on a computer)
  const [showTranscript, setShowTranscript] = useState(false);
  // The page title for this kind of session
  const title = warmup ? "Warm-up" : talk ? "Table Topic" : qa ? "Q&A answer" : bookend ? (bookend.part === "opening" ? "Opening drill" : "Closing drill") : smallTalk ? "Small talk" : session.mode === "pause" ? "Pause drill" : session.mode === "rehearse" ? "Rehearsal" : lesson ? `Lesson ${lesson.number}: ${lesson.title}` : reading ? "Read aloud" : session.mode === "response" ? "Prepared speech" : timed ? "Your answer" : "Your take";
  // The user's notes, with their tags as words
  const review = session.selfReview && !session.selfReview.skipped ? session.selfReview : null;
  // The tag words
  const tagWords = review ? [...WORKED_TAGS, ...CHANGE_TAGS, ...[...BEATS, ...ASKING_BEATS, ...LISTENING_BEATS, ...NEWS_BEATS].map((beat) => ({ id: beat.id, label: beat.name }))].filter((tag) => review.tags.includes(tag.id)).map((tag) => tag.label.toLowerCase()) : [];
  // The notes against the numbers
  const checks = smallTalk ? [] : compareNotes(session);
  // One change picked from the numbers, shown until the coach's arrives
  const ownChange = localChange(session);
  // Where the session belongs
  const home = sessionHome(session.mode, session.promptId, plan !== null);
  // For one part of a full speech: the speech, and the part read
  const speechPart = session.mode === "read" ? partOf(session.promptId) : undefined;
  // A new first try asks the user to listen back and write notes before anything else
  if (session.selfReview === null) {
    // The listening step in place of the feedback
    return (
      <>
        {/* Title and day, and a way out instead of the tab bar (focus mode) */}
        <Masthead title={title} nav={false} close={home}>{plan ? <PlanNote plan={plan} /> : dayLabel(new Date(session.createdAt), now)}</Masthead>
        {/* Listen, write, continue */}
        <ReviewStep repo={repo} session={session} onSaved={onReviewed} plan={plan} retryHref={retryHref} navigate={navigate} />
      </>
    );
  }
  // Draw the page
  return (
    <>
      {/* Title and the secondary number; the tab bar marks where the session belongs (Today inside the plan) */}
      <Masthead title={title} section={home.section}>{plan ? <PlanNote plan={plan} /> : dayLabel(new Date(session.createdAt), now)}</Masthead>
      {/* Notes column and transcript column on a computer */}
      <div className="flex flex-1 flex-col md:grid md:grid-cols-[1fr_320px] md:gap-14 md:pt-8">
        {/* The transcript (main column on a computer, opened on demand on a phone) */}
        <div className={`${showTranscript ? "mt-6" : "hidden"} md:order-1 md:mt-0 md:block`}>
          {/* Small heading */}
          <p className="italic text-ink-muted">{passage ? `${passage.title}, as heard` : "What you said"}</p>
          {/* The words: the passage marked for a reading, otherwise the transcript */}
          <div className="mt-3 max-w-[46ch]">{reading ? <MarkedPassage check={reading} /> : <Transcript text={session.transcript} />}</div>
          {/* For a reading, what the marks mean */}
          {reading && <p className="mt-3 max-w-[46ch] text-footnote italic text-ink-muted">Struck-through words were not heard. Some may be the speech service mishearing you rather than a skipped word.{reading.stoppedEarly ? " Dimmed words come after where you stopped." : ""}</p>}
        </div>
        {/* The notes (first on a phone, margin on a computer) */}
        <aside className="order-first flex flex-1 flex-col md:order-2">
          {/* For a Q&A answer, the question it answered */}
          {qa && session.question && (
            <div className="mt-5 md:mt-0 md:mb-5">
              {/* Small heading */}
              <p className="text-footnote italic text-ink-muted">The question</p>
              {/* The question itself */}
              <p className="mt-1 font-display text-cue">{session.question}</p>
            </div>
          )}
          {/* The focus number as a sentence (or the focus's name when no number measures it) */}
          {reading ? (
            <>
              {/* How much of the passage was read */}
              <p data-testid="reading-headline" className="mt-5 font-display text-3xl md:mt-0">{lessonOutcome ? lessonOutcome.headline : session.mode === "pause" && passage ? (pauses ? pauseDrillSentence(pauses.count, countPauseMarks(passage.body)) : `The passage has ${countPauseMarks(passage.body)} pause marks.`) : session.mode === "rehearse" ? (reading.stoppedEarly ? `You covered the first ${reading.readTo} words of your script.` : `You covered ${reading.percentRead}% of your script.`) : reading.stoppedEarly ? `You read the first ${reading.readTo} words.` : `You read ${reading.percentRead}% of the words.`}</p>
              {/* The detail */}
              <p className="mt-2 text-footnote italic text-ink-muted">{session.mode === "pause" || (lesson && lesson.check !== "clear-words") ? (reading.stoppedEarly ? `You read the first ${reading.readTo} words; ` : `You read ${reading.percentRead}% of the words; `) : ""}{reading.stoppedEarly ? `${reading.missedWithin} not heard in that stretch` : `${reading.missed} not heard`}, {reading.repeated} repeated, {reading.extra} extra (fillers and added words).</p>
              {/* A lesson's tip, as a reminder */}
              {lesson && <p className="-ml-4 mt-4 border-l-2 border-accent pl-[14px] text-lede">Remember: {lesson.tip}</p>}
            </>
          ) : bookendOutcome ? (
            <>
              {/* The drill's main finding */}
              <p className="mt-5 font-display text-3xl md:mt-0">{bookendOutcome.headline}</p>
              {/* Its second finding */}
              <p className="mt-2 text-footnote italic text-ink-muted">{bookendOutcome.detail}</p>
            </>
          ) : smallTalk ? (
            // The beats: how many, then each with the words that showed it
            <SmallTalkBeats session={session} />
          ) : (
            // The focus number as a sentence
            <p className="mt-5 font-display text-3xl md:mt-0">{headlineFor(session)}</p>
          )}
          {/* The user's own notes, first */}
          {review && (review.worked || review.change || tagWords.length > 0) && (
            <div className="mt-5 border-y border-rule py-3 text-lede">
              {/* Small heading */}
              <p className="text-footnote italic text-ink-muted">Your notes</p>
              {/* What worked */}
              {review.worked && <p className="mt-1"><em>Worked.</em> {review.worked}</p>}
              {/* What to change */}
              {review.change && <p className="mt-1"><em>Change.</em> {review.change}</p>}
              {/* The tags */}
              {tagWords.length > 0 && <p className="mt-1 text-footnote text-ink-muted">{smallTalk ? "You heard" : "Tagged"}: {tagWords.join(", ")}.</p>}
              {/* The notes against the numbers */}
              {checks.length > 0 && (
                <ul aria-label="Your notes against the numbers" className="mt-2 text-footnote">
                  {/* Each comparison, marked by whether it matched */}
                  {checks.map((check) => (
                    // One comparison
                    <li key={check.text} data-kind={check.kind} className={`mt-1 border-l-2 pl-2 ${check.kind === "matched" ? "border-accent" : "border-rule text-ink-muted"}`}>{check.text}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {/* The next step: the one change and the cue, or a note that feedback has not arrived */}
          <div className="mt-5 border-l-4 border-accent bg-paper px-4 py-4">
            {/* Where it comes from, until the coach's note arrives */}
            {!session.feedback && <p className="mb-2 text-footnote italic text-ink-muted">From your numbers</p>}
            {/* One change */}
            <p className="text-lede"><em>One change.</em> <span>{(session.feedback ?? ownChange).change}</span></p>
            {/* Small heading for the cue */}
            <p className="mt-4 text-footnote italic text-ink-muted">{warmup ? "Before your response" : "Before you try again"}</p>
            {/* The cue */}
            <p className="mt-1 font-display text-cue">{(session.feedback ?? ownChange).retryCue}</p>
            {/* For a follow-up question or a reply to a story, a better one */}
            {session.feedback?.connection && (
              <>
                {/* Small heading */}
                <p className="mt-4 text-footnote italic text-ink-muted">{findSmallTalk(session.promptId)?.unit === "asking" ? "A better follow-up" : "A better response"}</p>
                {/* The better version */}
                <p className="mt-1 text-lede">{session.feedback.connection.better}</p>
              </>
            )}
            {/* For small talk, the answer as it could sound, using only what was said */}
            {session.feedback?.smallTalk && (
              <>
                {/* Small heading */}
                <p className="mt-4 text-footnote italic text-ink-muted">As it could sound (only what you said)</p>
                {/* The livelier version, gaps in brackets set apart */}
                <p className="mt-1 text-lede">{session.feedback.smallTalk.livelier.split(/(\[[^\]]+\])/).map((part, index) => (part.startsWith("[") ? <em key={index} className="text-accent">{part}</em> : <span key={index}>{part}</span>))}</p>
              </>
            )}
          </div>
          {/* While the coach's note is on its way, or why it will not come (never a setup instruction) */}
          {!session.feedback && (note || session.feedbackStatus === "failed") && <p className="mt-2 text-footnote italic text-ink-muted">{note || "The coach could not review this session."}</p>}
          {/* The numbers together */}
          {!quick && <NumbersRow session={session} pauseCount={pauses ? pauses.count : null} />}
          {/* When there is no number, say why */}
          {!reading && !bookendOutcome && !smallTalk && !measureFor(session.focus) && <p className="mt-2 text-footnote italic text-ink-muted">No number measures this from a transcript; the notes are what count.</p>}
          {/* How the pauses went, when loudness was recorded */}
          {pauses && !quick && <p className="mt-2 text-footnote italic text-ink-muted">{pauseSentence(pauses)}</p>}
          {/* Which pause marks had a pause */}
          {marks && <p className="mt-2 text-footnote italic text-ink-muted">{marks}</p>}
          {/* How the pace changed */}
          {pace && !quick && <p className="mt-2 text-footnote italic text-ink-muted">{pace.sentence}</p>}
          {/* After a Table Topic or Record Response, how the timing went */}
          {timed && <p className="mt-2 text-footnote italic text-ink-muted">{timingSentence(session.mode, session.durationSec, undefined, session.promptId)}</p>}
          {/* After a rehearsal with a goal, how the timing went */}
          {rehearsed?.goalMinutes && (session.sectionIndex ?? null) === null && <p className="mt-2 text-footnote italic text-ink-muted">{timingSentence("rehearse", session.durationSec, rehearsed.goalMinutes * 60)}</p>}
          {/* Listen back */}
          {earlier ? <ThenAndNow repo={repo} then={earlier.then} now={session} thenDay={earlier.thenDay} nowDay={earlier.nowDay} /> : <Playback repo={repo} session={session} />}
          {/* What the coach said to keep, after the next step and the numbers */}
          {session.feedback && <p className="mt-5 text-lede"><em>What to keep.</em> <span>{session.feedback.keep}</span></p>}
          {/* Quieter options, as a short list of rows (no empty space above them) */}
          <ul aria-label="More options" className="mt-6 mb-6 divide-y divide-rule border-y border-rule">
            {/* Open the transcript on a phone */}
            <li className="md:hidden"><RowButton onClick={() => setShowTranscript(!showTranscript)}>{showTranscript ? "Hide what I said" : "Read what I said"}</RowButton></li>
            {/* After a rehearsal or a response, practise the questions that would follow */}
            {(session.mode === "rehearse" || session.mode === "response") && <li><RowLink href={`/qa?from=${session.id}`}>Practise Q&amp;A</RowLink></li>}
            {/* After a part of a full speech, the next part, or the speech's page after the last */}
            {speechPart && <li>{speechPart.part < speechPart.speech.parts.length ? <RowLink href={`/session?mode=read&prompt=${partId(speechPart.speech, speechPart.part + 1)}`}>Read part {speechPart.part + 1}</RowLink> : <RowLink href={`/speech?id=${speechPart.speech.id}`}>That was the last part</RowLink>}</li>}
            {/* After a Q&A answer, back to the questions */}
            {qa && <li><RowLink href={`/qa?from=${session.promptId}`}>Back to the questions</RowLink></li>}
            {/* After a rehearsal, back to the talk and its plan */}
            {rehearsed && <li><RowLink href={`/talk?id=${rehearsed.id}`}>Back to your talk</RowLink></li>}
            {/* Inside today's practice, trying again is offered here (the main action moves on) */}
            {plan && <li><RowLink href={retryHref}>Try it again</RowLink></li>}
            {/* After small talk, another question, back on its own page */}
            {/* A follow-up or a reply: trying the same one again is a row, since the main action moves on */}
            {quick && !plan && <li><RowLink href={retryHref}>Try it again</RowLink></li>}
            {smallTalk && <li><RowLink href={quick ? `/small-talk#${findSmallTalk(session.promptId)?.unit}` : "/small-talk"}>{quick ? "Back to Connect" : "Another question"}</RowLink></li>}
            {/* Finish (small talk has its own page, so it leads back there instead) */}
            {!smallTalk && <li><RowLink href="/">Finish for today</RowLink></li>}
          </ul>
          {/* Inside today's practice, the next step; after an old warm-up, a Record Response; otherwise the retry */}
          {plan ? (
            <PlanBand plan={plan} />
          ) : next ? (
            <ActionBand action="Next one" aside={next.label} href={`/session?mode=smalltalk&prompt=${next.id}`} />
          ) : warmup ? (
            <ActionBand action="Now record a response" aside="today’s prompt" href={`/session?mode=response&prompt=${promptForDay(now).id}`} />
          ) : (
            <ActionBand action="Try it again" aside={rehearsed ? "same part of the talk" : qa || (smallTalk && findSmallTalk(session.promptId)?.unit === "answering") ? "same question" : smallTalk ? "same one" : "same prompt"} href={retryHref} />
          )}
        </aside>
      </div>
    </>
  );
}

// What a found beat says when there are no words to quote
const FOUND_WITHOUT_QUOTE: Partial<Record<BeatId, string>> = {
  // A follow-up that stayed on them
  "about-them": "It stayed on them.",
  // One short question
  "one-question": "One short question.",
  // A reply with no story of your own
  stay: "No story of your own.",
};

// A small-talk response's beats: what was said to them (for asking and listening), how many beats were found, then each beat with the words that showed it (the coach's quotes, or the phone's checks and the user's own ticks)
function SmallTalkBeats({ session }: { session: SessionRecord }) {
  // What was said to them, and the unit
  const found = findSmallTalk(session.promptId);
  // The unit
  const unit = found?.unit ?? "answering";
  // The coach's notes by beat on an answer, if they have arrived
  const coach = session.feedback?.smallTalk;
  // The coach's notes on a follow-up or a reply
  const connection = session.feedback?.connection;
  // How many beats were found
  const count = beatCount(session);
  // The speaker's words that showed each beat (quotes), or null when there are none to show
  const quotes = (beat: BeatId): string[] => {
    // From the conversation coach: its quote
    if (connection) return connection.found.filter((item) => item.beat === beat).map((item) => item.quote);
    // From the coach: its quotes
    if (coach) return (beat === "moment" ? [coach.moment] : beat === "hook" ? coach.hooks : beat === "feeling" ? [coach.feeling] : [coach.handBack]).filter(Boolean);
    // From the phone: the feeling words
    if (beat === "feeling") return feelingWords(session.transcript);
    // From the phone: the question back
    if (beat === "hand-back") return [handBack(session.transcript)].filter((phrase): phrase is string => phrase !== null);
    // From the phone: the reaction
    if (beat === "react") return [reaction(session.transcript)].filter((phrase): phrase is string => phrase !== null);
    // From the phone: their words, picked up
    if (beat === "their-detail" || beat === "their-words") return sharedWords(session.transcript, found?.question ?? "");
    // From the phone: how it felt for them
    if (beat === "their-feeling") return theirFeelingWords(session.transcript);
    // From the phone: the open question's first word
    if (beat === "open" && questionKind(session.transcript) === "open") return [session.transcript.split(/\s+/).find((word) => /^(what|how|why|where|when|which|who|tell)/i.test(word)) ?? ""].filter(Boolean);
    // The rest only the user can say
    return [];
  };
  // Draw them
  return (
    <>
      {/* For asking and listening, what they said (a story was not shown before) */}
      {unit !== "answering" && found && (
        <div className="mt-5 md:mt-0">
          {/* Small heading */}
          <p className="text-footnote italic text-ink-muted">{findUnit(unit).words.said}</p>
          {/* Their words */}
          <p className="mt-1 max-w-[52ch] text-lede">&ldquo;{found.question}&rdquo;</p>
        </div>
      )}
      {/* How many, as a headline */}
      <p className={`font-display text-3xl ${unit === "answering" ? "mt-5 md:mt-0" : "mt-4"}`}>{count === 4 ? "All four beats." : `${count} of 4 beats.`}</p>
      {/* A dead-end opening, said plainly */}
      {unit === "answering" && deadEndOpening(session.transcript) && <p className="mt-2 text-lede">It stopped at the opening. Even a quiet day has one thing worth telling.</p>}
      {/* Each beat */}
      <ul aria-label="The beats" className="mt-3 divide-y divide-rule border-y border-rule">
        {/* One row per beat */}
        {beatsFor(unit).map((beat) => {
          // Whether it was found
          const heard = beatFound(session, beat.id);
          // The words that showed it
          const words = heard ? quotes(beat.id) : [];
          // One beat
          return (
            <li key={beat.id} data-found={heard} className="flex gap-3 py-2">
              {/* Its mark: filled when found */}
              <span aria-hidden="true" className={`mt-1 flex size-5 flex-none items-center justify-center border-2 ${heard ? "border-accent bg-accent text-accent-ink" : "border-rule"}`}>{heard && <CheckIcon weight="bold" className="size-3.5" />}</span>
              {/* Its name and what showed it, or a reminder */}
              <span className="text-lede">
                {/* Name */}
                <strong className="font-display font-normal">{beat.name}.</strong>{" "}
                {/* The words, or the reminder when missing */}
                <span className={heard ? "" : "text-ink-muted"}>{!heard ? beat.reminder : words.length > 0 ? words.map((quote) => `\u201c${quote}\u201d`).join(", ") : (FOUND_WITHOUT_QUOTE[beat.id] ?? "You heard it.")}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// Inside today's practice: which step this is, short on a phone so the title keeps its line
function PlanNote({ plan }: { plan: PlanNav }) {
  // Two spellings, one per screen size
  return (
    <>
      {/* Phone */}
      <span className="md:hidden">Step {plan.step} of {plan.total}</span>
      {/* Computer */}
      <span className="hidden md:inline">Today’s practice · step {plan.step} of {plan.total}</span>
    </>
  );
}

// Inside today's practice: the band that moves to the next step, or finishes the practice after the last
function PlanBand({ plan }: { plan: PlanNav }) {
  // The next step, or back to Today
  return plan.next ? <ActionBand action={`Next: step ${plan.step + 1}`} aside={plan.next.label} href={plan.next.href} /> : <ActionBand action="Finish today’s practice" aside="back to Today" href="/" />;
}

// The Retry result screen
function RetryView({ repo, retry, original, now, plan }: { repo: Repository; retry: SessionRecord; original: SessionRecord; now: Date; plan: PlanNav | null }) {
  // The number for the focus, or the filler rate when the focus has none
  const measure = measureFor(original.focus) ?? measureFor("cut-fillers");
  // Write one try's number with its unit
  const numberOf = (session: SessionRecord) => {
    // The number, if this try has one (old tries have no pause count)
    const value = measure?.read(session) ?? null;
    // The number and its unit, or a plain note
    return measure && value !== null ? `${measure.format(value)} ${measure.unit}.` : "No count for this try.";
  };
  // Draw the page
  return (
    <>
      {/* Title and day */}
      <Masthead title="Second try" section={sessionHome(retry.mode, retry.promptId, plan !== null).section}>{plan ? <PlanNote plan={plan} /> : dayLabel(new Date(retry.createdAt), now)}</Masthead>
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
          <div className="mt-8">{plan ? <PlanBand plan={plan} /> : <ActionBand action="Finish" aside="saved" href="/" />}</div>
        </div>
      </div>
    </>
  );
}

// Draw the session page
export function SessionScreen({ sessionId, fetchFn, planStep = null, navigate, ...props }: SessionScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // What was loaded
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // A note about feedback being asked for, or why it has not come
  const [note, setNote] = useState("");
  // Inside today's practice: this step, how many there are, and the next one (loaded below)
  const [plan, setPlan] = useState<PlanNav | null>(null);
  // Bumped to ask the coach again, once notes it was waiting for are saved
  const [askAgain, setAskAgain] = useState(0);

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
      // For a rehearsal, the talk
      const talk = session?.mode === "rehearse" ? ((await repo.getTalk(session.promptId)) ?? null) : null;
      // For a Q&A answer, the session its question came from
      const qaSource = session?.mode === "qa" ? ((await repo.getSession(session.promptId)) ?? null) : null;
      // The question's place in that session's list, if it is still there
      const qaIndex = qaSource?.questions && session?.question ? qaSource.questions.indexOf(session.question) : -1;
      // Hand them back
      return { session, original, earlier, talk, qaIndex: qaIndex >= 0 ? qaIndex : null };
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
      const { outcome, reason } = await requestFeedbackDetail(repo, sessionId, { passphrase: readPassphrase(), ...(fetchFn ? { fetchFn } : {}) });
      // Stop if the screen closed meanwhile
      if (cancelled) return;
      // Say how it went
      setNote(outcome === "not-set-up" && reason ? `Feedback is paused. ${reason} Your session is saved.` : outcome === "retry-later" && reason ? `The coach could not be reached. Reason: ${reason}. Your session is saved.` : FEEDBACK_NOTES[outcome]);
      // Reload to show the feedback (or the new status)
      setLoaded(await load());
    })();
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today, sessionId, fetchFn, askAgain]);

  // Inside today's practice, load the plan to find the next step
  useEffect(() => {
    // Only inside the plan, once the date is known
    if (!planStep || !today) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Load it
    loadDailyPlan(repo, today).then((loadedPlan) => {
      // Stop if closed
      if (cancelled) return;
      // The next step, if there is one
      const next = loadedPlan.steps[planStep];
      // Keep where this step sits
      setPlan({ step: planStep, total: loadedPlan.steps.length, next: next ? { href: planHref(next, planStep + 1), label: next.label } : null });
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today, planStep]);

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
          <p data-inline className="mt-6 text-lede text-ink-muted">This session is not on this device. <Link href="/history" className="inline-flex min-h-11 items-center underline underline-offset-4">Back to history</Link></p>
        </>
      )}
      {/* A retry with its first try */}
      {loaded?.session && loaded.original && loaded.session.mode !== "smalltalk" && today && <RetryView repo={repo} retry={loaded.session} original={loaded.original} now={today} plan={plan} />}
      {/* A first try (or a retry whose first try is missing) */}
      {loaded?.session && (!loaded.original || loaded.session.mode === "smalltalk") && today && <FeedbackView repo={repo} session={loaded.session} now={today} note={note} earlier={loaded.earlier} rehearsed={loaded.talk} qaIndex={loaded.qaIndex} plan={plan} navigate={navigate} onReviewed={(updated) => {
        // Show the notes and the feedback
        setLoaded((previous) => (previous ? { ...previous, session: updated } : previous));
        // If the coach was waiting for the notes, ask it now
        if (note === FEEDBACK_NOTES["awaiting-notes"]) setAskAgain((count) => count + 1);
      }} />}
    </main>
  );
}
