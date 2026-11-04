// A direction B course tile for the commercial: a leaning rounded square in an illustration colour, one prop that tells the idea, the blob, a sparkle

// Load the colours and the cast
import { B } from "./palette";
import { Cast, type Face } from "./Cast";

// The props a tile can carry
export type Prop = "bolt" | "fire" | "chat" | "waves" | "pause" | "target" | "glass" | "q" | "book" | "flag" | "star" | "ear";

// Each prop, drawn in the tile's 200 units (upper right)
function PropArt({ prop }: { prop: Prop }) {
  // The paper colour of drawings
  const p = B.hl;
  // Each prop
  switch (prop) {
    case "bolt": return <path d="M150 46 L122 100 h22 l-10 46 34 -60 h-22 z" fill={B.sun} stroke={p} strokeWidth={5} strokeLinejoin="round" />;
    case "fire": return <><path d="M150 58c14 18 24 30 24 46a24 24 0 0 1-48 0c0-12 8-20 12-28 4 10 8 12 12 12 0-10-4-20 0-30z" fill={B.sun} /><path d="M128 132h44" stroke={p} strokeWidth={7} strokeLinecap="round" /></>;
    case "chat": return <><rect x="114" y="40" width="68" height="48" rx="16" fill={p} /><path d="M130 86l-6 16 18-14z" fill={p} /><circle cx="134" cy="64" r="5" fill={B.bloom} /><circle cx="148" cy="64" r="5" fill={B.bloom} /><circle cx="162" cy="64" r="5" fill={B.bloom} /></>;
    case "waves": return <path d="M140 70q14 24 0 48M156 58q22 36 0 72M172 46q30 48 0 96" stroke={p} strokeWidth={8} fill="none" strokeLinecap="round" />;
    case "pause": return <><rect x="130" y="54" width="15" height="50" rx="6" fill={p} /><rect x="153" y="54" width="15" height="50" rx="6" fill={p} /></>;
    case "target": return <><circle cx="150" cy="70" r="30" fill={p} /><circle cx="150" cy="70" r="19" fill={B.coral} /><circle cx="150" cy="70" r="8" fill={p} /></>;
    case "glass": return <><path d="M136 46h32l-4 34a12 12 0 0 1-24 0z" fill={p} /><rect x="149" y="92" width="6" height="26" fill={p} /><rect x="138" y="116" width="28" height="6" rx="3" fill={p} /><path d="M140 58h24l-2 20a10 10 0 0 1-20 0z" fill={B.sun} /></>;
    case "q": return <><circle cx="150" cy="68" r="30" fill={p} /><text x="150" y="82" textAnchor="middle" fontFamily="Fredoka" fontWeight={700} fontSize={40} fill={B.coral}>?</text></>;
    case "book": return <><path d="M118 60q16 -8 32 0q16 -8 32 0v52q-16 -8 -32 0q-16 -8 -32 0z" fill={p} /><path d="M150 60v52" stroke={B.plum} strokeWidth={4} /></>;
    case "flag": return <><path d="M134 120V44" stroke={p} strokeWidth={6} strokeLinecap="round" /><path d="M137 46h40l-9 14 9 14h-40z" fill={p} /></>;
    case "star": return <path d="M150 40l10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z" fill={B.sun} />;
    case "ear": return <path d="M134 96c0-34 44-40 44-8 0 18-16 18-16 32 0 10-14 12-18 4" stroke={p} strokeWidth={9} fill="none" strokeLinecap="round" />;
  }
}

// Draw a tile at a size in pixels on a ground colour, leaning by tilt degrees, with the blob's face
export function Tile({ ground, prop, face = "ready", size, tilt = -4 }: { ground: string; prop: Prop; face?: Face; size: number; tilt?: number }) {
  // The square drawing
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ display: "block", overflow: "visible" }}>
      {/* The leaning tile and its light circle */}
      <g transform={`rotate(${tilt} 100 100)`}>
        <rect x="14" y="14" width="172" height="172" rx="34" fill={ground} />
        <circle cx="160" cy="36" r="54" fill={B.hl} opacity={0.16} />
      </g>
      {/* The prop */}
      <PropArt prop={prop} />
      {/* The blob, lower left */}
      <g transform="translate(86 132) scale(0.38) translate(-140 -160)"><Cast who="you" face={face} size={280} /></g>
      {/* A sparkle */}
      <path fill={B.hl} d="M42 38l2.4 7.6 7.6 2.4-7.6 2.4-2.4 7.6-2.4-7.6-7.6-2.4 7.6-2.4z" />
    </svg>
  );
}
