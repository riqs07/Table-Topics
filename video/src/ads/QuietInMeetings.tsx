// The "quiet in meetings" social ad: a 1080 by 1920, roughly 30-second short for people who go quiet in meetings. The hook happens on a video call (your idea, Sam gets the credit); then the blob explains why with a chart of one study (Anderson & Kilduff, 2009) and what to do instead (McClean et al., 2018). Its lines are timed from the voice's own pauses, as the lesson clips are

// Load React's node type
import type { ReactNode } from "react";
// Load Remotion's building blocks
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
// Load the app's course tiles
import { CourseTile } from "@/components/scenes/CourseTile";
// Load the drawing pieces shared with the hook storyboard
import { Backdrop, Bulb, Clock, Tag, Talk, You, type Ground } from "../hooks/HookStoryboard";
// Load the video call (the hook) and the colleagues on it
import { VideoCall } from "./MeetingLooks";
import { Person } from "./Cast";
// Load the shared video pieces
import { BODY, DISPLAY, Synced } from "../kit";
// Load the theme as CSS, and the helpers for inline colours
import { THEME_CSS, role, tint } from "../theme";
// Load the word timing
import { alignLines, syllables } from "../lessons/align";
// Load the app's scene animations as plain CSS (the tile's loops)
import "../generated/scene.css";
// Load every ad voiceover's timings, by ad id
import voices from "../generated/ads/index.json";

// The ad's id, which names its voiceover (public/ads/quiet-in-meetings.mp3)
export const AD_ID = "quiet-in-meetings";
// The end card's length in seconds, after the voice
const END_SECONDS = 2;
// The words at the top during the hook (the sting, readable in a glance), and after it
const [HOOK_TEXT, HEADLINE] = ["Your idea.\nSam gets the credit.", "Why your ideas don't get heard in meetings"];
// How many lines the hook (the video call) takes
const HOOK_LINES = 2;

// The voiceover's lines in order, each with its ground (after the hook) and the source shown with it
const LINES: ReadonlyArray<{ text: string; ground: Ground; source?: string }> = [
  // The hook: your idea
  { text: "Your idea.", ground: "art-sky" },
  // The hook: Sam's credit
  { text: "Sam gets the credit.", ground: "art-sky" },
  // The open question
  { text: "There's a reason this keeps happening.", ground: "art-sky" },
  // The study (on the chart)
  { text: "Researchers watched groups solve problems.", ground: "art-sun" },
  // Its finding
  { text: "Whoever spoke first and most was rated the most competent.", ground: "art-sun" },
  // Its twist
  { text: "Even when their answers were no better.", ground: "art-sun" },
  // The turn
  { text: "So it's not your idea that's losing.", ground: "art-plum" },
  // (its second half)
  { text: "It's your timing.", ground: "art-coral" },
  // The fix
  { text: "Say one thing early, even a question.", ground: "art-leaf" },
  // The second study
  { text: "People who bring a way forward, not just problems, are more often seen as leaders.", ground: "art-bloom", source: "McClean et al., 2018" },
  // The call to action
  { text: "Practise it in VoiceLab.", ground: "art-sky" },
];

// A voiceover's timings
type Voice = { fps: number; duration: number; phrases: ReadonlyArray<{ start: number; end: number }>; loudness: ReadonlyArray<number> };

// Whether the ad's voiceover has been made and prepared
export const adReady = AD_ID in voices;
// The silent preview's pace: seconds a syllable (the voice's own, from its first takes) and the short pause between lines a social cut leaves
const [PREVIEW_PACE, PREVIEW_PAUSE] = [0.2, 0.3];

// Stand-in timings for a silent preview before the voiceover is in: each line as long as its syllables at the voice's pace, a short pause after each, and a mouth that opens and closes while a line is said
function previewVoice(): Voice {
  // Each line's stretch, one after another
  let at = 0;
  // (worked out in order)
  const phrases = LINES.map((line) => {
    // This line's stretch
    const phrase = { start: at, end: at + line.text.split(" ").reduce((sum, word) => sum + syllables(word), 0) * PREVIEW_PACE };
    // On past it and its pause
    at = phrase.end + PREVIEW_PAUSE;
    // Kept
    return phrase;
  });
  // The voice's length: the last line's end
  const duration = phrases.at(-1)!.end;
  // A loudness for every frame: a soft wobble while a line is said, silence between
  const loudness = Array.from({ length: Math.ceil(duration * 30) }, (_, frame) => (phrases.some((phrase) => frame / 30 >= phrase.start && frame / 30 < phrase.end) ? 0.06 + 0.05 * Math.abs(Math.sin(frame * 0.9)) : 0));
  // The stand-in timings
  return { fps: 30, duration, phrases, loudness };
}

// The ad's voiceover, or stand-in timings for a silent preview when it has not been made yet
function voice(): Voice {
  // The real timings, when there are some, otherwise the stand-in
  return (voices as Record<string, Voice>)[AD_ID] ?? previewVoice();
}

// The ad's length in frames: its voice and the end card
export function adFrames(): number {
  // The voice
  const timing = voice();
  // Rounded up to a whole frame
  return Math.ceil((timing.duration + END_SECONDS) * timing.fps);
}

// What a line's scene needs: how far through its line we are (0 to 1), a spring that starts at a point in the line, the blob's breathing, blinking and talking, and the time
type Moment = { through: number; pop: (at: number) => number; breath: number; blink: boolean; talk: number; t: number };

// A prop popping in at a point in its line around its middle (cx, cy): growing with a little overshoot, tipping upright as it lands, then floating gently
function grow(m: Moment, at: number, cx: number, cy: number): string {
  // How far it has popped in
  const p = m.pop(at);
  // Its gentle float, out of step with other props by where it is
  const float = Math.sin(m.t * 2.2 + cx * 0.02) * 6;
  // Placed, tipped, grown
  return `translate(${cx} ${cy + float}) rotate(${(1 - Math.min(1, p)) * -16}) scale(${p}) translate(${-cx} ${-cy})`;
}

// The blob explaining, big and centred low, talking with the voice
function Narrator({ m, mood = "ready", x = 540, y = 1010, r = 170, wave = 0 }: { m: Moment; mood?: "ready" | "happy" | "up" | "wow"; x?: number; y?: number; r?: number; wave?: number }) {
  // The blob, with a soft shadow under it
  return (
    <>
      {/* Its shadow */}
      <ellipse className="fill-on-warm opacity-15" cx={x} cy={y + r * 0.95} rx={r * 0.85} ry={r * 0.15} />
      {/* The blob */}
      <You t={m.t} x={x} y={y} r={r} mood={mood} open={m.talk} breath={m.breath} blink={m.blink} wave={wave} />
    </>
  );
}

// The open question: "Why?" in a bubble over the blob
function SceneWhy({ m }: { m: Moment }) {
  // Sky: the bubble pops in, the blob explains
  return (
    <>
      {/* The bubble */}
      <g transform={grow(m, 0.05, 540, 760)}><Talk x={360} y={500} w={360} h={230} tailX={540}><text className="fill-accent" x="540" y="655" fontFamily={DISPLAY} fontWeight="700" fontSize="120" textAnchor="middle">Why?</text></Talk></g>
      {/* The blob */}
      <Narrator m={m} mood="up" />
    </>
  );
}

// The people on the chart, top to bottom, with how much each talked, how competent each was rated, and how good each answer was (an illustration of the finding's shape, not the study's numbers)
const CHART_ROWS = [
  // Sam talked most and was rated highest
  { who: "sam", talk: 0.95, rated: 0.9 },
  // Priya
  { who: "priya", talk: 0.55, rated: 0.58 },
  // Alex
  { who: "alex", talk: 0.38, rated: 0.42 },
  // You talked least
  { who: "you", talk: 0.14, rated: 0.18 },
] as const;
// Every answer was about as good
const QUALITY = 0.62;
// The chart's three measures: their colour and name
const MEASURES = [["art-sky", "Talk time"], ["art-coral", "Rated competent"], ["art-leaf", "Quality of answers"]] as const;

// The study as a chart that builds over three lines: the people (stage 0), how much each talked and how competent each was rated (stage 1), and how good each answer was (stage 2); the blob beside it, explaining
function SceneChart({ m, stage }: { m: Moment; stage: 0 | 1 | 2 }) {
  // The card's place
  const [left, top, width, height] = [70, 370, 860, 760];
  // Where the bars start and how long a full one is
  const [barX, full] = [left + 170, 600];
  // How far a set of bars has grown: earlier stages already full, this stage's growing in turn down the rows
  const grown = (set: 0 | 1 | 2, row: number, at: number) => (stage > set ? 1 : stage === set ? Math.min(1, m.pop(at + row * 0.06)) : 0);
  // When each set starts within its line: talk time at once; on the finding's line, "rated competent" once "competent" is near
  const startOf = [0.05, 0.62, 0.1];
  // The card and its contents
  return (
    <>
      {/* The card, popping in on the first line only */}
      <g transform={stage === 0 ? grow(m, 0, left + width / 2, top + height / 2) : undefined}>
        {/* Its shadow */}
        <rect x={left} y={top + 14} width={width} height={height} rx="44" fill={tint("on-warm", 10)} />
        {/* The card */}
        <rect className="fill-art-cream" x={left} y={top} width={width} height={height} rx="44" />
        {/* Its title */}
        <text className="fill-on-warm" x={left + 50} y={top + 82} fontFamily={DISPLAY} fontWeight="700" fontSize="50">Groups solving a problem</text>
        {/* The key: each measure once its bars are showing */}
        {MEASURES.map(([fill, name], index) => (index === 0 || stage >= index) && <g key={name} opacity={index === 0 || stage > index ? 1 : Math.min(1, m.pop(startOf[index]!))}><rect className={`fill-${fill}`} x={left + 50 + index * 262} y={top + 118} width="26" height="26" rx="7" /><text className="fill-on-warm" x={left + 86 + index * 262} y={top + 140} fontFamily={BODY} fontWeight="700" fontSize="27" opacity="0.8">{name}</text></g>)}
        {/* Each person's row */}
        {CHART_ROWS.map((row, index) => {
          // The row's middle
          const y = top + 250 + index * 128;
          // The row: who, then three bars
          return (
            <g key={row.who}>
              {/* Who: you as the warm blob, the others as themselves */}
              {row.who === "you" ? <You t={m.t} x={left + 90} y={y} r={40} mood="ready" /> : <Person who={row.who} x={left + 90} y={y} r={40} mood={row.who === "sam" && stage >= 1 ? "happy" : "ready"} t={m.t} />}
              {/* Talk time */}
              <rect className="fill-art-sky" x={barX} y={y - 46} width={Math.max(0, full * row.talk * grown(0, index, startOf[0]!))} height="28" rx="14" />
              {/* Rated competent */}
              <rect className="fill-art-coral" x={barX} y={y - 14} width={Math.max(0, full * row.rated * grown(1, index, startOf[1]!))} height="28" rx="14" />
              {/* Quality of answers: the same for everyone */}
              <rect className="fill-art-leaf" x={barX} y={y + 18} width={Math.max(0, full * QUALITY * grown(2, index, startOf[2]!))} height="28" rx="14" />
            </g>
          );
        })}
        {/* The study, and that this is its shape rather than its numbers */}
        <text className="fill-on-warm" x={left + width / 2} y={top + height - 34} fontFamily={BODY} fontWeight="600" fontSize="26" textAnchor="middle" opacity="0.6">Illustration of the finding · Anderson &amp; Kilduff, 2009</text>
      </g>
      {/* The blob, small beside the card, explaining */}
      <Narrator m={m} mood={stage === 2 ? "wow" : "ready"} x={880} y={1180} r={88} />
    </>
  );
}

// The turn: your bulb lights again over you, it was a good idea all along
function SceneYourIdea({ m }: { m: Moment }) {
  // Plum: the bulb pops back on
  return (
    <>
      {/* Your idea */}
      <g transform={grow(m, 0.05, 540, 560)}><Bulb t={m.t} x={540} y={560} s={1.6} lit /></g>
      {/* The blob, pleased */}
      <Narrator m={m} mood="happy" />
    </>
  );
}

// The turn's second half: the clock
function SceneTiming({ m }: { m: Moment }) {
  // Coral: the clock pops in, its hand sweeping on
  return (
    <>
      {/* The clock */}
      <g transform={grow(m, 0, 540, 560)}><Clock x={540} y={560} r={200} minute={8 + m.through * 30} /></g>
      {/* The blob */}
      <Narrator m={m} mood="up" />
    </>
  );
}

// The fix: say one thing early, even a question
function SceneEarly({ m }: { m: Moment }) {
  // Leaf: a "?" bubble and a clock still early
  return (
    <>
      {/* The question */}
      <g transform={grow(m, 0.05, 330, 760)}><Talk x={190} y={500} w={280} h={240} tailX={330}><text className="fill-accent" x="330" y="672" fontFamily={DISPLAY} fontWeight="700" fontSize="180" textAnchor="middle">?</text></Talk></g>
      {/* The clock, early in the meeting */}
      <g transform={grow(m, 0.3, 780, 600)}><Clock x={780} y={600} r={130} minute={2} /></g>
      {/* The blob */}
      <Narrator m={m} mood="happy" />
    </>
  );
}

// The second study: a way forward, and this time the credit lands on you
function SceneLeader({ m }: { m: Moment }) {
  // Bloom: "What if we…?" then "Great idea!" over you
  return (
    <>
      {/* The way forward */}
      <g transform={grow(m, 0.05, 540, 760)}><Talk x={300} y={590} w={480} h={170} tailX={540}><text className="fill-on-warm" x="540" y="697" fontFamily={DISPLAY} fontWeight="700" fontSize="66" textAnchor="middle">What if we…?</text></Talk></g>
      {/* The praise, yours this time */}
      <g transform={grow(m, 0.55, 540, 480)}><Tag x={540} y={480} text="Great idea!" size={56} /></g>
      {/* The blob */}
      <Narrator m={m} mood="happy" />
    </>
  );
}

// The call to action: your bulb glowing, you waving
function SceneWave({ m }: { m: Moment }) {
  // Sky: a big lit bulb and a wave
  return (
    <>
      {/* Your idea, big */}
      <g transform={grow(m, 0, 540, 560)}><Bulb t={m.t} x={540} y={560} s={1.5} lit /></g>
      {/* The blob, waving */}
      <Narrator m={m} mood="happy" wave={0.5 + 0.5 * Math.sin(m.t * 9)} />
    </>
  );
}

// Each line's scene after the hook, in the lines' order (the hook's two lines are the video call)
const SCENES: ReadonlyArray<(props: { m: Moment }) => ReactNode> = [SceneWhy, (props) => <SceneChart {...props} stage={0} />, (props) => <SceneChart {...props} stage={1} />, (props) => <SceneChart {...props} stage={2} />, SceneYourIdea, SceneTiming, SceneEarly, SceneLeader, SceneWave];

// The headline at the top: a cream pill (a rounded box when it wraps onto two lines, bigger for the hook's sting), clear of the apps' buttons
export function Headline({ shown, text = HEADLINE, big = false }: { shown: number; text?: string; big?: boolean }) {
  // Two lines when the words are long, or when it is the hook's big sting
  const wraps = big || text.length > 32;
  // Centred near the top
  return (
    <div style={{ position: "absolute", left: 60, right: 150, top: big ? 150 : 170, display: "flex", justifyContent: "center", opacity: shown, transform: `translateY(${(1 - shown) * -30}px)` }}>
      {/* The pill */}
      <div style={{ padding: wraps ? "18px 40px" : "22px 40px", borderRadius: wraps ? 40 : 999, background: role("art-cream"), color: role("on-warm"), fontFamily: DISPLAY, fontWeight: 700, fontSize: big ? 62 : wraps ? 52 : 54, lineHeight: 1.1, letterSpacing: -0.5, textAlign: "center", whiteSpace: big ? "pre-line" : wraps ? "normal" : "nowrap" }}>{text}</div>
    </div>
  );
}

// The source of a study, small, under the headline
function Source({ text }: { text: string }) {
  // Small cream words
  return <div style={{ position: "absolute", left: 60, right: 150, top: 340, textAlign: "center", fontFamily: BODY, fontWeight: 700, fontSize: 36, color: role("art-cream") }}>{text}</div>;
}

// The caption: the line being said, its current word in the accent, in a cream box whose bottom sits clear of the apps' buttons
export function Caption({ text, said, pop }: { text: string; said: number; pop: number }) {
  // The line's words
  const words = text.split(" ");
  // Long lines in a smaller size, so the box stays clear of the drawing
  const size = words.length > 9 ? 62 : 74;
  // The box
  return (
    <div style={{ position: "absolute", left: 80, right: 150, bottom: 370, display: "flex", justifyContent: "center", transform: `scale(${0.92 + pop * 0.08})`, opacity: pop }}>
      {/* The cream box */}
      <div style={{ padding: "24px 42px", borderRadius: 44, background: role("art-cream"), color: role("on-warm"), fontFamily: DISPLAY, fontWeight: 650, fontSize: size, lineHeight: 1.14, textAlign: "center", letterSpacing: -1 }}>
        {/* Each word, the one being said in the accent and a little bigger */}
        {words.map((word, position) => <span key={position}><span style={{ display: "inline-block", color: position === said ? role("accent") : undefined, transform: position === said ? "scale(1.06)" : undefined, margin: position === said ? "0 0.1em" : undefined }}>{word}</span>{position < words.length - 1 ? " " : ""}</span>)}
      </div>
    </div>
  );
}

// The end card: the lesson's tile, the app's name, the course and lesson, and the two things to do
function EndCard({ shown, strap }: { shown: number; strap: number }) {
  // Over everything
  return (
    <AbsoluteFill style={{ background: role("paper"), opacity: Math.min(1, shown * 1.5), alignItems: "center", justifyContent: "center", gap: 34 }}>
      {/* The "Speak up in meetings" tile */}
      <div className="tile-box" style={{ width: 520, height: 520, transform: `scale(${shown}) rotate(${(1 - shown) * 10}deg)` }}><Synced><CourseTile name="speak-up" /></Synced></div>
      {/* The app's name */}
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 120, color: role("ink"), letterSpacing: -2 }}>VoiceLab</div>
      {/* The lesson */}
      <div style={{ fontFamily: DISPLAY, fontWeight: 650, fontSize: 64, color: role("ink"), textAlign: "center" }}>Speak up in meetings</div>
      {/* Its course */}
      <div style={{ marginTop: -18, fontFamily: BODY, fontWeight: 700, fontSize: 40, color: role("ink-muted") }}>Explain it simply · Lesson 4</div>
      {/* The two things to do */}
      <div style={{ marginTop: 10, padding: "20px 44px", borderRadius: 999, background: role("fill"), color: role("fill-ink"), fontFamily: BODY, fontWeight: 700, fontSize: 40, opacity: strap }}>Speak early. Bring a way forward.</div>
    </AbsoluteFill>
  );
}

// The one sound effect (public/ads/sfx/, made with ElevenLabs' sound effects): the clock's ticks, and how loud they play under the voice
const SFX = { tick: 0.35 } as const;

// When each effect plays, in seconds: the ticks as the clock comes in on "It's your timing."
function soundCues(lineStarts: ReadonlyArray<number>): Array<{ sound: keyof typeof SFX; at: number }> {
  // The one cue
  return [{ sound: "tick", at: lineStarts[7]! }];
}

// The ad
export function QuietInMeetings(): ReactNode {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The voiceover's timings
  const timing = voice();
  // The time in seconds
  const seconds = frame / fps;
  // When each line and word is said
  const { lineStarts, words } = alignLines(LINES.map((line) => line.text), timing.phrases);
  // The line on now (the first until it starts)
  const index = Math.max(0, lineStarts.filter((start) => seconds >= start).length - 1);
  // Its start and end (the next line's start, or the voice's end)
  const [start, end] = [lineStarts[index]!, lineStarts[index + 1] ?? timing.duration];
  // A spring from a moment in seconds
  const springFrom = (at: number, damping = 13) => spring({ frame: frame - Math.round(at * fps), fps, config: { damping } });
  // How loud the voice is now, smoothed over two frames, for a talking mouth
  const loud = Math.min(1, (((timing.loudness[frame] ?? 0) + (timing.loudness[Math.max(0, frame - 1)] ?? 0)) / 2) * 6);
  // The line now
  const line = LINES[index]!;
  // Whether the hook (the video call) is on
  const hook = index < HOOK_LINES;
  // The moment a scene is drawn at
  const moment: Moment = { through: Math.min(1, Math.max(0, (seconds - start) / (end - start))), pop: (at) => springFrom(start + at * (end - start)), breath: 1 + Math.sin(seconds * 2.4) * 0.012, blink: (frame + 40) % 137 < 4, talk: loud, t: seconds };
  // The scene after the hook
  const Scene = SCENES[index - HOOK_LINES];
  // The call's moments: your idea already lit and Sam already talking (it starts in the middle), the highlight jumping to him as his name is said
  const swing = (lineStarts[1] ?? 1) + 0.1;
  // (all of them)
  const beats = { bulbOn: -1, talk: 0.3, swing, out: swing + 0.25, praise: swing + 0.45 };
  // The ground now and the one before it, fading in over a fifth of a second at each line's start
  const [ground, previous, fade] = [line.ground, LINES[Math.max(0, index - 1)]!.ground, Math.min(1, Math.max(0, (seconds - start) / 0.2))];
  // The word being said: the last in this line that has started
  const said = Math.max(0, words.filter((word) => word.line === index && word.start <= seconds).length - 1);
  // How far the end card has come in
  const closing = seconds > timing.duration ? springFrom(timing.duration + 0.05, 14) : 0;
  // The layers, back to front
  return (
    <AbsoluteFill style={{ fontFamily: BODY }}>
      {/* The theme's colours and classes, and the tile filling its box */}
      <style>{`${THEME_CSS}\n.tile-box svg { width: 100%; height: 100%; }`}</style>
      {/* The voice, once it is made */}
      {adReady && <Audio src={staticFile(`ads/${AD_ID}.mp3`)} />}
      {/* The sound effects, each at its moment */}
      {soundCues(lineStarts).map((cue, at) => <Sequence key={at} from={Math.max(0, Math.round(cue.at * fps))} layout="none"><Audio src={staticFile(`ads/sfx/${cue.sound}.mp3`)} volume={SFX[cue.sound]} /></Sequence>)}
      {/* The hook: the video call */}
      {hook && <VideoCall t={seconds} beats={beats} chrome={false} />}
      {/* After it: the ground before, under the new one fading in */}
      {!hook && <Backdrop ground={index === HOOK_LINES ? ground : previous} t={seconds} />}
      {/* (the new one) */}
      {!hook && <Backdrop ground={ground} t={seconds} opacity={fade} />}
      {/* The line's scene */}
      {Scene && <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}><Scene m={moment} /></svg>}
      {/* The words at the top: the sting during the hook, then the question it raises */}
      <Headline shown={1} text={hook ? HOOK_TEXT : HEADLINE} big={hook} />
      {/* The study's source, when the line cites one */}
      {line.source && <Source text={line.source} />}
      {/* The caption */}
      {seconds <= timing.duration && <Caption text={line.text} said={said} pop={index === 0 ? 1 : springFrom(start, 15)} />}
      {/* The end card, once the voice is done */}
      {closing > 0 && <EndCard shown={closing} strap={interpolate(seconds, [timing.duration + 0.4, timing.duration + 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />}
    </AbsoluteFill>
  );
}
