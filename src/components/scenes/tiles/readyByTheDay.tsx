// Ready by the day's tiles (decision 145): the course, and each of its lessons

// Load the blob, the sparkle and the tile type
import { Body, Twinkle, type TileDef } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";

// The tiles, by name
export const READY_BY_THE_DAY_TILES = {
  // Ready by the day: the blob waving from a little stage beside a calendar page, its date circled
  "ready-by-the-day": { fill: "fill-art-coral", tilt: 4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="36" cy="40" r="52" />
      {/* The calendar page, leaning a little */}
      <g transform="rotate(6 132 76)">
        {/* The page */}
        <rect className="fill-art-cream" x="98" y="40" width="68" height="74" rx="10" />
        {/* Its coloured top, rounded above */}
        <rect className="fill-art-plum" x="98" y="40" width="68" height="22" rx="10" />
        {/* (square below) */}
        <rect className="fill-art-plum" x="98" y="52" width="68" height="10" />
        {/* The rings it hangs from */}
        <rect className="fill-art-cream" x="112" y="33" width="7" height="15" rx="3.5" />
        {/* (the other) */}
        <rect className="fill-art-cream" x="145" y="33" width="7" height="15" rx="3.5" />
        {/* The date */}
        <text className="fill-art-plum" x="132" y="98" fontSize="26" fontWeight="700" textAnchor="middle">14</text>
        {/* The circle round the date, pulsing */}
        <Move loop="t-pulse" origin="132px 89px"><ellipse className="stroke-art-coral" strokeWidth={4} fill="none" cx="132" cy="89" rx="21" ry="16" /></Move>
      </g>
      {/* The little stage */}
      <rect className="fill-art-plum" x="32" y="160" width="88" height="14" rx="7" />
      {/* The arm, waving */}
      <Move loop="t-wave" origin="56px 140px"><ellipse className="fill-warm" cx="42" cy="132" rx="9" ry="15" transform="rotate(-62 42 132)" /></Move>
      {/* The blob, bobbing on the stage */}
      <Move loop="t-float"><Body x={78} y={132} r={30} face="happy" /></Move>
      {/* Sparkles */}
      <Twinkle x={162} y={146} size={10} />
      {/* (another) */}
      <Twinkle x={40} y={70} size={8} delay={2} className="fill-art-sun" />
    </>
  ) },
  // One message: the blob holding up one big card with a single star on it
  "one-message": { fill: "fill-art-sun", tilt: -3, draw: (clip) => (
    <>
      {/* A darker circle behind, lower right, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="178" cy="178" r="54" />
      {/* The blob and its card, lifting it up now and then */}
      <Move loop="t-hop">
        {/* The far arm, out to the card's corner */}
        <ellipse className="fill-warm-shade" cx="142" cy="110" rx="9" ry="16" transform="rotate(38 142 110)" />
        {/* The near arm, out to the other corner */}
        <ellipse className="fill-warm" cx="58" cy="110" rx="9" ry="16" transform="rotate(-38 58 110)" />
        {/* The blob, pleased */}
        <Body x={100} y={140} r={34} face="happy" />
        {/* The card, held over its head */}
        <rect className="fill-art-cream" x="52" y="34" width="96" height="68" rx="10" />
        {/* The one thing on it: a star */}
        <path className="fill-art-coral" d="M100 46l6.5 13.2 14.5 2.1-10.5 10.2 2.5 14.5-13-6.8-13 6.8 2.5-14.5-10.5-10.2 14.5-2.1z" />
      </Move>
      {/* Sparkles */}
      <Twinkle x={34} y={52} size={10} className="fill-art-coral" />
      {/* (another) */}
      <Twinkle x={166} y={60} size={8} delay={2} />
    </>
  ) },
  // Open strong: stage curtains parting on the blob, surprised and delighted in the light
  "open-strong": { fill: "fill-art-plum", tilt: 5, draw: (clip) => (
    <>
      {/* The stage floor, darker, kept inside the tile */}
      <path className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} d="M0 158H200V200H0z" />
      {/* The pool of light on the floor */}
      <ellipse className="fill-art-cream opacity-30" cx="100" cy="164" rx="40" ry="8" />
      {/* The blob, in the middle of the stage */}
      <Move loop="t-float"><Body x={100} y={130} r={30} face="wow" /></Move>
      {/* The curtains and their pelmet, kept inside the tile */}
      <g clipPath={`url(#${clip})`}>
        {/* The left curtain, drawing back */}
        <Move loop="t-slide">
          {/* Its cloth */}
          <path className="fill-art-coral" d="M0 0H64C58 60 56 120 48 200H0z" />
          {/* Its folds */}
          <path className="stroke-on-warm opacity-15" strokeWidth={3} strokeLinecap="round" fill="none" d="M28 34V196M44 34C43 90 40 140 36 196" />
        </Move>
        {/* The right curtain, out of step, so the two part and close */}
        <Move loop="t-slide" delay={-3}>
          {/* Its cloth */}
          <path className="fill-art-coral" d="M200 0H136C142 60 144 120 152 200H200z" />
          {/* Its folds */}
          <path className="stroke-on-warm opacity-15" strokeWidth={3} strokeLinecap="round" fill="none" d="M172 34V196M156 34C157 90 160 140 164 196" />
        </Move>
        {/* The pelmet across the top, scalloped */}
        <path className="fill-art-sun" d="M0 0H200V28q-14.3 12-28.6 0t-28.6 0-28.6 0-28.6 0-28.6 0-28.6 0-28.6 0z" />
      </g>
      {/* A sparkle over the blob */}
      <Twinkle x={100} y={72} size={10} className="fill-art-sun" />
    </>
  ) },
  // Close on purpose: the blob taking a bow beside a present tied with a bow, the talk wrapped up
  "close-on-purpose": { fill: "fill-art-leaf", tilt: -4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="166" cy="40" r="54" />
      {/* The box */}
      <rect className="fill-art-cream" x="118" y="112" width="54" height="50" rx="6" />
      {/* The lid */}
      <rect className="fill-art-cream" x="113" y="100" width="64" height="16" rx="5" />
      {/* The shadow under the lid */}
      <rect className="fill-on-warm opacity-10" x="118" y="116" width="54" height="5" />
      {/* The ribbon down the front */}
      <rect className="fill-art-coral" x="139" y="100" width="12" height="62" />
      {/* The bow, popping now and then */}
      <Move loop="t-pop" origin="145px 96px">
        {/* Its left loop */}
        <ellipse className="fill-art-coral" cx="134" cy="91" rx="11" ry="7" transform="rotate(-25 134 91)" />
        {/* Its right loop */}
        <ellipse className="fill-art-coral" cx="156" cy="91" rx="11" ry="7" transform="rotate(25 156 91)" />
        {/* Its knot */}
        <circle className="fill-art-coral" cx="145" cy="97" r="5" />
      </Move>
      {/* The blob, bowing from its base */}
      <Move loop="t-nod" origin="68px 162px">
        {/* Leaning forward into the bow */}
        <g transform="rotate(14 68 162)">
          {/* The blob, smiling */}
          <Body x={68} y={128} r={34} face="happy" />
        </g>
      </Move>
      {/* Sparkles */}
      <Twinkle x={42} y={48} size={10} />
      {/* (another) */}
      <Twinkle x={108} y={62} size={8} delay={2} className="fill-art-sun" />
    </>
  ) },
  // Off the page: the blob climbing a ladder of three rungs beside a page whose lines are fading away
  "memory-ladder": { fill: "fill-art-sky", tilt: 3, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="36" cy="168" r="54" />
      {/* The ladder's rails */}
      <path className="stroke-art-cream" strokeWidth={6} strokeLinecap="round" d="M52 44V174M100 44V174" />
      {/* Its three rungs */}
      <path className="stroke-art-cream" strokeWidth={5} strokeLinecap="round" d="M52 72H100M52 112H100M52 152H100" />
      {/* The blob, climbing a step at a time */}
      <Move loop="t-hop">
        {/* The far arm, holding the right rail */}
        <ellipse className="fill-warm-shade" cx="102" cy="96" rx="11" ry="6" transform="rotate(-15 102 96)" />
        {/* The near arm, holding the left rail */}
        <ellipse className="fill-warm" cx="50" cy="96" rx="11" ry="6" transform="rotate(15 50 96)" />
        {/* The blob, looking up */}
        <Body x={76} y={92} r={22} face="up" />
      </Move>
      {/* The page */}
      <rect className="fill-art-cream" x="118" y="50" width="54" height="74" rx="8" />
      {/* Its first lines, still there */}
      <path className="stroke-art-plum" strokeWidth={5} strokeLinecap="round" d="M128 68H162M128 82H158" />
      {/* The rest, fading in and out */}
      <Move loop="t-glow"><path className="stroke-art-plum" strokeWidth={5} strokeLinecap="round" d="M128 96H148M128 110H140" /></Move>
      {/* Sparkles */}
      <Twinkle x={150} y={152} size={10} />
      {/* (another) */}
      <Twinkle x={128} y={34} size={7} delay={2} className="fill-art-sun" />
    </>
  ) },
  // Nerves on the day: the blob breathing slowly, eyes shut, beside a heart and a steady beat
  "nerves-on-the-day": { fill: "fill-art-bloom", tilt: -5, draw: (clip) => (
    <>
      {/* A darker circle behind, lower right, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="176" cy="180" r="54" />
      {/* The heart's disc */}
      <circle className="fill-art-cream" cx="146" cy="62" r="26" />
      {/* The heart, beating slowly */}
      <Move loop="t-pulse" origin="146px 63px"><path className="fill-art-coral" d="M146 76C131 66 130 52 138 50C142 49 145 52 146 55C147 52 150 49 154 50C162 52 161 66 146 76z" /></Move>
      {/* The beat, calm and even, coming and going */}
      <Move loop="t-glow"><path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" d="M118 108h12l5-9 7 18 5-9h20" /></Move>
      {/* The blob, breathing in and out from its base */}
      <Move loop="t-breathe" origin="76px 166px"><Body x={76} y={124} r={42} face="puff" /></Move>
      {/* A sparkle */}
      <Twinkle x={40} y={50} size={10} />
    </>
  ) },
  // The dress rehearsal: the blob in a bow tie under a spotlight, a stopwatch timing it
  "dress-rehearsal": { fill: "fill-art-coral", tilt: 4, draw: (clip) => (
    <>
      {/* The spotlight's beam, kept inside the tile, brightening and dimming */}
      <Move loop="t-glow"><path className="fill-art-cream opacity-25" clipPath={`url(#${clip})`} d="M72 0H104L138 168H38z" /></Move>
      {/* The pool of light on the floor */}
      <ellipse className="fill-art-cream opacity-30" cx="88" cy="166" rx="48" ry="9" />
      {/* The blob and its bow tie, bobbing */}
      <Move loop="t-float">
        {/* The blob, ready */}
        <Body x={88} y={130} r={34} face="ready" />
        {/* The bow tie's left wing */}
        <path className="fill-art-plum" d="M88 150 75 143V157z" />
        {/* Its right wing */}
        <path className="fill-art-plum" d="M88 150 101 143V157z" />
        {/* Its knot */}
        <circle className="fill-art-plum" cx="88" cy="150" r="4" />
      </Move>
      {/* The stopwatch's button */}
      <rect className="fill-art-cream" x="147" y="36" width="10" height="9" rx="2" />
      {/* Its face */}
      <circle className="fill-art-cream" cx="152" cy="68" r="22" />
      {/* Its rim */}
      <circle className="stroke-art-plum" strokeWidth={4} fill="none" cx="152" cy="68" r="19" />
      {/* Its hand, ticking from the middle */}
      <Move loop="t-swing" origin="152px 68px"><path className="stroke-art-coral" strokeWidth={4} strokeLinecap="round" d="M152 68V53" /></Move>
      {/* Its middle */}
      <circle className="fill-art-plum" cx="152" cy="68" r="3.5" />
      {/* A sparkle */}
      <Twinkle x={40} y={52} size={10} className="fill-art-sun" />
    </>
  ) },
} satisfies Record<string, TileDef>;
