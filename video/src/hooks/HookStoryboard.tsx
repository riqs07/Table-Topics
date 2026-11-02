// A storyboard for the "quiet in meetings" social ad: four ways to open it (hooks A to D), three stills each across its first three seconds, and a sheet with them side by side to choose from. Drafts for choosing a hook, not a finished video

// Load React's types
import type { ReactNode } from "react";
// Load Remotion's frame
import { AbsoluteFill } from "remotion";
// Load the tile blob's shaded body
import { Body } from "@/components/scenes/CourseTile";
// Load the talking blob and its moods
import { TalkingBlob, type Mood } from "../TalkingBlob";
// Load the faces
import { BODY, DISPLAY } from "../kit";
// Load the theme as CSS, and its colour helpers
import { THEME_CSS, role, tint } from "../theme";

// The art grounds a still can sit on
type Ground = "art-sky" | "art-sun" | "art-bloom" | "art-leaf" | "art-plum" | "art-coral";

// The background: one art colour with two soft circles, as in every video
function Backdrop({ ground }: { ground: Ground }) {
  // The colour and the circles
  return (
    <AbsoluteFill style={{ background: role(ground), overflow: "hidden" }}>
      {/* A lighter circle, upper right */}
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", right: -380, top: -260, background: role("art-cream"), opacity: 0.12 }} />
      {/* A darker circle, lower left */}
      <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", left: -340, bottom: -200, background: role("on-warm"), opacity: 0.07 }} />
    </AbsoluteFill>
  );
}

// The warm blob (you), centred at x, y with a radius in pixels, in a mood, its mouth open or shut
function You({ x, y, r, mood, open = 0 }: { x: number; y: number; r: number; mood: Mood; open?: number }) {
  // The talking blob's square is three radii across
  const size = r * 3;
  // Placed by its middle
  return <g transform={`translate(${x - size / 2} ${y - size / 2})`}><TalkingBlob size={size} open={open} mood={mood} blink={false} /></g>;
}

// The other person's faces: talking, pleased or listening
type OtherMood = "talk" | "happy" | "ready";

// The other person (the accent blob), centred at x, y with a radius in pixels
function Other({ x, y, r, mood }: { x: number; y: number; r: number; mood: OtherMood }) {
  // Drawn in the blob's own units around its middle
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 100})`}>
      {/* The shaded accent body with its face */}
      <Body x={0} y={0} r={100} accent>
        {/* Pleased: happy arches and a wide smile */}
        {mood === "happy" && <><path className="stroke-current" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M-46 -16l12-13 12 13M22 -16l12-13 12 13" /><path className="fill-current" d="M-22 14h44q0 22-22 22t-22-22z" /></>}
        {/* Talking or listening: open eyes */}
        {mood !== "happy" && <><ellipse className="fill-current" cx="-34" cy="-22" rx="10" ry="15" /><ellipse className="fill-current" cx="34" cy="-22" rx="10" ry="15" /></>}
        {/* Talking: an open mouth */}
        {mood === "talk" && <ellipse className="fill-current" cx="0" cy="26" rx="14" ry="16" />}
        {/* Listening: a small smile */}
        {mood === "ready" && <path className="stroke-current" strokeWidth="6" strokeLinecap="round" fill="none" d="M-16 18q16 14 32 0" />}
      </Body>
    </g>
  );
}

// A lightbulb (the idea) at x, y, lit or gone out, at a size (1 is 60 pixels across the glass)
function Bulb({ x, y, s = 1, lit }: { x: number; y: number; s?: number; lit: boolean }) {
  // Drawn around the glass's middle
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* Rays around it, when lit */}
      {lit && [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => <line key={angle} className="stroke-art-cream" strokeWidth="10" strokeLinecap="round" x1="0" y1="-92" x2="0" y2="-118" transform={`rotate(${angle})`} />)}
      {/* The glass: sunny when lit, a dull grey when out */}
      <path className={lit ? "fill-art-sun" : "fill-on-warm opacity-30"} d="M0 -64a64 64 0 0 1 38 116v18h-76v-18a64 64 0 0 1 38-116z" />
      {/* A highlight on the glass, when lit */}
      {lit && <ellipse className="fill-art-cream opacity-75" cx="-24" cy="-28" rx="12" ry="20" transform="rotate(30 -24 -28)" />}
      {/* The screw base */}
      <rect className="fill-on-warm opacity-60" x="-34" y="72" width="68" height="16" rx="8" />
      {/* (its second ring) */}
      <rect className="fill-on-warm opacity-60" x="-28" y="92" width="56" height="16" rx="8" />
      {/* A wisp of smoke, when it has gone out */}
      {!lit && <path className="stroke-art-cream opacity-60" strokeWidth="9" strokeLinecap="round" fill="none" d="M10 -84q-22 -20 0 -40t0 -40" />}
    </g>
  );
}

// A cream speech bubble in the drawing, its tail pointing down at tailX, holding whatever is given
function Talk({ x, y, w, h, tailX, children }: { x: number; y: number; w: number; h: number; tailX: number; children?: ReactNode }) {
  // The box, the tail and the content
  return (
    <g>
      {/* A soft shadow under it */}
      <rect x={x} y={y + 12} width={w} height={h} rx={h * 0.32} fill={tint("on-warm", 8)} />
      {/* The box */}
      <rect className="fill-art-cream" x={x} y={y} width={w} height={h} rx={h * 0.32} />
      {/* The tail */}
      <path className="fill-art-cream" d={`M${tailX - 22} ${y + h - 4}l22 40 22-40z`} />
      {/* The content */}
      {children}
    </g>
  );
}

// Three dots of speech, centred at x, y
function Dots({ x, y }: { x: number; y: number }) {
  // Three round dots
  return <g className="fill-warm-shade">{[-44, 0, 44].map((dx) => <circle key={dx} cx={x + dx} cy={y} r="15" />)}</g>;
}

// The meeting table: a cream top with a darker front edge, across the frame at y
function Table({ y }: { y: number }) {
  // The top and its edge
  return (
    <g>
      {/* The front edge */}
      <rect className="fill-on-warm opacity-15" x="70" y={y + 26} width="940" height="56" rx="28" />
      {/* The top */}
      <rect className="fill-art-cream" x="70" y={y} width="940" height="56" rx="28" />
    </g>
  );
}

// A clock face at x, y with a radius, its minute hand at a minute
function Clock({ x, y, r, minute }: { x: number; y: number; r: number; minute: number }) {
  // The hands' angles: the minute hand round the hour, the hour hand just past ten
  const [minuteAngle, hourAngle] = [minute * 6, 300 + minute * 0.5];
  // The face, ticks and hands
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* A soft shadow */}
      <circle cy="12" r={r} fill={tint("on-warm", 8)} />
      {/* The face */}
      <circle className="fill-art-cream" r={r} />
      {/* Twelve ticks */}
      {Array.from({ length: 12 }, (_, i) => <line key={i} className="stroke-on-warm opacity-45" strokeWidth="8" strokeLinecap="round" x1="0" y1={-r * 0.8} x2="0" y2={-r * 0.68} transform={`rotate(${i * 30})`} />)}
      {/* The hour hand */}
      <line className="stroke-on-warm" strokeWidth="14" strokeLinecap="round" x1="0" y1="0" x2="0" y2={-r * 0.42} transform={`rotate(${hourAngle})`} />
      {/* The minute hand */}
      <line className="stroke-accent" strokeWidth="10" strokeLinecap="round" x1="0" y1="0" x2="0" y2={-r * 0.64} transform={`rotate(${minuteAngle})`} />
      {/* The pin */}
      <circle className="fill-on-warm" r="12" />
    </g>
  );
}

// A cream label in the drawing, centred at x, y, in the body face
function Tag({ x, y, text, size = 46 }: { x: number; y: number; text: string; size?: number }) {
  // Wide enough for its letters
  const w = text.length * size * 0.56 + size * 1.4;
  // The pill and its words
  return (
    <g>
      {/* The pill */}
      <rect className="fill-art-cream" x={x - w / 2} y={y - size * 0.95} width={w} height={size * 1.9} rx={size * 0.95} />
      {/* The words */}
      <text className="fill-on-warm" x={x} y={y + size * 0.35} fontFamily={BODY} fontWeight="700" fontSize={size} textAnchor="middle">{text}</text>
    </g>
  );
}

// The on-screen line (the hook's words, for viewers with the sound off): a cream box near the bottom, the key words in the accent
function Caption({ words, hi }: { words: string; hi: string[] }) {
  // The box, clear of the apps' buttons
  return (
    <div style={{ position: "absolute", left: 90, right: 150, top: 1330, display: "flex", justifyContent: "center" }}>
      {/* The box */}
      <div style={{ padding: "26px 44px", borderRadius: 44, background: role("art-cream"), color: role("on-warm"), fontFamily: DISPLAY, fontWeight: 650, fontSize: 74, lineHeight: 1.14, textAlign: "center", letterSpacing: -1 }}>
        {/* Each word, the key ones in the accent */}
        {words.split(" ").map((word, position, all) => <span key={position} style={{ color: hi.includes(word) ? role("accent") : undefined }}>{word}{position < all.length - 1 ? " " : ""}</span>)}
      </div>
    </div>
  );
}

// A small source line above the caption, for a still that cites a study
function Source({ text }: { text: string }) {
  // Small, cream, at the left
  return <div style={{ position: "absolute", left: 96, top: 1250, fontFamily: BODY, fontWeight: 700, fontSize: 34, color: role("art-cream"), opacity: 0.9 }}>{text}</div>;
}

// One still: the backdrop, a drawing over the whole frame, and the caption
function Still({ ground, caption, hi, source, children }: { ground: Ground; caption: string; hi: string[]; source?: string; children: ReactNode }) {
  // The layers
  return (
    <AbsoluteFill>
      {/* The theme's colours */}
      <style>{THEME_CSS}</style>
      {/* The ground */}
      <Backdrop ground={ground} />
      {/* The drawing */}
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>{children}</svg>
      {/* The source, if any */}
      {source && <Source text={source} />}
      {/* The words */}
      <Caption words={caption} hi={hi} />
    </AbsoluteFill>
  );
}

// Hook A, 0 s: you at the table with the idea lit above you
function A1() {
  // Sky, the bulb lit over you, the other person beside you listening
  return (
    <Still ground="art-sky" caption="You had the idea." hi={["idea."]}>
      {/* The idea over your head */}
      <Bulb x={360} y={560} s={1.3} lit />
      {/* You, looking up at it */}
      <You x={360} y={990} r={150} mood="up" />
      {/* The other person */}
      <Other x={780} y={1030} r={115} mood="ready" />
      {/* The table in front of you both */}
      <Table y={1110} />
    </Still>
  );
}

// Hook A, 1.5 s: the other person says it
function A2() {
  // Bloom, the other person talking with your idea in their bubble, you surprised
  return (
    <Still ground="art-bloom" caption="Then someone else said it." hi={["someone", "else"]}>
      {/* Their bubble, with your idea in it */}
      <Talk x={600} y={560} w={330} h={240} tailX={760}><Bulb x={765} y={670} s={0.7} lit /></Talk>
      {/* Your bulb, still lit, but smaller */}
      <Bulb x={330} y={620} s={0.9} lit />
      {/* You, surprised */}
      <You x={330} y={990} r={150} mood="wow" open={0.35} />
      {/* The other person, talking */}
      <Other x={780} y={1010} r={125} mood="talk" />
      {/* The table */}
      <Table y={1110} />
    </Still>
  );
}

// Hook A, 3 s: your bulb goes out, and they get the credit
function A3() {
  // Plum, your bulb out, the other person pleased with a "Great idea!" over them
  return (
    <Still ground="art-plum" caption="Then someone else said it." hi={["someone", "else"]}>
      {/* The praise they get */}
      <Tag x={780} y={700} text="Great idea!" size={50} />
      {/* Your bulb, gone out */}
      <Bulb x={330} y={620} s={0.9} lit={false} />
      {/* You, deflated */}
      <You x={330} y={1010} r={140} mood="worried" />
      {/* The other person, pleased */}
      <Other x={780} y={1000} r={135} mood="happy" />
      {/* The table */}
      <Table y={1110} />
    </Still>
  );
}

// Hook B, 0 s: two people talking across the table, you quiet between them
function B1() {
  // Leaf, two talkers with bubbles, you small and worried behind the table
  return (
    <Still ground="art-leaf" caption="Quiet in meetings?" hi={["Quiet"]}>
      {/* The left talker's bubble */}
      <Talk x={90} y={560} w={260} h={170} tailX={230}><Dots x={220} y={645} /></Talk>
      {/* The right talker's bubble */}
      <Talk x={730} y={520} w={260} h={170} tailX={850}><Dots x={860} y={605} /></Talk>
      {/* The left talker */}
      <Other x={230} y={1000} r={120} mood="talk" />
      {/* The right talker */}
      <Other x={850} y={990} r={130} mood="talk" />
      {/* You, smaller, in the middle */}
      <You x={540} y={1030} r={100} mood="worried" />
      {/* The table */}
      <Table y={1110} />
    </Still>
  );
}

// Hook B, 1.5 s: you watch the clock, waiting
function B2() {
  // Sky, a big clock, you looking up at it with an empty bubble
  return (
    <Still ground="art-sky" caption="Stop waiting" hi={["waiting"]}>
      {/* The clock */}
      <Clock x={700} y={560} r={190} minute={38} />
      {/* Your empty bubble */}
      <Talk x={110} y={600} w={260} h={170} tailX={300}><Dots x={240} y={685} /></Talk>
      {/* You, looking up at the clock */}
      <You x={360} y={1000} r={150} mood="up" />
      {/* The table */}
      <Table y={1110} />
    </Still>
  );
}

// Hook B, 3 s: "the right moment", struck out, and you speaking
function B3() {
  // Coral, a card reading "the right moment" crossed out, you talking
  return (
    <Still ground="art-coral" caption="for the right moment." hi={["right", "moment."]}>
      {/* The card */}
      <g transform="rotate(-4 540 560)">
        {/* Its shadow */}
        <rect x="170" y="472" width="740" height="190" rx="40" fill={tint("on-warm", 8)} />
        {/* The card itself */}
        <rect className="fill-art-cream" x="170" y="460" width="740" height="190" rx="40" />
        {/* Its words */}
        <text className="fill-on-warm" x="540" y="584" fontFamily={DISPLAY} fontWeight="700" fontSize="84" textAnchor="middle">the right moment</text>
        {/* The line through them */}
        <line className="stroke-accent" strokeWidth="16" strokeLinecap="round" x1="200" y1="560" x2="880" y2="550" />
      </g>
      {/* You, speaking up */}
      <You x={540} y={1000} r={150} mood="ready" open={0.6} />
      {/* The table */}
      <Table y={1110} />
    </Still>
  );
}

// Hook C, 0 s: whoever speaks first and most, a stack of bubbles beside them
function C1() {
  // Bloom, the other person with three bubbles stacked, you quiet
  return (
    <Still ground="art-bloom" caption="Whoever speaks first in a group…" hi={["first"]}>
      {/* Three bubbles, stacked over the talker */}
      <Talk x={620} y={330} w={240} h={140} tailX={760}><Dots x={740} y={400} /></Talk>
      {/* (the second) */}
      <Talk x={700} y={500} w={240} h={140} tailX={800}><Dots x={820} y={570} /></Talk>
      {/* (the third) */}
      <Talk x={600} y={670} w={240} h={140} tailX={760}><Dots x={720} y={740} /></Talk>
      {/* The talker */}
      <Other x={770} y={1010} r={130} mood="talk" />
      {/* You, quiet */}
      <You x={320} y={1010} r={135} mood="ready" />
      {/* The table */}
      <Table y={1110} />
    </Still>
  );
}

// Hook C, 1.5 s: the talker gets the "most competent" badge
function C2() {
  // Sun, a badge landing on the talker, you surprised, the study named
  return (
    <Still ground="art-sun" caption="…gets rated the most competent." hi={["most", "competent."]} source="Anderson & Kilduff, 2009">
      {/* The badge */}
      <Tag x={770} y={720} text="Most competent ✓" size={48} />
      {/* The talker, pleased */}
      <Other x={770} y={1010} r={135} mood="happy" />
      {/* You, surprised */}
      <You x={300} y={1010} r={135} mood="wow" open={0.35} />
      {/* The table */}
      <Table y={1110} />
    </Still>
  );
}

// Hook C, 3 s: the two ideas were just as good
function C3() {
  // Sky, your bulb and theirs the same size with "=" between, you puzzled
  return (
    <Still ground="art-sky" caption="Even when their answers were no better." hi={["no", "better."]} source="Anderson & Kilduff, 2009">
      {/* Your idea */}
      <Bulb x={320} y={620} s={1.1} lit />
      {/* The equals sign */}
      <g className="fill-art-cream"><rect x="500" y="590" width="80" height="18" rx="9" /><rect x="500" y="630" width="80" height="18" rx="9" /></g>
      {/* Their idea */}
      <Bulb x={760} y={620} s={1.1} lit />
      {/* You, puzzled */}
      <You x={320} y={1010} r={135} mood="worried" />
      {/* Them */}
      <Other x={760} y={1010} r={135} mood="ready" />
      {/* The table */}
      <Table y={1110} />
    </Still>
  );
}

// Hook D, 0 s: two bulbs, one each, just as bright
function D1() {
  // Plum, both of you with a lit bulb, side by side
  return (
    <Still ground="art-plum" caption="It's not your idea that's losing." hi={["idea"]}>
      {/* Your idea */}
      <Bulb x={320} y={600} s={1.2} lit />
      {/* Their idea */}
      <Bulb x={760} y={600} s={1.2} lit />
      {/* You */}
      <You x={320} y={1010} r={140} mood="ready" />
      {/* Them */}
      <Other x={760} y={1010} r={135} mood="ready" />
      {/* The table */}
      <Table y={1110} />
    </Still>
  );
}

// Hook D, 1.5 s: the clock, and they went first
function D2() {
  // Coral, a clock between you, a "1st" over them and your bulb waiting
  return (
    <Still ground="art-coral" caption="It's your timing." hi={["timing."]}>
      {/* The clock */}
      <Clock x={540} y={470} r={150} minute={20} />
      {/* "1st" over them */}
      <Tag x={790} y={720} text="1st" size={56} />
      {/* Your bulb, waiting and dimmer */}
      <Bulb x={300} y={720} s={0.8} lit={false} />
      {/* You, worried */}
      <You x={300} y={1010} r={135} mood="worried" />
      {/* Them, talking */}
      <Other x={790} y={1010} r={135} mood="talk" />
      {/* The table */}
      <Table y={1110} />
    </Still>
  );
}

// Hook D, 3 s: the turn to the research
function D3() {
  // Leaf, you speaking with your bulb lit in your bubble, the clock early
  return (
    <Still ground="art-leaf" caption="Here's what the research says." hi={["research"]}>
      {/* The clock, early in the meeting */}
      <Clock x={820} y={470} r={120} minute={3} />
      {/* Your bubble with your idea in it */}
      <Talk x={170} y={520} w={330} h={240} tailX={330}><Bulb x={335} y={630} s={0.7} lit /></Talk>
      {/* You, speaking */}
      <You x={340} y={1000} r={150} mood="happy" open={0.5} />
      {/* Them, listening */}
      <Other x={790} y={1020} r={120} mood="ready" />
      {/* The table */}
      <Table y={1110} />
    </Still>
  );
}

// The four hooks: their letter, their spoken line, a note, and their three stills in order
export const HOOKS = [
  // A: a moment they have lived
  { id: "a", line: "“You had the idea. Then someone else said it.”", note: "A moment they've lived", stills: [A1, A2, A3] },
  // B: name the audience
  { id: "b", line: "“Quiet in meetings? Stop waiting for the right moment.”", note: "Names the audience", stills: [B1, B2, B3] },
  // C: open on the study
  { id: "c", line: "“Whoever speaks first in a group gets rated the most competent. Even when their answers were no better.”", note: "Leads with the study", stills: [C1, C2, C3] },
  // D: open on the turn
  { id: "d", line: "“It's not your idea that's losing. It's your timing.”", note: "Leads with the reframe", stills: [D1, D2, D3] },
] as const;

// The time each still stands for
const TIMES = ["0 s", "1.5 s", "3 s"];
// How small each still is on the sheet
const SCALE = 0.25;
// The sheet's size
export const [SHEET_WIDTH, SHEET_HEIGHT] = [1500, 2420];

// The sheet: each hook in a row, its line and note on the left, its three stills to the right
export function HookSheet() {
  // Paper, a title and the rows
  return (
    <AbsoluteFill style={{ background: role("paper"), fontFamily: BODY, color: role("ink") }}>
      {/* The theme's colours */}
      <style>{THEME_CSS}</style>
      {/* The title */}
      <div style={{ position: "absolute", left: 60, top: 44, fontFamily: DISPLAY, fontWeight: 700, fontSize: 56 }}>Quiet in meetings: four hooks, first 3 seconds</div>
      {/* Each hook's row */}
      {HOOKS.map((hook, row) => (
        <div key={hook.id} style={{ position: "absolute", left: 60, top: 150 + row * 565, display: "flex", gap: 30 }}>
          {/* The hook's letter, line and note */}
          <div style={{ width: 400, paddingTop: 10 }}>
            {/* The letter */}
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 72, color: role("accent") }}>{hook.id.toUpperCase()}</div>
            {/* The note */}
            <div style={{ fontWeight: 700, fontSize: 30, marginTop: 6 }}>{hook.note}</div>
            {/* The line */}
            <div style={{ fontSize: 30, lineHeight: 1.35, marginTop: 14, color: role("ink-muted") }}>{hook.line}</div>
          </div>
          {/* Its three stills */}
          {hook.stills.map((Frame, column) => (
            <div key={column}>
              {/* The still, shrunk */}
              <div style={{ width: 1080 * SCALE, height: 1920 * SCALE, overflow: "hidden", borderRadius: 18, position: "relative" }}>
                {/* Drawn full size, then scaled down */}
                <div style={{ width: 1080, height: 1920, transform: `scale(${SCALE})`, transformOrigin: "top left", position: "absolute" }}><Frame /></div>
              </div>
              {/* Its time */}
              <div style={{ fontSize: 26, color: role("ink-muted"), marginTop: 8, textAlign: "center" }}>{TIMES[column]}</div>
            </div>
          ))}
        </div>
      ))}
    </AbsoluteFill>
  );
}
