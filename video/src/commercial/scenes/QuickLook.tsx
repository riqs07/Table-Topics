// Placeholder for the QuickLook beat, until it is drawn

// Load the kit
import { AppWindow, Backdrop, round, type Cue } from "../kit";

// This beat's sounds
export const QUICK_LOOK_SOUNDS: Cue[] = [];

// The beat
export function QuickLook() {
  // A labelled empty window
  return <><Backdrop /><AppWindow><div style={{ ...round(60), padding: 80 }}>QuickLook</div></AppWindow></>;
}
