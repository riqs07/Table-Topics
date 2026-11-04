// Placeholder for the ThenNow beat, until it is drawn

// Load the kit
import { AppWindow, Backdrop, round, type Cue } from "../kit";

// This beat's sounds
export const THEN_NOW_SOUNDS: Cue[] = [];

// The beat
export function ThenNow() {
  // A labelled empty window
  return <><Backdrop /><AppWindow><div style={{ ...round(60), padding: 80 }}>ThenNow</div></AppWindow></>;
}
