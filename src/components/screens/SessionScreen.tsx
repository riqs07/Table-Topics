"use client";
// One saved session: the Feedback screen for a first try, or the Retry result screen for a retry

// Load React's state and effect tools
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load Next.js's lazy loader, for the voice cards only some takes show (decisions 99 and 111)
import dynamic from "next/dynamic";
// Load the script-page building blocks
import { ActionBand } from "@/components/script/ActionBand";
import { PRESS, RowButton, RowLink, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
import { Masthead } from "@/components/script/Masthead";
import { Player } from "@/components/script/Player";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the saved-audio loader
import { useAudioUrl } from "@/components/screens/useAudioUrl";
// Load the plan loader (the plan's code loads after the page shows; decision 88)
import { loadDailyPlanLater } from "@/data/loadDailyPlanLater";
// Load the plan's addresses
import { planHref } from "@/core/planSteps";
// Load the plan navigation type
import type { PlanNav } from "@/components/screens/planNav";
// Load the listen-back step
import { NotesFold } from "@/components/screens/NotesFold";
// Load the quick tags, for showing the user's notes
import { CHANGE_TAGS, WORKED_TAGS } from "@/core/selfReview";
// Load the small-talk beats and checks
import { UNITS, beatsFor, findSmallTalk, findUnit, nextInUnit, type BeatId } from "@/content/smallTalk";
import { beatCount, beatFound, deadEndOpening, phoneQuotes } from "@/core/smallTalk";
// Load the tick
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the comparison of notes with the numbers
import { compareNotes } from "@/core/notesCheck";
// Load the sentence helpers
import { dayLabel } from "@/core/copy";
// Load the findings from word times
import { markPauses, marksPaused, marksSentence, paceAcross } from "@/core/wordTiming";
// Load the playback boost for quiet recordings (decision 81)
import { playbackGain } from "@/core/voiceLevels";
// Load the pause-length bars (decision 80)
import { PauseLengths } from "@/components/script/PauseLengths";
// Load the usual range (decision 81)
// Load the text a take read, for pitch in its words and planned stress (decision 111)
import { useTakeScript } from "@/components/screens/useTakeScript";
import { rangeOf, usualRangeBefore } from "@/core/voiceFeedback";
// Load the saved voice drill's view (decision 80)
import { VoiceSessionView } from "@/components/screens/VoiceSessionView";
// Load the saved conversation view (decision 83)
import { ConversationSessionView } from "@/components/screens/ConversationSessionView";
// Load the script splitter, to place the pause marks among the timed words
import { readingTokens } from "@/core/liveReading";
// Load the compact row of numbers
import { fillerCount, fillerPhrase, resultChanges, resultNumbers, type ResultKind } from "@/core/resultNumbers";
// Load what a take answered
import { answeredPrompt } from "@/core/answeredPrompt";
// Load the count-up rules and the hook that runs them
import { countUpValue } from "@/core/countUp";
// Load the check for which planned points were said
import { pointsCovered } from "@/core/outline";
// Load the shared card look
import { CARD, CARD_LIST } from "@/components/script/textStyles";
import { useCountUp } from "@/components/script/useCountUp";
// Load the filler marker
import { markFillers } from "@/core/fillers";
// Load the then-and-now helpers
import { earlierTake, practiceDay } from "@/core/compare";
// Load the pause finder
import { findPauses, pauseDrillSentence } from "@/core/pauses";
// Load the reading check
import { alignReading, countPauseMarks, type ReadingCheck } from "@/core/readAlong";
// Load where each kind of session belongs
import { sessionHome } from "@/core/sessionHome";
// Load the change picked from the numbers, for when the coach has not answered
import { localChange } from "@/core/localChange";
// Load the section splitter, for rehearsals of one section
import { talkSections } from "@/core/eventPrep";
// Load the Table Topics timing sentence
import { LOUDNESS_TICK_MS, formatClock, speakingWindow, timingSentence } from "@/core/recordingRules";
// Load the focus-based headlines and numbers
import { headlineFor, headlineKind, measureFor, retryHeadline } from "@/core/focusMeasure";
// Load the pause-word and fluency settings rules
import { fluencyJudged, pauseWordsShown } from "@/core/pauseWords";
// Load the daily prompt picker, for the step after a warm-up
import { BOOKENDS, promptForDay } from "@/content/prompts";
// Load the part ids and lookup for the full speeches, without their text
import { partId, speechPartOf } from "@/content/readingIndex";
// Load the text to read by id (a full speech's text loads only when a part of one is asked for; decision 88)
import { useReading } from "@/components/screens/useReading";
// Load the lesson lookup
import { findLesson } from "@/content/lessons";
// Load the lesson checks
import { lessonResult } from "@/core/lessonCheck";
// Load the openings and closings drill check
import { bookendResult, retiredDrillLesson } from "@/core/bookend";
// Load the session record type
import type { FullSession, SessionRecord, TalkRecord } from "@/data/records";
// Load the comparison of the speaker's own call with the measure (decision 116)
import { compareRating } from "@/core/ratingCompare";
// Load the star toggle (decision 98)
import { StarToggle } from "@/components/script/StarToggle";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load the feedback requester and its outcomes
import { requestFeedbackDetail, type FeedbackOutcome } from "@/data/feedbackClient";
// Load the saved passphrase
import { readPassphrase } from "@/data/passphrase";
// Load the tab title helper
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the deeper-analysis notes (decision 91)
import { noteFor } from "@/core/analysis/deep";
// Load the story checks, beats and the retelling comparison (decision 92)
import { heardList, storyChecks } from "@/core/storyChecks";
import { retellHeadline, storyCompareRows } from "@/core/storyLibrary";
import { STORY_BEAT_NAMES, momentIdOf } from "@/content/stories";
// Load the guided stories and the comparison with their facts (decision 93)
import { factsOf, findGuidedStory, type GuidedStory } from "@/content/guidedStories";
import { compareWithFacts } from "@/core/guidedStory";
import { STORY_BEATS } from "@/data/records";

// The take's views, chosen focus first (pitch in the words, the lenses, the fingerprint, the best moment, the energy arc, a story's shape), loaded once the page is up so the take's first download stays small (decisions 81, 99, 111 and 115)
const TakeViews = dynamic(() => import("@/components/script/TakeViews").then((module) => module.TakeViews), { ssr: false });
// Planned stress, loaded only for a take whose text has key words (decision 111)
const PlannedStressCard = dynamic(() => import("@/components/script/PlannedStressCard").then((module) => module.PlannedStressCard), { ssr: false });
// Last try and this try, loaded only where the same words were said twice (decision 111)
const LastVsThisCard = dynamic(() => import("@/components/script/LastVsThisCard").then((module) => module.LastVsThisCard), { ssr: false });

// What the screen needs: which session, plus the shared props
interface SessionScreenProps extends ScreenProps {
  // Id of the session to show
  sessionId: string;
  // Network function for asking the coach (replaced in tests)
  fetchFn?: typeof fetch;
  // Inside today's practice: which step this is (counted from 1), or null
  planStep?: number | null;
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
  // The session with its detailed readings, or null if it is not on this device
  session: FullSession | null;
  // The first try with its readings, when the session is a retry
  original: FullSession | null;
  // An earlier day's recording of the same prompt, with both practice day numbers, for "then and now"
  earlier: { then: FullSession; thenDay: number; nowDay: number } | null;
  // For a rehearsal, the talk it rehearsed (null if deleted or not a rehearsal)
  talk: TalkRecord | null;
  // For a Q&A answer, which of its session's questions it answered (null if that question has since been replaced)
  qaIndex: number | null;
  // The speaker's usual pitch range from their earlier recordings, or null (decision 81)
  usual: number | null;
  // Every session, as read for the page (the take's views compare its pace with the usual; decision 115)
  all: SessionRecord[];
}

// How results are shown, from Settings: pause words counted and marked, and fluency judged (decision 79)
interface ResultView {
  // Pause-word numbers, marks and headlines
  pauseWords: boolean;
  // Repeats, slow pace and fading phrases
  fluency: boolean;
}

// The transcript with fillers marked quietly; given the times each word was heard and a way to play, each filler plays its moment when tapped (decision 77)
function Transcript({ text, times = null, onPlay = null, marks = true }: { text: string; times?: ReadonlyArray<number> | null; onPlay?: ((seconds: number) => void) | null; marks?: boolean }) {
  // The pieces, fillers marked (one plain piece when pause words are hidden; decision 79)
  const pieces = marks ? markFillers(text) : [{ text, filler: false }];
  // Where each piece starts in the text
  const starts = pieces.map((_, index) => pieces.slice(0, index).reduce((sum, piece) => sum + piece.text.length, 0));
  // Draw each piece, marking fillers
  return (
    <p className="text-running">
      {/* One span per piece */}
      {pieces.map((piece, index) => {
        // Plain words
        if (!piece.filler) return <span key={index}>{piece.text}</span>;
        // When this filler was heard: the time of its first word (the words before it, counted the way the times were saved)
        const at = times?.[text.slice(0, starts[index]).split(/\s+/).filter((word) => word !== "").length];
        // With a time and a recording: a soft highlight that plays from just before it
        if (onPlay && typeof at === "number") return <button key={index} type="button" onClick={() => onPlay(at)} aria-label={`Play “${piece.text}” at ${formatClock(Math.floor(at))}`} className="rounded bg-filler/15 px-0.5 text-filler underline decoration-dotted underline-offset-4 hover:bg-filler/25">{piece.text}</button>;
        // Otherwise a soft highlight (not an underline, which reads as a link)
        return <mark key={index} className="bg-filler/15 px-0.5 text-filler">{piece.text}</mark>;
      })}
    </p>
  );
}

// A player for a session's saved audio (draws nothing if the audio is gone)
function Playback({ repo, session, onAudio }: { repo: Repository; session: FullSession; onAudio?: (element: HTMLAudioElement | null) => void }) {
  // The audio's address
  const url = useAudioUrl(repo, session.audioKey).url;
  // Nothing to play
  if (!url) return null;
  // The player, with a note when this is the baseline
  return (
    <div className="mt-5">
      {/* Small heading */}
      <p className="text-footnote font-semibold text-ink">{session.isBaseline ? "Your first recording. Progress is measured against it." : "Listen back"}</p>
      {/* A kinder way to listen (decision 79), as its own line under the heading */}
      <p className="mt-1 text-footnote text-ink-muted">Most people dislike hearing their own voice. Listen the way a friendly coach would.</p>
      {/* The player */}
      <div className="mt-2"><Player src={url} label="Your recording" name="your recording" durationSec={session.durationSec} onAudio={onAudio} gain={playbackGain(session.loudnessScale)} /></div>
    </div>
  );
}

// One line of numbers for a take, such as "Day 1: 4.2 fillers a minute, 172 words a minute."
function takeNumbers(day: number, session: FullSession, pauseWords = true): string {
  // Day, filler rate, and speed
  return `Day ${day}: ${pauseWords ? `${fillerPhrase(session)}, ` : ""}${Math.round(session.wordsPerMinute)} words a minute.`;
}

// Then and now: an earlier day's recording of the same prompt beside this one, with a button to hear them in turn
function ThenAndNow({ repo, then, now, thenDay, nowDay, onNowAudio, pauseWords = true }: { repo: Repository; then: FullSession; now: FullSession; thenDay: number; nowDay: number; onNowAudio?: (element: HTMLAudioElement | null) => void; pauseWords?: boolean }) {
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
    <div className={`mt-5 p-4 ${CARD}`}>
      {/* Small heading */}
      <p className="text-footnote text-ink-muted">Then and now, same prompt</p>
      {/* The earlier take */}
      <p className="mt-3 text-footnote">{takeNumbers(thenDay, then, pauseWords)}</p>
      {/* Its player, if the audio is still on this device */}
      {thenUrl && <div className="mt-1"><Player src={thenUrl} label={`Your recording from day ${thenDay}`} name={`day ${thenDay}`} durationSec={then.durationSec} gain={playbackGain(then.loudnessScale)} onAudio={(element) => { thenPlayer.current = element; }} /></div>}
      {/* This take */}
      <p className="mt-3 text-footnote">{takeNumbers(nowDay, now, pauseWords)}</p>
      {/* Its player */}
      {nowUrl && <div className="mt-1"><Player src={nowUrl} label={`Your recording from day ${nowDay}`} name={`day ${nowDay}`} durationSec={now.durationSec} gain={playbackGain(now.loudnessScale)} onAudio={(element) => { nowPlayer.current = element; onNowAudio?.(element); }} /></div>}
      {/* Hear both in turn */}
      {thenUrl && nowUrl && (
        <button type="button" onClick={playBoth} className={`${SECONDARY} mt-3`}>
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

// Columns by how many tiles there are: up to three share a row on any phone, four go two by two until there is room for one row
const TILE_COLUMNS: Readonly<Record<number, string>> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2 min-[400px]:grid-cols-4" };

// The numbers as tiles: fillers, speed, length, and pauses when measured, each counting up into place (decision 69); each number once, counts on a short take, and the fillers tile shows where they were (decision 77)
function NumbersRow({ session, pauseCount, leaveOut, onShowFillers }: { session: FullSession; pauseCount: number | null; leaveOut: ReadonlyArray<ResultKind>; onShowFillers: (() => void) | null }) {
  // How far the count has got
  const progress = useCountUp();
  // The numbers to show
  const numbers = resultNumbers(session, pauseCount, { counts: true, leaveOut });
  // Nothing left to show
  if (numbers.length === 0) return null;
  // One tile per number, the number large and its words small beneath
  return (
    <section aria-label="Your numbers" className={`mt-4 grid gap-2 motion-safe:animate-rise ${TILE_COLUMNS[numbers.length] ?? "grid-cols-2"}`} style={{ animationDelay: "220ms" }}>
      {/* Each number */}
      {numbers.map((item) => {
        // The number and its words
        const body = (
          <>
            {/* The number, counting up */}
            <span className="block font-display text-cue font-semibold tabular-nums">{countUpValue(item.value, progress)}</span>
            {/* Its words */}
            <span className="block text-footnote leading-tight text-ink-muted">{item.label}</span>
          </>
        );
        // Fillers, when there were some: a button that shows them in what was said
        if (item.kind === "fillers" && onShowFillers && fillerCount(session) > 0) {
          // The tile as a button, with a small "show" under the words
          return (
            <button key={item.kind} type="button" onClick={onShowFillers} aria-label={`${item.value} ${item.label}: show where`} className={`min-w-0 rounded-2xl bg-card px-3 pt-3 pb-2.5 text-left hover:bg-paper ${PRESS}`}>
              {body}
              {/* Where it leads */}
              <span aria-hidden="true" className="mt-1 block text-footnote font-semibold text-accent">Show where</span>
            </button>
          );
        }
        // Any other number: a plain tile
        return <div key={item.kind} className="min-w-0 rounded-2xl bg-card px-3 pt-3 pb-2.5">{body}</div>;
      })}
    </section>
  );
}

// For a timed session: a ring that draws round to how long you spoke against the window's end, beside how the timing went (decision 69)
function LengthRing({ session }: { session: FullSession }) {
  // The window, when this kind of session has one
  const window = speakingWindow(session.mode, session.promptId, session.story?.length);
  // How far round: the length against the window's end (or a full ring without one)
  const share = window ? Math.min(1, session.durationSec / window.end) : 1;
  // The ring's length
  const length = 239;
  // The ring and the sentence beside it
  return (
    <div className="mt-4 flex items-center gap-4 motion-safe:animate-rise" style={{ animationDelay: "300ms" }}>
      {/* The ring */}
      <svg aria-hidden="true" viewBox="0 0 92 92" className="size-20 flex-none -rotate-90">
        {/* Its track */}
        <circle cx="46" cy="46" r="38" fill="none" strokeWidth="10" className="stroke-paper" />
        {/* The part spoken */}
        <circle cx="46" cy="46" r="38" fill="none" strokeWidth="10" strokeLinecap="round" strokeDasharray={length} strokeDashoffset={length * (1 - share)} className="stroke-accent motion-safe:animate-ring" style={{ "--vl-ring-len": String(length) } as CSSProperties} />
      </svg>
      {/* How the timing went, with the length */}
      <p className="text-lede">{timingSentence(session.mode, session.durationSec, undefined, session.promptId, session.story?.length)}</p>
    </div>
  );
}

// For a short speech: each planned point, and whether it was heard in what was said (decision 73)
function OutlinePoints({ session }: { session: FullSession }) {
  // The plan
  const outline = session.outline;
  // Nothing without one
  if (!outline) return null;
  // Which points were heard
  const covered = pointsCovered(outline.points, session.transcript);
  // The card
  return (
    <section aria-label="Your points" className={`mt-5 p-4 ${CARD}`}>
      {/* Heading and count */}
      <p className="text-footnote text-ink-muted"><span className="font-semibold text-ink">Your points</span> · {covered.filter(Boolean).length} of {outline.points.length} heard</p>
      {/* Each point */}
      <ul className="mt-2 flex flex-col gap-2">
        {outline.points.map((point, index) => (
          // One point, ticked when heard
          <li key={index} className="flex items-start gap-3">
            {/* The mark */}
            <span aria-hidden="true" className={`mt-0.5 flex size-6 flex-none items-center justify-center rounded-lg ${covered[index] ? "bg-fill text-fill-ink" : "bg-paper text-ink-muted"}`}>{covered[index] ? <CheckIcon weight="bold" className="size-4" /> : index + 1}</span>
            {/* The point, and whether it was heard */}
            <span><span className="block">{point}</span><span className="block text-footnote text-ink-muted">{covered[index] ? "Heard" : "Not heard"}</span></span>
          </li>
        ))}
      </ul>
      {/* How it is matched */}
      <p className="mt-3 text-footnote text-ink-muted">Matched by key words, so a point said in other words may show as not heard.</p>
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
function FeedbackView({ repo, session, now, note, earlier, rehearsed, qaIndex, onReviewed, plan, view, usual, all, original = null }: { repo: Repository; session: FullSession; now: Date; note: string; earlier: Loaded["earlier"]; rehearsed: TalkRecord | null; qaIndex: number | null; onReviewed: (updated: FullSession) => void; plan: PlanNav | null; view: ResultView; usual: number | null; all: ReadonlyArray<SessionRecord>; original?: FullSession | null }) {
  // Whether this is a told story (decision 92)
  const story = session.mode === "story";
  // The lesson, on the skill path
  const lesson = session.mode === "lesson" ? findLesson(session.promptId) : undefined;
  // The text that was read aloud, once loaded
  const readAloud = useReading(session.mode === "read" || session.mode === "pause" ? session.promptId : null).passage;
  // The text that was read or rehearsed: a passage, a lesson's practice text (without stress marks), or the user's talk
  const passage = session.mode === "read" || session.mode === "pause" ? readAloud : lesson ? { title: `Lesson ${lesson.number}: ${lesson.title}`, body: lesson.body.replace(/\*/g, "") } : rehearsed ? rehearsedText(rehearsed, session.sectionIndex ?? null) : undefined;
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
  // In a pause drill with word times, how long the pause was at each mark (decision 80)
  const gaps = session.mode === "pause" && passage && session.scriptTimes ? markPauses(readingTokens(passage.body), session.scriptTimes) : [];
  // Whether this was an old warm-up (it leads into a Record Response instead of a retry)
  const warmup = session.mode === "warmup";
  // Whether this was a Table Topic
  const talk = session.mode === "talk";
  // Whether this kind of session has a timing line and a retry of the same kind (Table Topic or Record Response)
  const timed = talk || session.mode === "response" || session.mode === "bookend" || session.mode === "qa" || session.mode === "smalltalk" || session.mode === "story";
  // Whether this is a small-talk answer (notes by beat, kept apart from the speech practice)
  const smallTalk = session.mode === "smalltalk";
  // Whether it is a follow-up question or a reply to a story: a few seconds long, so a lighter result that moves on to the next one
  const quick = smallTalk && findSmallTalk(session.promptId)?.unit !== "answering";
  // The next one in its unit
  const next = quick ? nextInUnit(session.promptId) : null;
  // Whether this is an answer to an audience question
  const qa = session.mode === "qa";
  // Where "try it again" leads: for an old openings and closings drill (retired, decision 106), the lesson on the same end of a talk; the same question for an old Q&A answer (or the session it came from, if the question was replaced; Q&A practice is gone, decision 61), otherwise the same prompt
  const retryHref = session.mode === "bookend" ? `/session?mode=lesson&prompt=${retiredDrillLesson(session.promptId)}` : qa && qaIndex === null ? `/sessions?id=${session.promptId}` : `/session?${timed || reading || session.mode === "free" || session.mode === "outline" ? `mode=${session.mode}&` : ""}prompt=${session.promptId}${typeof session.sectionIndex === "number" ? `&section=${session.sectionIndex}` : ""}${qa ? `&question=${qaIndex}` : ""}&retryOf=${session.id}${plan ? `&plan=${plan.step}` : ""}`;
  // An openings and closings drill's prompt, and what it measured
  const bookend = session.mode === "bookend" ? BOOKENDS.find((item) => item.id === session.promptId) : undefined;
  // The drill's two findings
  const bookendOutcome = bookend ? bookendResult(bookend.part, session, { pauseWords: view.pauseWords }) : null;
  // Whether the transcript is open on a phone (it is always shown on a computer)
  const [showTranscript, setShowTranscript] = useState(false);
  // This take's audio element, for playing a filler's moment (decision 77)
  const audio = useRef<HTMLAudioElement | null>(null);
  // The transcript block, brought into view when the fillers are asked for
  const transcriptBlock = useRef<HTMLDivElement | null>(null);
  // Whether a filler can play its moment: the recording is kept and each word's time was saved
  const canPlay = !!session.audioKey && !!session.spokenTimes && session.spokenTimes.length > 0;
  // Play from a second before a moment
  const playAt = useCallback((seconds: number) => {
    // The player's audio
    const element = audio.current;
    // Nothing to play
    if (!element) return;
    // Just before it, for context
    element.currentTime = Math.max(0, seconds - 1);
    // Play (the browser may refuse, which is fine)
    void element.play().catch(() => {});
  }, []);
  // Show the fillers in what was said: open the transcript, then bring it into view and move focus to it
  const showFillers = useCallback(() => {
    // Open it on a phone
    setShowTranscript(true);
    // Once drawn
    setTimeout(() => {
      // The block
      const block = transcriptBlock.current;
      // Into view, without motion when it is unwelcome
      block?.scrollIntoView?.({ block: "start", behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      // Focus, so a screen reader goes there too
      block?.focus({ preventScroll: true });
    }, 0);
  }, []);
  // The coach's first word swap for this take, once its rubric is saved (decision 90)
  const wordSwap = useWordSwap(repo, session.id, session.feedback);
  // The text it read, with any key words (decision 111)
  const takeScript = useTakeScript(session);
  // The page title for this kind of session
  const title = warmup ? "Warm-up" : talk ? "Rapid Fire" : qa ? "Q&A answer" : bookend ? (bookend.part === "opening" ? "Opening drill" : "Closing drill") : smallTalk ? "Small talk" : session.mode === "pause" ? "Pause drill" : session.mode === "rehearse" ? "Rehearsal" : lesson ? `Lesson ${lesson.number}: ${lesson.title}` : reading ? "Read aloud" : session.mode === "response" ? "Prepared speech" : session.mode === "free" ? "Free talk" : session.mode === "outline" ? "Short speech" : story ? (original ? "Told again" : "Story") : timed ? "Your answer" : "Your take";
  // Name the tab after it
  usePageTitle(`${title} results`);
  // The user's notes, with their tags as words
  const review = session.selfReview && !session.selfReview.skipped ? session.selfReview : null;
  // The tag words
  const tagWords = review ? [...WORKED_TAGS, ...CHANGE_TAGS, ...beatTags(session.promptId)].filter((tag) => review.tags.includes(tag.id)).map((tag) => tag.label.toLowerCase()) : [];
  // The notes against the numbers
  const checks = smallTalk ? [] : compareNotes(session);
  // One change picked from the numbers, shown until the coach's arrives
  const ownChange = localChange(session, view);
  // Where the session belongs
  const home = sessionHome(session.mode, session.promptId, plan !== null);
  // For one part of a full speech: the speech, and the part read
  const speechPart = session.mode === "read" ? speechPartOf(session.promptId) : undefined;
  // What it answered, shown first (decision 77)
  const asked = answeredPrompt(session);
  // The number the headline already gives (only where the focus headline is shown), so its tile is left out
  const shownHeadline = !reading && !bookendOutcome && !smallTalk && !story ? headlineKind(session) : null;
  // The focus headline, unless it would count pause words that are hidden (decision 79)
  const headline = shownHeadline === "fillers" && !view.pauseWords ? null : headlineFor(session);
  // Draw the page
  return (
    <>
      {/* Title and the day it was recorded, as a small label (not to be mistaken for the Today tab); the tab bar marks where the session belongs (Today inside the plan) */}
      <Masthead title={title} section={home.section}>{plan ? <PlanNote plan={plan} /> : <span data-testid="recorded-day" className="text-footnote">Recorded {dayLabel(new Date(session.createdAt), now).replace(/^(Today|Yesterday)$/, (day) => day.toLowerCase())}</span>}</Masthead>
      {/* Notes column and transcript column on a computer (the notes lead and take the wide column; the transcript sits beside them, decision 65) */}
      <div className="flex flex-1 flex-col md:grid md:grid-cols-[minmax(0,1fr)_320px] md:gap-14 md:pt-8">
        {/* The transcript (the narrow right column on a computer, opened on demand on a phone) */}
        <div ref={transcriptBlock} tabIndex={-1} role="region" aria-label="What you said" className={`${showTranscript ? "mt-6" : "hidden"} scroll-mt-6 outline-none md:order-2 md:mt-0 md:block`}>
          {/* Small heading, saying how to hear a filler when that works */}
          <p className="text-ink-muted">{passage ? `${passage.title}, as heard` : "What you said"}{!reading && view.pauseWords && canPlay && fillerCount(session) > 0 && <span className="block text-footnote">Tap a marked pause word to hear it.</span>}</p>
          {/* The words: the passage marked for a reading, otherwise the transcript */}
          <div className="mt-3 max-w-[46ch]">{reading ? <MarkedPassage check={reading} /> : <Transcript text={session.transcript} times={session.spokenTimes} onPlay={canPlay ? playAt : null} marks={view.pauseWords} />}</div>
          {/* For a reading, what the marks mean */}
          {reading && <p className="mt-3 max-w-[46ch] text-footnote text-ink-muted">Struck-through words were not heard. Some may be the speech service mishearing you rather than a skipped word.{reading.stoppedEarly ? " Dimmed words come after where you stopped." : ""}</p>}
        </div>
        {/* The notes (first on a phone, the wide left column on a computer) */}
        <aside className="order-first flex flex-1 flex-col md:order-1 md:max-w-xl">
          {/* A take from the weekly check-in: which one, and the way to the check-ins (decision 100) */}
          {session.checkIn && <p className="mt-5 text-footnote md:mt-0 md:mb-3"><Link href="/check-in" className={TEXT_LINK}>{session.checkIn.week === 1 ? "Your first check-in" : `Check-in ${session.checkIn.week}`}</Link></p>}
          {/* What it answered: the topic, prompt or question (decision 77) */}
          {asked && (
            <div className="mt-5 md:mt-0 md:mb-5">
              {/* Small heading */}
              <p className="text-footnote text-ink-muted">{asked.label}</p>
              {/* The words themselves */}
              <p className="mt-1 max-w-[40ch] font-display text-cue">{asked.text}</p>
            </div>
          )}
          {/* The focus number as a sentence (or the focus's name when no number measures it) */}
          {reading ? (
            <>
              {/* How much of the passage was read */}
              <h1 data-testid="reading-headline" className="mt-5 font-display text-3xl font-semibold tracking-tight md:mt-0">{lessonOutcome ? lessonOutcome.headline : session.mode === "pause" && passage ? (pauses ? pauseDrillSentence(pauses.count, countPauseMarks(passage.body)) : `The passage has ${countPauseMarks(passage.body)} pause marks.`) : session.mode === "rehearse" ? (reading.stoppedEarly ? `You covered the first ${reading.readTo} words of your script.` : `You covered ${reading.percentRead}% of your script.`) : reading.stoppedEarly ? `You read the first ${reading.readTo} words.` : `You read ${reading.percentRead}% of the words.`}</h1>
              {/* The detail */}
              <p className="mt-2 text-footnote text-ink-muted">{session.mode === "pause" || (lesson && lesson.check !== "clear-words") ? (reading.stoppedEarly ? `You read the first ${reading.readTo} words; ` : `You read ${reading.percentRead}% of the words; `) : ""}{reading.stoppedEarly ? `${reading.missedWithin} not heard in that stretch` : `${reading.missed} not heard`}{view.fluency ? `, ${reading.repeated} repeated` : ""}, {reading.extra} extra ({view.pauseWords ? "pause words and added words" : "added words"}).</p>
              {/* A lesson's tip, as a reminder */}
              {lesson && <p className="-ml-4 mt-4 border-l-2 border-accent pl-[14px] text-lede">Remember: {lesson.tip}</p>}
            </>
          ) : bookendOutcome ? (
            <>
              {/* The drill's main finding */}
              <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight md:mt-0">{bookendOutcome.headline}</h1>
              {/* Its second finding */}
              <p className="mt-2 text-footnote text-ink-muted">{bookendOutcome.detail}</p>
            </>
          ) : story ? (
            // What the phone heard, and the coach's beats once they arrive (decision 92)
            <StoryHeard session={session} original={original} moment={!asked && momentIdOf(session.promptId) !== null} />
          ) : smallTalk ? (
            // The beats: how many, then each with the words that showed it
            <SmallTalkBeats session={session} ticks={session.selfReview === null ? <NotesFold repo={repo} session={session} onSaved={onReviewed} coachWaiting={note === FEEDBACK_NOTES["awaiting-notes"]} startOpen /> : null} />
          ) : (
            // The focus number as a sentence, when one measures it (otherwise the one change leads)
            headline ? <h1 className={`font-display text-3xl font-semibold tracking-tight ${asked ? "mt-4" : "mt-5 md:mt-0"}`}>{headline}</h1> : <h1 className="sr-only">{title}</h1>
          )}
          {/* When the headline is the fillers (so no fillers tile below), the way to see where they were */}
          {headline && shownHeadline === "fillers" && fillerCount(session) > 0 && !reading && <p><button type="button" onClick={showFillers} className={`${TEXT_LINK} text-footnote`}>Show where</button></p>}
          {/* The speaker's own call against the measure, when it was rated and the measure is confident (decision 116) */}
          <RatingLine session={session} all={all} />
          {/* The next step: the one change and the cue, or a note that feedback has not arrived */}
          <div className={`mt-5 p-5 motion-safe:animate-rise ${CARD}`} style={{ animationDelay: "120ms" }}>
            {/* The pill that names it, and where it comes from until the coach's note arrives */}
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="inline-flex rounded-full bg-warm-tint px-2.5 py-1 text-footnote font-semibold text-warm-ink">One change</span>{!session.feedback && <span className="text-footnote text-ink-muted">From your numbers</span>}</p>
            {/* The change */}
            <p className="mt-3 text-lede">{(session.feedback ?? ownChange).change}</p>
            {/* Small heading for the cue */}
            <p className="mt-4 text-footnote text-ink-muted">{warmup ? "Before your response" : story ? "Before you tell it again" : "Before you try again"}</p>
            {/* The cue */}
            <p className="mt-1 font-display text-cue font-semibold tracking-tight">{(session.feedback ?? ownChange).retryCue}</p>
            {/* For a follow-up question or a reply to a story, a better one */}
            {session.feedback?.connection && (
              <>
                {/* Small heading */}
                <p className="mt-4 text-footnote text-ink-muted">{findUnit(findSmallTalk(session.promptId)?.unit ?? "asking").words.better}</p>
                {/* The better version */}
                <p className="mt-1 text-lede">{session.feedback.connection.better}</p>
              </>
            )}
            {/* For a story, one of your lines and how it could sound (decision 92) */}
            {session.feedback?.story && session.feedback.story.yours && (
              <div data-story-line className="mt-4 grid gap-2">
                {/* Your line */}
                <p className="text-lede"><span className="block text-footnote text-ink-muted">Your line</span>&ldquo;{session.feedback.story.yours}&rdquo;</p>
                {/* How it could sound, gaps in brackets set apart */}
                <p className="border-l-2 border-accent pl-3 text-lede"><span className="block text-footnote text-ink-muted">Could sound like</span>{session.feedback.story.better.split(/(\[[^\]]+\])/).map((part, index) => (part.startsWith("[") ? <em key={index} className="text-accent">{part}</em> : <span key={index}>{part}</span>))}</p>
              </div>
            )}
            {/* For small talk, the answer as it could sound, using only what was said */}
            {session.feedback?.smallTalk && (
              <>
                {/* Small heading */}
                <p className="mt-4 text-footnote text-ink-muted">As it could sound (only what you said)</p>
                {/* The livelier version, gaps in brackets set apart */}
                <p className="mt-1 text-lede">{session.feedback.smallTalk.livelier.split(/(\[[^\]]+\])/).map((part, index) => (part.startsWith("[") ? <em key={index} className="text-accent">{part}</em> : <span key={index}>{part}</span>))}</p>
              </>
            )}
          </div>
          {/* A retold story: this telling beside the one before (decision 92) */}
          {story && original && <StoryBeforeAfter original={original} retold={session} pauseWords={view.pauseWords} />}
          {/* The same words told again: the last telling's pitch under this one's (decision 111) */}
          {story && original && !session.trimmedAt && <LastVsThisCard repo={repo} before={original} after={session} kind="Tell it again" names={{ before: `Last time, ${dayLabel(new Date(original.createdAt), now).replace(/^(Today|Yesterday)$/, (day) => day.toLowerCase())}`, after: "This time" }} plays={{ before: "Play last time", after: "Play this time" }} />}
          {/* A short speech's points, right under the change: the answer people look for first (decision 77) */}
          <OutlinePoints session={session} />
          {/* While the coach's note is on its way, or why it will not come (never a setup instruction) */}
          {!session.feedback && (note || session.feedbackStatus === "failed") && <p className="mt-2 text-footnote text-ink-muted">{note || "The coach could not review this session."}</p>}
          {/* Listen back, right under the change (decision 67) */}
          {earlier ? <ThenAndNow repo={repo} then={earlier.then} now={session} thenDay={earlier.thenDay} nowDay={earlier.nowDay} onNowAudio={(element) => { audio.current = element; }} pauseWords={view.pauseWords} /> : <Playback repo={repo} session={session} onAudio={(element) => { audio.current = element; }} />}
          {/* Star the take to keep its recording and charts (decision 98; a moment note and a few-second reply are kept apart and need none) */}
          {!quick && <StarToggle key={session.id} repo={repo} sessionId={session.id} starred={session.starred === true} />}
          {/* The numbers together */}
          {!quick && <NumbersRow session={session} pauseCount={pauses ? pauses.count : null} leaveOut={[...(headline && shownHeadline ? [shownHeadline] : []), ...(timed ? (["length"] as const) : []), ...(view.pauseWords ? [] : (["fillers"] as const))]} onShowFillers={reading ? null : showFillers} />}
          {/* One quiet line on what the counts are (decision 79) */}
          {!quick && !reading && <p className="mt-2 text-footnote text-ink-muted">{view.pauseWords ? "A few pause words (um, uh, like) are normal. Counts are rough: speech services can mishear accents." : "Counts are rough: speech services can mishear accents."}</p>}
          {/* (The pause count is in the numbers row; the longer pause sentence and the "no number measures this" line were cut, decision 63) */}
          {/* Which pause marks had a pause */}
          {marks && <p className="mt-2 text-footnote text-ink-muted">{marks}</p>}
          {/* How long each pause was, against the one-to-two-second target */}
          {gaps.length > 0 && <PauseLengths gaps={gaps} />}
          {/* How the pace changed */}
          {pace && !quick && <p className="mt-2 text-footnote text-ink-muted">{pace.sentence}</p>}
          {/* After a Table Topic or Record Response, how the timing went (left out when the one change above already says it, so it is said once) */}
          {timed && !(!session.feedback && ownChange.aboutTiming) && <LengthRing session={session} />}
          {/* Planned stress, only where the text marks key words (decision 111) */}
          {!quick && !session.trimmedAt && takeScript.planned && takeScript.script && <PlannedStressCard repo={repo} session={session} script={takeScript.script} kind={session.checkIn ? "Check-in" : lesson ? "Lesson" : "Read aloud"} />}
          {/* The take's views, focus first: its own practice's view, or by length, with "Look closer" (decisions 81, 111 and 115; not for a few-second reply) */}
          {!quick && takeScript.ready && <TakeViews repo={repo} session={session} sessions={all} usual={usual} hide={session.feedback ? undefined : ownChange.voiceKind} fluency={view.fluency} pauseWords={view.pauseWords} script={takeScript.script} audio={() => audio.current} />}
          {/* After a short speech, how the timing went against its length, and which points were heard */}
          {session.mode === "outline" && session.outline && <p className="mt-2 text-footnote text-ink-muted">{timingSentence("rehearse", session.durationSec, session.outline.goalMinutes * 60)}</p>}
          {/* After a rehearsal with a goal, how the timing went */}
          {rehearsed?.goalMinutes && (session.sectionIndex ?? null) === null && <p className="mt-2 text-footnote text-ink-muted">{timingSentence("rehearse", session.durationSec, rehearsed.goalMinutes * 60)}</p>}
          {/* The user's own notes, once added (decision 67: after the feedback, never before it) */}
          {review && (review.worked || review.change || tagWords.length > 0) && (
            <div className={`mt-5 p-4 text-lede ${CARD}`}>
              {/* Small heading */}
              <p className="text-footnote text-ink-muted">Your notes</p>
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
          {/* No notes yet: an optional fold to add them */}
          {session.selfReview === null && !smallTalk && <NotesFold repo={repo} session={session} onSaved={onReviewed} coachWaiting={note === FEEDBACK_NOTES["awaiting-notes"]} />}
          {/* What the coach said to keep, after the next step and the numbers */}
          {session.feedback && <p className="mt-5 text-lede"><em>What to keep.</em> <span>{session.feedback.keep}</span></p>}
          {/* One word swap from the coach's rubric, when it suggested one (decision 90) */}
          {wordSwap && <p className="mt-2 text-lede"><em>One word swap.</em> <span>“{wordSwap.said}” → “{wordSwap.stronger}”{wordSwap.why ? ` (${wordSwap.why})` : ""}</span></p>}
          {/* Where the take's deeper analysis stands, said quietly (decision 91) */}
          <DeepNote repo={repo} sessionId={session.id} now={now} />
          {/* Quieter options, as a short list of rows (no empty space above them) */}
          <ul aria-label="More options" className={`mt-6 mb-6 divide-y divide-rule px-4 ${CARD}`}>
            {/* Open the transcript on a phone */}
            <li className="md:hidden"><RowButton onClick={() => setShowTranscript(!showTranscript)}>{showTranscript ? "Hide what I said" : "Read what I said"}</RowButton></li>
            {/* After a part of a full speech, the next part, or the speech's page after the last */}
            {speechPart && <li>{speechPart.part < speechPart.speech.partCount ? <RowLink href={`/session?mode=read&prompt=${partId(speechPart.speech, speechPart.part + 1)}`}>Read part {speechPart.part + 1}</RowLink> : <RowLink href={`/speech?id=${speechPart.speech.id}`}>That was the last part</RowLink>}</li>}
            {/* After a rehearsal, back to the talk and its plan */}
            {rehearsed && <li><RowLink href={`/talk?id=${rehearsed.id}`}>Back to your talk</RowLink></li>}
            {/* Inside today's practice, trying again is offered here (the main action moves on) */}
            {plan && <li><RowLink href={retryHref}>{story ? "Tell it again" : "Try it again"}</RowLink></li>}
            {/* After small talk, another question, back on its own page */}
            {/* A follow-up or a reply: trying the same one again is a row, since the main action moves on */}
            {quick && !plan && <li><RowLink href={retryHref}>Try it again</RowLink></li>}
            {smallTalk && !quick && <li><RowLink href={`/small-talk/unit?id=${findSmallTalk(session.promptId)?.unit ?? "answering"}`}>Another question</RowLink></li>}
            {/* Back to where it was started (outside today's practice, whose band moves on; decision 67) */}
            {!plan && !rehearsed && <li><RowLink href={home.href}>{story ? "Your stories" : home.label.replace("Close, back to", "Back to")}</RowLink></li>}
            {/* Every measure of this take, on the profile (decision 90) */}
            <li><RowLink href={`/profile?session=${encodeURIComponent(session.id)}`}>See all measures for this take</RowLink></li>
          </ul>
          {/* Inside today's practice, the next step; after an old warm-up, a Record Response; otherwise the retry */}
          {plan ? (
            <PlanBand plan={plan} />
          ) : next ? (
            <ActionBand action="Next one" aside={next.label} href={`/session?mode=smalltalk&prompt=${next.id}`} />
          ) : warmup ? (
            <ActionBand action="Now record a response" aside="today’s prompt" href={`/session?mode=response&prompt=${promptForDay(now).id}`} />
          ) : (
            <ActionBand action={story ? "Tell it again" : "Try it again"} aside={story ? "same story, same shape" : rehearsed ? "same part of the talk" : session.mode === "bookend" ? "a lesson on the same end of a talk" : qa || (smallTalk && findSmallTalk(session.promptId)?.unit === "answering") ? "same question" : smallTalk ? "same one" : "same prompt"} href={retryHref} />
          )}
        </aside>
      </div>
    </>
  );
}

// The one line comparing the speaker's call before the results with what was measured, or nothing when it was not rated or no confident measure maps to it (decision 116)
function RatingLine({ session, all }: { session: SessionRecord; all: ReadonlyArray<SessionRecord> }) {
  // The comparison, against the earlier takes of the same family
  const comparison = compareRating(session, all);
  // Nothing to say
  if (!comparison) return null;
  // The line
  return <p data-self-rating className="mt-4 max-w-[48ch] text-lede">{comparison.text}</p>;
}

// How often the take's page looks again while its deeper analysis is under way
const DEEP_CHECK_MS = 3_000;

// The quiet note on a take's deeper analysis (decision 91): read from its analysis, and read again every few seconds while it is under way; nothing when there is nothing to say
function DeepNote({ repo, sessionId, now }: { repo: Repository; sessionId: string; now: Date }) {
  // The note, once read
  const [note, setNote] = useState("");
  // Read it, and again while under way
  useEffect(() => {
    // Ignore late answers once the take changes
    let cancelled = false;
    // The next check
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Read once
    const read = () => {
      // The analysis (a failure just means no note is shown)
      repo.getAnalysis(sessionId).then((analysis) => {
        // The take changed
        if (cancelled) return;
        // Its note now
        setNote(noteFor(analysis?.deep, new Date(Math.max(now.getTime(), Date.now()))));
        // Look again while it is under way
        if (analysis?.deep?.status === "running") timer = setTimeout(read, DEEP_CHECK_MS);
      }, () => {});
    };
    // Start
    read();
    // Stop once the take changes
    return () => {
      // Ignore late answers
      cancelled = true;
      // No more checks
      clearTimeout(timer);
    };
  }, [repo, sessionId, now]);
  // Nothing to say
  if (!note) return null;
  // The note, read out politely when it changes
  return <p role="status" data-deep-note className="mt-4 max-w-[48ch] text-footnote text-ink-muted">{note}</p>;
}

// The first word swap the coach suggested for a take, read from its analysis, again when its feedback arrives (null when there is none)
function useWordSwap(repo: Repository, sessionId: string, feedback: FullSession["feedback"]): { said: string; stronger: string; why: string } | null {
  // The swap, once read
  const [swap, setSwap] = useState<{ said: string; stronger: string; why: string } | null>(null);
  // Read it when the take or its feedback changes
  useEffect(() => {
    // Ignore a late answer once the take changes
    let cancelled = false;
    // Read the analysis (a failure just means no swap is shown)
    repo.getAnalysis(sessionId).then((analysis) => {
      // Keep the first swap
      if (!cancelled) setSwap(analysis?.rubric?.wordSwaps[0] ?? null);
    }, () => {});
    // Stop updating once the take changes
    return () => {
      // Ignore late answers
      cancelled = true;
    };
  }, [repo, sessionId, feedback]);
  // The swap
  return swap;
}

// What a found beat says when there are no words to quote
const FOUND_WITHOUT_QUOTE: Partial<Record<BeatId, string>> = {
  // A follow-up that stayed on them
  "about-them": "It stayed on them.",
  // One short question
  "one-question": "One short question.",
  // A reply with no story of your own
  stay: "No story of your own.",
  // A response to news with no downside or advice
  "no-buts": "No buts, no advice.",
  // A moment where they asked or checked in (decision 95)
  check: "You asked.",
  // No guilt trip
  "no-blame": "Light, with no guilt.",
  // An opener with an easy question
  "ask-in": "Asked in the opener.",
};

// The small-talk beats a session's tags can name, by id: its own unit's beats first, then any other unit's, each id once (several units share a beat id, such as React)
function beatTags(promptId: string): Array<{ id: string; label: string }> {
  // The session's own unit's beats first, so its names win
  const all = [...beatsFor(findSmallTalk(promptId)?.unit ?? "answering"), ...UNITS.flatMap((unit) => unit.beats)];
  // Each id once
  return all.filter((beat, index) => all.findIndex((other) => other.id === beat.id) === index).map((beat) => ({ id: beat.id, label: beat.name }));
}

// A small-talk response's beats: what was said to them (for asking and listening), how many beats were found, then each beat with the words that showed it (the coach's quotes, or the phone's checks and the user's own ticks). On a fresh answer, before the user has ticked any and before the coach has reported, there is no count to grade it by: it asks which beats they hit, with the ticks to fill in straight under the question (round 4; "0 of 4 beats." read as a fail)
function SmallTalkBeats({ session, ticks }: { session: FullSession; ticks: ReactNode }) {
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
  // Whether anyone has reported on the beats yet: the coach, or the user's own ticks
  const reported = !!coach || !!connection || (!!session.selfReview && !session.selfReview.skipped);
  // A fresh answer with no notes yet: ask, and offer the ticks instead of the list
  const askFirst = !reported && session.selfReview === null;
  // The speaker's words that showed each beat: the coach's quotes when it has answered, otherwise the phone's
  const quotes = (beat: BeatId): string[] => {
    // From the conversation coach: its quote
    if (connection) return connection.found.filter((item) => item.beat === beat).map((item) => item.quote);
    // From the coach: its quotes
    if (coach) return (beat === "moment" ? [coach.moment] : beat === "hook" ? coach.hooks : beat === "feeling" ? [coach.feeling] : [coach.handBack]).filter(Boolean);
    // From the phone's own checks (empty for beats only the user can say)
    return phoneQuotes(session, beat);
  };
  // Draw them
  return (
    <>
      {/* For asking and listening, what they said (a story was not shown before) */}
      {unit !== "answering" && found && (
        <div className="mt-5 md:mt-0">
          {/* Small heading */}
          <p className="text-footnote text-ink-muted">{findUnit(unit).words.said}</p>
          {/* Their words (a described moment or situation is not quoted, decision 95) */}
          <p className="mt-1 max-w-[52ch] text-lede">{findUnit(unit).drill === "situation" ? found.question : <>&ldquo;{found.question}&rdquo;</>}</p>
        </div>
      )}
      {/* How many, as a headline, once reported; until then, the question */}
      <h1 className={`font-display text-3xl font-semibold tracking-tight ${unit === "answering" ? "mt-5 md:mt-0" : "mt-4"}`}>{!reported ? "Which beats did you hit?" : count === 4 ? "All four beats." : `${count} of 4 beats.`}</h1>
      {/* A dead-end opening, said plainly */}
      {unit === "answering" && deadEndOpening(session.transcript) && <p className="mt-2 text-lede">It stopped at the opening. Even a quiet day has one thing worth telling.</p>}
      {/* On a fresh answer: the ticks, right under the question */}
      {askFirst && ticks}
      {/* Each beat (once there is something to show against them) */}
      {!askFirst && <ul aria-label="The beats" className={`mt-3 ${CARD_LIST}`}>
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
              <span aria-hidden="true" className={`mt-1 flex size-5 flex-none items-center justify-center border-2 ${heard ? "border-fill bg-fill text-fill-ink" : "border-rule"}`}>{heard && <CheckIcon weight="bold" className="size-3.5" />}</span>
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
      </ul>}
    </>
  );
}

// A told story's "What I heard": the phone's checklist, honest about being rough, and once the coach has answered, the beats it heard (decision 92)
function StoryHeard({ session, original, moment }: { session: FullSession; original: FullSession | null; moment: boolean }) {
  // The phone's checks
  const checks = storyChecks(session.transcript);
  // As a checklist
  const lines = heardList(checks);
  // The coach's beats, once arrived
  const coach = session.feedback?.story;
  // A guided story, if it is one (decision 93)
  const guided = findGuidedStory(session.promptId);
  // Draw them
  return (
    <>
      {/* From a moment note: say so (a prompt from the bank is shown above instead) */}
      {moment && <p className="mt-5 text-footnote text-ink-muted md:mt-0">From your moment</p>}
      {/* The headline: how a retelling compared, or the checklist's name */}
      <h1 className={`font-display text-3xl font-semibold tracking-tight ${moment ? "mt-1" : "mt-5 md:mt-0"}`}>{original ? retellHeadline(original, session) : guided ? "What you added" : "What I heard"}</h1>
      {/* A guided story: what was added beyond the facts, and the facts kept (decision 93) */}
      {guided ? <GuidedAdded story={guided} session={session} /> : (
      // The checklist
      <ul aria-label="What I heard" className={`mt-3 ${CARD_LIST}`}>
        {/* One row per check */}
        {lines.map((line) => (
          // One check: its mark, name and what showed it
          <li key={line.id} data-heard={line.heard} className="flex gap-3 py-2">
            {/* The mark: filled when heard */}
            <span aria-hidden="true" className={`mt-1 flex size-5 flex-none items-center justify-center border-2 ${line.heard ? "border-fill bg-fill text-fill-ink" : "border-rule"}`}>{line.heard && <CheckIcon weight="bold" className="size-3.5" />}</span>
            {/* Name and note */}
            <span className="text-lede"><strong className="font-display font-normal">{line.name}.</strong> <span className={line.heard ? "" : "text-ink-muted"}>{line.note}</span></span>
          </li>
        ))}
      </ul>
      )}
      {/* A string of "and then" */}
      {checks.andThen >= 2 && <p className="mt-2 text-footnote">“And then” came {checks.andThen} times. Try “but” or “so”.</p>}
      {/* Honest about what this is */}
      <p className="mt-2 text-footnote text-ink-muted">Rough guesses from the words the phone caught: a line said another way can be missed.</p>
      {/* For a guided story, the coach's word on how far the facts came to life (decision 93) */}
      {coach?.broughtToLife && <p data-brought-to-life className="mt-4 border-l-2 border-accent pl-3 text-lede"><span className="block text-footnote text-ink-muted">Beyond the facts, the coach heard</span>{coach.broughtToLife}</p>}
      {/* The coach's beats, once arrived */}
      {coach && (
        <section aria-label="The beats" className="mt-4">
          {/* Small heading */}
          <p className="text-footnote text-ink-muted">The beats the coach heard · {coach.beats.length} of {STORY_BEATS.length}</p>
          {/* Each beat */}
          <ul className="mt-1 flex flex-col gap-1 text-footnote">
            {STORY_BEATS.map((beat) => {
              // Its quote, if heard
              const found = coach.beats.find((item) => item.beat === beat);
              // One beat
              return <li key={beat} data-beat={beat} className={`border-l-2 pl-3 ${found ? "border-accent" : "border-rule text-ink-muted"}`}><span className="font-semibold">{STORY_BEAT_NAMES[beat]}</span>{found ? `: “${found.quote}”` : ": not heard"}</li>;
            })}
          </ul>
        </section>
      )}
    </>
  );
}

// A guided story's telling set against its facts (decision 93): what was added beyond them, then any facts not heard
function GuidedAdded({ story, session }: { story: GuidedStory; session: FullSession }) {
  // The facts, the twist included
  const facts = factsOf(story);
  // The comparison
  const comparison = compareWithFacts(facts, session.transcript);
  // The facts not heard
  const lost = comparison.facts.filter((check) => !check.heard);
  // Draw it
  return (
    <>
      {/* How many of the five */}
      <p className="mt-1 text-footnote text-ink-muted">{comparison.addedCount} of 5 beyond the facts</p>
      {/* What was added */}
      <ul aria-label="What you added" className={`mt-3 ${CARD_LIST}`}>
        {/* One row each */}
        {comparison.added.map((line) => (
          // One thing: its mark, name and what showed it
          <li key={line.id} data-added={line.added} className="flex gap-3 py-2">
            {/* The mark: filled when added */}
            <span aria-hidden="true" className={`mt-1 flex size-5 flex-none items-center justify-center border-2 ${line.added ? "border-fill bg-fill text-fill-ink" : "border-rule"}`}>{line.added && <CheckIcon weight="bold" className="size-3.5" />}</span>
            {/* Name and note */}
            <span className="text-lede"><strong className="font-display font-normal">{line.name}.</strong> <span className={line.added ? "" : "text-ink-muted"}>{line.note}</span></span>
          </li>
        ))}
      </ul>
      {/* The facts kept */}
      <section aria-label="The facts" className="mt-4">
        {/* How many */}
        <p className="text-footnote text-ink-muted">The facts · {comparison.factsHeard} of {facts.length} heard</p>
        {/* Each one not heard, with the words missed */}
        {lost.length > 0 ? (
          <ul className="mt-1 flex flex-col gap-1 text-footnote">
            {/* Each lost fact */}
            {lost.map((check) => <li key={check.fact} data-fact-missing className="border-l-2 border-rule pl-3">Not heard: “{check.fact}” <span className="text-ink-muted">(listened for {check.notHeard.join(", ")})</span></li>)}
          </ul>
        ) : (
          <p className="mt-1 text-footnote">Every fact made it in.</p>
        )}
      </section>
    </>
  );
}

// A retold story beside the telling before: what was being worked on, then each check and number on both (decision 92; the same table as a second try's)
function StoryBeforeAfter({ original, retold, pauseWords }: { original: FullSession; retold: FullSession; pauseWords: boolean }) {
  // The cue the telling before gave
  const cue = (original.feedback ?? localChange(original)).retryCue;
  // The checks on both, then the usual numbers
  const rows = [...storyCompareRows(original, retold), ...resultChanges(original, retold, { before: null, after: null }).filter((change) => pauseWords || change.label !== "pause words a minute")];
  // Draw it
  return (
    <section aria-label="Last time and this time" className="mt-5">
      {/* What it worked on */}
      {cue && <p className="max-w-[48ch] text-footnote text-ink-muted">You were working on: {cue}</p>}
      {/* The table */}
      <BeforeAfterTable label="Last time and this time" first="Last time" second="This time" rows={rows} />
    </section>
  );
}

// Both tries' numbers side by side, first then second (decision 67; shared by a second try and a retold story)
function BeforeAfterTable({ label, first, second, rows }: { label: string; first: string; second: string; rows: ReadonlyArray<{ label: string; before: string; after: string }> }) {
  // The table
  return (
    <table aria-label={label} className={`mt-3 w-full max-w-md overflow-hidden text-left ${CARD}`}>
      {/* The column names */}
      <thead className="text-footnote text-ink-muted">
        <tr>
          {/* What it counts */}
          <th scope="col" className="py-2 pl-4 font-normal" />
          {/* First */}
          <th scope="col" className="py-2 font-normal">{first}</th>
          {/* Second */}
          <th scope="col" className="py-2 font-normal">{second}</th>
        </tr>
      </thead>
      {/* One row per number */}
      <tbody>
        {rows.map((row) => (
          // One number on both
          <tr key={row.label} className="border-t border-rule">
            {/* What it counts */}
            <th scope="row" className="py-2 pl-4 text-footnote font-normal text-ink-muted">{row.label}</th>
            {/* First */}
            <td className="py-2 text-ink-muted">{row.before}</td>
            {/* Second */}
            <td className="py-2 pr-4 font-display text-cue font-semibold">{row.after}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
function RetryView({ repo, retry, original, now, plan, view, usual, all }: { repo: Repository; retry: FullSession; original: FullSession; now: Date; plan: PlanNav | null; view: ResultView; usual: number | null; all: ReadonlyArray<SessionRecord> }) {
  // The second try's audio element, for playing a moment from the lenses (decision 115)
  const audio = useRef<HTMLAudioElement | null>(null);
  // Where the session belongs, and the way back
  const home = sessionHome(retry.mode, retry.promptId, plan !== null);
  // The cue the first try gave
  const cue = (original.feedback ?? localChange(original, view)).retryCue;
  // The pauses on each try, when loudness was recorded
  const pausesOf = (session: FullSession) => (session.loudness && session.loudness.length > 0 ? findPauses(session.loudness, LOUDNESS_TICK_MS).count : null);
  // The pitch range on each try, when both were measured (decision 81)
  const ranges = [rangeOf(original), rangeOf(retry)];
  // The text both tries read, if any (decision 111)
  const takeScript = useTakeScript(retry);
  // Both tries' numbers, with the pitch range last
  const changes = [...resultChanges(original, retry, { before: pausesOf(original), after: pausesOf(retry) }).filter((change) => view.pauseWords || change.label !== "pause words a minute"), ...(ranges[0] !== null && ranges[1] !== null ? [{ label: "pitch range, steps", before: String(ranges[0]), after: String(ranges[1]) }] : [])];
  // Draw the page
  return (
    <>
      {/* Title and day */}
      <Masthead title="Second try" section={home.section}>{plan ? <PlanNote plan={plan} /> : dayLabel(new Date(retry.createdAt), now)}</Masthead>
      {/* One column (both tries' numbers are in the table below) */}
      <div className="flex flex-1 flex-col md:max-w-2xl md:pt-8">
        {/* Main column */}
        <div className="flex flex-1 flex-col">
          {/* The change as one sentence */}
          <h1 className="mt-6 font-display text-statement font-semibold tracking-tight motion-safe:animate-rise md:mt-0 md:max-w-[18ch] md:text-statement-xl">{view.pauseWords || measureFor(original.focus)?.kind !== "fillers" ? retryHeadline(retry, original) : "Your second try is in."}</h1>
          {/* What the first try said to work on */}
          {cue && <p className="mt-4 max-w-[48ch] text-footnote text-ink-muted">You were working on: {cue}</p>}
          {/* The speaker's own call against the measure (decision 116) */}
          <RatingLine session={retry} all={all} />
          {/* Both tries' numbers, first then second (decision 67) */}
          <div className="mt-2"><BeforeAfterTable label="First and second try" first="First" second="Second" rows={changes} /></div>
          {/* The coach's notes on the retry */}
          {retry.feedback && <p className="mt-5 max-w-[48ch] text-lede">{retry.feedback.keep} {retry.feedback.change}</p>}
          {/* The first try's pitch under the second's, phrase by phrase (decision 111) */}
          {!retry.trimmedAt && takeScript.ready && <LastVsThisCard repo={repo} before={original} after={retry} kind="Second try" names={{ before: "First try", after: "Second try" }} plays={{ before: "Play first try", after: "Play second try" }} script={takeScript.script} />}
          {/* Listen back to the second try */}
          <div className="max-w-[48ch]"><Playback repo={repo} session={retry} onAudio={(element) => { audio.current = element; }} /></div>
          {/* How the second try's voice sounded (decision 111: the standard voice view on every take with pitch readings) */}
          <div className="max-w-[48ch]">{takeScript.ready && <TakeViews repo={repo} session={retry} sessions={all} usual={usual} fluency={view.fluency} pauseWords={view.pauseWords} script={takeScript.script} audio={() => audio.current} />}</div>
          {/* Where the second try's deeper analysis stands, said quietly (decision 91) */}
          <DeepNote repo={repo} sessionId={retry.id} now={now} />
          {/* Push the action down */}
          <div className="flex-1" />
          {/* Move on: the next step, or back to where it started (decision 67) */}
          <div className="mt-8">{plan ? <PlanBand plan={plan} /> : <ActionBand action="Done" aside={home.label.replace("Close, back to", "back to")} href={home.href} />}</div>
        </div>
      </div>
    </>
  );
}

// Draw the session page
export function SessionScreen({ sessionId, fetchFn, planStep = null, ...props }: SessionScreenProps) {
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
  // Whether pause words show and fluency is judged, from Settings (decision 79; shown until read)
  const [view, setView] = useState<ResultView>({ pauseWords: true, fluency: true });
  // The browser's reason when the session could not be read, so the page explains instead of staying empty
  const [loadError, setLoadError] = useState<string | null>(null);

  // Read the two settings once the date is known
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if closed first
    let cancelled = false;
    // Read them
    repo.getSettings(today).then((settings) => {
      // Keep them if still open
      if (!cancelled) setView({ pauseWords: pauseWordsShown(settings), fluency: fluencyJudged(settings) });
    }).catch(() => {
      // Keep showing pause words and fluency, as before Settings is read; the session's own load explains a storage problem
    });
    // Mark as closed
    return () => {
      // Stop the update
      cancelled = true;
    };
  }, [repo, today]);

  // Load the session (and its first try, for a retry) once the date is known
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore the result if the screen closes first
    let cancelled = false;
    // Read the session and, if it is a retry, its first try
    const load = async (): Promise<Loaded> => {
      // Read the session with its readings (kept apart since decision 98)
      const session = (await repo.getFullSession(sessionId)) ?? null;
      // Read the first try if this is a retry
      const original = session?.retryOf ? ((await repo.getFullSession(session.retryOf)) ?? null) : null;
      // Every session, to find an earlier take of the same prompt
      const all = session ? await repo.listSessions() : [];
      // The first earlier day's recording of this prompt, with its readings
      const thenTake = session ? earlierTake(all, session) : null;
      // (joined with its readings)
      const then = thenTake ? ((await repo.getFullSession(thenTake.id)) ?? thenTake) : null;
      // With its practice day number and this session's
      const earlier = session && then ? { then, thenDay: practiceDay(all, new Date(then.createdAt)), nowDay: practiceDay(all, new Date(session.createdAt)) } : null;
      // For a rehearsal, the talk
      const talk = session?.mode === "rehearse" ? ((await repo.getTalk(session.promptId)) ?? null) : null;
      // For a Q&A answer, the session its question came from
      const qaSource = session?.mode === "qa" ? ((await repo.getSession(session.promptId)) ?? null) : null;
      // The question's place in that session's list, if it is still there
      const qaIndex = qaSource?.questions && session?.question ? qaSource.questions.indexOf(session.question) : -1;
      // Hand them back
      // The speaker's usual pitch range, from their latest earlier recordings
      const usual = session ? usualRangeBefore(all, session) : null;
      // Hand them back
      return { session, original, earlier, talk, qaIndex: qaIndex >= 0 ? qaIndex : null, usual, all };
    };
    // Whether the session is on screen yet, so a later problem is explained beside it instead
    let shown = false;
    // Load, then ask the coach if feedback is still waiting
    (async () => {
      // Load the session
      const first = await load();
      // Show it if the screen is still open
      if (cancelled) return;
      // Show what was loaded
      setLoaded(first);
      // On screen now
      shown = true;
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
    })().catch((error: unknown) => {
      // Nothing to do once closed
      if (cancelled) return;
      // The browser's reason
      const reason = error instanceof Error ? error.message : String(error);
      // Shown already: the feedback step failed, so say so beside the session
      if (shown) setNote(`Feedback could not be saved on this device (${reason}). Your session is saved; reload the page to try again.`);
      // Not shown: explain on the page
      else setLoadError(reason);
    });
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
    loadDailyPlanLater(repo, today).then((loadedPlan) => {
      // Stop if closed
      if (cancelled) return;
      // The next step, if there is one
      const next = loadedPlan.steps[planStep];
      // Keep where this step sits
      setPlan({ step: planStep, total: loadedPlan.steps.length, next: next ? { href: planHref(next, planStep + 1), label: next.label } : null });
    }).catch(() => {
      // Without the plan, the page offers its usual way back instead of the next step
    });
    // Mark as closed when leaving
    return () => {
      // Stop the pending update
      cancelled = true;
    };
  }, [repo, today, planStep]);

  // Draw the page
  return (
    // One column on a phone, two on a computer; the results take their soft green surfaces (decision 69)
    <main id="main" data-area={loaded?.session ? "results" : undefined} className="mx-auto flex min-h-dvh max-w-6xl flex-col bg-paper-raised px-6 pt-6 md:px-14 md:pt-10">
      {/* Nothing yet while loading */}
      {loaded && !loaded.session && (
        <>
          {/* Title */}
          <Masthead title="Session" />
          {/* Explanation and a way back */}
          <p data-inline className="mt-6 text-lede text-ink-muted">This session is not on this device. <Link href="/history" className={TEXT_LINK}>Back to history</Link></p>
        </>
      )}
      {/* The session could not be read: why, and the way back */}
      {!loaded && loadError !== null && (
        <>
          {/* Title */}
          <Masthead title="Session" />
          {/* What happened */}
          <p role="alert" data-inline className="mt-6 max-w-[48ch] text-lede">This session could not be loaded. The browser said: “{loadError}” Reload the page to try again. <Link href="/history" className={TEXT_LINK}>Back to history</Link></p>
        </>
      )}
      {/* A retry with its first try */}
      {/* A voice drill or shadowing: its saved lines (decision 80) */}
      {loaded?.session?.mode === "voice" && today && <VoiceSessionView session={loaded.session} now={today} plan={plan} />}
      {/* A conversation with a persona: where, the share, the change and the turns (decisions 83 and 84) */}
      {loaded?.session?.mode === "conversation" && today && <ConversationSessionView session={loaded.session} now={today} note={note} plan={plan} />}
      {loaded?.session && loaded.session.mode !== "voice" && loaded.session.mode !== "conversation" && loaded.original && loaded.session.mode !== "smalltalk" && loaded.session.mode !== "story" && today && <RetryView repo={repo} retry={loaded.session} original={loaded.original} now={today} plan={plan} view={view} usual={loaded.usual} all={loaded.all} />}
      {/* A first try (or a retry whose first try is missing) */}
      {loaded?.session && loaded.session.mode !== "voice" && loaded.session.mode !== "conversation" && (!loaded.original || loaded.session.mode === "smalltalk" || loaded.session.mode === "story") && today && <FeedbackView repo={repo} session={loaded.session} original={loaded.session.mode === "story" ? loaded.original : null} now={today} note={note} earlier={loaded.earlier} rehearsed={loaded.talk} qaIndex={loaded.qaIndex} plan={plan} view={view} usual={loaded.usual} all={loaded.all} onReviewed={(updated) => {
        // Show the notes and the feedback
        setLoaded((previous) => (previous?.session ? { ...previous, session: { ...previous.session, ...updated } } : previous));
        // If the coach was waiting for the notes, ask it now
        if (note === FEEDBACK_NOTES["awaiting-notes"]) setAskAgain((count) => count + 1);
      }} />}
    </main>
  );
}
