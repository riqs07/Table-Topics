// The two people in a scene or a story (decisions 149 and 150): you as the warm blob, the other person as the accent blob, their face showing how the conversation is going and a bubble while they speak

// Load the blob, its shadow-free outline and the moving part
import { Blob, Move, type FaceName } from "@/components/scenes/Scene";
// Load the mood type
import type { SceneMood } from "@/core/scenes";

// Each mood's face for the other person: pleased, at ease looking at you, or deflated
const MOOD_FACES: Readonly<Record<SceneMood, FaceName>> = { pleased: "happy", easy: "side-left", deflated: "flat" };

// What the drawing needs
interface SceneCastProps {
  // The other person's mood
  mood: SceneMood;
  // Whether they are speaking now (a bubble pops beside them)
  speaking: boolean;
  // Their name, for screen readers
  name: string;
}

// Draw the two people
export function SceneCast({ mood, speaking, name }: SceneCastProps) {
  // How they look, said for screen readers
  const said = mood === "pleased" ? `${name} looks pleased` : mood === "deflated" ? `${name} looks a little deflated` : `${name} looks at ease`;
  // A wide drawing, the other person on the right facing you
  return (
    <svg role="img" aria-label={said} data-mood={mood} data-speaking={speaking || undefined} viewBox="0 0 200 110" fill="none" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="vl-scene h-32 w-auto">
      {/* The ground */}
      <path className="stroke-rule" d="M10 104h180" />
      {/* You, bobbing, looking at them */}
      <Move loop="s-bob"><Blob x={52} y={74} r={26} face="side" /></Move>
      {/* Them, bobbing out of step, their face by the mood */}
      <Move loop="s-bob" delay={1.2}><Blob x={146} y={72} r={28} face={MOOD_FACES[mood]} accent /></Move>
      {/* While they speak: a bubble above them, popping */}
      {speaking && (
        <Move loop="s-talk" origin="150px 34px">
          {/* The bubble */}
          <path className="fill-card stroke-ink" d="M128 6h40a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6h-14l-6 7v-7h-20a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z" />
          {/* Its dots */}
          <path className="stroke-ink" strokeWidth={4} d="M138 17h0M148 17h0M158 17h0" />
        </Move>
      )}
    </svg>
  );
}
