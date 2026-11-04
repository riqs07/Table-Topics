// "Blueprint of a story": a silent, 17-second, 4:5 animation of a story's shape drawn as an engineering blueprint (an art-direction test, 2026-11-04)

// Load Remotion's frame clock, easing and layout helpers
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// The length: 17 seconds at 30 frames a second
export const BLUEPRINT_FRAMES = 510;

// The story's curve, drawn in a 400 by 500 space: the set-up, a rise to the turn, then a drop to the point
const SEGMENTS: ReadonlyArray<ReadonlyArray<[number, number]>> = [
  // From the start, rising to the turn
  [[50, 330], [110, 328], [150, 290], [190, 230]],
  // Over the top of the turn
  [[190, 230], [210, 200], [222, 190], [236, 194]],
  // Down to the point
  [[236, 194], [260, 202], [280, 290], [340, 326]],
];
// The same curve as an SVG path
const CURVE = "M50 330 C110 328 150 290 190 230 C210 200 222 190 236 194 C260 202 280 290 340 326";
// Where the turn sits (the top of the curve)
const TURN: [number, number] = [232, 193];

// A point on one cubic Bézier segment at t (0 to 1)
function bezier(seg: ReadonlyArray<[number, number]>, t: number): [number, number] {
  // The four control points
  const [a, b, c, d] = seg;
  // The weights of each point at t
  const u = 1 - t;
  // The blended x and y
  return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
}

// A point along the whole curve at p (0 to 1), treating the three segments as equal thirds
function along(p: number): [number, number] {
  // Which segment, and how far along it
  const scaled = Math.min(2.999, Math.max(0, p * 3));
  // The segment's index
  const i = Math.floor(scaled);
  // The point
  return bezier(SEGMENTS[i], scaled - i);
}

// 0 to 1 between two frames, eased, held at either end
function ease(frame: number, from: number, to: number): number {
  // Smooth in and out
  return interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
}

// The white of the drawing
const INK = "#ffffff";
// The yellow used for the turn
const TURN_INK = "#f4e04a";
// The blueprint's blue
const PAPER = "#1f4f9a";
// The lettering
const FONT = "Atkinson, sans-serif";

// A label that fades and slides in at a frame, with a leader line drawn to a point
function Label({ frame, at, x, y, title, note, colour = INK, leader }: { frame: number; at: number; x: number; y: number; title: string; note: string; colour?: string; leader: string }) {
  // How far the leader line has drawn
  const line = ease(frame, at, at + 18);
  // How far the words have faded in
  const words = ease(frame, at + 10, at + 26);
  // The leader, then the title and its note
  return (
    <g>
      {/* The leader line, drawn from the curve out to the label */}
      <path d={leader} stroke={INK} strokeWidth={1.6} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - line} strokeLinecap="round" />
      {/* The words, rising a little as they appear */}
      <g opacity={words} transform={`translate(0 ${(1 - words) * 6})`}>
        {/* The title */}
        <text x={x} y={y} fontFamily={FONT} fontWeight={800} fontSize={15} letterSpacing={1.5} fill={colour}>{title}</text>
        {/* The note under it */}
        <text x={x} y={y + 16} fontFamily={FONT} fontSize={11.5} fill={INK} opacity={0.85}>{note}</text>
      </g>
    </g>
  );
}

// The animation
export function StoryBlueprint() {
  // The current frame, and the frame rate for the springs
  const frame = useCurrentFrame();
  // The video's settings
  const { fps } = useVideoConfig();
  // The paper and grid fading in
  const paper = ease(frame, 0, 20);
  // The border drawing round
  const border = ease(frame, 10, 45);
  // The title typing out, one letter at a time
  const titleText = "HOW A STORY IS BUILT";
  // How many letters show
  const letters = Math.round(interpolate(frame, [28, 60], [0, titleText.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  // The baseline drawing across
  const base = ease(frame, 40, 70);
  // A dot popping in with a spring, from a start frame
  const pop = (at: number) => spring({ frame: frame - at, fps, config: { damping: 9, stiffness: 140 } });
  // The curve drawing from start to end
  const curve = interpolate(frame, [80, 200], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  // The dashed drop line from the turn
  const drop = ease(frame, 150, 176);
  // The dimension line growing outwards from its middle
  const dim = ease(frame, 228, 262);
  // The "about 60 seconds" label
  const dimLabel = ease(frame, 250, 270);
  // The title block drawing
  const block = ease(frame, 280, 312);
  // The title block's lines appearing one after another
  const blockLine = (i: number) => ease(frame, 300 + i * 8, 316 + i * 8);
  // The approval stamp slamming in
  const stamp = spring({ frame: frame - 344, fps, config: { damping: 11, stiffness: 220, mass: 0.7 } });
  // A small shake of the paper as the stamp lands
  const shake = frame >= 346 && frame < 356 ? Math.sin((frame - 346) * 2.4) * (356 - frame) * 0.25 : 0;
  // A spark of light running along the finished curve
  const glow = interpolate(frame, [390, 470], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  // Where that spark is
  const spark = along(glow);
  // The tiny blob in the title block blinking now and then
  const blink = [372, 420, 468].some((f) => frame >= f && frame < f + 4);
  // The fade to and from the paper at the ends
  const fade = interpolate(frame, [0, 8, BLUEPRINT_FRAMES - 14, BLUEPRINT_FRAMES], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // The frame: the blueprint fills it
  return (
    <AbsoluteFill style={{ background: PAPER, opacity: fade }}>
      {/* The drawing, in a 400 by 500 space scaled to the frame */}
      <svg viewBox="0 0 400 500" width="100%" height="100%" style={{ transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        {/* The grid: fine lines every 20, stronger every 100 */}
        <defs>
          {/* The fine grid */}
          <pattern id="fine" width={20} height={20} patternUnits="userSpaceOnUse"><path d="M20 0 H0 V20" fill="none" stroke={INK} strokeOpacity={0.1} strokeWidth={0.8} /></pattern>
          {/* The strong grid */}
          <pattern id="strong" width={100} height={100} patternUnits="userSpaceOnUse"><path d="M100 0 H0 V100" fill="none" stroke={INK} strokeOpacity={0.2} strokeWidth={1.2} /></pattern>
          {/* A soft glow for the spark */}
          <radialGradient id="spark"><stop offset="0" stopColor={TURN_INK} stopOpacity={0.9} /><stop offset="1" stopColor={TURN_INK} stopOpacity={0} /></radialGradient>
        </defs>
        {/* The grid fading in */}
        <g opacity={paper}>
          {/* Fine */}
          <rect width={400} height={500} fill="url(#fine)" />
          {/* Strong */}
          <rect width={400} height={500} fill="url(#strong)" />
        </g>
        {/* The border, drawn round */}
        <rect x={16} y={16} width={368} height={468} fill="none" stroke={INK} strokeOpacity={0.75} strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - border} />
        {/* The title, typing out */}
        <text x={36} y={64} fontFamily={FONT} fontWeight={800} fontSize={20} letterSpacing={2} fill={INK}>{titleText.slice(0, letters)}{letters < titleText.length && frame >= 28 && frame % 16 < 8 ? "▍" : ""}</text>
        {/* The title's underline */}
        <path d="M36 76 H250" stroke={INK} strokeWidth={1.5} strokeOpacity={0.7} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(frame, 50, 72)} />
        {/* The baseline and its end ticks */}
        <path d="M40 350 H360" stroke={INK} strokeOpacity={0.7} strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - base} />
        {/* (the ticks) */}
        <path d="M40 342 V358 M360 342 V358" stroke={INK} strokeOpacity={0.7 * base} strokeWidth={2} />
        {/* The dashed drop from the turn to the baseline */}
        <path d={`M${TURN[0]} ${TURN[1] + 10} V348`} stroke={INK} strokeWidth={1.2} strokeOpacity={0.8} strokeDasharray="4 4" pathLength={1} style={{ clipPath: `inset(0 0 ${(1 - drop) * 100}% 0)` }} />
        {/* The curve, drawing itself */}
        <path d={CURVE} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - curve} />
        {/* The start dot */}
        <circle cx={50} cy={330} r={6 * pop(62)} fill={INK} />
        {/* The turn's dot, in yellow */}
        <circle cx={TURN[0]} cy={TURN[1]} r={8 * pop(142)} fill={TURN_INK} />
        {/* The end dot */}
        <circle cx={340} cy={326} r={6 * pop(198)} fill={INK} />
        {/* The three labels */}
        <Label frame={frame} at={68} x={28} y={238} title="SET-UP" note="where, who, the want" leader="M80 318 L62 270 H30" />
        {/* (the turn) */}
        <Label frame={frame} at={146} x={238} y={118} title="THE TURN" note="“but then…”" colour={TURN_INK} leader={`M${TURN[0]} ${TURN[1] - 12} V140 H300`} />
        {/* (the point) */}
        <Label frame={frame} at={202} x={286} y={250} title="THE POINT" note="land it, stop" leader="M330 312 L346 274 H368" />
        {/* The dimension line, growing from the middle, with its arrowheads */}
        <g opacity={dim > 0 ? 1 : 0}>
          {/* The line */}
          <path d={`M${200 - 160 * dim} 390 H${200 + 160 * dim}`} stroke={INK} strokeWidth={1.5} />
          {/* The left arrowhead */}
          <path d={`M${200 - 160 * dim} 390 l10 -5 v10z`} fill={INK} />
          {/* The right arrowhead */}
          <path d={`M${200 + 160 * dim} 390 l-10 -5 v10z`} fill={INK} />
        </g>
        {/* "About 60 seconds" */}
        <text x={200} y={382} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={14} fill={INK} opacity={dimLabel}>≈ 60 SECONDS</text>
        {/* The title block, bottom right */}
        <g transform="translate(234 412)">
          {/* Its box and dividers */}
          <path d="M0 0 H140 V60 H0Z M0 22 H140 M76 22 V60" fill="none" stroke={INK} strokeWidth={2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - block} />
          {/* The name */}
          <text x={8} y={16} fontFamily={FONT} fontWeight={800} fontSize={11} letterSpacing={1} fill={INK} opacity={blockLine(0)}>STORY · REV. 2</text>
          {/* The scale */}
          <text x={8} y={38} fontFamily={FONT} fontSize={9} fill={INK} opacity={blockLine(1)}>SCALE</text>
          {/* (one blob to one blob) */}
          <text x={8} y={51} fontFamily={FONT} fontSize={9} fill={INK} opacity={blockLine(2)}>1 : 1 blob</text>
          {/* The tiny outline blob, for scale, blinking now and then */}
          <g transform="translate(108 44) scale(0.15)" opacity={blockLine(3)}>
            {/* The outline */}
            <path d="M0 -100C58.8 -100 106 -53.2 106 0C106 50.4 61.6 94 0 94C-58.8 94 -103 53.2 -103 0C-103 -56 -56 -100 0 -100Z" fill="none" stroke={INK} strokeWidth={10} />
            {/* Its eyes, shut for a blink */}
            {blink ? <path d="M-34 -34 h20 M14 -34 h20" stroke={INK} strokeWidth={10} strokeLinecap="round" /> : <><circle cx={-24} cy={-34} r={11} fill={INK} /><circle cx={24} cy={-34} r={11} fill={INK} /></>}
          </g>
        </g>
        {/* Who drew it and who checked it */}
        <text x={30} y={466} fontFamily={FONT} fontWeight={700} fontSize={9.5} letterSpacing={1} fill={INK} opacity={blockLine(4) * 0.75}>DRAWN BY: YOU · CHECKED BY: SAGE</text>
        {/* The approval stamp, slamming in at an angle */}
        <g transform={`translate(104 416) rotate(-12) scale(${1.8 - 0.8 * stamp})`} opacity={frame >= 344 ? Math.min(1, stamp * 1.4) : 0}>
          {/* Its outer ring */}
          <rect x={-60} y={-18} width={120} height={36} rx={8} fill="none" stroke="#ec6a55" strokeWidth={3} />
          {/* The word */}
          <text x={0} y={7} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={18} letterSpacing={3} fill="#ec6a55">APPROVED</text>
        </g>
        {/* The spark running along the finished curve */}
        {glow > 0 && glow < 1 ? <circle cx={spark[0]} cy={spark[1]} r={16} fill="url(#spark)" /> : null}
      </svg>
    </AbsoluteFill>
  );
}
