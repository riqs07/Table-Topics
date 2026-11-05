"use client";
// One saved session: the Feedback screen for a first try, or the Retry result screen for a retry

// Load React's state and effect tools
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load Next.js's lazy loader, for the voice cards only some takes show (decisions 99 and 111)
import dynamic from "next/dynamic";
// Load the script-page building blocks
import { PRESS, PRIMARY, RowLink, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
import { Masthead } from "@/components/script/Masthead";
// Load focus mode's thin header (second pass)
import { PracticeBar } from "@/components/script/PracticeBar";
// Load the cast: your blob reacts, Sage gives the one note
import { Cast } from "@/components/scenes/Cast";
// Load what was said word by word, and the take's verdict
import { takeVerdict, takeWords } from "@/core/takeWords";
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
import { CARD, CARD_LIST, LAB, SECTION_HEADING } from "@/components/script/textStyles";
import { useCountUp } from "@/components/script/useCountUp";
// Load the then-and-now helpers
import { earlierTake, practiceDay } from "@/core/compare";
// Load the blob's reaction to a take (decision 141)
import { takeReaction } from "@/core/takeReaction";
import { PersonalBest } from "@/components/script/TakeReaction";
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
import { LOUDNESS_TICK_MS, formatClock, takeWindow, timingSentence } from "@/core/recordingRules";
// Load the focus-based headlines and numbers
import { headlineFor, headlineKind, measureFor, retryHeadline, retryNote } from "@/core/focusMeasure";
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
// Load the story beats, the retelling comparison and the templates (decisions 92 and 126)
import { beatsCompareRow, storyHeadline, templateBeatsOf } from "@/core/storyBeats";
// Load the checks for the stories you'll need (decision 152)
import { typeChecks } from "@/core/storyTypes";
import { retellHeadline, storyCompareRows } from "@/core/storyLibrary";
import { findStoryTemplate, momentIdOf } from "@/content/stories";
// Load the guided stories and the comparison with their facts (decision 93)
import { factsOf, findGuidedStory, type GuidedStory } from "@/content/guidedStories";
import { compareWithFacts } from "@/core/guidedStory";

// The take's views, chosen focus first (pitch in the words, the lenses, the fingerprint, the best moment, the energy arc), loaded once the page is up so the take's first download stays small (decisions 81, 99, 111 and 115)
const TakeViews = dynamic(() => import("@/components/script/TakeViews").then((module) => module.TakeViews), { ssr: false });
// Planned stress, loaded only for a take whose text has key words (decision 111)
const PlannedStressCard = dynamic(() => import("@/components/script/PlannedStressCard").then((module) => module.PlannedStressCard), { ssr: false });
// Last try and this try, loaded only where the same words were said twice (decision 111)
const LastVsThisCard = dynamic(() => import("@/components/script/LastVsThisCard").then((module) => module.LastVsThisCard), { ssr: false });
// The three rounds of a 4/3/2 loop compared, loaded only on a last round (decision 118)
const LoopResults = dynamic(() => import("@/components/script/LoopResults").then((module) => module.LoopResults), { ssr: false });

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

// A player for a session's saved audio (draws nothing if the audio is gone)
function Playback({ repo, session, onAudio }: { repo: Repository; session: FullSession; onAudio?: (element: HTMLAudioElement | null) => void }) {
  // The audio's address
  const url = useAudioUrl(repo, session.audioKey).url;
  // Nothing to play
  if (!url) return null;
  // The player, with a note when this is the baseline
  return (
    <div className={`px-4.5 py-3.5 ${CARD}`}>
      {/* The player */}
      <Player src={url} label="Your recording" name="your recording" durationSec={session.durationSec} onAudio={onAudio} gain={playbackGain(session.loudnessScale)} />
      {/* Small heading, under it: the first recording, or a kinder way to listen (decision 79) */}
      <p className="mt-2 text-footnote font-semibold text-ink-muted">{session.isBaseline ? "Your first recording. Progress is measured against it." : "Listen back the way a friendly coach would: most people dislike hearing their own voice."}</p>
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
  const window = takeWindow(session);
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
      <p className="text-lede">{timingSentence(session.mode, session.durationSec, undefined, session.promptId, session.story?.length, takeWindow(session))}</p>
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
  // Show the fillers in what was said: bring the words into view and move focus to them
  const showFillers = useCallback(() => {
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
  // The one change and its cue: the coach's, or the one picked from the numbers
  const change = session.feedback ?? ownChange;
  // Whether the take went well or was rough, from the numbers the change is picked from (never red; a rough take gets Sage's one note)
  const verdict = takeVerdict(session, ownChange, { pauseWords: view.pauseWords });
  // The retry's words
  const retryLabel = story ? "Tell it again" : "Try it again";
  // Inside today's practice, the way on: the next step, or finishing the day
  const onward = plan ? (plan.next ? { label: `Next: step ${plan.step + 1}`, href: plan.next.href } : { label: "Finish today’s practice", href: "/" }) : null;
  // The panel's one chunky button and one text link: inside the plan a good take moves on and a rough one tries again; a follow-up moves to the next one; an old warm-up leads to a response; otherwise the retry, and back
  const [primary, secondary] = onward ? (verdict === "good" ? [onward, { label: retryLabel, href: retryHref }] : [{ label: retryLabel, href: retryHref }, onward]) : next ? [{ label: `Next one · ${next.label}`, href: `/session?mode=smalltalk&prompt=${next.id}` }, { label: retryLabel, href: retryHref }] : warmup ? [{ label: "Now record a response", href: `/session?mode=response&prompt=${promptForDay(now).id}` }, { label: home.label.replace("Close, back to", "Back to"), href: home.href }] : [{ label: retryLabel, href: retryHref }, { label: story ? "Your stories" : home.label.replace("Close, back to", "Back to"), href: home.href }];
  // The pause words counted, for the chip
  const pauseCount = fillerCount(session);
  // The panel's one line: for a good take, what the coach said to keep or the blob's own word; for a rough one, Sage's one note
  // The blob's reaction to the take (decision 141)
  const reaction = takeReaction(session, all, view.pauseWords);
  // (its line)
  const verdictLine = verdict === "good" ? (session.feedback && !story ? session.feedback.keep : reaction.line) : change.change;
  // What was said, word by word, with pause words and real pauses marked
  const said = reading ? [] : takeWords(session);
  // Whether any real pause was found, for the legend
  const anyPause = said.some((word) => word.pauseAfter);
  // Draw the page
  return (
    <>
      {/* Focus mode's header: the way out, how far through today's practice, what this was and the step */}
      <PracticeBar close={{ href: home.href, label: home.label }} label={`${title}${plan ? ` · step ${plan.step} of ${plan.total}` : ""}`} progress={plan ? plan.step / Math.max(1, plan.total) : undefined} className="-mt-4 md:-mt-8" />
      {/* The take on the left, the verdict sliding in on the right (on a phone, the words, then the verdict as a sheet) */}
      <div className="flex flex-col gap-5 md:flex-row md:flex-wrap md:items-start md:gap-9 md:pt-4">
        {/* The take */}
        <section aria-labelledby="take-heading" className="flex min-w-0 flex-col gap-4.5 md:flex-[999_1_520px]">
          {/* What it was, how long, and when */}
          <p className={`${LAB} mt-3 md:mt-0`}>{title} · {formatClock(Math.round(session.durationSec))} · <span data-testid="recorded-day">{`Recorded ${dayLabel(new Date(session.createdAt), now).replace(/^(Today|Yesterday)$/, (day) => day.toLowerCase())}`}</span></p>
          {/* A take from the weekly check-in: which one, and the way to the check-ins (decision 100) */}
          {session.checkIn && <p className="-mt-2 text-footnote"><Link href="/check-in" className={TEXT_LINK}>{session.checkIn.week === 1 ? "Your first check-in" : `Check-in ${session.checkIn.week}`}</Link></p>}
          {/* What it answered, as the page's heading: the topic, prompt or question (decision 77), the text read, or the kind of take */}
          <h1 id="take-heading" className="font-display text-2xl leading-tight font-semibold md:text-4xl">{asked?.text ?? passage?.title ?? title}</h1>
          {/* What was said: pause words highlighted and real pauses as small green bars, or the passage marked for a reading */}
          <div ref={transcriptBlock} tabIndex={-1} role="region" aria-label="What you said" className={`flex scroll-mt-6 flex-col gap-3.5 px-5.5 py-5 outline-none md:px-6 ${CARD}`}>
            {/* The small label, saying how to hear a pause word when that works */}
            <p className={LAB}>{reading ? "As heard" : "What you said"}{!reading && view.pauseWords && canPlay && pauseCount > 0 && <span className="ml-2 font-bold tracking-normal normal-case">· tap a marked pause word to hear it</span>}</p>
            {/* The words */}
            {reading ? <MarkedPassage check={reading} /> : (
              <p className="text-lg leading-[1.75] md:text-xl">
                {/* Each word, a pause word marked, a real pause after it as a bar */}
                {said.map((word, index) => {
                  // A pause word's letters apart from any punctuation round them, so only the word is marked
                  const [, lead = "", core = word.text, tail = ""] = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(word.text) ?? [];
                  // When it was heard, if saved
                  const at = session.spokenTimes?.[index];
                  // One word
                  return (
                  <span key={index}>
                    {/* A pause word: a button that plays its moment where that works, else a highlight */}
                    {word.filler && view.pauseWords ? <>{lead}{canPlay && typeof at === "number" ? <button type="button" onClick={() => playAt(at)} aria-label={`Play “${core}” at ${formatClock(Math.floor(at))}`} className="rounded-md bg-art-sun/35 px-1 hover:bg-art-sun/55">{core}</button> : <mark className="rounded-md bg-art-sun/35 px-1 text-ink">{core}</mark>}{tail}</> : word.text}
                    {/* A real pause */}
                    {word.pauseAfter && <span role="img" aria-label="a real pause" className="mx-1.5 inline-block h-2.5 w-7.5 rounded-full bg-art-leaf align-middle" />}
                    {/* The space after it */}
                    {" "}
                  </span>
                  );
                })}
              </p>
            )}
            {/* What the marks mean */}
            {reading ? <p className="text-footnote text-ink-muted">Struck-through words were not heard. Some may be the speech service mishearing you rather than a skipped word.{reading.stoppedEarly ? " Dimmed words come after where you stopped." : ""}</p> : (
              <p className="flex flex-wrap gap-4.5 text-sm font-bold text-ink-muted">
                {/* Pause words */}
                {view.pauseWords && <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-4.5 rounded-[5px] bg-art-sun/35" />pause words</span>}
                {/* Real pauses, when word times were saved */}
                {anyPause && <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-4.5 rounded-[5px] bg-art-leaf" />a real pause</span>}
              </p>
            )}
          </div>
          {/* Listen back (then and now, when an earlier day answered the same) */}
          {earlier ? <ThenAndNow repo={repo} then={earlier.then} now={session} thenDay={earlier.thenDay} nowDay={earlier.nowDay} onNowAudio={(element) => { audio.current = element; }} pauseWords={view.pauseWords} /> : <Playback repo={repo} session={session} onAudio={(element) => { audio.current = element; }} />}
        </section>

        {/* The verdict: green with your happy blob for a good take, warm amber (never red) with your puzzled blob and Sage's one note for a rough one */}
        <aside aria-labelledby="verdict" data-verdict={verdict} className={`relative flex flex-col gap-3.5 rounded-[26px] px-6 pt-6 pb-5 max-md:-mx-4 max-md:mt-16 max-md:rounded-b-none max-md:px-5 max-md:pb-8 motion-safe:max-md:animate-sheet md:max-w-110 md:flex-[1_1_340px] motion-safe:md:animate-slide-in ${verdict === "good" ? "bg-accent-tint text-accent-tint-ink" : "bg-warm-tint text-warm-ink"}`}>
          {/* Your blob (and, after a rough take, Sage), peeking over the sheet's edge on a phone */}
          <div className="flex items-end gap-3 max-md:absolute max-md:-top-16 max-md:right-5">
            {/* Your blob */}
            {!quick && <span data-take-reaction={reaction.kind} className="flex"><Cast who="you" face={verdict === "good" ? "happy" : "wonder"} className="size-22 md:size-30" /></span>}
            {/* Sage, for the one note */}
            {verdict === "rough" && <Cast who="sage" mood="calm" className="size-18 md:size-21" />}
          </div>
          {/* The headline */}
          <h2 id="verdict" className="font-display text-4xl leading-none font-semibold">{verdict === "good" ? "That landed!" : "Good start."}</h2>
          {/* One line: what worked, or Sage's note in its own words */}
          <p className={`font-bold ${verdict === "rough" ? "italic" : "text-ink"} text-lg leading-snug`}>{verdict === "rough" ? <>“<span>{verdictLine}</span>”</> : verdictLine}</p>
          {/* A personal best: what it was, and before */}
          {!quick && <PersonalBest reaction={reaction} />}
          {/* The chips: time spoken, pause words, and the cue for next time */}
          <ul aria-label="This take" className="flex flex-wrap gap-2">
            {/* Time spoken */}
            <li className="rounded-xl bg-card px-3 py-1.5 text-sm font-extrabold text-ink">{formatClock(Math.round(session.durationSec))} spoken</li>
            {/* Pause words, when shown */}
            {view.pauseWords && !reading && <li className="rounded-xl bg-card px-3 py-1.5 text-sm font-extrabold text-ink">{pauseCount} pause {pauseCount === 1 ? "word" : "words"}</li>}
            {/* The cue */}
            <li className="rounded-xl bg-card px-3 py-1.5 text-sm font-extrabold text-ink">Next time: {change.retryCue}</li>
          </ul>
          {/* The one chunky button */}
          <Link href={primary.href} data-action-band className={`${PRIMARY} mt-2 w-full`}>{primary.label}</Link>
          {/* The one text link */}
          <Link href={secondary.href} className={`${TEXT_LINK} self-center uppercase tracking-[.04em] ${verdict === "good" ? "text-accent-tint-ink" : "text-warm-ink"}`}>{secondary.label}</Link>
        </aside>
      </div>

      {/* Below the fold: the deeper look at the take, nothing lost */}
      <section aria-labelledby="more-heading" className="mt-12 mb-10 flex flex-col md:max-w-2xl">
        {/* Heading */}
        <h2 id="more-heading" className={SECTION_HEADING}>A closer look</h2>
        {/* The focus number as a sentence (or the focus's name when no number measures it) */}
        {reading ? (
          <>
            {/* How much of the passage was read */}
            <h3 data-testid="reading-headline" className="mt-5 font-display text-3xl font-semibold">{lessonOutcome ? lessonOutcome.headline : session.mode === "pause" && passage ? (pauses ? pauseDrillSentence(pauses.count, countPauseMarks(passage.body)) : `The passage has ${countPauseMarks(passage.body)} pause marks.`) : session.mode === "rehearse" ? (reading.stoppedEarly ? `You covered the first ${reading.readTo} words of your script.` : `You covered ${reading.percentRead}% of your script.`) : reading.stoppedEarly ? `You read the first ${reading.readTo} words.` : `You read ${reading.percentRead}% of the words.`}</h3>
            {/* The detail */}
            <p className="mt-2 text-footnote text-ink-muted">{session.mode === "pause" || (lesson && lesson.check !== "clear-words") ? (reading.stoppedEarly ? `You read the first ${reading.readTo} words; ` : `You read ${reading.percentRead}% of the words; `) : ""}{reading.stoppedEarly ? `${reading.missedWithin} not heard in that stretch` : `${reading.missed} not heard`}{view.fluency ? `, ${reading.repeated} repeated` : ""}, {reading.extra} extra ({view.pauseWords ? "pause words and added words" : "added words"}).</p>
            {/* A lesson's tip, as a reminder */}
            {lesson && <p className="-ml-4 mt-4 border-l-2 border-accent pl-[14px] text-lede">Remember: {lesson.tip}</p>}
          </>
        ) : bookendOutcome ? (
          <>
            {/* The drill's main finding */}
            <h3 className="mt-5 font-display text-3xl font-semibold">{bookendOutcome.headline}</h3>
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
          // The focus number as a sentence, when one measures it
          headline && <h3 data-testid="focus-headline" className="mt-5 font-display text-3xl font-semibold">{headline}</h3>
        )}
        {/* When the headline is the fillers (so no fillers tile below), the way to see where they were */}
        {headline && shownHeadline === "fillers" && fillerCount(session) > 0 && !reading && <p><button type="button" onClick={showFillers} className={`${TEXT_LINK} text-footnote`}>Show where</button></p>}
        {/* The speaker's own call against the measure, when it was rated and the measure is confident (decision 116) */}
        <RatingLine session={session} all={all} />
        {/* A 4/3/2 loop's last round: the three rounds compared; an earlier round: which it was, and the way to the comparison (decision 118) */}
        {session.loop && (session.loop.round >= 3 ? <LoopResults repo={repo} session={session} all={all} pauseWords={view.pauseWords} /> : <LoopRoundNote session={session} all={all} />)}
        {/* The one change and the cue in full, with anything the coach added */}
        <div className={`mt-5 p-5 motion-safe:animate-rise ${CARD}`} style={{ animationDelay: "120ms" }}>
          {/* The pill that names it, and where it comes from until the coach's note arrives */}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="inline-flex rounded-full bg-warm-tint px-2.5 py-1 text-footnote font-semibold text-warm-ink">One change</span>{!session.feedback && <span className="text-footnote text-ink-muted">From your numbers</span>}</p>
          {/* The change */}
          {verdict === "good" && <p className="mt-3 text-lede">{change.change}</p>}
          {/* Small heading for the cue */}
          <p className="mt-4 text-footnote text-ink-muted">{warmup ? "Before your response" : story ? "Before you tell it again" : "Before you try again"}</p>
          {/* The cue */}
          <p className="mt-1 font-display text-cue font-semibold">{change.retryCue}</p>
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
        {/* A story's beats, as the coach heard them (decision 126) */}
        {story && <YourBeats session={session} />}
        {/* A story you'll need: what that kind needs, as the phone heard it (decision 152) */}
        {story && <TypeNeeds session={session} />}
        {/* A retold story: this telling beside the one before (decision 92) */}
        {story && original && <StoryBeforeAfter original={original} retold={session} pauseWords={view.pauseWords} />}
        {/* The same words told again: the last telling's pitch under this one's (decision 111) */}
        {story && original && !session.trimmedAt && <LastVsThisCard repo={repo} pauseWords={view.pauseWords} before={original} after={session} kind="Tell it again" names={{ before: `Last time, ${dayLabel(new Date(original.createdAt), now).replace(/^(Today|Yesterday)$/, (day) => day.toLowerCase())}`, after: "This time" }} plays={{ before: "Play last time", after: "Play this time" }} />}
        {/* A short speech's points (decision 77) */}
        <OutlinePoints session={session} />
        {/* While the coach's note is on its way, or why it will not come (never a setup instruction) */}
        {!session.feedback && (note || session.feedbackStatus === "failed") && <p className="mt-2 text-footnote text-ink-muted">{note || "The coach could not review this session."}</p>}
        {/* Star the take to keep its recording and charts (decision 98; a moment note and a few-second reply are kept apart and need none) */}
        {!quick && <StarToggle key={session.id} repo={repo} sessionId={session.id} starred={session.starred === true} />}
        {/* The numbers together */}
        {!quick && <NumbersRow session={session} pauseCount={pauses ? pauses.count : null} leaveOut={[...(headline && shownHeadline ? [shownHeadline] : []), ...(timed ? (["length"] as const) : []), ...(view.pauseWords ? [] : (["fillers"] as const))]} onShowFillers={reading ? null : showFillers} />}
        {/* One quiet line on what the counts are (decision 79) */}
        {!quick && !reading && <p className="mt-2 text-footnote text-ink-muted">{view.pauseWords ? "A few pause words (um, uh, like) are normal. Counts are rough: speech services can mishear accents." : "Counts are rough: speech services can mishear accents."}</p>}
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
        {/* After a short speech, how the timing went against its length */}
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
        {session.feedback && !story && verdict === "rough" && <p className="mt-5 text-lede"><em>What to keep.</em> <span>{session.feedback.keep}</span></p>}
        {/* One word swap from the coach's rubric, when it suggested one (decision 90) */}
        {wordSwap && <p className="mt-2 text-lede"><em>One word swap.</em> <span>“{wordSwap.said}” → “{wordSwap.stronger}”{wordSwap.why ? ` (${wordSwap.why})` : ""}</span></p>}
        {/* Where the take's deeper analysis stands, said quietly (decision 91) */}
        <DeepNote repo={repo} sessionId={session.id} now={now} />
        {/* Quieter options, as a short list of rows */}
        <ul aria-label="More options" className={`mt-6 divide-y divide-rule px-4 ${CARD}`}>
          {/* After a part of a full speech, the next part, or the speech's page after the last */}
          {speechPart && <li>{speechPart.part < speechPart.speech.partCount ? <RowLink href={`/session?mode=read&prompt=${partId(speechPart.speech, speechPart.part + 1)}`}>Read part {speechPart.part + 1}</RowLink> : <RowLink href={`/speech?id=${speechPart.speech.id}`}>That was the last part</RowLink>}</li>}
          {/* After a rehearsal, back to the talk and its plan */}
          {rehearsed && secondary.href !== home.href && <li><RowLink href={`/talk?id=${rehearsed.id}`}>Back to your talk</RowLink></li>}
          {/* After small talk, another question, back on its own page */}
          {smallTalk && !quick && <li><RowLink href={`/small-talk/unit?id=${findSmallTalk(session.promptId)?.unit ?? "answering"}`}>Another question</RowLink></li>}
          {/* Back to where it was started (outside today's practice; decision 67), unless the panel already leads there */}
          {!plan && !rehearsed && secondary.href !== home.href && <li><RowLink href={home.href}>{story ? "Your stories" : home.label.replace("Close, back to", "Back to")}</RowLink></li>}
          {/* Every measure of this take, on the profile (decision 90) */}
          <li><RowLink href={`/profile?session=${encodeURIComponent(session.id)}`}>See all measures for this take</RowLink></li>
        </ul>
      </section>
    </>
  );
}

// On an earlier round of a 4/3/2 loop: which round it was, and the way to the last round's comparison when it was told (decision 118)
function LoopRoundNote({ session, all }: { session: SessionRecord; all: ReadonlyArray<SessionRecord> }) {
  // The loop's last round, if it was told
  const last = all.find((other) => other.loop?.id === session.loop?.id && other.loop?.round === 3);
  // The note
  return <p data-loop-round className="mt-4 text-footnote text-ink-muted">Round {session.loop?.round} of 3, told three times.{last && <> <Link href={`/sessions?id=${encodeURIComponent(last.id)}`} className={TEXT_LINK}>See all three rounds</Link></>}</p>;
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
      <h3 className={`font-display text-3xl font-semibold ${unit === "answering" ? "mt-5" : "mt-4"}`}>{!reported ? "Which beats did you hit?" : count === 4 ? "All four beats." : `${count} of 4 beats.`}</h3>
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

// A told story's headline (decision 126): how the telling came across (against the one before, on a retelling; a guided story keeps its count of what was added, decision 93), what worked once the coach has answered, and for a guided story what was added beyond the facts (decision 93). The phone's rough checklist and the fixed beats are gone; the template's beats are in their own card below the change
function StoryHeard({ session, original, moment }: { session: FullSession; original: FullSession | null; moment: boolean }) {
  // The coach's story notes, once arrived
  const coach = session.feedback?.story;
  // A guided story, if it is one (decision 93)
  const guided = findGuidedStory(session.promptId);
  // Draw them
  return (
    <>
      {/* From a moment note: say so (a prompt from the bank is shown above instead) */}
      {moment && <p className="mt-5 text-footnote text-ink-muted md:mt-0">From your moment</p>}
      {/* The headline */}
      <h3 className={`font-display text-3xl font-semibold ${moment ? "mt-1" : "mt-5"}`}>{guided ? (original ? retellHeadline(original, session) : "What you added") : storyHeadline(session, original)}</h3>
      {/* What worked, once the coach has answered */}
      {session.feedback && <p data-story-worked className="mt-3 text-lede"><span className="mr-2 inline-flex rounded-full bg-accent/15 px-2.5 py-0.5 align-middle text-footnote font-semibold text-accent">What worked</span>{session.feedback.keep}</p>}
      {/* A guided story: what was added beyond the facts, and the facts kept (decision 93) */}
      {guided && <GuidedAdded story={guided} session={session} />}
      {/* For a guided story, the coach's word on how far the facts came to life (decision 93) */}
      {coach?.broughtToLife && <p data-brought-to-life className="mt-4 border-l-2 border-accent pl-3 text-lede"><span className="block text-footnote text-ink-muted">Beyond the facts, the coach heard</span>{coach.broughtToLife}</p>}
    </>
  );
}

// The template's beats as the coach heard them (decision 126): each one strong, weak or missing, with the words that showed it
function YourBeats({ session }: { session: FullSession }) {
  // The beats
  const beats = templateBeatsOf(session);
  // The template's names for them
  const template = findStoryTemplate(session.story?.template);
  // Nothing to show
  if (!beats) return null;
  // Each status's mark and look
  const looks = { strong: { mark: "✓", tile: "bg-fill text-fill-ink", word: "strong" }, weak: { mark: "!", tile: "bg-warm text-on-warm", word: "weak" }, missing: { mark: "–", tile: "bg-paper text-ink-muted", word: "missing" } } as const;
  // The card
  return (
    <section aria-labelledby="your-beats" data-your-beats className={`mt-5 p-5 ${CARD}`}>
      {/* Heading */}
      <h2 id="your-beats" className="font-semibold">Your beats <span className="font-normal text-ink-muted">· {template.name}</span></h2>
      {/* The beats */}
      <ol className="mt-3 flex flex-col gap-3">
        {beats.map((beat) => (
          // One beat
          <li key={beat.beat} data-beat={beat.beat} data-status={beat.status} className="flex items-start gap-3">
            {/* Its mark */}
            <span aria-hidden="true" className={`flex size-6 flex-none items-center justify-center rounded-full text-footnote font-semibold ${looks[beat.status].tile}`}>{looks[beat.status].mark}</span>
            {/* Its name, how it came across, and the words */}
            <span className="text-lede"><span>{template.beats.find((item) => item.id === beat.beat)?.name ?? beat.beat}</span><span className="sr-only">, {looks[beat.status].word}</span>{beat.quote && <span className="block text-footnote italic text-ink-muted">“{beat.quote}”</span>}</span>
          </li>
        ))}
      </ol>
      {/* The key */}
      <p aria-hidden="true" className="mt-3 flex gap-3 text-footnote text-ink-muted"><span>✓ strong</span><span>! weak</span><span>– missing</span></p>
    </section>
  );
}

// What a story you'll need needs, as the phone heard it (decision 152): two or three checks, each with the words that showed it or how to get it next time; nothing for the everyday templates
function TypeNeeds({ session }: { session: FullSession }) {
  // The template
  const template = findStoryTemplate(session.story?.template);
  // Its checks
  const checks = typeChecks(session.story?.template, session.transcript);
  // Nothing to show
  if (checks.length === 0) return null;
  // The card
  return (
    <section aria-labelledby="type-needs" data-type-needs={template.id} className={`mt-5 p-5 ${CARD}`}>
      {/* Heading */}
      <h2 id="type-needs" className="font-semibold">What a {template.name.toLowerCase()} needs</h2>
      {/* The checks */}
      <ul className="mt-3 flex flex-col gap-2">
        {/* Each check */}
        {checks.map((check) => (
          // One check: its mark, what it looks for, and the words or the note
          <li key={check.id} data-type-check={check.id} data-passed={check.passed} className="flex items-start gap-3">
            {/* Its mark */}
            <span aria-hidden="true" className={`flex size-6 flex-none items-center justify-center rounded-full text-footnote font-semibold ${check.passed ? "bg-fill text-fill-ink" : "bg-paper text-ink-muted"}`}>{check.passed ? "✓" : "–"}</span>
            {/* What it looks for, then the words or the note */}
            <span className="text-lede">{check.label}<span className="sr-only">{check.passed ? ": yes" : ": not yet"}</span>{check.evidence && <span className="block text-footnote text-ink-muted">{check.evidence}</span>}</span>
          </li>
        ))}
      </ul>
    </section>
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

// A retold story beside the telling before: what was being worked on, then the beats that came through (a guided story: what was added and the facts kept) and each number on both (decisions 92, 93 and 126; the same table as a second try's)
function StoryBeforeAfter({ original, retold, pauseWords }: { original: FullSession; retold: FullSession; pauseWords: boolean }) {
  // The cue the telling before gave
  const cue = (original.feedback ?? localChange(original)).retryCue;
  // The checks on both, then the usual numbers
  const rows = [...(findGuidedStory(retold.promptId) ? storyCompareRows(original, retold) : [beatsCompareRow(original, retold)].filter((row) => row !== null)), ...resultChanges(original, retold, { before: null, after: null }).filter((change) => pauseWords || change.label !== "pause words a minute")];
  // Draw it
  return (
    <section aria-label="Last time and this time" className="mt-5">
      {/* What it worked on */}
      {cue && <p className="max-w-[48ch] text-footnote text-ink-muted">You were working on: {cue}</p>}
      {/* The table */}
      <div className="mt-3"><BeforeAfterTable label="Last time and this time" first="Last time" second="This time" rows={rows} /></div>
    </section>
  );
}

// Both tries' numbers side by side, first then second (decision 67; shared by a second try and a retold story)
function BeforeAfterTable({ label, first, second, rows }: { label: string; first: string; second: string; rows: ReadonlyArray<{ label: string; before: string; after: string }> }) {
  // The table
  return (
    <table aria-label={label} className={`w-full overflow-hidden text-left ${CARD}`}>
      {/* The column names, as small capitals */}
      <thead className="text-xs font-extrabold tracking-[.07em] text-ink-muted uppercase">
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
          <tr key={row.label} className="border-t-2 border-rule">
            {/* What it counts */}
            <th scope="row" className="py-2.5 pl-5 text-footnote font-bold text-ink-muted">{row.label}</th>
            {/* First */}
            <td className="py-2.5 font-bold text-ink-muted">{row.before}</td>
            {/* Second */}
            <td className="py-2.5 pr-5 font-display text-cue font-semibold">{row.after}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// The address that records the same prompt once more, as a try after this one (its result compares the two)
function onceMoreHref(session: SessionRecord, plan: PlanNav | null): string {
  // The same kind, prompt and section, marked as a retry of this take
  return `/session?mode=${session.mode}&prompt=${encodeURIComponent(session.promptId)}${typeof session.sectionIndex === "number" ? `&section=${session.sectionIndex}` : ""}&retryOf=${session.id}${plan ? `&plan=${plan.step}` : ""}`;
}

// What was said on a take, word by word, pause words softly marked and real pauses as small green bars (the result's "What you said" card)
function SaidCard({ session, pauseWords }: { session: FullSession; pauseWords: boolean }) {
  // The words with their marks
  const said = takeWords(session);
  // Nothing heard
  if (said.length === 0) return null;
  // Whether any real pause was found, for the legend
  const anyPause = said.some((word) => word.pauseAfter);
  // The card
  return (
    <div role="region" aria-label="What you said" className={`flex flex-col gap-3.5 px-5.5 py-5 md:px-6 ${CARD}`}>
      {/* The small label */}
      <p className={LAB}>What you said</p>
      {/* The words */}
      <p className="text-lg leading-[1.75] md:text-xl">
        {/* Each word, a pause word marked, a real pause after it as a bar */}
        {said.map((word, index) => (
          // One word
          <span key={index}>
            {/* The word, highlighted when it is a pause word and they are shown */}
            {word.filler && pauseWords ? <mark className="rounded-md bg-art-sun/35 px-1 text-ink">{word.text}</mark> : word.text}
            {/* A real pause */}
            {word.pauseAfter && <span role="img" aria-label="a real pause" className="mx-1.5 inline-block h-2.5 w-7.5 rounded-full bg-art-leaf align-middle" />}
            {/* The space after it */}
            {" "}
          </span>
        ))}
      </p>
      {/* What the marks mean */}
      <p className="flex flex-wrap gap-4.5 text-sm font-bold text-ink-muted">
        {/* Pause words */}
        {pauseWords && <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-4.5 rounded-[5px] bg-art-sun/35" />pause words</span>}
        {/* Real pauses */}
        {anyPause && <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-4.5 rounded-[5px] bg-art-leaf" />a real pause</span>}
      </p>
    </div>
  );
}

// The Retry result screen (second pass, built from Desktop Screens "Result"): the change as the headline with both tries' numbers and what you said on the left, the verdict panel on the right with the one chunky way on
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
  // The change as one sentence (unless it would count pause words that are hidden; decision 79)
  const headline = view.pauseWords || measureFor(original.focus)?.kind !== "fillers" ? retryHeadline(retry, original) : "Your second try is in.";
  // When the number went the other way: a task-focused word, so the second try never reads as failure (person-focused feedback lowers persistence; playbook 6a)
  const otherWay = retryNote(retry, original);
  // The second try's own verdict, by the same rules as a first take, and turned rough when its number went the other way
  const verdict = otherWay ? "rough" : takeVerdict(retry, localChange(retry, view), { pauseWords: view.pauseWords });
  // The blob's reaction to the take (decision 141)
  const reaction = takeReaction(retry, all, view.pauseWords);
  // The panel's one line: why the number went the other way, the blob's own word for a good one, or the one change for next time
  const line = otherWay ?? (verdict === "good" ? reaction.line : (retry.feedback ?? localChange(retry, view)).change);
  // What it answered, shown over the headline
  const asked = answeredPrompt(retry);
  // The pause words counted, for the chip
  const pauseCount = fillerCount(retry);
  // The way on: inside today's practice the next step (or finishing the day), otherwise back to where it started (decision 67)
  const onward = plan ? (plan.next ? { label: `Next: step ${plan.step + 1}`, href: plan.next.href } : { label: "Finish today’s practice", href: "/" }) : { label: "Done", href: home.href };
  // Draw the page
  return (
    <>
      {/* Focus mode's header: the way out, how far through today's practice, what this was and the step */}
      <PracticeBar close={{ href: home.href, label: home.label }} label={`Second try${plan ? ` · step ${plan.step} of ${plan.total}` : ""}`} progress={plan ? plan.step / Math.max(1, plan.total) : undefined} className="-mt-4 md:-mt-8" />
      {/* The take on the left, the verdict sliding in on the right (on a phone, the take, then the verdict as a sheet) */}
      <div className="flex flex-col gap-5 md:flex-row md:flex-wrap md:items-start md:gap-9 md:pt-4">
        {/* The second try */}
        <section aria-labelledby="retry-heading" className="flex min-w-0 flex-col gap-4.5 md:flex-[999_1_520px]">
          {/* What it was, how long, and when */}
          <p className={`${LAB} mt-3 md:mt-0`}>Second try · {formatClock(Math.round(retry.durationSec))} · {plan ? `Today’s practice · step ${plan.step} of ${plan.total}` : `Recorded ${dayLabel(new Date(retry.createdAt), now).replace(/^(Today|Yesterday)$/, (day) => day.toLowerCase())}`}</p>
          {/* What it answered, quietly */}
          {asked && <p className="-mt-2 font-display text-xl leading-snug font-semibold text-ink-muted">{asked.text}</p>}
          {/* The change as one sentence: the page's heading */}
          <h1 id="retry-heading" className="font-display text-3xl leading-tight font-semibold motion-safe:animate-rise md:text-4xl">{headline}</h1>
          {/* What the first try said to work on */}
          {cue && <p className="-mt-1 font-bold text-ink-muted">You were working on: {cue}</p>}
          {/* The speaker's own call against the measure (decision 116) */}
          <RatingLine session={retry} all={all} />
          {/* Both tries' numbers, first then second (decision 67) */}
          <BeforeAfterTable label="First and second try" first="First" second="Second" rows={changes} />
          {/* What was said this time */}
          <SaidCard session={retry} pauseWords={view.pauseWords} />
          {/* Listen back to the second try */}
          <Playback repo={repo} session={retry} onAudio={(element) => { audio.current = element; }} />
        </section>

        {/* The verdict: green with your happy blob, or warm amber (never red) with your puzzled blob and Sage when the number went the other way */}
        <aside aria-labelledby="retry-verdict" data-verdict={verdict} className={`relative flex flex-col gap-3.5 rounded-[26px] px-6 pt-6 pb-5 max-md:-mx-4 max-md:mt-16 max-md:rounded-b-none max-md:px-5 max-md:pb-8 motion-safe:max-md:animate-sheet md:max-w-110 md:flex-[1_1_340px] motion-safe:md:animate-slide-in ${verdict === "good" ? "bg-accent-tint text-accent-tint-ink" : "bg-warm-tint text-warm-ink"}`}>
          {/* Your blob (and Sage, after a rough one), peeking over the sheet's edge on a phone */}
          <div className="flex items-end gap-3 max-md:absolute max-md:-top-16 max-md:right-5">
            {/* Your blob */}
            <span data-take-reaction={reaction.kind} className="flex"><Cast who="you" face={verdict === "good" ? "happy" : "wonder"} className="size-22 md:size-30" /></span>
            {/* Sage, for the one note */}
            {verdict === "rough" && <Cast who="sage" mood="encouraging" className="size-18 md:size-21" />}
          </div>
          {/* The headline */}
          <h2 id="retry-verdict" className="font-display text-4xl leading-none font-semibold">{verdict === "good" ? "That landed!" : "Keep the cue."}</h2>
          {/* One line: what worked, or the note */}
          <p className={`font-bold ${verdict === "rough" ? "" : "text-ink"} text-lg leading-snug`}>{line}</p>
          {/* A personal best: what it was, and before */}
          <PersonalBest reaction={reaction} />
          {/* The chips: time spoken and pause words this time */}
          <ul aria-label="This try" className="flex flex-wrap gap-2">
            {/* Time spoken */}
            <li className="rounded-xl bg-card px-3 py-1.5 text-sm font-extrabold text-ink">{formatClock(Math.round(retry.durationSec))} spoken</li>
            {/* Pause words, when shown */}
            {view.pauseWords && <li className="rounded-xl bg-card px-3 py-1.5 text-sm font-extrabold text-ink">{pauseCount} pause {pauseCount === 1 ? "word" : "words"}</li>}
          </ul>
          {/* The one chunky button: the way on */}
          <Link href={onward.href} data-action-band className={`${PRIMARY} mt-2 w-full`}>{onward.label}{!plan && <span className="sr-only">, {home.label.replace("Close, back to", "back to")}</span>}</Link>
          {/* The one text link: once more, compared with this try */}
          <Link href={onceMoreHref(retry, plan)} className={`${TEXT_LINK} self-center uppercase tracking-[.04em] ${verdict === "good" ? "text-accent-tint-ink" : "text-warm-ink"}`}>Try it once more</Link>
        </aside>
      </div>

      {/* Below: the deeper look at the second try */}
      <section aria-labelledby="retry-more" className="mt-12 mb-10 flex flex-col gap-4 md:max-w-2xl">
        {/* Heading */}
        <h2 id="retry-more" className={SECTION_HEADING}>A closer look</h2>
        {/* The coach's notes on the retry */}
        {retry.feedback && <p className="text-lede">{retry.feedback.keep} {retry.feedback.change}</p>}
        {/* The first try's pitch under the second's, phrase by phrase (decision 111) */}
        {!retry.trimmedAt && takeScript.ready && <LastVsThisCard repo={repo} pauseWords={view.pauseWords} before={original} after={retry} kind="Second try" names={{ before: "First try", after: "Second try" }} plays={{ before: "Play first try", after: "Play second try" }} script={takeScript.script} />}
        {/* How the second try's voice sounded (decision 111: the standard voice view on every take with pitch readings) */}
        {takeScript.ready && <TakeViews repo={repo} session={retry} sessions={all} usual={usual} fluency={view.fluency} pauseWords={view.pauseWords} script={takeScript.script} audio={() => audio.current} />}
        {/* Where the second try's deeper analysis stands, said quietly (decision 91) */}
        <DeepNote repo={repo} sessionId={retry.id} now={now} />
        {/* Quieter options */}
        <ul aria-label="More options" className={`mt-2 divide-y divide-rule px-4 ${CARD}`}>
          {/* The first try */}
          <li><RowLink href={`/sessions?id=${encodeURIComponent(original.id)}`}>See your first try</RowLink></li>
          {/* Every measure of this take, on the profile (decision 90) */}
          <li><RowLink href={`/profile?session=${encodeURIComponent(retry.id)}`}>See all measures for this take</RowLink></li>
        </ul>
      </section>
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
      {/* Not on this device, or could not be read: the main navigation, then a card with your puzzled blob, what happened and the way to your takes (the result's verdict card, extrapolated) */}
      {((loaded && !loaded.session) || (!loaded && loadError !== null)) && (
        <>
          {/* Title, with the main navigation */}
          <Masthead title="Your take" />
          {/* The card */}
          <section aria-labelledby="missing-heading" className={`mt-6 flex max-w-xl flex-col items-center gap-4 px-6 py-8 text-center md:mt-10 ${CARD}`}>
            {/* Your blob, puzzled */}
            <Cast who="you" face="wonder" className="size-28" />
            {/* What happened, as the page's heading */}
            <h1 id="missing-heading" className="font-display text-3xl leading-tight font-semibold">{loaded ? "This take isn’t here." : "This take could not be loaded."}</h1>
            {/* Why, and what to do */}
            {loaded ? <p data-inline className="max-w-[44ch] text-lede text-ink-muted">This session is not on this device. Takes stay in the browser they were recorded in, and a deleted take is gone for good.</p> : <p role="alert" data-inline className="max-w-[44ch] text-lede">The browser said: “{loadError}” Reload the page to try again.</p>}
            {/* The way to your takes */}
            <Link href="/history" className={`${PRIMARY} mt-2 w-full max-w-xs`}>Back to history</Link>
            {/* Or Today */}
            <Link href="/" className={TEXT_LINK}>Back to Today</Link>
          </section>
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
