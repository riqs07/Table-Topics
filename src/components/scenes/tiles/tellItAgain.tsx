// Tell it again, better's tiles (decision 155): the course, and each of its lessons

// Load the blob, the sparkle and the tile type
import { Body, Twinkle, type TileDef } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";

// The tiles, by name
export const TELL_IT_AGAIN_TILES = {
  // Tell it again, better: the blob singing out a story, two "again" arrows turning round its speech bubble
  "tell-it-again": { fill: "fill-art-coral", tilt: -4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper left, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="36" cy="40" r="56" />
      {/* The speech bubble */}
      <ellipse className="fill-art-cream" cx="130" cy="74" rx="32" ry="25" />
      {/* Its words */}
      <path className="stroke-art-coral opacity-60" strokeWidth={4} strokeLinecap="round" d="M114 68h32M118 80h24" />
      {/* The two arrows round it, turning a little from its middle */}
      <Move loop="t-sway" origin="130px 74px">
        {/* The top arrow's curve */}
        <path className="stroke-art-sun" strokeWidth={6} strokeLinecap="round" fill="none" d="M92 52A44 44 0 0 1 168 52" />
        {/* Its head */}
        <path className="stroke-art-sun" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M169.7 42.2L168 52L158.6 48.6" />
        {/* The bottom arrow's curve */}
        <path className="stroke-art-sun" strokeWidth={6} strokeLinecap="round" fill="none" d="M168 96A44 44 0 0 1 92 96" />
        {/* Its head */}
        <path className="stroke-art-sun" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M90.3 105.8L92 96L101.4 99.4" />
      </Move>
      {/* The blob, telling it again, floating a little */}
      <Move loop="t-float"><Body x={64} y={148} r={38} face="sing" /></Move>
      {/* Sparkles */}
      <Twinkle x={168} y={150} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={38} y={44} size={8} delay={1.6} />
    </>
  ) },
  // Find your five: five cards fanned out above the blob, one line on each, swaying gently from the blob's hand
  "five-stories": { fill: "fill-art-leaf", tilt: 4, draw: (clip) => (
    <>
      {/* A darker circle behind, lower left, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="30" cy="176" r="52" />
      {/* The fan of cards, swaying from where they are held */}
      <Move loop="t-sway" origin="100px 104px">
        {/* Each card: turned about the corner where they are held, with its own colour on top, the middle one drawn last */}
        {([[-44, "fill-art-sky"], [-22, "fill-art-sun"], [44, "fill-art-plum"], [22, "fill-art-bloom"], [0, "fill-art-coral"]] as const).map(([angle, top]) => (
          <g key={angle} transform={`rotate(${angle} 100 104)`}>
            {/* A soft shadow, so each card's edge shows over the one behind */}
            <rect className="fill-on-warm opacity-15" x="88" y="50" width="28" height="44" rx="5" />
            {/* The card */}
            <rect className="fill-art-cream" x="86" y="48" width="28" height="44" rx="5" />
            {/* Its coloured top strip */}
            <rect className={top} x="86" y="48" width="28" height="10" rx="4" />
            {/* Its one line */}
            <path className="stroke-art-leaf" strokeWidth={3} strokeLinecap="round" d="M92 70h16" />
          </g>
        ))}
      </Move>
      {/* The blob, looking up at its five */}
      <Move loop="t-breathe" origin="100px 182px"><Body x={100} y={148} r={34} face="wonder" /></Move>
      {/* Sparkles */}
      <Twinkle x={166} y={44} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={36} y={60} size={8} delay={1.4} />
    </>
  ) },
  // Start close to the change: a dotted path from a faded old start to a star, the flag planted right beside the star, the blob hopping there
  "close-to-the-change": { fill: "fill-art-sky", tilt: -5, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, lower right, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="170" cy="172" r="56" />
      {/* The long way round: a dotted path from the old start */}
      <path className="stroke-art-cream opacity-60" strokeWidth={6} strokeLinecap="round" strokeDasharray="1 12" d="M32 96H130" />
      {/* The old start, faded */}
      <circle className="fill-art-cream opacity-40" cx="32" cy="96" r="6" />
      {/* The flag's pole, planted just before the change */}
      <path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" d="M120 58V98" />
      {/* The flag, fluttering from its pole */}
      <Move loop="t-flag" origin="120px 60px"><path className="fill-art-coral" d="M120 58l24 9-24 9z" /></Move>
      {/* The star: the moment it changed, swelling gently */}
      <Move loop="t-pulse" origin="156px 96px"><path className="fill-art-sun" d="M156 76L160.7 89.5L175 89.8L163.6 98.5L167.8 112.2L156 104L144.2 112.2L148.4 98.5L137 89.8L151.3 89.5z" /></Move>
      {/* The blob, hopping up to the flag */}
      <Move loop="t-hop"><Body x={78} y={142} r={34} face="up" /></Move>
      {/* A sparkle */}
      <Twinkle x={44} y={44} size={10} className="fill-art-sun" />
    </>
  ) },
  // Slow down the moment: an hourglass, its sand falling slowly, the blob watching in wonder
  "slow-the-moment": { fill: "fill-art-sun", tilt: 3, draw: (clip) => (
    <>
      {/* A darker circle behind, lower right, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="172" cy="174" r="52" />
      {/* The hourglass, tipping gently from its base */}
      <Move loop="t-nod" origin="140px 130px">
        {/* The glass */}
        <path className="fill-art-cream" d="M122 54h36q0 22-16 34q16 12 16 34h-36q0-22 16-34q-16-12-16-34z" />
        {/* The sand left at the top */}
        <path className="fill-art-coral" d="M128 64h24q-2 12-12 20q-10-8-12-20z" />
        {/* The thin stream falling */}
        <path className="stroke-art-coral" strokeWidth={2.5} strokeLinecap="round" d="M140 88V114" />
        {/* The heap at the bottom */}
        <path className="fill-art-coral" d="M126 122q14-14 28 0z" />
        {/* The top bar */}
        <rect className="fill-art-plum" x="114" y="46" width="52" height="9" rx="4" />
        {/* The bottom bar */}
        <rect className="fill-art-plum" x="114" y="121" width="52" height="9" rx="4" />
      </Move>
      {/* The blob, watching the moment slowly, breathing from its base */}
      <Move loop="t-breathe" origin="66px 180px"><Body x={66} y={142} r={38} face="wonder" /></Move>
      {/* Sparkles */}
      <Twinkle x={40} y={48} size={10} />
      {/* (another) */}
      <Twinkle x={176} y={84} size={7} delay={1.8} />
    </>
  ) },
  // Let them speak: a big speech bubble holding a pair of quote marks, the blob saying someone's line
  "in-their-words": { fill: "fill-art-bloom", tilt: -4, draw: (clip) => (
    <>
      {/* A darker circle behind, upper right, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="172" cy="30" r="50" />
      {/* The bubble, rocking a little from its tail */}
      <Move loop="t-wobble" origin="88px 112px">
        {/* The bubble */}
        <ellipse className="fill-art-cream" cx="124" cy="70" rx="44" ry="33" />
        {/* Its tail, pointing to the blob */}
        <path className="fill-art-cream" d="M98 92l-12 22 30-14z" />
        {/* The quote marks: each a round dot with a tail curling up */}
        {([110, 134] as const).map((x) => (
          <g key={x}>
            {/* The dot */}
            <circle className="fill-art-plum" cx={x} cy={78} r="8" />
            {/* Its tail */}
            <path className="stroke-art-plum" strokeWidth={5} strokeLinecap="round" fill="none" d={`M${x - 7} ${76}q-1-14 12-20`} />
          </g>
        ))}
      </Move>
      {/* The blob, saying their line */}
      <Move loop="t-float"><Body x={66} y={148} r={36} face="sing" /></Move>
      {/* Sparkles */}
      <Twinkle x={168} y={148} size={10} />
      {/* (another) */}
      <Twinkle x={36} y={46} size={8} delay={1.5} className="fill-art-sun" />
    </>
  ) },
  // End on what it meant: a lightbulb glowing above the blob as it sees why it mattered
  "what-it-meant": { fill: "fill-art-plum", tilt: 5, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, lower left, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="30" cy="172" r="54" />
      {/* The rays, glowing on and off */}
      <Move loop="t-glow"><path className="stroke-art-sun" strokeWidth={5} strokeLinecap="round" d="M130 26v-8M96 36l6 6M164 36l-6 6M86 64h8M166 64h8" /></Move>
      {/* The bulb's glass */}
      <circle className="fill-art-sun" cx="130" cy="62" r="24" />
      {/* Its glowing wire */}
      <path className="stroke-art-cream" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M120 64l5-7 5 7 5-7 5 7" />
      {/* Its base */}
      <rect className="fill-art-cream" x="120" y="84" width="20" height="16" rx="4" />
      {/* The ridges on the base */}
      <path className="stroke-art-plum opacity-50" strokeWidth={2.5} strokeLinecap="round" d="M123 90h14M123 95h14" />
      {/* The blob, looking up as it sees it */}
      <Move loop="t-float"><Body x={80} y={146} r={38} face="up" /></Move>
      {/* Sparkles */}
      <Twinkle x={166} y={142} size={10} />
      {/* (another) */}
      <Twinkle x={40} y={46} size={9} delay={1.7} className="fill-art-sun" />
    </>
  ) },
} satisfies Record<string, TileDef>;

// Each lesson's tile, by "course id/lesson id"
export const TELL_IT_AGAIN_LESSON_TILES: Readonly<Record<string, string>> = {
  // Find your five: five cards, one line each
  "tell-it-again/find": "five-stories",
  // Start close to the change: the flag beside the star
  "tell-it-again/close": "close-to-the-change",
  // Slow down the moment: the hourglass
  "tell-it-again/slow": "slow-the-moment",
  // Let them speak: the quote marks in a bubble
  "tell-it-again/said": "in-their-words",
  // End on what it meant: the lightbulb
  "tell-it-again/meant": "what-it-meant",
};
