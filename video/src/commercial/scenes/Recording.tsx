// Placeholder for the Recording beat, until it is drawn

// Load the kit
import { AppWindow, Backdrop, round, type Cue } from "../kit";

// This beat's sounds
export const RECORDING_SOUNDS: Cue[] = [];

// The beat
export function Recording() {
  // A labelled empty window
  return <><Backdrop /><AppWindow><div style={{ ...round(60), padding: 80 }}>Recording</div></AppWindow></>;
}
