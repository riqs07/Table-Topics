// Two refined takes on the transparency reel's storm beat (2026-11-04): A with the storm icon centred in a porthole, and C animated (all storm, then the calm half sweeps in and the smile appears)

// Load Remotion's frame clock, easing, springs and layout
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
// Load the serif
import "@fontsource-variable/fraunces";
// Load the reel's sky and character
import { Character, Sky } from "./SciencePosts";

// Each take runs 4 seconds
export const STORM_BEAT_FRAMES = 120;
// The blob's outline
const ROUND = "M0 -100C58.8 -100 106 -53.2 106 0C106 50.4 61.6 94 0 94C-58.8 94 -103 53.2 -103 0C-103 -56 -56 -100 0 -100Z";
// The headline face
const SERIF = "'Fraunces Variable', Georgia, serif";
// Where the blob sits and how big it is
const CX = 540;
// (its centre height)
const CY = 1030;
// (its radius in pixels)
const R = 400;

// 0 to 1 between two frames, eased
function ease(frame: number, from: number, to: number) {
  // Smooth in and out
  return interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
}

// A compact storm icon centred on 0,0, about 200 units across: a cloud, a bolt and rain
function StormIcon({ frame, flash }: { frame: number; flash: boolean }) {
  // The icon
  return (
    <g>
      {/* Rain, falling and looping */}
      {[-60, -30, 30, 60].map((x, i) => <path key={x} d={`M${x} ${((frame * 4 + i * 23) % 70) + 10} l-6 16`} stroke="#9fc4ff" strokeWidth={6} strokeLinecap="round" />)}
      {/* The cloud: three puffs and a flat base */}
      <circle cx={-34} cy={-24} r={34} fill="#8a8ec8" />
      {/* (the tall puff) */}
      <circle cx={8} cy={-40} r={44} fill="#9a9ed6" />
      {/* (the right puff) */}
      <circle cx={48} cy={-20} r={30} fill="#8a8ec8" />
      {/* (the base) */}
      <rect x={-68} y={-24} width={146} height={34} rx={17} fill="#8a8ec8" />
      {/* The bolt, centred under the cloud */}
      <path d="M10 0 L-18 46 H2 L-12 84 L28 30 H8 L22 0Z" fill="#ffe08a" opacity={flash ? 1 : 0.9} />
    </g>
  );
}

// A big storm filling a space centred on 0,0 (about 1000 units across)
function BigStorm({ frame, flash }: { frame: number; flash: boolean }) {
  // The scene
  return (
    <g>
      {/* The dark sky */}
      <rect x={-500} y={-500} width={1000} height={1000} fill="#1a1d44" />
      {/* The lightning's glow */}
      <circle cx={40} cy={60} r={340} fill="#fff6d6" opacity={flash ? 0.3 : 0.05} />
      {/* Rain */}
      {Array.from({ length: 26 }, (_, i) => <path key={i} d={`M${-480 + i * 38} ${((frame * 14 + i * 61) % 900) - 420} l-16 40`} stroke="#9fc4ff" strokeWidth={9} strokeLinecap="round" />)}
      {/* Clouds */}
      <ellipse cx={-80} cy={-200} rx={330} ry={120} fill="#6a6ea8" />
      {/* (more) */}
      <ellipse cx={180} cy={-150} rx={280} ry={110} fill="#5a5e98" />
      {/* (more) */}
      <circle cx={0} cy={-280} r={150} fill="#7a7eb8" />
      {/* The bolt */}
      <path d="M90 -90 L-40 170 H60 L-30 400 L210 70 H100 L190 -90Z" fill="#ffe08a" opacity={flash ? 1 : 0.85} />
    </g>
  );
}

// The beat's headline
function Headline({ frame }: { frame: number }) {
  // Fading in
  const o = ease(frame, 4, 18);
  // The line
  return <div style={{ position: "absolute", left: 90, right: 90, top: 250, textAlign: "center", fontFamily: SERIF, fontWeight: 650, fontSize: 76, letterSpacing: -1, color: "#fff", opacity: o }}>How it <span style={{ color: "#9fece0" }}>looks</span>… how it <span style={{ color: "#ffd27a" }}>feels</span>.</div>;
}

// A: the blob big and calm, the storm in a centred porthole that opens with a spring
export function StormBeatA() {
  // The current frame
  const frame = useCurrentFrame();
  // The frame rate
  const { fps } = useVideoConfig();
  // The porthole opening
  const open = spring({ frame: frame - 24, fps, config: { damping: 12, stiffness: 140 } });
  // Lightning now and then
  const flash = [44, 70, 98].some((f) => frame >= f && frame < f + 4);
  // The porthole's centre: on the body's middle line, between the smile and the bottom
  const py = CY + 0.42 * R;
  // Its radius
  const pr = 0.3 * R;
  // The take
  return (
    <AbsoluteFill>
      {/* The sky */}
      <Sky frame={frame} top="#24205a" bottom="#08061e" />
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {/* The porthole's clip */}
        <defs><clipPath id="portA"><circle cx={CX} cy={py} r={pr * open} /></clipPath></defs>
        {/* You, big and calm, with the face set a little higher to make room */}
        <Character id="bigA" kind="you" x={CX} y={CY} r={R} face="calm" />
        {/* The porthole's dark glass */}
        <g clipPath="url(#portA)">
          {/* The glass */}
          <circle cx={CX} cy={py} r={pr} fill="#1a1d44" />
          {/* A glow when the lightning flashes */}
          <circle cx={CX} cy={py} r={pr} fill="#fff6d6" opacity={flash ? 0.18 : 0} />
          {/* The storm icon, centred in it */}
          <g transform={`translate(${CX} ${py - 6}) scale(${(pr * 1.35) / 200})`}><StormIcon frame={frame} flash={flash} /></g>
        </g>
        {/* The porthole's rim, and a highlight on the glass */}
        <circle cx={CX} cy={py} r={(pr + 8) * open} fill="none" stroke="#c96a35" strokeWidth={18} />
        {/* (highlight) */}
        <path d={`M${CX - pr * 0.6} ${py - pr * 0.55} a${pr * 0.8} ${pr * 0.8} 0 0 1 ${pr * 0.5} -${pr * 0.25}`} stroke="#fff" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.35 * open} />
      </svg>
      {/* The line */}
      <Headline frame={frame} />
    </AbsoluteFill>
  );
}

// C: all storm at first; a calm half sweeps in from the left along a jagged seam, and the smile draws on
export function StormBeatC() {
  // The current frame
  const frame = useCurrentFrame();
  // How far the calm half has swept in (0 = all storm, 1 = the seam at the middle)
  const sweep = ease(frame, 26, 62);
  // The smile drawing on, once the calm half has arrived
  const smile = ease(frame, 58, 76);
  // The eyes opening a little later
  const settle = ease(frame, 70, 84);
  // Lightning: a big flash at the start, then now and then on the stormy half
  const flash = [6, 12, 50, 96].some((f) => frame >= f && frame < f + 4);
  // A small shake on the first big flash
  const shake = frame >= 6 && frame < 18 ? Math.sin(frame * 3) * (18 - frame) * 0.8 : 0;
  // The seam's x: from far left of the body to the middle
  const seamX = CX - R * 1.15 + R * 1.15 * sweep;
  // The seam's jagged points, from the top of the body to the bottom
  const seam = [[0, -1.1], [-0.05, -0.8], [0.04, -0.55], [-0.06, -0.3], [0.05, -0.05], [-0.06, 0.2], [0.04, 0.45], [-0.03, 0.7], [0, 1.0]].map(([dx = 0, dy = 0]) => [seamX + dx * R, CY + dy * R] as const);
  // The stormy side: from the seam to the right edge
  const stormSide = `M${seam.map(([x, y]) => `${x} ${y}`).join(" L")} L1080 ${CY + R} L1080 ${CY - R * 1.2} Z`;
  // The take
  return (
    <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.5}px)` }}>
      {/* The sky */}
      <Sky frame={frame} top="#24205a" bottom="#08061e" />
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          {/* The body */}
          <clipPath id="bodyC"><path d={ROUND} transform={`translate(${CX} ${CY}) scale(${R / 100})`} /></clipPath>
          {/* The stormy side */}
          <clipPath id="sideC"><path d={stormSide} /></clipPath>
        </defs>
        {/* The calm you underneath, with a face that settles from eyes shut to a smile */}
        <g transform={`translate(${CX} ${CY}) scale(${R / 100})`}>
          {/* The body (drawn via the shared character for its shading) */}
          <g transform={`scale(${100 / R}) translate(${-CX} ${-CY})`}><Character id="youC" kind="you" x={CX} y={CY} r={R} face="none" /></g>
          {/* The face sits on the calm half: moved left and a little smaller */}
          <g transform="translate(-44 4) scale(0.72)">
          {/* Cheeks */}
          <ellipse cx={-46} cy={-6} rx={14} ry={9} fill="#ec6a55" opacity={0.35} />
          {/* (the other) */}
          <ellipse cx={46} cy={-6} rx={14} ry={9} fill="#ec6a55" opacity={0.35} />
          {/* Eyes: shut arcs that lift into happy arches */}
          <path d={`M-38 ${-28 + 4 * settle}q14 ${10 - 20 * settle} 26 0M12 ${-28 + 4 * settle}q14 ${10 - 20 * settle} 26 0`} stroke="#2a2420" strokeWidth={7.5} fill="none" strokeLinecap="round" />
          {/* The smile, drawing on from the middle */}
          <path d="M-18 0q18 16 36 0" stroke="#2a2420" strokeWidth={7.5} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - smile} />
          </g>
        </g>
        {/* The storm, on the side of the seam that has not been swept yet */}
        <g clipPath="url(#bodyC)"><g clipPath="url(#sideC)"><g transform={`translate(${CX} ${CY}) scale(1.05)`}><BigStorm frame={frame} flash={flash} /></g></g></g>
        {/* The seam itself, glowing */}
        <g clipPath="url(#bodyC)"><path d={`M${seam.map(([x, y]) => `${x} ${y}`).join(" L")}`} stroke="#fff6d6" strokeWidth={10} fill="none" strokeLinejoin="round" opacity={sweep > 0.02 ? 1 : 0} /></g>
        {/* A flash over everything on the big strikes */}
        <rect width={1080} height={1920} fill="#fff6d6" opacity={frame >= 6 && frame < 16 ? 0.12 : 0} />
      </svg>
      {/* The line */}
      <Headline frame={frame} />
    </AbsoluteFill>
  );
}
