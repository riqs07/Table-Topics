// Explain it simply's tiles (decision 145): the course, and each of its lessons

// Load the blob, the sparkle and the tile type
import { Body, Twinkle, type TileDef } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";

// The tiles, by name
export const EXPLAIN_IT_SIMPLY_TILES = {
  // The course: a tangled scribble straightening out into one clean arrow, the blob pleased beside it
  "explain-it-simply": { fill: "fill-art-sun", tilt: -4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="172" cy="30" r="56" />
      {/* The tangle on the left, faint */}
      <path className="stroke-on-warm opacity-40" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M30 70c4-18 22-12 16 0s-20 12-14-4 22-10 22 6-14 14-10 0 14-8 20-2" />
      {/* The clean arrow it becomes, nudging forward */}
      <Move loop="t-slide">
        {/* The shaft */}
        <path className="stroke-art-plum" strokeWidth={7} strokeLinecap="round" d="M84 70H154" />
        {/* The head */}
        <path className="stroke-art-plum" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M142 56l14 14-14 14" />
      </Move>
      {/* The blob, pleased, floating a little */}
      <Move loop="t-float"><Body x={98} y={140} r={36} face="happy" /></Move>
      {/* Sparkles */}
      <Twinkle x={160} y={148} size={10} />
      {/* (another) */}
      <Twinkle x={40} y={124} size={7} delay={2} className="fill-art-coral" />
    </>
  ) },
  // Bottom line first: the blob holding up a sign with one bold line on it
  "bottom-line": { fill: "fill-art-sky", tilt: 4, draw: (clip) => (
    <>
      {/* A darker circle behind, lower left, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="24" cy="176" r="54" />
      {/* The sign on its pole, planted beside the blob, swaying gently from the pole's foot */}
      <Move loop="t-sway" origin="140px 174px">
        {/* The pole */}
        <path className="stroke-art-cream" strokeWidth={6} strokeLinecap="round" d="M140 86V172" />
        {/* The board */}
        <rect className="fill-art-cream" x="50" y="34" width="100" height="56" rx="10" />
        {/* The one bold line */}
        <rect className="fill-art-coral" x="66" y="55" width="68" height="14" rx="7" />
      </Move>
      {/* The arm reaching to the pole, behind the body */}
      <ellipse className="fill-warm" cx="122" cy="140" rx="9" ry="15" transform="rotate(60 122 140)" />
      {/* The blob, pleased with its one line */}
      <Body x={88} y={144} r={34} face="happy" />
      {/* Sparkles */}
      <Twinkle x={166} y={110} size={10} />
      {/* (another) */}
      <Twinkle x={38} y={110} size={7} delay={1.8} className="fill-art-sun" />
    </>
  ) },
  // The 60-second update: a three-line checklist ticking itself off, the blob beside it
  "done-next-need": { fill: "fill-art-leaf", tilt: -3, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper left, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="28" cy="30" r="52" />
      {/* The list's card */}
      <rect className="fill-art-cream" x="88" y="36" width="82" height="114" rx="12" />
      {/* Each row: a box, a line, and a tick that pops on in turn */}
      {[60, 93, 126].map((y, index) => (
        <g key={y}>
          {/* The box */}
          <rect className="stroke-art-leaf" strokeWidth={3.5} x="99" y={y - 10} width="20" height="20" rx="5" />
          {/* The line of words */}
          <rect className="fill-art-sky" x="127" y={y - 4} width="32" height="8" rx="4" />
          {/* The tick */}
          <Move loop="t-pop" origin={`109px ${y}px`} delay={index * 0.6}>
            {/* Its stroke */}
            <path className="stroke-art-coral" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" d={`M102 ${y}l6 6 12-14`} />
          </Move>
        </g>
      ))}
      {/* The blob, ready with its update */}
      <Move loop="t-float"><Body x={56} y={144} r={32} face="happy" /></Move>
      {/* A sparkle */}
      <Twinkle x={44} y={78} size={10} />
    </>
  ) },
  // Explain it to a friend: the blob drawing one simple picture, a house, on a small easel
  "plain-words": { fill: "fill-art-coral", tilt: 5, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper left, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="26" cy="30" r="50" />
      {/* The easel's legs */}
      <path className="stroke-art-plum" strokeWidth={5} strokeLinecap="round" d="M100 116l-8 54M154 116l8 54M127 116v40" />
      {/* The board */}
      <rect className="fill-art-cream" x="86" y="36" width="82" height="82" rx="8" />
      {/* The house: walls and roof */}
      <path className="stroke-art-plum" strokeWidth={4.5} strokeLinejoin="round" strokeLinecap="round" fill="none" d="M108 104V82l19-16 19 16v22z" />
      {/* (its door) */}
      <path className="stroke-art-plum" strokeWidth={4.5} strokeLinecap="round" fill="none" d="M122 104v-11h10v11" />
      {/* The sun beside it */}
      <circle className="fill-art-sun" cx="154" cy="52" r="6" />
      {/* The arm with the pen, drawing */}
      <Move loop="t-wave" origin="80px 132px"><ellipse className="fill-warm" cx="90" cy="118" rx="9" ry="16" transform="rotate(50 90 118)" /></Move>
      {/* The blob, pleased with its drawing */}
      <Body x={60} y={142} r={34} face="happy" />
      {/* A sparkle */}
      <Twinkle x={40} y={84} size={10} />
    </>
  ) },
  // Speak up in meetings: the blob at a table, arm up and a speech bubble out; a second person listening across the table
  "speak-up": { fill: "fill-art-plum", tilt: -4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper right, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="176" cy="26" r="46" />
      {/* The raised arm, waving from the shoulder */}
      <Move loop="t-wave" origin="40px 116px"><ellipse className="fill-warm-shade" cx="30" cy="102" rx="9" ry="16" transform="rotate(-40 30 102)" /></Move>
      {/* The blob, speaking up */}
      <Body x={64} y={122} r={32} face="happy" />
      {/* The listener across the table */}
      <Body x={142} y={126} r={27} face="side-left" accent />
      {/* The table */}
      <rect className="fill-art-cream" x="26" y="142" width="148" height="14" rx="7" />
      {/* Its front edge */}
      <rect className="fill-art-sun" x="34" y="156" width="132" height="8" rx="4" />
      {/* The speech bubble, popping now and then */}
      <Move loop="t-pop" origin="98px 60px">
        {/* Its body */}
        <rect className="fill-art-cream" x="76" y="42" width="46" height="32" rx="12" />
        {/* Its tail, towards the blob */}
        <path className="fill-art-cream" d="M84 72l-6 12 16-12z" />
        {/* Three dots of words */}
        <path className="stroke-art-plum" strokeWidth={5} strokeLinecap="round" d="M88 58h.01M99 58h.01M110 58h.01" />
      </Move>
      {/* A sparkle */}
      <Twinkle x={160} y={78} size={9} className="fill-art-sun" />
    </>
  ) },
  // When you don't know: a calendar page with a tick on it, a question mark drifting off, the blob wondering
  "dont-know-yet": { fill: "fill-art-bloom", tilt: 3, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper right, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="180" cy="28" r="44" />
      {/* The calendar page */}
      <rect className="fill-art-cream" x="94" y="48" width="74" height="90" rx="10" />
      {/* Its coloured top */}
      <path className="fill-art-coral" d="M94 70V58a10 10 0 0 1 10-10h54a10 10 0 0 1 10 10v12z" />
      {/* Its rings */}
      <path className="stroke-art-plum" strokeWidth={5} strokeLinecap="round" d="M114 42v12M148 42v12" />
      {/* The tick for the day it will be known, popping now and then */}
      <Move loop="t-pop" origin="131px 102px"><path className="stroke-art-leaf" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M114 102l12 12 22-26" /></Move>
      {/* The question mark, drifting off */}
      <Move loop="t-drift" origin="50px 60px"><text className="fill-art-cream" x="50" y="76" fontSize="44" fontWeight="700" textAnchor="middle">?</text></Move>
      {/* The blob, wondering */}
      <Body x={60} y={144} r={34} face="wonder" />
      {/* A sparkle */}
      <Twinkle x={160} y={160} size={9} />
    </>
  ) },
  // The run, pitch an idea: the blob on a box, one arm up, a light bulb glowing above
  "pitch-it": { fill: "fill-art-sun", tilt: -5, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper left, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="30" cy="30" r="52" />
      {/* The box */}
      <rect className="fill-art-plum" x="62" y="140" width="76" height="34" rx="6" />
      {/* Its stripe */}
      <rect className="fill-art-cream opacity-60" x="62" y="152" width="76" height="6" />
      {/* The raised arm, waving from the shoulder */}
      <Move loop="t-wave" origin="126px 108px"><ellipse className="fill-warm" cx="136" cy="94" rx="9" ry="17" transform="rotate(42 136 94)" /></Move>
      {/* The blob, pitching */}
      <Body x={98} y={108} r={34} face="happy" />
      {/* The bulb's glow, coming and going */}
      <Move loop="t-glow"><circle className="fill-art-cream opacity-50" cx="148" cy="50" r="22" /></Move>
      {/* The bulb */}
      <circle className="fill-art-cream" cx="148" cy="48" r="13" />
      {/* Its base */}
      <rect className="fill-art-plum" x="142" y="59" width="12" height="9" rx="2" />
      {/* Its filament */}
      <path className="stroke-art-coral" strokeWidth={3} strokeLinecap="round" fill="none" d="M143 48q5-6 10 0" />
      {/* A sparkle */}
      <Twinkle x={40} y={112} size={9} />
    </>
  ) },
} satisfies Record<string, TileDef>;
