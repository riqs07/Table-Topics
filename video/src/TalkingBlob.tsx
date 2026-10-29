// The blob as a talking character for the videos: the app's own tile blob (same outline, shade and highlight), with eyes for each mood and a mouth that opens with the voice

// Load the tile blob's body
import { Body } from "@/components/scenes/CourseTile";

// How the blob feels
export type Mood = "ready" | "wow" | "up" | "worried" | "closed" | "happy";

// The eyes for a mood, in the blob's 100 units (its middle at 0, 0)
function Eyes({ mood, blink }: { mood: Mood; blink: boolean }) {
  // Shut for a moment when blinking, from the eye line
  const squash = blink ? "translate(0 -22) scale(1 0.12) translate(0 22)" : undefined;
  // Each mood's eyes
  switch (mood) {
    // Wide and round
    case "wow":
      return <g transform={squash}><circle className="fill-current" cx="-34" cy="-24" r="13" /><circle className="fill-current" cx="34" cy="-24" r="13" /></g>;
    // Glancing up and to the side
    case "up":
      return <g transform={squash}><circle className="fill-current" cx="-28" cy="-36" r="10" /><circle className="fill-current" cx="40" cy="-36" r="10" /></g>;
    // Open, with brows raised in the middle
    case "worried":
      return (
        <>
          {/* The eyes */}
          <g transform={squash}><ellipse className="fill-current" cx="-34" cy="-20" rx="10" ry="13" /><ellipse className="fill-current" cx="34" cy="-20" rx="10" ry="13" /></g>
          {/* The brows */}
          <path className="stroke-current" strokeWidth="7" strokeLinecap="round" d="M-50 -44 -22 -54M50 -44 22 -54" />
        </>
      );
    // Shut, calm
    case "closed":
      return <path className="stroke-current" strokeWidth="7" strokeLinecap="round" fill="none" d="M-46 -22q12 10 24 0M22 -22q12 10 24 0" />;
    // Happy arches
    case "happy":
      return <path className="stroke-current" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M-46 -16l12-13 12 13M22 -16l12-13 12 13" />;
    // Open and friendly
    default:
      return <g transform={squash}><ellipse className="fill-current" cx="-34" cy="-22" rx="10" ry="15" /><ellipse className="fill-current" cx="34" cy="-22" rx="10" ry="15" /></g>;
  }
}

// The mouth: open with the voice, otherwise a resting shape for the mood
function Mouth({ mood, open }: { mood: Mood; open: number }) {
  // Talking: an oval that opens with the loudness
  if (open > 0.06) return <ellipse className="fill-current" cx="0" cy="24" rx={16 - open * 3} ry={4 + open * 18} />;
  // Breathing in: a small round mouth
  if (mood === "closed") return <circle className="fill-current" cx="0" cy="24" r="6" />;
  // Worried: a wavy line
  if (mood === "worried") return <path className="stroke-current" strokeWidth="6" strokeLinecap="round" fill="none" d="M-16 26q4-6 8 0t8 0 8 0 8 0" />;
  // Happy: a wide open smile
  if (mood === "happy") return <path className="fill-current" d="M-22 14h44q0 22-22 22t-22-22z" />;
  // Otherwise a small smile
  return <path className="stroke-current" strokeWidth="6" strokeLinecap="round" fill="none" d="M-16 18q16 14 32 0" />;
}

// Draw the talking blob at a size in pixels, with how open its mouth is (0 to 1), its mood, whether it is blinking, how it breathes and whether it waves
export function TalkingBlob({ size, open, mood, blink, breath = 1, wave = 0 }: { size: number; open: number; mood: Mood; blink: boolean; breath?: number; wave?: number }) {
  // A little squash and stretch while talking, and the breath's swell
  const [scaleX, scaleY] = [breath * (1 - open * 0.02), breath * (1 + open * 0.04)];
  // The arms' swing while waving, in degrees
  const swing = wave * 18;
  // The square drawing, centred on the blob
  return (
    <svg viewBox="-150 -150 300 300" width={size} height={size} className="overflow-visible">
      {/* Squash and swell from the base */}
      <g transform={`translate(0 94) scale(${scaleX} ${scaleY}) translate(0 -94)`}>
        {/* Arms, waving, when asked */}
        {wave > 0 && (
          <>
            {/* The left arm */}
            <ellipse className="fill-warm" cx="-112" cy="-40" rx="22" ry="36" transform={`rotate(${-35 - swing} -96 -10)`} />
            {/* The right arm */}
            <ellipse className="fill-warm-shade" cx="112" cy="-40" rx="22" ry="36" transform={`rotate(${35 + swing} 96 -10)`} />
          </>
        )}
        {/* The body, with the face drawn here */}
        <Body x={0} y={0} r={100}>
          {/* Rosy cheeks when calm or happy */}
          {(mood === "closed" || mood === "happy") && <g className="fill-art-coral opacity-35"><ellipse cx="-58" cy="14" rx="13" ry="8" /><ellipse cx="58" cy="14" rx="13" ry="8" /></g>}
          {/* The eyes */}
          <Eyes mood={mood} blink={blink} />
          {/* The mouth */}
          <Mouth mood={mood} open={open} />
        </Body>
      </g>
    </svg>
  );
}
