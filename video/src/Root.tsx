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
// Load the panels of Sage's character sheet (stills)
import { SHEET_PANELS } from "./characters/SageSheet";
// Load the storyboard of hooks for the "quiet in meetings" ad
import { HOOKS, HookSheet, SHEET_HEIGHT, SHEET_WIDTH } from "./hooks/HookStoryboard";
// Load the "quiet in meetings" ad and its length
import { QuietInMeetings, adFrames } from "./ads/QuietInMeetings";
// Load the spotlight trial of the ad's hook and its length
import { SPOTLIGHT_HOOK_FRAMES, SpotlightHook } from "./ads/SpotlightHook";
// Load the two meeting looks for the hook (stills for choosing)
import { CallHook, MeetingRoom, VideoCall } from "./ads/MeetingLooks";
// Load the "their values" ad and its length
import { TheirValues, valuesFrames } from "./ads/TheirValues";

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
      {/* Sage's character sheet, one still per panel */}
      {SHEET_PANELS.map((panel) => <Composition key={panel.id} id={panel.id} component={panel.component} durationInFrames={1} fps={30} width={panel.width} height={panel.height} />)}
      {/* The "quiet in meetings" ad's hook storyboard: each hook's three stills, full size */}
      {HOOKS.flatMap((hook) => hook.stills.map((still, index) => <Composition key={`${hook.id}${index}`} id={`hook-${hook.id}${index + 1}`} component={still} durationInFrames={1} fps={30} width={1080} height={1920} />))}
      {/* The "quiet in meetings" social ad (a silent preview until its voiceover is made) */}
      <Composition id="ad-quiet-in-meetings" component={QuietInMeetings} durationInFrames={adFrames()} fps={30} width={1080} height={1920} />
      {/* The spotlight trial of the ad's hook */}
      <Composition id="ad-spotlight-hook" component={SpotlightHook} durationInFrames={SPOTLIGHT_HOOK_FRAMES} fps={30} width={1080} height={1920} />
      {/* The meeting-room look, at the start of the hook and at its turn */}
      {[0.9, 3.6].map((t, index) => <Composition key={`room${index}`} id={`look-room-${index + 1}`} component={MeetingRoom} defaultProps={{ t }} durationInFrames={1} fps={30} width={1080} height={1920} />)}
      {/* The video-call look, at the same two moments */}
      {[0.9, 3.6].map((t, index) => <Composition key={`call${index}`} id={`look-call-${index + 1}`} component={VideoCall} defaultProps={{ t }} durationInFrames={1} fps={30} width={1080} height={1920} />)}
      {/* Hook B as a clip: the video call */}
      <Composition id="ad-call-hook" component={CallHook} durationInFrames={SPOTLIGHT_HOOK_FRAMES} fps={30} width={1080} height={1920} />
      {/* The "their values" social ad (a silent preview until its voiceover is made) */}
      <Composition id="ad-their-values" component={TheirValues} durationInFrames={valuesFrames()} fps={30} width={1080} height={1920} />
      {/* (and all of them on one sheet) */}
      <Composition id="hook-sheet" component={HookSheet} durationInFrames={1} fps={30} width={SHEET_WIDTH} height={SHEET_HEIGHT} />
    </>
  );
}
