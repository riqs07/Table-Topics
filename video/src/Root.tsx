// The videos Remotion can render, and the fonts they wait for

// Load Remotion's composition and its tools for waiting on fonts
import { Composition, continueRender, delayRender } from "remotion";
// Load the display face (Fraunces, as in the app)
import "@fontsource-variable/fraunces";
// Load the app's own body face file
import atkinson from "@/theme/fonts/AtkinsonHyperlegibleNext-OpenZero.woff2";
// Load the first video and its length
import { BuyABeat, DURATION_FRAMES } from "./BuyABeat";
// Load the course shorts, their length and their list (decision 145)
import { CourseShort, SHORT_FRAMES } from "./CourseShort";
import { SHORTS } from "./shorts";

// Hold the render until both faces are ready, so no frame is drawn in a fallback font
const waiting = delayRender("Loading fonts");
// The body face, from the app's file
const body = new FontFace("Atkinson", `url(${atkinson})`, { weight: "200 800" });
// Load it and the display face, then carry on (a failure still carries on, in the fallback fonts)
void Promise.all([body.load().then((face) => document.fonts.add(face)), document.fonts.load("700 74px 'Fraunces Variable'")]).finally(() => continueRender(waiting));

// The compositions
export function Root() {
  // Every video: vertical, 1080 by 1920, 30 frames a second
  return (
    <>
      {/* "Buy a beat" */}
      <Composition id="BuyABeat" component={BuyABeat} durationInFrames={DURATION_FRAMES} fps={30} width={1080} height={1920} />
      {/* Each course's 15-second short, named after the course */}
      {SHORTS.map((short) => <Composition key={short.id} id={`short-${short.id}`} component={CourseShort} defaultProps={{ id: short.id }} durationInFrames={SHORT_FRAMES} fps={30} width={1080} height={1920} />)}
    </>
  );
}
