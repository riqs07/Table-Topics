// A voice they lean in for's tiles (decision 145): the course, and each of its lessons

// Load the blob, the sparkle and the tile type
import { Body, Twinkle, type TileDef } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";

// The tiles, by name
export const VOICE_LEAN_IN_TILES = {
  // The course: the blob singing, sound rings spreading from it and a note floating up
  "voice-lean-in": { fill: "fill-art-leaf", tilt: -4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="168" cy="168" r="60" />
      {/* Sound rings to the right, spreading one after another from the mouth */}
      {[0, 1, 2].map((index) => (
        <Move key={index} loop="t-ring" origin="104px 112px" delay={index * 0.9}>
          {/* One ring's arc */}
          <path className="stroke-art-cream" strokeWidth={5} strokeLinecap="round" fill="none" d={`M${128 + index * 16} ${86 - index * 10}q${14 + index * 4} ${26 + index * 10} 0 ${52 + index * 20}`} />
        </Move>
      ))}
      {/* A note, floating up */}
      <Move loop="t-float">
        {/* Its head */}
        <ellipse className="fill-art-sun" cx="150" cy="56" rx="9" ry="7" transform="rotate(-20 150 56)" />
        {/* Its stem */}
        <path className="stroke-art-sun" strokeWidth={4} strokeLinecap="round" d="M158 53V28l12 4" />
      </Move>
      {/* The blob, singing */}
      <Move loop="t-breathe" origin="78px 160px"><Body x={78} y={116} r={44} face="sing" /></Move>
      {/* A sparkle */}
      <Twinkle x={40} y={48} size={11} className="fill-art-sun" />
    </>
  ) },
  // Breath first: eyes shut, breathing in, holding a balloon that swells with the breath
  "breath-first": { fill: "fill-art-sky", tilt: 3, draw: (clip) => (
    <>
      {/* A darker circle behind, lower left, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="30" cy="176" r="56" />
      {/* The balloon's string, from the blob's side up to the balloon */}
      <path className="stroke-art-cream" strokeWidth={2.5} strokeLinecap="round" fill="none" d="M110 130q22-14 24-44" />
      {/* The balloon, swelling gently from its knot */}
      <Move loop="t-breathe" origin="134px 86px">
        {/* Its body */}
        <ellipse className="fill-art-coral" cx="138" cy="58" rx="24" ry="28" />
        {/* Its shine */}
        <ellipse className="fill-art-cream opacity-60" cx="129" cy="48" rx="5" ry="8" transform="rotate(20 129 48)" />
        {/* Its knot */}
        <path className="fill-art-coral" d="M131 88h7l-3.5-6z" />
      </Move>
      {/* The arm holding the string */}
      <ellipse className="fill-warm" cx="112" cy="132" rx="9" ry="14" transform="rotate(40 112 132)" />
      {/* The blob, breathing in from its base */}
      <Move loop="t-breathe" origin="76px 164px"><Body x={76} y={124} r={42} face="puff" /></Move>
      {/* A sparkle */}
      <Twinkle x={46} y={48} size={10} />
    </>
  ) },
  // Clear sounds: crisp letters popping out one after another as the blob speaks
  "clear-sounds": { fill: "fill-art-sun", tilt: -5, draw: (clip) => (
    <>
      {/* A lighter circle behind, upper right, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="172" cy="30" r="50" />
      {/* Three letters on cream badges, each popping in turn */}
      {([[132, 62, "t", "fill-art-plum"], [156, 104, "d", "fill-art-coral"], [130, 146, "k", "fill-art-sky"]] as const).map(([x, y, letter, ink], index) => (
        <Move key={letter} loop="t-pop" origin={`${x}px ${y}px`} delay={index * 0.6}>
          {/* The badge */}
          <circle className="fill-art-cream" cx={x} cy={y} r="18" />
          {/* The letter */}
          <text className={ink} x={x} y={y + 9} fontSize="26" fontWeight="700" textAnchor="middle">{letter}</text>
        </Move>
      ))}
      {/* The blob, speaking */}
      <Move loop="t-float"><Body x={70} y={118} r={42} face="sing" /></Move>
      {/* A sparkle */}
      <Twinkle x={40} y={50} size={10} className="fill-art-cream" />
    </>
  ) },
  // Pace and pauses: a metronome ticking beside the blob
  "pace-and-pauses": { fill: "fill-art-plum", tilt: 4, draw: (clip) => (
    <>
      {/* A lighter circle behind, upper left, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="34" cy="34" r="54" />
      {/* The metronome's case */}
      <path className="fill-art-sun" d="M128 52h28l18 112h-64z" />
      {/* Its face */}
      <path className="fill-art-cream" d="M133 66h18l12 84h-42z" />
      {/* Its arm, swinging from the base */}
      <Move loop="t-swing" origin="142px 148px">
        {/* The rod */}
        <path className="stroke-art-plum" strokeWidth={4} strokeLinecap="round" d="M142 148V74" />
        {/* The weight */}
        <rect className="fill-art-coral" x="135" y="92" width="14" height="10" rx="3" />
      </Move>
      {/* The blob, listening to the beat, nodding along */}
      <Move loop="t-nod" origin="70px 160px"><Body x={70} y={124} r={40} face="ready" /></Move>
      {/* A sparkle */}
      <Twinkle x={92} y={50} size={9} className="fill-art-sun" />
    </>
  ) },
  // Stress the key word: the blob holding up one big word among small ones
  "key-word": { fill: "fill-art-coral", tilt: -3, draw: (clip) => (
    <>
      {/* A darker circle behind, lower right, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="176" cy="176" r="54" />
      {/* The small words, a line of quiet blocks */}
      <g className="fill-art-cream opacity-60">
        {/* Before */}
        <rect x="30" y="46" width="22" height="12" rx="4" />
        {/* (another) */}
        <rect x="58" y="46" width="16" height="12" rx="4" />
        {/* After */}
        <rect x="150" y="46" width="22" height="12" rx="4" />
      </g>
      {/* The pole the sign is held up on */}
      <path className="stroke-art-cream" strokeWidth={5} strokeLinecap="round" d="M140 72V138" />
      {/* The key word, big and bold, on its pole, pulsing */}
      <Move loop="t-pulse" origin="112px 52px">
        {/* The block */}
        <rect className="fill-art-sun" x="80" y="32" width="64" height="40" rx="10" />
        {/* Its bold line, the word */}
        <rect className="fill-art-plum" x="92" y="47" width="40" height="10" rx="5" />
      </Move>
      {/* The blob, proud of it */}
      <Move loop="t-float"><Body x={100} y={138} r={38} face="happy" /></Move>
      {/* The arm gripping the pole, at the blob's side */}
      <ellipse className="fill-warm" cx="140" cy="128" rx="8" ry="13" transform="rotate(-25 140 128)" />
      {/* A sparkle */}
      <Twinkle x={46} y={142} size={10} className="fill-art-sun" />
    </>
  ) },
  // Land it low: the blob sliding down a gentle falling curve, the way a statement ends
  "land-it-low": { fill: "fill-art-bloom", tilt: 5, draw: (clip) => (
    <>
      {/* A lighter circle behind, upper left, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="30" cy="30" r="50" />
      {/* The falling pitch line, a slide from upper left to lower right */}
      <path className="stroke-art-cream" strokeWidth={10} strokeLinecap="round" fill="none" d="M32 66q60 0 90 50t52 46" />
      {/* Its landing dot */}
      <circle className="fill-art-plum" cx="168" cy="162" r="9" />
      {/* The blob, gliding down the line */}
      <Move loop="t-glide" origin="92px 96px"><Body x={92} y={80} r={33} face="happy" /></Move>
      {/* Sparkles */}
      <Twinkle x={152} y={50} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={56} y={150} size={8} delay={1.8} />
    </>
  ) },
  // Fill the room: wide rings of sound spreading across the tile from the blob
  "fill-the-room": { fill: "fill-art-sky", tilt: -4, draw: (clip) => (
    <>
      {/* Rings spreading from the blob, one after another, kept inside the tile */}
      <g clipPath={`url(#${clip})`}>
        {[0, 1, 2].map((index) => (
          <Move key={index} loop="t-ring" origin="72px 132px" delay={index * 1}>
            {/* One ring */}
            <circle className="stroke-art-cream" strokeWidth={5} fill="none" cx="72" cy="132" r={66 + index * 30} />
          </Move>
        ))}
      </g>
      {/* The blob, singing out */}
      <Move loop="t-breathe" origin="72px 172px"><Body x={72} y={132} r={40} face="sing" /></Move>
      {/* Sparkles */}
      <Twinkle x={160} y={46} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={40} y={44} size={8} delay={2} />
    </>
  ) },
  // The run: the blob at a lectern, a speech on it, giving it with everything
  "speech-run": { fill: "fill-art-sun", tilt: 3, draw: (clip) => (
    <>
      {/* A lighter circle behind, upper right, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="168" cy="36" r="56" />
      {/* Sound rings from the blob, to the right */}
      {[0, 1].map((index) => (
        <Move key={index} loop="t-ring" origin="100px 84px" delay={index * 1.2}>
          {/* One ring's arc */}
          <path className="stroke-art-cream" strokeWidth={5} strokeLinecap="round" fill="none" d={`M${146 + index * 14} ${60 - index * 8}q${12 + index * 4} ${24 + index * 8} 0 ${48 + index * 16}`} />
        </Move>
      ))}
      {/* The blob behind the lectern, speaking */}
      <Move loop="t-float"><Body x={100} y={86} r={38} face="sing" /></Move>
      {/* The lectern's top, sloping */}
      <path className="fill-art-plum" d="M54 112h92l-8 18H62z" />
      {/* Its stand */}
      <rect className="fill-art-plum" x="88" y="128" width="24" height="44" />
      {/* Its foot */}
      <rect className="fill-art-plum" x="70" y="166" width="60" height="10" rx="5" />
      {/* The page on the lectern */}
      <path className="fill-art-cream" d="M78 104l46-2 4 14-46 2z" />
      {/* Its lines */}
      <path className="stroke-art-plum opacity-40" strokeWidth={2} strokeLinecap="round" d="M86 108h28M88 113h20" />
      {/* A sparkle */}
      <Twinkle x={40} y={56} size={10} className="fill-art-cream" />
    </>
  ) },
} satisfies Record<string, TileDef>;
