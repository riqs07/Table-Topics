// The VoiceLab title card: the app's mark (the blob in a rounded tile, with sound arcs) above the name and line, on the reels' night sky (2026-11-04)

// Load Remotion's layout and video settings
import { AbsoluteFill, useVideoConfig } from "remotion";
// Load the serif and the body face
import "@fontsource-variable/fraunces";
// Load the reels' sky
import { Sky } from "./SciencePosts";

// The blob's outline
const ROUND = "M0 -100C58.8 -100 106 -53.2 106 0C106 50.4 61.6 94 0 94C-58.8 94 -103 53.2 -103 0C-103 -56 -56 -100 0 -100Z";

// The mark on its own: a rounded tile with the blob, smiling, and two sound arcs
export function Mark({ size }: { size: number }) {
  // The mark, drawn in a 200-unit square
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-label="VoiceLab">
      <defs>
        {/* The tile's deep night gradient */}
        <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3a2f86" /><stop offset="1" stopColor="#1a1446" /></linearGradient>
        {/* The blob's shading */}
        <radialGradient id="blob" cx="35%" cy="28%" r="80%"><stop offset="0" stopColor="#f7b07c" /><stop offset="0.55" stopColor="#e8935c" /><stop offset="1" stopColor="#c96a35" /></radialGradient>
      </defs>
      {/* The tile */}
      <rect x={8} y={8} width={184} height={184} rx={46} fill="url(#tile)" />
      {/* Its rim of light */}
      <rect x={8} y={8} width={184} height={184} rx={46} fill="none" stroke="#fff" strokeOpacity={0.14} strokeWidth={3} />
      {/* The sound arcs on the right */}
      <path d="M150 74 q14 26 0 52" stroke="#ffd27a" strokeWidth={9} fill="none" strokeLinecap="round" />
      {/* (the outer one) */}
      <path d="M166 60 q24 40 0 80" stroke="#ffd27a" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.6} />
      {/* The blob */}
      <g transform="translate(92 106) scale(0.56)">
        {/* Its body */}
        <path d={ROUND} fill="url(#blob)" />
        {/* Its highlight */}
        <ellipse cx={-46} cy={-58} rx={18} ry={11} fill="#fff6e6" opacity={0.55} transform="rotate(-35 -46 -58)" />
        {/* Happy eyes */}
        <path d="M-38 -28L-24 -42-10 -28M10 -28L24 -42 38 -28" stroke="#2a2420" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* An open mouth, speaking */}
        <ellipse cx={0} cy={6} rx={14} ry={15} fill="#2a2420" />
      </g>
    </svg>
  );
}

// The card: the mark, the name and the line, centred
export function TitleCard() {
  // The frame's size, so the card works vertical and square
  const { width, height } = useVideoConfig();
  // A scale from the narrower side
  const u = Math.min(width, height) / 1080;
  // The card
  return (
    <AbsoluteFill>
      {/* The night sky */}
      <Sky frame={30} top="#2a2370" bottom="#08061e" />
      {/* A soft glow behind the mark */}
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 900 * u, height: 900 * u, transform: "translate(-50%, -62%)", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(232,147,92,0.28), rgba(232,147,92,0))" }} />
      {/* The stack */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40 * u }}>
        {/* The mark */}
        <Mark size={300 * u} />
        {/* The name */}
        <div style={{ fontFamily: "'Fraunces Variable', Georgia, serif", fontWeight: 700, fontSize: 150 * u, letterSpacing: -4 * u, color: "#fff", lineHeight: 1 }}>VoiceLab</div>
        {/* The line */}
        <div style={{ fontFamily: "Atkinson, sans-serif", fontSize: 44 * u, color: "#e6e0ff", opacity: 0.85, letterSpacing: 1 * u }}>practise speaking, privately</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
