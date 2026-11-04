// Placeholder for the Opening beat, until it is drawn

// Load the kit
import { AppWindow, Backdrop, round, type Cue } from "../kit";

// This beat's sounds
export const OPENING_SOUNDS: Cue[] = [];

// The beat
export function Opening() {
  // A labelled empty window
  return <><Backdrop /><AppWindow><div style={{ ...round(60), padding: 80 }}>Opening</div></AppWindow></>;
}
