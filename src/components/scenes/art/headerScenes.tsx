// The course headers' scenes (the Illustration Study's "Stop freezing" and "Stories that land", and one for every other course in the same style): a wide place on 1200 by 480, lit from one source, in three layers of depth (far land lighter, middle, the blob up front), with the course's idea acted out. Every colour is a theme role or a tone of one (art/light.tsx). The focal point sits right of middle, so words laid over the left still read

// Load React's node type
import type { ReactNode } from "react";
// Load the blob and the sparkle
import { Body, Twinkle } from "@/components/scenes/tiles/parts";
// Load the moving-part wrapper
import { Move } from "@/components/scenes/Scene";
// Load the cast (the friend and Sage)
import { Cast } from "@/components/scenes/Cast";
// Load the light, the land and the shadows
import { Glow, Land, Shadow, Sky, Spark, Stop, Sun, role, tone } from "@/components/scenes/art/light";

// The scene's size
export const HEADER_WIDTH = 1200;
// (its height)
export const HEADER_HEIGHT = 480;

// One header: what it shows, for screen readers, and its drawing given the id its gradients share
export interface HeaderScene {
  // The description
  label: string;
  // The drawing
  draw: (id: string) => ReactNode;
}

// A fill in a colour
const paint = (color: string) => ({ fill: color });

// A stroke in a colour
const line = (color: string, width: number) => ({ fill: "none", stroke: color, strokeWidth: width, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

// A cast member placed in the scene: its centre and radius in the scene's units (the cast draws in its own square, 280 by 270 units round a 100-unit body)
function CastAt({ x, y, r, children }: { x: number; y: number; r: number; children: ReactNode }) {
  // How much to scale its square
  const scale = r / 100;
  // Moved so its body's centre lands on the place
  return (
    <g transform={`translate(${x - 140 * scale} ${y - 160 * scale}) scale(${scale})`}>
      {/* A box the size of its square, which the cast fills (give it className="size-full") */}
      <svg x="0" y="0" width="280" height="270" overflow="visible">
        {/* Its drawing */}
        {children}
      </svg>
    </g>
  );
}

// Stars scattered over a night sky, the same every time
function Stars({ count, height }: { count: number; height: number }) {
  // Each star
  return (
    <g className="fill-art-cream">
      {Array.from({ length: count }, (_, index) => (
        <circle key={index} cx={(index * 263) % HEADER_WIDTH} cy={(index * 97) % height} r={index % 5 ? 1.6 : 2.6} opacity={0.4 + (index % 4) * 0.15} />
      ))}
    </g>
  );
}

// Stop freezing: you stepping out of a melting block of ice in warm sunlight
function StopFreezing(id: string) {
  // The scene
  return (
    <>
      {/* The ice's and the grass's gradients */}
      <defs>
        {/* Ice: bright at the top left, blue at the lower right */}
        <linearGradient id={`${id}-ice`} x1="0" y1="0" x2="1" y2="1">
          {/* Pale at the top left */}
          <Stop at={0} color={tone("art-sky", 0.85)} />
          {/* Clear blue */}
          <Stop at={0.5} color={tone("art-sky", 0.62)} />
          {/* Deeper at the lower right */}
          <Stop at={1} color={tone("art-sky", 0.4)} />
        </linearGradient>
        {/* Grass: lit at the top, deeper below */}
        <linearGradient id={`${id}-grass`} x1="0" y1="0" x2="0" y2="1">
          {/* Lit */}
          <Stop at={0} color={role("art-leaf")} />
          {/* Deeper below */}
          <Stop at={1} color={tone("art-leaf", -0.25)} />
        </linearGradient>
      </defs>
      {/* A blue sky warming to gold at the horizon */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-sky", -0.1)} mid={tone("art-sky", 0.3)} bottom={tone("art-sun", 0.35)} />
      {/* Drawn on the study's 520-high page, its top cut off */}
      <g transform="translate(0 -40)">
        {/* The sun's glow over the whole sky */}
        <Glow id={id} x={936} y={114} r={560} />
        {/* Its rays fanning down */}
        <g className="fill-art-cream" opacity={0.22}>
          {/* Seven rays */}
          {[0, 1, 2, 3, 4, 5, 6].map((index) => <path key={index} d={`M936 114 L${600 + index * 90} 520 L${640 + index * 90} 520Z`} />)}
        </g>
        {/* The sun, glowing gently */}
        <Move loop="t-glow"><Sun id={id} x={936} y={114} r={58} /></Move>
        {/* Far hills, pale with distance */}
        <path style={paint(tone("art-sky", 0.45))} opacity={0.75} d="M0 330 C140 270 260 300 380 280 C520 256 600 300 760 292 C900 284 1040 250 1200 270 V520 H0Z" />
        {/* The middle meadow */}
        <path style={paint(tone("art-leaf", 0.35))} d="M0 380 C160 340 300 370 460 350 C640 328 780 372 940 360 C1060 352 1140 330 1200 336 V520 H0Z" />
        {/* The near grass */}
        <path fill={`url(#${id}-grass)`} d="M0 430 C200 398 420 420 620 410 C820 400 1000 428 1200 416 V520 H0Z" />
        {/* Tufts of grass at both sides */}
        <g style={paint(tone("art-leaf", -0.2))}>
          {[90, 210, 1040, 1130].map((x) => <path key={x} d={`M${x} 430 q-6 -40 4 -70 q10 30 4 70z M${x + 12} 432 q4 -30 22 -48 q-6 30 -16 50z`} />)}
        </g>
        {/* The ice block's shadow */}
        <Shadow x={500} y={452} rx={190} ry={22} opacity={0.16} />
        {/* The block of ice, melting */}
        <path fill={`url(#${id}-ice)`} opacity={0.92} d="M330 290 Q330 262 358 262 H640 Q668 262 668 290 V420 Q668 446 640 446 H360 Q330 446 330 420Z" />
        {/* Its lit top */}
        <path className="fill-art-cream" opacity={0.55} d="M330 300 Q420 330 500 300 T668 304 V292 Q668 262 640 262 H358 Q330 262 330 292Z" />
        {/* Its shine */}
        <path className="stroke-art-cream" strokeWidth={6} strokeLinecap="round" opacity={0.8} d="M352 286 L392 278 M610 300 L646 292 M360 410 L392 400" />
        {/* Drips falling from it */}
        <g style={paint(tone("art-sky", 0.55))}>
          {/* Each drip and its drop, falling out of step */}
          {([[380, 12], [452, 18], [560, 14], [622, 10]] as const).map(([x, h], index) => (
            <Move key={x} loop="t-patter" delay={index * 0.4}>
              {/* The drip on the edge */}
              <path d={`M${x - 8} 446 q8 ${h} 16 0z`} />
              {/* The drop below it */}
              <circle cx={x} cy={446 + h + 12} r={6} opacity={0.8} />
            </Move>
          ))}
        </g>
        {/* The puddle spreading */}
        <path style={line(tone("art-sky", 0.6), 10)} opacity={0.8} d="M300 468 q100 -16 200 -6 t220 -2" />
        {/* You, half out of the ice, surprised by the sun */}
        <g transform="rotate(8 590 318)"><Body x={590} y={318} r={100} face="wow" shadow={false} /></g>
        {/* The ice still round your lower half */}
        <path fill={`url(#${id}-ice)`} opacity={0.88} d="M470 352 Q520 336 560 352 Q610 370 668 350 V420 Q668 446 640 446 H470Z" />
        {/* Its cracks */}
        <path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.9} d="M500 380 l24 14 -10 20 M620 372 l-14 22 18 16" />
        {/* Chips of ice flying off */}
        <g className="fill-art-cream">
          {/* Each chip, drifting out of step */}
          {([[700, 240, 14, 20], [730, 300, 10, -30], [452, 250, 12, 40]] as const).map(([x, y, size, angle], index) => (
            <Move key={x} loop="t-drift" origin={`${x}px ${y}px`} delay={index * 0.9}><rect x={x} y={y} width={size} height={size} rx={3} transform={`rotate(${angle} ${x} ${y})`} /></Move>
          ))}
        </g>
        {/* Warmth rising */}
        <path className="stroke-art-cream" strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.9} d="M790 250 q30 -26 62 -10 M800 280 q36 -20 70 0" />
        {/* Sparkles */}
        <Spark x={820} y={210} size={18} opacity={0.9} />
        {/* (more) */}
        <Spark x={610} y={200} size={12} opacity={0.9} />
        {/* (another) */}
        <Spark x={1060} y={300} size={14} opacity={0.9} />
        {/* A twinkling one at the left */}
        <Twinkle x={260} y={180} size={12} />
      </g>
    </>
  );
}

// Stories that land: you telling a story round a campfire at night, the friend and Sage listening, little shapes of the story rising in the embers
function StoriesThatLand(id: string) {
  // The scene
  return (
    <>
      {/* The flame's gradient and the moon's cut-out */}
      <defs>
        {/* The flame: red at the root, gold, then pale at the tip */}
        <linearGradient id={`${id}-flame`} x1="0" y1="1" x2="0" y2="0">
          {/* Red at the root */}
          <Stop at={0} color={role("art-coral")} />
          {/* Gold */}
          <Stop at={0.6} color={role("art-sun")} />
          {/* Pale at the tip */}
          <Stop at={1} color={tone("art-sun", 0.6)} />
        </linearGradient>
        {/* The moon: a disc with a bite taken out */}
        <mask id={`${id}-moon`}>
          {/* The disc */}
          <circle cx="180" cy="90" r="40" fill="white" />
          {/* The bite */}
          <circle cx="196" cy="80" r="40" fill="black" />
        </mask>
      </defs>
      {/* A night sky, plum to a rosy horizon */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-plum", -0.72)} mid={tone("art-plum", -0.42)} bottom={tone("art-bloom", -0.38)} />
      {/* Drawn on the study's 520-high page, its top cut off */}
      <g transform="translate(0 -40)">
        {/* Stars */}
        <g transform="translate(0 40)"><Stars count={46} height={220} /></g>
        {/* A crescent moon */}
        <circle className="fill-art-cream" cx="180" cy="130" r="40" mask={`url(#${id}-moon)`} transform="translate(0 40)" opacity={0.95} />
        {/* Far hills */}
        <path style={paint(tone("art-plum", -0.6))} d="M0 340 C120 300 220 320 320 300 C420 280 520 310 640 298 C780 284 900 300 1020 280 C1100 268 1160 280 1200 276 V520 H0Z" />
        {/* Trees on them, darker */}
        <g style={paint(tone("art-plum", -0.68))}>
          {([[80, 330, 46], [150, 318, 60], [1030, 300, 58], [1110, 312, 44], [960, 318, 40]] as const).map(([x, y, r]) => <g key={x}><circle cx={x} cy={y - r} r={r} /><rect x={x - 5} y={y - 10} width="10" height="30" /></g>)}
        </g>
        {/* The near ground */}
        <path style={paint(tone("art-plum", -0.48))} d="M0 410 C200 390 400 400 600 396 C800 392 1000 404 1200 398 V520 H0Z" />
        {/* The fire's warm glow over everything, flickering */}
        <Move loop="t-glow"><Glow id={id} x={600} y={420} r={520} warm /></Move>
        {/* The fire */}
        <g transform="translate(600 420)">
          {/* Its logs */}
          <path style={line(tone("art-sun", -0.6), 18)} d="M-70 12 L60 -14 M-60 -12 L70 14" />
          {/* The flame, swaying from its root */}
          <Move loop="t-sway" origin="0px 8px">
            {/* Outer */}
            <path fill={`url(#${id}-flame)`} d="M0 -150 C30 -110 64 -76 54 -34 C46 0 20 8 0 8 C-24 8 -50 -2 -56 -32 C-62 -66 -30 -90 -20 -120 C-12 -98 -4 -92 0 -150Z" />
            {/* Inner */}
            <path style={paint(tone("art-sun", 0.6))} d="M2 -96 C20 -70 34 -50 26 -26 C20 -8 8 -4 0 -4 C-14 -4 -26 -12 -26 -30 C-26 -50 -8 -62 2 -96Z" />
          </Move>
        </g>
        {/* The story rising in the embers: a spark, a little house, a heart */}
        <g className="fill-art-sun" opacity={0.9}>
          {/* Sparks */}
          <Twinkle x={600} y={200} size={10} className="fill-art-sun" />
          {/* (a smaller one) */}
          <Spark x={640} y={150} size={7} className="fill-art-sun" />
          {/* A house */}
          <path className="stroke-art-sun" strokeWidth={4} fill="none" strokeLinejoin="round" opacity={0.8} d="M560 170 h16 v-12 l8 -8 8 8 v12 h16" />
          {/* A heart */}
          <path opacity={0.8} d="M672 112 c6 -10 18 -6 16 4 c-2 8 -16 16 -16 16 s-14 -8 -16 -16 c-2 -10 10 -14 16 -4z" />
          {/* Embers */}
          <circle cx="590" cy="110" r="4" />
          {/* (another) */}
          <circle cx="620" cy="84" r="3" />
        </g>
        {/* You, telling it */}
        <g transform="rotate(6 400 362)"><Body x={400} y={362} r={92} face="sing" /></g>
        {/* The friend's shadow */}
        <Shadow x={820} y={442} rx={74} ry={13} />
        {/* The friend, rapt */}
        <g transform="rotate(-6 820 360)"><CastAt x={820} y={360} r={84}><Cast who="friend" face="wow" still className="size-full" /></CastAt></g>
        {/* Sage's shadow */}
        <Shadow x={980} y={448} rx={60} ry={10} />
        {/* Sage, listening */}
        <CastAt x={980} y={392} r={60}><Cast who="sage" mood="listening" still className="size-full" /></CastAt>
      </g>
    </>
  );
}

// Explain it simply: you pulling a tangled knot of string out into one clean line
function ExplainItSimply(id: string) {
  // The scene
  return (
    <>
      {/* A clear sky, blue to a fresh green haze */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-sky", 0.15)} bottom={tone("art-leaf", 0.5)} />
      {/* The sun at the upper left */}
      <Sun id={id} x={190} y={90} r={44} />
      {/* Far hills */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={300} rise={50} seed={1} color={tone("art-sky", 0.5)} opacity={0.7} />
      {/* The meadow */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={360} rise={30} seed={2} color={tone("art-leaf", 0.2)} />
      {/* The near grass */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={428} rise={14} seed={4} color={tone("art-leaf", -0.15)} />
      {/* The knot, still tangled at the left */}
      <path className="stroke-art-sun" strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(230 40) scale(1.9)" d="M40 150 c40 -60 90 10 50 40 c-40 30 -70 -40 -10 -60 c60 -20 90 50 30 70 c-50 16 -60 -50 0 -50 c40 0 60 30 40 60 c-16 24 -50 10 -40 -14 c10 -22 50 -26 80 6" />
      {/* Pulled out straight, past you, to the right */}
      <path className="stroke-art-sun" strokeWidth={14} fill="none" strokeLinecap="round" d="M515 306 C600 330 680 300 760 300 L1090 300" />
      {/* Its arrowhead, nudging forward */}
      <Move loop="t-slide"><path className="stroke-art-coral" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" d="M1070 278 l26 22 -26 22" /></Move>
      {/* You, pleased, holding the line */}
      <g transform="rotate(-8 760 330)"><Body x={760} y={330} r={88} face="happy" /></g>
      {/* Sparkles */}
      <Twinkle x={980} y={230} size={16} />
      {/* (another) */}
      <Spark x={900} y={380} size={10} />
    </>
  );
}

// Ready by the day: a path winding up a hill to a flag at sunrise, a calendar page on a post beside it, and you at the start, ready
function ReadyByTheDay(id: string) {
  // The scene
  return (
    <>
      {/* A sunrise sky */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-sky", 0.1)} mid={tone("art-bloom", 0.45)} bottom={tone("art-sun", 0.4)} />
      {/* The sun rising behind the hill */}
      <Move loop="t-glow"><Sun id={id} x={960} y={190} r={56} /></Move>
      {/* Far hills */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={290} rise={40} seed={3} color={tone("art-plum", 0.45)} opacity={0.8} />
      {/* The big hill with the goal on top */}
      <path style={paint(tone("art-leaf", 0.15))} d="M300 480 C520 330 760 236 920 240 C1040 244 1140 300 1200 330 V480Z" />
      {/* The path winding up it */}
      <path className="stroke-art-cream" strokeWidth={18} fill="none" strokeLinecap="round" opacity={0.85} d="M560 480 C640 420 820 430 760 370 C700 316 860 300 912 250" />
      {/* The near ground */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={440} rise={12} seed={5} color={tone("art-leaf", -0.12)} />
      {/* The flag at the top: its pole */}
      <path className="stroke-art-cream" strokeWidth={6} strokeLinecap="round" d="M916 252V170" />
      {/* Its cloth, rippling from the pole */}
      <Move loop="t-flag" origin="918px 176px"><path className="fill-art-coral" d="M918 172h54l-12 18 12 18h-54z" /></Move>
      {/* The calendar page on its post */}
      <path style={line(tone("art-sun", -0.5), 8)} d="M420 420V270" />
      {/* The page */}
      <rect className="fill-art-cream" x="352" y="176" width="136" height="120" rx="14" />
      {/* Its top band */}
      <rect className="fill-art-coral" x="352" y="176" width="136" height="32" rx="14" />
      {/* Its rings */}
      <path className="stroke-art-cream" strokeWidth={6} strokeLinecap="round" d="M390 168v18M450 168v18" />
      {/* The date, circled */}
      <text className="fill-art-plum" x="420" y="270" fontSize="54" textAnchor="middle">14</text>
      {/* (the circle round it) */}
      <ellipse className="stroke-art-coral" strokeWidth={5} fill="none" cx="420" cy="252" rx="44" ry="32" transform="rotate(-8 420 252)" />
      {/* You at the bottom of the path, ready */}
      <Body x={600} y={380} r={74} face="ready" />
      {/* Sparkles */}
      <Twinkle x={1080} y={110} size={14} />
      {/* (another) */}
      <Spark x={760} y={150} size={10} />
    </>
  );
}

// Beyond "good, you?": you and the friend at a café table; the friend mentions a bike ride, and your attention follows that one detail
function BeyondGoodYou(id: string) {
  // The scene
  return (
    <>
      {/* A warm wall, lit from the lamp */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-sun", 0.55)} bottom={tone("art-coral", 0.4)} />
      {/* The window: the sky outside */}
      <rect style={paint(tone("art-sky", 0.55))} x="110" y="60" width="300" height="210" rx="18" />
      {/* A cloud going by */}
      <ellipse className="fill-art-cream" cx="200" cy="130" rx="46" ry="16" opacity={0.9} />
      {/* Its bars */}
      <path className="stroke-art-cream" strokeWidth={10} d="M260 60v210M110 165h300" />
      {/* Its frame */}
      <rect style={line(tone("art-sun", -0.45), 10)} x="110" y="60" width="300" height="210" rx="18" />
      {/* The lamp's warm glow, gently brightening */}
      <Move loop="t-glow"><Glow id={id} x={620} y={90} r={380} warm /></Move>
      {/* The lamp: its cord and shade */}
      <path style={line(tone("art-sun", -0.6), 4)} d="M620 0v50" />
      {/* (the shade) */}
      <path style={paint(tone("art-coral", -0.1))} d="M576 92q44 -50 88 0z" />
      {/* The floor */}
      <rect style={paint(tone("art-sun", -0.4))} x="0" y="380" width="1200" height="100" />
      {/* The table's top */}
      <rect style={paint(tone("art-sun", -0.55))} x="300" y="372" width="620" height="24" rx="12" />
      {/* The cup */}
      <rect className="fill-art-cream" x="596" y="336" width="40" height="36" rx="8" />
      {/* Its handle */}
      <path className="stroke-art-cream" strokeWidth={6} fill="none" d="M636 346q16 0 16 12t-16 12" />
      {/* Steam rising */}
      <Move loop="t-air"><path className="stroke-art-cream" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.8} d="M606 326q6 -12 0 -24M624 326q6 -12 0 -24" /></Move>
      {/* You, looking at the detail */}
      <g transform="rotate(6 440 300)"><Body x={440} y={300} r={82} face="side" shadow={false} /></g>
      {/* The friend, telling it */}
      <CastAt x={800} y={296} r={80}><Cast who="friend" face="happy" still className="size-full" /></CastAt>
      {/* The friend's bubble, with the bike in it */}
      <g transform="translate(760 60)">
        {/* The bubble */}
        <rect className="fill-art-cream" width="230" height="130" rx="32" />
        {/* Its tail */}
        <path className="fill-art-cream" d="M60 128l-10 30 36 -30z" />
        {/* The bike */}
        <g className="stroke-art-sky" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" transform="translate(64 34)">
          {/* Its back wheel */}
          <circle cx="16" cy="44" r="22" />
          {/* Its front wheel */}
          <circle cx="96" cy="44" r="22" />
          {/* Its frame and saddle */}
          <path d="M16 44 L42 8 H76 L96 44 M42 8 L58 44 H16 M36 0 h16" />
        </g>
      </g>
      {/* Your attention following that one detail */}
      <path className="stroke-art-coral" strokeWidth={6} strokeDasharray="2 14" strokeLinecap="round" fill="none" d="M500 220 C580 160 680 140 790 120" />
      {/* The detail, sparkling */}
      <Twinkle x={800} y={110} size={14} className="fill-art-coral" />
    </>
  );
}

// A voice they lean in for: you on a stage in a spotlight, your voice ringing out
function VoiceLeanIn(id: string) {
  // The scene
  return (
    <>
      {/* The beam's gradient */}
      <defs>
        {/* Bright at the lamp, fading to the floor */}
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
          {/* Bright at the lamp */}
          <Stop at={0} color={role("art-cream")} opacity={0.7} />
          {/* Faint at the floor */}
          <Stop at={1} color={role("art-cream")} opacity={0.08} />
        </linearGradient>
      </defs>
      {/* A dark theatre */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-plum", -0.55)} bottom={tone("art-plum", -0.15)} />
      {/* The spotlight's beam */}
      <path fill={`url(#${id}-beam)`} d="M720 0 L780 0 L900 410 L520 410Z" />
      {/* The stage floor */}
      <rect style={paint(tone("art-plum", -0.45))} x="0" y="400" width="1200" height="80" />
      {/* Its front edge, catching the light */}
      <rect style={paint(tone("art-plum", 0.15))} x="0" y="400" width="1200" height="10" />
      {/* The pool of light on the floor */}
      <ellipse className="fill-art-cream" cx="710" cy="412" rx="190" ry="20" opacity={0.45} />
      {/* The curtains, left and right */}
      <path className="fill-art-coral" d="M0 0H170C150 140 190 300 120 410H0Z" />
      {/* (the right) */}
      <path className="fill-art-coral" d="M1200 0H1030C1050 140 1010 300 1080 410H1200Z" />
      {/* Their folds */}
      <path style={line(tone("art-coral", -0.3), 8)} d="M60 0C70 140 50 280 40 410M1140 0C1130 140 1150 280 1160 410" />
      {/* Their valance */}
      <path style={paint(tone("art-coral", -0.2))} d="M0 0H1200V44Q1100 70 1000 44T800 44T600 44T400 44T200 44T0 44Z" />
      {/* The sound ringing out, wave after wave */}
      {/* Each wave, out of step */}
      {[0, 1, 2].map((index) => (
        <Move key={index} loop="t-ring" origin="710px 300px" delay={index * 0.8}>
          <path className="stroke-art-cream" strokeWidth={8} fill="none" strokeLinecap="round" d={`M${820 + index * 40} ${240 - index * 20}q${40 + index * 14} ${60 + index * 20} 0 ${120 + index * 40}`} />
        </Move>
      ))}
      {/* You, singing out in the light */}
      <Body x={710} y={322} r={88} face="sing" />
      {/* Sparkles in the beam */}
      <Twinkle x={640} y={150} size={14} />
      {/* (another) */}
      <Spark x={790} y={90} size={10} />
    </>
  );
}

// Interview ready: you, briefcase at your side, walking up to a door with warm light spilling out
function InterviewReady(id: string) {
  // The scene
  return (
    <>
      {/* A calm blue hallway */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-sky", 0.55)} bottom={tone("art-sky", 0.25)} />
      {/* The light from the window, top left */}
      <Glow id={id} x={160} y={60} r={420} />
      {/* A picture on the wall */}
      <rect className="fill-art-cream" x="200" y="110" width="150" height="110" rx="10" />
      {/* (its hills) */}
      <path style={paint(tone("art-leaf", 0.1))} d="M210 210 l40 -40 30 24 30 -34 30 50z" />
      {/* The floor */}
      <rect style={paint(tone("art-sky", -0.3))} x="0" y="390" width="1200" height="90" />
      {/* The door's frame */}
      <rect style={paint(tone("art-sky", -0.35))} x="770" y="96" width="232" height="300" rx="10" />
      {/* The warm room beyond, glowing */}
      <rect style={paint(tone("art-sun", 0.45))} x="786" y="110" width="200" height="286" rx="6" />
      {/* Its glow, brightening gently */}
      <Move loop="t-glow"><Glow id={id} x={886} y={250} r={260} warm /></Move>
      {/* The light spilling onto the floor */}
      <path className="fill-art-cream" opacity={0.35} d="M786 396 H986 L1060 480 H700Z" />
      {/* The door, open */}
      <path className="fill-art-plum" d="M786 110 L716 88 V412 L786 396Z" />
      {/* Its handle */}
      <circle className="fill-art-sun" cx="732" cy="252" r="7" />
      {/* Your briefcase, at your side */}
      <rect className="fill-art-coral" x="532" y="340" width="76" height="56" rx="10" />
      {/* (its handle) */}
      <path style={line(tone("art-coral", -0.3), 6)} d="M552 340v-12h36v12" />
      {/* You, ready to go in */}
      <Body x={470} y={320} r={84} face="ready" />
      {/* A sparkle at the door */}
      <Twinkle x={1040} y={150} size={14} />
    </>
  );
}

// Toasts and tributes: you raising a glass at an evening party under a string of lights
function ToastsAndTributes(id: string) {
  // Where the bulbs hang along the string
  const bulbs = Array.from({ length: 14 }, (_, index) => {
    // Across the width
    const x = 40 + index * 86;
    // Sagging in the middle
    const y = 70 + 80 * Math.sin((x / HEADER_WIDTH) * Math.PI);
    // The bulb
    return { x, y };
  });
  // The scene
  return (
    <>
      {/* A dusk sky */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-plum", -0.55)} mid={tone("art-bloom", -0.1)} bottom={tone("art-sun", 0.2)} />
      {/* Far hills */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={330} rise={40} seed={2} color={tone("art-plum", -0.3)} opacity={0.8} />
      {/* The lawn */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={410} rise={16} seed={6} color={tone("art-leaf", -0.35)} />
      {/* The string the lights hang on */}
      <path style={line(tone("art-plum", -0.6), 3)} d={`M0 66 ${bulbs.map(({ x, y }) => `L${x} ${y}`).join(" ")} L1200 66`} />
      {/* The bulbs, each with its glow, flickering out of step */}
      {/* Each bulb */}
      {bulbs.map(({ x, y }, index) => (
        <Move key={x} loop="t-glow" delay={(index % 4) * 0.5}>
          {/* The glow */}
          <Glow id={id} x={x} y={y + 12} r={46} warm />
          {/* The bulb */}
          <circle className="fill-art-sun" cx={x} cy={y + 12} r={9} />
        </Move>
      ))}
      {/* Your arm, raised behind you, holding the glass */}
      <ellipse className="fill-warm" cx="698" cy="250" rx="22" ry="40" transform="rotate(30 698 250)" />
      {/* The glass: its bowl */}
      <path className="fill-art-cream" d="M694 150h52l-6 52a20 20 0 0 1-40 0z" />
      {/* (what is in it) */}
      <path className="fill-art-sun" d="M700 168h40l-4 34a16 16 0 0 1-32 0z" />
      {/* (its stem) */}
      <path className="stroke-art-cream" strokeWidth={6} strokeLinecap="round" d="M720 222v24M708 248h24" />
      {/* The sparkle of the toast, popping */}
      <Move loop="t-pop" origin="760px 140px"><Spark x={770} y={134} size={18} className="fill-art-sun" /></Move>
      {/* You, delighted */}
      <Body x={610} y={330} r={92} face="happy" />
      {/* Confetti */}
      {/* Each piece */}
      {([[300, 210, "fill-art-coral", 20], [420, 160, "fill-art-sky", -30], [880, 220, "fill-art-leaf", 40], [980, 300, "fill-art-sun", -10], [200, 300, "fill-art-bloom", 60]] as const).map(([x, y, fill, angle]) => (
        <rect key={x} className={fill} x={x} y={y} width="16" height="9" rx="2" transform={`rotate(${angle} ${x} ${y})`} />
      ))}
    </>
  );
}

// Listen like you mean it: the friend talking on a park bench at dusk, their words travelling to you as you lean in
function ListenLikeYouMeanIt(id: string) {
  // The scene
  return (
    <>
      {/* A soft dusk sky */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-sky", 0.05)} bottom={tone("art-bloom", 0.45)} />
      {/* The low sun */}
      <Sun id={id} x={1040} y={250} r={46} />
      {/* Far trees */}
      <g style={paint(tone("art-plum", -0.1))} opacity={0.55}>
        {([[90, 280, 50], [170, 270, 64], [880, 290, 44]] as const).map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} />)}
      </g>
      {/* The far meadow */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={320} rise={30} seed={3} color={tone("art-leaf", 0.3)} />
      {/* The near grass */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={420} rise={12} seed={1} color={tone("art-leaf", -0.15)} />
      {/* The bench's shadow */}
      <Shadow x={640} y={430} rx={280} ry={16} />
      {/* The bench: its back */}
      <rect style={paint(tone("art-sun", -0.45))} x="380" y="290" width="520" height="18" rx="9" />
      {/* Its seat */}
      <rect style={paint(tone("art-sun", -0.35))} x="370" y="366" width="540" height="20" rx="10" />
      {/* Its legs */}
      <path style={line(tone("art-sun", -0.55), 10)} d="M410 386v40M870 386v40" />
      {/* The friend, talking */}
      <CastAt x={500} y={300} r={70}><Cast who="friend" face="sing" still className="size-full" /></CastAt>
      {/* Their words travelling across, one arc after another */}
      {/* Each arc, out of step */}
      {[0, 1, 2].map((index) => (
        <Move key={index} loop="t-ring" origin="640px 260px" delay={index * 0.7}>
          <path className="stroke-art-cream" strokeWidth={7} fill="none" strokeLinecap="round" d={`M${600 + index * 36} 220q24 40 0 80`} />
        </Move>
      ))}
      {/* You, leaning in */}
      <g transform="rotate(-10 780 300)"><Body x={780} y={300} r={74} face="side-left" shadow={false} /></g>
      {/* A sparkle */}
      <Twinkle x={300} y={120} size={14} />
    </>
  );
}

// Tell it again, better: you polishing a story like a gem on a pedestal, a loop arrow round it for "again"
function TellItAgain(id: string) {
  // The scene
  return (
    <>
      {/* A deep blue evening */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-sky", -0.4)} bottom={tone("art-plum", 0.15)} />
      {/* Far hills */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={340} rise={34} seed={4} color={tone("art-plum", -0.25)} opacity={0.8} />
      {/* The near ground */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={420} rise={12} seed={2} color={tone("art-plum", -0.5)} />
      {/* The gem's light over the scene */}
      <Move loop="t-glow"><Glow id={id} x={760} y={220} r={300} /></Move>
      {/* The pedestal's shadow */}
      <Shadow x={760} y={432} rx={110} ry={14} />
      {/* The pedestal */}
      <path className="fill-art-cream" d="M690 300h140l-14 130h-112z" />
      {/* (its shaded side) */}
      <path style={paint(tone("art-cream", -0.2))} d="M790 300h40l-14 130h-36z" />
      {/* (its top) */}
      <rect className="fill-art-cream" x="676" y="290" width="168" height="18" rx="9" />
      {/* The gem, swelling gently */}
      <Move loop="t-pulse" origin="760px 230px">
        {/* Its crown */}
        <path className="fill-art-sky" d="M700 210l26 -34h68l26 34z" />
        {/* (its lit facet) */}
        <path style={paint(tone("art-sky", 0.55))} d="M726 176h34l-14 34h-46z" />
        {/* Its point */}
        <path style={paint(tone("art-sky", -0.2))} d="M700 210h120l-60 76z" />
        {/* (its lit facet) */}
        <path style={paint(tone("art-sky", 0.3))} d="M700 210h46l14 76z" />
      </Move>
      {/* The loop arrow round it: again */}
      <path className="stroke-art-sun" strokeWidth={10} fill="none" strokeLinecap="round" d="M640 170a130 110 0 1 1 30 140" />
      {/* (its head) */}
      <path className="fill-art-sun" d="M650 296l30 22 -36 10z" />
      {/* You, pleased with it */}
      <Body x={560} y={350} r={80} face="happy" />
      {/* The polishing cloth */}
      <ellipse className="fill-art-coral" cx="664" cy="296" rx="30" ry="18" transform="rotate(-20 664 296)" />
      {/* The gem's sparkles */}
      <Twinkle x={860} y={160} size={16} />
      {/* (another) */}
      <Spark x={690} y={140} size={10} />
    </>
  );
}

// Know your voice: you with a magnifying glass, looking at a landscape whose mountains are the bars of your voice
function KnowYourVoice(id: string) {
  // The bars' heights, left to right
  const bars = [90, 150, 120, 200, 160, 110, 180, 130, 80];
  // The scene
  return (
    <>
      {/* A clear sky */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-sky", -0.05)} bottom={tone("art-sky", 0.55)} />
      {/* The sun */}
      <Sun id={id} x={200} y={96} r={44} />
      {/* The far mountains, shaped like your voice's bars */}
      <g style={paint(tone("art-plum", 0.35))}>
        {bars.map((height, index) => <rect key={index} x={560 + index * 66} y={340 - height} width="50" height={height + 60} rx="25" />)}
      </g>
      {/* The meadow */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={350} rise={26} seed={5} color={tone("art-leaf", 0.25)} />
      {/* The near grass */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={430} rise={12} seed={3} color={tone("art-leaf", -0.12)} />
      {/* You, wondering */}
      <Body x={380} y={340} r={84} face="wonder" />
      {/* The magnifying glass, held up and tilting a little */}
      <Move loop="t-wobble" origin="520px 330px">
        {/* Its handle */}
        <path style={line(tone("art-sun", -0.5), 16)} d="M500 330 L560 270" />
        {/* The lens, a little brighter */}
        <circle className="fill-art-cream" cx="610" cy="220" r="66" opacity={0.3} />
        {/* What it shows: one bar, big */}
        <rect style={paint(tone("art-plum", 0.1))} x="592" y="176" width="36" height="96" rx="18" />
        {/* Its rim */}
        <circle className="stroke-art-cream" strokeWidth={14} fill="none" cx="610" cy="220" r="66" />
      </Move>
      {/* Sparkles */}
      <Twinkle x={1000} y={120} size={14} />
      {/* (another) */}
      <Spark x={720} y={110} size={10} />
    </>
  );
}

// The tough question: a storm cloud jabbing a spiky question your way, and you calm under an umbrella as the sun breaks through
function TheToughQuestion(id: string) {
  // The scene
  return (
    <>
      {/* A stormy sky clearing to blue */}
      <Sky id={id} width={HEADER_WIDTH} height={HEADER_HEIGHT} top={tone("art-plum", -0.35)} bottom={tone("art-sky", 0.35)} />
      {/* The sun breaking through at the right */}
      <Sun id={id} x={1060} y={110} r={48} />
      {/* Far hills */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={330} rise={40} seed={2} color={tone("art-sky", 0.4)} opacity={0.75} />
      {/* The near grass */}
      <Land width={HEADER_WIDTH} height={HEADER_HEIGHT} y={420} rise={14} seed={4} color={tone("art-leaf", -0.1)} />
      {/* The rain, falling */}
      <Move loop="t-patter">
        {/* The streaks */}
        <path style={line(tone("art-sky", 0.45), 5)} opacity={0.8} d="M220 200l-12 30M280 210l-12 30M340 200l-12 30M250 260l-12 30M310 270l-12 30M380 250l-12 30" />
      </Move>
      {/* The storm cloud */}
      <g style={paint(tone("art-plum", -0.15))}>
        {([[240, 140, 56], [310, 120, 70], [390, 146, 52], [180, 160, 40]] as const).map(([x, y, r]) => <circle key={x} cx={x} cy={y} r={r} />)}
      </g>
      {/* The spiky question, jabbing in */}
      <Move loop="t-wobble" origin="560px 160px">
        {/* Its spiky bubble */}
        <path className="fill-art-cream" d="M560 90l16 30 34 -10 -6 34 32 14 -30 18 12 32 -34 -6 -12 32 -20 -28 -30 16 4 -34 -32 -12 28 -20 -10 -32 34 6z" />
        {/* Its mark */}
        <text className="fill-art-coral" x="566" y="186" fontSize="64" textAnchor="middle">?</text>
      </Move>
      {/* The umbrella's handle */}
      <path style={line(tone("art-sun", -0.55), 8)} d="M790 200V330q0 20 -18 20" />
      {/* Its canopy */}
      <path className="fill-art-sun" d="M650 210Q790 60 930 210z" />
      {/* (a stripe) */}
      <path className="fill-art-coral" d="M760 210Q790 80 820 210z" />
      {/* You, calm under it */}
      <Body x={790} y={350} r={80} face="ready" />
      {/* A sparkle where the sun breaks through */}
      <Twinkle x={980} y={200} size={14} />
    </>
  );
}

// Each course's header, by course id
export const HEADER_SCENES: Readonly<Record<string, HeaderScene>> = {
  // Stop freezing
  "stop-freezing": { label: "Your blob stepping out of a melting block of ice in warm sunlight", draw: StopFreezing },
  // Stories that land
  "stories-that-land": { label: "You telling a story round a campfire at night while the friend and Sage listen", draw: StoriesThatLand },
  // Explain it simply
  "explain-it-simply": { label: "Your blob pulling a tangled knot of string out into one straight line", draw: ExplainItSimply },
  // Ready by the day
  "ready-by-the-day": { label: "A path winding up a hill to a flag at sunrise, a calendar page with the date circled, and your blob ready at the start", draw: ReadyByTheDay },
  // Beyond "good, you?"
  "beyond-good-you": { label: "You and the friend at a café table, your attention following the bike ride they mention", draw: BeyondGoodYou },
  // A voice they lean in for
  "voice-lean-in": { label: "Your blob singing out in a spotlight on a stage, sound ringing out", draw: VoiceLeanIn },
  // Interview ready
  "interview-ready": { label: "Your blob with a briefcase, walking up to an open door with warm light spilling out", draw: InterviewReady },
  // Toasts and tributes
  "toasts-and-tributes": { label: "Your blob raising a glass at an evening party under a string of lights", draw: ToastsAndTributes },
  // Listen like you mean it
  "listen-like-you-mean-it": { label: "The friend talking on a park bench at dusk while your blob leans in to listen", draw: ListenLikeYouMeanIt },
  // Tell it again, better
  "tell-it-again": { label: "Your blob polishing a gem on a pedestal, a loop arrow round it", draw: TellItAgain },
  // Know your voice
  "know-your-voice": { label: "Your blob with a magnifying glass, looking at mountains shaped like the bars of your voice", draw: KnowYourVoice },
  // The tough question
  "the-tough-question": { label: "A storm cloud jabbing a spiky question mark, and your blob calm under an umbrella as the sun breaks through", draw: TheToughQuestion },
};
