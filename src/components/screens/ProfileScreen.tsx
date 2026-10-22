"use client";
// Your speaking profile, the one place for how you are doing (decisions 90 and 109): the latest weekly coach summary, then the check-ins (the latest, and the way to compare), then each family of practice with a few headline measures (usual against recent), changes that held, patterns, word habits, and every measure folded away; with ?session=ID, one take's full table of measures

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the back arrow
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
// Load the page title
import { PageTitle } from "@/components/script/PageTitle";
// Load the button looks
import { PRESS, TEXT_LINK } from "@/components/script/Buttons";
// Load the shared text and card looks
import { CARD, LABEL, SECTION_HEADING } from "@/components/script/textStyles";
// Load the page shell
import { PAGE } from "@/components/script/layout";
// Load the shared screen starting points
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
// Load the page title setter
import { usePageTitle } from "@/components/screens/usePageTitle";
// Load the measure registry
import { METRICS, METRIC_GROUPS } from "@/core/analysis/metrics";
// Load the profile
import { MIN_FOR_PATTERNS, buildProfile, formatValue, takeMeasures, type FamilyId, type FamilyProfile, type MetricSummary, type SpeakerProfile } from "@/core/analysis/profile";
// Load the day label
import { dayLabel } from "@/core/copy";
// Load the analysis backfill
import { backfillAnalyses } from "@/data/analyses";
// Load the weekly summary client
import { requestWeeklySummary } from "@/data/summaryClient";
// Load the saved passphrase
import { readPassphrase } from "@/data/passphrase";
// Load the record types
import type { AnalysisRecord, SessionRecord, SummaryRecord } from "@/data/records";
// Load the usual zone (decision 115)
import { UsualZone } from "@/components/script/UsualZone";
// Load the check-in grouping, worked out from the sessions already read (decision 100)
import { dayWords, groupCheckIns, recordedCheckIns, shortDay } from "@/core/checkIn";

// What the screen can be given
interface ProfileScreenProps extends ScreenProps {
  // One take to show in full, or null for the whole profile
  sessionId?: string | null;
  // Network function for the weekly summary (replaced in tests)
  fetchFn?: typeof fetch;
}

// Everything loaded
interface Loaded {
  // Every session
  sessions: SessionRecord[];
  // Every analysis
  analyses: AnalysisRecord[];
  // Every weekly summary, newest first
  summaries: SummaryRecord[];
}

// A measure's value with its unit, or a dash
function shown(value: number | null, unit: string): string {
  // A dash for nothing
  return value === null ? "–" : formatValue(value, unit);
}

// Draw the profile
export function ProfileScreen({ sessionId = null, fetchFn, ...props }: ProfileScreenProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // What was loaded
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // A load failure, said plainly
  const [error, setError] = useState<string | null>(null);
  // While older takes are measured
  const [measuring, setMeasuring] = useState(false);
  // A quiet note about the weekly summary
  const [summaryNote, setSummaryNote] = useState("");
  // Name the tab
  usePageTitle(sessionId ? "All measures for this take" : "Your speaking profile");

  // Measure any older takes, load everything, then ask for the weekly summary when due
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore results once the screen closes
    let cancelled = false;
    // Read everything
    const load = async (): Promise<Loaded> => ({ sessions: await repo.listSessions(), analyses: await repo.listAnalyses(), summaries: await repo.listSummaries() });
    // In order
    void (async () => {
      // Each step can fail
      try {
        // Measuring older takes first, a few at a time
        setMeasuring(true);
        // Measured
        await backfillAnalyses(repo, today);
        // Done measuring
        if (!cancelled) setMeasuring(false);
        // Everything
        const data = await load();
        // Shown
        if (!cancelled) setLoaded(data);
        // The weekly summary only on the whole profile
        if (sessionId) return;
        // Asked for when due
        const outcome = await requestWeeklySummary(repo, { passphrase: readPassphrase(), now: today, ...(fetchFn ? { fetchFn } : {}) });
        // A new one: show it
        if (outcome.status === "saved" && !cancelled) setLoaded({ ...data, summaries: [outcome.summary, ...data.summaries] });
        // A failure: said quietly, tried again next time
        if (outcome.status === "failed" && !cancelled) setSummaryNote(outcome.reason);
      } catch (failure) {
        // Said plainly, with the way forward
        if (!cancelled) {
          // Not measuring any more
          setMeasuring(false);
          // The browser's words
          setError(failure instanceof Error ? failure.message : String(failure));
        }
      }
    })();
    // Stop updating once the screen closes
    return () => {
      // Ignore late results
      cancelled = true;
    };
  }, [repo, today, sessionId, fetchFn]);

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* The area it heads, the one place for how you are doing, reached from Settings with the gear marked (decision 109) */}
      <Masthead title="Your progress" section="settings" />
      {/* The way back: to the take, or to Settings */}
      <p className="mt-2">{sessionId ? <Link href={`/sessions?id=${encodeURIComponent(sessionId)}`} className={`${TEXT_LINK} -ml-1 gap-1 text-footnote`}><CaretLeftIcon aria-hidden="true" className="size-4" />Back to the take</Link> : <Link href="/settings" className={`${TEXT_LINK} -ml-1 gap-1 text-footnote`}><CaretLeftIcon aria-hidden="true" className="size-4" />Back to Settings</Link>}</p>
      {/* The page's name */}
      <PageTitle title={sessionId ? "All measures for this take" : "Your speaking profile"}>{sessionId ? null : "Your usual against your recent takes. Compared only with yourself."}</PageTitle>
      {/* While older takes are measured */}
      {measuring && <p role="status" className="mt-4 text-ink-muted">Measuring your earlier takes…</p>}
      {/* A failure, with the way forward */}
      {error && <p role="alert" className="mt-4 max-w-[48ch]">The profile could not be loaded. The browser said: “{error}” Reload the page to try again.</p>}
      {/* The content, once loaded */}
      {loaded && today && (sessionId ? <TakeTable sessionId={sessionId} loaded={loaded} now={today} /> : <WholeProfile loaded={loaded} now={today} summaryNote={summaryNote} />)}
    </main>
  );
}

// The whole profile
function WholeProfile({ loaded, now, summaryNote }: { loaded: Loaded; now: Date; summaryNote: string }) {
  // The profile, worked out once per load
  const [profile] = useState<SpeakerProfile>(() => buildProfile(loaded.sessions, loaded.analyses, now));
  // The family shown: the one with the most takes first
  const [familyId, setFamilyId] = useState<FamilyId | null>(() => [...profile.families].sort((a, b) => b.takes - a.takes)[0]?.id ?? null);
  // The family's profile
  const family = profile.families.find((item) => item.id === familyId) ?? null;
  // The latest weekly summary
  const latest = loaded.summaries[0];
  // Draw it
  return (
    <>
      {/* The latest weekly summary, with its date */}
      {latest && <SummaryCard summary={latest} now={now} />}
      {/* Why a summary did not come this time */}
      {summaryNote && <p className="mt-2 text-footnote text-ink-muted">{summaryNote}</p>}
      {/* The weekly check-ins, from the same read of the sessions (decision 100), as their own section (decision 109) */}
      <CheckIns sessions={loaded.sessions} />
      {/* Nothing measured yet */}
      {!family && <p className="mt-6 max-w-[48ch] text-lede">No takes measured yet. Record one in <Link href="/practice" className={TEXT_LINK} data-inline>Practice</Link> and its measures appear here.</p>}
      {/* The families, when there are several */}
      {profile.families.length > 1 && (
        <div role="group" aria-label="Kind of practice" className="mt-6 flex flex-wrap gap-1 rounded-2xl bg-paper p-1 text-footnote">
          {/* One button per family */}
          {profile.families.map((item) => <button key={item.id} type="button" aria-pressed={item.id === familyId} onClick={() => setFamilyId(item.id)} className={`min-h-11 flex-1 rounded-xl px-3 ${PRESS} ${item.id === familyId ? "bg-fill font-semibold text-fill-ink" : "text-ink-muted hover:bg-card hover:text-ink"}`}>{item.name}</button>)}
        </div>
      )}
      {/* The chosen family */}
      {family && <FamilyView family={family} profile={profile} />}
      {/* Every session, newest first, on its own page (reached from here, decision 109) */}
      <p className="mt-6"><Link href="/history" className={TEXT_LINK}>Every session, in History</Link></p>
    </>
  );
}

// The weekly check-ins as a section (decision 109): the latest one and how many, its day and the days before, and the way to compare; before the first, what it is and where to start
function CheckIns({ sessions }: { sessions: ReadonlyArray<SessionRecord> }) {
  // The check-ins with takes, oldest first (worked out once per load)
  const [checkIns] = useState(() => recordedCheckIns(groupCheckIns(sessions, undefined)));
  // The latest
  const latest = checkIns.at(-1);
  // The section
  return (
    <section aria-labelledby="check-ins" className="mt-6">
      {/* Heading */}
      <h2 id="check-ins" className={SECTION_HEADING}>Check-ins</h2>
      {/* The card */}
      <div className={`mt-2 p-5 ${CARD}`}>
        {latest ? (
          <>
            {/* The latest, and how many */}
            <p className={LABEL}>Latest · {checkIns.length === 1 ? "your first" : `${checkIns.length} so far`}</p>
            {/* Its day */}
            <p className="mt-1 font-display text-cue font-semibold tracking-tight">{dayWords(latest.day)}</p>
            {/* The days before, the latest six */}
            {checkIns.length > 1 && (
              <ul aria-label="Check-in days" className="mt-2 flex flex-wrap gap-1.5">
                {/* One pill each */}
                {checkIns.slice(-6).map((checkIn) => <li key={checkIn.id} className="rounded-full bg-paper px-3 py-1 text-footnote tabular-nums">{shortDay(checkIn.day)}</li>)}
              </ul>
            )}
            {/* Compare, then every check-in */}
            <p className="mt-2 flex flex-wrap gap-x-5">
              {/* Compare (it needs two) */}
              {checkIns.length >= 2 && <Link href="/check-in/compare" className={TEXT_LINK}>Compare first and latest</Link>}
              {/* Every check-in */}
              <Link href="/check-in" className={TEXT_LINK}>All check-ins</Link>
            </p>
          </>
        ) : (
          <>
            {/* What it is */}
            <p className="text-lede">About 6 minutes once a week: the same four parts, so you can hear how you have changed.</p>
            {/* Where to start */}
            <p className="mt-2"><Link href="/check-in" className={TEXT_LINK}>Your first check-in</Link></p>
          </>
        )}
      </div>
    </section>
  );
}

// The latest weekly summary: its headline and next week's focus, the rest folded
function SummaryCard({ summary, now }: { summary: SummaryRecord; now: Date }) {
  // The card
  return (
    <section aria-label="This week's coach summary" className={`mt-5 p-5 ${CARD}`}>
      {/* What it is and when */}
      <p className={LABEL}>Weekly coach summary · {dayLabel(new Date(summary.createdAt), now)}</p>
      {/* The headline */}
      <p className="mt-1 font-display text-cue font-semibold tracking-tight">{summary.headline}</p>
      {/* Next week's focus */}
      <p className="mt-3 text-lede"><em>Next week.</em> {summary.focus}</p>
      {/* The rest, folded */}
      <details className="mt-2">
        {/* The fold's row */}
        <summary className={`flex min-h-11 cursor-pointer items-center text-footnote text-ink-muted ${PRESS}`}>More from the coach</summary>
        {/* What improved */}
        {summary.improved.length > 0 && <ul className="mt-1 list-disc pl-5 text-lede">{summary.improved.map((line) => <li key={line}>{line}</li>)}</ul>}
        {/* The pattern */}
        {summary.pattern && <p className="mt-2 text-lede"><em>Pattern.</em> {summary.pattern}</p>}
        {/* A practice to try */}
        {summary.suggestedDrill && <p className="mt-2 text-lede"><em>Try.</em> {summary.suggestedDrill}</p>}
      </details>
    </section>
  );
}

// How a measure moved, in words
function trendWords(summary: MetricSummary): string {
  // Too few takes
  if (summary.trend === null || summary.usual === null) return `${summary.count} ${summary.count === 1 ? "take" : "takes"} so far`;
  // About the same
  if (summary.trend === "steady") return `about your usual ${shown(summary.usual, summary.metric.unit)}`;
  // Up or down from the usual
  return `${summary.trend === "up" ? "up" : "down"} from your usual ${shown(summary.usual, summary.metric.unit)}`;
}

// One family: the headline measures by group, the patterns, word habits, and every measure folded
function FamilyView({ family, profile }: { family: FamilyProfile; profile: SpeakerProfile }) {
  // The patterns for this family
  const patterns = profile.patterns.filter((pattern) => pattern.family === family.id);
  // The registered stage-B measures this family has no values for yet
  const later = METRICS.filter((metric) => metric.stage === "B" && !family.metrics.some((summary) => summary.metric.id === metric.id)).length;
  // Draw it
  return (
    <>
      {/* How many takes */}
      <p className="mt-4 text-footnote text-ink-muted">{family.takes} {family.takes === 1 ? "take" : "takes"} measured. Recent is your latest seven; usual is your first five.</p>
      {/* Where the latest take sits against the usual band, for a few headline measures (decision 115) */}
      <UsualZone metrics={family.metrics} />
      {/* Each group with headline measures */}
      {METRIC_GROUPS.map((group) => {
        // The shown measures in it that have values
        const headline = family.metrics.filter((summary) => summary.metric.group === group.id && summary.metric.shown);
        // In the voice group, the measures the server's deeper analysis gave too, with what each means (decision 91)
        const deeper = group.id === "voice" ? family.metrics.filter((summary) => summary.metric.group === "voice" && !summary.metric.shown && (summary.source === "voice" || summary.source === "transcript")) : [];
        // Nothing to show, except word habits in vocabulary
        if (headline.length === 0 && deeper.length === 0 && group.id !== "vocabulary") return null;
        // The group's card
        return (
          <section key={group.id} aria-label={group.name} className={`mt-4 p-5 ${CARD}`}>
            {/* Its name */}
            <h2 className={SECTION_HEADING}>{group.name}</h2>
            {/* Each headline measure */}
            <ul className="mt-2 divide-y divide-rule">
              {headline.map((summary) => (
                <li key={summary.metric.id} data-metric={summary.metric.id} className="py-2">
                  {/* Name and recent value */}
                  <p className="flex items-baseline justify-between gap-3"><span>{summary.metric.name}</span><span className="flex-none whitespace-nowrap font-display text-lg font-semibold">{shown(summary.recent, summary.metric.unit)}</span></p>
                  {/* Against the usual */}
                  <p className="text-footnote text-ink-muted">{trendWords(summary)}</p>
                  {/* A change that held for three takes */}
                  {summary.flag && <p className="text-footnote text-accent">Your last three takes were all {summary.flag.side} than usual ({summary.flag.values.map((value) => shown(value, summary.metric.unit)).join(", ")}).</p>}
                </li>
              ))}
            </ul>
            {/* The deeper analysis's voice measures, each with what it means */}
            {deeper.length > 0 && (
              <>
                {/* What they are */}
                <p className={`mt-3 ${LABEL}`}>From deeper analysis</p>
                <ul aria-label="From deeper analysis" className="mt-1 divide-y divide-rule">
                  {deeper.map((summary) => (
                    <li key={summary.metric.id} data-metric={summary.metric.id} className="py-2">
                      {/* Name and recent value */}
                      <p className="flex items-baseline justify-between gap-3"><span>{summary.metric.name}</span><span className="flex-none whitespace-nowrap font-display text-lg font-semibold">{shown(summary.recent, summary.metric.unit)}</span></p>
                      {/* What it means */}
                      <p className="text-footnote text-ink-muted">{summary.metric.definition}</p>
                      {/* Against the usual */}
                      <p className="text-footnote text-ink-muted">{trendWords(summary)}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {/* Word habits, in the vocabulary group */}
            {group.id === "vocabulary" && <WordHabits profile={profile} />}
          </section>
        );
      })}
      {/* Patterns across takes */}
      <section aria-label="Patterns" className={`mt-4 p-5 ${CARD}`}>
        {/* Heading */}
        <h2 className={SECTION_HEADING}>Patterns</h2>
        {/* The patterns, or when they will appear */}
        {patterns.length > 0 ? <ul className="mt-2 list-disc pl-5 text-lede">{patterns.map((pattern) => <li key={pattern.statement}>{pattern.statement}</li>)}</ul> : <p className="mt-2 text-ink-muted">{family.takes >= MIN_FOR_PATTERNS ? "No clear pattern stands out yet." : `Patterns appear after ${MIN_FOR_PATTERNS} takes of one kind; you have ${family.takes} here.`}</p>}
      </section>
      {/* Every measure, folded away */}
      <details className={`mt-4 px-5 ${CARD}`}>
        {/* The fold's row */}
        <summary className={`flex min-h-14 cursor-pointer items-center font-semibold ${PRESS}`}>All measures ({family.metrics.length})</summary>
        {/* The table */}
        <MeasureTable rows={family.metrics.map((summary) => ({ id: summary.metric.id, name: summary.metric.name, value: summary.recent, usual: summary.usual, unit: summary.metric.unit, evidence: summary.metric.evidence, shown: summary.metric.shown, deeper: summary.source === "voice" || summary.source === "transcript" }))} valueLabel="Recent" />
        {/* What is still to come */}
        {later > 0 && <p className="pb-4 text-footnote text-ink-muted">{later} more measures can come from deeper analysis (Settings) or later stages.</p>}
      </details>
    </>
  );
}

// Word habits: favourite words lately, new words, and the coach's recent word swaps
function WordHabits({ profile }: { profile: SpeakerProfile }) {
  // The habits
  const { favourites, newWords, swaps } = profile.vocabulary;
  // Draw them
  return (
    <div className="mt-2 text-lede">
      {/* Favourite words */}
      <p className="mt-2"><span className={LABEL}>Said far more than usual lately</span><br />{favourites.length > 0 ? favourites.map((item) => `${item.word} (${item.recent})`).join(", ") : "None stand out yet."}</p>
      {/* New words */}
      <p className="mt-2"><span className={LABEL}>New in the last two weeks</span><br />{newWords.length > 0 ? newWords.map((item) => item.word).join(", ") : "None yet."}</p>
      {/* The coach's swaps */}
      <p className="mt-2"><span className={LABEL}>Word swaps from the coach</span></p>
      {swaps.length > 0 ? <ul className="list-disc pl-5">{swaps.map((swap) => <li key={`${swap.sessionId}-${swap.said}`}>“{swap.said}” → “{swap.stronger}”{swap.why ? ` (${swap.why})` : ""}</li>)}</ul> : <p>None yet.</p>}
    </div>
  );
}

// One row of a measures table
interface MeasureRow {
  // The measure's id
  id: string;
  // Its name
  name: string;
  // The value shown
  value: number | null;
  // The usual level
  usual: number | null;
  // The unit
  unit: string;
  // The evidence level
  evidence: string;
  // Shown or internal
  shown: boolean;
  // Measured by the server's deeper analysis (decision 91)
  deeper: boolean;
}

// A table of measures: name, value, usual, evidence (scrolls inside itself on a narrow phone)
function MeasureTable({ rows, valueLabel }: { rows: MeasureRow[]; valueLabel: string }) {
  // The table
  return (
    <div className="overflow-x-auto pb-2">
      <table className="w-full text-left text-footnote">
        {/* Column headings */}
        <thead><tr className="border-b border-rule text-ink-muted"><th scope="col" className="py-2 pr-2 font-normal">Measure</th><th scope="col" className="py-2 pr-2 font-normal">{valueLabel}</th><th scope="col" className="py-2 pr-2 font-normal">Usual</th><th scope="col" className="py-2 font-normal">Evidence</th></tr></thead>
        {/* One row per measure */}
        <tbody>{rows.map((row) => <tr key={row.id} data-metric={row.id} className="border-b border-rule last:border-0"><th scope="row" className="py-2 pr-2 font-normal">{row.name}{row.shown ? "" : <span className="text-ink-muted"> · internal</span>}{row.deeper ? <span className="text-ink-muted"> · deeper analysis</span> : ""}</th><td className="py-2 pr-2 whitespace-nowrap">{shown(row.value, row.unit)}</td><td className="py-2 pr-2 whitespace-nowrap">{shown(row.usual, row.unit)}</td><td className="py-2">{row.evidence}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

// One take's full table of measures, against its family's usual
function TakeTable({ sessionId, loaded, now }: { sessionId: string; loaded: Loaded; now: Date }) {
  // The take
  const session = loaded.sessions.find((item) => item.id === sessionId);
  // Its analysis
  const analysis = loaded.analyses.find((item) => item.sessionId === sessionId);
  // Not on this device
  if (!session) return <p data-inline className="mt-6 text-lede text-ink-muted">This take is not on this device. <Link href="/history" className={TEXT_LINK}>Back to history</Link></p>;
  // Not a kind that is measured
  if (!analysis) return <p className="mt-6 text-lede text-ink-muted">This kind of practice is not measured.</p>;
  // The rows
  const rows = takeMeasures(session, analysis, loaded.sessions, loaded.analyses);
  // Draw them
  return (
    <>
      {/* When it was recorded */}
      <p className="mt-2 text-footnote text-ink-muted">Recorded {dayLabel(new Date(session.createdAt), now)}. Usual is the middle of your other takes of this kind.</p>
      {/* The table */}
      <div className={`mt-4 px-5 pt-2 ${CARD}`}>
        <MeasureTable rows={rows.map((row) => ({ id: row.metric.id, name: row.metric.name, value: row.value, usual: row.usual, unit: row.metric.unit, evidence: row.metric.evidence, shown: row.metric.shown, deeper: row.source === "voice" || row.source === "transcript" }))} valueLabel="This take" />
      </div>
      {/* The coach's word swaps for this take */}
      {analysis.rubric && analysis.rubric.wordSwaps.length > 0 && <p className="mt-4 text-lede"><em>Word swaps.</em> {analysis.rubric.wordSwaps.map((swap) => `“${swap.said}” → “${swap.stronger}”`).join("; ")}</p>}
      {/* The whole profile */}
      <p className="mt-4"><Link href="/profile" className={TEXT_LINK}>Your whole speaking profile</Link></p>
    </>
  );
}
