// The two people in a scene or a story (decisions 149 and 150, redrawn in the UI rewrite's second pass): you as the apricot blob, the other person as the friend (the teal egg), facing each other on a soft floor, their face showing how the conversation is going and a bubble while they speak

// Load the cast
import { Cast } from "@/components/scenes/Cast";
// Load the face names
import type { FaceName } from "@/components/scenes/Scene";
// Load the mood type
import type { SceneMood } from "@/core/scenes";

// Each mood's face for the other person: pleased, at ease looking at you, or deflated (never cross)
const MOOD_FACES: Readonly<Record<SceneMood, FaceName>> = { pleased: "happy", easy: "side-left", deflated: "flat" };

// What the drawing needs
interface SceneCastProps {
  // The other person's mood
  mood: SceneMood;
  // Whether they are speaking now (a bubble pops beside them)
  speaking: boolean;
  // Their name, for screen readers and under them
  name: string;
  // Names under the two people (the listening screen shows them)
  labels?: boolean;
  // Your face, when it should say something (looking at them by default)
  you?: FaceName;
  // The other person on the left and you on the right (the listening screen), instead of you first
  friendFirst?: boolean;
  // Extra classes for the panel
  className?: string;
}

// Draw the two people on their panel
export function SceneCast({ mood, speaking, name, labels = false, you = "side", friendFirst = false, className = "" }: SceneCastProps) {
  // How they look, said for screen readers
  const said = mood === "pleased" ? `${name} looks pleased` : mood === "deflated" ? `${name} looks a little deflated` : `${name} looks at ease`;
  // A soft panel with a floor, you on the left and them on the right (or the other way round)
  return (
    <div role="img" aria-label={said} data-mood={mood} data-speaking={speaking || undefined} className={`relative flex items-end justify-around gap-4 overflow-hidden rounded-[22px] bg-paper px-6 pt-6 pb-4 ${friendFirst ? "flex-row-reverse" : ""} ${className}`}>
      {/* The floor */}
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/4 bg-rule/50" />
      {/* You, looking at them */}
      <span className="relative flex flex-col items-center gap-1">
        {/* The blob */}
        <Cast who="you" face={you} className="size-20 md:size-24" />
        {/* Your name, when shown */}
        {labels && <span aria-hidden="true" className="text-sm font-extrabold">You</span>}
      </span>
      {/* While they speak: three small arcs from them towards you */}
      {speaking && (
        <svg aria-hidden="true" viewBox="0 0 60 50" className={`vl-rings relative mb-8 h-12 w-14 flex-none ${friendFirst ? "-scale-x-100" : ""}`}>
          {/* The arcs, nearest first */}
          <path className="p-ring fill-none stroke-friend" strokeWidth="5" strokeLinecap="round" d="M42 10q-10 15 0 30" />
          {/* (the middle one) */}
          <path className="p-ring fill-none stroke-friend opacity-70" style={{ animationDelay: "0.4s" }} strokeWidth="5" strokeLinecap="round" d="M28 6q-12 19 0 38" />
          {/* (the farthest) */}
          <path className="p-ring fill-none stroke-friend opacity-40" style={{ animationDelay: "0.8s" }} strokeWidth="5" strokeLinecap="round" d="M14 2q-14 23 0 46" />
        </svg>
      )}
      {/* Them, their face by the mood */}
      <span className="relative flex flex-col items-center gap-1">
        {/* The friend */}
        <Cast who="friend" face={MOOD_FACES[mood]} className="size-24 md:size-28" />
        {/* Their name, when shown */}
        {labels && <span aria-hidden="true" className="text-sm font-extrabold">{name}</span>}
      </span>
    </div>
  );
}
