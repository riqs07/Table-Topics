// Placeholder for the Story beat, until it is drawn

// Load the kit
import { AppWindow, Backdrop, round, type Cue } from "../kit";

// This beat's sounds
export const STORY_SOUNDS: Cue[] = [];

// The beat
export function Story() {
  // A labelled empty window
  return <><Backdrop /><AppWindow><div style={{ ...round(60), padding: 80 }}>Story</div></AppWindow></>;
}
