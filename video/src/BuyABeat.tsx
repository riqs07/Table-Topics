// "Buy a beat" as a vertical short (proof of concept, decision 143): the blob talks through lesson 1 of Stop freezing, with props, word-by-word captions and an end card. Timings come from the voiceover (scripts/prepare.mjs)

// Load React's tools
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
// Load Remotion's building blocks
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
// Load the app's course tiles
import { CourseTile } from "@/components/scenes/CourseTile";
// Load the talking blob
import { TalkingBlob, type Mood } from "./TalkingBlob";
// Load the theme as CSS, and the helper for inline colours
import { THEME_CSS, role, tint } from "./theme";
// Load the app's scene animations as plain CSS
import "./generated/scene.css";
// Load the voiceover's phrases and loudness
import voice from "./generated/voice.json";

// The colour roles the backgrounds use (never the same as a tile shown on them: the lesson tile is leaf green)
type Ground = "art-sky" | "art-plum" | "art-sun" | "art-leaf" | "art-bloom";

// Each spoken phrase: its words, the blob's mood and the background (in the order spoken; prepare.mjs finds the same number of phrases)
const SCRIPT: ReadonlyArray<{ text: string; mood: Mood; ground: Ground }> = [
  // The set-up
  { text: "Someone asks you a question you didn’t see coming.", mood: "wow", ground: "art-sky" },
  // (the panic)
  { text: "And your brain goes…", mood: "up", ground: "art-sky" },
  // The fillers
  { text: "Um, so, uh…", mood: "worried", ground: "art-plum" },
  // The turn
  { text: "Here’s the thing.", mood: "ready", ground: "art-sun" },
  // The idea
  { text: "A pause sounds sure.", mood: "ready", ground: "art-sun" },
  // (the contrast)
  { text: "An “um” sounds lost.", mood: "worried", ground: "art-sun" },
  // The lesson's name
  { text: "So buy a beat.", mood: "happy", ground: "art-plum" },
  // What to do
  { text: "Take one breath before your first word.", mood: "closed", ground: "art-leaf" },
  // Why it works
  { text: "Silence feels long to you, and short to everyone else.", mood: "ready", ground: "art-sky" },
  // The call to try it
  { text: "Try it on your next answer.", mood: "happy", ground: "art-bloom" },
];

// Stop the render with a clear message if the voiceover's phrases no longer match the script
if (voice.phrases.length !== SCRIPT.length) throw new Error(`The voiceover has ${voice.phrases.length} phrases but the script has ${SCRIPT.length}: re-run scripts/prepare.mjs or adjust the silence settings`);

// The end card's length in seconds, after the voice
export const END_SECONDS = 2.8;
// The whole video's length in frames
export const DURATION_FRAMES = Math.ceil((voice.duration + END_SECONDS) * voice.fps);

// The display face and the body face
const DISPLAY = "'Fraunces Variable', Georgia, serif";
// (body)
const BODY = "Atkinson, system-ui, sans-serif";

// Keep the app's CSS animations (the tiles' loops) in step with the frame being drawn: pause them and set their time from the frame, so every render is the same
function Synced({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  // This stretch's frame, and the frame rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The wrapper
  const ref = useRef<HTMLDivElement>(null);
  // On every frame, before it is drawn
  useLayoutEffect(() => {
    // Each animation inside
    for (const animation of ref.current?.getAnimations({ subtree: true }) ?? []) {
      // Held still
      animation.pause();
      // At this frame's time
      animation.currentTime = (frame / fps) * 1000;
    }
  }, [frame, fps]);
  // The wrapper around the drawing
  return <div ref={ref} style={style}>{children}</div>;
}

// Which phrase is on at a time in seconds (the last one started), or -1 before the first
function phraseAt(seconds: number): number {
  // The last phrase whose start has passed
  return voice.phrases.reduce((found, phrase, index) => (seconds >= phrase.start ? index : found), -1);
}

// A spring from a moment, for things popping in
function useSpringFrom(seconds: number, damping = 12): number {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The spring's progress, 0 before the moment
  return spring({ frame: frame - Math.round(seconds * fps), fps, config: { damping } });
}

// How far a thing is shown between two moments: popping in at the first and shrinking away quickly at the second
function usePresence(from: number, to: number): number {
  // The time now
  const seconds = useCurrentFrame() / useVideoConfig().fps;
  // In with a spring, out in a fifth of a second (a slow exit leaves specks behind the next part)
  const shown = Math.min(useSpringFrom(from), interpolate(seconds, [to, to + 0.2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  // Never below none
  return Math.max(0, shown);
}

// Something placed by its middle at x, y on the 1080 by 1920 frame, scaled and turned
function Place({ x, y, scale = 1, rotate = 0, children }: { x: number; y: number; scale?: number; rotate?: number; children: ReactNode }) {
  // Absolutely placed, centred on its point
  return <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)` }}>{children}</div>;
}

// A cream speech bubble holding a word or sign
function Bubble({ children, color, size = 220 }: { children: ReactNode; color: string; size?: number }) {
  // The rounded bubble with a little tail, and its content in the display face
  return (
    <div style={{ position: "relative", minWidth: size, height: size * 0.8, padding: "0 40px", borderRadius: size * 0.3, background: role("art-cream"), color, fontFamily: DISPLAY, fontWeight: 700, fontSize: size * 0.42, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 12px 0 ${tint("on-warm", 8)}` }}>
      {/* The content */}
      {children}
      {/* The tail */}
      <div style={{ position: "absolute", bottom: -size * 0.12, left: "28%", width: size * 0.22, height: size * 0.22, background: role("art-cream"), transform: "rotate(45deg)", borderRadius: 8 }} />
    </div>
  );
}

// A small cream label, such as "sounds sure"
function Chip({ children }: { children: ReactNode }) {
  // Rounded, in the body face
  return <div style={{ padding: "14px 34px", borderRadius: 999, background: role("art-cream"), color: role("on-warm"), fontFamily: BODY, fontWeight: 700, fontSize: 44, whiteSpace: "nowrap" }}>{children}</div>;
}

// The background: each phrase's colour fading in over the last, with two soft circles drifting
function Background({ seconds }: { seconds: number }) {
  // The circles' slow drift
  const drift = Math.sin(seconds * 0.6) * 30;
  // The layers
  return (
    <AbsoluteFill>
      {/* Each phrase's colour, fading in over a fifth of a second at its start */}
      {SCRIPT.map((line, index) => <AbsoluteFill key={line.text} style={{ background: role(line.ground), opacity: interpolate(seconds, [voice.phrases[index]!.start - 0.2, voice.phrases[index]!.start], [index === 0 ? 1 : 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }} />)}
      {/* A lighter circle, upper right */}
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", right: -380 + drift, top: -260, background: role("art-cream"), opacity: 0.12 }} />
      {/* A darker circle, lower left */}
      <div style={{ position: "absolute", width: 760, height: 760, borderRadius: "50%", left: -340, bottom: -200 - drift, background: role("on-warm"), opacity: 0.07 }} />
    </AbsoluteFill>
  );
}

// The words of the phrase on screen, the one being said picked out
function Captions({ seconds }: { seconds: number }) {
  // The phrase on now
  const index = phraseAt(seconds);
  // Its pop when it starts
  const pop = useSpringFrom(voice.phrases[Math.max(0, index)]!.start, 14);
  // Nothing before the first phrase
  if (index < 0) return null;
  // Its timing and words
  const [phrase, words] = [voice.phrases[index]!, SCRIPT[index]!.text.split(" ")];
  // How far through the phrase, by letters, so longer words take longer
  const through = interpolate(seconds, [phrase.start, phrase.end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * words.join("").length;
  // The word being said: the first whose letters run past that point
  let [said, total] = [words.length - 1, 0];
  // (each word in turn)
  for (const [position, word] of words.entries()) {
    // Add its letters
    total += word.length;
    // Stop at the first that reaches the point
    if (total >= through) { said = position; break; }
  }
  // The cream box near the bottom, clear of the apps' buttons
  return (
    <div style={{ position: "absolute", left: 90, right: 150, top: 1330, display: "flex", justifyContent: "center", transform: `scale(${0.9 + pop * 0.1})`, opacity: pop }}>
      {/* The box */}
      <div style={{ padding: "26px 44px", borderRadius: 44, background: role("art-cream"), color: role("on-warm"), fontFamily: DISPLAY, fontWeight: 650, fontSize: 74, lineHeight: 1.14, textAlign: "center", letterSpacing: -1 }}>
        {/* Each word, the one being said in the accent */}
        {words.map((word, position) => <span key={position} style={{ color: position === said ? role("accent") : undefined }}>{word}{position < words.length - 1 ? " " : ""}</span>)}
      </div>
    </div>
  );
}

// The props for each part, popping in and out with the voice
function Props({ seconds }: { seconds: number }) {
  // The phrases' start times, by number
  const at = (index: number) => voice.phrases[index]!.start;
  // The question bubble, from the first phrase until the fillers
  const question = usePresence(at(0) + 0.2, at(2));
  // The thinking dots, during the second phrase
  const thinking = usePresence(at(1), at(2));
  // The three fillers, one after another, gone at the turn
  const fillers = [usePresence(at(2), at(3)), usePresence(at(2) + 0.75, at(3)), usePresence(at(2) + 1.5, at(3))];
  // The pause sign and the "um", from their phrases until the lesson's name
  const [pause, um] = [usePresence(at(4), at(6)), usePresence(at(5), at(6))];
  // The two bars, during the last idea
  const bars = usePresence(at(8), at(9));
  // How full the bars are: "to you" fills slowly, "to everyone else" quickly once it is said
  const [mine, theirs] = [interpolate(seconds, [at(8), at(8) + 2.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), interpolate(seconds, [at(8) + 1.7, at(8) + 2.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })];
  // The props
  return (
    <>
      {/* The question coming at you */}
      <Place x={820} y={430} scale={question} rotate={8 + Math.sin(seconds * 3) * 3}><Bubble color={role("art-coral")}>?</Bubble></Place>
      {/* Thinking: three dots in turn */}
      {[0, 1, 2].map((dot) => <Place key={dot} x={420 + dot * 70} y={470} scale={thinking * (0.7 + 0.3 * Math.abs(Math.sin(seconds * 4 + dot)))}><div style={{ width: 40, height: 40, borderRadius: "50%", background: role("art-cream") }} /></Place>)}
      {/* The fillers, wobbling */}
      {(["um", "so", "uh"] as const).map((word, index) => <Place key={word} x={[230, 850, 860][index]!} y={[520, 470, 1110][index]!} scale={fillers[index]!} rotate={Math.sin(seconds * 5 + index) * 8}><Bubble color={role("art-plum")} size={200}>{word}</Bubble></Place>)}
      {/* The pause sign: sounds sure */}
      <Place x={290} y={430} scale={pause}>
        {/* The sign and its label */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          {/* The disc and its bars */}
          <svg width="230" height="230" viewBox="0 0 100 100"><circle className="fill-art-coral" cx="50" cy="50" r="48" /><rect className="fill-art-cream" x="33" y="28" width="12" height="44" rx="5" /><rect className="fill-art-cream" x="55" y="28" width="12" height="44" rx="5" /></svg>
          {/* The label */}
          <Chip>sounds sure ✓</Chip>
        </div>
      </Place>
      {/* The "um": sounds lost */}
      <Place x={800} y={430} scale={um} rotate={Math.sin(seconds * 4) * 6}>
        {/* The bubble and its label */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
          {/* The bubble */}
          <Bubble color={role("art-plum")} size={190}>um</Bubble>
          {/* The label */}
          <Chip>sounds lost</Chip>
        </div>
      </Place>
      {/* Silence: long to you, short to them */}
      <div style={{ position: "absolute", left: 90, top: 300, width: 860, opacity: bars, transform: `translateY(${(1 - bars) * 40}px)` }}>
        {/* Each bar: its label, its track and its fill */}
        {([["To you", mine, 1, "art-coral"], ["To everyone else", theirs, 0.3, "art-leaf"]] as const).map(([label, fill, length, color]) => (
          <div key={label} style={{ marginBottom: 46 }}>
            {/* The label */}
            <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 62, color: role("art-cream"), marginBottom: 16 }}>{label}</div>
            {/* The track */}
            <div style={{ height: 70, borderRadius: 35, background: tint("art-cream", 22) }}>
              {/* The fill */}
              <div style={{ height: "100%", width: `${fill * length * 100}%`, borderRadius: 35, background: role(color) }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// The blob's place, size and how much it shows in each part
function blobPlace(index: number): { x: number; y: number; size: number; show: number } {
  // The lesson's name: the tile takes over
  if (index === 6) return { x: 540, y: 900, size: 420, show: 0 };
  // The bars: lower and smaller
  if (index === 8) return { x: 540, y: 1000, size: 420, show: 1 };
  // Otherwise centre stage
  return { x: 540, y: 860, size: 580, show: 1 };
}

// The talking blob, moving between its places, its mouth following the voice
function Star({ seconds }: { seconds: number }) {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The phrase on now, and the one before
  const index = Math.max(0, phraseAt(seconds));
  // Where it was and where it is going
  const [from, to] = [blobPlace(Math.max(0, index - 1)), blobPlace(index)];
  // How far along the move, springing from the phrase's start
  const move = useSpringFrom(voice.phrases[index]!.start, 16);
  // Each measure part-way
  const mix = (key: "x" | "y" | "size" | "show") => from[key] + (to[key] - from[key]) * move;
  // The loudness around this frame, smoothed, as how open the mouth is
  const level = ((voice.loudness[frame - 2] ?? 0) + (voice.loudness[frame - 1] ?? 0) * 2 + (voice.loudness[frame] ?? 0) * 3 + (voice.loudness[frame + 1] ?? 0) * 2 + (voice.loudness[frame + 2] ?? 0)) / 9;
  // Speaking while inside a phrase
  const speaking = seconds >= voice.phrases[index]!.start && seconds <= voice.phrases[index]!.end;
  // How open: never quite shut while speaking (so it does not flick to the resting smile between syllables), wider when louder
  const open = speaking ? Math.min(1, 0.1 + Math.max(0, (level - 0.008) / 0.07)) : 0;
  // The mood: the phrase's
  const mood = SCRIPT[index]!.mood;
  // A blink now and then
  const blink = frame % 104 < 4;
  // Breathing in and out during "take one breath"
  const breath = index === 7 ? 1 + 0.07 * Math.sin(Math.PI * Math.min(1, (seconds - voice.phrases[7]!.start) / 2.2)) : 1;
  // A gentle bob
  const bob = Math.sin((seconds * Math.PI * 2) / 2.4) * 10;
  // Placed and drawn
  return (
    <Place x={mix("x")} y={mix("y") + bob} scale={mix("show")}>
      <TalkingBlob size={mix("size")} open={open} mood={mood} blink={blink && mood !== "closed" && mood !== "happy"} breath={breath} wave={index === 9 ? Math.sin(seconds * 9) * 0.5 + 0.5 : 0} />
    </Place>
  );
}

// The lesson's tile, centre stage while its name is said and the breath is shown
function LessonTile() {
  // Shown from the lesson's name until the breath
  const shown = usePresence(voice.phrases[6]!.start, voice.phrases[7]!.start);
  // Turning in as it pops
  return (
    <Place x={540} y={800} scale={shown} rotate={(1 - shown) * -12}>
      {/* The label and the tile */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
        {/* Which lesson */}
        <Chip>Lesson 1 · Stop freezing</Chip>
        {/* The tile, its own loop kept in step */}
        <Synced><CourseTile name="buy-a-beat" /></Synced>
      </div>
      {/* The tile's size (set here so the app's sizing classes are not needed) */}
      <style>{`[data-course-tile="buy-a-beat"] { width: 620px; height: 620px; }`}</style>
    </Place>
  );
}

// The top line: the app's name and the course, shown over every part
function TopLine() {
  // In the safe area under the apps' own top bars
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 150, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      {/* The name */}
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 56, color: role("art-cream") }}>VoiceLab</div>
      {/* The course */}
      <div style={{ padding: "10px 26px", borderRadius: 999, background: tint("art-cream", 22), color: role("art-cream"), fontFamily: BODY, fontWeight: 700, fontSize: 34 }}>Stop freezing · 1</div>
    </div>
  );
}

// The end card: the course's tile, the app's name, and where to try it
function EndCard({ seconds }: { seconds: number }) {
  // Popping in once the voice is done
  const shown = useSpringFrom(voice.duration + 0.1, 14);
  // The card over everything
  return (
    <AbsoluteFill style={{ background: role("paper"), opacity: Math.min(1, shown * 1.5), alignItems: "center", justifyContent: "center", gap: 36 }}>
      {/* The course's tile */}
      <div style={{ transform: `scale(${shown}) rotate(${(1 - shown) * 10}deg)` }}><Synced><CourseTile name="stop-freezing" /></Synced></div>
      {/* The tile's size */}
      <style>{`[data-course-tile="stop-freezing"] { width: 520px; height: 520px; }`}</style>
      {/* The app's name */}
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 120, color: role("ink"), letterSpacing: -2 }}>VoiceLab</div>
      {/* The course and lesson */}
      <div style={{ fontFamily: BODY, fontSize: 48, color: role("ink-muted") }}>Stop freezing · Lesson 1: Buy a beat</div>
      {/* Where to try it */}
      <div style={{ marginTop: 20, padding: "22px 48px", borderRadius: 999, background: role("fill"), color: role("fill-ink"), fontFamily: BODY, fontWeight: 700, fontSize: 48, opacity: interpolate(seconds, [voice.duration + 0.6, voice.duration + 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>Practise it out loud</div>
    </AbsoluteFill>
  );
}

// The whole video
export function BuyABeat() {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The time in seconds
  const seconds = frame / fps;
  // The layers, back to front
  return (
    <AbsoluteFill style={{ fontFamily: BODY }}>
      {/* The theme's colours and classes */}
      <style>{THEME_CSS}</style>
      {/* The voice */}
      <Audio src={staticFile("take-a.mp3")} />
      {/* The background */}
      <Background seconds={seconds} />
      {/* The app's name and course */}
      <TopLine />
      {/* The props */}
      <Props seconds={seconds} />
      {/* The lesson's tile */}
      <LessonTile />
      {/* The blob */}
      <Star seconds={seconds} />
      {/* The captions */}
      <Captions seconds={seconds} />
      {/* The end card, once the voice is done */}
      {seconds > voice.duration && <EndCard seconds={seconds} />}
    </AbsoluteFill>
  );
}
