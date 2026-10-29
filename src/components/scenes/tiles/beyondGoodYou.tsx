// Beyond “good, you?”'s tiles (decision 145): the course, and each of its lessons. A second person is the same blob in the accent colour

// Load the blob, the sparkle and the tile type
import { Body, Twinkle, type TileDef } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";

// A small heart centred on its place, for listening
function Heart({ x, y, className }: { x: number; y: number; className: string }) {
  // Two lobes meeting in a point
  return <path className={className} transform={`translate(${x} ${y})`} d="M0 3C0-2-7-4-7 1.5-7 5.5 0 9.5 0 11.5 0 9.5 7 5.5 7 1.5 7-4 0-2 0 3z" />;
}

// The tiles, by name
export const BEYOND_GOOD_YOU_TILES = {
  // The course: the blob and a friend chatting, their speech bubbles popping up in turn
  "beyond-good-you": { fill: "fill-art-bloom", tilt: 5, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="34" cy="176" r="56" />
      {/* The blob's bubble, popping */}
      <Move loop="t-pop" origin="62px 66px">
        {/* Its body */}
        <rect className="fill-art-cream" x="32" y="46" width="60" height="38" rx="15" />
        {/* Its tail, towards the blob */}
        <path className="fill-art-cream" d="M52 82l-2 14 14-14z" />
        {/* Its three dots */}
        <path className="stroke-art-plum" strokeWidth={6} strokeLinecap="round" d="M50 65h0M62 65h0M74 65h0" />
      </Move>
      {/* The friend's bubble, popping a beat later */}
      <Move loop="t-pop" origin="138px 54px" delay={1.5}>
        {/* Its body */}
        <rect className="fill-art-cream" x="110" y="36" width="56" height="36" rx="14" />
        {/* Its tail, towards the friend */}
        <path className="fill-art-cream" d="M148 70l4 14-14-14z" />
        {/* Its heart */}
        <Heart x={138} y={48} className="fill-art-coral" />
      </Move>
      {/* The blob, bobbing as it talks */}
      <Move loop="t-float"><Body x={66} y={142} r={34} face="happy" /></Move>
      {/* The friend, listening */}
      <Body x={140} y={146} r={30} face="side-left" accent />
      {/* A sparkle */}
      <Twinkle x={170} y={102} size={9} />
    </>
  ) },
  // Answer with a hook: a speech bubble with a fishing hook hanging from it, swaying
  "answer-with-a-hook": { fill: "fill-art-sky", tilt: -4, draw: (clip) => (
    <>
      {/* A darker circle behind, lower left, kept inside the tile */}
      <circle className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} cx="26" cy="176" r="54" />
      {/* The bubble */}
      <rect className="fill-art-cream" x="88" y="32" width="84" height="48" rx="18" />
      {/* Its tail, towards the blob */}
      <path className="fill-art-cream" d="M100 78l-14 20 30-20z" />
      {/* Its words, as two lines */}
      <path className="stroke-art-sky" strokeWidth={6} strokeLinecap="round" d="M104 50h52M104 63h34" />
      {/* The line and hook, swaying from the bubble */}
      <Move loop="t-sway" origin="154px 80px">
        {/* The line */}
        <path className="stroke-art-cream" strokeWidth={3} strokeLinecap="round" d="M154 80v30" />
        {/* The hook */}
        <path className="stroke-art-sun" strokeWidth={6} strokeLinecap="round" fill="none" d="M154 108v14q0 10 9 10t9-9" />
        {/* Its barb */}
        <path className="stroke-art-sun" strokeWidth={5} strokeLinecap="round" d="M172 123l-5 4" />
      </Move>
      {/* The blob, pleased with its answer */}
      <Move loop="t-float"><Body x={70} y={138} r={40} face="happy" /></Move>
      {/* A sparkle */}
      <Twinkle x={40} y={50} size={10} />
    </>
  ) },
  // Ask the second question: two blobs, a dashed thread linking their bubbles, the second one a question
  "second-question": { fill: "fill-art-sun", tilt: 3, draw: (clip) => (
    <>
      {/* The ground, darker, kept inside the tile */}
      <path className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} d="M14 166Q100 152 186 166V186H14z" />
      {/* The thread from one bubble to the other */}
      <path className="stroke-art-coral" strokeWidth={4} strokeLinecap="round" strokeDasharray="2 9" fill="none" d="M84 58Q100 38 118 58" />
      {/* The friend's bubble, with what they said */}
      <rect className="fill-art-cream" x="28" y="48" width="56" height="36" rx="14" />
      {/* Its tail, towards the friend */}
      <path className="fill-art-cream" d="M48 82l-2 14 14-14z" />
      {/* Its words */}
      <path className="stroke-art-sun" strokeWidth={5} strokeLinecap="round" d="M40 62h32M40 72h20" />
      {/* The blob's bubble, the question, popping */}
      <Move loop="t-pop" origin="146px 66px">
        {/* Its body */}
        <rect className="fill-art-cream" x="118" y="48" width="56" height="36" rx="14" />
        {/* Its tail, towards the blob */}
        <path className="fill-art-cream" d="M154 82l2 14-14-14z" />
        {/* The question mark */}
        <text className="fill-art-plum" x="146" y="76" fontSize="28" fontWeight="700" textAnchor="middle">?</text>
      </Move>
      {/* The friend, who spoke first */}
      <Body x={60} y={142} r={30} face="ready" accent />
      {/* The blob, asking, leaning in a little */}
      <Move loop="t-nod" origin="144px 170px"><Body x={144} y={142} r={30} face="wonder" /></Move>
      {/* A sparkle */}
      <Twinkle x={102} y={110} size={8} className="fill-art-cream" />
    </>
  ) },
  // Listen out loud: the blob with a hand cupped to its ear, little hearts floating up
  "listen-out-loud": { fill: "fill-art-plum", tilt: -5, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, lower left, kept inside the tile */}
      <circle className="fill-art-cream opacity-15" clipPath={`url(#${clip})`} cx="30" cy="172" r="56" />
      {/* The arm cupped to the ear, behind the body's side */}
      <ellipse className="fill-warm" cx="136" cy="92" rx="11" ry="17" transform="rotate(35 136 92)" />
      {/* The blob, nodding along */}
      <Move loop="t-nod" origin="92px 176px"><Body x={92} y={128} r={44} face="side" /></Move>
      {/* Hearts floating up, one after another */}
      <Move loop="t-air"><Heart x={156} y={78} className="fill-art-coral" /></Move>
      {/* (the second) */}
      <Move loop="t-air" delay={1.3}><Heart x={168} y={104} className="fill-art-sun" /></Move>
      {/* (the third) */}
      <Move loop="t-air" delay={2.6}><Heart x={150} y={50} className="fill-art-cream" /></Move>
      {/* A sparkle */}
      <Twinkle x={44} y={48} size={10} />
    </>
  ) },
  // One level deeper: the blob dipping happily into a pool, ripples spreading
  "one-level-deeper": { fill: "fill-art-leaf", tilt: 4, draw: (clip) => (
    <>
      {/* A soft lighter circle behind, upper right, kept inside the tile */}
      <circle className="fill-art-cream opacity-20" clipPath={`url(#${clip})`} cx="172" cy="30" r="48" />
      {/* The pool, its far side */}
      <ellipse className="fill-art-sky" cx="100" cy="144" rx="68" ry="22" />
      {/* A ripple spreading behind the blob */}
      <Move loop="t-ring" origin="100px 144px"><ellipse className="stroke-art-cream" strokeWidth={3} fill="none" cx="100" cy="144" rx="50" ry="12" /></Move>
      {/* The blob, bobbing in the water */}
      <Move loop="t-float"><Body x={100} y={134} r={34} face="happy" /></Move>
      {/* The water in front, hiding the blob below the surface */}
      <path className="fill-art-sky" d="M32 144A68 22 0 0 0 168 144Z" />
      {/* The ripple's front half, over the water */}
      <Move loop="t-ring" origin="100px 144px"><path className="stroke-art-cream" strokeWidth={3} fill="none" d="M50 144A50 12 0 0 0 150 144" /></Move>
      {/* The surface's shine */}
      <path className="stroke-art-cream opacity-70" strokeWidth={3} strokeLinecap="round" d="M50 158q8 4 18 4M132 162q10 0 18-4" />
      {/* Sparkles */}
      <Twinkle x={42} y={52} size={11} className="fill-art-sun" />
      {/* (another) */}
      <Twinkle x={150} y={96} size={7} delay={2} />
    </>
  ) },
  // Start and leave well: the blob waving beside an open door
  "start-and-leave": { fill: "fill-art-coral", tilt: -3, draw: (clip) => (
    <>
      {/* The floor, darker, kept inside the tile */}
      <path className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} d="M14 168H186V186H14z" />
      {/* The doorway, light coming through */}
      <rect className="fill-art-cream" x="120" y="46" width="48" height="122" rx="5" />
      {/* The open door, swung in on its hinge */}
      <path className="fill-art-plum" d="M120 46l-20 8v106l20 8z" />
      {/* Its handle */}
      <circle className="fill-art-sun" cx="106" cy="112" r="3.5" />
      {/* The waving arm, behind the body's side */}
      <Move loop="t-wave" origin="48px 132px"><ellipse className="fill-warm" cx="34" cy="120" rx="10" ry="17" transform="rotate(-55 34 120)" /></Move>
      {/* The blob, saying hello or goodbye */}
      <Move loop="t-float"><Body x={62} y={138} r={32} face="happy" /></Move>
      {/* A sparkle */}
      <Twinkle x={44} y={50} size={11} className="fill-art-sun" />
    </>
  ) },
  // The run: the blob and its friend passing a ball back and forth
  "whole-conversation": { fill: "fill-art-bloom", tilt: 5, draw: (clip) => (
    <>
      {/* The ground, darker, kept inside the tile */}
      <path className="fill-on-warm opacity-10" clipPath={`url(#${clip})`} d="M14 164Q100 150 186 164V186H14z" />
      {/* The ball's path, arcing between them */}
      <path className="stroke-art-cream opacity-70" strokeWidth={3} strokeLinecap="round" strokeDasharray="3 9" fill="none" d="M58 100Q100 50 142 100" />
      {/* The blob's arm, reaching up */}
      <ellipse className="fill-warm" cx="88" cy="112" rx="9" ry="15" transform="rotate(35 88 112)" />
      {/* The friend's arm, reaching up */}
      <ellipse className="fill-accent" cx="114" cy="114" rx="8" ry="14" transform="rotate(-35 114 114)" />
      {/* The blob */}
      <Body x={62} y={140} r={32} face="happy" />
      {/* The friend */}
      <Body x={140} y={142} r={30} face="happy" accent />
      {/* The ball, passing from one to the other */}
      <Move loop="t-slide">
        {/* Its body */}
        <circle className="fill-art-sun" cx="100" cy="72" r="13" />
        {/* Its stripe */}
        <path className="stroke-art-coral" strokeWidth={4} strokeLinecap="round" fill="none" d="M88 68q12 8 24 0" />
      </Move>
      {/* Sparkles */}
      <Twinkle x={38} y={48} size={10} />
      {/* (another) */}
      <Twinkle x={166} y={56} size={8} delay={1.8} />
    </>
  ) },
} satisfies Record<string, TileDef>;
