// VoiceLab's 45-second commercial for the website (1920 by 1080): the moment your mind goes blank, then the app (direction B) showing what it does as if live, then progress you can hear, ending on "Join the waitlist"
// Each beat is its own scene in ./scenes; this file places them in time with a short cross-fade, and lays the voiceover, the music, the sounds and the captions over them

// Load Remotion's tools
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
// Load the timing, the kit and the beats
import { CAPTIONS, LENGTH, VOICE } from "./timeline";
import { Caption, s, type Cue } from "./kit";
import { Opening, OPENING_SOUNDS } from "./scenes/Opening";
import { Recording, RECORDING_SOUNDS } from "./scenes/Recording";
import { Result, RESULT_SOUNDS } from "./scenes/Result";
import { Story, STORY_SOUNDS } from "./scenes/Story";
import { Talk, TALK_SOUNDS } from "./scenes/Talk";
import { HowItWent, HOW_IT_WENT_SOUNDS } from "./scenes/HowItWent";
import { QuickLook, QUICK_LOOK_SOUNDS } from "./scenes/QuickLook";
import { ThenNow, THEN_NOW_SOUNDS } from "./scenes/ThenNow";
import { EndCard, END_CARD_SOUNDS } from "./scenes/EndCard";

// The video's length in frames
export const COMMERCIAL_FRAMES = s(LENGTH);
// Frames each scene overlaps the next, under its fade-in
const OVERLAP = 6;

// The beats in order: each scene, its start and end in seconds, and its sounds (in seconds from its own start)
const BEATS = [
  { Scene: Opening, from: 0, to: 12.6, sounds: OPENING_SOUNDS },
  { Scene: Recording, from: 12.6, to: 17.4, sounds: RECORDING_SOUNDS },
  { Scene: Result, from: 17.4, to: 21.6, sounds: RESULT_SOUNDS },
  { Scene: Story, from: 21.6, to: 26.4, sounds: STORY_SOUNDS },
  { Scene: Talk, from: 26.4, to: 31.0, sounds: TALK_SOUNDS },
  { Scene: HowItWent, from: 31.0, to: 35.0, sounds: HOW_IT_WENT_SOUNDS },
  { Scene: QuickLook, from: 35.0, to: 39.4, sounds: QUICK_LOOK_SOUNDS },
  { Scene: ThenNow, from: 39.4, to: 43.4, sounds: THEN_NOW_SOUNDS },
  { Scene: EndCard, from: 43.4, to: LENGTH, sounds: END_CARD_SOUNDS },
];

// How loud each sound is
const SOUND_VOLUME: Record<Cue["sound"], number> = { pop: 0.5, tap: 0.6, chime: 0.35, tick: 0.45 };

// A scene fading in over the one before during its first frames
function FadeIn({ children }: { children: React.ReactNode }) {
  // The frame within the scene
  const frame = useCurrentFrame();
  // Its opacity
  const opacity = interpolate(frame, [0, OVERLAP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // The scene, fading in
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
}

// Whether the voice is speaking at a frame (for lowering the music under it)
const speaking = (frame: number): boolean => VOICE.some((piece) => frame >= s(piece.at) - 6 && frame <= s(piece.at + piece.to - piece.from) + 6);

// The commercial
export function Commercial() {
  // The whole video
  return (
    <AbsoluteFill style={{ background: "#f6eadb" }}>
      {/* The beats, each held a few frames into the next so the cross-fade has something under it */}
      {BEATS.map(({ Scene, from, to }, index) => (
        <Sequence key={index} from={s(from)} durationInFrames={s(to - from) + (index < BEATS.length - 1 ? OVERLAP : 0)}>
          {index === 0 ? <Scene /> : <FadeIn><Scene /></FadeIn>}
        </Sequence>
      ))}
      {/* The captions */}
      {CAPTIONS.map((line, index) => <Caption key={index} text={line.text} from={s(line.from)} to={s(line.to)} />)}
      {/* The music bed: quiet, lower still under the voice, fading in and out */}
      <Audio src={staticFile("commercial/music.mp3")} volume={(frame) => (speaking(frame) ? 0.16 : 0.26) * interpolate(frame, [0, 30, COMMERCIAL_FRAMES - 45, COMMERCIAL_FRAMES], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {/* The voiceover, piece by piece */}
      {VOICE.map((piece, index) => (
        <Sequence key={`v${index}`} from={s(piece.at)} durationInFrames={s(piece.to - piece.from) + 2}>
          <Audio src={staticFile("commercial/voice.mp3")} startFrom={s(piece.from)} endAt={s(piece.to)} />
        </Sequence>
      ))}
      {/* Each beat's sounds */}
      {BEATS.flatMap(({ from, sounds }, beat) => sounds.map((cue, index) => (
        <Sequence key={`s${beat}-${index}`} from={s(from + cue.at)} durationInFrames={s(1.4)}>
          <Audio src={staticFile(`commercial/${cue.sound}.wav`)} volume={SOUND_VOLUME[cue.sound]} />
        </Sequence>
      )))}
    </AbsoluteFill>
  );
}
