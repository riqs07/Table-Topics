// The "ask for advice" social ad (decision 158): a 1080 by 1920, roughly 15-second short in the meetings series, on the same video call as the first ad. The hook: you, muted, too scared to ask; one fact as a chart (Brooks, Gino & Schweitzer, 2015: people who asked for advice were seen as more competent); the fix: unmute and ask one person how they'd handle it. Timed from the voice's own pauses, as the first ad is

// Load React's node type
import type { ReactNode } from "react";
// Load Remotion's building blocks
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
// Load the drawing pieces shared with the storyboard
import { Backdrop, Tag, Talk, You, type Ground } from "../hooks/HookStoryboard";
// Load the colleagues
import { Person } from "./Cast";
// Load the call's layout and pieces
import { CALL, MutedMic, TILE_H, TILE_W, springAt } from "./MeetingLooks";
// Load the first ad's shared pieces: the words at the top, the caption, the source, popping in, the blob explaining and the end card
import { Caption, EndCard, Headline, Narrator, grow, type Moment } from "./QuietInMeetings";
// Load the faces
import { BODY, DISPLAY } from "../kit";
// Load the theme as CSS, and the helpers for inline colours
import { THEME_CSS, role, tint } from "../theme";
// Load the word timing
import { alignLines, syllables } from "../lessons/align";
// Load the app's scene animations as plain CSS (the tile's loops)
import "../generated/scene.css";
// Load every ad voiceover's timings, by ad id
import voices from "../generated/ads/index.json";

// The ad's id, which names its voiceover (public/ads/ask-for-advice.mp3)
export const ASK_ID = "ask-for-advice";
// The end card's length in seconds
const END_SECONDS = 1.6;
// The words at the top during the hook (the sting), and after it
const [HOOK_TEXT, HEADLINE] = ["Scared asking makes you\nlook clueless?", "Why asking for advice works"];

// The voiceover's lines in order: the hook on the call, the fact on the chart, the fix and the call to action back on the call
const LINES: ReadonlyArray<{ text: string; scene: "hook" | "chart" | "fix"; ground: Ground }> = [
  // The hook
  { text: "Scared asking makes you look clueless?", scene: "hook", ground: "art-sky" },
  // The fact
  { text: "People who asked for advice were seen as more competent, not less.", scene: "chart", ground: "art-sun" },
  // The fix
  { text: "Pick one person, and ask how they'd handle it.", scene: "fix", ground: "art-sky" },
  // The call to action, over the last scene
  { text: "Practise it in VoiceLab.", scene: "fix", ground: "art-sky" },
];

// A voiceover's timings
type Voice = { fps: number; duration: number; phrases: ReadonlyArray<{ start: number; end: number }>; loudness: ReadonlyArray<number> };

// Whether the voiceover has been made and prepared
const askReady = ASK_ID in voices;

// Stand-in timings for a silent preview: each line as long as its syllables at the voice's pace (0.2 s), with a short pause after each
function previewVoice(): Voice {
  // Each line's stretch, one after another
  let at = 0;
  // (worked out in order)
  const phrases = LINES.map((line) => {
    // This line's stretch
    const phrase = { start: at, end: at + line.text.split(" ").reduce((sum, word) => sum + syllables(word), 0) * 0.2 };
    // On past it and its pause
    at = phrase.end + 0.3;
    // Kept
    return phrase;
  });
  // The voice's length
  const duration = phrases.at(-1)!.end;
  // A soft wobble while a line is said, silence between
  const loudness = Array.from({ length: Math.ceil(duration * 30) }, (_, frame) => (phrases.some((phrase) => frame / 30 >= phrase.start && frame / 30 < phrase.end) ? 0.06 + 0.05 * Math.abs(Math.sin(frame * 0.9)) : 0));
  // The stand-in
  return { fps: 30, duration, phrases, loudness };
}

// The voiceover's timings, or the stand-in before it is made
function voice(): Voice {
  // The real ones when there are some
  return (voices as Record<string, Voice>)[ASK_ID] ?? previewVoice();
}

// The ad's length in frames: its voice and the end card
export function askFrames(): number {
  // The voice
  const timing = voice();
  // Rounded up to a whole frame
  return Math.ceil((timing.duration + END_SECONDS) * timing.fps);
}

// A small microphone, on (no slash), at x, y
function Mic({ x, y }: { x: number; y: number }) {
  // The mic and its stand
  return (
    <g className="stroke-art-cream" strokeWidth="4.5" strokeLinecap="round" fill="none">
      {/* The mic's head */}
      <rect x={x - 7} y={y - 15} width="14" height="20" rx="7" />
      {/* Its cradle and stand */}
      <path d={`M${x - 12} ${y}q0 12 12 12t12 -12M${x} ${y + 12}v6`} />
    </g>
  );
}

// The call at time t. In the hook Sam has the floor and your question rises and shrinks back; in the fix you unmute, the highlight jumps to you, you ask Priya, she lights up, and "Great question!" lands on you
function AskCall({ t, phase, from, askAt, praiseAt, talk }: { t: number; phase: "hook" | "fix"; from: number; askAt: number; praiseAt: number; talk: number }) {
  // Whether you have the floor
  const yours = phase === "fix";
  // How far the highlight has popped onto its tile
  const ring = springAt(t, yours ? from + 0.05 : -1, 10);
  // The zoom onto your tile as you take the floor
  const zoom = yours ? 1 + 0.06 * Math.min(1, springAt(t, from + 0.05, 14)) : 1;
  // Your hesitant question in the hook: rising, then shrinking back
  const doubt = phase === "hook" ? Math.max(0, Math.min(1, springAt(t, from + 0.35)) - Math.min(1, springAt(t, from + 1.6, 16))) : 0;
  // Whether Priya has answered your question with a smile, and whether the praise has landed
  const [answered, praised] = [yours && t > askAt + 0.9, yours && t > praiseAt];
  // The speaker's tile
  const speaker = yours ? 0 : 1;
  // The layers
  return (
    <AbsoluteFill>
      {/* The app's dark window */}
      <AbsoluteFill style={{ background: tint("on-warm", 92) }} />
      {/* The call's title bar */}
      <div style={{ position: "absolute", left: 60, right: 150, top: 352, display: "flex", alignItems: "center", gap: 16, fontFamily: BODY, fontWeight: 700, fontSize: 36, color: role("art-cream") }}>
        {/* The recording dot */}
        <div style={{ width: 22, height: 22, borderRadius: 11, background: role("art-coral") }} />
        {/* The meeting */}
        Weekly team sync · 10:14
      </div>
      {/* The tiles, zooming toward yours as you take the floor */}
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "292px 627px" }}>
        <defs>
          {/* Each tile's shape */}
          {CALL.map((person) => <clipPath key={person.name} id={`ask-${person.name}`}><rect x={person.x} y={person.y} width={TILE_W} height={TILE_H} rx="30" /></clipPath>)}
        </defs>
        {/* Each person's tile */}
        {CALL.map((person, index) => (
          <g key={person.name}>
            {/* The tile and who is in it */}
            <g clipPath={`url(#ask-${person.name})`}>
              {/* The room's colour */}
              <rect className={`fill-${person.ground}`} x={person.x} y={person.y} width={TILE_W} height={TILE_H} />
              {/* A soft circle behind them */}
              <circle className="fill-art-cream opacity-15" cx={person.x + TILE_W - 70} cy={person.y + 60} r="150" />
              {/* You: worried and quiet, then asking, then pleased */}
              {index === 0 && <You x={person.x + TILE_W / 2} y={person.y + 300} r={120} mood={praised ? "happy" : yours ? "ready" : "worried"} open={yours && t < askAt + 0.9 ? talk : 0} t={t} />}
              {/* The others: Sam talking in the hook; everyone looking at you once you speak; Priya pleased by your question */}
              {index > 0 && <Person who={(["sam", "priya", "alex"] as const)[index - 1]!} x={person.x + TILE_W / 2} y={person.y + 290} r={112} mood={index === 1 && !yours ? "talk" : praised || (index === 2 && answered) ? "happy" : "ready"} t={t} look={yours ? [-1, 0, -1][index - 1]! : [0, 1, 0][index - 1]!} lookUp={yours ? [0, 1, 1][index - 1]! : [0, 1, 1][index - 1]!} />}
            </g>
            {/* Their name */}
            <rect className="fill-on-warm opacity-60" x={person.x + 20} y={person.y + TILE_H - 66} width={person.name.length * 22 + (index === 0 ? 92 : 44)} height="48" rx="14" />
            {/* (the name itself) */}
            <text className="fill-art-cream" x={person.x + 42} y={person.y + TILE_H - 31} fontFamily={BODY} fontWeight="700" fontSize="32">{person.name}</text>
            {/* Your mic: muted in the hook, on once you ask */}
            {index === 0 && (yours ? <Mic x={person.x + 132} y={person.y + TILE_H - 42} /> : <MutedMic x={person.x + 132} y={person.y + TILE_H - 42} />)}
          </g>
        ))}
        {/* The speaker's highlight */}
        <rect className="stroke-art-sun" fill="none" strokeWidth={10 + (1 - Math.min(1, ring)) * 10} x={CALL[speaker].x} y={CALL[speaker].y} width={TILE_W} height={TILE_H} rx="30" opacity={Math.min(1, Math.max(0, ring))} />
        {/* Your question in the hook, rising and shrinking back */}
        {doubt > 0.01 && <g transform={`translate(292 600) scale(${doubt}) translate(-292 -600)`}><Talk x={222} y={455} w={140} h={130} tailX={292}><text className="fill-accent" x="292" y="552" fontFamily={DISPLAY} fontWeight="700" fontSize="100" textAnchor="middle">?</text></Talk></g>}
        {/* Your question, asked */}
        {yours && <g transform={`translate(292 600) scale(${Math.min(1.05, springAt(t, askAt))}) translate(-292 -600)`}><Talk x={70} y={448} w={450} h={150} tailX={250}><text className="fill-on-warm" fontFamily={DISPLAY} fontWeight="700" fontSize="40" textAnchor="middle"><tspan x="295" y="510">Priya, how would you</tspan><tspan x="295" y="558">handle it?</tspan></text></Talk></g>}
        {/* The praise, on your tile */}
        {praised && <g transform={`translate(292 790) rotate(${(1 - Math.min(1, springAt(t, praiseAt))) * -12}) scale(${springAt(t, praiseAt)}) translate(-292 -790)`}><Tag x={292} y={790} text="Great question!" size={44} /></g>}
      </svg>
    </AbsoluteFill>
  );
}

// The fact as a chart: two bars of how competent people were seen, those who didn't ask and those who asked for advice (the shape of the finding, not the study's numbers), with the blob explaining beside it
function AdviceChart({ m }: { m: Moment }) {
  // The card's place
  const [left, top, width, height] = [110, 400, 820, 760];
  // The bars' baseline and their full height
  const [base, full] = [top + 560, 360];
  // The two bars: who, how tall, colour, when each grows within the line
  const bars = [{ label: "Didn't ask", value: 0.48, fill: "art-sky", at: 0.08, asking: false }, { label: "Asked for advice", value: 0.88, fill: "art-leaf", at: 0.45, asking: true }];
  // The card and the blob
  return (
    <>
      {/* The card, popping in */}
      <g transform={grow(m, 0, left + width / 2, top + height / 2)}>
        {/* Its shadow */}
        <rect x={left} y={top + 14} width={width} height={height} rx="44" fill={tint("on-warm", 10)} />
        {/* The card */}
        <rect className="fill-art-cream" x={left} y={top} width={width} height={height} rx="44" />
        {/* Its title */}
        <text className="fill-on-warm" x={left + width / 2} y={top + 86} fontFamily={DISPLAY} fontWeight="700" fontSize="56" textAnchor="middle">Seen as competent</text>
        {/* The baseline */}
        <rect className="fill-on-warm opacity-20" x={left + 70} y={base} width={width - 140} height="6" rx="3" />
        {/* Each bar, its label and who it is */}
        {bars.map((bar, index) => {
          // The bar's middle
          const x = left + 240 + index * 340;
          // How tall it has grown
          const h = full * bar.value * Math.min(1, m.pop(bar.at));
          // The bar, the person and the label
          return (
            <g key={bar.label}>
              {/* The bar */}
              <rect className={`fill-${bar.fill}`} x={x - 80} y={base - h} width="160" height={h} rx="22" />
              {/* You, quiet or asking */}
              <You t={m.t} x={x} y={base + 70} r={38} mood={bar.asking ? "happy" : "ready"} />
              {/* A small question bubble beside the asking one */}
              {bar.asking && <g transform={`translate(${x + 52} ${base + 20}) scale(${Math.min(1, m.pop(bar.at))})`}><rect className="fill-accent" x="-22" y="-26" width="44" height="44" rx="14" /><text className="fill-accent-ink" x="0" y="8" fontFamily={DISPLAY} fontWeight="700" fontSize="34" textAnchor="middle">?</text></g>}
              {/* Its label */}
              <text className="fill-on-warm" x={x} y={base + 150} fontFamily={BODY} fontWeight="700" fontSize="32" textAnchor="middle">{bar.label}</text>
            </g>
          );
        })}
        {/* The study, and that this is its shape rather than its numbers */}
        <text className="fill-on-warm" x={left + width / 2} y={top + height - 26} fontFamily={BODY} fontWeight="600" fontSize="24" textAnchor="middle" opacity="0.6">Illustration of the finding · Brooks, Gino &amp; Schweitzer, 2015</text>
      </g>
      {/* The blob, beside the card, explaining */}
      <Narrator m={m} mood="ready" x={900} y={1210} r={80} />
    </>
  );
}

// The ad
export function AskForAdvice(): ReactNode {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The voiceover's timings
  const timing = voice();
  // The time in seconds
  const t = frame / fps;
  // When each line and word is said
  const { lineStarts, words } = alignLines(LINES.map((line) => line.text), timing.phrases);
  // The line on now
  const index = Math.max(0, lineStarts.filter((start) => t >= start).length - 1);
  // Its start and end
  const [start, end] = [lineStarts[index]!, lineStarts[index + 1] ?? timing.duration];
  // A spring from a moment
  const springFrom = (at: number, damping = 13) => spring({ frame: frame - Math.round(at * fps), fps, config: { damping } });
  // How loud the voice is now, for a talking mouth
  const loud = Math.min(1, (((timing.loudness[frame] ?? 0) + (timing.loudness[Math.max(0, frame - 1)] ?? 0)) / 2) * 6);
  // The line now
  const line = LINES[index]!;
  // The moment a scene is drawn at
  const moment: Moment = { through: Math.min(1, Math.max(0, (t - start) / (end - start))), pop: (at) => springFrom(start + at * (end - start)), breath: 1 + Math.sin(t * 2.4) * 0.012, blink: (frame + 40) % 137 < 4, talk: loud, t };
  // The fix's moments: you ask a moment into its line, and the praise lands as the call to action starts
  const fixStart = lineStarts[2]!;
  // (the praise)
  const praiseAt = (lineStarts[3] ?? timing.duration) + 0.1;
  // The word being said
  const said = Math.max(0, words.filter((word) => word.line === index && word.start <= t).length - 1);
  // How far the end card has come in
  const closing = t > timing.duration ? springFrom(timing.duration + 0.05, 14) : 0;
  // The layers
  return (
    <AbsoluteFill style={{ fontFamily: BODY }}>
      {/* The theme's colours, and the tile filling its box */}
      <style>{`${THEME_CSS}\n.tile-box svg { width: 100%; height: 100%; }`}</style>
      {/* The voice, once it is made */}
      {askReady && <Audio src={staticFile(`ads/${ASK_ID}.mp3`)} />}
      {/* The call, in the hook and the fix */}
      {line.scene !== "chart" && <AskCall t={t} phase={line.scene === "hook" ? "hook" : "fix"} from={line.scene === "hook" ? 0 : fixStart} askAt={fixStart + 0.35} praiseAt={praiseAt} talk={loud} />}
      {/* The chart, on its ground */}
      {line.scene === "chart" && <><Backdrop ground={line.ground} t={t} /><svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}><AdviceChart m={moment} /></svg></>}
      {/* The words at the top: the sting in the hook, then what the ad explains */}
      <Headline shown={1} text={index === 0 ? HOOK_TEXT : HEADLINE} big={index === 0} />
      {/* The caption */}
      {t <= timing.duration && <Caption text={line.text} said={said} pop={index === 0 ? 1 : springFrom(start, 15)} />}
      {/* The end card */}
      {closing > 0 && <EndCard shown={closing} strap={interpolate(t, [timing.duration + 0.3, timing.duration + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} line="Pick one person. Ask how they'd handle it." />}
    </AbsoluteFill>
  );
}
