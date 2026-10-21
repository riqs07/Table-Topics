"use client";
// Two weekly check-ins side by side (decision 100): choose which two (first and latest by default), then for each part both recordings with A/B play, a table of measures compared like with like, and a few plain lines on what changed. A recording that is not on this device (deleted, or imported without audio) is said plainly and the numbers still show

// Load React's state, effect and reference tools
import { useEffect, useRef, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the back arrow
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
import { PageTitle } from "@/components/script/PageTitle";
import { Player } from "@/components/script/Player";
import { Skeleton } from "@/components/script/Skeleton";
// Load the shared looks
import { PRESS, TEXT_LINK } from "@/components/script/Buttons";
import { CARD, LABEL, SECTION_HEADING } from "@/components/script/textStyles";
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points, the tab title and the audio loader
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
import { usePageTitle } from "@/components/screens/usePageTitle";
import { useAudioUrl } from "@/components/screens/useAudioUrl";
// Load the check-in rules and the comparison
import { recordedCheckIns, shortDay, type CheckIn } from "@/core/checkIn";
import { compareCheckIns, partName, pickPair, takeIds, windowWords, type CheckInComparison, type CompareRow, type PartComparison, type TimeStatus } from "@/core/checkInCompare";
// Load the number formatter and the clock format
import { formatValue } from "@/core/analysis/profile";
import { formatClock } from "@/core/recordingRules";
// Load the pause-word setting rule
import { pauseWordsShown } from "@/core/pauseWords";
// Load the playback boost for quiet recordings (decision 81)
import { playbackGain } from "@/core/voiceLevels";
// Load the story prompt and question lookups, to show what each week asked
import { findPrompt } from "@/content/prompts";
import { findStoryPrompt } from "@/content/stories";
// Load the check-in reads
import { analysesFor, loadCheckIns, type CheckInData } from "@/data/checkIns";
// Load the record types
import type { AnalysisRecord, SessionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// What the page is given: the two check-ins named in the address, if any
interface CheckInCompareProps extends ScreenProps {
  // The earlier check-in's id, or null for the first
  aId?: string | null;
  // The later check-in's id, or null for the latest
  bId?: string | null;
}

// Where a time sits, in a word or two
const TIME_WORDS: Readonly<Record<TimeStatus, string>> = { short: "under the window", inside: "inside the window", grace: "just past", long: "over" };

// The change column's words
const VERDICT_WORDS: Readonly<Record<NonNullable<CompareRow["verdict"]>, string>> = { better: "Better", worse: "Worse", changed: "Changed", same: "About the same" };

// A value for the table: yes/no as words, the rest with its unit, a dash for nothing
function cell(value: number | null, unit: string): string {
  // Nothing measured
  if (value === null) return "–";
  // Yes or no
  if (unit === "yes/no") return value >= 1 ? "Yes" : "No";
  // A number with its unit
  return formatValue(value, unit);
}

// Draw the page
export function CheckInCompareScreen({ aId = null, bId = null, ...props }: CheckInCompareProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // What was loaded
  const [data, setData] = useState<CheckInData | null>(null);
  // The analyses of the takes being compared
  const [analyses, setAnalyses] = useState<Map<string, AnalysisRecord> | null>(null);
  // The two chosen (ids), starting from the address
  const [chosen, setChosen] = useState<{ a: string | null; b: string | null }>({ a: aId, b: bId });
  // A load failure, said plainly
  const [problem, setProblem] = useState<string | null>(null);
  // Name the tab
  usePageTitle("Compare check-ins");

  // Load the check-ins once the date is known
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore late results
    let cancelled = false;
    // Load
    loadCheckIns(repo, today).then((loaded) => {
      // Shown
      if (!cancelled) setData(loaded);
    }).catch((error: unknown) => {
      // Said plainly
      if (!cancelled) setProblem(error instanceof Error ? error.message : String(error));
    });
    // Stop updating once closed
    return () => {
      // Ignore late results
      cancelled = true;
    };
  }, [repo, today]);

  // The pair being compared
  const pair = data ? pickPair(data.checkIns, chosen.a, chosen.b) : null;
  // Its takes' ids, as one key so the analyses load again only when the pair changes
  const ids = pair ? takeIds(pair.a, pair.b).join(",") : "";

  // Load just the analyses of the two check-ins' takes
  useEffect(() => {
    // Nothing to load
    if (!ids) return;
    // Ignore late results
    let cancelled = false;
    // Read them
    analysesFor(repo, ids.split(",")).then((found) => {
      // Shown
      if (!cancelled) setAnalyses(found);
    }).catch((error: unknown) => {
      // Said plainly
      if (!cancelled) setProblem(error instanceof Error ? error.message : String(error));
    });
    // Stop updating once closed
    return () => {
      // Ignore late results
      cancelled = true;
    };
  }, [repo, ids]);

  // The comparison, once everything is in
  const comparison = pair && analyses && data ? compareCheckIns(pair.a, pair.b, analyses, { pauseWords: pauseWordsShown(data.settings) }) : null;
  // The check-ins with takes, oldest first
  const recorded = data ? recordedCheckIns(data.checkIns) : [];

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* The masthead, under Today */}
      <Masthead title="VoiceLab" section="today" />
      {/* The way back */}
      <p className="mt-2"><Link href="/check-in" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote`}><CaretLeftIcon aria-hidden="true" className="size-4" />Your check-ins</Link></p>
      {/* The page's name */}
      <PageTitle title="How far you’ve come">{comparison ? `${shortDay(comparison.a.day)} and ${shortDay(comparison.b.day)}, ${comparison.days} days apart.` : null}</PageTitle>
      {/* Until loaded */}
      {!problem && (!data || (pair && !analyses)) && <Skeleton blocks={["h-16", "h-72"]} />}
      {/* A failure */}
      {problem !== null && <p role="alert" className="mt-6 max-w-[48ch]">The check-ins could not be loaded. The browser said: “{problem}” Reload the page to try again.</p>}
      {/* Fewer than two check-ins */}
      {data && !pair && (
        <p className="mt-6 max-w-[48ch] text-lede">Comparing needs two check-ins. {recorded.length === 0 ? "Do your first one to set your starting point." : "Your next one will sit beside this one."} <Link href="/check-in" className={TEXT_LINK}>See your check-ins</Link></p>
      )}
      {/* Which two */}
      {pair && recorded.length > 2 && <PairChooser checkIns={recorded} pair={pair} onChoose={setChosen} />}
      {/* Each part */}
      {comparison && comparison.parts.map((part) => <PartSection key={part.part} repo={repo} comparison={comparison} part={part} />)}
    </main>
  );
}

// Choose the two check-ins: two lists, and quick choices for the first and latest, and the last two
function PairChooser({ checkIns, pair, onChoose }: { checkIns: ReadonlyArray<CheckIn>; pair: { a: CheckIn; b: CheckIn }; onChoose: (next: { a: string | null; b: string | null }) => void }) {
  // A check-in's name in a list
  const name = (checkIn: CheckIn) => `${checkIn.week === 1 ? "First" : `Check-in ${checkIn.week}`} · ${shortDay(checkIn.day)}`;
  // The latest two
  const [previous, latest] = [checkIns.at(-2)!, checkIns.at(-1)!];
  // The chooser
  return (
    <section aria-label="Choose two check-ins" className="mt-5">
      {/* Quick choices */}
      <div role="group" aria-label="Quick choices" className="flex flex-wrap gap-2">
        {/* First and latest */}
        <button type="button" aria-pressed={pair.a.id === checkIns[0]!.id && pair.b.id === latest.id} onClick={() => onChoose({ a: checkIns[0]!.id, b: latest.id })} className={`min-h-11 rounded-full px-4 ${PRESS} ${pair.a.id === checkIns[0]!.id && pair.b.id === latest.id ? "bg-fill font-semibold text-fill-ink" : "bg-paper text-ink-muted hover:text-ink"}`}>First and latest</button>
        {/* Last week and this week */}
        <button type="button" aria-pressed={pair.a.id === previous.id && pair.b.id === latest.id} onClick={() => onChoose({ a: previous.id, b: latest.id })} className={`min-h-11 rounded-full px-4 ${PRESS} ${pair.a.id === previous.id && pair.b.id === latest.id ? "bg-fill font-semibold text-fill-ink" : "bg-paper text-ink-muted hover:text-ink"}`}>Last two</button>
      </div>
      {/* Any two */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-footnote">
        {/* Then */}
        <label className="flex items-center gap-2">Then
          <select value={pair.a.id} onChange={(event) => onChoose({ a: event.target.value, b: pair.b.id })} className="min-h-11 border-b border-ink bg-transparent">
            {/* Each check-in */}
            {checkIns.map((checkIn) => <option key={checkIn.id} value={checkIn.id}>{name(checkIn)}</option>)}
          </select>
        </label>
        {/* Now */}
        <label className="flex items-center gap-2">Now
          <select value={pair.b.id} onChange={(event) => onChoose({ a: pair.a.id, b: event.target.value })} className="min-h-11 border-b border-ink bg-transparent">
            {/* Each check-in */}
            {checkIns.map((checkIn) => <option key={checkIn.id} value={checkIn.id}>{name(checkIn)}</option>)}
          </select>
        </label>
      </div>
    </section>
  );
}

// What a take asked, for the parts that change each week (the story and the surprise question)
function askedText(session: SessionRecord | null): string | null {
  // Nothing without a take
  if (!session) return null;
  // A story's prompt
  if (session.checkIn?.part === "story") return findStoryPrompt(session.promptId)?.text ?? null;
  // The surprise question
  if (session.checkIn?.part === "surprise") return findPrompt(session.promptId)?.text ?? null;
  // The read and the pitch are the same every week
  return null;
}

// One part: both takes with A/B play, then what changed and the table
function PartSection({ repo, comparison, part }: { repo: Repository; comparison: CheckInComparison; part: PartComparison }) {
  // The two audio elements, for A/B play
  const players = useRef<{ a: HTMLAudioElement | null; b: HTMLAudioElement | null }>({ a: null, b: null });
  // Which one A/B play is on
  const [side, setSide] = useState<"a" | "b" | null>(null);
  // The two recordings' addresses
  const [urlA, urlB] = [useAudioUrl(repo, part.a?.audioKey ?? null).url, useAudioUrl(repo, part.b?.audioKey ?? null).url];

  // Play one side from where the other was (the same passage lines up; the others start where they were), pausing the other
  function play(which: "a" | "b") {
    // The one to play and the other
    const [target, other] = which === "a" ? [players.current.a, players.current.b] : [players.current.b, players.current.a];
    // Nothing to play
    if (!target) return;
    // Where the other was, when it had started
    const at = other && other.currentTime > 0 ? other.currentTime : target.currentTime;
    // Stop the other
    other?.pause();
    // Move to the same point, within this recording
    target.currentTime = Number.isFinite(target.duration) ? Math.min(at, Math.max(0, target.duration - 0.5)) : at;
    // Play (the browser may refuse without a tap, which is fine)
    void target.play().catch(() => undefined);
    // Mark it
    setSide(which);
  }

  // The window in words, for timed parts
  const windowText = windowWords(part.part);
  // The part
  return (
    <section aria-labelledby={`part-${part.part}`} data-part={part.part} className={`mt-6 p-5 ${CARD}`}>
      {/* The part's name */}
      <h2 id={`part-${part.part}`} className={SECTION_HEADING}>{partName(part.part)}</h2>
      {/* The two takes: stacked on a phone, side by side on a computer */}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {/* Then and now */}
        {(["a", "b"] as const).map((which) => {
          // This side's take, check-in and audio address
          const [take, checkIn, url] = which === "a" ? [part.a, comparison.a, urlA] : [part.b, comparison.b, urlB];
          // What this week asked, for the parts that change
          const asked = askedText(take);
          // One side
          return (
            <div key={which} data-side={which}>
              {/* Which one, with its time */}
              <p className={LABEL}>{which === "a" ? "Then" : "Now"} · {shortDay(checkIn.day)}{take ? ` · ${formatClock(take.durationSec)}${part.time[which] ? `, ${TIME_WORDS[part.time[which]!]}` : ""}` : ""}</p>
              {/* What was asked, when it differs week to week */}
              {asked && <p className="mt-1 text-footnote">{asked}</p>}
              {/* The player, or why there is none */}
              {take && url ? (
                <div className="mt-1"><Player src={url} label={`${partName(part.part)}, ${which === "a" ? "then" : "now"}`} name={`${which === "a" ? "then" : "now"}, ${shortDay(checkIn.day)}`} durationSec={take.durationSec} gain={playbackGain(take.loudnessScale)} onAudio={(element) => { players.current[which] = element; }} /></div>
              ) : (
                <p className="mt-1 text-footnote text-ink-muted">{!take ? "Skipped this time." : "The recording isn’t on this device (deleted, or brought in from a backup). The numbers are still here."}</p>
              )}
            </div>
          );
        })}
      </div>
      {/* A/B play, when both recordings are here */}
      {urlA && urlB && (
        <div role="group" aria-label={`Switch between then and now, ${partName(part.part)}`} className="mt-3 flex items-center gap-2">
          {/* What it does */}
          <span className="text-footnote text-ink-muted">A/B</span>
          {/* Then */}
          <button type="button" aria-pressed={side === "a"} onClick={() => play("a")} className={`min-h-11 min-w-11 rounded-full px-4 ${PRESS} ${side === "a" ? "bg-fill font-semibold text-fill-ink" : "bg-paper text-ink"}`}>Then</button>
          {/* Now */}
          <button type="button" aria-pressed={side === "b"} onClick={() => play("b")} className={`min-h-11 min-w-11 rounded-full px-4 ${PRESS} ${side === "b" ? "bg-fill font-semibold text-fill-ink" : "bg-paper text-ink"}`}>Now</button>
        </div>
      )}
      {/* What changed, in plain lines */}
      <ul aria-label={`What changed, ${partName(part.part)}`} className="mt-4 list-disc space-y-1 pl-5">
        {/* Each line */}
        {part.lines.map((line) => <li key={line}>{line}</li>)}
      </ul>
      {/* The measures, when both takes are here */}
      {part.rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table aria-label={`Measures, ${partName(part.part)}`} className="w-full text-left text-footnote">
            {/* The columns */}
            <thead className="text-ink-muted">
              <tr>
                {/* Names */}
                <th scope="col" className="py-1 pr-2 font-normal">Measure</th>
                {/* Then */}
                <th scope="col" className="py-1 pr-2 font-normal">Then</th>
                {/* Now */}
                <th scope="col" className="py-1 pr-2 font-normal">Now</th>
                {/* Change */}
                <th scope="col" className="py-1 font-normal">Change</th>
              </tr>
            </thead>
            {/* One row per measure */}
            <tbody className="divide-y divide-rule">
              {/* The time against the window first */}
              <tr>
                {/* Name */}
                <th scope="row" className="py-1.5 pr-2 font-normal">{windowText ? `Time (${windowText})` : "Time"}</th>
                {/* Then */}
                <td className="py-1.5 pr-2 tabular-nums">{part.a ? formatClock(part.a.durationSec) : "–"}</td>
                {/* Now */}
                <td className="py-1.5 pr-2 tabular-nums">{part.b ? formatClock(part.b.durationSec) : "–"}</td>
                {/* Where the latest sits */}
                <td className="py-1.5">{part.time.b ? TIME_WORDS[part.time.b] : ""}</td>
              </tr>
              {/* Each measure */}
              {part.rows.map((row) => (
                <tr key={row.metric.id} data-verdict={row.verdict ?? "none"}>
                  {/* Name */}
                  <th scope="row" className="py-1.5 pr-2 font-normal">{row.metric.name}</th>
                  {/* Then */}
                  <td className="py-1.5 pr-2 tabular-nums">{cell(row.a, row.metric.unit)}</td>
                  {/* Now */}
                  <td className="py-1.5 pr-2 tabular-nums">{cell(row.b, row.metric.unit)}</td>
                  {/* The change, or why it is not judged */}
                  <td className="py-1.5">{row.verdict ? VERDICT_WORDS[row.verdict] : ""}{row.note ? <span className="block text-ink-muted">{row.note}</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
