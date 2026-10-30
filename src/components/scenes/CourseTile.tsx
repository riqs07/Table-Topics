// Course tiles (decisions 142 and 145): the blob on a bright, tilted rounded square, one tile for each course and each of its lessons, in the flat style of picture-book app art. Every colour is a theme role (the art-* roles, the warm blob and its shade), so the tiles follow each theme and dark mode. Each tile has a slow, small loop (in globals.css, only when motion is welcome); "few" plays it three times and rests, "still" leaves only the blinks. Decorative: the words beside a tile carry the meaning. Each course's drawings are in their own file in tiles/

// Load React's tool for a unique id
import { useId } from "react";
// Load the motion setting from the scenes
import type { SceneMotion } from "@/components/scenes/Scene";
// Load each course's tiles
import { STOP_FREEZING_TILES } from "@/components/scenes/tiles/stopFreezing";
import { EXPLAIN_IT_SIMPLY_TILES } from "@/components/scenes/tiles/explainItSimply";
import { READY_BY_THE_DAY_TILES } from "@/components/scenes/tiles/readyByTheDay";
import { STORIES_THAT_LAND_TILES } from "@/components/scenes/tiles/storiesThatLand";
import { BEYOND_GOOD_YOU_TILES } from "@/components/scenes/tiles/beyondGoodYou";
import { VOICE_LEAN_IN_TILES } from "@/components/scenes/tiles/voiceLeanIn";
// (the second course for each focus area, decision 155)
import { INTERVIEW_READY_TILES } from "@/components/scenes/tiles/interviewReady";
import { TOASTS_AND_TRIBUTES_TILES } from "@/components/scenes/tiles/toastsAndTributes";
import { LISTEN_LIKE_YOU_MEAN_IT_TILES } from "@/components/scenes/tiles/listenLikeYouMeanIt";
import { TELL_IT_AGAIN_TILES } from "@/components/scenes/tiles/tellItAgain";
import { KNOW_YOUR_VOICE_TILES } from "@/components/scenes/tiles/knowYourVoice";
import { THE_TOUGH_QUESTION_TILES } from "@/components/scenes/tiles/theToughQuestion";


// The shaded blob, shared with the videos
export { Body } from "@/components/scenes/tiles/parts";

// Every tile, by name
const TILES = { ...STOP_FREEZING_TILES, ...EXPLAIN_IT_SIMPLY_TILES, ...READY_BY_THE_DAY_TILES, ...STORIES_THAT_LAND_TILES, ...BEYOND_GOOD_YOU_TILES, ...VOICE_LEAN_IN_TILES, ...INTERVIEW_READY_TILES, ...TOASTS_AND_TRIBUTES_TILES, ...LISTEN_LIKE_YOU_MEAN_IT_TILES, ...TELL_IT_AGAIN_TILES, ...KNOW_YOUR_VOICE_TILES, ...THE_TOUGH_QUESTION_TILES };

// The tiles there are
export type CourseTileName = keyof typeof TILES;

// Every tile's name, for the checks and the tile page
export const COURSE_TILE_NAMES = Object.keys(TILES) as CourseTileName[];

// A tile's ground colour role (such as "art-sun"), so a video can keep a tile off a background of the same colour
export function courseTileGround(name: CourseTileName): string {
  // The fill class without its prefix
  return TILES[name].fill.replace(/^fill-/, "");
}

// Draw a tile, sized by the class given
export function CourseTile({ name, motion = "loop", className = "" }: { name: CourseTileName; motion?: SceneMotion; className?: string }) {
  // A clip id unique on the page, safe inside url()
  const clip = `tile-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  // The tile's ground and lean
  const ground = TILES[name];
  // The square drawing, hidden from screen readers, carrying how much it moves (the scene class brings the blinks and the motion settings)
  return (
    <svg aria-hidden="true" data-course-tile={name} data-motion={motion} viewBox="0 0 200 200" fill="none" className={`vl-scene overflow-visible ${className}`}>
      {/* The tile's shape, for keeping background shapes inside it */}
      <defs>
        {/* The clip */}
        <clipPath id={clip}>
          {/* The rounded square */}
          <rect x="14" y="14" width="172" height="172" rx="34" />
        </clipPath>
      </defs>
      {/* Everything leans together */}
      <g transform={`rotate(${ground.tilt} 100 100)`}>
        {/* The ground */}
        <rect className={ground.fill} x="14" y="14" width="172" height="172" rx="34" />
        {/* The drawing */}
        {ground.draw(clip)}
      </g>
    </svg>
  );
}
