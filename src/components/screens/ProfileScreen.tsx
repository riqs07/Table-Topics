"use client";
// Your speaking profile, the one place for how you are doing (decisions 90 and 109): the latest weekly coach summary, then the check-ins (the latest, and the way to compare), then each family of practice with a few headline measures (usual against recent), changes that held, patterns, word habits, and every measure folded away; with ?session=ID, one take's full table of measures

// Load React's state and effect tools
import { useEffect, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the back arrow
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
// Load the top of Me (second design pass)
import { MeTop } from "@/components/screens/MeTop";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
// Load the page title
import { PageTitle } from "@/components/script/PageTitle";
// Load the button looks
import { PRESS, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the shared text and card looks
import { BUBBLE, CARD, CHIP, CHIP_GOOD, LAB, LABEL, SECTION_HEADING } from "@/components/script/textStyles";
// Load the shared failed-to-load card and the not-found card
import { LoadFailed } from "@/components/script/LoadFailed";
import { NotFound } from "@/components/script/SageSays";
// Load the cast, the mode tiles and the check-in's tile (second design pass)
import { Cast } from "@/components/scenes/Cast";
import { ModeTile } from "@/components/scenes/ModeTile";
import { CHECK_IN_TILE } from "@/components/script/checkInTiles";
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
import { RATING_SCALES, type AnalysisRecord, type SessionRecord, type SettingsRecord, type SummaryRecord } from "@/data/records";
// Load how often the speaker's own call matched the measure (decision 116)
import { calibration } from "@/core/ratingCompare";
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
  // The settings, for Me's Settings rows and whether pause words are counted
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  // The takes, read at once for the top of Me (the profile below waits for older takes to be measured)
  const [takes, setTakes] = useState<SessionRecord[] | null>(null);
  // How many times it was loaded, so Try again loads afresh
  const [attempt, setAttempt] = useState(0);
  // Name the tab
  usePageTitle(sessionId ? "All measures for this take" : "Me");

  // Measure any older takes, load everything, then ask for the weekly summary when due
  useEffect(() => {
    // Wait for the date
    if (!today) return;
    // Ignore results once the screen closes
    let cancelled = false;
    // The settings and the takes, for the top of the page
    if (!sessionId) {
      // The settings
      repo.getSettings(today).then((read) => !cancelled && setSettings(read), () => undefined);
      // The takes
      repo.listSessions().then((read) => !cancelled && setTakes(read), () => undefined);
    }
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
  }, [repo, today, sessionId, fetchFn, attempt]);

  // Load everything again, after a failure
  function retry() {
    // No failure shown while trying
    setError(null);
    // Load afresh
    setAttempt((count) => count + 1);
  }

  // For one take: whether it is missing from this device, once everything is read
  const missing = !!sessionId && !!loaded && !loaded.sessions.some((session) => session.id === sessionId);

  // Draw the page
  return (
    <main id="main" className={PAGE}>
      {/* The area it heads, the one place for how you are doing, reached from Settings with the gear marked (decision 109) */}
      <Masthead title="Me" section="me" />
      {/* For one take: the way back to it, and the page's name */}
      {sessionId && !missing && <p className="mt-2"><Link href={`/sessions?id=${encodeURIComponent(sessionId)}`} className={`${TEXT_LINK} -ml-1 gap-1 text-footnote`}><CaretLeftIcon aria-hidden="true" className="size-4" />Back to the take</Link></p>}
      {/* The take is not here: Sage says so as the heading, with one chunky way back (the shared not-found pattern) */}
      {missing && <NotFound title="This take is not on this device." back={{ href: "/history", label: "Back to your takes" }} />}
      {/* (its name) */}
      {sessionId && !missing && <PageTitle title="All measures for this take" />}
      {/* One take's measures */}
      {sessionId && (
        <>
          {/* While older takes are measured */}
          {measuring && <p role="status" className="mt-4 text-ink-muted">Measuring your earlier takes…</p>}
          {/* A failure, with the way forward */}
          {error && <LoadFailed title="This take’s measures could not be loaded." reason={error} onRetry={retry} />}
          {/* The table, once loaded */}
          {loaded && today && !missing && <TakeTable sessionId={sessionId} loaded={loaded} now={today} />}
        </>
      )}
      {/* The whole of Me: you so far, then and now, your numbers, your takes and Settings (second design pass), then the speaking profile under them */}
      {!sessionId && error && !takes && <LoadFailed level={1} title="Your progress could not be loaded." reason={error} onRetry={retry} />}
      {/* (the whole of Me, unless nothing at all could be read) */}
      {!sessionId && !(error && !takes) && (
        <MeTop repo={repo} sessions={takes ?? loaded?.sessions ?? null} settings={settings} now={today}>
          {/* While older takes are measured */}
          {measuring && <p role="status" className="mt-4 text-ink-muted">Measuring your earlier takes…</p>}
          {/* A failure, with the way forward */}
          {error && <LoadFailed title="Your speaking profile could not be loaded." reason={error} onRetry={retry} />}
          {/* The content, once loaded */}
          {loaded && today && <WholeProfile loaded={loaded} now={today} summaryNote={summaryNote} />}
        </MeTop>
      )}
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
      {/* How often the speaker's own call matched the measure, once there are enough rated takes (decision 116) */}
      <Calibration sessions={loaded.sessions} />
      {/* The profile's own heading, after the check-ins so the headings follow the page */}
      <p className={`mt-8 ${LAB}`}>Measured from your takes</p>
      {/* (the heading) */}
      <h2 className={`${SECTION_HEADING} mt-1`}>Your speaking profile</h2>
      {/* What it compares, once something is measured */}
      {family && <p className="mt-1 max-w-[56ch] font-semibold text-ink-muted">Your usual against your recent takes. Compared only with yourself.</p>}
      {/* Nothing measured yet: the blob and the first step, never a page of zeros */}
      {!family && (
        <div className={`mt-3 flex items-center gap-4 p-5 ${CARD}`}>
          {/* The blob, waiting */}
          <Cast who="you" face="wonder" still className="size-14 flex-none" />
          {/* What will appear */}
          <p className="font-semibold">No takes measured yet. Record one in <Link href="/practice" className={TEXT_LINK} data-inline>Practice</Link> and its measures appear here.</p>
        </div>
      )}
      {/* The families, when there are several */}
      {profile.families.length > 1 && (
        <div role="group" aria-label="Kind of practice" className="mt-6 flex flex-wrap gap-2 text-footnote">
          {/* One pill per family, as Your takes' filters */}
          {profile.families.map((item) => <button key={item.id} type="button" aria-pressed={item.id === familyId} onClick={() => setFamilyId(item.id)} className={`min-h-11 rounded-full border-2 px-4.5 font-extrabold ${PRESS} ${item.id === familyId ? "border-fill bg-fill text-fill-ink shadow-chunky-pressed" : "border-rule bg-card text-ink shadow-ledge hover:border-ink-muted"}`}>{item.name}</button>)}
        </div>
      )}
      {/* The chosen family */}
      {family && <FamilyView family={family} profile={profile} />}
      {/* Every session, newest first, on its own page (reached from here, decision 109) */}
      <p className="mt-6"><Link href="/history" className={SECONDARY}>Every session, in History</Link></p>
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
      <div className={`mt-2 flex items-start gap-4 p-5 ${CARD}`}>
        {/* The check-in's tile */}
        <ModeTile {...CHECK_IN_TILE} tilt={-4} still className="size-14 flex-none md:size-16" />
        {/* What it says */}
        <div className="min-w-0 flex-1">
        {latest ? (
          <>
            {/* The latest, and how many */}
            <p className={LAB}>Latest · {checkIns.length === 1 ? "your first" : `${checkIns.length} so far`}</p>
            {/* Its day */}
            <p className="mt-1 font-display text-cue font-semibold">{dayWords(latest.day)}</p>
            {/* The days before, the latest six */}
            {checkIns.length > 1 && (
              <ul aria-label="Check-in days" className="mt-2 flex flex-wrap gap-1.5">
                {/* One pill each */}
                {checkIns.slice(-6).map((checkIn) => <li key={checkIn.id} className={`${CHIP} tabular-nums`}>{shortDay(checkIn.day)}</li>)}
              </ul>
            )}
            {/* Compare, then every check-in */}
            <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              {/* Compare (it needs two) */}
              {checkIns.length >= 2 && <Link href="/check-in/compare" className={SECONDARY}>Compare first and latest</Link>}
              {/* Every check-in */}
              <Link href="/check-in" className={TEXT_LINK}>All check-ins</Link>
            </p>
          </>
        ) : (
          <>
            {/* What it is */}
            <p className="font-semibold">About 6 minutes once a week: the same four parts, so you can hear how you have changed.</p>
            {/* Where to start */}
            <p className="mt-3"><Link href="/check-in" className={SECONDARY}>Your first check-in</Link></p>
          </>
        )}
        </div>
      </div>
    </section>
  );
}

// How often the speaker's sense matched the measure, one line per scale with at least eight rated takes compared, or nothing (decision 116)
function Calibration({ sessions }: { sessions: ReadonlyArray<SessionRecord> }) {
  // Pace and liveliness, worked out once per load
  const [lines] = useState(() => RATING_SCALES.flatMap((scale) => calibration(sessions, scale) ?? []));
  // Nothing yet
  if (lines.length === 0) return null;
  // The lines in one small card
  return (
    <section aria-label="Your sense and the measure" data-calibration className={`mt-4 p-5 ${CARD}`}>
      {/* Each line */}
      {lines.map((line) => <p key={line.scale} className="text-lede">{line.text}</p>)}
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
      <p className="mt-1 font-display text-cue font-semibold">{summary.headline}</p>
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
            <h3 className="font-display text-xl leading-tight font-semibold">{group.name}</h3>
            {/* Each headline measure, as a stat tile: its name, the recent value large, and how it sits against your usual */}
            {headline.length > 0 && (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {headline.map((summary) => (
                  <li key={summary.metric.id} data-metric={summary.metric.id} className="flex flex-col gap-0.5 rounded-[16px] bg-paper px-4 py-3">
                    {/* Its name */}
                    <span className="text-sm font-bold text-ink-muted">{summary.metric.name}</span>
                    {/* The recent value */}
                    <span className="font-display text-2xl leading-tight font-semibold">{shown(summary.recent, summary.metric.unit)}</span>
                    {/* Against the usual */}
                    <span className="text-footnote font-semibold text-ink-muted">{trendWords(summary)}</span>
                    {/* A change that held for three takes */}
                    {summary.flag && <span className="text-footnote font-bold text-accent-tint-ink">Your last three takes were all {summary.flag.side} than usual ({summary.flag.values.map((value) => shown(value, summary.metric.unit)).join(", ")}).</span>}
                  </li>
                ))}
              </ul>
            )}
            {/* The deeper analysis's voice measures, each with what it means */}
            {deeper.length > 0 && (
              <>
                {/* What they are */}
                <p className={`mt-4 ${LAB}`}>From deeper analysis</p>
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
      {/* Patterns across takes, once there are any (until then a quiet line on when they come) */}
      {patterns.length > 0 ? (
        <section aria-label="Patterns" className={`mt-4 p-5 ${CARD}`}>
          {/* Heading */}
          <h3 className="font-display text-xl leading-tight font-semibold">Patterns</h3>
          {/* The patterns, as ruled rows */}
          <ul className="mt-2 divide-y-2 divide-rule">{patterns.map((pattern) => <li key={pattern.statement} className="py-2.5 font-semibold">{pattern.statement}</li>)}</ul>
        </section>
      ) : <p className="mt-4 text-footnote font-semibold text-ink-muted">{family.takes >= MIN_FOR_PATTERNS ? "No clear pattern stands out yet." : `Patterns appear after ${MIN_FOR_PATTERNS} takes of one kind; you have ${family.takes} here.`}</p>}
      {/* Every measure, folded away */}
      <details className={`mt-4 px-5 ${CARD}`}>
        {/* The fold's row */}
        <summary className={`flex min-h-14 cursor-pointer items-center font-display text-lg font-semibold ${PRESS}`}>All measures ({family.metrics.length})</summary>
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
  // Nothing to say yet: left out rather than a row of "None yet"
  if (favourites.length === 0 && newWords.length === 0 && swaps.length === 0) return null;
  // Draw the lists that have something
  return (
    <div className="mt-2">
      {/* Favourite words */}
      {favourites.length > 0 && <><p className={`mt-3 ${LAB}`}>Said far more than usual lately</p><p className="mt-1.5 flex flex-wrap gap-1.5">{favourites.map((item) => <span key={item.word} className={CHIP}>{item.word} ({item.recent})</span>)}</p></>}
      {/* New words */}
      {newWords.length > 0 && <><p className={`mt-3 ${LAB}`}>New in the last two weeks</p><p className="mt-1.5 flex flex-wrap gap-1.5">{newWords.map((item) => <span key={item.word} className={CHIP_GOOD}>{item.word}</span>)}</p></>}
      {/* The coach's swaps, as ruled rows */}
      {swaps.length > 0 && <><p className={`mt-3 ${LAB}`}>Word swaps from the coach</p><ul className="mt-1 divide-y-2 divide-rule">{swaps.map((swap) => <li key={`${swap.sessionId}-${swap.said}`} className="py-2 font-semibold">“{swap.said}” → <b className="text-accent-tint-ink">“{swap.stronger}”</b>{swap.why ? <span className="text-ink-muted"> ({swap.why})</span> : ""}</li>)}</ul></>}
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
  if (!session) return (
    <section aria-label="Not found" className={`mt-6 flex flex-col gap-4 p-5 ${CARD}`}>
      {/* Sage, thinking, says so */}
      <div className="flex items-end gap-3">
        {/* The coach */}
        <Cast who="sage" mood="thinking" className="size-16 flex-none md:size-18" />
        {/* What happened */}
        <p data-inline className={`${BUBBLE} mb-2`}>This take is not on this device.</p>
      </div>
      {/* The way on */}
      <p><Link href="/history" className={SECONDARY}>Back to history</Link></p>
    </section>
  );
  // Not a kind that is measured
  if (!analysis) return <p className={`mt-6 p-5 font-semibold text-ink-muted ${CARD}`}>This kind of practice is not measured.</p>;
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
