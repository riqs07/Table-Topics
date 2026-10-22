"use client";
// The results after round 3 of a 4/3/2 loop (decision 118), with the charts that already exist: last try and this try's phrase row with up to three curves where the words line up (round 1 faint, round 2 dashed, round 3 solid), a small table of each round's numbers, and one plain line on what changed that clears the noise (decision 103)

// Load React's memo, state and effect tools
import { useEffect, useMemo, useState } from "react";
// Load the shared pieces
import { CurveRow, useRowWidth, useWordMeasure } from "@/components/script/PitchShapes";
// Load the shared looks
import { CARD, LABEL, SECTION_HEADING } from "@/components/script/textStyles";
// Load the hooks that read the deeper analysis's words and the text a take read
import { useServerWords } from "@/components/screens/useServerWords";
// Load the pitch in the words and the three-way line-up
import { takePitch } from "@/core/takePitch";
import { alignThree, overlayPoints, type PhraseTriple } from "@/core/takeMatch";
import { curveLines, describePhrase, type PitchWords } from "@/core/pitchPhrases";
import { smoothPath } from "@/core/pitchClean";
// Load the loop's rules
import { loopRounds } from "@/core/fourThreeTwo";
import { loopChangeLine, loopTable, roundNumbers } from "@/core/loopCompare";
// Load the record types
import type { FullSession, SessionRecord } from "@/data/records";
// Load the repository type
import type { Repository } from "@/data/repository";

// The key's line for each round: faint dots, dashes, solid
function KeyLine({ round }: { round: 1 | 2 | 3 }) {
  // The little line
  return (
    <svg width="22" height="6" aria-hidden="true" className={round === 3 ? "text-accent" : "text-ink-muted"}>
      {/* Round 1 faint, round 2 dashed, round 3 solid */}
      <line x1="0" y1="3" x2="22" y2="3" stroke="currentColor" strokeWidth={round === 3 ? 3 : round === 2 ? 2.5 : 2} strokeDasharray={round === 3 ? undefined : round === 2 ? "6 4" : "2 4"} opacity={round === 1 ? 0.45 : 1} />
    </svg>
  );
}

// One phrase of round 3 with the earlier rounds' curves under it where they line up
function TripleRows({ triple, pitch, width, measure }: { triple: PhraseTriple; pitch: PitchWords; width: number; measure: (text: string, bold: boolean) => number }) {
  // The phrase's rows
  const lines = curveLines(triple.after.words, pitch.curve, pitch.tickMs, width, measure);
  // Each row
  return (
    <div className="flex flex-col gap-1">
      {/* The rows, the earlier rounds under each */}
      {lines.map((line, index) => <CurveRow key={index} width={width} words={triple.after.words} slots={line.slots} path={smoothPath(line.points)} under={triple.middle ? smoothPath(overlayPoints(triple.middle, pitch.tickMs, line.slots, triple.after.words)) : null} faintUnder={triple.first ? smoothPath(overlayPoints(triple.first, pitch.tickMs, line.slots, triple.after.words)) : null} label={`Round 3: ${describePhrase(triple.after)}${triple.middle ? " Round 2 is the dashed line." : ""}${triple.first ? " Round 1 is the faint dotted line." : ""}`} look={(place) => (triple.after.words[place]!.peak ? "peak" : "plain")} />)}
    </div>
  );
}

// The three rounds' curves on matching phrases
function LoopCurves({ repo, rounds }: { repo: Repository; rounds: readonly [FullSession, FullSession, FullSession] }) {
  // Each round's service words, once read
  const [one, two, three] = [useServerWords(repo, rounds[0].id), useServerWords(repo, rounds[1].id), useServerWords(repo, rounds[2].id)];
  // Whether all have been read
  const ready = one.ready && two.ready && three.ready;
  // The width the rows are drawn in
  const { ref, width } = useRowWidth();
  // How wide words are
  const measure = useWordMeasure();
  // Each round's pitch in its words
  const pitches = useMemo(() => (ready ? rounds.map((round, index) => takePitch(round, { serverWords: [one.words, two.words, three.words][index]!, script: null })) : null), [ready, rounds, one.words, two.words, three.words]);
  // The phrases lined up on round 3's
  const triples = useMemo(() => {
    // Not yet, or round 3 has no pitch
    if (!pitches || pitches[2]?.state !== "ready") return [];
    // Each round's phrases, none where its readings are gone
    const phrases = pitches.map((pitch) => (pitch.state === "ready" ? pitch.pitch.phrases : []));
    // Lined up
    return alignThree(phrases[0]!, phrases[1]!, phrases[2]!, 2);
  }, [pitches]);
  // Nothing to draw: still reading, or round 3 has no pitch
  if (!pitches || pitches[2]?.state !== "ready") return null;
  // Round 3's pitch
  const now = pitches[2].pitch;
  // The picture
  return (
    <div ref={ref} data-loop-curves className={`mt-3 flex flex-col gap-4 p-4 ${CARD}`}>
      {/* Nothing lines up */}
      {triples.length === 0 && <p className="text-footnote text-ink-muted">The rounds don’t share enough words to line up.</p>}
      {/* Each matched phrase */}
      {triples.map((triple) => <TripleRows key={triple.after.index} triple={triple} pitch={now} width={width - 32} measure={measure} />)}
      {/* The key */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-footnote text-ink-muted">
        {/* Each round */}
        {([1, 2, 3] as const).map((round) => <span key={round} className="flex items-center gap-1.5"><KeyLine round={round} />Round {round}</span>)}
      </div>
      {/* Rough word times, said quietly */}
      {now.precision === "rough" && <p className="text-footnote text-ink-muted">Words are placed from the phone’s timings, so their places are rough.</p>}
    </div>
  );
}

// The results card: the curves, the table and the line
export function LoopResults({ repo, session, all, pauseWords = true }: { repo: Repository; session: FullSession; all: ReadonlyArray<SessionRecord>; pauseWords?: boolean }) {
  // The first two rounds with their readings, once read
  const [earlier, setEarlier] = useState<FullSession[] | null>(null);
  // A failed read
  const [failed, setFailed] = useState(false);
  // The loop's id
  const loopId = session.loop?.id ?? "";
  // Read the earlier rounds
  useEffect(() => {
    // The earlier rounds' ids, from the one read of the sessions
    const ids = loopRounds(all, loopId).filter((round) => round.id !== session.id && (round.loop?.round ?? 0) < (session.loop?.round ?? 0)).map((round) => round.id);
    // Ignore a late answer
    let cancelled = false;
    // Each with its readings
    Promise.all(ids.map((id) => repo.getFullSession(id))).then((found) => {
      // Kept
      if (!cancelled) setEarlier(found.filter((round): round is FullSession => round !== undefined));
    }, () => {
      // Said quietly
      if (!cancelled) setFailed(true);
    });
    // Stop on leaving
    return () => {
      // Ignore late answers
      cancelled = true;
    };
  }, [all, loopId, repo, session.id, session.loop?.round]);
  // The three rounds in order, once read
  const rounds = useMemo(() => (earlier ? loopRounds([...earlier, session], loopId) : []), [earlier, session, loopId]);
  // Their numbers
  const numbers = useMemo(() => roundNumbers(rounds), [rounds]);
  // Still reading
  if (!earlier && !failed) return null;
  // The card
  return (
    <section aria-labelledby="loop-heading" data-loop-results className="mt-5">
      {/* What it is */}
      <p className={LABEL}>Told three times · 4/3/2</p>
      {/* The heading */}
      <h2 id="loop-heading" className={`mt-1 ${SECTION_HEADING}`}>Your three rounds</h2>
      {/* The earlier rounds could not be read */}
      {failed && <p role="alert" className="mt-2 text-lede">The earlier rounds could not be read on this device. This round’s results are below.</p>}
      {/* The one line on what changed */}
      {!failed && <p data-loop-line className="mt-2 max-w-[48ch] text-lede">{loopChangeLine(numbers, { pauseWords })}</p>}
      {/* The curves, when all three rounds are here */}
      {rounds.length === 3 && <LoopCurves repo={repo} rounds={[rounds[0]!, rounds[1]!, rounds[2]!]} />}
      {/* The table */}
      {rounds.length > 1 && (
        <div className={`mt-3 overflow-x-auto px-4 py-2 ${CARD}`}>
          <table className="w-full text-left text-footnote tabular-nums">
            {/* The rounds */}
            <thead><tr className="border-b border-rule text-ink-muted"><th scope="col" className="py-2 pr-2 font-normal">Round</th>{numbers.map((round) => <th key={round.round} scope="col" className="py-2 pr-2 font-normal">{round.round}</th>)}</tr></thead>
            {/* One row per measure */}
            <tbody>{loopTable(numbers, { pauseWords }).map((row) => <tr key={row.label} className="border-b border-rule last:border-0"><th scope="row" className="py-2 pr-2 font-normal">{row.label}</th>{row.values.map((value, index) => <td key={index} className="py-2 pr-2">{value}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
