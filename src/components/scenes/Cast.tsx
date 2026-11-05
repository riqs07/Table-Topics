// The working cast, drawn on their own (the redesign's second pass; documents/design/redesign/README.md, "The cast"): you (the apricot round), Sage (the coach: pine green, a sprout and brows), the friend (a teal egg with a curl) and the three bosses (Wobbly, Bun, Squircle), told apart by shape first and never wearing accessories

// Load the blob's outline and its faces
import { BLOB, Face, type FaceName } from "@/components/scenes/Scene";
// Load the shaded body every tile and drawing shares
import { Body } from "@/components/scenes/tiles/parts";

// Who can be drawn
export type CastWho = "you" | "sage" | "friend" | "wobbly" | "bun" | "squircle";

// Sage's expressions (from the character sheet, documents/design/characters/sage.md)
export type SageMood = "calm" | "listening" | "encouraging" | "proud" | "curious" | "breathe" | "thinking";

// The outlines besides the blob's, in the same 100-unit radius
const SHAPES = {
  // The friend: an egg, taller than wide
  egg: "M0 -114C52 -114 92 -42 92 10C92 62 52 94 0 94C-52 94 -92 62 -92 10C-92 -42 -52 -114 0 -114Z",
  // Wobbly (boss, Stop freezing): lively and uneven
  wobbly: "M4 -104C50 -110 74 -76 98 -50C124 -22 118 30 96 58C72 90 30 96 -6 94C-52 92 -96 74 -108 34C-120 -8 -100 -44 -72 -72C-50 -94 -26 -102 4 -104Z",
  // Bun (boss, Beyond "good, you?"): wide and low, unbothered
  bun: "M0 -60C76 -60 132 -30 132 22C132 66 82 94 0 94C-82 94 -132 66 -132 22C-132 -30 -76 -60 0 -60Z",
  // Squircle (boss, Explain it simply): orderly and upright
  squircle: "M0 -100C80 -100 100 -80 100 -2C100 76 80 94 0 94C-80 94 -100 76 -100 -2C-100 -80 -80 -100 0 -100Z",
} as const;

// Each character besides you and Sage: outline, body colour, and how far down the face sits
const FIGURES: Record<"friend" | "wobbly" | "bun" | "squircle", { d: string; fill: string; shade: string; faceY: number }> = {
  // The friend, teal
  friend: { d: SHAPES.egg, fill: "fill-friend", shade: "fill-friend-shade", faceY: 6 },
  // Wobbly, pink
  wobbly: { d: SHAPES.wobbly, fill: "fill-art-bloom", shade: "fill-art-bloom", faceY: 6 },
  // Bun, sunny
  bun: { d: SHAPES.bun, fill: "fill-art-sun", shade: "fill-art-sun", faceY: 30 },
  // Squircle, blue
  squircle: { d: SHAPES.squircle, fill: "fill-art-sky", shade: "fill-art-sky", faceY: 2 },
};

// A shaded figure: the darker body, the lit body nudged up and left so the shade shows as a crescent, a highlight, then its face
function Figure({ who, face }: { who: keyof typeof FIGURES; face: FaceName }) {
  // Its outline and colours
  const figure = FIGURES[who];
  // Drawn in the cast's own units
  return (
    <g>
      {/* The shade: the body darkened (the bosses share their colour, darkened by ink) */}
      <path className={figure.shade} d={figure.d} />
      {figure.shade === figure.fill && <path className="fill-on-warm opacity-20" d={figure.d} />}
      {/* The lit body */}
      <path className={figure.fill} transform="translate(-9 -8) scale(0.93)" d={figure.d} />
      {/* The highlight, light from the upper left */}
      <ellipse className="fill-art-cream opacity-45" cx="-48" cy="-56" rx="18" ry="11" transform="rotate(-35 -48 -56)" />
      {/* The friend's one signature: a curl on top */}
      {who === "friend" && <path className="stroke-friend-shade" fill="none" strokeWidth="9" strokeLinecap="round" d="M2 -112q-4 -22 14 -26q14 -2 10 12" />}
      {/* The face, lowered to suit the shape */}
      <g className="text-on-warm" transform={`translate(0 ${figure.faceY})`}>
        {/* One of the blob's faces */}
        <Face face={face} />
      </g>
    </g>
  );
}

// Each Sage mood: eyes, brow lift and mouth
const SAGE_MOODS: Record<SageMood, { eyes: "lid" | "open" | "up" | "side" | "closed" | "happy"; lift: number; mouth: "smile" | "big" | "small" | "side" | "puff" | "laugh"; cheeks: boolean }> = {
  // At rest
  calm: { eyes: "lid", lift: 0, mouth: "smile", cheeks: false },
  // Eyes closed, hearing you out
  listening: { eyes: "closed", lift: -2, mouth: "smile", cheeks: false },
  // Bright, before you start
  encouraging: { eyes: "open", lift: 8, mouth: "big", cheeks: true },
  // After a good one
  proud: { eyes: "happy", lift: 6, mouth: "laugh", cheeks: true },
  // A question, kindly
  curious: { eyes: "side", lift: 4, mouth: "small", cheeks: false },
  // Breathing with you
  breathe: { eyes: "closed", lift: 3, mouth: "puff", cheeks: true },
  // Weighing something
  thinking: { eyes: "up", lift: 4, mouth: "side", cheeks: false },
};

// Sage: the round, a little wider and settled, pine green, with a sprout on top and brows that are always there
function Sage({ mood }: { mood: SageMood }) {
  // The mood's features
  const look = SAGE_MOODS[mood];
  // A line in Sage's face colour
  const line = { fill: "none", className: "stroke-art-cream", strokeWidth: 6.5, strokeLinecap: "round" as const };
  // One eye, by kind
  const eye = (x: number) => (
    <g transform={`translate(${x} -30)`}>
      {look.eyes === "lid" && <ellipse className="fill-art-cream" rx="9" ry="12" />}
      {look.eyes === "open" && <ellipse className="fill-art-cream" rx="10" ry="14" />}
      {look.eyes === "up" && <ellipse className="fill-art-cream" cx="2" cy="-6" rx="9" ry="11" />}
      {look.eyes === "side" && <ellipse className="fill-art-cream" cx="5" rx="9.5" ry="13" />}
      {look.eyes === "closed" && <path {...line} strokeWidth={6} d="M-11 2Q0 11 11 2" />}
      {look.eyes === "happy" && <path {...line} strokeWidth={6} d="M-11 6Q0 -8 11 6" />}
    </g>
  );
  // Settled: a touch wider and lower than you
  return (
    <g transform="translate(0 94) scale(1.02 0.95) translate(0 -94)">
      {/* The sprout */}
      <g transform="translate(0 -94)">
        <path className="stroke-art-leaf" fill="none" strokeWidth="6" strokeLinecap="round" d="M0 0Q-3 -16 3 -30" />
        <ellipse className="fill-art-leaf" cx="16" cy="-38" rx="16" ry="8" transform="rotate(-30 16 -38)" />
        <ellipse className="fill-art-leaf opacity-80" cx="-10" cy="-36" rx="15" ry="8" transform="rotate(28 -10 -36)" />
      </g>
      {/* The shaded body */}
      <path className="fill-sage-shade" d={BLOB} />
      <path className="fill-sage" transform="translate(-9 -8) scale(0.93)" d={BLOB} />
      <ellipse className="fill-art-cream opacity-30" cx="-60" cy="-64" rx="16" ry="9" transform="rotate(-35 -60 -64)" />
      {/* The face */}
      <g transform="translate(0 8)">
        {/* Cheeks when glad */}
        {look.cheeks && <g className="fill-art-coral opacity-50"><ellipse cx="-46" cy="-6" rx="13" ry="8" /><ellipse cx="46" cy="-6" rx="13" ry="8" /></g>}
        {/* The brows, lifted with the mood */}
        <path {...line} strokeWidth={5.5} d={`M-36 ${-52 - look.lift}Q-24 ${-57 - look.lift} -12 ${-52 - look.lift}`} />
        <path {...line} strokeWidth={5.5} d={`M12 ${-52 - look.lift}Q24 ${-57 - look.lift} 36 ${-52 - look.lift}`} />
        {/* The eyes */}
        {eye(-24)}
        {eye(24)}
        {/* The mouth */}
        {look.mouth === "smile" && <path {...line} d="M-15 -2Q0 9 15 -2" />}
        {look.mouth === "big" && <path {...line} d="M-20 -4Q0 14 20 -4" />}
        {look.mouth === "small" && <ellipse className="fill-art-cream" cx="3" cy="4" rx="6" ry="7" />}
        {look.mouth === "side" && <path {...line} d="M-4 4Q6 6 14 -2" />}
        {look.mouth === "puff" && <circle className="fill-art-cream" cy="4" r="4" />}
        {look.mouth === "laugh" && <path className="fill-sage-shade stroke-art-cream" strokeWidth="4.5" d="M-18 -3H18Q16 16 0 16Q-16 16-18 -3Z" />}
      </g>
    </g>
  );
}

// What a cast member takes
interface CastProps {
  // Who to draw
  who: CastWho;
  // The face, for everyone but Sage
  face?: FaceName;
  // Sage's mood
  mood?: SageMood;
  // Still, or breathing gently (a breath and a blink only, no constant bobbing: the user's note on the blob's moments)
  still?: boolean;
  // The size, as classes
  className?: string;
  // A label when the drawing carries meaning; otherwise hidden from screen readers
  label?: string;
}

// One cast member in a square, room left above for Sage's sprout and the friend's curl
export function Cast({ who, face = "ready", mood = "calm", still = false, className = "size-16", label }: CastProps) {
  // Hidden unless it carries meaning
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  // The square
  return (
    <svg {...a11y} data-cast={who} data-motion={still ? "still" : "loop"} viewBox="-140 -160 280 270" className={`vl-scene flex-none overflow-visible ${className}`}>
      {/* A soft breath unless still */}
      <g className={still ? "" : "s-move c-breathe"}>
        {who === "you" && <Body x={0} y={0} r={100} face={face} />}
        {who === "sage" && <Sage mood={mood} />}
        {who !== "you" && who !== "sage" && <Figure who={who} face={face} />}
      </g>
    </svg>
  );
}
