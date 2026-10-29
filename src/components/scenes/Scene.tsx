// The blob scenes (decision 135): the voice shape's blob doing each kind of practice, drawn in theme colours so they follow every theme and dark mode. Each has its own small loop (in globals.css, only when motion is welcome); "loop" keeps it going, "few" plays it three times and settles, "still" leaves only the blinks. Decorative: the words beside a scene carry the meaning

// Load React's type for inline styles
import type { CSSProperties, ReactNode } from "react";

// The scenes there are, one per kind of practice that has one
export type SceneName = "rapid-fire" | "prepared-speech" | "read-aloud" | "four-three-two" | "free-talk" | "short-speech" | "your-talk" | "story" | "tell-again" | "guided-stories" | "moment" | "conversation" | "warm-up";

// How much a scene moves: all the time, a few rounds then rest, or only blinking
export type SceneMotion = "loop" | "few" | "still";

// The blob's outline, 100 across, centred on 0 (a slightly uneven round, like the voice shape)
const BLOB = "M0 -100C58.8 -100 106 -53.2 106 0C106 50.4 61.6 94 0 94C-58.8 94 -103 53.2 -103 0C-103 -56 -56 -100 0 -100Z";

// The blob's faces, each drawn 48 by 34 and placed on the outline
type FaceName = "ready" | "wow" | "sing" | "happy" | "down" | "up" | "puff" | "side" | "side-left";

// One face's features, in the current colour
function Face({ face }: { face: FaceName }) {
  // How far the open-eyed faces look to the side: right, left or ahead
  const shift = face === "side" ? 5 : face === "side-left" ? -4 : 0;
  // Placed on the outline's upper middle
  return (
    <g transform="translate(-47.5 -55.6) scale(1.979)" strokeWidth={4}>
      {/* Open eyes that blink, and a small smile, looking ahead, right or left */}
      {(face === "ready" || face === "side" || face === "side-left") && (
        <>
          {/* The left eye */}
          <ellipse className="s-blink fill-current" cx={12 + shift} cy="10" rx="5" ry="7.5" />
          {/* The right eye */}
          <ellipse className="s-blink fill-current" cx={36 + shift} cy="10" rx="5" ry="7.5" />
          {/* The smile */}
          <path className="stroke-current" d={`M${16 + shift} 26q8 7 16 0`} />
        </>
      )}
      {/* Surprised: round eyes and a round mouth */}
      {face === "wow" && (
        <>
          {/* The eyes */}
          <circle className="fill-current" cx="12" cy="9" r="6" />
          {/* (the other) */}
          <circle className="fill-current" cx="36" cy="9" r="6" />
          {/* The mouth */}
          <ellipse className="fill-current" cx="24" cy="28" rx="4.5" ry="5.5" />
        </>
      )}
      {/* Singing or celebrating: arched eyes, and an open mouth or a wide smile */}
      {(face === "sing" || face === "happy") && (
        <>
          {/* The eyes */}
          <path className="stroke-current" d="M5 13l7-7 7 7M29 13l7-7 7 7" />
          {/* The mouth */}
          {face === "sing" ? <ellipse className="fill-current" cx="24" cy="27" rx="7" ry="7" /> : <path className="fill-current" d="M12 22h24q0 12-12 12t-12-12z" />}
        </>
      )}
      {/* Looking down, reading */}
      {face === "down" && (
        <>
          {/* The eyes */}
          <ellipse className="fill-current" cx="13" cy="15" rx="5" ry="5.5" />
          {/* (the other) */}
          <ellipse className="fill-current" cx="35" cy="15" rx="5" ry="5.5" />
          {/* The mouth */}
          <path className="stroke-current" d="M18 28q6 4 12 0" />
        </>
      )}
      {/* Looking up, wondering */}
      {face === "up" && (
        <>
          {/* The eyes */}
          <circle className="fill-current" cx="14" cy="6" r="5" />
          {/* (the other) */}
          <circle className="fill-current" cx="38" cy="6" r="5" />
          {/* The mouth */}
          <path className="stroke-current" d="M18 27h12" />
        </>
      )}
      {/* Puffing: eyes shut, a little round mouth and pink cheeks */}
      {face === "puff" && (
        <>
          {/* The shut eyes */}
          <path className="stroke-current" d="M6 10q6 5 12 0M30 10q6 5 12 0" />
          {/* The mouth */}
          <circle className="fill-current" cx="24" cy="27" r="4" />
          {/* The cheeks */}
          <ellipse className="fill-warm-ink opacity-30" cx="4" cy="24" rx="5" ry="3.5" />
          {/* (the other) */}
          <ellipse className="fill-warm-ink opacity-30" cx="44" cy="24" rx="5" ry="3.5" />
        </>
      )}
    </g>
  );
}

// The blob at a place and size, warm or (for a second blob) in the accent
function Blob({ x, y, r, face, accent = false }: { x: number; y: number; r: number; face: FaceName; accent?: boolean }) {
  // The outline, then the face in the colour that sits on it
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 100})`}>
      {/* The body */}
      <path className={accent ? "fill-accent" : "fill-warm"} d={BLOB} />
      {/* The face */}
      <g className={accent ? "text-accent-ink" : "text-on-warm"}>
        {/* Its features */}
        <Face face={face} />
      </g>
    </g>
  );
}

// A soft shadow on the ground under a blob
function Shadow({ x, y = 105, width }: { x: number; y?: number; width: number }) {
  // A flat, faint oval
  return <ellipse className="fill-ink opacity-10" cx={x} cy={y} rx={width} ry="3.5" />;
}

// A part that moves: its loop's class, and where it turns or grows from, with a delay if any
function Move({ loop, origin, delay, children }: { loop: string; origin?: string; delay?: number; children: ReactNode }) {
  // Where it pivots, and when it starts
  const style: CSSProperties = { transformOrigin: origin, animationDelay: delay ? `${delay}s` : undefined };
  // A group carrying the loop
  return <g className={`s-move ${loop}`} style={style}>{children}</g>;
}

// The ink lines' look, shared by the props
const LINE = "stroke-ink";

// Each scene's drawing, on a 120 by 120 square
const SCENES: Record<SceneName, () => ReactNode> = {
  // Rapid Fire: a lightning bolt strikes and the blob jumps in surprise
  "rapid-fire": () => (
    <>
      {/* The shadow */}
      <Shadow x={52} y={104} width={26} />
      {/* The blob, jumping */}
      <Move loop="s-jolt"><Blob x={52} y={74} r={28} face="wow" /></Move>
      {/* The bolt, flashing */}
      <Move loop="s-zap" origin="86px 40px"><path className={`${LINE} fill-accent`} d="M86 14 72 40h12l-8 24 22-32H86l8-18z" /></Move>
      {/* Its "zing" lines */}
      <Move loop="s-flick"><path className={LINE} d="M20 30l-7-5M16 44l-9 0M24 20l-3-8" /></Move>
    </>
  ),
  // A prepared speech: notes being written with a scribbling pencil
  "prepared-speech": () => (
    <>
      {/* The shadow */}
      <Shadow x={46} y={104} width={24} />
      {/* The blob, bobbing, looking at its notes */}
      <Move loop="s-bob"><Blob x={44} y={74} r={27} face="side" /></Move>
      {/* The notepad, tilted */}
      <g transform="rotate(8 89 62)">
        {/* The paper */}
        <rect className={`${LINE} fill-card`} x="72" y="40" width="34" height="44" rx="4" />
        {/* Its lines, writing themselves in turn */}
        <Move loop="s-write"><path className={LINE} d="M79 52h18" /></Move>
        {/* (the second) */}
        <Move loop="s-write" delay={0.5}><path className={LINE} d="M78 60h20" /></Move>
        {/* (the third) */}
        <Move loop="s-write" delay={1}><path className={LINE} d="M77 68h12" /></Move>
      </g>
      {/* The pencil, scribbling from its tip */}
      <Move loop="s-scribble" origin="82px 50px">
        {/* Its body */}
        <path className="stroke-accent" strokeWidth={5} d="M98 22 82 50" />
        {/* Its point */}
        <path className={LINE} d="M82 50l-2 5 4-3" />
      </Move>
    </>
  ),
  // Read aloud: eyes reading along while the pages turn
  "read-aloud": () => (
    <>
      {/* The shadow */}
      <Shadow x={60} y={106} width={30} />
      {/* The blob, its face moving along the lines */}
      <g transform="translate(60 64) scale(0.28)">
        {/* The body */}
        <path className="fill-warm" d={BLOB} />
        {/* The face, reading */}
        <g className="text-on-warm"><Move loop="s-read"><Face face="down" /></Move></g>
      </g>
      {/* The open book */}
      <path className={`${LINE} fill-card`} d="M24 84q18-10 36 0q18-10 36 0v18q-18-10-36 0q-18-10-36 0z" />
      {/* A line of text on the left page */}
      <path className="stroke-accent" strokeWidth={2.2} d="M32 89q10-4 20 0" />
      {/* The right page, turning over */}
      <Move loop="s-page" origin="60px 93px">
        {/* The page */}
        <path className={`${LINE} fill-card`} d="M60 84q18-10 36 0v18q-18-10-36 0z" />
        {/* Its line of text */}
        <path className="stroke-accent" strokeWidth={2.2} d="M68 89q10-4 20 0" />
      </Move>
      {/* The spine */}
      <path className={LINE} d="M60 84v18" />
    </>
  ),
  // 4/3/2: three blobs, smaller each time, hopping one after another
  "four-three-two": () => (
    <>
      {/* The shadows */}
      <Shadow x={30} y={106} width={18} />
      {/* (the second) */}
      <Shadow x={68} y={106} width={13} />
      {/* (the third) */}
      <Shadow x={98} y={106} width={9} />
      {/* The big blob */}
      <Move loop="s-hop"><Blob x={30} y={80} r={24} face="ready" /></Move>
      {/* The middle one */}
      <Move loop="s-hop" delay={0.18}><Blob x={68} y={88} r={17} face="ready" /></Move>
      {/* The small one */}
      <Move loop="s-hop" delay={0.36}><Blob x={98} y={94} r={11} face="ready" /></Move>
      {/* The numbers */}
      <g className="fill-accent" textAnchor="middle">
        {/* Four */}
        <text x="30" y="40" fontSize="16">4</text>
        {/* Three */}
        <text x="68" y="60" fontSize="14">3</text>
        {/* Two */}
        <text x="98" y="74" fontSize="12">2</text>
      </g>
    </>
  ),
  // Free talk: singing at the mic, swaying, notes floating up
  "free-talk": () => (
    <>
      {/* The shadow */}
      <Shadow x={44} y={106} width={24} />
      {/* The blob, swaying from its base */}
      <Move loop="s-sway" origin="42px 101px"><Blob x={42} y={74} r={27} face="sing" /></Move>
      {/* The mic stand */}
      <path className={LINE} d="M86 104V52M74 104h24" />
      {/* The mic */}
      <rect className={`${LINE} fill-accent`} x="77" y="30" width="18" height="26" rx="9" />
      {/* Its holder */}
      <path className={LINE} d="M74 46q0 12 12 12t12-12" />
      {/* A pair of notes, floating up */}
      <Move loop="s-note">
        {/* Their stems */}
        <path className={LINE} d="M16 26v-12l10-3v12" />
        {/* Their heads */}
        <ellipse className="fill-ink" cx="13" cy="26" rx="3.5" ry="2.6" />
        {/* (the other) */}
        <ellipse className="fill-ink" cx="23" cy="23" rx="3.5" ry="2.6" />
      </Move>
      {/* A single note, a moment later */}
      <Move loop="s-note" delay={1.2}>
        {/* Its stem */}
        <path className={LINE} d="M34 36v-10" />
        {/* Its head */}
        <ellipse className="fill-ink" cx="31" cy="36" rx="3.5" ry="2.6" />
      </Move>
    </>
  ),
  // A short speech: three points ticking onto a card
  "short-speech": () => (
    <>
      {/* The shadow */}
      <Shadow x={48} y={106} width={26} />
      {/* The blob, bobbing */}
      <Move loop="s-bob"><Blob x={48} y={72} r={28} face="ready" /></Move>
      {/* The card, tilted */}
      <g transform="rotate(-6 84 79)">
        {/* The card */}
        <rect className={`${LINE} fill-card`} x="64" y="58" width="40" height="42" rx="5" />
        {/* Each point: a dot that pops on, then its line */}
        {[68, 79, 90].map((y, index) => (
          <g key={y}>
            {/* The dot */}
            <circle className="s-move s-tick fill-accent" style={{ animationDelay: `${index * 0.4}s` }} cx="72" cy={y} r="2.8" />
            {/* The line */}
            <path className={LINE} d={`M78 ${y}h${[18, 14, 17][index]}`} />
          </g>
        ))}
      </g>
    </>
  ),
  // Your talk: at the lectern, sound coming from the mic
  "your-talk": () => (
    <>
      {/* The blob, bobbing behind the lectern */}
      <Move loop="s-bob"><Blob x={60} y={52} r={24} face="ready" /></Move>
      {/* The lectern */}
      <path className={`${LINE} fill-accent`} d="M34 72h52l-8 36H42z" />
      {/* Its top and the mic's arm */}
      <path className={LINE} d="M30 72h60M72 72 82 56" />
      {/* The mic */}
      <circle className="fill-ink" cx="84" cy="53" r="4.5" />
      {/* Sound waves, one after another */}
      <Move loop="s-wave"><path className={LINE} d="M92 46q5 6 0 12" /></Move>
      {/* (the bigger one) */}
      <Move loop="s-wave" delay={0.5}><path className={LINE} d="M98 42q8 10 0 20" /></Move>
    </>
  ),
  // A story: by a flickering campfire, sparks rising
  "story": () => (
    <>
      {/* The shadow */}
      <Shadow x={40} y={106} width={22} />
      {/* The blob, bobbing, delighted */}
      <Move loop="s-bob"><Blob x={38} y={78} r={25} face="happy" /></Move>
      {/* The logs */}
      <path className="stroke-warm-ink" strokeWidth={5} d="M70 104l24-10M70 94l24 10" />
      {/* The flame, flickering from its base */}
      <Move loop="s-flame" origin="82px 94px">
        {/* The outer flame */}
        <path className={`${LINE} fill-warm`} d="M82 92c-10-6-8-18 0-30 2 8 10 10 8 20 4-2 4-6 4-8 6 8 2 18-12 18z" />
        {/* Its bright middle */}
        <path className="fill-warm-tint" d="M82 90c-4-3-3-8 0-13 2 5 5 6 3 13z" />
      </Move>
      {/* Sparks drifting up, in turn */}
      {[[74, 56, 2], [92, 52, 1.6], [84, 46, 1.4]].map(([x, y, r], index) => <circle key={x} className="s-move s-spark fill-warm" style={{ animationDelay: `${index * 0.6}s` }} cx={x} cy={y} r={r} />)}
    </>
  ),
  // Telling one again: a loop arrow turning round the blob
  "tell-again": () => (
    <>
      {/* The shadow */}
      <Shadow x={60} y={106} width={24} />
      {/* The blob, bobbing */}
      <Move loop="s-bob"><Blob x={60} y={70} r={25} face="ready" /></Move>
      {/* The arrow, turning round its centre */}
      <Move loop="s-orbit" origin="60px 70px">
        {/* The top arc */}
        <path className="stroke-accent" strokeWidth={4} d="M24 52a38 38 0 0 1 68-14" />
        {/* Its head */}
        <path className="stroke-accent" strokeWidth={4} d="M92 26v13H79" />
        {/* The fainter bottom arc */}
        <path className="stroke-accent opacity-45" strokeWidth={4} d="M96 88a38 38 0 0 1-68 14" />
      </Move>
    </>
  ),
  // Guided stories: looking up at a signpost whose signs swing
  "guided-stories": () => (
    <>
      {/* The shadow */}
      <Shadow x={40} y={106} width={22} />
      {/* The blob, bobbing, looking up */}
      <Move loop="s-bob"><Blob x={38} y={80} r={24} face="up" /></Move>
      {/* The post */}
      <path className={LINE} d="M86 106V22" />
      {/* The signs, swinging from the top */}
      <Move loop="s-swing" origin="86px 30px">
        {/* The upper sign */}
        <path className={`${LINE} fill-accent`} d="M70 30h32l8 7-8 7H70z" />
        {/* The lower sign */}
        <path className={`${LINE} fill-card`} d="M102 52H72l-8 7 8 7h30z" />
      </Move>
    </>
  ),
  // A moment worth telling: the sun coming up behind the blob
  "moment": () => (
    <>
      {/* The sun and its rays, rising */}
      <Move loop="s-rise">
        {/* The sun */}
        <path className={`${LINE} fill-warm-tint`} d="M30 70a30 30 0 0 1 60 0" />
        {/* The rays */}
        <path className={LINE} d="M60 26v-10M30 44l-8-6M90 44l8-6M18 70H8M112 70h-10" />
      </Move>
      {/* The shadow */}
      <Shadow x={60} y={106} width={24} />
      {/* The blob, bobbing, delighted */}
      <Move loop="s-bob"><Blob x={60} y={82} r={24} face="happy" /></Move>
    </>
  ),
  // Talking with someone: two blobs taking turns, their speech bubbles popping
  "conversation": () => (
    <>
      {/* The shadows */}
      <Shadow x={34} y={106} width={20} />
      {/* (the other) */}
      <Shadow x={88} y={106} width={20} />
      {/* You, bobbing */}
      <Move loop="s-bob"><Blob x={34} y={80} r={22} face="side" /></Move>
      {/* Them, bobbing out of step */}
      <Move loop="s-bob" delay={1.3}><Blob x={88} y={80} r={22} face="side-left" accent /></Move>
      {/* Your bubble */}
      <Move loop="s-talk" origin="24px 50px">
        {/* The bubble */}
        <path className={`${LINE} fill-card`} d="M14 18h40a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H32l-8 8v-8h-10a6 6 0 0 1-6-6V24a6 6 0 0 1 6-6z" />
        {/* Its dots */}
        <path className="stroke-ink" strokeWidth={4} d="M24 30h0M34 30h0M44 30h0" />
      </Move>
      {/* Their bubble, half a turn later */}
      <Move loop="s-talk" origin="93px 61px" delay={2}><path className={`${LINE} fill-warm-tint`} d="M74 34h30a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6h-4v7l-7-7H74a6 6 0 0 1-6-6v-8a6 6 0 0 1 6-6z" /></Move>
    </>
  ),
  // The warm-up: cheeks puffing, gusts of air blowing out
  "warm-up": () => (
    <>
      {/* The shadow */}
      <Shadow x={42} y={106} width={24} />
      {/* The blob, puffing up from its base */}
      <Move loop="s-puff" origin="42px 100px"><Blob x={42} y={72} r={27} face="puff" /></Move>
      {/* The gusts, one after another */}
      {["M72 58q14-6 22 2t-4 14", "M74 76q10 0 16 6", "M74 44q8-4 14-2"].map((d, index) => <path key={d} className="s-move s-gust stroke-accent" strokeWidth={3.5} style={{ animationDelay: `${index * 0.4}s` }} d={d} />)}
    </>
  ),
};

// Draw a scene, sized by the class given
export function Scene({ name, motion = "loop", className = "" }: { name: SceneName; motion?: SceneMotion; className?: string }) {
  // The square drawing, hidden from screen readers, carrying how much it moves
  return (
    <svg aria-hidden="true" data-scene={name} data-motion={motion} viewBox="0 0 120 120" fill="none" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className={`vl-scene ${className}`}>
      {/* The scene's drawing */}
      {SCENES[name]()}
    </svg>
  );
}
