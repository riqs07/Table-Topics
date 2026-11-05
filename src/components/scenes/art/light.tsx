// The richer rendering layer (the Illustration Study, documents/design/redesign/art-studies/art.html): soft light from the upper left, depth in layers, a fine grain, and a lit blob. Every colour is a theme role read through its CSS variable (var(--vl-...)), mixed lighter towards art-cream or darker towards on-warm, so the art follows each theme and dark mode. A drawing turns the light on for its blobs by setting --vl-art-on and --vl-art-lit on its root (litStyle); outside a lit drawing, Body stays flat

// Load React's type for styles
import type { CSSProperties } from "react";

// The colour roles a drawing may light (the art roles, the blob's and the cast's)
export type ArtRole = "art-sky" | "art-sun" | "art-bloom" | "art-leaf" | "art-plum" | "art-coral" | "art-cream" | "warm" | "warm-shade" | "on-warm" | "accent" | "sage" | "sage-shade" | "friend" | "friend-shade";

// A role's colour, as a CSS value
export function role(name: ArtRole): string {
  // Its theme variable
  return `var(--vl-${name})`;
}

// A role made lighter (towards art-cream) or darker (towards on-warm): amount from -1 (darkest) to 1 (lightest), as a CSS colour
export function tone(name: ArtRole, amount: number): string {
  // No change
  if (amount === 0) return role(name);
  // What it mixes towards
  const toward = amount > 0 ? role("art-cream") : role("on-warm");
  // How much of the role stays
  const keep = Math.round((1 - Math.abs(amount)) * 100);
  // Mixed in the browser
  return `color-mix(in srgb, ${role(name)} ${keep}%, ${toward})`;
}

// One gradient stop in a role's colour (or a tone of it) at an opacity
export function Stop({ at, color, opacity = 1 }: { at: number; color: string; opacity?: number }) {
  // The stop, its colour as a style so the theme variable resolves
  return <stop offset={at} style={{ stopColor: color, stopOpacity: opacity }} />;
}

// The style a lit drawing puts on its root: turns on the blob's lit details and points its body light at this drawing's gradient
export function litStyle(id: string): CSSProperties {
  // The two switches, as custom properties
  return { "--vl-art-on": 1, "--vl-art-lit": `url(#${id}-lit)`, "--vl-art-lit-accent": `url(#${id}-lit-accent)` } as CSSProperties;
}

// The shared definitions of a lit drawing, by its id: the body light, the sun's glow, the grain, and (for a tile) its ground's gradient
export function ArtDefs({ id, ground }: { id: string; ground?: ArtRole }) {
  // The definitions
  return (
    <>
      {/* The body light: bright at the upper left, clear in the middle, shadowed at the lower right (on any blob, measured from its own box) */}
      <radialGradient id={`${id}-lit`} cx="0.35" cy="0.3" r="0.8">
        {/* Lit */}
        <Stop at={0} color={role("art-cream")} opacity={0.5} />
        {/* The body's own colour */}
        <Stop at={0.42} color={role("art-cream")} opacity={0} />
        {/* (still its own) */}
        <Stop at={0.66} color={role("on-warm")} opacity={0} />
        {/* Turned away from the light */}
        <Stop at={1} color={role("on-warm")} opacity={0.3} />
      </radialGradient>
      {/* The same light, softer, for the accent body */}
      <radialGradient id={`${id}-lit-accent`} cx="0.35" cy="0.3" r="0.8">
        {/* Lit */}
        <Stop at={0} color={role("art-cream")} opacity={0.35} />
        {/* Its own colour */}
        <Stop at={0.5} color={role("art-cream")} opacity={0} />
        {/* Turned away */}
        <Stop at={1} color={role("on-warm")} opacity={0.25} />
      </radialGradient>
      {/* The sun's glow: a soft light that fades out */}
      <radialGradient id={`${id}-sun`}>
        {/* Bright at the source */}
        <Stop at={0} color={role("art-cream")} opacity={0.75} />
        {/* Spreading */}
        <Stop at={0.35} color={role("art-cream")} opacity={0.3} />
        {/* Gone */}
        <Stop at={1} color={role("art-cream")} opacity={0} />
      </radialGradient>
      {/* A warm glow (a fire, a lamp, a spotlight) */}
      <radialGradient id={`${id}-warm`}>
        {/* Bright at the source */}
        <Stop at={0} color={role("art-sun")} opacity={0.8} />
        {/* Spreading, warmer */}
        <Stop at={0.45} color={role("art-coral")} opacity={0.25} />
        {/* Gone */}
        <Stop at={1} color={role("art-coral")} opacity={0} />
      </radialGradient>
      {/* The ground's gradient: lighter where the light falls (upper left), deeper at the lower right */}
      {ground && (
        <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="1" y2="1">
          {/* Lit */}
          <Stop at={0} color={tone(ground, 0.24)} />
          {/* Its own colour */}
          <Stop at={0.5} color={role(ground)} />
          {/* In shade */}
          <Stop at={1} color={tone(ground, -0.26)} />
        </linearGradient>
      )}
      {/* A soft shadow cast down and right, away from the light, for a prop standing on the ground */}
      <filter id={`${id}-drop`} x="-20%" y="-20%" width="150%" height="150%">
        {/* The shadow */}
        <feDropShadow dx="3" dy="5" stdDeviation="3" style={{ floodColor: role("on-warm"), floodOpacity: 0.22 }} />
      </filter>
      {/* The grain: fine noise, dark only, kept to the shape it covers */}
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        {/* The noise */}
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
        {/* Made into dark specks of varying strength */}
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0" />
        {/* Kept inside the shape */}
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
    </>
  );
}

// The grain over a whole drawing (a rectangle the size of the drawing, at low strength), optionally kept to a clip
export function Grain({ id, width, height, x = 0, y = 0, clip, opacity = 0.16 }: { id: string; width: number; height: number; x?: number; y?: number; clip?: string; opacity?: number }) {
  // The specks
  return <rect className="fill-on-warm" x={x} y={y} width={width} height={height} filter={`url(#${id}-grain)`} opacity={opacity} clipPath={clip ? `url(#${clip})` : undefined} />;
}

// A soft glow (the sun's light, or a warm one) at a place and size
export function Glow({ id, x, y, r, warm = false, className = "" }: { id: string; x: number; y: number; r: number; warm?: boolean; className?: string }) {
  // The glow
  return <circle className={className} cx={x} cy={y} r={r} fill={`url(#${id}-${warm ? "warm" : "sun"})`} />;
}

// A sun: its disc with a faint halo, and the glow around it
export function Sun({ id, x, y, r, className = "fill-art-cream" }: { id: string; x: number; y: number; r: number; className?: string }) {
  // The sun
  return (
    <g>
      {/* The glow, wide */}
      <Glow id={id} x={x} y={y} r={r * 3.2} />
      {/* The halo */}
      <circle className={`${className} opacity-25`} cx={x} cy={y} r={r * 1.4} />
      {/* The disc */}
      <circle className={className} cx={x} cy={y} r={r} />
    </g>
  );
}

// A sky: a vertical gradient from one colour at the top to another at the horizon, filling a rectangle
export function Sky({ id, width, height, top, bottom, mid }: { id: string; width: number; height: number; top: string; bottom: string; mid?: string }) {
  // The gradient and the rectangle
  return (
    <>
      {/* The gradient */}
      <defs>
        {/* Top to bottom */}
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          {/* The top */}
          <Stop at={0} color={top} />
          {/* The middle, when given */}
          {mid && <Stop at={0.6} color={mid} />}
          {/* The horizon */}
          <Stop at={1} color={bottom} />
        </linearGradient>
      </defs>
      {/* The sky */}
      <rect width={width} height={height} fill={`url(#${id}-sky)`} />
    </>
  );
}

// A band of rolling land across a drawing, from a height down to the bottom: a far one lighter, a near one deeper (depth in layers)
export function Land({ width, height, y, rise = 20, color, opacity = 1, clip, seed = 0 }: { width: number; height: number; y: number; rise?: number; color: string; opacity?: number; clip?: string; seed?: number }) {
  // Four gentle humps across the width, shifted by the seed so layers differ
  const step = width / 4;
  // The humps' heights, varied by the seed
  const lift = (index: number) => rise * (0.5 + 0.5 * Math.sin(index * 1.9 + seed * 2.3));
  // The outline: along the top, then down and round the bottom
  const d = `M0 ${y} ${[0, 1, 2, 3].map((index) => `C${step * index + step * 0.35} ${y - lift(index)} ${step * index + step * 0.65} ${y - lift(index + 1)} ${step * (index + 1)} ${y - lift(index + 1) * 0.4}`).join(" ")} V${height} H0Z`;
  // The land
  return <path d={d} style={{ fill: color }} opacity={opacity} clipPath={clip ? `url(#${clip})` : undefined} />;
}

// A soft shadow on the ground under something (an object's contact shadow), at a place and width
export function Shadow({ x, y, rx, ry = rx * 0.17, opacity = 0.18 }: { x: number; y: number; rx: number; ry?: number; opacity?: number }) {
  // The shadow
  return <ellipse className="fill-on-warm" cx={x} cy={y} rx={rx} ry={ry} opacity={opacity} />;
}

// A four-pointed sparkle with curved sides, still (for the large scenes; tiles use the twinkling one)
export function Spark({ x, y, size, className = "fill-art-cream", opacity = 1 }: { x: number; y: number; size: number; className?: string; opacity?: number }) {
  // The inward pull of each side
  const k = size * 0.12;
  // The star
  return <path className={className} opacity={opacity} d={`M${x} ${y - size}C${x + k} ${y - k} ${x + k} ${y - k} ${x + size} ${y}C${x + k} ${y + k} ${x + k} ${y + k} ${x} ${y + size}C${x - k} ${y + k} ${x - k} ${y + k} ${x - size} ${y}C${x - k} ${y - k} ${x - k} ${y - k} ${x} ${y - size}Z`} />;
}

