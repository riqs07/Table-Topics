// Placeholder for the Talk beat, until it is drawn

// Load the kit
import { AppWindow, Backdrop, round, type Cue } from "../kit";

// This beat's sounds
export const TALK_SOUNDS: Cue[] = [];

// The beat
export function Talk() {
  // A labelled empty window
  return <><Backdrop /><AppWindow><div style={{ ...round(60), padding: 80 }}>Talk</div></AppWindow></>;
}
