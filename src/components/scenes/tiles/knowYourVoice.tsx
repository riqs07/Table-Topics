// Know your voice's tiles (decision 155): the course, and each of its lessons

// Load the blob, the sparkle and the tile type
import { Body, Twinkle, type TileDef } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";

// The tiles, by name
export const KNOW_YOUR_VOICE_TILES = {
  // Know your voice: the blob peering through a magnifying glass at its own voice, drawn as bars
  "know-your-voice": { fill: "fill-art-sky", tilt: -4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper right, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="166" cy="36" r="58" />
      {/* The voice bars, tall and short, on a line */}
      {([[96, 34], [110, 56], [124, 24], [138, 46], [152, 30], [166, 18]] as const).map(([x, height]) => (
        <rect key={x} className="fill-art-cream" x={x} y={88 - height / 2} width="9" height={height} rx="4.5" />
      ))}
      {/* The magnifying glass, held over the bars and gliding gently across them */}
      <Move loop="t-slide">
        {/* The lens, tinted */}
        <circle className="fill-art-sun opacity-40" cx="124" cy="88" r="30" />
        {/* The rim */}
        <circle className="stroke-art-coral" strokeWidth={7} fill="none" cx="124" cy="88" r="30" />
        {/* The handle */}
        <path className="stroke-art-coral" strokeWidth={10} strokeLinecap="round" d="M102 110 82 132" />
      </Move>
      {/* The blob, curious, below the glass */}
      <Move loop="t-float"><Body x={68} y={142} r={36} face="wonder" /></Move>
      {/* Sparkles */}
      <Twinkle x={40} y={48} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={166} y={150} size={8} delay={1.6} />
    </>
  ) },
  // Where your pauses fall: a sentence strip with a pause sign in the gap between its two halves
  "pause-map": { fill: "fill-art-leaf", tilt: 4, draw: (clip) => (
    <>
      {/* A darker circle behind, lower right, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="176" cy="176" r="56" />
      {/* The first half of the sentence */}
      <rect className="fill-art-cream" x="26" y="44" width="62" height="18" rx="9" />
      {/* The second half, after the gap */}
      <rect className="fill-art-cream" x="128" y="44" width="48" height="18" rx="9" />
      {/* The pause sign in the gap, swelling gently */}
      <Move loop="t-pulse" origin="108px 53px">
        {/* Its disc */}
        <circle className="fill-art-coral" cx="108" cy="53" r="17" />
        {/* Its two bars */}
        <rect className="fill-art-cream" x="101" y="45" width="5" height="16" rx="2.5" />
        {/* (the other) */}
        <rect className="fill-art-cream" x="110" y="45" width="5" height="16" rx="2.5" />
      </Move>
      {/* The blob, pleased, nodding at where the pause landed */}
      <Move loop="t-nod" origin="96px 172px"><Body x={96} y={128} r={42} face="happy" /></Move>
      {/* Sparkles */}
      <Twinkle x={34} y={110} size={10} />
      {/* (another) */}
      <Twinkle x={166} y={100} size={8} delay={1.8} className="fill-art-sun" />
    </>
  ) },
  // Your pace: a speed dial, its needle wavering in the middle, the blob beside it
  "pace-dial": { fill: "fill-art-sun", tilt: -3, draw: (clip) => (
    <>
      {/* A lighter circle behind, upper left, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="30" cy="34" r="52" />
      {/* The dial's face */}
      <path className="fill-art-cream" d="M70 104a54 54 0 0 1 108 0z" />
      {/* Its slow side */}
      <path className="stroke-art-leaf" strokeWidth={8} fill="none" d="M80 104a44 44 0 0 1 22-38" />
      {/* Its fast side */}
      <path className="stroke-art-coral" strokeWidth={8} fill="none" d="M146 66a44 44 0 0 1 22 38" />
      {/* The needle, wavering from its hub */}
      <Move loop="t-sway" origin="124px 104px">
        {/* The needle */}
        <path className="stroke-art-plum" strokeWidth={5} strokeLinecap="round" d="M124 104 124 64" />
      </Move>
      {/* The hub */}
      <circle className="fill-art-plum" cx="124" cy="104" r="7" />
      {/* The blob, watching the needle */}
      <Move loop="t-float"><Body x={66} y={142} r={38} face="side" /></Move>
      {/* A sparkle */}
      <Twinkle x={164} y={150} size={10} className="fill-art-cream" />
    </>
  ) },
  // Your pitch range: a voice line rising and falling on a card, a bracket measuring how far it moved
  "pitch-span": { fill: "fill-art-plum", tilt: 5, draw: (clip) => (
    <>
      {/* A lighter circle behind, lower left, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="30" cy="170" r="54" />
      {/* The card */}
      <rect className="fill-art-cream" x="62" y="30" width="114" height="80" rx="14" />
      {/* The voice line, up high, then falling to land low */}
      <path className="stroke-art-coral" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M74 78q12-30 26-14t20-20 22 28 24 22" />
      {/* The bracket beside it, showing the range, lifting gently */}
      <Move loop="t-step">
        {/* The bracket */}
        <path className="stroke-art-sun" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M44 40h8v58h-8" />
      </Move>
      {/* The blob, looking up at the line */}
      <Move loop="t-float"><Body x={110} y={144} r={34} face="up" /></Move>
      {/* Sparkles */}
      <Twinkle x={168} y={140} size={10} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={40} y={124} size={7} delay={2} />
    </>
  ) },
  // Your energy: a volume meter whose bars rise and fall in turn, the blob singing beside it
  "volume-meter": { fill: "fill-art-coral", tilt: -4, draw: (clip) => (
    <>
      {/* A darker circle behind, upper left, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="28" cy="30" r="52" />
      {/* The bars, each a different height, lifting one after another */}
      {([[118, 40, "fill-art-cream"], [138, 64, "fill-art-sun"], [158, 30, "fill-art-cream"]] as const).map(([x, height, colour], index) => (
        <Move key={x} loop="t-step" delay={index * 0.4}>
          {/* One bar, standing on the line */}
          <rect className={colour} x={x} y={150 - height} width="14" height={height} rx="7" />
        </Move>
      ))}
      {/* The line they stand on */}
      <path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" d="M112 156h66" />
      {/* The blob, singing out, breathing from its base */}
      <Move loop="t-breathe" origin="66px 172px"><Body x={66} y={132} r={40} face="sing" /></Move>
      {/* Sparkles */}
      <Twinkle x={150} y={46} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={40} y={80} size={8} delay={1.5} />
    </>
  ) },
  // Then and now: two cards side by side, each with a bar, the second bar taller and ticked
  "takes-side-by-side": { fill: "fill-art-bloom", tilt: 3, draw: (clip) => (
    <>
      {/* A lighter circle behind, upper right, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="170" cy="30" r="52" />
      {/* The first card, then */}
      <rect className="fill-art-cream" x="30" y="34" width="56" height="72" rx="10" />
      {/* Its bar, shorter */}
      <rect className="fill-art-sky" x="50" y="70" width="16" height="26" rx="5" />
      {/* The second card, now */}
      <rect className="fill-art-cream" x="100" y="34" width="56" height="72" rx="10" />
      {/* Its bar, taller */}
      <rect className="fill-art-coral" x="120" y="52" width="16" height="44" rx="5" />
      {/* The tick on the second card, popping gently */}
      <Move loop="t-pop" origin="156px 38px">
        {/* Its disc */}
        <circle className="fill-art-leaf" cx="156" cy="38" r="13" />
        {/* The tick */}
        <path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M150 38l4 5 8-9" />
      </Move>
      {/* The blob, pleased, below the cards */}
      <Move loop="t-float"><Body x={92} y={146} r={32} face="happy" /></Move>
      {/* Sparkles */}
      <Twinkle x={164} y={146} size={10} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={34} y={140} size={7} delay={1.8} />
    </>
  ) },
} satisfies Record<string, TileDef>;

// Each lesson's tile, by "course id/lesson id"
export const KNOW_YOUR_VOICE_LESSON_TILES: Readonly<Record<string, string>> = {
  // Lesson 1
  "know-your-voice/pauses": "pause-map",
  // Lesson 2
  "know-your-voice/pace": "pace-dial",
  // Lesson 3
  "know-your-voice/pitch": "pitch-span",
  // Lesson 4
  "know-your-voice/energy": "volume-meter",
  // Lesson 5
  "know-your-voice/compare": "takes-side-by-side",
};
