// Four ideas for the "storm inside" beat of the transparency reel (stills to compare, 2026-11-04)

// Load Remotion's frame clock and layout
import { AbsoluteFill, useCurrentFrame } from "remotion";
// Load the serif and body faces
import "@fontsource-variable/fraunces";
// Load the reel's sky and character
import { Character, Sky } from "./SciencePosts";

// The blob's outline
const ROUND = "M0 -100C58.8 -100 106 -53.2 106 0C106 50.4 61.6 94 0 94C-58.8 94 -103 53.2 -103 0C-103 -56 -56 -100 0 -100Z";
// The headline face
const SERIF = "'Fraunces Variable', Georgia, serif";

// A storm drawn in a box: dark sky, clouds, rain and a bolt (cx, cy is the centre, s the scale)
function Storm({ cx, cy, s, frame, flash, open = false }: { cx: number; cy: number; s: number; frame: number; flash: boolean; open?: boolean }) {
  // The storm, centred and scaled
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      {/* Its sky */}
      {open ? null : <rect x={-200} y={-200} width={400} height={400} fill="#1a1d44" />}
      {/* A glow from the lightning */}
      <circle cx={20} cy={20} r={160} fill="#fff6d6" opacity={flash ? 0.25 : 0.06} />
      {/* Rain */}
      {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${-180 + i * 22} ${((frame * 9 + i * 41) % 300) - 140} l-10 26`} stroke="#9fc4ff" strokeWidth={6} strokeLinecap="round" />)}
      {/* Clouds */}
      <ellipse cx={-30} cy={-70} rx={140} ry={56} fill="#6a6ea8" />
      {/* (more) */}
      <ellipse cx={70} cy={-50} rx={120} ry={50} fill="#5a5e98" />
      {/* (more) */}
      <circle cx={0} cy={-100} r={60} fill="#7a7eb8" />
      {/* The bolt */}
      <path d="M30 -40 l-60 120 h48 l-44 110 116 -152 h-50 l44 -78z" fill="#ffe08a" opacity={flash ? 1 : 0.85} />
    </g>
  );
}

// One idea, as a full 9:16 frame
export function StormBeat({ variant }: { variant: "A" | "B" | "C" | "D" }) {
  // The current frame
  const frame = useCurrentFrame();
  // A flash in these stills
  const flash = true;
  // The label for each idea
  const labels = { A: "A · Bigger you, small window", B: "B · The storm is all of you", C: "C · Split: calm face, stormy half", D: "D · Storm behind, calm you in front" };
  // The frame
  return (
    <AbsoluteFill>
      {/* The sky */}
      <Sky frame={frame} top={variant === "D" ? "#2a2860" : "#24205a"} bottom="#08061e" />
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          {/* A: a small window low on the body */}
          <clipPath id="winA"><circle cx={540} cy={1180} r={110} /></clipPath>
          {/* B: the whole body is the window */}
          <clipPath id="body"><path d={ROUND} transform="translate(540 1000) scale(4.2)" /></clipPath>
          {/* C: the right half of the body */}
          <clipPath id="half"><path d={ROUND} transform="translate(540 1000) scale(4)" /></clipPath>
          {/* D: a small window */}
          <clipPath id="winD"><circle cx={540} cy={1335} r={78} /></clipPath>
        </defs>
        {variant === "A" ? <>
          {/* You, big */}
          <Character id="a" kind="you" x={540} y={1040} r={420} face="calm" />
          {/* The storm through a small window */}
          <g clipPath="url(#winA)"><Storm cx={540} cy={1180} s={0.62} frame={frame} flash={flash} /></g>
          {/* Its rim */}
          <circle cx={540} cy={1180} r={114} fill="none" stroke="#c96a35" strokeWidth={14} />
        </> : null}
        {variant === "B" ? <>
          {/* A soft glow round you */}
          <path d={ROUND} transform="translate(540 1000) scale(4.45)" fill="#e8935c" opacity={0.25} />
          {/* The storm, filling your shape */}
          <g clipPath="url(#body)"><Storm cx={540} cy={1000} s={2.4} frame={frame} flash={flash} /></g>
          {/* Your outline in apricot */}
          <path d={ROUND} transform="translate(540 1000) scale(4.2)" fill="none" stroke="#e8935c" strokeWidth={6} />
          {/* Your calm face, floating on the storm, on a soft apricot patch */}
          <ellipse cx={540} cy={880} rx={230} ry={120} fill="#e8935c" opacity={0.95} />
          {/* (the face) */}
          <g transform="translate(540 960) scale(3)"><path d="M-35 -32q11 8 22 0M13 -32q11 8 22 0" stroke="#2a2420" strokeWidth={7} fill="none" strokeLinecap="round" /><path d="M-12 -2q12 9 24 0" stroke="#2a2420" strokeWidth={7} fill="none" strokeLinecap="round" /></g>
        </> : null}
        {variant === "C" ? <>
          {/* You, whole */}
          <Character id="c" kind="you" x={540} y={1000} r={400} face="calm" />
          {/* The storm on your right half */}
          <g clipPath="url(#half)"><g clipPath="inset(0 0 0 50%)"><rect x={540} y={500} width={500} height={1000} fill="none" /></g></g>
          <g clipPath="url(#half)"><svg x={540} y={500} width={500} height={1000} viewBox="540 500 500 1000"><Storm cx={760} cy={1000} s={2.2} frame={frame} flash={flash} /></svg></g>
          {/* The seam, jagged like a crack */}
          <path d="M540 600 L520 700 L556 800 L522 900 L558 1000 L524 1100 L552 1200 L540 1380" stroke="#fff6d6" strokeWidth={8} fill="none" strokeLinejoin="round" />
        </> : null}
        {variant === "D" ? <>
          {/* A big storm across the whole sky behind you */}
          <Storm cx={680} cy={620} s={2.2} frame={frame} flash={flash} open />
          {/* A flash lighting everything */}
          <rect width={1080} height={1920} fill="#fff6d6" opacity={0.1} />
          {/* The ground, wet and shining */}
          <path d="M0 1450 C300 1420 780 1430 1080 1410 V1920 H0Z" fill="#141238" />
          {/* Puddle shine */}
          <ellipse cx={540} cy={1520} rx={300} ry={26} fill="#9fc4ff" opacity={0.18} />
          <Character id="d" kind="you" x={540} y={1250} r={290} face="calm" />
          {/* A small window: the storm is inside too */}
          <g clipPath="url(#winD)"><Storm cx={540} cy={1335} s={0.44} frame={frame} flash={flash} /></g>
          {/* Its rim */}
          <circle cx={540} cy={1335} r={82} fill="none" stroke="#c96a35" strokeWidth={12} />
        </> : null}
      </svg>
      {/* The beat's line */}
      <div style={{ position: "absolute", left: 90, right: 90, top: 260, textAlign: "center", fontFamily: SERIF, fontWeight: 650, fontSize: 72, color: "#fff", letterSpacing: -1 }}>How it <span style={{ color: "#9fece0" }}>looks</span>… how it <span style={{ color: "#ffd27a" }}>feels</span>.</div>
      {/* The idea's label */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 200, textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 46, color: "#ffd27a" }}>{labels[variant]}</div>
    </AbsoluteFill>
  );
}
