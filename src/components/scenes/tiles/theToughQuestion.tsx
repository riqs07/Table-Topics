// The tough question's tiles (decision 155): the course, and each of its lessons

// Load the blob, the sparkle and the tile type
import { Body, Twinkle, type TileDef } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";

// The tiles, by name
export const THE_TOUGH_QUESTION_TILES = {
  // The tough question: a spiky question bubble jabbing in from the corner, the blob calm and ready beneath it
  "the-tough-question": { fill: "fill-art-coral", tilt: -4, draw: (clip) => (
    <>
      {/* A soft darker circle behind, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="34" cy="172" r="56" />
      {/* The spiky bubble, wobbling from its tail */}
      <Move loop="t-wobble" origin="102px 106px">
        {/* Its spiky outline */}
        <path className="fill-art-cream" d="M134 20L142 30L154 25L156 38L169 40L164 52L174 60L164 68L169 80L156 82L154 95L142 90L134 100L126 90L114 95L112 82L99 80L104 68L94 60L104 52L99 40L112 38L114 25L126 30z" />
        {/* Its tail, pointing down at the blob */}
        <path className="fill-art-cream" d="M110 84l-8 22 20-12z" />
        {/* The question mark */}
        <text className="fill-art-plum" x="134" y="72" fontSize="34" fontWeight="700" textAnchor="middle">?</text>
      </Move>
      {/* The blob, calm, floating gently */}
      <Move loop="t-float"><Body x={84} y={136} r={42} face="ready" /></Move>
      {/* Sparkles */}
      <Twinkle x={42} y={50} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={164} y={150} size={8} delay={1.6} />
    </>
  ) },
  // Say it back: a spiky question coming in, and the blob's own smooth bubble saying the same question back, calmly
  "say-it-back": { fill: "fill-art-sky", tilt: 4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="172" cy="170" r="54" />
      {/* The spiky bubble coming in, upper left */}
      <path className="fill-art-coral" d="M52 27L58 35L68 32L68 42L78 46L72 54L78 62L68 66L68 76L58 73L52 81L46 73L36 76L36 66L26 62L32 54L26 46L36 42L36 32L46 35z" />
      {/* Its question mark */}
      <text className="fill-art-cream" x="52" y="63" fontSize="24" fontWeight="700" textAnchor="middle">?</text>
      {/* The blob's smooth bubble, swelling gently */}
      <Move loop="t-pulse" origin="138px 58px">
        {/* Its round body */}
        <ellipse className="fill-art-cream" cx="138" cy="58" rx="30" ry="24" />
        {/* Its tail, towards the blob */}
        <path className="fill-art-cream" d="M124 76l-6 16 18-12z" />
        {/* The same question, said back */}
        <text className="fill-art-sky" x="138" y="70" fontSize="30" fontWeight="700" textAnchor="middle">?</text>
      </Move>
      {/* The blob, nodding as it says it back */}
      <Move loop="t-nod" origin="100px 170px"><Body x={100} y={134} r={40} face="ready" /></Move>
      {/* A sparkle */}
      <Twinkle x={34} y={128} size={10} className="fill-art-sun" />
    </>
  ) },
  // Find the doubt: a magnifying glass over a small worried cloud, the blob looking closely
  "find-the-doubt": { fill: "fill-art-sun", tilt: -3, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="30" cy="34" r="54" />
      {/* The magnifying glass, swaying from its handle's end */}
      <Move loop="t-sway" origin="170px 112px">
        {/* The handle */}
        <path className="stroke-art-plum" strokeWidth={10} strokeLinecap="round" d="M146 90 170 112" />
        {/* The rim */}
        <circle className="fill-art-plum" cx="122" cy="64" r="36" />
        {/* The lens */}
        <circle className="fill-art-cream" cx="122" cy="64" r="28" />
        {/* The little worry cloud inside it */}
        <path className="fill-art-sky" d="M106 72a9 9 0 0 1 4-17 11 11 0 0 1 21-1 9 9 0 0 1 3 18z" />
        {/* The worry's wavy line */}
        <path className="stroke-art-cream" strokeWidth={3} strokeLinecap="round" fill="none" d="M110 66q4-4 8 0t8 0 8 0" />
      </Move>
      {/* The blob, looking closely */}
      <Move loop="t-float"><Body x={68} y={140} r={40} face="wonder" /></Move>
      {/* Sparkles */}
      <Twinkle x={166} y={160} size={10} />
      {/* (another) */}
      <Twinkle x={36} y={84} size={7} delay={1.8} className="fill-art-coral" />
    </>
  ) },
  // Agree with what's true: a balance with a tick on one pan and an arrow on the other, rocking gently, the blob steady beside it
  "agree-then-differ": { fill: "fill-art-leaf", tilt: 5, draw: (clip) => (
    <>
      {/* The ground, darker, kept inside the tile */}
      <path className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} d="M14 160Q100 146 186 160V186H14z" />
      {/* The balance's stand */}
      <path className="stroke-art-cream" strokeWidth={6} strokeLinecap="round" d="M130 52V150M114 152h32" />
      {/* The beam and its pans, rocking from the top of the stand */}
      <Move loop="t-sway" origin="130px 52px">
        {/* The beam */}
        <path className="stroke-art-cream" strokeWidth={6} strokeLinecap="round" d="M92 52h76" />
        {/* The cords */}
        <path className="stroke-art-cream" strokeWidth={2} d="M92 52 80 86M92 52l12 34M168 52l-12 34M168 52l12 34" />
        {/* The left pan */}
        <path className="fill-art-sun" d="M74 86h36a18 10 0 0 1-36 0z" />
        {/* Its tick: what's true */}
        <path className="stroke-art-plum" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M84 78l5 5 9-10" />
        {/* The right pan */}
        <path className="fill-art-coral" d="M150 86h36a18 10 0 0 1-36 0z" />
        {/* Its arrow: where you differ */}
        <path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M160 78h16m-5-5 5 5-5 5" />
      </Move>
      {/* The blob, steady */}
      <Body x={60} y={140} r={36} face="happy" />
      {/* Sparkles */}
      <Twinkle x={40} y={44} size={10} />
      {/* (another) */}
      <Twinkle x={172} y={136} size={7} delay={2} className="fill-art-sun" />
    </>
  ) },
  // Say "I don't know" well: a notebook with a question at the top and a tick below, a pencil writing the tick, the blob looking up to think
  "admit-it-well": { fill: "fill-art-plum", tilt: -4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="166" cy="34" r="50" />
      {/* The notebook */}
      <rect className="fill-art-cream" x="100" y="40" width="70" height="88" rx="8" transform="rotate(6 135 84)" />
      {/* Its spine */}
      <path className="stroke-art-sky" strokeWidth={5} strokeLinecap="round" d="M107 44l-9 84" />
      {/* The question at the top */}
      <text className="fill-art-plum" x="136" y="78" fontSize="28" fontWeight="700" textAnchor="middle" transform="rotate(6 135 84)">?</text>
      {/* The tick below it: what you'll find out */}
      <path className="stroke-art-leaf" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M122 100l7 7 14-15" />
      {/* The pencil, wobbling as it writes */}
      <Move loop="t-wobble" origin="146px 96px">
        {/* Its body */}
        <path className="stroke-art-sun" strokeWidth={8} strokeLinecap="round" d="M150 92 176 66" />
        {/* Its tip */}
        <path className="fill-art-coral" d="M146 96l1-9 7 7z" />
      </Move>
      {/* The blob, looking up to think */}
      <Move loop="t-float"><Body x={64} y={142} r={38} face="up" /></Move>
      {/* Sparkles */}
      <Twinkle x={40} y={50} size={10} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={168} y={156} size={8} delay={1.5} />
    </>
  ) },
  // Short, then stop: a short speech bubble of two lines, then a big full stop that swells, the blob content
  "short-then-stop": { fill: "fill-art-bloom", tilt: 3, draw: (clip) => (
    <>
      {/* A soft darker circle behind, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="176" cy="176" r="56" />
      {/* The short bubble */}
      <rect className="fill-art-cream" x="30" y="34" width="96" height="50" rx="20" />
      {/* Its tail, down towards the blob */}
      <path className="fill-art-cream" d="M70 82l-2 18 16-18z" />
      {/* Its two short lines */}
      <path className="stroke-art-plum" strokeWidth={6} strokeLinecap="round" d="M46 52h62M46 68h38" />
      {/* The full stop, swelling gently */}
      <Move loop="t-pulse" origin="150px 66px"><circle className="fill-art-coral" cx="150" cy="66" r="16" /></Move>
      {/* The blob, content */}
      <Move loop="t-float"><Body x={92} y={140} r={40} face="happy" /></Move>
      {/* Sparkles */}
      <Twinkle x={166} y={118} size={10} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={34} y={150} size={7} delay={1.8} />
    </>
  ) },
} satisfies Record<string, TileDef>;

// Each lesson's tile, by "course id/lesson id"
export const THE_TOUGH_QUESTION_LESSON_TILES: Readonly<Record<string, string>> = {
  // Lesson 1
  "the-tough-question/back": "say-it-back",
  // Lesson 2
  "the-tough-question/doubt": "find-the-doubt",
  // Lesson 3
  "the-tough-question/agree": "agree-then-differ",
  // Lesson 4
  "the-tough-question/unknown": "admit-it-well",
  // Lesson 5
  "the-tough-question/short": "short-then-stop",
};
