// The colleagues on the ad's video call, told apart the way the boss characters are (documents/plan-boss-levels.md, "Blob bosses told apart by shape"), but with no hair or accessories: each has their own body shape, eyes and colour (never apricot, which stays the user's), and Alex is the app's own green blob. Built like every blob: the shaded body, the top-left highlight, a simple face

// Load the blob's outline
import { BLOB } from "@/components/scenes/Scene";

// Who they are
export type Colleague = "sam" | "priya" | "alex";
// How they look right now: talking, pleased, listening, or bored (half-shut eyes, a flat mouth)
export type ColleagueMood = "talk" | "happy" | "ready" | "bored";

// Each colleague's body: its colour and its shape (the blob's outline stretched, or a rounded square)
const BODIES: Record<Colleague, { fill: string; shape: string }> = {
  // Sam: wide and round, purple (the confident one who talks first)
  sam: { fill: "art-plum", shape: "blob-wide" },
  // Priya: an upright rounded square, coral (calm, organised)
  priya: { fill: "art-coral", shape: "square" },
  // Alex: the app's own green blob, the same outline as yours
  alex: { fill: "accent", shape: "blob" },
};

// A body shape in the blob's 100 units, filled with a class and moved by a transform
function Shape({ shape, className, transform }: { shape: string; className: string; transform?: string }) {
  // The rounded square
  if (shape === "square") return <rect className={className} transform={transform} x="-90" y="-100" width="180" height="196" rx="58" />;
  // The blob's outline, as it is or stretched wide
  return <path className={className} transform={`${transform ?? ""} ${shape === "blob-wide" ? "scale(1.16 0.94)" : ""}`} d={BLOB} />;
}

// A colleague, centred at x, y with a radius in pixels, in a mood, looking toward a direction (-1 left to 1 right, and up), at time t
export function Person({ who, x, y, r, mood, t, look = 0, lookUp = 0 }: { who: Colleague; x: number; y: number; r: number; mood: ColleagueMood; t: number; look?: number; lookUp?: number }) {
  // Their body
  const body = BODIES[who];
  // A gentle bob, out of step with others by where they sit (Sam bounces more, Alex moves least)
  const bob = Math.sin(t * (who === "sam" ? 3.4 : 2.4) + x * 0.013) * (who === "sam" ? 9 : who === "alex" ? 4 : 6);
  // A blink now and then, at their own time
  const blink = (t * 30 + x * 0.7) % 149 < 4;
  // How open a talking mouth is
  const open = 0.25 + 0.75 * Math.abs(Math.sin(t * 11 + x));
  // Where the pupils sit, toward where they look
  const [px, py] = [look * 6, -lookUp * 5];
  // Drawn in the blob's own units
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${r / 100})`}>
      {/* The body, then its shade, then the lit body nudged up and left so the shade shows as a crescent */}
      <Shape shape={body.shape} className={`fill-${body.fill}`} />
      {/* (the shade) */}
      <Shape shape={body.shape} className="fill-on-warm opacity-20" />
      {/* (the lit body) */}
      <Shape shape={body.shape} className={`fill-${body.fill}`} transform="translate(-9 -8) scale(0.93)" />
      {/* The highlight, upper left */}
      <ellipse className="fill-art-cream opacity-45" cx="-50" cy="-56" rx="20" ry="12" transform="rotate(-35 -50 -56)" />
      {/* The face, in the dark face colour */}
      <g className={who === "alex" ? "text-accent-ink" : "text-on-warm"} transform={blink ? "translate(0 -18) scale(1 0.12) translate(0 18)" : undefined}>
        {/* Sam: big round eyes with dark pupils */}
        {who === "sam" && mood !== "happy" && <>{[-36, 36].map((ex) => <g key={ex}><circle className="fill-art-cream" cx={ex} cy="-18" r="20" /><circle className="fill-current" cx={ex + px} cy={-16 + py} r="10" /></g>)}</>}
        {/* Priya: round dot eyes */}
        {who === "priya" && mood !== "happy" && <>{[-34, 34].map((ex) => <circle key={ex} className="fill-current" cx={ex + px} cy={-16 + py} r="11" />)}</>}
        {/* Alex: the blob's own tall oval eyes */}
        {who === "alex" && mood !== "happy" && <>{[-34, 34].map((ex) => <ellipse key={ex} className="fill-current" cx={ex + px} cy={-22 + py} rx="10" ry="15" />)}</>}
        {/* Bored: heavy lids over the top half of each eye, in the body's colour */}
        {mood === "bored" && <>{[-1, 1].map((side) => <rect key={side} className={`fill-${body.fill}`} x={side * 35 - 26} y={who === "alex" ? -50 : -46} width="52" height={who === "alex" ? 26 : 28} />)}</>}
        {/* Pleased: happy arches, closer together for Alex */}
        {mood === "happy" && <path className="stroke-current" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M-48 -14l12-13 12 13M24 -14l12-13 12 13" />}
      </g>
      {/* Sam's brows, raised and sure (flat when bored) */}
      {who === "sam" && <path className="stroke-on-warm" strokeWidth="8" strokeLinecap="round" fill="none" d={mood === "bored" ? "M-56 -46h36M20 -46h36" : "M-56 -52q18 -12 36 -4M20 -56q18 -8 36 4"} />}
      {/* The mouth, in the face colour (light on Alex's green): talking, a wide grin, or a small smile */}
      <g className={who === "alex" ? "text-accent-ink" : "text-on-warm"}>
      {mood === "talk" && <ellipse className="fill-current" cx="0" cy="30" rx={16 - open * 3} ry={4 + open * 18} />}
      {/* (pleased) */}
      {mood === "happy" && <path className="fill-current" d="M-24 18h48q0 24-24 24t-24-24z" />}
      {/* (bored: a flat line) */}
      {mood === "bored" && <path className="stroke-current" strokeWidth="6" strokeLinecap="round" fill="none" d="M-14 26h28" />}
      {/* (listening) */}
      {mood === "ready" && <path className="stroke-current" strokeWidth="6" strokeLinecap="round" fill="none" d="M-16 22q16 14 32 0" />}
      </g>
    </g>
  );
}
