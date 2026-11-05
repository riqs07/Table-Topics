// The frame every tile is drawn in (course tiles and mode tiles), in the Illustration Study's richer rendering: a soft shadow under the leaning tile, its ground lit from the upper left, the sun's glow, two layers of land (far lighter, near deeper), the drawing, and a fine grain over it all. Still one ground colour per tile, so it reads at 64 px

// Load React's node type
import type { ReactNode } from "react";
// Load the light, the land and the grain
import { ArtDefs, Glow, Grain, Land, litStyle, tone, type ArtRole } from "@/components/scenes/art/light";
// Load the motion setting
import type { SceneMotion } from "@/components/scenes/Scene";

// The tile's rounded square on the 200 square
const SQUARE = { x: 14, y: 14, width: 172, height: 172, rx: 34 };

// What the frame takes
interface TileFrameProps {
  // The id the clip and the light share (unique on the page, safe in url())
  id: string;
  // The ground's fill class (an art role's, such as fill-art-sky)
  fill: string;
  // The lean in degrees
  tilt: number;
  // The land behind the drawing
  land?: "hills" | "none";
  // How much it moves
  motion: SceneMotion;
  // Size classes
  className?: string;
  // Data attributes naming the tile, for checks
  data: Record<string, string | undefined>;
  // The drawing, given the clip id, leaning with the ground
  children: (clip: string) => ReactNode;
  // Drawn after the lean, upright (mode tiles keep their prop and blob straight)
  upright?: ReactNode;
}

// Draw a tile in its frame
export function TileFrame({ id, fill, tilt, land = "hills", motion, className = "", data, children, upright }: TileFrameProps) {
  // The ground's colour role, from its fill class
  const ground = fill.replace(/^fill-/, "") as ArtRole;
  // The square drawing, hidden from screen readers, carrying how much it moves (the scene class brings the blinks and the motion settings), lit for its blobs
  return (
    <svg aria-hidden="true" {...data} data-motion={motion} viewBox="0 0 200 200" fill="none" className={`vl-scene overflow-visible ${className}`} style={litStyle(id)}>
      <defs>
        {/* The tile's shape, for keeping background shapes inside it */}
        <clipPath id={id}>
          {/* The rounded square */}
          <rect {...SQUARE} />
        </clipPath>
        {/* The light, the ground's gradient and the grain */}
        <ArtDefs id={id} ground={ground} />
      </defs>
      {/* Everything leans together */}
      <g transform={`rotate(${tilt} 100 100)`}>
        {/* A soft shadow under the tile, cast down and right, away from the light */}
        <rect className="fill-on-warm" {...SQUARE} x={17} y={20} opacity={0.1} />
        {/* The ground in its own colour (the tile's role, for anything reading it) */}
        <rect className={fill} {...SQUARE} />
        {/* The same ground, lit from the upper left */}
        <rect {...SQUARE} fill={`url(#${id}-ground)`} />
        {/* The sun's glow from the upper left */}
        <g clipPath={`url(#${id})`}>
          {/* The glow */}
          <Glow id={id} x={36} y={30} r={120} />
          {/* The land: a far hill, lighter, and the near ground, deeper */}
          {land === "hills" && (
            <>
              {/* Far */}
              <Land width={200} height={200} y={150} rise={22} seed={1} color={tone("art-cream", 0)} opacity={0.2} />
              {/* Near */}
              <Land width={200} height={200} y={172} rise={10} seed={3} color={tone(ground, -0.3)} opacity={0.55} />
            </>
          )}
        </g>
        {/* The drawing */}
        {children(id)}
      </g>
      {/* Drawn upright */}
      {upright}
      {/* The grain over the tile, leaning with it */}
      <g transform={`rotate(${tilt} 100 100)`}>
        {/* The specks */}
        <Grain id={id} x={14} y={14} width={172} height={172} clip={id} />
      </g>
    </svg>
  );
}
