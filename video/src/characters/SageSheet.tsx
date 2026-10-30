// The panels of Sage's character sheet (draft for approval), each rendered as a still: hero, turnaround, expressions, mouth shapes, poses, signature options, grounds and size

// Load Remotion's frame
import { AbsoluteFill } from "remotion";
// Load the body face's name
import { BODY } from "../kit";
// Load Sage, the warm blob and their colours
import { COLOURS, Sage, WarmBlob, type Expression, type Signature, type Turn, type Viseme } from "./Sage";

// The paper behind every panel, and the ink for labels
const [PAPER, INK, MUTED] = ["#fbf6ee", "#1e2320", "#6b6f6a"];
// The art grounds, in the default theme's daytime colours
const GROUNDS = [["sky", "#4a68e0"], ["sun", "#f4b73b"], ["bloom", "#e86aae"], ["leaf", "#7cc46a"], ["plum", "#8a63e0"], ["coral", "#ec6a55"]] as const;

// A label under a drawing: a name and, if given, a short note
function Label({ x, y, name, note }: { x: number; y: number; name: string; note?: string }) {
  // Centred under the point
  return (
    <g fontFamily={BODY} textAnchor="middle">
      {/* The name */}
      <text x={x} y={y} fontSize="30" fontWeight="700" fill={INK}>{name}</text>
      {/* The note */}
      {note && <text x={x} y={y + 34} fontSize="23" fill={MUTED}>{note}</text>}
    </g>
  );
}

// A panel: paper, then a drawing area the size of the still
function Panel({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  // Paper with the drawing over it
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>{children}</svg>
    </AbsoluteFill>
  );
}

// A soft ground line under characters
function Ground({ y, from, to }: { y: number; from: number; to: number }) {
  // A rounded bar
  return <rect x={from} y={y} width={to - from} height="10" rx="5" fill="#e8dccb" />;
}

// A four-pointed sparkle
function Sparkle({ x, y, size, fill }: { x: number; y: number; size: number; fill: string }) {
  // The star around its point
  return <path fill={fill} d={`M${x} ${y - size}l${size * 0.24} ${size * 0.76} ${size * 0.76} ${size * 0.24}-${size * 0.76} ${size * 0.24}-${size * 0.24} ${size * 0.76}-${size * 0.24}-${size * 0.76}-${size * 0.76}-${size * 0.24} ${size * 0.76}-${size * 0.24}z`} />;
}

// The hero: Sage and the warm blob together, Sage encouraging, the blob mid-sentence
export function SheetHero() {
  // 1600 by 900
  return (
    <Panel width={1600} height={900}>
      {/* A big soft circle behind them */}
      <circle cx="800" cy="470" r="380" fill="#efe3d0" />
      {/* The ground */}
      <Ground y={712} from={300} to={1300} />
      {/* The warm blob, a little smaller, on the left */}
      <WarmBlob x={560} y={600} r={118} />
      {/* A speech bubble from the blob */}
      <g>
        {/* The bubble */}
        <rect x="360" y="250" width="260" height="110" rx="40" fill={COLOURS.cream} stroke="#e1d3bf" strokeWidth="4" />
        {/* Its tail */}
        <path d="M510 356l14 34 18-36z" fill={COLOURS.cream} />
        {/* Three dots of speech */}
        <g fill={COLOURS.warmShade}><circle cx="440" cy="305" r="12" /><circle cx="490" cy="305" r="12" /><circle cx="540" cy="305" r="12" /></g>
      </g>
      {/* Sage on the right, turned toward the blob, encouraging */}
      <Sage x={1040} y={596} r={132} turn="three-left" expression="encouraging" arms={[70, 6]} />
      {/* Sparkles */}
      <Sparkle x={1250} y={300} size={26} fill="#f4b73b" />
      {/* (a smaller one) */}
      <Sparkle x={330} y={480} size={16} fill="#f4b73b" />
      {/* Names */}
      <Label x={560} y={800} name="The blob" note="the learner: eager, a little nervous" />
      {/* (Sage's) */}
      <Label x={1040} y={800} name="Sage" note="the coach: calm, warm, unhurried" />
    </Panel>
  );
}

// The turnaround: front, three-quarters each way, profile and back
export function SheetTurnaround() {
  // The views, in order
  const views: [Turn, string][] = [["three-left", "¾ left"], ["front", "Front"], ["three-right", "¾ right"], ["side", "Side"], ["back", "Back"]];
  // 2000 by 620
  return (
    <Panel width={2000} height={620}>
      {/* The ground */}
      <Ground y={452} from={80} to={1920} />
      {/* Each view */}
      {views.map(([turn, name], i) => (
        <g key={turn}>
          {/* Sage */}
          <Sage x={240 + i * 380} y={340} r={112} turn={turn} />
          {/* Its label */}
          <Label x={240 + i * 380} y={540} name={name} />
        </g>
      ))}
    </Panel>
  );
}

// The expressions, five by two
export function SheetExpressions() {
  // Each expression with its name and when it is used
  const faces: [Expression, string, string][] = [
    ["calm", "Calm", "the default"],
    ["listening", "Listening", "eyes shut, taking it in"],
    ["encouraging", "Encouraging", "“go on, you’ve got this”"],
    ["proud", "Proud", "after a good try"],
    ["curious", "Curious", "“tell me more”"],
    ["breathe", "Take a breath", "before you start"],
    ["chuckle", "Chuckle", "a good story"],
    ["thinking", "Thinking", "choosing a note"],
    ["concern", "Gentle concern", "never cross"],
    ["surprised", "Pleased surprise", "a big jump in a score"],
  ];
  // 2000 by 1040
  return (
    <Panel width={2000} height={1040}>
      {/* Each face */}
      {faces.map(([expression, name, note], i) => {
        // Its column and row
        const [col, row] = [i % 5, Math.floor(i / 5)];
        // Sage with that face, and its label
        return (
          <g key={expression}>
            {/* Sage, a little puffed up when breathing in */}
            <Sage x={200 + col * 400} y={250 + row * 500} r={110} expression={expression} breath={expression === "breathe" ? 1.07 : 1} arms={expression === "breathe" ? [40, 40] : [6, 6]} />
            {/* The label */}
            <Label x={200 + col * 400} y={400 + row * 500} name={name} note={note} />
          </g>
        );
      })}
    </Panel>
  );
}

// The mouth shapes for speech, close up
export function SheetMouths() {
  // Each shape with the sounds it stands for
  const shapes: [Viseme, string][] = [["rest", "rest"], ["A", "A · I"], ["E", "E"], ["O", "O"], ["U", "U · W · Q"], ["MBP", "M · B · P"], ["FV", "F · V"], ["L", "L · Th · D"]];
  // 2000 by 560
  return (
    <Panel width={2000} height={560}>
      {/* Each shape */}
      {shapes.map(([viseme, name], i) => (
        <g key={viseme}>
          {/* Sage close up, the mouth doing the talking */}
          <Sage x={140 + i * 246} y={290} r={90} mouth={viseme} signature="none" arms={[0, 0]} />
          {/* The label */}
          <Label x={140 + i * 246} y={460} name={name} />
        </g>
      ))}
    </Panel>
  );
}

// Poses: the arms and lean carry the body language
export function SheetPoses() {
  // Each pose: name, note, arms (left and right lift), lean, expression, turn and breath
  const poses: [string, string, [number, number], number, Expression, Turn, number][] = [
    ["Idle", "settled, breathing slowly", [6, 6], 0, "calm", "front", 1],
    ["Wave", "hello and goodbye", [10, 128], 0, "encouraging", "front", 1],
    ["Explain", "one arm opens out", [10, 72], -3, "calm", "three-left", 1],
    ["Lean in", "listening closely", [10, 10], -8, "listening", "three-left", 1],
    ["Deep breath", "swells, arms out", [40, 40], 0, "breathe", "front", 1.07],
    ["Cheer", "your best score yet", [108, 108], 0, "proud", "front", 1],
  ];
  // 2000 by 680
  return (
    <Panel width={2000} height={680}>
      {/* The ground */}
      <Ground y={472} from={60} to={1940} />
      {/* Each pose */}
      {poses.map(([name, note, arms, tilt, expression, turn, breath], i) => (
        <g key={name}>
          {/* Sage in the pose */}
          <Sage x={180 + i * 328} y={362} r={104} arms={arms} tilt={tilt} expression={expression} turn={turn} breath={breath} />
          {/* The label */}
          <Label x={180 + i * 328} y={556} name={name} note={note} />
        </g>
      ))}
    </Panel>
  );
}

// The signature on its head: three options, large and at 64 px, beside the warm blob at 64 px
export function SheetSignature() {
  // The options
  const options: [Signature, string, string][] = [["sprout", "A · Sprout", "recommended: growth, and a silhouette of its own"], ["glasses", "B · Round glasses", "reads “teacher”, but busy at small sizes"], ["none", "C · Nothing", "only colour and brows tell them apart"]];
  // 1800 by 820
  return (
    <Panel width={1800} height={820}>
      {/* Each option */}
      {options.map(([signature, name, note], i) => (
        <g key={signature}>
          {/* Large */}
          <Sage x={300 + i * 600} y={320} r={130} signature={signature} />
          {/* At 64 px across, beside the warm blob at the same size */}
          <WarmBlob x={250 + i * 600} y={600} r={30} />
          {/* (Sage small) */}
          <Sage x={340 + i * 600} y={600} r={30} signature={signature} />
          {/* The label */}
          <Label x={300 + i * 600} y={700} name={name} note={note} />
        </g>
      ))}
    </Panel>
  );
}

// Sage on every art ground, as a course tile would place it, and on the dark-mode card
export function SheetGrounds() {
  // 2000 by 520
  return (
    <Panel width={2000} height={520}>
      {/* Each ground as a tilted tile */}
      {GROUNDS.map(([name, fill], i) => (
        <g key={name}>
          {/* The tile, leaning alternately */}
          <rect x={60 + i * 270} y="80" width="230" height="230" rx="44" fill={fill} transform={`rotate(${i % 2 ? 4 : -4} ${175 + i * 270} 195)`} />
          {/* Sage on it */}
          <Sage x={175 + i * 270} y={222} r={64} expression={i % 2 ? "encouraging" : "calm"} />
          {/* The ground's name */}
          <Label x={175 + i * 270} y={400} name={name} />
        </g>
      ))}
      {/* The dark-mode card */}
      <rect x="1690" y="80" width="230" height="230" rx="44" fill="#232622" />
      {/* Sage on it */}
      <Sage x={1805} y={222} r={64} dark />
      {/* Its name */}
      <Label x={1805} y={400} name="dark mode" note="lighter pine" />
    </Panel>
  );
}

// Size: Sage beside the warm blob on one ground, with height marks
export function SheetSize() {
  // 1400 by 760
  return (
    <Panel width={1400} height={760}>
      {/* Height guide lines */}
      <g stroke="#dccfbd" strokeWidth="3" strokeDasharray="12 10">
        {/* Both tops: the same height without the sprout */}
        <path d="M200 357H1200" />
      </g>
      {/* The ground */}
      <Ground y={580} from={200} to={1200} />
      {/* Feet: flat ovals, only when standing on something */}
      <g fill={COLOURS.warmShade}><ellipse cx="460" cy="580" rx="40" ry="13" /><ellipse cx="560" cy="580" rx="40" ry="13" /></g>
      {/* (Sage's) */}
      <g fill={COLOURS.shade}><ellipse cx="820" cy="580" rx="44" ry="14" /><ellipse cx="940" cy="580" rx="44" ry="14" /></g>
      {/* The warm blob */}
      <WarmBlob x={510} y={472} r={115} />
      {/* Sage: 10% bigger but settled lower, so the same height and wider */}
      <Sage x={880} y={472} r={126} />
      {/* Labels */}
      <Label x={510} y={660} name="The blob" note="1 unit" />
      {/* (Sage's) */}
      <Label x={880} y={660} name="Sage" note="same height, wider and heavier" />
    </Panel>
  );
}

// Each panel with its still's size, for the compositions
export const SHEET_PANELS = [
  // Hero
  { id: "sage-hero", component: SheetHero, width: 1600, height: 900 },
  // Turnaround
  { id: "sage-turnaround", component: SheetTurnaround, width: 2000, height: 620 },
  // Expressions
  { id: "sage-expressions", component: SheetExpressions, width: 2000, height: 1040 },
  // Mouths
  { id: "sage-mouths", component: SheetMouths, width: 2000, height: 560 },
  // Poses
  { id: "sage-poses", component: SheetPoses, width: 2000, height: 680 },
  // Signature
  { id: "sage-signature", component: SheetSignature, width: 1800, height: 820 },
  // Grounds
  { id: "sage-grounds", component: SheetGrounds, width: 2000, height: 520 },
  // Size
  { id: "sage-size", component: SheetSize, width: 1400, height: 760 },
] as const;
