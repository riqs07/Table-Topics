"use client";
// The History screen: progress since the first recording, one trend line, and every session like a contents page. Second design pass, storyboard "Your takes": the blob beside the title, pill filters, each take a row with its tile, its name in the display face and a star when kept; the empty page as a card with the sleeping blob and one chunky button

// Load React's state, effect and memo tools
import { useEffect, useMemo, useState } from "react";
// Load the pause-word setting rule and the clock formatter
import { pauseWordsShown } from "@/core/pauseWords";
import { formatClock } from "@/core/recordingRules";
// Load the small-talk questions
import { responseLabel } from "@/content/smallTalk";
// Load the missions and their rules
import { findMission } from "@/content/missions";
import { betterThanFeared, triedMissions } from "@/core/missions";
// Load the filter that leaves out private moment notes
import { practiceSessions } from "@/core/sessionHome";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
// Load the page title with its picture
import { PictureTitle } from "@/components/script/PictureTitle";
// Load the back arrow and the star
import { CaretLeftIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
// Load the Chart Kit's line over time
import { OverWeeks } from "@/components/charts/OverWeeks";
// Load the blob as a character
import { Buddy } from "@/components/scenes/Buddy";
// Load the filled button link
import { PRESS, PrimaryLink, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the prompt library
import { BOOKENDS, findPrompt } from "@/content/prompts";
// Load the voice drills and passages, for naming them (decision 80)
import { VOICE_MODE_NAMES, findShadowPassage, findVoiceDrill } from "@/content/voice";
// Load the conversation personas, to name who a conversation was with (decision 83)
import { findPersona } from "@/content/conversations";
// Load the names of every text to read (without the full speeches' text)
import { readingTitle } from "@/content/readingIndex";
// Load the lesson lookup
import { findLesson } from "@/content/lessons";
// Load the story seeds: bank prompts and guided stories (decisions 92 and 93)
import { seedText } from "@/content/stories";
// Load the sentence builders
import { dayLabel, formatRate, progressSentence } from "@/core/copy";
// Load the progress calculations
import { baselineProgress, historyRows, trendSeries, type HistoryRow } from "@/core/progress";
// Load the session record type
import type { MissionRecord, SessionRecord } from "@/data/records";
// Load the tiny fingerprint (decision 115)
import { MiniFingerprint } from "@/components/script/MiniFingerprint";
// Load the shared heading look
import { CARD, CARD_LIST, LAB, SECTION_HEADING } from "@/components/script/textStyles";
// Load the mode tiles and each take's (second design pass, storyboard 30)
import { ModeTile } from "@/components/scenes/ModeTile";
import { takeLook } from "@/components/screens/MeTop";
// Load the blob character, for the empty page (decision 134)
import { BlobCharacter } from "@/components/script/BlobFace";

// What the list can show (decision 79)
type HistoryFilter = "all" | "speaking" | "reading";
// The choices, in order
const HISTORY_FILTERS: ReadonlyArray<{ id: HistoryFilter; name: string }> = [{ id: "all", name: "All" }, { id: "speaking", name: "Speaking" }, { id: "reading", name: "Reading aloud" }];
// Kinds of session that read a text (a passage, a pause drill, a lesson's text, or the user's own script)
const READING_MODES: ReadonlyArray<SessionRecord["mode"]> = ["read", "pause", "lesson", "rehearse"];

// Rows shown at first, and added by each "Show more" (decision 99: drawing thousands of rows at once froze the page)
export const HISTORY_PAGE = 50;

// The trend of pause words a minute, one point per first try, in the Chart Kit's line (the first value as a dashed ghost across), with a caption and the values at each end
function Trend({ values }: { values: number[] }) {
  // Each try as a point: "First" and "Latest" at the ends, the others named by an invisible mark so each stays apart (only the ends are written along the bottom)
  const points = values.map((value, index) => ({ label: index === 0 ? "First" : index === values.length - 1 ? "Latest" : "\u200b".repeat(index), value }));
  // The labels' places, so a point's tip can say which try it was
  const places = new Map(points.map((point, index) => [point.label, index + 1]));
  // Draw it inside a captioned figure
  return (
    <figure aria-label="Pause words a minute, first try of each session" className="mt-5">
      {/* What the line measures */}
      <figcaption className="text-footnote font-semibold text-ink-muted">Pause words (um, uh, like) a minute, first try of each session. Fewer is smoother.</figcaption>
      {/* The line */}
      <div className="mt-3"><OverWeeks weeks={points} format={formatRate} tip={(point) => `Try ${places.get(point.label) ?? ""}: ${point.value === null ? "none" : formatRate(point.value)}`} listLabel="Pause words a minute by try" label={`Pause words a minute, from ${formatRate(values[0] ?? 0)} to ${formatRate(values.at(-1) ?? 0)}`} ghostName="first" /></div>
      {/* The values at each end */}
      <p className="mt-1 flex justify-between gap-3 text-footnote text-ink-muted">
        {/* Where it started */}
        <span>{`First: ${formatRate(values[0] ?? 0)} a minute`}</span>
        {/* Where it is now */}
        <span className="text-right font-bold text-ink">{`Latest: ${formatRate(values.at(-1) ?? 0)} a minute`}</span>
      </p>
    </figure>
  );
}

// Find a prompt's text by id (talk titles come from the user's saved talks); Me's latest takes name them the same way
export function promptText(session: SessionRecord, talkTitles: ReadonlyMap<string, string>): string {
  // The first recording is named as such
  if (session.isBaseline) return "Your first recording";
  // Look up the prompt, falling back to a plain label
  const text = findPrompt(session.promptId)?.text ?? "A prompt";
  // A check-in's pitch, by its part's name (decision 100)
  if (session.checkIn?.part === "pitch") return "Check-in: elevator pitch";
  // Free talk and a short speech (decision 73)
  if (session.mode === "free") return "Free talk";
  // A short speech, by its topic
  if (session.mode === "outline") return `Short speech: ${session.outline?.topic ?? "your topic"}`;
  // Mark warm-ups so they read differently from full sessions
  if (session.mode === "warmup") return `Warm-up: ${text}`;
  // Mark Rapid Fire answers the same way (once called Table Topics; decision 85)
  if (session.mode === "talk") return `Rapid Fire: ${text}`;
  // And readings, by their title (a part of a full speech says which part)
  if (session.mode === "read") return `Read aloud: ${readingTitle(session.promptId) ?? text}`;
  // And pause drills
  if (session.mode === "pause") return `Pause drill: ${text}`;
  // And voice drills and shadowing, by their kind and name (decision 80)
  if (session.mode === "voice") return `${session.voice ? VOICE_MODE_NAMES[session.voice.kind] : "Voice drill"}: ${(session.voice?.kind === "shadow" ? findShadowPassage(session.promptId)?.title : findVoiceDrill(session.promptId)?.title) ?? "a drill"}`;
  // And told stories, by their prompt's title (decision 92)
  if (session.mode === "story") return `${session.retryOf ? "Story, told again" : "Story"}: ${seedText(session.promptId)?.title ?? "from your moment"}`;
  // And conversations, by who they were with (decision 83)
  if (session.mode === "conversation") return `Conversation with ${findPersona(session.promptId)?.name ?? "someone"}`;
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
    // Its unit's word and what was said, a long story, moment or situation cut short
    return responseLabel(session.promptId) ?? `Small talk: ${text}`;
  }
  // And prepared speeches
  return session.mode === "response" ? `Prepared speech: ${text}` : text;
}

// One line of the contents: day, prompt, dotted leader, result
function Row({ row, now, talkTitles, pauseWords }: { row: HistoryRow; now: Date; talkTitles: ReadonlyMap<string, string>; pauseWords: boolean }) {
  // First try's rate, and the retry's if there was one (or the length, when pause words are hidden; decision 79)
  const result = !pauseWords ? formatClock(row.session.durationSec) : row.retry ? `${formatRate(row.session.fillersPerMinute)}, then ${formatRate(row.retry.fillersPerMinute)}` : formatRate(row.session.fillersPerMinute);
  // Its tile
  const look = takeLook(row.session);
  // A link to the session: its tile, then the words
  return (
    <li>
      <Link href={`/sessions?id=${row.session.id}`} className={`flex min-h-14 items-center gap-3 py-3 hover:text-accent ${PRESS}`}>
        {/* The take's tile, still (second design pass) */}
        <ModeTile ground={look.ground} prop={look.prop} face={look.face} still className="size-12" />
        {/* The prompt, with the day under it (decision 79: rows in a card, no dotted leader) */}
        <span className="min-w-0 flex-1">
          {/* The prompt */}
          <span className="block font-display text-lg leading-snug font-semibold">{promptText(row.session, talkTitles)}{row.session.starred && <StarIcon aria-label="kept" weight="fill" className="ml-1.5 inline size-4 align-middle text-art-sun" />}</span>
          {/* The day, and whether it was tried twice */}
          <span className="block text-sm font-bold text-ink-muted">{dayLabel(new Date(row.session.createdAt), now)}{row.retry ? " · tried twice" : ""}</span>
          {/* The take's shape, when one is kept (decision 115) */}
          {row.session.fingerprint && <span className="mt-1 block"><MiniFingerprint value={row.session.fingerprint} duration={row.session.durationSec} /></span>}
        </span>
        {/* The result, with its unit */}
        <span className="flex-none text-right"><span className="block font-display text-lg font-semibold tabular-nums">{result}</span><span className="block text-footnote text-ink-muted">{pauseWords ? <><span className="sm:hidden">a minute</span><span className="hidden sm:inline">pause words a minute</span></> : "long"}</span></span>
      </Link>
    </li>
  );
}

// The History page on its own (reached from your progress, the profile, and from Today; decisions 56 and 109)
export function HistoryScreen(props: ScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // Draw the page
  return (
    // One column on a phone, margin plus main column on a computer
    <main id="main" className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 pb-10 md:px-14 md:pt-10">
      {/* The area it sits in, your progress, with the settings gear marked (decision 109) */}
      <Masthead title="Me" section="settings" />
      {/* The way back to Me, where it is reached from (decision 109) */}
      <p className="mt-2 md:-mt-12"><Link href="/profile" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote`}><CaretLeftIcon aria-hidden="true" className="size-4" />Back to Me</Link></p>
      {/* The page's name, as its main heading (also in the empty state; second design pass: "Your takes") */}
      <PictureTitle title="Your takes" picture={<Buddy face="happy" className="size-14 md:size-18" />} />
      {/* The history itself */}
      <HistoryContent repo={repo} today={today} />
    </main>
  );
}

// History's content: progress, every first try, and real conversations (drawn on the History page and inside Settings)
export function HistoryContent({ repo, today }: { repo: Repository; today: Date | null }) {
  // Saved sessions, once loaded
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  // Titles of the user's saved talks, by id, for naming rehearsals
  const [talkTitles, setTalkTitles] = useState<ReadonlyMap<string, string>>(new Map());
  // Mission tries, oldest first
  const [missions, setMissions] = useState<MissionRecord[]>([]);
  // Which sessions the list shows: all, speaking, or reading aloud (decision 79)
  const [show, setShow] = useState<HistoryFilter>("all");
  // How many rows are drawn (more with each "Show more"; back to one page when the filter changes)
  const [limit, setLimit] = useState(HISTORY_PAGE);
  // Whether pause words are counted (decision 79; counted until Settings is read)
  const [pauseWords, setPauseWords] = useState(true);

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
    // Load the mission tries
    repo.getSettings(today).then((settings) => {
      // Keep them if the screen is still open
      if (!cancelled) setMissions(settings.missions ?? []);
      // And whether pause words are counted
      if (!cancelled) setPauseWords(pauseWordsShown(settings));
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

  // Work out progress once per list of sessions (not on every tap of a filter)
  const progress = useMemo(() => (sessions ? baselineProgress(sessions) : null), [sessions]);
  // Trend values, the same way
  const trend = useMemo(() => (sessions ? trendSeries(sessions) : []), [sessions]);
  // Every row, the same way
  const allRows = useMemo(() => (sessions ? historyRows(sessions) : []), [sessions]);
  // The rows of the chosen kind
  const rows = useMemo(() => allRows.filter((row) => show === "all" || (show === "reading") === READING_MODES.includes(row.session.mode)), [allRows, show]);
  // The first recording, for the listen link
  const baseline = useMemo(() => sessions?.find((session) => session.isBaseline), [sessions]);

  // Draw it
  return (
    <div>
      {/* Empty state */}
      {sessions && sessions.length === 0 && (
        <div className={`mt-6 flex flex-wrap items-center gap-5 p-5 md:max-w-3xl md:p-6 ${CARD}`}>
          {/* The blob, asleep until there is something to show (decision 134) */}
          <BlobCharacter mood="sleepy" className="size-24 flex-none md:size-28" />
          {/* What will appear, and the one thing to do */}
          <div className="min-w-0 flex-[1_1_16rem]">
            {/* The small label */}
            <p className={LAB}>No takes yet</p>
            {/* What will appear */}
            <p className="mt-1 font-display text-xl leading-snug font-semibold">Nothing here yet. Your first recording will start the page.</p>
            {/* The one thing to do */}
            <p className="mt-4"><PrimaryLink href="/session?mode=free&prompt=free">Record your first session</PrimaryLink></p>
          </div>
        </div>
      )}

      {/* Progress and sessions */}
      {sessions && sessions.length > 0 && today && (
        <div className="md:grid md:grid-cols-[280px_minmax(0,1fr)] md:gap-14 md:pt-8">
          {/* Progress (top on a phone, margin on a computer) */}
          <aside className={`mt-5 self-start p-5 md:mt-0 ${CARD}`}>
            {/* The small label */}
            <p className={LAB}>Since day 1</p>
            {/* Progress as one sentence, or a note that there is only one recording so far */}
            <h2 className="mt-1 font-display text-cue font-semibold">{!pauseWords ? `${rows.length} ${rows.length === 1 ? "session" : "sessions"} so far.` : progress ? progressSentence(progress) : "Your first recording is in. Progress shows from your second."}</h2>
            {/* The trend, once there are two first tries (it counts pause words, so not when they are hidden) */}
            {pauseWords && trend.length >= 2 && <Trend values={trend} />}
            {/* Listen to the first recording, if its audio is kept */}
            {baseline?.audioKey && (
              <p className="mt-4 text-footnote">
                <Link href={`/sessions?id=${baseline.id}`} className={TEXT_LINK}>Listen to your first recording</Link>
              </p>
            )}
          </aside>
          {/* The list, with a choice of what it shows */}
          <div className="mt-6 md:mt-0">
            {/* All, speaking, or reading aloud */}
            <div role="group" aria-label="Show" className="flex flex-wrap gap-2 text-footnote">
              {/* One pill per choice (second design pass) */}
              {HISTORY_FILTERS.map((choice) => <button key={choice.id} type="button" aria-pressed={show === choice.id} onClick={() => { setShow(choice.id); setLimit(HISTORY_PAGE); }} className={`min-h-11 rounded-full border-2 px-4.5 font-extrabold ${PRESS} ${show === choice.id ? "border-fill bg-fill text-fill-ink shadow-chunky-pressed" : "border-rule bg-card text-ink shadow-ledge hover:border-ink-muted"}`}>{choice.name}</button>)}
            </div>
            {/* The contents list */}
            <ul aria-label="Sessions" className={`mt-3 ${CARD_LIST}`}>
              {/* One row per first try, newest first, a page at a time */}
              {rows.slice(0, limit).map((row) => <Row key={row.session.id} row={row} now={today} talkTitles={talkTitles} pauseWords={pauseWords} />)}
              {/* Nothing of this kind yet */}
              {rows.length === 0 && <li className="py-4 text-ink-muted">Nothing of this kind yet.</li>}
            </ul>
            {/* More rows, a page at a time, saying how many are shown */}
            {rows.length > limit && (
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                {/* Add the next page */}
                <button type="button" onClick={() => setLimit((shown) => shown + HISTORY_PAGE)} className={SECONDARY}>Show more</button>
                {/* How many are shown */}
                <span className="text-footnote text-ink-muted">Showing {limit} of {rows.length}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Real conversations: missions tried, against what was expected */}
      {today && triedMissions(missions).length > 0 && (
        <section aria-labelledby="real-conversations" className="mt-10 md:max-w-2xl">
          {/* Run-in heading */}
          <h2 id="real-conversations" className={SECTION_HEADING}>Real conversations</h2>
          {/* The headline */}
          <p className="mt-2 text-lede">{triedMissions(missions).length} {triedMissions(missions).length === 1 ? "mission" : "missions"} tried; {betterThanFeared(missions).better} went better than you expected.</p>
          {/* Each try */}
          <ul className={`mt-2 ${CARD_LIST}`}>
            {/* One try */}
            {triedMissions(missions).map((record) => (
              // The task, the day, and expected against actual
              <li key={record.id} className="py-3">
                {/* The day and the numbers */}
                <span className="block text-footnote text-ink-muted">{dayLabel(new Date(record.debriefedAt ?? record.day), today)} · {record.predicted !== null ? `expected ${record.predicted} of 5, ` : ""}went {record.outcome} of 5</span>
                {/* The task */}
                <span className="block">{findMission(record.missionId)?.task ?? "A mission"}</span>
                {/* What they noticed */}
                {record.note && <span className="block text-footnote text-ink-muted">“{record.note}”</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
