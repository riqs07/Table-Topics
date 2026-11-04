// Placeholder for the HowItWent beat, until it is drawn

// Load the kit
import { AppWindow, Backdrop, round, type Cue } from "../kit";

// This beat's sounds
export const HOW_IT_WENT_SOUNDS: Cue[] = [];

// The beat
export function HowItWent() {
  // A labelled empty window
  return <><Backdrop /><AppWindow><div style={{ ...round(60), padding: 80 }}>HowItWent</div></AppWindow></>;
}
