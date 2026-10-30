// Sage, the green blob (character sheet, draft for approval): the calm coach beside the warm blob, drawn from the same outline and shading
// The colours are plain values while the sheet is a draft; once approved they become theme roles (see documents/design/characters/sage.md)

// Load the blob's one outline, so Sage is the same shape as the warm blob
import { BLOB } from "@/components/scenes/Scene";

// Sage's colours, and the warm blob's for drawing them side by side
export const COLOURS = {
  // Pine green body (the calm-studio theme's accent)
  body: "#2d5a3d",
  // Its shaded side
  shade: "#20432c",
  // In dark mode: a lighter pine, so Sage doesn't sink into a dark background
  darkBody: "#3e7552",
  // (its shade)
  darkShade: "#2c5a3d",
  // The face: near-white, as the accent blob's face is today
  ink: "#fcfcfb",
  // Inside an open mouth
  mouth: "#10261a",
  // The tongue
  tongue: "#ec6a55",
  // The sprout's leaves (art-leaf) and the far leaf
  leaf: "#7cc46a",
  // (far leaf)
  leafShade: "#5ea34e",
  // The sprout's stem
  stem: "#4f8a43",
  // The paper and highlight colour (art-cream)
  cream: "#fff6e6",
  // Cheeks when pleased (art-coral)
  cheek: "#f59a86",
  // The warm blob's body, shade and face
  warm: "#f4a46c",
  // (shade)
  warmShade: "#d9844c",
  // (face)
  onWarm: "#1e2320",
} as const;

// How Sage looks: open and settled, eyes shut and listening, pleased, proud, curious, taking a breath, chuckling, thinking, concerned (never cross) and pleasantly surprised
export type Expression = "calm" | "listening" | "encouraging" | "proud" | "curious" | "breathe" | "chuckle" | "thinking" | "concern" | "surprised";
// The mouth shapes for speech: at rest, then one for each group of sounds
export type Viseme = "rest" | "A" | "E" | "O" | "U" | "MBP" | "FV" | "L";
// Which way Sage faces: front, three-quarter right or left, side right, or back
export type Turn = "front" | "three-right" | "three-left" | "side" | "back";
// The signature on its head: a sprout (recommended), round glasses, or nothing
export type Signature = "sprout" | "glasses" | "none";

// What an expression is made of: the eyes, the brows (each brow's lift and tilt), the mouth, and whether the cheeks show
interface Parts {
  // The eyes' kind
  eyes: "lid" | "open" | "closed" | "happy" | "round" | "look-up" | "look-side";
  // Each brow's lift (up is positive) and tilt (inner end up is positive), or no brows
  brows: [[number, number], [number, number]] | null;
  // The mouth
  mouth: Viseme | "smile" | "big" | "small" | "side" | "soft" | "laugh" | "puff";
  // Rosy cheeks
  cheeks: boolean;
}

// Each expression's parts
const EXPRESSIONS: Record<Expression, Parts> = {
  // Calm: soft eyes, soft brows, a small smile: the default
  calm: { eyes: "lid", brows: [[0, 0], [0, 0]], mouth: "smile", cheeks: false },
  // Listening: eyes softly shut, brows relaxed, a small smile
  listening: { eyes: "closed", brows: [[-2, 0], [-2, 0]], mouth: "smile", cheeks: false },
  // Encouraging: eyes open, brows up, a wide smile
  encouraging: { eyes: "open", brows: [[8, 2], [8, 2]], mouth: "big", cheeks: true },
  // Proud of you: happy arches, a big open smile
  proud: { eyes: "happy", brows: [[6, 0], [6, 0]], mouth: "laugh", cheeks: true },
  // Curious: one brow up, looking to the side, a small round mouth
  curious: { eyes: "look-side", brows: [[0, 0], [12, -4]], mouth: "small", cheeks: false },
  // Taking a breath: eyes shut, cheeks puffed
  breathe: { eyes: "closed", brows: [[3, 0], [3, 0]], mouth: "puff", cheeks: true },
  // Chuckling: eyes shut in arches, mouth open in a laugh
  chuckle: { eyes: "happy", brows: [[2, 0], [2, 0]], mouth: "laugh", cheeks: true },
  // Thinking: looking up, mouth pulled to one side
  thinking: { eyes: "look-up", brows: [[4, -3], [9, 2]], mouth: "side", cheeks: false },
  // Gently concerned: inner brows raised, a soft flat mouth (never cross)
  concern: { eyes: "open", brows: [[3, 7], [3, 7]], mouth: "soft", cheeks: false },
  // Pleasantly surprised: round eyes, brows high, a small open mouth
  surprised: { eyes: "round", brows: [[13, 0], [13, 0]], mouth: "O", cheeks: false },
};

// How far the face slides, and how much the far eye narrows, for each turn
const TURNS: Record<Turn, { dx: number; far: number; sprout: number; face: boolean }> = {
  // Facing us
  front: { dx: 0, far: 1, sprout: 0, face: true },
  // Turned three-quarters to its right (our right)
  "three-right": { dx: 24, far: 0.78, sprout: 8, face: true },
  // Turned three-quarters to its left
  "three-left": { dx: -24, far: 0.78, sprout: -8, face: true },
  // In profile, facing right: only the near eye shows
  side: { dx: 48, far: 0, sprout: 16, face: true },
  // From behind: no face
  back: { dx: 0, far: 1, sprout: 0, face: false },
};

// One eye at a place, of a kind, narrowed by a factor (the far eye when turned)
function Eye({ x, y, kind, narrow }: { x: number; y: number; kind: Parts["eyes"]; narrow: number }) {
  // Drawn at its place, narrowed sideways
  return (
    <g transform={`translate(${x} ${y}) scale(${narrow} 1)`} fill={COLOURS.ink} stroke={COLOURS.ink} strokeLinecap="round" strokeLinejoin="round">
      {/* Calm: a slightly smaller oval than wide open */}
      {kind === "lid" && <ellipse stroke="none" rx="9" ry="12" />}
      {/* Open: a full oval */}
      {kind === "open" && <ellipse stroke="none" rx="10" ry="14" />}
      {/* Round: wide circles */}
      {kind === "round" && <circle stroke="none" r="12" />}
      {/* Looking up: smaller ovals high in the eye */}
      {kind === "look-up" && <ellipse stroke="none" cx="2" cy="-6" rx="9" ry="11" />}
      {/* Looking to the side: ovals shifted right */}
      {kind === "look-side" && <ellipse stroke="none" cx="5" cy="0" rx="9.5" ry="13" />}
      {/* Shut softly: a downward curve */}
      {kind === "closed" && <path fill="none" strokeWidth="6" d="M-11 2Q0 11 11 2" />}
      {/* Happy: an upward arch */}
      {kind === "happy" && <path fill="none" strokeWidth="6" d="M-11 6Q0 -8 11 6" />}
    </g>
  );
}

// The mouth: a shape for speech, or one of the expression mouths, centred under the eyes
export function Mouth({ shape }: { shape: Parts["mouth"] }) {
  // Common strokes for the line mouths
  const line = { fill: "none", stroke: COLOURS.ink, strokeWidth: 6.5, strokeLinecap: "round" as const };
  // Common look for the open mouths: dark inside, a pale rim
  const open = { fill: COLOURS.mouth, stroke: COLOURS.ink, strokeWidth: 4.5, strokeLinejoin: "round" as const };
  // Each shape
  switch (shape) {
    // At rest, and the calm smile: a gentle curve
    case "rest":
    case "smile":
      return <path {...line} d="M-15 -2Q0 9 15 -2" />;
    // A, I: open tall
    case "A":
      return <g><ellipse {...open} cx="0" cy="6" rx="12" ry="15" /><ellipse fill={COLOURS.tongue} cx="0" cy="15" rx="7" ry="4" /></g>;
    // E: wide and short
    case "E":
      return <path {...open} d="M-17 0Q0 -4 17 0Q15 11 0 11Q-15 11-17 0Z" />;
    // O: round
    case "O":
      return <ellipse {...open} cx="0" cy="5" rx="9.5" ry="11.5" />;
    // U, W: a small pucker
    case "U":
      return <ellipse {...open} cx="0" cy="4" rx="5.5" ry="6.5" />;
    // M, B, P: lips pressed, a little fuller
    case "MBP":
      return <path {...line} strokeWidth={8} d="M-13 2Q0 5 13 2" />;
    // F, V: the top lip straight over a tucked lower lip
    case "FV":
      return <g><path {...open} d="M-13 0H13Q11 8 0 8Q-11 8-13 0Z" /><path {...line} strokeWidth={5} d="M-14 0H14" /></g>;
    // L, Th: open, the tongue raised
    case "L":
      return <g><ellipse {...open} cx="0" cy="5" rx="11" ry="11" /><ellipse fill={COLOURS.tongue} cx="0" cy="0" rx="6" ry="4" /></g>;
    // A wide smile, closed
    case "big":
      return <path {...line} d="M-20 -4Q0 14 20 -4" />;
    // A small round mouth
    case "small":
      return <ellipse fill={COLOURS.ink} cx="3" cy="4" rx="6" ry="7" />;
    // Pulled to one side, thinking
    case "side":
      return <path {...line} d="M-4 4Q6 6 14 -2" />;
    // Soft and flat, concerned
    case "soft":
      return <path {...line} d="M-10 4Q0 1 10 4" />;
    // A laugh: open, with a flat top
    case "laugh":
      return <g><path {...open} d="M-18 -3H18Q16 16 0 16Q-16 16-18 -3Z" /><ellipse fill={COLOURS.tongue} cx="0" cy="11" rx="8" ry="4" /></g>;
    // Puffed: a small round mouth
    case "puff":
      return <circle fill={COLOURS.ink} cx="0" cy="4" r="4" />;
  }
}

// One arm: a short oval in the body colour (or the shade for the far arm), turned from its shoulder by how far it is lifted
function Arm({ side, lift, far, body, shade }: { side: -1 | 1; lift: number; far: boolean; body: string; shade: string }) {
  // The shoulder, high on the body's side, so a raised arm shows above it
  const [px, py] = [side * 82, -6];
  // Left arms lift clockwise, right arms anticlockwise
  return (
    <g transform={`rotate(${-side * lift} ${px} ${py})`}>
      <ellipse fill={far ? shade : body} cx={px + side * 22} cy={py + 32} rx="17" ry="28" />
    </g>
  );
}

// The sprout on top: a stem and two leaves, leaning with the turn
function Sprout({ lean }: { lean: number }) {
  // Drawn from the crown
  return (
    <g transform={`translate(${lean} -94)`}>
      {/* The stem, curving up */}
      <path fill="none" stroke={COLOURS.stem} strokeWidth="6" strokeLinecap="round" d="M0 0Q-3 -16 3 -30" />
      {/* The far leaf */}
      <ellipse fill={COLOURS.leafShade} cx="16" cy="-38" rx="16" ry="8" transform="rotate(-30 16 -38)" />
      {/* The near leaf */}
      <ellipse fill={COLOURS.leaf} cx="-10" cy="-36" rx="15" ry="8" transform="rotate(28 -10 -36)" />
      {/* A vein on the near leaf */}
      <path fill="none" stroke={COLOURS.leafShade} strokeWidth="2.5" strokeLinecap="round" d="M2 -31Q-10 -35-20 -41" />
    </g>
  );
}

// Round glasses: the alternative signature
function Glasses({ dx, far }: { dx: number; far: number }) {
  // Two rims and a bridge, over the eyes
  return (
    <g fill="none" stroke={COLOURS.cream} strokeWidth="4.5" opacity="0.9">
      {/* The near rim */}
      <circle cx={24 + dx} cy="-30" r="20" />
      {/* The far rim, narrowed when turned */}
      {far > 0 && <ellipse cx={-24 * far + dx} cy="-30" rx={20 * far} ry="20" />}
      {/* The bridge */}
      {far > 0 && <path d={`M${-24 * far + dx + 20 * far} -32Q${dx} -38 ${4 + dx} -32`} />}
    </g>
  );
}

// Sage at a place and size (r is the radius in pixels), with an expression or a speech mouth, a turn, arms lifted, a lean, a breath, a signature, and its dark-mode colours if asked
export function Sage({ x, y, r, expression = "calm", mouth, turn = "front", arms = [6, 6], tilt = 0, breath = 1, signature = "sprout", dark = false }: { x: number; y: number; r: number; expression?: Expression; mouth?: Viseme; turn?: Turn; arms?: [number, number]; tilt?: number; breath?: number; signature?: Signature; dark?: boolean }) {
  // The body and shade colours, lighter in dark mode
  const [body, shade] = dark ? [COLOURS.darkBody, COLOURS.darkShade] : [COLOURS.body, COLOURS.shade];
  // The expression's parts
  const parts = EXPRESSIONS[expression];
  // The turn's offsets
  const view = TURNS[turn];
  // Sage sits a little lower and wider than the warm blob: settled, not bouncy
  const settle = `translate(0 94) scale(${breath * 1.02} ${breath * 0.95}) translate(0 -94)`;
  // The near and far eye: in profile only the near one shows
  const eyeX = (side: -1 | 1) => side * 24 * (side === Math.sign(view.dx || 1) ? 1 : view.far) + view.dx;
  // The drawing, in the blob's 100 units, placed and scaled
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 100}) rotate(${tilt} 0 94)`}>
      <g transform={settle}>
        {/* The arms, tucked behind the body */}
        <Arm side={-1} lift={arms[0]} far={view.dx > 0} body={body} shade={shade} />
        {/* (the other) */}
        <Arm side={1} lift={arms[1]} far={view.dx <= 0} body={body} shade={shade} />
        {/* The sprout grows from behind the crown */}
        {signature === "sprout" && <Sprout lean={view.sprout} />}
        {/* The shaded body */}
        <path fill={shade} d={BLOB} />
        {/* The lit body, nudged up and left so the shade shows as a crescent at the lower right */}
        <path fill={body} transform="translate(-9 -8) scale(0.93)" d={BLOB} />
        {/* The highlight at the upper left, a little higher and smaller than the warm blob's so the brows stay clear */}
        <ellipse fill={COLOURS.cream} opacity="0.28" cx="-60" cy="-64" rx="16" ry="9" transform="rotate(-35 -60 -64)" />
        {/* The face, unless seen from behind */}
        {view.face && (
          <g transform="translate(0 8)">
            {/* Cheeks when pleased */}
            {parts.cheeks && <g fill={COLOURS.cheek} opacity="0.6">{view.far > 0 && <ellipse cx={-46 * view.far + view.dx} cy="-6" rx={13 * view.far} ry="8" />}<ellipse cx={46 + view.dx} cy="-6" rx="13" ry="8" /></g>}
            {/* The brows: short, soft strokes */}
            {parts.brows && ([-1, 1] as const).map((side, i) => {
              // This brow's lift and tilt
              const [lift, inner] = parts.brows?.[i] ?? [0, 0];
              // Hidden on the far side in profile
              if (view.far === 0 && side === -1) return null;
              // Its middle
              const cx = eyeX(side);
              // A short stroke whose inner end rises with the tilt
              return <path key={side} fill="none" stroke={COLOURS.ink} strokeWidth="5.5" strokeLinecap="round" d={`M${cx - side * 12 * (side === -1 ? view.far || 1 : 1)} ${-52 - lift - inner}Q${cx} ${-57 - lift} ${cx + side * 12} ${-52 - lift + inner * 0.3}`} />;
            })}
            {/* The eyes */}
            {view.far > 0 && <Eye x={eyeX(-1)} y={-30} kind={parts.eyes} narrow={view.dx > 0 ? view.far : 1} />}
            {/* (the near one) */}
            <Eye x={eyeX(1)} y={-30} kind={parts.eyes} narrow={view.dx < 0 ? view.far : 1} />
            {/* Glasses, if that is the signature */}
            {signature === "glasses" && <Glasses dx={view.dx} far={view.far} />}
            {/* The mouth: a speech shape when given, otherwise the expression's */}
            <g transform={`translate(${view.dx * 1.05} 0)`}>
              <Mouth shape={mouth ?? parts.mouth} />
            </g>
          </g>
        )}
      </g>
    </g>
  );
}

// The warm blob, plainly, for size and colour comparisons: its usual ready face
export function WarmBlob({ x, y, r }: { x: number; y: number; r: number }) {
  // Drawn in the blob's 100 units, placed and scaled
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 100})`}>
      {/* The shaded body */}
      <path fill={COLOURS.warmShade} d={BLOB} />
      {/* The lit body */}
      <path fill={COLOURS.warm} transform="translate(-9 -8) scale(0.93)" d={BLOB} />
      {/* The highlight */}
      <ellipse fill={COLOURS.cream} opacity="0.5" cx="-50" cy="-54" rx="20" ry="12" transform="rotate(-35 -50 -54)" />
      {/* The eyes */}
      <ellipse fill={COLOURS.onWarm} cx="-23.8" cy="-35.8" rx="9.9" ry="14.8" />
      {/* (the other) */}
      <ellipse fill={COLOURS.onWarm} cx="23.7" cy="-35.8" rx="9.9" ry="14.8" />
      {/* The smile */}
      <path fill="none" stroke={COLOURS.onWarm} strokeWidth="7.9" strokeLinecap="round" d="M-15.8 -4.1q15.8 13.9 31.7 0" />
    </g>
  );
}
