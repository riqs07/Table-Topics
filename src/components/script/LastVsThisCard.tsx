"use client";
// Last try and this try (decision 111): only where the same words are said twice (a story told again, a second try, a check-in part). The last take's curve, dashed and muted, is drawn under this take's words, phrase matched to phrase by the words they share; a headline only when a change clears the noise (decision 103); a play button for each take. When the last take's readings were dropped (decision 98), it says so quietly and shows this take alone

// Load React's memo, reference, state and effect tools
import { useEffect, useMemo, useRef, useState } from "react";
// Load the shared pieces
import { CurveRow, useRowWidth, useWordMeasure } from "@/components/script/PitchShapes";
// Load the shared looks
import { CARD, LABEL, SECTION_HEADING } from "@/components/script/textStyles";
import { PRIMARY, SECONDARY } from "@/components/script/Buttons";
// Load the hooks that read the deeper analysis's words, a take's recording and the text it read
import { useServerWords } from "@/components/screens/useServerWords";
import { useTakeScript } from "@/components/screens/useTakeScript";
import { useAudioUrl } from "@/components/screens/useAudioUrl";
// Load the pitch in the words and the comparison
import { takePitch } from "@/core/takePitch";
import { changeHeadline, overlayPoints, pairPhrases, pairsToShow } from "@/core/takeMatch";
import { curveLines, describePhrase, type Phrase, type PitchWords } from "@/core/pitchPhrases";
import { smoothPath } from "@/core/pitchClean";
// Load the range rule
import { rangeOf } from "@/core/voiceFeedback";
// Load the record type
import type { FullSession } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// What the card needs
interface LastVsThisProps {
  // Where the analyses and recordings are read from
  repo: Repository;
  // The last take, with its readings
  before: FullSession;
  // This take, with its readings
  after: FullSession;
  // Where it is from, such as "Tell it again"
  kind: string;
  // What each take is called in the key and on its button, such as "Last try, Tue" and "This try, today"
  names: { before: string; after: string };
  // The words on the two play buttons
  plays?: { before: string; after: string };
  // The text both takes read, for a reading (null otherwise)
  script?: string | null;
}

// One of this take's phrases with the last take's curve under it (or alone)
function PairRows({ phrase, pitch, under, width, measure }: { phrase: Phrase; pitch: PitchWords; under: ((slots: Parameters<typeof overlayPoints>[2]) => string) | null; width: number; measure: (text: string, bold: boolean) => number }) {
  // The phrase's rows
  const lines = curveLines(phrase.words, pitch.curve, pitch.tickMs, width, measure);
  // Each row
  return (
    <div className="flex flex-col gap-1">
      {/* The rows, the last take's curve dashed under each */}
      {lines.map((line, index) => <CurveRow key={index} width={width} words={phrase.words} slots={line.slots} path={smoothPath(line.points)} under={under ? under(line.slots) : null} label={`This try: ${describePhrase(phrase)}${under ? " The last try is the dashed line." : ""}`} look={(place) => (phrase.words[place]!.peak ? "peak" : "plain")} />)}
    </div>
  );
}

// The card
export function LastVsThisCard({ repo, before, after, kind, names, plays = { before: "Play last try", after: "Play this try" }, script = null }: LastVsThisProps) {
  // Both takes' service words, once read
  const [serverBefore, serverAfter] = [useServerWords(repo, before.id), useServerWords(repo, after.id)];
  // Both recordings
  const [urlBefore, urlAfter] = [useAudioUrl(repo, before.audioKey).url, useAudioUrl(repo, after.audioKey).url];
  // The two players
  const players = useRef<{ before: HTMLAudioElement | null; after: HTMLAudioElement | null }>({ before: null, after: null });
  // The width the rows are drawn in
  const { ref, width } = useRowWidth();
  // How wide words are
  const measure = useWordMeasure();
  // Both takes' pitch in their words
  const [pitchBefore, pitchAfter] = [
    // The last take
    useMemo(() => (serverBefore.ready ? takePitch(before, { serverWords: serverBefore.words, script }) : null), [serverBefore.ready, serverBefore.words, before, script]),
    // This take
    useMemo(() => (serverAfter.ready ? takePitch(after, { serverWords: serverAfter.words, script }) : null), [serverAfter.ready, serverAfter.words, after, script]),
  ];
  // The phrases matched across the takes
  const pairs = useMemo(() => (pitchBefore?.state === "ready" && pitchAfter?.state === "ready" ? pairPhrases(pitchBefore.pitch.phrases, pitchAfter.pitch.phrases) : []), [pitchBefore, pitchAfter]);
  // Nothing to draw for this take (it shows its own note), or still reading
  if (!pitchBefore || pitchAfter?.state !== "ready") return null;
  // This take's phrases
  const now = pitchAfter.pitch;
  // The last take's readings were dropped, or it had none
  const alone = pitchBefore.state !== "ready";
  // The pairs to show, the changed one first
  const shown = pairsToShow(pairs, 3);
  // The headline, only for a clear change
  const headline = alone ? null : changeHeadline(pairs, { before: rangeOf(before), after: rangeOf(after) });
  // Where each take's shown stretch starts, for its play button
  const startAt = { before: shown[0]?.before.start ?? 0, after: shown[0]?.after.start ?? now.phrases[0]?.start ?? 0 };

  // Play one take from its shown stretch, pausing the other
  function play(which: "before" | "after") {
    // The two players
    const [target, other] = which === "before" ? [players.current.before, players.current.after] : [players.current.after, players.current.before];
    // Nothing to play
    if (!target) return;
    // Stop the other
    other?.pause();
    // Just before the stretch
    target.currentTime = Math.max(0, startAt[which] - 0.3);
    // Play (the browser may refuse without a tap, which is fine)
    void target.play().catch(() => undefined);
  }

  // The card
  return (
    <section aria-labelledby={`last-this-${after.id}`} data-last-this className="mt-5">
      {/* Where it is from */}
      <p className={LABEL}>{kind} · same {shown.length === 1 ? "phrase" : "words"}</p>
      {/* The headline when something clearly changed, otherwise a plain name (read out, not shown) */}
      {headline ? <h2 id={`last-this-${after.id}`} className={`mt-1 ${SECTION_HEADING}`}>{headline}</h2> : <h2 id={`last-this-${after.id}`} className="sr-only">Last try and this try</h2>}
      {/* The picture */}
      <div ref={ref} className={`mt-3 flex flex-col gap-4 p-4 ${CARD}`}>
        {/* The last take's readings are gone: said quietly, this take alone */}
        {alone && <p className="text-footnote text-ink-muted">{pitchBefore.state === "trimmed" ? "The last try’s detailed readings aren’t kept any more, so only this try is shown." : "The last try has no pitch readings to compare, so only this try is shown."}</p>}
        {alone && now.phrases[0] && <PairRows phrase={now.phrases[0]} pitch={now} under={null} width={width - 32} measure={measure} />}
        {/* Nothing shared enough to line up */}
        {!alone && shown.length === 0 && <p className="text-footnote text-ink-muted">The two takes don’t share enough words to line up.</p>}
        {/* Each matched phrase, the last take dashed under this one */}
        {!alone && shown.map((pair) => <PairRows key={pair.after.index} phrase={pair.after} pitch={now} under={(slots) => smoothPath(overlayPoints(pair, now.tickMs, slots, pair.after.words))} width={width - 32} measure={measure} />)}
        {/* The key */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-footnote text-ink-muted">
          {/* The last take, when drawn */}
          {!alone && shown.length > 0 && <span className="flex items-center gap-1.5"><svg width="22" height="6" aria-hidden="true" className="text-ink-muted"><line x1="0" y1="3" x2="22" y2="3" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" /></svg>{names.before}</span>}
          {/* This take */}
          <span className="flex items-center gap-1.5"><svg width="22" height="6" aria-hidden="true" className="text-accent"><line x1="0" y1="3" x2="22" y2="3" stroke="currentColor" strokeWidth="3" /></svg>{names.after}</span>
        </div>
        {/* Both recordings, when kept */}
        {(urlBefore || urlAfter) && (
          <div className="flex gap-2">
            {/* The players themselves, hidden */}
            {urlBefore && <audio ref={(element) => { players.current.before = element; }} src={urlBefore} preload="metadata" aria-label={names.before} />}
            {urlAfter && <audio ref={(element) => { players.current.after = element; }} src={urlAfter} preload="metadata" aria-label={names.after} />}
            {/* Play the last take */}
            {urlBefore && <button type="button" onClick={() => play("before")} className={`${SECONDARY} flex-1`}>{plays.before}</button>}
            {/* Play this take */}
            {urlAfter && <button type="button" onClick={() => play("after")} className={`${PRIMARY} flex-1`}>{plays.after}</button>}
          </div>
        )}
        {/* Rough word times, said quietly */}
        {now.precision === "rough" && <p className="text-footnote text-ink-muted">Words are placed from the phone’s timings, so their places are rough.</p>}
      </div>
    </section>
  );
}

// Two takes read by id with their readings, then compared (the check-in comparison holds its takes without their readings; decision 99 reads them only here)
export function LastVsThisLoader({ repo, beforeId, afterId, ...rest }: Omit<LastVsThisProps, "before" | "after" | "script"> & { beforeId: string; afterId: string }) {
  // Both takes, once read
  const [takes, setTakes] = useState<{ before: FullSession; after: FullSession } | null>(null);
  // Read them when the ids change
  useEffect(() => {
    // Ignore a late answer
    let cancelled = false;
    // Both, with their readings
    Promise.all([repo.getFullSession(beforeId), repo.getFullSession(afterId)]).then(([before, after]) => {
      // Kept when both are here
      if (!cancelled && before && after) setTakes({ before, after });
    }, () => {
      // A failed read shows nothing extra; the page's own numbers stay
    });
    // Stop on leaving
    return () => {
      // Ignore late answers
      cancelled = true;
    };
  }, [repo, beforeId, afterId]);
  // The text the takes read, if any (the check-in's passage for its read part)
  const script = useTakeScript(takes?.after ?? null);
  // The card, once read and its text known
  return takes && script.ready ? <LastVsThisCard repo={repo} before={takes.before} after={takes.after} script={script.script} {...rest} /> : null;
}
