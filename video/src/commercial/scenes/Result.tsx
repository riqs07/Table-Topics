// Placeholder for the Result beat, until it is drawn

// Load the kit
import { AppWindow, Backdrop, round, type Cue } from "../kit";

// This beat's sounds
export const RESULT_SOUNDS: Cue[] = [];

// The beat
export function Result() {
  // A labelled empty window
  return <><Backdrop /><AppWindow><div style={{ ...round(60), padding: 80 }}>Result</div></AppWindow></>;
}
