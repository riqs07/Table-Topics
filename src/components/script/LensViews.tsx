"use client";
// The lenses on a take's words (decision 115): the same words each time with a different overlay. Pauses and ums (pause pills sized by length, warm where a pause split a sentence, pause words faded and tappable to hear), pace (words spaced out where slow and drawn closer where fast, and a speed line against the usual band), word choice (concrete words bold, hedges and vague words with a soft wavy underline, tap for the swap) and clarity (words the transcription service found hard to catch, dashed, tap to hear, and the Clear sounds drill that fits). Colour roles only

// Load React's state tool
import { useState } from "react";
// Load the button looks and the filled link
import { PrimaryLink, QUIET } from "@/components/script/Buttons";
// Load the shared card and label looks
import { CARD, LABEL } from "@/components/script/textStyles";
// Load the lens findings and their types
import type { LensText, LensWord } from "@/core/lenses/lensWords";
import type { PauseLens } from "@/core/lenses/pauseLens";
import type { PaceLens } from "@/core/lenses/paceLens";
import type { WordSpan, WordsLens } from "@/core/lenses/wordsLens";
import { clarityHeadline, clarityNote, type ClarityLens } from "@/core/lenses/clarityLens";
// Load the clock formatter
import { formatClock } from "@/core/recordingRules";
// Load the smooth path drawer
import { smoothPath } from "@/core/pitchClean";

// Play from a moment, or null when the recording is not kept
export type PlayFrom = ((seconds: number) => void) | null;

// A word without its punctuation, for labels
function bare(text: string): string {
  // Leading and trailing punctuation dropped
  return text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’]+$/gu, "");
}

// The lens's words in a white card at reading size
function WordsCard({ children, label }: { children: React.ReactNode; label: string }) {
  // The card
  return <p aria-label={label} className={`px-4 py-5 text-lede leading-[2.2] ${CARD}`}>{children}</p>;
}

// A note under a lens: the first part in bold, a dot for its tone read out
function Note({ tone, lead, rest }: { tone: "work" | "good"; lead: string; rest: string }) {
  // The note in a white card
  return (
    <p data-note={tone} className={`flex gap-2.5 px-3.5 py-3 text-footnote leading-snug ${CARD}`}>
      {/* The dot */}
      <span aria-hidden="true" className={`mt-1.5 size-2 flex-none rounded-full ${tone === "work" ? "bg-warm" : "bg-accent"}`} />
      {/* The words, with what the dot means for screen readers */}
      <span><span className="sr-only">{tone === "work" ? "To work on: " : "Went well: "}</span><b>{lead}</b>{rest}</span>
    </p>
  );
}

// A pause pill: wider the longer the pause, calm between thoughts (and for a beat before a peak), warm and outlined where it split a sentence
function PausePill({ seconds, kind }: { seconds: number; kind: "between" | "mid" }) {
  // Its width: from 1.75 rem, a little wider for each tenth of a second up to 2.5 s
  const width = `${1.75 + Math.min(2.5, seconds) * 1.1}rem`;
  // The pill, named for screen readers
  return <span data-pause={kind} role="img" aria-label={`${seconds} second pause${kind === "mid" ? ", mid-sentence" : ""}`} style={{ minWidth: width }} className={`mx-1 inline-flex h-[22px] items-center justify-center rounded-full px-1.5 align-middle text-footnote leading-none font-semibold ${kind === "mid" ? "bg-warm-tint text-warm-ink ring-2 ring-warm" : "bg-accent/15 text-accent"}`}>{seconds >= 0.5 ? `${seconds} s` : seconds}</span>;
}

// A pause word in place: faded, and a button that plays its moment when the recording is kept
function FillerWord({ word, onPlay }: { word: LensWord; onPlay: PlayFrom }) {
  // Its look: faded, italic, dotted underline
  const look = "italic text-filler underline decoration-dotted decoration-2 underline-offset-4";
  // A button when it can play
  if (onPlay && word.start !== null) return <button type="button" data-filler onClick={() => onPlay(word.start!)} aria-label={`${bare(word.text)}, ${formatClock(Math.floor(word.start))}, play`} className={`${look} -mx-0.5 inline-flex min-h-11 items-center px-0.5 align-baseline`}>{word.text}</button>;
  // Otherwise the word
  return <span data-filler className={look}>{word.text}</span>;
}

// The pauses-and-ums lens
export function PausesLensView({ text, lens, onPlay, pauseWords }: { text: LensText; lens: PauseLens; onPlay: PlayFrom; pauseWords: boolean }) {
  // The pauses by the word they follow
  const after = new Map(lens.marks.map((mark) => [mark.after, mark]));
  // The view
  return (
    <div data-lens="pauses" className="flex flex-col gap-3">
      {/* The counts */}
      <div className={`grid gap-2 ${pauseWords ? "grid-cols-3" : "grid-cols-2"}`}>
        {/* Between thoughts */}
        <div className="rounded-2xl bg-card px-3 py-2.5"><span className="block font-display text-cue font-semibold">{lens.counts.between}</span><span className="block text-footnote leading-tight text-ink-muted">{lens.counts.between === 1 ? "pause between thoughts" : "pauses between thoughts"}</span></div>
        {/* Mid-sentence */}
        <div className="rounded-2xl bg-warm-tint px-3 py-2.5 text-warm-ink"><span className="block font-display text-cue font-semibold">{lens.counts.mid}</span><span className="block text-footnote leading-tight">{lens.counts.mid === 1 ? "pause mid-sentence" : "pauses mid-sentence"}</span></div>
        {/* Pause words */}
        {pauseWords && <div className="rounded-2xl bg-card px-3 py-2.5"><span className="block font-display text-cue font-semibold">{lens.counts.fillers}</span><span className="block text-footnote leading-tight text-ink-muted">{lens.counts.fillers === 1 ? "pause word" : "pause words"}</span></div>}
      </div>
      {/* The words with their pauses */}
      <WordsCard label="What you said, with its pauses">
        {/* Each word, then its pause */}
        {text.words.map((word, index) => (
          <span key={index}>
            {/* The word: a pause word in place, or plain */}
            {word.filler && pauseWords ? <FillerWord word={word} onPlay={onPlay} /> : <span>{word.text}</span>}
            {/* The pause after it, or a space */}
            {after.has(index) ? <PausePill seconds={after.get(index)!.seconds} kind={after.get(index)!.beat ? "between" : after.get(index)!.kind} /> : " "}
          </span>
        ))}
      </WordsCard>
      {/* What the marks mean */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-footnote text-ink-muted">
        {/* Between thoughts */}
        <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-3 w-5 rounded-full bg-accent/15" />Pause between thoughts</span>
        {/* Mid-sentence */}
        <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-3 w-5 rounded-full bg-warm-tint ring-2 ring-warm" />Pause mid-sentence</span>
        {/* Pause words */}
        {pauseWords && lens.counts.fillers > 0 && <span className="flex items-center gap-1.5"><span aria-hidden="true" className="italic text-filler underline decoration-dotted decoration-2">um</span>{onPlay ? "Tap to hear it" : "Pause word"}</span>}
      </div>
      {/* Up to two notes */}
      {lens.notes.map((note) => <Note key={note.tone} {...note} />)}
      {/* Rough times, said quietly */}
      {text.precision === "rough" && <p className="text-footnote text-ink-muted">Pauses are placed from the phone’s timings, so short ones are rough.</p>}
    </div>
  );
}

// Each pace's spacing: slow spaced out a little, fast drawn closer and in the warm ink
const PACE_LOOKS = { slow: "tracking-[0.06em]", usual: "", fast: "tracking-[-0.03em] text-warm-ink" } as const;

// The pace lens
export function PaceLensView({ text, lens }: { text: LensText; lens: PaceLens }) {
  // The line's picture: 326 across, 56 down
  const [width, height] = [326, 56];
  // The top and bottom of the scale, in words a minute
  const [top, bottom] = [Math.max(lens.band.high + 20, ...lens.line.map((point) => point.wpm)), Math.max(0, Math.min(lens.band.low - 20, ...lens.line.map((point) => point.wpm)))];
  // Down the picture for a pace
  const y = (wpm: number) => 4 + ((top - wpm) / Math.max(1, top - bottom)) * (height - 8);
  // Across the picture for a moment
  const x = (t: number) => ((t - lens.line[0]!.t) / Math.max(1, lens.line.at(-1)!.t - lens.line[0]!.t)) * width;
  // The view
  return (
    <div data-lens="pace" className="flex flex-col gap-3">
      {/* The words, spaced by pace */}
      <WordsCard label="What you said, spaced by pace">
        {/* Each phrase */}
        {lens.phrases.map((phrase) => <span key={phrase.from} data-pace={phrase.pace} className={PACE_LOOKS[phrase.pace]}>{text.words.slice(phrase.from, phrase.to + 1).map((word) => word.text).join(" ")} </span>)}
      </WordsCard>
      {/* The speed line against the band */}
      <div className={`px-4 py-3 ${CARD}`}>
        {/* The picture */}
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Speaking speed across the take. ${lens.summary}`} className="h-14 w-full">
          {/* The band */}
          <rect x="0" y={y(lens.band.high)} width={width} height={Math.max(2, y(lens.band.low) - y(lens.band.high))} className="fill-accent/15" />
          {/* The line */}
          <path d={smoothPath(lens.line.map((point) => ({ x: x(point.t), y: y(point.wpm) })))} className="text-accent" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* The ends */}
        <p className="mt-1 flex justify-between text-footnote text-ink-muted"><span>start</span><span>end</span></p>
      </div>
      {/* What it means */}
      <p className="text-footnote leading-snug">Spaced-out words were slow, closer words fast. The band is {lens.band.usual ? "your usual pace" : "this take’s middle pace"}, {lens.band.low} to {lens.band.high} words a minute. <b>{lens.summary}</b></p>
    </div>
  );
}

// The look of each kind of marked word
const WORD_LOOKS = { concrete: "font-bold text-accent", hedge: "underline decoration-wavy decoration-warm underline-offset-[5px]", vague: "underline decoration-wavy decoration-warm underline-offset-[5px]", intensifier: "rounded-md bg-warm-tint px-1 text-warm-ink underline decoration-wavy decoration-warm underline-offset-[5px]", swap: "underline decoration-wavy decoration-warm underline-offset-[5px]" } as const;

// The word-choice lens
export function WordsLensView({ text, lens, onPlay }: { text: LensText; lens: WordsLens; onPlay: PlayFrom }) {
  // The run tapped, if any
  const [tapped, setTapped] = useState<WordSpan | null>(null);
  // Each word's run, by its first word
  const starts = new Map(lens.spans.map((span) => [span.from, span]));
  // The pieces: runs and single words
  const pieces: Array<{ span: WordSpan | null; from: number; to: number }> = [];
  // Walk the words
  for (let index = 0; index < text.words.length; index++) {
    // A run here
    const span = starts.get(index) ?? null;
    // Kept, and past it
    pieces.push({ span, from: index, to: span ? span.to : index });
    // Past the run
    if (span) index = span.to;
  }
  // When the tapped words were said
  const tappedAt = tapped ? text.words[tapped.from]?.start ?? null : null;
  // The view
  return (
    <div data-lens="words" className="flex flex-col gap-3">
      {/* What it shows */}
      <p className="text-footnote leading-snug text-ink-muted">Words a listener can picture are bold. Soft underlines are worth a second look: tap one.</p>
      {/* The words */}
      <WordsCard label="What you said, marked for word choice">
        {/* Each piece */}
        {pieces.map((piece) => {
          // Its words
          const words = text.words.slice(piece.from, piece.to + 1).map((word) => word.text).join(" ");
          // A word to look at again: a button
          if (piece.span && piece.span.kind !== "concrete") return <span key={piece.from}><button type="button" data-word-kind={piece.span.kind} aria-pressed={tapped === piece.span} onClick={() => setTapped(tapped === piece.span ? null : piece.span)} className={`inline-flex min-h-11 items-center align-baseline ${WORD_LOOKS[piece.span.kind]}`}>{words}</button>{" "}</span>;
          // A concrete word, or a plain one
          return <span key={piece.from} data-word-kind={piece.span?.kind} className={piece.span ? WORD_LOOKS.concrete : undefined}>{words} </span>;
        })}
      </WordsCard>
      {/* The tapped run's swap */}
      {tapped && (
        <div role="status" className="flex flex-col gap-2 rounded-2xl bg-ink px-4 py-3.5 text-paper">
          {/* What was tapped */}
          <p className="text-footnote">You tapped “{tapped.phrase}”</p>
          {/* The coach's swap, or what the word does */}
          {tapped.swap ? <p className="text-lede"><s>{tapped.swap.said}</s> → <b>{tapped.swap.stronger}</b></p> : null}
          {/* Why */}
          <p className="text-footnote leading-snug">{tapped.explain}</p>
          {/* Hear it */}
          {onPlay && tappedAt !== null && <button type="button" onClick={() => onPlay(tappedAt)} className="inline-flex min-h-11 items-center self-start rounded-2xl border-2 border-paper px-4 text-footnote font-semibold">Hear how you said it</button>}
        </div>
      )}
      {/* What the marks mean */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-footnote text-ink-muted">
        {/* Bold */}
        <span><b className="text-accent">Bold</b>: concrete words (a rough guess)</span>
        {/* Underlined */}
        <span className="underline decoration-wavy decoration-warm underline-offset-4">Hedges, vague words, “really”</span>
      </div>
      {/* Nothing to look at again */}
      {lens.counts.hedge + lens.counts.vague + lens.counts.intensifier + lens.counts.swap === 0 && <p className="text-footnote">No hedges, vague words or intensifiers this time.</p>}
    </div>
  );
}

// The clarity lens
export function ClarityLensView({ text, lens, onPlay }: { text: LensText; lens: ClarityLens; onPlay: PlayFrom }) {
  // The unclear words
  const unclear = new Set(lens.unclear);
  // The note
  const note = clarityNote(lens, text.words);
  // The view
  return (
    <div data-lens="clarity" className="flex flex-col gap-3">
      {/* How many came through */}
      <p className="text-footnote leading-snug">{clarityHeadline(lens)}</p>
      {/* The words, the unclear ones dashed */}
      <WordsCard label="What you said, with the words harder to catch">
        {/* Each word */}
        {text.words.map((word, index) => (unclear.has(index) ? (
          <span key={index}><button type="button" data-unclear onClick={onPlay && word.start !== null ? () => onPlay(word.start!) : undefined} aria-label={`${bare(word.text)}, harder to catch${onPlay ? ", play" : ""}`} className="inline-flex min-h-11 items-center align-baseline font-bold text-ink underline decoration-ink-muted decoration-dashed decoration-2 underline-offset-[5px]">{word.text}</button>{" "}</span>
        ) : <span key={index} className="text-ink-muted">{word.text} </span>))}
      </WordsCard>
      {/* The drill that fits */}
      {lens.drill && note && (
        <div className={`flex flex-col items-start gap-2 px-3.5 py-3 ${CARD}`}>
          {/* Why */}
          <p className="text-footnote leading-snug">{note}</p>
          {/* The drill */}
          <PrimaryLink href={`/voice/drill?id=${lens.drill.id}`}>Practise: {lens.drill.name}</PrimaryLink>
        </div>
      )}
    </div>
  );
}

// The quiet line where a lens has nothing to draw
export function LensEmpty({ children }: { children: React.ReactNode }) {
  // One muted line
  return <p data-lens-empty className={`mt-1 ${LABEL}`}>{children}</p>;
}

// "Look closer": opens the lens tabs in place
export function LookCloser({ onOpen, detail }: { onOpen: () => void; detail: string }) {
  // A quiet button with a line on what it opens
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
      {/* The button */}
      <button type="button" aria-expanded="false" onClick={onOpen} className={QUIET}>Look closer</button>
      {/* What it opens */}
      <span className="text-footnote text-ink-muted">{detail}</span>
    </div>
  );
}
