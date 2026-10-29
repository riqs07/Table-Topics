// Course tiles (decision 142): the blob on a bright, tilted rounded square, one tile for each course and each of its lessons, in the flat style of picture-book app art. Every colour is a theme role (the art-* roles, the warm blob and its shade), so the tiles follow each theme and dark mode. Each tile has a slow, small loop (in globals.css, only when motion is welcome); "few" plays it three times and rests, "still" leaves only the blinks. Decorative: the words beside a tile carry the meaning

// Load React's tools for a unique id and the node type
import { useId, type ReactNode } from "react";
// Load the blob's outline, its faces, the moving-part wrapper and the motion setting from the scenes
import { BLOB, Face, Move, type FaceName, type SceneMotion } from "@/components/scenes/Scene";

// The tiles there are
export type CourseTileName = "stop-freezing" | "buy-a-beat" | "point-first" | "point-reason-example" | "land-it" | "the-run";

// The blob with its shaded side and a highlight, at a place and size (r is its radius in the tile's 200 units)
function Body({ x, y, r, face }: { x: number; y: number; r: number; face: FaceName }) {
  // Drawn in the blob's own units, then placed
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 100})`}>
      {/* The shaded body */}
      <path className="fill-warm-shade" d={BLOB} />
      {/* The lit body over it, nudged up and left, so the shade shows as a crescent at the lower right */}
      <path className="fill-warm" transform="translate(-9 -8) scale(0.93)" d={BLOB} />
      {/* A highlight at the upper left */}
      <ellipse className="fill-art-cream opacity-50" cx="-50" cy="-54" rx="20" ry="12" transform="rotate(-35 -50 -54)" />
      {/* The face */}
      <g className="text-on-warm">
        {/* Its features */}
        <Face face={face} />
      </g>
    </g>
  );
}

// A four-pointed sparkle that twinkles, at a place and size
function Twinkle({ x, y, size = 10, delay = 0, className = "fill-art-cream" }: { x: number; y: number; size?: number; delay?: number; className?: string }) {
  // The star, centred on its place
  return <path className={`s-move t-twinkle ${className}`} style={{ animationDelay: `${delay}s` }} d={`M${x} ${y - size}l${size * 0.24} ${size * 0.76} ${size * 0.76} ${size * 0.24}-${size * 0.76} ${size * 0.24}-${size * 0.24} ${size * 0.76}-${size * 0.24}-${size * 0.76}-${size * 0.76}-${size * 0.24} ${size * 0.76}-${size * 0.24}z`} />;
}

// What each tile draws on: its ground colour and how far it leans
const GROUNDS: Readonly<Record<CourseTileName, { fill: string; tilt: number }>> = {
  // Stop freezing: sky blue
  "stop-freezing": { fill: "fill-art-sky", tilt: -5 },
  // Buy a beat: leaf green
  "buy-a-beat": { fill: "fill-art-leaf", tilt: 4 },
  // Point first: sunny yellow
  "point-first": { fill: "fill-art-sun", tilt: -3 },
  // Point, reason, example: plum
  "point-reason-example": { fill: "fill-art-plum", tilt: 5 },
  // Land it: pink
  "land-it": { fill: "fill-art-bloom", tilt: -4 },
  // The run: coral
  "the-run": { fill: "fill-art-coral", tilt: 3 },
};

// Each tile's drawing on the 200 square, given the id of the clip that keeps background shapes inside the tile
const TILES: Record<CourseTileName, (clip: string) => ReactNode> = {
  // Stop freezing: the blob breaking out of a block of ice, chips of it drifting off
  "stop-freezing": (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="160" cy="40" r="64" />
      {/* Snow */}
      <circle className="fill-art-cream" cx="40" cy="96" r="3" />
      {/* (more) */}
      <circle className="fill-art-cream" cx="150" cy="96" r="2.5" />
      {/* The blob, floating up a little */}
      <Move loop="t-float"><Body x={100} y={110} r={46} face="happy" /></Move>
      {/* The block of ice over its lower half */}
      <rect className="fill-art-cream opacity-75" x="44" y="118" width="112" height="62" rx="12" />
      {/* The ice's shine */}
      <path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" d="M56 130l12-7M58 142l6-4" />
      {/* Its crack */}
      <path className="stroke-art-sky" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M104 118l-7 14 9 10-6 14" />
      {/* A chip of ice drifting off to the left */}
      <Move loop="t-drift" origin="48px 106px"><path className="fill-art-cream" d="M36 110l14-8 5 15z" /></Move>
      {/* Another to the right, out of step */}
      <Move loop="t-drift" origin="160px 104px" delay={1.4}><path className="fill-art-cream opacity-90" d="M154 106l15 3-7 12z" /></Move>
      {/* Sparkles */}
      <Twinkle x={46} y={54} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={164} y={142} size={8} delay={1.5} />
    </>
  ),
  // Buy a beat: eyes shut, taking a breath, with a pause sign beside
  "buy-a-beat": (clip) => (
    <>
      {/* Darker and lighter circles behind, kept inside the tile */}
      <g clipPath={`url(#${clip})`}>
        {/* Darker, lower left */}
        <circle className="fill-on-warm opacity-10" cx="28" cy="172" r="52" />
        {/* Lighter, upper right */}
        <circle className="fill-art-cream opacity-20" cx="174" cy="28" r="44" />
      </g>
      {/* The pause sign, swelling gently */}
      <Move loop="t-pulse" origin="148px 60px">
        {/* Its disc */}
        <circle className="fill-art-coral" cx="148" cy="60" r="24" />
        {/* Its two bars */}
        <rect className="fill-art-cream" x="138" y="49" width="7" height="22" rx="3" />
        {/* (the other) */}
        <rect className="fill-art-cream" x="151" y="49" width="7" height="22" rx="3" />
      </Move>
      {/* The blob, breathing in and out from its base */}
      <Move loop="t-breathe" origin="84px 164px"><Body x={84} y={122} r={46} face="puff" /></Move>
      {/* Breath curling away, one wisp after another */}
      <Move loop="t-air"><path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" fill="none" d="M134 118q12-6 20 2t-2 14" /></Move>
      {/* (the second) */}
      <Move loop="t-air" delay={2}><path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" fill="none" d="M138 140q8 0 14 6" /></Move>
      {/* A sparkle */}
      <Twinkle x={40} y={46} size={10} />
    </>
  ),
  // Point first: the arrow in the bullseye, the blob cheering
  "point-first": (clip) => (
    <>
      {/* Bright shapes in two corners, kept inside the tile */}
      <g clipPath={`url(#${clip})`}>
        {/* Green, upper left */}
        <circle className="fill-art-leaf" cx="22" cy="28" r="42" />
        {/* Purple, lower right */}
        <circle className="fill-art-plum" cx="188" cy="188" r="40" />
      </g>
      {/* The target's rings */}
      <circle className="fill-art-sky" cx="124" cy="84" r="54" />
      {/* (the light ring) */}
      <circle className="fill-art-cream" cx="124" cy="84" r="38" />
      {/* (the bullseye) */}
      <circle className="fill-art-coral" cx="124" cy="84" r="20" />
      {/* The arrow, quivering from its tip */}
      <Move loop="t-wobble" origin="124px 84px">
        {/* The shaft */}
        <path className="stroke-on-warm" strokeWidth={5} strokeLinecap="round" d="M124 84 162 46" />
        {/* The flights */}
        <path className="stroke-art-sky" strokeWidth={5} strokeLinecap="round" d="M156 42l10-10M162 48l10-8" />
      </Move>
      {/* The left arm, waving */}
      <Move loop="t-wave" origin="40px 148px"><ellipse className="fill-warm" cx="30" cy="134" rx="10" ry="17" transform="rotate(-40 30 134)" /></Move>
      {/* The right arm, waving out of step */}
      <Move loop="t-wave" origin="100px 148px" delay={0.9}><ellipse className="fill-warm-shade" cx="110" cy="134" rx="10" ry="17" transform="rotate(40 110 134)" /></Move>
      {/* The blob, delighted */}
      <Move loop="t-float"><Body x={70} y={146} r={36} face="happy" /></Move>
      {/* Sparkles */}
      <Twinkle x={168} y={146} size={10} />
      {/* (another) */}
      <Twinkle x={40} y={70} size={7} delay={2} />
    </>
  ),
  // Point, reason, example: three numbered blocks like steps, lifting in turn, the blob on the top one
  "point-reason-example": (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="40" cy="44" r="56" />
      {/* Each block: a coloured top, a cream face and its number, lifting one after another */}
      {([[30, 146, 36, "fill-art-coral", "1"], [76, 124, 58, "fill-art-sun", "2"], [122, 100, 82, "fill-art-leaf", "3"]] as const).map(([x, y, height, top, number], index) => (
        <Move key={number} loop="t-step" delay={index * 0.3}>
          {/* The coloured top */}
          <rect className={top} x={x} y={y} width="46" height={height} rx="8" />
          {/* The cream face under it */}
          <rect className="fill-art-cream" x={x} y={y + 12} width="46" height={height - 12} rx="8" />
          {/* The number */}
          <text className="fill-art-plum" x={x + 23} y={y + 12 + (height - 12) / 2 + 8} fontSize="22" textAnchor="middle">{number}</text>
          {/* The blob, riding the top block */}
          {index === 2 && <Body x={145} y={76} r={26} face="wonder" />}
        </Move>
      ))}
      {/* Sparkles */}
      <Twinkle x={164} y={40} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={70} y={92} size={7} delay={1.8} />
    </>
  ),
  // Land it: the blob drifting down under a parachute towards a target on the ground
  "land-it": (clip) => (
    <>
      {/* The ground, darker, kept inside the tile */}
      <path className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} d="M14 150Q100 130 186 150V186H14z" />
      {/* A cloud */}
      <g className="fill-art-cream opacity-60">
        {/* Its body */}
        <ellipse cx="44" cy="58" rx="20" ry="9" />
        {/* Its puff */}
        <circle cx="50" cy="50" r="10" />
      </g>
      {/* The target on the ground */}
      <ellipse className="fill-art-cream" cx="100" cy="166" rx="34" ry="9" />
      {/* (its ring) */}
      <ellipse className="fill-art-coral" cx="100" cy="166" rx="22" ry="6" />
      {/* (its middle) */}
      <ellipse className="fill-art-cream" cx="100" cy="166" rx="9" ry="2.5" />
      {/* The parachute and the blob, drifting and swaying together */}
      <Move loop="t-glide" origin="100px 60px">
        {/* The canopy */}
        <path className="fill-art-sun" d="M48 66Q100 4 152 66z" />
        {/* Its stripe */}
        <path className="fill-art-coral" d="M84 66Q100 18 116 66z" />
        {/* The cords */}
        <path className="stroke-art-cream" strokeWidth={2} d="M52 66 88 104M100 66v36M148 66l-36 38" />
        {/* The blob */}
        <Body x={100} y={118} r={24} face="ready" />
      </Move>
      {/* Sparkles */}
      <Twinkle x={160} y={96} size={10} />
      {/* (another) */}
      <Twinkle x={150} y={36} size={7} delay={2} />
    </>
  ),
  // The run: the blob running in a headband, speed lines streaking past, a finish flag rippling
  "the-run": (clip) => (
    <>
      {/* The track, darker, kept inside the tile */}
      <g clipPath={`url(#${clip})`}>
        {/* Its surface */}
        <path className="fill-on-warm opacity-10" d="M14 152H186V186H14z" />
        {/* Its lane line */}
        <path className="stroke-art-cream opacity-60" strokeWidth={3} strokeDasharray="10 10" d="M14 168H186" />
      </g>
      {/* The flag's pole */}
      <path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" d="M160 70V152" />
      {/* The flag, rippling from the pole */}
      <Move loop="t-flag" origin="160px 70px">
        {/* Its cloth */}
        <rect className="fill-art-cream" x="160" y="70" width="30" height="22" />
        {/* Its checks */}
        <path className="fill-art-plum" d="M160 70h10v11h-10zM180 70h10v11h-10zM170 81h10v11h-10z" />
      </Move>
      {/* Speed lines, one after another */}
      {["M22 92h24", "M14 110h30", "M24 128h20"].map((d, index) => <Move key={d} loop="t-speed" delay={index * 0.35}><path className="stroke-art-cream" strokeWidth={5} strokeLinecap="round" d={d} /></Move>)}
      {/* The back foot */}
      <Move loop="t-patter"><ellipse className="fill-warm-shade" cx="80" cy="150" rx="11" ry="6" /></Move>
      {/* The front foot, out of step */}
      <Move loop="t-patter" delay={0.25}><ellipse className="fill-warm-shade" cx="106" cy="150" rx="11" ry="6" /></Move>
      {/* The blob and its headband, bouncing along */}
      <Move loop="t-patter" delay={0.12}>
        {/* Leaning forward into the run */}
        <g transform="rotate(10 92 130)">
          {/* The blob, looking ahead */}
          <Body x={92} y={110} r={38} face="side" />
          {/* The headband */}
          <path className="stroke-art-sky" strokeWidth={7} strokeLinecap="round" fill="none" d="M58 86q34-14 70 0" />
          {/* Its tails, flying behind */}
          <path className="stroke-art-sky" strokeWidth={5} strokeLinecap="round" d="M58 86l-14-4M58 88l-12 8" />
        </g>
      </Move>
      {/* A sparkle */}
      <Twinkle x={130} y={40} size={9} className="fill-art-sun" />
    </>
  ),
};

// Draw a tile, sized by the class given
export function CourseTile({ name, motion = "loop", className = "" }: { name: CourseTileName; motion?: SceneMotion; className?: string }) {
  // A clip id unique on the page, safe inside url()
  const clip = `tile-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  // The tile's ground and lean
  const ground = GROUNDS[name];
  // The square drawing, hidden from screen readers, carrying how much it moves (the scene class brings the blinks and the motion settings)
  return (
    <svg aria-hidden="true" data-course-tile={name} data-motion={motion} viewBox="0 0 200 200" fill="none" className={`vl-scene overflow-visible ${className}`}>
      {/* The tile's shape, for keeping background shapes inside it */}
      <defs>
        {/* The clip */}
        <clipPath id={clip}>
          {/* The rounded square */}
          <rect x="14" y="14" width="172" height="172" rx="34" />
        </clipPath>
      </defs>
      {/* Everything leans together */}
      <g transform={`rotate(${ground.tilt} 100 100)`}>
        {/* The ground */}
        <rect className={ground.fill} x="14" y="14" width="172" height="172" rx="34" />
        {/* The drawing */}
        {TILES[name](clip)}
      </g>
    </svg>
  );
}
