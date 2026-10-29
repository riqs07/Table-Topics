// Stories that land's tiles (decision 145): the course, and each of its lessons

// Load the blob, the sparkle and the tile type
import { Body, Twinkle, type TileDef } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";

// The tiles, by name
export const STORIES_THAT_LAND_TILES = {
  // Stories that land: the blob singing out a story from an open storybook, a moon and stars rising from its pages
  "stories-that-land": { fill: "fill-art-plum", tilt: -3, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="166" cy="36" r="58" />
      {/* The blob behind the book, telling it */}
      <Move loop="t-float"><Body x={100} y={108} r={36} face="sing" /></Move>
      {/* The book's cover under the pages */}
      <path className="fill-art-coral" d="M36 144Q68 136 100 148Q132 136 164 144V172Q132 164 100 176Q68 164 36 172z" />
      {/* The left page */}
      <path className="fill-art-cream" d="M100 146Q72 132 42 140V166Q72 158 100 170z" />
      {/* The right page */}
      <path className="fill-art-cream" d="M100 146Q128 132 158 140V166Q128 158 100 170z" />
      {/* Lines of words on the pages */}
      <path className="stroke-art-plum opacity-40" strokeWidth={3} strokeLinecap="round" d="M54 148l30 3M54 156l26 2M116 151l30-3M120 158l26-2" />
      {/* A moon rising out of the book */}
      <Move loop="t-float" delay={0.8}><path className="fill-art-sun" d="M50 64a17 17 0 1 0 22 22a13 13 0 1 1-22-22z" /></Move>
      {/* Sparkles rising with it */}
      <Twinkle x={150} y={86} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={84} y={46} size={8} delay={1.6} />
    </>
  ) },
  // You have stories: the blob looking down at a tiny notebook as a small leaf drifts onto it
  "small-moments": { fill: "fill-art-sun", tilt: 4, draw: (clip) => (
    <>
      {/* A darker circle behind, lower left, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="30" cy="176" r="54" />
      {/* The blob, reading its notebook */}
      <Move loop="t-breathe" origin="96px 164px"><Body x={96} y={112} r={44} face="down" /></Move>
      {/* The notebook's cover */}
      <rect className="fill-art-sky" x="70" y="124" width="56" height="44" rx="6" />
      {/* Its page */}
      <rect className="fill-art-cream" x="74" y="128" width="48" height="36" rx="4" />
      {/* Lines on the page */}
      <path className="stroke-art-sky opacity-50" strokeWidth={3} strokeLinecap="round" d="M82 140h30M82 150h20" />
      {/* The near hand, holding the notebook */}
      <ellipse className="fill-warm" cx="68" cy="150" rx="9" ry="12" />
      {/* The far hand, holding the other side */}
      <ellipse className="fill-warm-shade" cx="128" cy="150" rx="9" ry="12" />
      {/* A small leaf swaying down from above, from its stalk */}
      <Move loop="t-sway" origin="150px 48px">
        {/* The leaf */}
        <path className="fill-art-leaf" d="M150 48q20 6 14 28q-20-6-14-28z" />
        {/* Its vein */}
        <path className="stroke-art-cream" strokeWidth={2} strokeLinecap="round" d="M152 52l9 20" />
      </Move>
      {/* A sparkle */}
      <Twinkle x={44} y={50} size={11} />
    </>
  ) },
  // Start in the middle: the blob hopping right into the middle of an open book
  "start-in-the-middle": { fill: "fill-art-sky", tilt: -5, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper left, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="34" cy="34" r="56" />
      {/* The book's cover */}
      <path className="fill-art-coral" d="M28 142Q64 132 100 144Q136 132 172 142V170Q136 160 100 172Q64 160 28 170z" />
      {/* The left page */}
      <path className="fill-art-cream" d="M100 142Q68 128 34 136V162Q68 154 100 166z" />
      {/* The right page */}
      <path className="fill-art-cream" d="M100 142Q132 128 166 136V162Q132 154 100 166z" />
      {/* Words before the middle */}
      <path className="stroke-art-sky opacity-60" strokeWidth={3} strokeLinecap="round" d="M44 144l24 2M44 152l20 1" />
      {/* Words after it */}
      <path className="stroke-art-sky opacity-60" strokeWidth={3} strokeLinecap="round" d="M132 146l24-2M136 153l20-1" />
      {/* The blob, hopping into the middle */}
      <Move loop="t-hop"><Body x={100} y={104} r={34} face="happy" /></Move>
      {/* Little lines where it lands, popping in time */}
      <Move loop="t-pop" origin="100px 132px"><path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" d="M62 118l-8-6M138 118l8-6M66 104l-10-1M134 104l10-1" /></Move>
      {/* Sparkles */}
      <Twinkle x={156} y={52} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={52} y={74} size={7} delay={1.8} />
    </>
  ) },
  // But, and so: the blob walking a zigzag path past a signpost
  "but-and-so": { fill: "fill-art-coral", tilt: 3, draw: (clip) => (
    <>
      {/* A darker circle behind, upper right, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="174" cy="30" r="52" />
      {/* The zigzag path, climbing to the upper right */}
      <path className="stroke-art-cream" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M34 168L130 150L60 116L144 92" />
      {/* The signpost's pole, at the path's end */}
      <path className="stroke-art-cream" strokeWidth={5} strokeLinecap="round" d="M150 92V40" />
      {/* Its two arms, pointing opposite ways, swaying from the top of the pole */}
      <Move loop="t-sway" origin="150px 44px">
        {/* The arm pointing right */}
        <path className="fill-art-sun" d="M150 40h22l8 8-8 8h-22z" />
        {/* The arm pointing left */}
        <path className="fill-art-sky" d="M150 60h-22l-8 8 8 8h22z" />
      </Move>
      {/* The back foot */}
      <Move loop="t-patter"><ellipse className="fill-warm-shade" cx="66" cy="164" rx="7" ry="4" /></Move>
      {/* The front foot, out of step */}
      <Move loop="t-patter" delay={0.25}><ellipse className="fill-warm-shade" cx="82" cy="161" rx="7" ry="4" /></Move>
      {/* The blob, walking the path, looking ahead */}
      <Move loop="t-patter" delay={0.12}><Body x={74} y={140} r={22} face="side" /></Move>
      {/* A sparkle */}
      <Twinkle x={44} y={60} size={11} className="fill-art-sun" />
    </>
  ) },
  // Bring it to life: a magnifying glass sliding over a speech bubble, making a small detail big, the blob amazed
  "bring-it-to-life": { fill: "fill-art-leaf", tilt: -4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, lower right, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="176" cy="172" r="54" />
      {/* The speech bubble */}
      <path className="fill-art-cream" d="M30 44q0-12 12-12h96q12 0 12 12v42q0 12-12 12H74l-18 16 2-16H42q-12 0-12-12z" />
      {/* Small words in it */}
      <path className="stroke-art-leaf opacity-50" strokeWidth={3} strokeLinecap="round" d="M44 50h26M44 62h18M44 74h24" />
      {/* The magnifying glass, sliding gently over the detail */}
      <Move loop="t-slide">
        {/* Its handle */}
        <path className="stroke-art-plum" strokeWidth={8} strokeLinecap="round" d="M136 88l18 18" />
        {/* Its rim */}
        <circle className="fill-art-cream stroke-art-plum" strokeWidth={6} cx="116" cy="66" r="26" />
        {/* The detail, made big: a small red balloon */}
        <circle className="fill-art-coral" cx="116" cy="62" r="11" />
        {/* (its string) */}
        <path className="stroke-art-plum" strokeWidth={2} strokeLinecap="round" fill="none" d="M116 73q-4 6 0 12" />
        {/* (its shine) */}
        <circle className="fill-art-cream opacity-70" cx="112" cy="58" r="3" />
      </Move>
      {/* The blob, amazed */}
      <Move loop="t-float"><Body x={76} y={148} r={30} face="wow" /></Move>
      {/* Sparkles */}
      <Twinkle x={164} y={132} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={30} y={130} size={7} delay={2} />
    </>
  ) },
  // End on the point: one big full stop landing at the end of the last line, the blob looking up at it
  "end-on-the-point": { fill: "fill-art-bloom", tilt: 5, draw: (clip) => (
    <>
      {/* A darker circle behind, lower left, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="28" cy="178" r="56" />
      {/* The first line of words */}
      <rect className="fill-art-cream" x="32" y="40" width="108" height="14" rx="7" />
      {/* The last line, shorter */}
      <rect className="fill-art-cream" x="32" y="66" width="68" height="14" rx="7" />
      {/* The full stop at its end, popping as it lands */}
      <Move loop="t-pop" origin="118px 73px"><circle className="fill-art-plum" cx="118" cy="73" r="11" /></Move>
      {/* The blob below, looking up at the stop it just set */}
      <Move loop="t-float"><Body x={104} y={146} r={34} face="wonder" /></Move>
      {/* Sparkles */}
      <Twinkle x={160} y={112} size={10} />
      {/* (another) */}
      <Twinkle x={160} y={50} size={8} delay={1.8} className="fill-art-sun" />
    </>
  ) },
  // The run: tell it shorter: three speech bubbles, each smaller than the last, popping in turn
  "tell-it-shorter": { fill: "fill-art-plum", tilt: -3, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, lower right, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="172" cy="170" r="56" />
      {/* Each bubble: its middle, its size and when it pops */}
      {([[56, 62, 26, 0], [112, 70, 19, 0.4], [154, 76, 13, 0.8]] as const).map(([x, y, r, delay]) => (
        <Move key={x} loop="t-pop" origin={`${x}px ${y}px`} delay={delay}>
          {/* The bubble */}
          <ellipse className="fill-art-cream" cx={x} cy={y} rx={r} ry={r * 0.8} />
          {/* Its tail */}
          <path className="fill-art-cream" d={`M${x - r * 0.4} ${y + r * 0.6}l-${r * 0.3} ${r * 0.5} ${r * 0.7}-${r * 0.4}z`} />
          {/* Its words, fewer as it shrinks */}
          <path className="stroke-art-plum opacity-50" strokeWidth={3} strokeLinecap="round" d={`M${x - r * 0.5} ${y}h${r}`} />
        </Move>
      ))}
      {/* The blob, happy to be quicker */}
      <Move loop="t-float"><Body x={74} y={140} r={36} face="happy" /></Move>
      {/* A sparkle */}
      <Twinkle x={150} y={134} size={11} className="fill-art-sun" />
    </>
  ) },
} satisfies Record<string, TileDef>;
