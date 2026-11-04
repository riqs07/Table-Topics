// Placeholder for the EndCard beat, until it is drawn

// Load the kit
import { AppWindow, Backdrop, round, type Cue } from "../kit";

// This beat's sounds
export const END_CARD_SOUNDS: Cue[] = [];

// The beat
export function EndCard() {
  // A labelled empty window
  return <><Backdrop /><AppWindow><div style={{ ...round(60), padding: 80 }}>EndCard</div></AppWindow></>;
}
