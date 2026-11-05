// Course tiles (decisions 142 and 145, and the Illustration Study's richer rendering): the blob on a bright, tilted rounded square, one tile for each course and each of its lessons, in the style of picture-book app art, lit from the upper left with land behind and a fine grain (art/TileFrame.tsx). Every colour is a theme role (the art-* roles, the warm blob and its shade), so the tiles follow each theme and dark mode. Each tile has a slow, small loop (in globals.css, only when motion is welcome); "few" plays it three times and rests, "still" leaves only the blinks. Decorative: the words beside a tile carry the meaning. Each course's drawings are in their own file in tiles/

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
// Load what a tile is
import type { TileDef } from "@/components/scenes/tiles/parts";
// Load the lit frame
import { TileFrame } from "@/components/scenes/art/TileFrame";


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
  // The tile's ground, lean, land and drawing
  const tile: TileDef = TILES[name];
  // The tile in its lit frame (light, land and grain; art/TileFrame.tsx), hidden from screen readers
  return (
    <TileFrame id={clip} fill={tile.fill} tilt={tile.tilt} land={tile.land} motion={motion} className={className} data={{ "data-course-tile": name }}>
      {/* The drawing */}
      {(id) => tile.draw(id)}
    </TileFrame>
  );
}
