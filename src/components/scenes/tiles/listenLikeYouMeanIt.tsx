// Listen like you mean it's tiles (decision 155): the course, and each of its lessons. A second person, the one talking, is the same blob in the accent colour

// Load the blob, the sparkle and the tile type
import { Body, Twinkle, type TileDef } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";

// A heart centred on its place, at a size (1 is about 18 units across)
function Heart({ x, y, size = 1, className }: { x: number; y: number; size?: number; className: string }) {
  // Two lobes meeting in a point
  return <path className={className} transform={`translate(${x} ${y}) scale(${size})`} d="M0 3C0-2-9-5-9 1.5-9 6 0 10.5 0 13 0 10.5 9 6 9 1.5 9-5 0-2 0 3z" />;
}

// The tiles, by name
export const LISTEN_LIKE_YOU_MEAN_IT_TILES = {
  // The course: a friend talking, sound rings travelling across to the blob, who leans in to listen
  "listen-like-you-mean-it": { fill: "fill-art-bloom", tilt: 4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper right, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="168" cy="34" r="56" />
      {/* The sound rings, spreading from the friend towards the blob, one after another */}
      {[0, 1, 2].map((index) => (
        <Move key={index} loop="t-ring" origin="80px 104px" delay={index}>
          {/* One arc, opening to the right */}
          <path className="stroke-art-cream" strokeWidth={5} strokeLinecap="round" fill="none" d={`M${94 + index * 9} ${92 - index * 6}q${9 + index * 3} ${14 + index * 6} 0 ${28 + index * 12}`} />
        </Move>
      ))}
      {/* The friend, talking */}
      <Body x={56} y={134} r={34} face="happy" accent />
      {/* The blob, nodding along, leaning in */}
      <Move loop="t-nod" origin="148px 176px"><Body x={148} y={140} r={32} face="side-left" /></Move>
      {/* Sparkles */}
      <Twinkle x={40} y={50} size={10} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={178} y={92} size={7} delay={2} />
    </>
  ) },
  // React to the moment: the blob surprised, a bubble with an exclamation mark popping up beside it
  "react-to-the-moment": { fill: "fill-art-coral", tilt: -4, draw: (clip) => (
    <>
      {/* A darker circle behind, lower left, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="28" cy="174" r="54" />
      {/* The bubble, popping as the moment lands */}
      <Move loop="t-pop" origin="138px 62px">
        {/* Its body */}
        <rect className="fill-art-cream" x="104" y="32" width="68" height="58" rx="22" />
        {/* Its tail, towards the blob */}
        <path className="fill-art-cream" d="M116 86l-14 18 30-16z" />
        {/* The exclamation mark */}
        <path className="stroke-art-plum" strokeWidth={9} strokeLinecap="round" d="M138 46v20M138 78h0" />
      </Move>
      {/* The blob, wide-eyed, hopping at the news */}
      <Move loop="t-hop"><Body x={78} y={130} r={44} face="wow" /></Move>
      {/* Sparkles */}
      <Twinkle x={42} y={46} size={10} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={166} y={142} size={8} delay={1.6} />
    </>
  ) },
  // Their words, their feeling: a bubble holding a heart, glowing, the blob beside it, warm
  "their-feeling": { fill: "fill-art-plum", tilt: 5, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, lower right, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="174" cy="170" r="54" />
      {/* The bubble */}
      <rect className="fill-art-cream" x="30" y="30" width="78" height="60" rx="22" />
      {/* Its tail, towards the blob */}
      <path className="fill-art-cream" d="M88 86l14 18-30-16z" />
      {/* The heart inside, swelling gently */}
      <Move loop="t-pulse" origin="69px 60px"><Heart x={69} y={50} size={1.5} className="fill-art-coral" /></Move>
      {/* The blob, warm and attentive */}
      <Move loop="t-float"><Body x={124} y={134} r={42} face="happy" /></Move>
      {/* A sparkle */}
      <Twinkle x={160} y={46} size={10} className="fill-art-sun" />
    </>
  ) },
  // Stay on their story: a spotlight on the friend, the blob standing to one side, looking at them
  "stay-on-their-story": { fill: "fill-art-leaf", tilt: -3, draw: (clip) => (
    <>
      {/* The floor, darker, kept inside the tile */}
      <path className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} d="M14 166H186V186H14z" />
      {/* The spotlight's beam on the friend, glowing */}
      <Move loop="t-glow"><path className="fill-art-cream opacity-60" d="M62 26h20l40 140H22z" /></Move>
      {/* The pool of light on the floor */}
      <ellipse className="fill-art-cream opacity-70" cx="72" cy="166" rx="50" ry="8" />
      {/* The lamp */}
      <rect className="fill-art-sun" x="58" y="18" width="28" height="14" rx="6" />
      {/* The friend, in the light, telling it */}
      <Body x={72} y={136} r={30} face="happy" accent />
      {/* The blob, out of the light, nodding along */}
      <Move loop="t-nod" origin="150px 168px"><Body x={150} y={142} r={26} face="side-left" /></Move>
      {/* A sparkle */}
      <Twinkle x={158} y={52} size={10} className="fill-art-sun" />
    </>
  ) },
  // Hold the advice: the blob sitting on a toolbox, keeping the lid shut while it bumps
  "hold-the-advice": { fill: "fill-art-sky", tilt: 4, draw: (clip) => (
    <>
      {/* A lighter circle behind, upper left, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="30" cy="30" r="50" />
      {/* The toolbox's body */}
      <rect className="fill-art-coral" x="46" y="128" width="108" height="48" rx="8" />
      {/* Its latch */}
      <rect className="fill-art-cream" x="92" y="140" width="16" height="10" rx="3" />
      {/* A wrench peeking out at the end */}
      <path className="stroke-art-cream" strokeWidth={6} strokeLinecap="round" d="M154 132l14-12" />
      {/* (its jaw) */}
      <circle className="stroke-art-cream" strokeWidth={5} fill="none" cx="172" cy="116" r="6" />
      {/* The lid and the blob on it, bumping a little as the advice tries to get out */}
      <Move loop="t-hop">
        {/* The lid */}
        <rect className="fill-art-sun" x="42" y="118" width="116" height="14" rx="6" />
        {/* The blob, sitting on it, calm */}
        <Body x={100} y={86} r={34} face="happy" />
      </Move>
      {/* A sparkle */}
      <Twinkle x={164} y={44} size={10} />
    </>
  ) },
  // Ask about what mattered: a big heart with a question mark on it, the blob wondering beside it
  "ask-what-mattered": { fill: "fill-art-sun", tilt: -5, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, lower left, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="30" cy="170" r="54" />
      {/* The heart, swelling gently */}
      <Move loop="t-pulse" origin="132px 74px">
        {/* Its shape */}
        <Heart x={132} y={54} size={3.6} className="fill-art-coral" />
        {/* The question mark on it */}
        <text className="fill-art-cream" x="132" y="96" fontSize="38" fontWeight="700" textAnchor="middle">?</text>
      </Move>
      {/* The blob, wondering, nodding towards it */}
      <Move loop="t-nod" origin="70px 176px"><Body x={70} y={136} r={40} face="wonder" /></Move>
      {/* Sparkles */}
      <Twinkle x={44} y={46} size={10} />
      {/* (another) */}
      <Twinkle x={172} y={150} size={8} delay={1.8} className="fill-art-cream" />
    </>
  ) },
} satisfies Record<string, TileDef>;

// Each lesson's tile, by "course id/lesson id"
export const LISTEN_LIKE_YOU_MEAN_IT_LESSON_TILES: Readonly<Record<string, string>> = {
  // React to the moment
  "listen-like-you-mean-it/moment": "react-to-the-moment",
  // Their words, their feeling
  "listen-like-you-mean-it/feeling": "their-feeling",
  // Stay on their story
  "listen-like-you-mean-it/stay": "stay-on-their-story",
  // Hold the advice
  "listen-like-you-mean-it/advice": "hold-the-advice",
  // Ask about what mattered
  "listen-like-you-mean-it/matter": "ask-what-mattered",
};
