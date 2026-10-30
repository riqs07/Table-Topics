// Interview ready's tiles (decision 155): the course, and each of its lessons

// Load the blob, the sparkle and the tile type
import { Body, Twinkle, type TileDef } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";

// The tiles, by name
export const INTERVIEW_READY_TILES = {
  // Interview ready: the blob, ready to go, with a briefcase at its side
  "interview-ready": { fill: "fill-art-sky", tilt: 4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper left, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="34" cy="38" r="58" />
      {/* The arm reaching to the briefcase's handle, behind the body */}
      <ellipse className="fill-warm" cx="122" cy="128" rx="10" ry="16" transform="rotate(55 122 128)" />
      {/* The blob, ready, floating a little */}
      <Move loop="t-float"><Body x={80} y={124} r={44} face="happy" /></Move>
      {/* The briefcase's handle */}
      <path className="stroke-art-cream" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M136 128v-8h22v8" />
      {/* The briefcase */}
      <rect className="fill-art-coral" x="120" y="128" width="54" height="42" rx="8" />
      {/* Its band */}
      <path className="stroke-on-warm opacity-20" strokeWidth={3} d="M120 144H174" />
      {/* Its clasp */}
      <rect className="fill-art-cream" x="141" y="139" width="12" height="9" rx="2" />
      {/* Sparkles */}
      <Twinkle x={160} y={50} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={34} y={166} size={7} delay={1.6} />
    </>
  ) },
  // Tell me about yourself: a framed picture of the blob's smaller self, swaying on its nail, the blob looking up at it
  "tell-me-about-yourself": { fill: "fill-art-sun", tilt: -3, draw: (clip) => (
    <>
      {/* A darker circle behind, lower right, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="176" cy="176" r="56" />
      {/* The nail */}
      <circle className="fill-art-plum" cx="128" cy="32" r="4" />
      {/* The picture, swaying from its nail */}
      <Move loop="t-sway" origin="128px 32px">
        {/* Its string */}
        <path className="stroke-art-plum" strokeWidth={2.5} strokeLinejoin="round" fill="none" d="M100 54 128 32 156 54" />
        {/* Its frame */}
        <rect className="fill-art-plum" x="94" y="50" width="68" height="58" rx="7" />
        {/* The picture inside */}
        <rect className="fill-art-cream" x="102" y="58" width="52" height="42" rx="4" />
        {/* The smaller self, from before */}
        <Body x={128} y={84} r={14} face="happy" />
      </Move>
      {/* The blob, wondering at its old self */}
      <Body x={70} y={140} r={40} face="wonder" />
      {/* Sparkles */}
      <Twinkle x={40} y={48} size={10} />
      {/* (another) */}
      <Twinkle x={168} y={124} size={7} delay={1.8} className="fill-art-coral" />
    </>
  ) },
  // The STAR answer: a big star shining above, the blob reaching up to it
  "star-answer": { fill: "fill-art-plum", tilt: 5, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper left, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="36" cy="40" r="56" />
      {/* The star, swelling gently */}
      <Move loop="t-pulse" origin="138px 64px">
        {/* Its body */}
        <path className="fill-art-sun" d="M138 32L146 53L168 54L151 68L157 90L138 78L119 90L125 68L108 54L130 53z" />
        {/* Its shine */}
        <path className="stroke-art-cream" strokeWidth={3} strokeLinecap="round" d="M130 60l4-4" />
      </Move>
      {/* The arm reaching up towards it, behind the body */}
      <ellipse className="fill-warm" cx="116" cy="112" rx="10" ry="17" transform="rotate(40 116 112)" />
      {/* The blob, delighted */}
      <Body x={82} y={142} r={40} face="happy" />
      {/* Sparkles */}
      <Twinkle x={170} y={128} size={10} />
      {/* (another) */}
      <Twinkle x={44} y={84} size={7} delay={2} className="fill-art-sun" />
    </>
  ) },
  // Own it: the blob's speech bubble with one bold "I" in it, nodding
  "own-it": { fill: "fill-art-coral", tilt: -4, draw: (clip) => (
    <>
      {/* A darker circle behind, lower right, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="178" cy="172" r="54" />
      {/* The bubble, nodding from its tail */}
      <Move loop="t-nod" origin="112px 104px">
        {/* Its body */}
        <rect className="fill-art-cream" x="96" y="34" width="72" height="60" rx="18" />
        {/* Its tail, pointing to the blob */}
        <path className="fill-art-cream" d="M108 90l-10 18 26-16z" />
        {/* The one bold "I" */}
        <text className="fill-art-plum" x="132" y="80" fontSize="44" fontWeight="700" textAnchor="middle">I</text>
      </Move>
      {/* The blob, proud of its part */}
      <Move loop="t-float"><Body x={76} y={142} r={40} face="happy" /></Move>
      {/* Sparkles */}
      <Twinkle x={40} y={50} size={10} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={168} y={124} size={7} delay={1.6} />
    </>
  ) },
  // The hard one: a note with a cross at the top and a tick below it, the tick glowing as the lesson is learned
  "the-hard-one": { fill: "fill-art-leaf", tilt: 3, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, lower left, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="26" cy="174" r="52" />
      {/* The note */}
      <rect className="fill-art-cream" x="100" y="32" width="70" height="86" rx="10" />
      {/* The cross on its first line: the mistake */}
      <path className="stroke-art-coral" strokeWidth={5} strokeLinecap="round" d="M112 48l12 12M124 48l-12 12" />
      {/* The first line's words, faint */}
      <rect className="fill-art-plum opacity-30" x="132" y="51" width="28" height="6" rx="3" />
      {/* The tick on its second line, glowing: what changed */}
      <Move loop="t-glow"><path className="stroke-art-plum" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M110 92l8 8 16-18" /></Move>
      {/* The second line's words */}
      <rect className="fill-art-plum opacity-60" x="140" y="91" width="20" height="6" rx="3" />
      {/* The blob, steady, nodding along */}
      <Move loop="t-nod" origin="74px 182px"><Body x={74} y={144} r={38} face="ready" /></Move>
      {/* A sparkle */}
      <Twinkle x={44} y={50} size={10} className="fill-art-sun" />
    </>
  ) },
  // Your close: the blob asking a question back, the person across the table listening
  "your-close": { fill: "fill-art-bloom", tilt: -5, draw: (clip) => (
    <>
      {/* The table, darker, kept inside the tile */}
      <path className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} d="M14 166H186V186H14z" />
      {/* The bubble, nodding from its tail */}
      <Move loop="t-nod" origin="80px 96px">
        {/* Its body */}
        <rect className="fill-art-cream" x="58" y="32" width="66" height="50" rx="16" />
        {/* Its tail, pointing to the blob */}
        <path className="fill-art-cream" d="M74 78l-6 18 22-16z" />
        {/* The question */}
        <text className="fill-art-plum" x="91" y="70" fontSize="34" fontWeight="700" textAnchor="middle">?</text>
      </Move>
      {/* The person listening, across the table */}
      <Body x={152} y={146} r={26} face="side-left" accent />
      {/* The blob, asking */}
      <Body x={70} y={136} r={38} face="side" />
      {/* Sparkles */}
      <Twinkle x={160} y={50} size={10} />
      {/* (another) */}
      <Twinkle x={34} y={40} size={7} delay={1.8} className="fill-art-sun" />
    </>
  ) },
} satisfies Record<string, TileDef>;

// Each lesson's tile, by "course id/lesson id"
export const INTERVIEW_READY_LESSON_TILES: Readonly<Record<string, string>> = {
  // Tell me about yourself: the picture of its smaller self
  "interview-ready/yourself": "tell-me-about-yourself",
  // The STAR answer: the star
  "interview-ready/star": "star-answer",
  // Own it: the bold "I"
  "interview-ready/own": "own-it",
  // The hard one: a cross, then a tick
  "interview-ready/hard": "the-hard-one",
  // Your close: a question back
  "interview-ready/close": "your-close",
};
