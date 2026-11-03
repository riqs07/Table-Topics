// The colleagues on the ad's video call, told apart the way the boss characters are (documents/plan-boss-levels.md, "Blob bosses told apart by shape"): each has their own body shape, eyes, one accessory that changes the silhouette, and their own art colour (never apricot, which stays the user's). Built like every blob: the shaded body, the top-left highlight, a simple face

// Load the blob's outline
import { BLOB } from "@/components/scenes/Scene";

// Who they are
export type Colleague = "sam" | "priya" | "alex";
// How they look right now: talking, pleased or listening
export type ColleagueMood = "talk" | "happy" | "ready";

// Each colleague's body: its colour and its shape (the blob's outline stretched, or a rounded square)
const BODIES: Record<Colleague, { fill: string; shape: string }> = {
  // Sam: wide and round, purple (the confident one who talks first)
  sam: { fill: "art-plum", shape: "blob-wide" },
  // Priya: an upright rounded square, coral (calm, organised)
  priya: { fill: "art-coral", shape: "square" },
  // Alex: a tall narrow bean, blue (quiet)
  alex: { fill: "art-sky", shape: "blob-tall" },
};

// A body shape in the blob's 100 units, filled with a class and moved by a transform
function Shape({ shape, className, transform }: { shape: string; className: string; transform?: string }) {
  // The rounded square
  if (shape === "square") return <rect className={className} transform={transform} x="-90" y="-100" width="180" height="196" rx="58" />;
  // The blob's outline, stretched wide or tall
  return <path className={className} transform={`${transform ?? ""} ${shape === "blob-wide" ? "scale(1.16 0.94)" : "scale(0.8 1.12)"}`} d={BLOB} />;
}

// A colleague, centred at x, y with a radius in pixels, in a mood, looking toward a direction (-1 left to 1 right, and up), at time t
export function Person({ who, x, y, r, mood, t, look = 0, lookUp = 0 }: { who: Colleague; x: number; y: number; r: number; mood: ColleagueMood; t: number; look?: number; lookUp?: number }) {
  // Their body
  const body = BODIES[who];
  // A gentle bob, out of step with others by where they sit (Sam bounces more, Alex sways less)
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
      {/* Accessories behind the body: Priya's bun */}
      {who === "priya" && <><circle className="fill-on-warm opacity-85" cx="6" cy="-118" r="34" /><rect className="fill-art-sun" x="-24" y="-96" width="60" height="14" rx="7" /></>}
      {/* The body, then its shade, then the lit body nudged up and left so the shade shows as a crescent */}
      <Shape shape={body.shape} className={`fill-${body.fill}`} />
      {/* (the shade) */}
      <Shape shape={body.shape} className="fill-on-warm opacity-20" />
      {/* (the lit body) */}
      <Shape shape={body.shape} className={`fill-${body.fill}`} transform="translate(-9 -8) scale(0.93)" />
      {/* The highlight, upper left */}
      <ellipse className="fill-art-cream opacity-45" cx="-50" cy="-56" rx="20" ry="12" transform="rotate(-35 -50 -56)" />
      {/* Sam's quiff: a dark swoop over the top */}
      {who === "sam" && <path className="fill-on-warm opacity-85" d="M-70 -66C-60 -112 10 -128 56 -100C70 -92 74 -80 66 -70C40 -96 0 -98 -20 -78C-34 -92 -56 -84 -70 -66Z" />}
      {/* Alex's beanie: a sunny cap with a cream fold and a pom-pom */}
      {who === "alex" && <><path className="fill-art-sun" d="M-74 -62C-74 -130 74 -130 74 -62Z" /><rect className="fill-art-cream" x="-80" y="-74" width="160" height="26" rx="13" /><circle className="fill-art-cream" cx="0" cy="-122" r="18" /></>}
      {/* The face, in the dark face colour */}
      <g className="text-on-warm" transform={blink ? "translate(0 -18) scale(1 0.12) translate(0 18)" : undefined}>
        {/* Sam: big round eyes with dark pupils */}
        {who === "sam" && mood !== "happy" && <>{[-36, 36].map((ex) => <g key={ex}><circle className="fill-art-cream" cx={ex} cy="-18" r="20" /><circle className="fill-current" cx={ex + px} cy={-16 + py} r="10" /></g>)}</>}
        {/* Priya: dot eyes behind glasses */}
        {who === "priya" && mood !== "happy" && <>{[-34, 34].map((ex) => <circle key={ex} className="fill-current" cx={ex + px} cy={-16 + py} r="9" />)}</>}
        {/* Alex: small dot eyes */}
        {who === "alex" && mood !== "happy" && <>{[-24, 24].map((ex) => <circle key={ex} className="fill-current" cx={ex + px} cy={-12 + py} r="7" />)}</>}
        {/* Pleased: happy arches, closer together for Alex */}
        {mood === "happy" && <path className="stroke-current" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" d={who === "alex" ? "M-36 -10l10-11 10 11M16 -10l10-11 10 11" : "M-48 -14l12-13 12 13M24 -14l12-13 12 13"} />}
      </g>
      {/* Sam's brows, raised and sure */}
      {who === "sam" && <path className="stroke-on-warm" strokeWidth="8" strokeLinecap="round" fill="none" d="M-56 -52q18 -12 36 -4M20 -56q18 -8 36 4" />}
      {/* Priya's glasses */}
      {who === "priya" && <g className="stroke-on-warm" strokeWidth="6" fill="none"><rect x="-62" y="-40" width="56" height="44" rx="14" /><rect x="6" y="-40" width="56" height="44" rx="14" /><path d="M-6 -22h12" /></g>}
      {/* Alex's blush */}
      {who === "alex" && <g className="fill-art-coral opacity-45"><ellipse cx="-40" cy="10" rx="12" ry="7" /><ellipse cx="40" cy="10" rx="12" ry="7" /></g>}
      {/* The mouth: talking, a wide grin, or a small smile */}
      {mood === "talk" && <ellipse className="fill-on-warm" cx="0" cy="30" rx={16 - open * 3} ry={4 + open * 18} />}
      {/* (pleased) */}
      {mood === "happy" && <path className="fill-on-warm" d={who === "alex" ? "M-16 18h32q0 16-16 16t-16-16z" : "M-24 18h48q0 24-24 24t-24-24z"} />}
      {/* (listening: Alex's is smaller) */}
      {mood === "ready" && <path className="stroke-on-warm" strokeWidth="6" strokeLinecap="round" fill="none" d={who === "alex" ? "M-10 24q10 8 20 0" : "M-16 22q16 14 32 0"} />}
    </g>
  );
}
