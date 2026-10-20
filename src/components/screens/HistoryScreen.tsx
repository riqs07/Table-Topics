"use client";
// The History screen: progress since the first recording, one trend line, and every session like a contents page

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load the pause-word setting rule and the clock formatter
import { pauseWordsShown } from "@/core/pauseWords";
import { formatClock } from "@/core/recordingRules";
// Load the small-talk questions
import { findSmallTalk, findUnit } from "@/content/smallTalk";
// Load the missions and their rules
import { findMission } from "@/content/missions";
import { betterThanFeared, triedMissions } from "@/core/missions";
// Load the filter that leaves out private moment notes
import { practiceSessions } from "@/core/sessionHome";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
// Load the filled button link
import { PRESS, PrimaryLink, TEXT_LINK } from "@/components/script/Buttons";
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
// Load the lookup for every text to read, full speeches included
import { findReading } from "@/content/readings";
// Load the lesson lookup
import { findLesson } from "@/content/lessons";
// Load the sentence builders
import { dayLabel, formatRate, progressSentence } from "@/core/copy";
// Load the progress calculations
import { baselineProgress, historyRows, trendSeries, type HistoryRow } from "@/core/progress";
// Load the session record type
import type { MissionRecord, SessionRecord } from "@/data/records";
// Load the shared heading look
import { CARD, SECTION_HEADING, CARD_LIST } from "@/components/script/textStyles";

// What the list can show (decision 79)
type HistoryFilter = "all" | "speaking" | "reading";
// The choices, in order
const HISTORY_FILTERS: ReadonlyArray<{ id: HistoryFilter; name: string }> = [{ id: "all", name: "All" }, { id: "speaking", name: "Speaking" }, { id: "reading", name: "Reading aloud" }];
// Kinds of session that read a text (a passage, a pause drill, a lesson's text, or the user's own script)
const READING_MODES: ReadonlyArray<SessionRecord["mode"]> = ["read", "pause", "lesson", "rehearse"];

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
    <figure aria-label="Pause words a minute, first try of each session" className="mt-5">
      {/* What the line measures */}
      <figcaption className="text-footnote text-ink-muted">Pause words (um, uh, like) a minute, first try of each session. Fewer is smoother.</figcaption>
      {/* The drawing, stretched to the column */}
      <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} preserveAspectRatio="none" className="mt-3 h-20 w-full text-accent" role="img" aria-label={`Pause words a minute, from ${formatRate(values[0] ?? 0)} to ${formatRate(values.at(-1) ?? 0)}`}>
        {/* A soft area under the line (decision 79) */}
        <polygon points={`0,${CHART.height} ${points} ${CHART.width},${CHART.height}`} fill="currentColor" fillOpacity="0.1" />
        {/* Dotted guide at the first recording's value */}
        <line x1="0" x2={CHART.width} y1={y(values[0] ?? 0)} y2={y(values[0] ?? 0)} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
        {/* The trend line */}
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* The values at each end */}
      <p className="mt-1 flex justify-between text-footnote text-ink-muted">
        {/* Where it started */}
        <span>{`First: ${formatRate(values[0] ?? 0)} a minute`}</span>
        {/* Where it is now */}
        <span className="font-semibold text-ink">{`Latest: ${formatRate(values.at(-1) ?? 0)} a minute`}</span>
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
  // Free talk and a short speech (decision 73)
  if (session.mode === "free") return "Free talk";
  // A short speech, by its topic
  if (session.mode === "outline") return `Short speech: ${session.outline?.topic ?? "your topic"}`;
  // Mark warm-ups so they read differently from full sessions
  if (session.mode === "warmup") return `Warm-up: ${text}`;
  // Mark Rapid Fire answers the same way (once called Table Topics; decision 85)
  if (session.mode === "talk") return `Rapid Fire: ${text}`;
  // And readings, by their title (a part of a full speech says which part)
  if (session.mode === "read") return `Read aloud: ${findReading(session.promptId)?.title ?? text}`;
  // And pause drills
  if (session.mode === "pause") return `Pause drill: ${text}`;
  // And voice drills and shadowing, by their kind and name (decision 80)
  if (session.mode === "voice") return `${session.voice ? VOICE_MODE_NAMES[session.voice.kind] : "Voice drill"}: ${(session.voice?.kind === "shadow" ? findShadowPassage(session.promptId)?.title : findVoiceDrill(session.promptId)?.title) ?? "a drill"}`;
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
    // What was said, and its unit
    const found = findSmallTalk(session.promptId);
    // Asking and listening say which, with a story cut short
    return found ? `${findUnit(found.unit).words.history}: ${found.unit === "listening" ? shorten(found.question) : found.question}` : `Small talk: ${text}`;
  }
  // And prepared speeches
  return session.mode === "response" ? `Prepared speech: ${text}` : text;
}

// One line of the contents: day, prompt, dotted leader, result
function Row({ row, now, talkTitles, pauseWords }: { row: HistoryRow; now: Date; talkTitles: ReadonlyMap<string, string>; pauseWords: boolean }) {
  // First try's rate, and the retry's if there was one (or the length, when pause words are hidden; decision 79)
  const result = !pauseWords ? formatClock(row.session.durationSec) : row.retry ? `${formatRate(row.session.fillersPerMinute)}, then ${formatRate(row.retry.fillersPerMinute)}` : formatRate(row.session.fillersPerMinute);
  // A link to the session, laid out as a baseline-aligned row
  return (
    <li>
      <Link href={`/sessions?id=${row.session.id}`} className={`flex min-h-14 items-center gap-3 py-3 hover:text-accent ${PRESS}`}>
        {/* The prompt, with the day under it (decision 79: rows in a card, no dotted leader) */}
        <span className="min-w-0 flex-1">
          {/* The prompt */}
          <span className="block leading-snug">{promptText(row.session, talkTitles)}</span>
          {/* The day, and whether it was tried twice */}
          <span className="block text-footnote text-ink-muted">{dayLabel(new Date(row.session.createdAt), now)}{row.retry ? " · tried twice" : ""}</span>
        </span>
        {/* The result, with its unit */}
        <span className="flex-none text-right"><span className="block font-semibold tabular-nums">{result}</span><span className="block text-footnote text-ink-muted">{pauseWords ? "pause words a minute" : "long"}</span></span>
      </Link>
    </li>
  );
}

// The History page on its own (reached from links; its home is a folded section of Settings, decision 56)
export function HistoryScreen(props: ScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // Draw the page
  return (
    // One column on a phone, margin plus main column on a computer
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-paper-raised px-6 pt-6 pb-10 md:px-14 md:pt-10">
      {/* Title, with the settings gear marked */}
      <Masthead title="History" section="settings" />
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

  // Work out progress, the trend, and the rows
  const progress = sessions ? baselineProgress(sessions) : null;
  // Trend values
  const trend = sessions ? trendSeries(sessions) : [];
  // List rows, filtered
  const rows = sessions ? historyRows(sessions).filter((row) => show === "all" || (show === "reading") === READING_MODES.includes(row.session.mode)) : [];
  // The first recording, for the listen link
  const baseline = sessions?.find((session) => session.isBaseline);

  // Draw it
  return (
    <div>
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
        <div className="md:grid md:grid-cols-[280px_minmax(0,1fr)] md:gap-14 md:pt-8">
          {/* Progress (top on a phone, margin on a computer) */}
          <aside className={`mt-5 self-start p-5 md:mt-0 ${CARD}`}>
            {/* Progress as one sentence, or a note that there is only one recording so far */}
            <h1 className="font-display text-cue font-semibold tracking-tight">{!pauseWords ? `${rows.length} ${rows.length === 1 ? "session" : "sessions"} so far.` : progress ? progressSentence(progress) : "Your first recording is in. Progress shows from your second."}</h1>
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
            <div role="group" aria-label="Show" className="flex max-w-sm gap-1 rounded-2xl bg-paper p-1 text-footnote">
              {/* One button per choice */}
              {HISTORY_FILTERS.map((choice) => <button key={choice.id} type="button" aria-pressed={show === choice.id} onClick={() => setShow(choice.id)} className={`min-h-11 flex-1 rounded-xl px-3 ${PRESS} ${show === choice.id ? "bg-fill font-semibold text-fill-ink" : "text-ink-muted hover:bg-card hover:text-ink"}`}>{choice.name}</button>)}
            </div>
            {/* The contents list */}
            <ul aria-label="Sessions" className={`mt-3 text-lede ${CARD_LIST}`}>
              {/* One row per first try, newest first */}
              {rows.map((row) => <Row key={row.session.id} row={row} now={today} talkTitles={talkTitles} pauseWords={pauseWords} />)}
              {/* Nothing of this kind yet */}
              {rows.length === 0 && <li className="py-4 text-ink-muted">Nothing of this kind yet.</li>}
            </ul>
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
                <span className="block text-footnote text-ink-muted">{dayLabel(new Date(record.debriefedAt ?? record.day), today)} · expected {record.predicted} of 5, went {record.outcome} of 5</span>
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

// A story's first few words, for a one-line label
function shorten(story: string): string {
  // The words
  const words = story.split(/\s+/);
  // The first eight, with an ellipsis when cut
  return words.length > 8 ? `${words.slice(0, 8).join(" ")}…` : story;
}
