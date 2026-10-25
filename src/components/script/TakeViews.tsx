"use client";
// The views on a take's page, chosen focus first (decision 115): a drill or lesson shows only its own view, and everything else (a story too, decision 126) goes by length (under two minutes: the pitch in the words; over two minutes: the fingerprint, the lens tabs open, the best moment and the energy arc). "Look closer" opens the lens tabs in place on every take. Loaded after the page is up, so a take's first download stays small (decisions 99 and 111)

// Load React's state, memo, effect and callback tools
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
// Load the pitch-in-the-words section
import { VoiceSection } from "@/components/script/VoiceSection";
// Load the lens views
import { ClarityLensView, LensEmpty, LookCloser, PaceLensView, PausesLensView, WordsLensView, type PlayFrom } from "@/components/script/LensViews";
// Load every chart, for the week of testing (decision 124)
import { ChartTrial } from "@/components/script/ChartTrial";
// Load the at-a-glance views
import { BestMomentCard, EnergyArcCard, FingerprintCard } from "@/components/script/TakeGlance";
// Load the shared heading look
import { PRESS } from "@/components/script/Buttons";
import { SECTION_HEADING } from "@/components/script/textStyles";
// Load the view selector
import { LENSES, LENS_NAMES, takeViews, type LensId } from "@/core/takeViews";
// Load the lens findings
import { fillerTimes, lensWords } from "@/core/lenses/lensWords";
import { pauseLens } from "@/core/lenses/pauseLens";
import { paceLens, usualPace } from "@/core/lenses/paceLens";
import { wordsLens } from "@/core/lenses/wordsLens";
import { clarityLens } from "@/core/lenses/clarityLens";
// Load the pitch in the words
import { takePitch } from "@/core/takePitch";
// Load the at-a-glance findings
import { takeFingerprint } from "@/core/fingerprint";
import { bestMoment } from "@/core/bestMoment";
import { energyArc } from "@/core/energyArc";
// Load the spacing of the readings
import { LOUDNESS_TICK_MS } from "@/core/recordingRules";
// Load the record types
import type { AnalysisRecord, FullSession, SessionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";
// Load the voice line kinds
import type { VoiceLineKind } from "@/core/voiceFeedback";

// A peak this many steps above its phrase's middle is shown on the fingerprint
const SHOWN_PEAK = 3;
// Seconds before a tapped moment that playing starts, for context
const LEAD_IN = 0.3;

// What the views need
export interface TakeViewsProps {
  // Where the take's analysis is read from (the service's words and the coach's word swaps)
  repo: Repository;
  // The take with its readings
  session: FullSession;
  // Every session (already read by the page), for the usual pace
  sessions: ReadonlyArray<SessionRecord>;
  // The speaker's usual pitch range, or null
  usual: number | null;
  // A voice line the one change already says, left out
  hide?: VoiceLineKind | undefined;
  // Whether fluency is judged (decision 79)
  fluency: boolean;
  // Whether pause words are counted and marked (decision 79)
  pauseWords: boolean;
  // The text read, for a reading or a lesson
  script: string | null;
  // The page's audio element for this take, when its recording is kept
  audio: () => HTMLAudioElement | null;
}

// The analysis's parts the views use, read once
function useAnalysis(repo: Repository, sessionId: string): { analysis: AnalysisRecord | null; ready: boolean } {
  // What was read, for which take
  const [state, setState] = useState<{ id: string | null; analysis: AnalysisRecord | null }>({ id: null, analysis: null });
  // Read it when the take changes
  useEffect(() => {
    // Ignore a late answer
    let cancelled = false;
    // Read (a failure means the phone's own words are used)
    repo.getAnalysis(sessionId).then((analysis) => {
      // Keep it
      if (!cancelled) setState({ id: sessionId, analysis: analysis ?? null });
    }, () => {
      // Read as nothing
      if (!cancelled) setState({ id: sessionId, analysis: null });
    });
    // Stop on leaving
    return () => {
      // Ignore late answers
      cancelled = true;
    };
  }, [repo, sessionId]);
  // Only this take's
  return state.id === sessionId ? { analysis: state.analysis, ready: true } : { analysis: null, ready: false };
}

// Where a take's detailed readings were dropped (decision 98)
function TrimmedNote() {
  // One quiet line, as before
  return <p data-trimmed className="mt-5 text-footnote text-ink-muted">Detailed charts aren’t kept for older takes. The words, numbers and feedback are all here.</p>;
}

// Draw the views a take shows
export function TakeViews({ repo, session, sessions, usual, hide, fluency, pauseWords, script, audio }: TakeViewsProps) {
  // The analysis, once read
  const { analysis, ready } = useAnalysis(repo, session.id);
  // Which views to show
  const plan = useMemo(() => takeViews(session), [session]);
  // The service's words, when deeper analysis ran
  const serverWords = analysis?.server?.transcript?.words ?? null;
  // Everything worked out once per take (memoised: a long take's readings are worked through once)
  const found = useMemo(() => {
    // Nothing until the analysis is read
    if (!ready) return null;
    // The words as heard
    const text = lensWords(session, serverWords);
    // The pitch in the words
    const pitch = takePitch(session, { serverWords, script });
    // Its phrases, when drawn
    const phrases = pitch.state === "ready" ? pitch.pitch.phrases : [];
    // The clear peaks' moments
    const peakTimes = phrases.flatMap((phrase) => {
      // The phrase's middle pitch
      const sorted = phrase.steps.filter((step): step is number => step !== null).sort((a, b) => a - b);
      // (its middle)
      const centre = sorted[Math.floor(sorted.length / 2)] ?? 0;
      // Its top word when it stands out clearly
      return phrase.top && phrase.top.step !== null && phrase.top.step - centre >= SHOWN_PEAK ? [phrase.top.start] : [];
    });
    // The peaks as the heard words' places (the nearest word start)
    const peakPlaces = new Set(text?.timed ? peakTimes.map((at) => text.words.reduce((best, word, index) => (Math.abs((word.start ?? 0) - at) < Math.abs((text.words[best]!.start ?? 0) - at) ? index : best), 0)) : []);
    // The pause lens
    const pauses = text?.timed ? pauseLens(text, peakPlaces) : null;
    // The pace lens
    const pace = text ? paceLens(text, usualPace(sessions, session)) : null;
    // The words lens
    const words = text && text.words.length > 0 ? wordsLens(text.words, analysis?.rubric?.wordSwaps ?? []) : null;
    // The clarity lens
    const clarity = text?.deep ? clarityLens(text.words) : null;
    // The pause words' moments (none when pause words are hidden)
    const ums = pauseWords ? fillerTimes(text) : [];
    // The fingerprint, for a long take
    const print = plan.views.includes("fingerprint") && session.loudness && session.loudness.length > 0 ? takeFingerprint({ levels: session.loudness, tickMs: LOUDNESS_TICK_MS, duration: session.durationSec, ums, peaks: peakTimes, midPauses: (pauses?.marks ?? []).filter((mark) => mark.kind === "mid" && !mark.beat).map((mark) => ({ start: text!.words[mark.after]!.end ?? 0, end: text!.words[mark.after + 1]!.start ?? 0 })), betweenPauses: pauses?.counts.between ?? 0 }) : null;
    // The best moment, for a long take
    const moment = plan.views.includes("best-moment") && phrases.length > 0 ? bestMoment({ phrases, fillers: fillerTimes(text), levels: session.loudness ?? [], tickMs: LOUDNESS_TICK_MS }) : null;
    // The energy arc, for a long take
    const arc = plan.views.includes("energy-arc") && session.loudness && session.pitch ? energyArc(session.loudness, session.pitch, LOUDNESS_TICK_MS) : null;
    // Everything
    return { text, pauses, pace, words, clarity, print, moment, arc, phrases };
  }, [ready, session, serverWords, script, sessions, analysis, plan, pauseWords]);
  // Whether the lens tabs are open: open from the start on a long take
  const [open, setOpen] = useState(plan.views.includes("lens-tabs"));
  // The lens shown
  const [lens, setLens] = useState<LensId>(plan.lens);
  // The tab list, to move focus to when opened
  const tabs = useRef<HTMLDivElement | null>(null);
  // Play from just before a moment
  const playFrom = useCallback((seconds: number) => {
    // The page's player
    const element = audio();
    // Nothing to play
    if (!element) return;
    // A moment before it
    element.currentTime = Math.max(0, seconds - LEAD_IN);
    // Play (the browser may refuse, which is fine)
    void element.play().catch(() => {});
  }, [audio]);
  // Play one stretch, then stop
  const playRange = useCallback((start: number, end: number) => {
    // The page's player
    const element = audio();
    // Nothing to play
    if (!element) return;
    // Stop at the end
    const stop = () => {
      // Past the end: pause and stop listening
      if (element.currentTime >= end) {
        // Paused
        element.pause();
        // No longer listening
        element.removeEventListener("timeupdate", stop);
      }
    };
    // Listen
    element.addEventListener("timeupdate", stop);
    // From the start
    element.currentTime = start;
    // Play
    void element.play().catch(() => {});
  }, [audio]);
  // The lenses that can show something (clarity only with deeper analysis)
  const offered = LENSES.filter((id) => id !== "clarity" || found?.clarity);
  // Open the tabs on a lens, focusing the tab list
  const openTabs = () => {
    // On the plan's lens, or the first one offered
    setLens(offered.includes(plan.lens) ? plan.lens : "pitch");
    // Open
    setOpen(true);
    // Focus the chosen tab once drawn
    setTimeout(() => tabs.current?.querySelector<HTMLButtonElement>("[aria-selected='true']")?.focus(), 0);
  };
  // Nothing until the analysis is read (a moment), so nothing flashes
  if (!found) return null;
  // Whether the recording can play
  const onPlay: PlayFrom = session.audioKey ? playFrom : null;
  // The pitch section, as before
  const pitchSection = session.trimmedAt ? <TrimmedNote /> : <VoiceSection repo={repo} session={session} usual={usual} hide={hide} fluency={fluency} script={script} onPlay={session.audioKey ? () => playFrom(0) : null} />;
  // One lens's content
  const lensContent = (id: LensId) => {
    // Pitch: the section as before
    if (id === "pitch") return pitchSection;
    // Pauses and ums
    if (id === "pauses") return found.text && found.pauses ? <PausesLensView text={found.text} lens={found.pauses} onPlay={onPlay} pauseWords={pauseWords} /> : <LensEmpty>{session.trimmedAt ? "Pauses aren’t kept for older takes." : "Pauses need the times of your words, which this take didn’t keep."}</LensEmpty>;
    // Pace
    if (id === "pace") return found.text && found.pace ? <PaceLensView text={found.text} lens={found.pace} /> : <LensEmpty>{session.trimmedAt ? "Pace isn’t kept for older takes." : "Too few timed words to show pace."}</LensEmpty>;
    // Words
    if (id === "words") return found.text && found.words ? <WordsLensView text={found.text} lens={found.words} onPlay={found.text.timed ? onPlay : null} /> : <LensEmpty>No words were caught.</LensEmpty>;
    // Clarity
    return found.text && found.clarity ? <ClarityLensView text={found.text} lens={found.clarity} onPlay={onPlay} /> : <LensEmpty>Clarity needs deeper analysis (Settings, Coach and services).</LensEmpty>;
  };
  // Arrow keys move between the tabs
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    // Which way
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    // Not an arrow
    if (step === 0) return;
    // The next lens
    const next = offered[(offered.indexOf(lens) + step + offered.length) % offered.length]!;
    // Chosen
    setLens(next);
    // Focused
    setTimeout(() => tabs.current?.querySelector<HTMLButtonElement>(`[data-tab='${next}']`)?.focus(), 0);
  };
  // The inline views, before "Look closer" is used
  const inline = plan.views.filter((view): view is "pitch-text" | Exclude<LensId, "pitch"> => view === "pitch-text" || view === "pauses" || view === "pace" || view === "words" || view === "clarity");
  // The views
  return (
    <>
      {/* A long take's fingerprint, at the top */}
      {found.print && <FingerprintCard print={found.print} />}
      {/* The lens tabs, open */}
      {open ? (
        <section aria-label="Look closer" data-lens-tabs className="mt-5">
          {/* The tabs */}
          <div ref={tabs} role="tablist" aria-label="Ways to look at your take" onKeyDown={onKey} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {/* One per lens */}
            {offered.map((id) => <button key={id} type="button" role="tab" id={`lens-tab-${id}`} data-tab={id} aria-selected={lens === id} aria-controls="lens-panel" tabIndex={lens === id ? 0 : -1} onClick={() => setLens(id)} className={`min-h-11 flex-none rounded-full px-3.5 text-footnote font-semibold whitespace-nowrap ${PRESS} ${lens === id ? "bg-fill text-fill-ink" : "border-2 border-rule text-ink hover:bg-card"}`}>{LENS_NAMES[id]}</button>)}
          </div>
          {/* The lens shown */}
          <div id="lens-panel" role="tabpanel" aria-labelledby={`lens-tab-${lens}`} className={lens === "pitch" ? "" : "mt-3"}>{lensContent(lens)}</div>
          {/* Clarity's place, when it cannot be shown */}
          {!offered.includes("clarity") && <LensEmpty>Clarity needs deeper analysis (Settings, Coach and services).</LensEmpty>}
        </section>
      ) : (
        <>
          {/* Each of the take's own views */}
          {inline.map((view) => (view === "pitch-text" ? <div key={view}>{pitchSection}</div> : (
            <section key={view} aria-labelledby={`lens-heading-${view}`} className="mt-5">
              {/* Its name */}
              <h2 id={`lens-heading-${view}`} className={`mb-3 ${SECTION_HEADING}`}>{LENS_NAMES[view]}</h2>
              {/* Its content */}
              {lensContent(view)}
            </section>
          )))}
          {/* An older take with nothing inline: say so where the charts were */}
          {inline.length === 0 && session.trimmedAt && <TrimmedNote />}
          {/* Look closer */}
          {plan.lookCloser && <LookCloser onOpen={openTabs} detail={`${offered.filter((id) => !inline.includes(id === "pitch" ? "pitch-text" : id)).map((id) => LENS_NAMES[id].toLowerCase()).join(", ")}`} />}
        </>
      )}
      {/* The best moment */}
      {found.moment && <BestMomentCard moment={found.moment} onPlay={session.audioKey ? playRange : null} />}
      {/* The energy arc */}
      {found.arc && <EnergyArcCard arc={found.arc} />}
      {/* Every chart, for a week of testing (decision 124; not for a drill or a conversation, which keep their own pictures, nor a take whose readings were dropped) */}
      {session.mode !== "voice" && session.mode !== "conversation" && !session.trimmedAt && <ChartTrial session={session} sessions={sessions} usual={usual} text={found.text} pauses={found.pauses} pace={found.pace} phrases={found.phrases} pauseWords={pauseWords} onPlay={onPlay} />}
    </>
  );
}
