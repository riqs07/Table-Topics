// The end-of-day moment: a full ring, a warm badge with a tick, and sparks flying out once (decision 69); with reduced motion only the still ring and badge show

// Load the tick
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
// Load the type for inline custom properties
import type { CSSProperties } from "react";

// How many sparks fly out
const SPARK_COUNT = 12;
// The spark colours, in turn
const SPARK_COLOURS = ["bg-warm", "bg-fill", "bg-accent", "bg-warm-ink"] as const;

// One spark's place, size and colour
interface Spark {
  // Its key
  id: number;
  // Its colour class
  colour: string;
  // Its look: size, corner and where it flies to
  style: CSSProperties;
}

// Work out every spark, spread evenly round the circle
const SPARKS: Spark[] = Array.from({ length: SPARK_COUNT }, (_, index) => {
  // Its angle round the circle
  const angle = (index / SPARK_COUNT) * Math.PI * 2;
  // How far it flies, varied a little
  const distance = 104 + (index % 3) * 16;
  // Alternate big and small
  const size = index % 2 ? 10 : 14;
  // Put it together
  return {
    // Its key
    id: index,
    // Its colour
    colour: SPARK_COLOURS[index % SPARK_COLOURS.length] ?? "bg-warm",
    // Its look, with the flight offset as custom properties the animation reads
    style: { width: size, height: size, marginTop: -size / 2, marginLeft: -size / 2, borderRadius: index % 3 === 0 ? 3 : size, animationDelay: `${550 + (index % 4) * 40}ms`, "--dx": `${Math.round(Math.cos(angle) * distance)}px`, "--dy": `${Math.round(Math.sin(angle) * distance)}px` } as CSSProperties,
  };
});

// Draw the moment; sparks only on the first showing of the day
export function DoneBurst({ celebrate }: { celebrate: boolean }) {
  // A square stage the ring sits in, centred
  return (
    <div aria-hidden="true" className="relative mx-auto flex size-40 items-center justify-center">
      {/* The sparks, first time only and only when motion is welcome */}
      {celebrate && SPARKS.map((spark) => <span key={spark.id} className={`absolute top-1/2 left-1/2 hidden opacity-0 motion-safe:block motion-safe:animate-burst ${spark.colour}`} style={spark.style} />)}
      {/* The ring */}
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
        {/* Its track */}
        <circle cx="60" cy="60" r="48" fill="none" strokeWidth="12" className="stroke-paper" />
        {/* Its full sweep, drawn round when it first shows */}
        <circle cx="60" cy="60" r="48" fill="none" strokeWidth="12" strokeLinecap="round" strokeDasharray="302" className={`stroke-accent ${celebrate ? "motion-safe:animate-ring" : ""}`} style={{ "--vl-ring-len": "302" } as CSSProperties} />
      </svg>
      {/* The warm badge with its tick */}
      <span className={`relative flex size-20 items-center justify-center rounded-full bg-warm text-on-warm ${celebrate ? "motion-safe:animate-pop" : ""}`} style={celebrate ? { animationDelay: "500ms" } : undefined}>
        {/* The tick */}
        <CheckIcon weight="bold" className="size-10" />
      </span>
    </div>
  );
}
