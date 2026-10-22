"use client";
// Phrase rows (decision 111): a take's pitch phrase by phrase, one tap from "Your voice" on its page. Each phrase has a smooth curve over its words with the usual pitch dashed across it and how it ended; the pause before each phrase sits between the rows; notes only where useful. A player at the top: while it plays, the phrase is highlighted, a playhead moves along its curve and the word is highlighted; tapping a word plays from there

// Load React's state, memo, callback and effect tools
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { Masthead } from "@/components/script/Masthead";
import { Player } from "@/components/script/Player";
import { Skeleton } from "@/components/script/Skeleton";
import { CurveRow, END_COLOURS, EndIcon, useRowWidth, useWordMeasure, type WordLook } from "@/components/script/PitchShapes";
// Load the shared looks
import { CARD } from "@/components/script/textStyles";
import { QUIET, TEXT_LINK } from "@/components/script/Buttons";
// Load the shared screen starting points, the tab title, the audio, the service words and the script
import { useScreenBasics, type ScreenProps } from "@/components/screens/screenBasics";
import { usePageTitle } from "@/components/screens/usePageTitle";
import { useAudioUrl } from "@/components/screens/useAudioUrl";
import { useServerWords } from "@/components/screens/useServerWords";
import { useTakeScript } from "@/components/screens/useTakeScript";
// Load the pitch in the words
import { takePitch } from "@/core/takePitch";
import { curveLines, describePhrase, phraseNote, xForTime, yForStep, USUAL_Y, type Phrase, type PitchWords } from "@/core/pitchPhrases";
import { smoothPath } from "@/core/pitchClean";
// Load the clock format and the playback boost
import { formatClock } from "@/core/recordingRules";
import { playbackGain } from "@/core/voiceLevels";
// Load the record type
import type { FullSession } from "@/data/records";

// Phrases shown at a time on a long take
export const PHRASES_PER_PAGE = 40;

// How each ending is named on its row
const END_NAMES = { fell: "Fell", held: "Held: more to come", rose: "Rose" } as const;

// What the page is given
interface PhraseRowsProps extends ScreenProps {
  // The take's id
  sessionId: string;
}

// Whether the person asked for less motion (read in the browser only)
function prefersLessMotion(): boolean {
  // The media query, where there is one
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// One phrase's rows: its header, its curve over its words, and its note
function PhraseRow({ phrase, pitch, width, measure, time, playing, current, onWord }: { phrase: Phrase; pitch: PitchWords; width: number; measure: (text: string, bold: boolean) => number; time: number; playing: boolean; current: boolean; onWord: ((seconds: number) => void) | null }) {
  // Its rows
  const lines = curveLines(phrase.words, pitch.curve, pitch.tickMs, width, measure);
  // The note, if useful
  const note = phraseNote(phrase);
  // The word playing now, while this phrase plays
  const nowWord = current ? phrase.words.findIndex((word, place) => time >= word.start - 0.02 && time < (phrase.words[place + 1]?.start ?? word.end + 0.3)) : -1;
  // How each word looks
  const look = (place: number): WordLook => (place === nowWord ? "current" : phrase.words[place]!.peak ? "peak" : phrase.flat ? "muted" : "plain");
  // The row
  return (
    <div data-phrase-row={phrase.index} data-current={current || undefined} className={`flex flex-col gap-1 ${current ? "-mx-2.5 rounded-xl bg-paper-raised p-2.5" : ""}`}>
      {/* Its number and how it ended */}
      <div className="flex items-center justify-between gap-2 text-footnote text-ink-muted">
        {/* Its number */}
        <span>Phrase {phrase.index + 1}{current && playing ? " · playing" : ""}</span>
        {/* How it ended */}
        {phrase.ending && <span className={`flex items-center gap-1 font-semibold ${END_COLOURS[phrase.ending]}`}><EndIcon end={phrase.ending} />{END_NAMES[phrase.ending]}</span>}
      </div>
      {/* Each row of the phrase */}
      {lines.map((line, index) => {
        // The row's time
        const [from, to] = [phrase.words[line.slots[0]!.index]!.start, phrase.words[line.slots.at(-1)!.index]!.end];
        // The playhead, while this row plays
        const inRow = current && time >= from - 0.02 && time <= to + 0.02;
        // Its place: across by the moment, up by the pitch then (on the usual line in a gap)
        const step = pitch.curve[Math.round((time * 1000) / pitch.tickMs)] ?? null;
        // The playhead
        const playhead = inRow ? { x: Math.round(xForTime(time, line.slots, phrase.words) * 10) / 10, y: step === null ? USUAL_Y : yForStep(step) } : null;
        // The row
        return <CurveRow key={index} width={width} words={phrase.words} slots={line.slots} path={smoothPath(line.points)} label={lines.length > 1 ? `${describePhrase(phrase)} Line ${index + 1} of ${lines.length}.` : describePhrase(phrase)} playhead={playhead} look={look} onWord={onWord ? (place) => onWord(phrase.words[place]!.start) : null} wordLabel={(place) => `${phrase.words[place]!.text.replace(/[^\p{L}\p{N}'’-]+/gu, "")}, ${formatClock(phrase.words[place]!.start)}, play from here`} />;
      })}
      {/* A note, only where useful */}
      {note && <p className={`mt-1 text-footnote leading-snug ${note.tone === "work" ? "rounded-[10px] bg-warm-tint px-2.5 py-2 text-warm-ink" : "text-accent"}`}>{note.text}</p>}
    </div>
  );
}

// The page
export function PhraseRowsScreen({ sessionId, ...props }: PhraseRowsProps) {
  // The repository, and today's date once in the browser
  const { repo, today } = useScreenBasics(props);
  // The take with its readings (undefined while loading, null when missing)
  const [session, setSession] = useState<FullSession | null | undefined>(undefined);
  // Why it could not be read, if it could not
  const [loadError, setLoadError] = useState<string | null>(null);
  // The deeper analysis's words
  const server = useServerWords(repo, sessionId);
  // The text it read, if any
  const script = useTakeScript(session ?? null);
  // Its recording
  const url = useAudioUrl(repo, session?.audioKey ?? null).url;
  // The player's audio element
  const audio = useRef<HTMLAudioElement | null>(null);
  // Where playback is, in seconds
  const [time, setTime] = useState(0);
  // Whether it is playing
  const [playing, setPlaying] = useState(false);
  // How many phrases are shown (a page at a time on a long take)
  const [shownCount, setShownCount] = useState(PHRASES_PER_PAGE);
  // The width the rows are drawn in
  const { ref, width } = useRowWidth();
  // How wide words are
  const measure = useWordMeasure();
  // Name the tab
  usePageTitle("Your voice, phrase by phrase");

  // Read the take once the date is known
  useEffect(() => {
    // Wait for the browser
    if (!today) return;
    // Ignore a late answer
    let cancelled = false;
    // Read it with its readings
    repo.getFullSession(sessionId).then((found) => {
      // Keep it
      if (!cancelled) setSession(found ?? null);
    }, (error: unknown) => {
      // Say why
      if (!cancelled) setLoadError(error instanceof Error ? error.message : String(error));
    });
    // Stop on leaving
    return () => {
      // Ignore late answers
      cancelled = true;
    };
  }, [repo, sessionId, today]);

  // Follow the playback smoothly while it plays, unless less motion is asked for (then the playhead moves with the player's own updates)
  useEffect(() => {
    // Only while playing, with motion welcome
    if (!playing || prefersLessMotion()) return;
    // The next frame
    let frame = 0;
    // Each frame
    const follow = () => {
      // Where the audio is
      if (audio.current) setTime(audio.current.currentTime);
      // Again next frame
      frame = requestAnimationFrame(follow);
    };
    // Start
    frame = requestAnimationFrame(follow);
    // Stop when it stops
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  // The pitch in the words, once the take, its analysis and its text are known
  const pitch = useMemo(() => (session && server.ready && script.ready ? takePitch(session, { serverWords: server.words, script: script.script }) : null), [session, server.ready, server.words, script.ready, script.script]);

  // Play from a moment (a tapped word)
  const playFrom = useCallback((seconds: number) => {
    // The element
    const element = audio.current;
    // Nothing to play
    if (!element) return;
    // Move there
    element.currentTime = Math.max(0, seconds);
    // Show it at once
    setTime(Math.max(0, seconds));
    // Play (the browser may refuse, which is fine)
    void element.play().catch(() => undefined);
  }, []);

  // The way back to the take
  const back = { href: session ? `/sessions?id=${encodeURIComponent(session.id)}` : "/history", label: session ? "Close, back to your take" : "Close, back to History" };
  // The phrases, when drawn
  const ready = pitch?.state === "ready" ? pitch.pitch : null;
  // The phrase playing now: the last one started, once playback has begun
  const currentIndex = ready && (playing || time > 0) ? ready.phrases.reduce((found, phrase) => (time >= phrase.start - 0.05 ? phrase.index : found), -1) : -1;
  // The phrases shown
  const shown = ready ? ready.phrases.slice(0, shownCount) : [];

  // Draw the page
  return (
    <main id="main" data-area="results" className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-paper-raised px-6 pt-6 pb-16 md:px-14 md:pt-10">
      {/* Title and the way back */}
      <Masthead title="Your take" nav={false} close={back} />
      {/* The heading and what the page shows */}
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Your voice</h1>
      {/* Could not be read */}
      {loadError !== null && <p role="alert" className="mt-4 max-w-[48ch] text-lede">This take could not be loaded. The browser said: “{loadError}” Reload the page to try again.</p>}
      {/* Not on this device */}
      {session === null && <p className="mt-4 text-lede text-ink-muted">This take is not on this device. <Link href="/history" data-inline className={TEXT_LINK}>Back to History</Link></p>}
      {/* Loading */}
      {loadError === null && session !== null && !pitch && <Skeleton blocks={["h-16", "h-64"]} />}
      {/* Readings dropped (decision 98) */}
      {pitch?.state === "trimmed" && <p data-trimmed className="mt-4 text-footnote text-ink-muted">Detailed charts aren’t kept for older takes. The words, numbers and feedback are all here.</p>}
      {/* Never recorded */}
      {pitch?.state === "none" && <p className="mt-4 text-footnote text-ink-muted">This take has no pitch readings to draw.</p>}
      {/* Too little voice, or no words */}
      {(pitch?.state === "quiet" || pitch?.state === "no-words") && <p className="mt-4 text-footnote text-ink-muted">{pitch.state === "quiet" ? "Too little voice was heard to draw your pitch." : "No words were caught, so there are no phrases to show."}</p>}
      {/* The phrases */}
      {ready && session && (
        <>
          {/* What the rows show */}
          <p className="mt-1 max-w-[52ch] text-footnote text-ink-muted">Each row is one phrase. The curve is your pitch above the words you said.{url ? " Tap any word to hear it from there." : ""}</p>
          {/* The player, or why there is none */}
          {url ? (
            <div className="mt-4"><Player src={url} label="Your recording" name="your recording" durationSec={session.durationSec} gain={playbackGain(session.loudnessScale)} onAudio={(element) => { audio.current = element; }} onTime={(seconds, isPlaying) => { setTime(seconds); setPlaying(isPlaying); }} /></div>
          ) : (
            <p className="mt-4 text-footnote text-ink-muted">The recording isn’t kept any more, so the words can’t play. The pitch is all here.</p>
          )}
          {/* The key */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-footnote text-ink-muted">
            {/* The usual pitch */}
            <span className="flex items-center gap-1.5"><svg width="22" height="6" aria-hidden="true" className="text-ink-muted"><line x1="0" y1="3" x2="22" y2="3" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" opacity="0.6" /></svg>Your usual pitch</span>
            {/* Fell */}
            <span className="flex items-center gap-1.5"><EndIcon end="fell" />Fell: sounds finished</span>
            {/* Rose */}
            <span className="flex items-center gap-1.5"><EndIcon end="rose" />Rose: sounds like a question</span>
          </div>
          {/* The rows, in one card */}
          <div ref={ref} data-phrase-rows className={`mt-4 flex flex-col p-4 ${CARD}`}>
            {/* Each phrase, with the pause before it */}
            {shown.map((phrase) => (
              <div key={phrase.index}>
                {/* The pause before it */}
                {phrase.pauseBefore !== null && (
                  <div className="flex items-center gap-2 py-2 text-footnote text-ink-muted">
                    {/* A rule */}
                    <span aria-hidden="true" className="h-px flex-1 bg-rule" />
                    {/* The length */}
                    <span>{phrase.pauseBefore.toFixed(1)} s pause</span>
                    {/* A rule */}
                    <span aria-hidden="true" className="h-px flex-1 bg-rule" />
                  </div>
                )}
                {/* The phrase */}
                <PhraseRow phrase={phrase} pitch={ready} width={width - 32} measure={measure} time={time} playing={playing} current={phrase.index === currentIndex} onWord={url ? playFrom : null} />
              </div>
            ))}
          </div>
          {/* More phrases on a long take */}
          {ready.phrases.length > shown.length && <p className="mt-4"><button type="button" onClick={() => setShownCount((count) => count + PHRASES_PER_PAGE)} className={QUIET}>Show the next {Math.min(PHRASES_PER_PAGE, ready.phrases.length - shown.length)} phrases</button> <span className="text-footnote text-ink-muted">Showing {shown.length} of {ready.phrases.length}</span></p>}
          {/* Where the word times came from */}
          <p className="mt-4 max-w-[52ch] text-footnote text-ink-muted">{ready.precision === "exact" ? "Word timings from deeper analysis." : "Rough word timings: words are placed from the phone’s timings. Deeper analysis gives exact ones."}</p>
        </>
      )}
      {/* Back to the take */}
      {session && <p className="mt-6"><Link href={back.href} className={TEXT_LINK}>Back to your take</Link></p>}
    </main>
  );
}
