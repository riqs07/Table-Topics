"use client";
// The guessing game for the stress and tone drills (decision 80): the takes play back in a mixed order, and a friend (or the speaker, a moment later) picks which one each was; if the listener can tell, the difference came through

// Load React's state tool
import { useState } from "react";
// Load the shared button looks
import { PRIMARY, QUIET, SECONDARY } from "@/components/script/Buttons";

// What the game needs
interface GuessGameProps {
  // The takes' names, the choices on each round
  options: ReadonlyArray<string>;
  // Which take plays on each round, in the mixed order
  order: ReadonlyArray<number>;
  // Play a take by its place in the list
  play: (index: number) => void;
  // What the listener is asked
  question: string;
}

// Draw the game
export function GuessGame({ options, order, play, question }: GuessGameProps) {
  // The round under way (-1 before starting)
  const [round, setRound] = useState(-1);
  // The choice made this round, or null
  const [picked, setPicked] = useState<number | null>(null);
  // How many were right so far
  const [right, setRight] = useState(0);
  // The take this round plays
  const answer = order[round];
  // Finished
  const done = round >= order.length;

  // Pick a choice
  function pick(index: number) {
    // Only once a round
    if (picked !== null) return;
    // Keep it
    setPicked(index);
    // Count it if right
    if (index === answer) setRight(right + 1);
  }

  // On to the next round
  function next() {
    // The next round
    setRound(round + 1);
    // Nothing picked yet
    setPicked(null);
  }

  // Play again from the first round
  function restart() {
    // No score yet
    setRight(0);
    // The first round
    setRound(0);
    // Nothing picked
    setPicked(null);
  }

  // Draw the game
  return (
    <section aria-labelledby="guess-heading" className="mt-6 rounded-3xl bg-card p-5 md:max-w-2xl">
      {/* Its name */}
      <h2 id="guess-heading" className="font-display text-xl font-semibold">Guessing game</h2>
      {/* Before starting: how it works */}
      {round < 0 && (
        <>
          {/* How it works */}
          <p className="mt-2 max-w-[48ch] text-lede">Hand the phone to a friend, or wait a moment and guess yourself. Each take plays in a mixed order. {question}</p>
          {/* Start */}
          <p className="mt-4"><button type="button" onClick={next} className={SECONDARY}>Start the game</button></p>
        </>
      )}
      {/* A round */}
      {answer !== undefined && (
        <>
          {/* Which round */}
          <p className="mt-2 text-footnote font-semibold text-accent">Round {round + 1} of {order.length}</p>
          {/* Play it */}
          <p className="mt-3"><button type="button" onClick={() => play(answer)} className={SECONDARY}>Play the mystery take</button></p>
          {/* The question */}
          <p className="mt-4 font-semibold">{question}</p>
          {/* The choices */}
          <div role="group" aria-label="Choices" className="mt-3 flex flex-wrap gap-2">
            {/* Each take's name, marked once picked */}
            {options.map((option, index) => (
              <button key={option} type="button" onClick={() => pick(index)} disabled={picked !== null} aria-pressed={picked === index} className={picked !== null && index === answer ? PRIMARY : QUIET}>{option}</button>
            ))}
          </div>
          {/* The answer, and the next round */}
          {picked !== null && (
            <p role="status" className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {/* Right or not */}
              <span className="text-lede">{picked === answer ? "Right." : `Not quite: that was “${options[answer]}”.`}</span>
              {/* Next */}
              <button type="button" onClick={next} className={SECONDARY}>{round + 1 < order.length ? "Next round" : "See the score"}</button>
            </p>
          )}
        </>
      )}
      {/* The score */}
      {done && (
        <>
          {/* How many */}
          <p role="status" className="mt-2 font-display text-statement font-semibold tracking-tight">{right} of {order.length}</p>
          {/* What it means */}
          <p className="mt-2 max-w-[48ch] text-lede">{right === order.length ? "Every one came through. The difference was clear." : right * 2 >= order.length ? "Most came through. Make the others more different." : "Hard to tell apart. Exaggerate more than feels natural."}</p>
          {/* Again */}
          <p className="mt-4"><button type="button" onClick={restart} className={QUIET}>Play again</button></p>
        </>
      )}
    </section>
  );
}
