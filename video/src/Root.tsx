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
import { CourseShort, shortFrames } from "./CourseShort";
import { SHORTS } from "./shorts";
// Load the lesson clips, their frame and their lengths (decisions 146 and 147)
import { LESSON_HEIGHT, LESSON_WIDTH, LessonClip, clipFrames } from "./lessons/LessonClip";
import { LESSON_CLIPS } from "./lessons/clips";
// Load the lesson voiceovers made so far, so a clip without one is left out
import voices from "./generated/lessons/index.json";
// Load the two-person demo and its length (a one-off test)
import { TWO_PEOPLE_FRAMES, TwoPeople } from "./demo/TwoPeople";

// Hold the render until both faces are ready, so no frame is drawn in a fallback font
const waiting = delayRender("Loading fonts");
// The body face, from the app's file
const body = new FontFace("Atkinson", `url(${atkinson})`, { weight: "200 800" });
// Load it and the display face, then carry on (a failure still carries on, in the fallback fonts)
void Promise.all([body.load().then((face) => document.fonts.add(face)), document.fonts.load("700 74px 'Fraunces Variable'")]).finally(() => continueRender(waiting));

// The compositions
export function Root() {
  // Every video at 30 frames a second: the shorts vertical, 1080 by 1920
  return (
    <>
      {/* "Buy a beat" */}
      <Composition id="BuyABeat" component={BuyABeat} durationInFrames={DURATION_FRAMES} fps={30} width={1080} height={1920} />
      {/* Each course's 15-second short, named after the course */}
      {SHORTS.map((short) => <Composition key={short.id} id={`short-${short.id}`} component={CourseShort} defaultProps={{ id: short.id }} durationInFrames={shortFrames(short.id)} fps={30} width={1080} height={1920} />)}
      {/* The lesson clips: 4:5, for a part's "See it" step */}
      {LESSON_CLIPS.filter((clip) => clip.id in voices).map((clip) => <Composition key={clip.id} id={`lesson-${clip.id}`} component={LessonClip} defaultProps={{ id: clip.id }} durationInFrames={clipFrames(clip.id)} fps={30} width={LESSON_WIDTH} height={LESSON_HEIGHT} />)}
      {/* The two-person demo: landscape, 1920 by 1080 */}
      <Composition id="TwoPeople" component={TwoPeople} durationInFrames={TWO_PEOPLE_FRAMES} fps={30} width={1920} height={1080} />
    </>
  );
}
