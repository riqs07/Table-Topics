// Toasts and tributes's tiles (decision 155): the course, and each of its lessons

// Load the blob, the sparkle and the tile type
import { Body, Twinkle, type TileDef } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";

// The tiles, by name
export const TOASTS_AND_TRIBUTES_TILES = {
  // Toasts and tributes: the blob, delighted, raising a glass that sways from its shoulder
  "toasts-and-tributes": { fill: "fill-art-plum", tilt: -4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="40" cy="40" r="60" />
      {/* The raised glass and the arm holding it, swaying from the shoulder */}
      <Move loop="t-sway" origin="140px 120px">
        {/* The glass's bowl */}
        <path className="fill-art-cream" d="M134 48h32l-3 22a13 13 0 0 1-26 0z" />
        {/* The drink in it */}
        <path className="fill-art-sun" d="M138 58h24l-2 12a10 10 0 0 1-20 0z" />
        {/* Its stem and foot */}
        <path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" d="M150 83v12M142 95h16" />
        {/* The arm, reaching up from behind the body to the stem */}
        <ellipse className="fill-warm" cx="144" cy="108" rx="9" ry="17" transform="rotate(20 144 108)" />
      </Move>
      {/* The blob, delighted, in front of its arm */}
      <Body x={92} y={132} r={44} face="happy" />
      {/* Sparkles */}
      <Twinkle x={172} y={40} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={34} y={150} size={8} delay={1.6} />
    </>
  ) },
  // One story, one quality: an open book in front of the blob, one heart rising from it
  "one-story-one-quality": { fill: "fill-art-sun", tilt: 4, draw: (clip) => (
    <>
      {/* A soft darker circle behind, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="172" cy="172" r="56" />
      {/* The blob, behind the book, pleased */}
      <Body x={100} y={102} r={40} face="happy" />
      {/* The book's cover */}
      <path className="fill-art-plum" d="M42 138L100 148L158 138V174L100 182L42 174z" />
      {/* Its left page */}
      <path className="fill-art-cream" d="M50 134Q76 132 100 142V174Q76 166 50 168z" />
      {/* Its right page */}
      <path className="fill-art-cream" d="M150 134Q124 132 100 142V174Q124 166 150 168z" />
      {/* Lines of the story on the pages */}
      <path className="stroke-art-plum opacity-40" strokeWidth={3} strokeLinecap="round" fill="none" d="M60 148q16-1 30 5M60 158q16-1 30 5M140 148q-16-1-30 5M140 158q-16-1-30 5" />
      {/* The one heart, swelling gently above the book */}
      <Move loop="t-pulse" origin="154px 60px"><path className="fill-art-coral" d="M154 74c-14-10-20-16-20-24a10 10 0 0 1 20-4a10 10 0 0 1 20 4c0 8-6 14-20 24z" /></Move>
      {/* A sparkle */}
      <Twinkle x={40} y={48} size={10} />
    </>
  ) },
  // Open on them: the person being toasted in a soft spotlight, the blob beside them looking their way
  "open-on-them": { fill: "fill-art-bloom", tilt: -3, draw: (clip) => (
    <>
      {/* The floor and the spotlight's beam, kept inside the tile */}
      <g clipPath={`url(#${clip})`}>
        {/* The floor, darker */}
        <path className="fill-on-warm opacity-10" d="M14 168H186V186H14z" />
        {/* The beam, glowing gently */}
        <Move loop="t-glow"><path className="fill-art-cream opacity-40" d="M128 14h40l32 172H96z" /></Move>
      </g>
      {/* The person being toasted, in the light, happy */}
      <Body x={142} y={138} r={32} face="happy" accent />
      {/* The blob's arm, held out towards them */}
      <ellipse className="fill-warm" cx="92" cy="130" rx="9" ry="13" transform="rotate(60 92 130)" />
      {/* The blob, looking at them */}
      <Body x={62} y={140} r={32} face="side" />
      {/* Sparkles */}
      <Twinkle x={40} y={46} size={10} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={92} y={40} size={7} delay={1.6} />
    </>
  ) },
  // Short and sweet: a stopwatch with only a small slice of time marked, the blob beside it, happy
  "short-and-sweet": { fill: "fill-art-leaf", tilt: 5, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="36" cy="164" r="56" />
      {/* The stopwatch's button */}
      <rect className="fill-art-cream" x="123" y="32" width="14" height="10" rx="3" />
      {/* Its case */}
      <circle className="fill-art-coral" cx="130" cy="78" r="36" />
      {/* Its face */}
      <circle className="fill-art-cream" cx="130" cy="78" r="28" />
      {/* The small slice of time: a couple of minutes, no more */}
      <path className="fill-art-sun" d="M130 78L130 50A28 28 0 0 1 154.2 64z" />
      {/* The hand, ticking from the middle */}
      <Move loop="t-wobble" origin="130px 78px"><path className="stroke-art-plum" strokeWidth={4} strokeLinecap="round" d="M130 78 146 60" /></Move>
      {/* The middle pin */}
      <circle className="fill-art-plum" cx="130" cy="78" r="4" />
      {/* The blob, pleased */}
      <Body x={68} y={138} r={38} face="happy" />
      {/* Sparkles */}
      <Twinkle x={42} y={48} size={10} />
      {/* (another) */}
      <Twinkle x={166} y={150} size={8} delay={1.5} className="fill-art-sun" />
    </>
  ) },
  // Raise the glass: two glasses meeting in a clink above the blob, a sparkle where they touch
  "raise-the-glass": { fill: "fill-art-coral", tilt: -4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="168" cy="168" r="58" />
      {/* The left glass, leaning in and rocking from its foot */}
      <Move loop="t-wobble" origin="79px 78px">
        {/* Leaning towards the other */}
        <g transform="rotate(14 79 78)">
          {/* The bowl */}
          <path className="fill-art-cream" d="M66 36h26l-3 18a10 10 0 0 1-20 0z" />
          {/* The drink */}
          <path className="fill-art-sun" d="M70 44h18l-2 10a7 7 0 0 1-14 0z" />
          {/* The stem and foot */}
          <path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" d="M79 64v14M71 78h16" />
        </g>
      </Move>
      {/* The right glass, leaning in and rocking out of step */}
      <Move loop="t-wobble" origin="121px 78px" delay={1.2}>
        {/* Leaning towards the other */}
        <g transform="rotate(-14 121 78)">
          {/* The bowl */}
          <path className="fill-art-cream" d="M108 36h26l-3 18a10 10 0 0 1-20 0z" />
          {/* The drink */}
          <path className="fill-art-sun" d="M112 44h18l-2 10a7 7 0 0 1-14 0z" />
          {/* The stem and foot */}
          <path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" d="M121 64v14M113 78h16" />
        </g>
      </Move>
      {/* The sparkle at the clink */}
      <Twinkle x={100} y={26} size={10} className="fill-art-sun" />
      {/* The blob, delighted, underneath */}
      <Body x={100} y={140} r={38} face="happy" />
      {/* Another sparkle */}
      <Twinkle x={36} y={150} size={8} delay={1.8} />
    </>
  ) },
  // On the day: the blob, ready, holding up a small card with just three words on it
  "toast-on-the-day": { fill: "fill-art-sky", tilt: 3, draw: (clip) => (
    <>
      {/* A soft darker circle behind, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="30" cy="30" r="52" />
      {/* The arm holding the card, tucked behind the body */}
      <ellipse className="fill-warm" cx="126" cy="122" rx="9" ry="15" transform="rotate(30 126 122)" />
      {/* The card, swaying a little from where it is held */}
      <Move loop="t-sway" origin="140px 124px">
        {/* The card */}
        <rect className="fill-art-cream" x="118" y="58" width="56" height="66" rx="8" transform="rotate(6 146 91)" />
        {/* Its three words, one for each beat */}
        <g transform="rotate(6 146 91)">
          {/* Their name */}
          <rect className="fill-art-coral" x="128" y="72" width="32" height="8" rx="4" />
          {/* The story */}
          <rect className="fill-art-sun" x="128" y="88" width="24" height="8" rx="4" />
          {/* The glass */}
          <rect className="fill-art-plum" x="128" y="104" width="36" height="8" rx="4" />
        </g>
      </Move>
      {/* The blob, ready */}
      <Body x={80} y={130} r={42} face="ready" />
      {/* Sparkles */}
      <Twinkle x={164} y={160} size={9} />
      {/* (another) */}
      <Twinkle x={36} y={72} size={8} delay={1.4} className="fill-art-sun" />
    </>
  ) },
} satisfies Record<string, TileDef>;

// Each lesson's tile, by "course id/lesson id"
export const TOASTS_AND_TRIBUTES_LESSON_TILES: Readonly<Record<string, string>> = {
  // One story, one quality
  "toasts-and-tributes/story": "one-story-one-quality",
  // Open on them
  "toasts-and-tributes/open": "open-on-them",
  // Short and sweet
  "toasts-and-tributes/short": "short-and-sweet",
  // Raise the glass
  "toasts-and-tributes/glass": "raise-the-glass",
  // On the day
  "toasts-and-tributes/day": "toast-on-the-day",
};
