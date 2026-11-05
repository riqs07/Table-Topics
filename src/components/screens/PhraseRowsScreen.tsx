"use client";
// Phrase rows (decision 111; second design pass: the practice layout, the rows in a card on the left, how to read them on the right, the not-found card): a take's pitch phrase by phrase, one tap from "Your voice" on its page. Each phrase has a smooth curve over its words with the usual pitch dashed across it and how it ended; the pause before each phrase sits between the rows; notes only where useful. A player at the top: while it plays, the phrase is highlighted, a playhead moves along its curve and the word is highlighted; tapping a word plays from there

// Load React's state, memo, callback and effect tools
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the script-page building blocks
import { PRACTICE_BODY, PRACTICE_COLUMNS, PRACTICE_MAIN, PracticeBar, STEP_LABEL } from "@/components/script/PracticeBar";
import { NotFoundCard } from "@/components/script/VoiceTakeStage";
import { Cast } from "@/components/scenes/Cast";
import { Player } from "@/components/script/Player";
import { Skeleton } from "@/components/script/Skeleton";
import { CurveRow, END_COLOURS, EndIcon, useRowWidth, useWordMeasure, type WordLook } from "@/components/script/PitchShapes";
// Load the shared looks
import { CARD, LAB } from "@/components/script/textStyles";
import { QUIET, SECONDARY } from "@/components/script/Buttons";
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
    <main id="main" data-area="results" className={PRACTICE_MAIN}>
      {/* Title and the way back */}
      <PracticeBar close={back} label="Your take · phrase by phrase" />
      {/* Not on this device: the card with the way back */}
      {session === null ? (
        <div className={PRACTICE_BODY}>
          <NotFoundCard title="This take is not on this device." line="Takes stay on the device that recorded them, and cleared ones are gone. Your other takes are in History." href="/history" action="Back to History" />
        </div>
      ) : (
        <div className={PRACTICE_BODY}>
          {/* The label */}
          <p className={STEP_LABEL}>{session ? `${formatClock(Math.round(session.durationSec))} take` : "Your take"}</p>
          {/* The heading */}
          <h1 className="mt-2 font-display text-statement leading-tight font-semibold">Your voice, phrase by phrase</h1>
          <div className={`mt-6 ${PRACTICE_COLUMNS}`}>
            <section aria-label="Your phrases" className="flex min-w-0 flex-col">
              {/* Could not be read */}
              {loadError !== null && <p role="alert" className="max-w-[48ch] rounded-2xl bg-warm-tint px-4 py-3 font-bold text-warm-ink">This take could not be loaded. The browser said: “{loadError}” Reload the page to try again.</p>}
              {/* Loading */}
              {loadError === null && !pitch && <Skeleton blocks={["h-16", "h-64"]} />}
              {/* Nothing to draw: readings dropped (decision 98), never recorded, too little voice, or no words */}
              {pitch && pitch.state !== "ready" && (
                <div className={`flex items-center gap-4 p-5 ${CARD}`}>
                  {/* You, puzzled */}
                  <Cast who="you" face="wonder" className="size-16 flex-none" />
                  {/* Why */}
                  <p className="font-bold" data-trimmed={pitch.state === "trimmed" || undefined}>{pitch.state === "trimmed" ? "Detailed charts aren’t kept for older takes. The words, numbers and feedback are all here." : pitch.state === "none" ? "This take has no pitch readings to draw." : pitch.state === "quiet" ? "Too little voice was heard to draw your pitch." : "No words were caught, so there are no phrases to show."}</p>
                </div>
              )}
              {/* The phrases */}
              {ready && session && (
                <>
                  {/* The player, or why there is none */}
                  {url ? (
                    <div><Player src={url} label="Your recording" name="your recording" durationSec={session.durationSec} gain={playbackGain(session.loudnessScale)} onAudio={(element) => { audio.current = element; }} onTime={(seconds, isPlaying) => { setTime(seconds); setPlaying(isPlaying); }} /></div>
                  ) : (
                    <p className="text-footnote text-ink-muted">The recording isn’t kept any more, so the words can’t play. The pitch is all here.</p>
                  )}
                  {/* The rows, in one card */}
                  <div ref={ref} data-phrase-rows className={`mt-4 flex flex-col p-4 ${CARD}`}>
                    {/* Each phrase, with the pause before it */}
                    {shown.map((phrase) => (
                      <div key={phrase.index}>
                        {/* The pause before it */}
                        {phrase.pauseBefore !== null && (
                          <div className="flex items-center gap-2 py-2 text-footnote font-bold text-ink-muted">
                            {/* A rule */}
                            <span aria-hidden="true" className="h-0.5 flex-1 rounded-full bg-chart-band" />
                            {/* The length */}
                            <span>{phrase.pauseBefore.toFixed(1)} s pause</span>
                            {/* A rule */}
                            <span aria-hidden="true" className="h-0.5 flex-1 rounded-full bg-chart-band" />
                          </div>
                        )}
                        {/* The phrase */}
                        <PhraseRow phrase={phrase} pitch={ready} width={width - 32} measure={measure} time={time} playing={playing} current={phrase.index === currentIndex} onWord={url ? playFrom : null} />
                      </div>
                    ))}
                  </div>
                  {/* More phrases on a long take */}
                  {ready.phrases.length > shown.length && <p className="mt-4"><button type="button" onClick={() => setShownCount((count) => count + PHRASES_PER_PAGE)} className={QUIET}>Show the next {Math.min(PHRASES_PER_PAGE, ready.phrases.length - shown.length)} phrases</button> <span className="text-footnote text-ink-muted">Showing {shown.length} of {ready.phrases.length}</span></p>}
                </>
              )}
            </section>
            {/* Beside it: how to read the rows, and the way back */}
            <aside aria-label="How to read it" className="flex min-w-0 flex-col gap-4">
              {ready && (
                <div className={`p-5 ${CARD}`}>
                  {/* The label */}
                  <p className={LAB}>How to read it</p>
                  {/* What the rows show */}
                  <p className="mt-2 font-bold">Each row is one phrase. The curve is your pitch above the words you said.{url ? " Tap any word to hear it from there." : ""}</p>
                  {/* The key */}
                  <div className="mt-3 flex flex-col gap-1.5 text-footnote text-ink-muted">
                    {/* The usual pitch */}
                    <span className="flex items-center gap-1.5"><svg width="22" height="6" aria-hidden="true" className="text-ink-muted"><line x1="0" y1="3" x2="22" y2="3" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" opacity="0.6" /></svg>Your usual pitch</span>
                    {/* Fell */}
                    <span className="flex items-center gap-1.5"><EndIcon end="fell" />Fell: sounds finished</span>
                    {/* Rose */}
                    <span className="flex items-center gap-1.5"><EndIcon end="rose" />Rose: sounds like a question</span>
                  </div>
                  {/* Where the word times came from */}
                  <p className="mt-3 text-footnote text-ink-muted">{ready.precision === "exact" ? "Word timings from deeper analysis." : "Rough word timings: words are placed from the phone’s timings. Deeper analysis gives exact ones."}</p>
                </div>
              )}
              {/* Back to the take */}
              {session && <p><Link href={back.href} className={SECONDARY}>Back to your take</Link></p>}
            </aside>
          </div>
        </div>
      )}
    </main>
  );
}
