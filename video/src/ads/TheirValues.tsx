// The "their values" social ad (decision 158): a 1080 by 1920, roughly 15-second short in the meetings series, on an open stage rather than the video call. Values are colours: from a small podium you make your case in your own apricot reasons while Sam, Priya and Alex, sitting below, each care about their own colour; one study as a chart of 100 dots (Feinberg & Willer, 2015: asked to win over the other side, only 9% used the other side's values); then you make your case in their colours and they light up. Timed from the voice's own pauses, as the first ad is

// Load React's node type
import type { ReactNode } from "react";
// Load Remotion's building blocks
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
// Load the drawing pieces shared with the storyboard
import { Backdrop, Tag, Talk, You, type Ground } from "../hooks/HookStoryboard";
// Load the colleagues
import { Person, type ColleagueMood } from "./Cast";
// Load the call's layout and pieces
import { springAt } from "./MeetingLooks";
// Load the first ad's shared pieces
import { Caption, EndCard, Headline, Narrator, type Moment } from "./QuietInMeetings";
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

// The ad's id, which names its voiceover (public/ads/their-values.mp3)
export const VALUES_ID = "their-values";
// The end card's length in seconds
const END_SECONDS = 1.6;
// The words at the top during the hook (the sting), and after it
const [HOOK_TEXT, HEADLINE] = ["You explained why it matters.\nThey didn't care.", "Why your pitch didn't land"];
// Each colleague's colour: what they care about
const THEIR_COLOURS = ["art-plum", "art-coral", "accent"] as const;

// The voiceover's lines: the scene each is drawn on, and its ground
const LINES: ReadonlyArray<{ text: string; scene: "pitch" | "twist" | "chart" | "fix" | "won"; ground: Ground }> = [
  // The hook
  { text: "You explained why it matters. They didn't care.", scene: "pitch", ground: "art-sky" },
  // The twist
  { text: "It mattered to you. Not them.", scene: "twist", ground: "art-plum" },
  // The study
  { text: "Asked to win over the other side, only 9% of people used the other side's values.", scene: "chart", ground: "art-sun" },
  // The fix
  { text: "So make your case in what they care about.", scene: "fix", ground: "art-leaf" },
  // The call to action, over the last scene
  { text: "Practise it in VoiceLab.", scene: "won", ground: "art-leaf" },
];

// A voiceover's timings
type Voice = { fps: number; duration: number; phrases: ReadonlyArray<{ start: number; end: number }>; loudness: ReadonlyArray<number> };

// Whether the voiceover has been made and prepared
const valuesReady = VALUES_ID in voices;

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
  return (voices as Record<string, Voice>)[VALUES_ID] ?? previewVoice();
}

// The ad's length in frames: its voice and the end card
export function valuesFrames(): number {
  // The voice
  const timing = voice();
  // Rounded up to a whole frame
  return Math.ceil((timing.duration + END_SECONDS) * timing.fps);
}

// Your three reasons in a speech bubble beside you on the podium: dots in the colours given, popping in one after another from a moment
function Reasons({ t, from, colours }: { t: number; from: number; colours: ReadonlyArray<string> }) {
  // The bubble and its dots, popping in from its tail
  return (
    <g transform={`translate(600 640) scale(${Math.min(1.04, springAt(t, from - 0.1))}) translate(-600 -640)`}>
      {/* The bubble */}
      <Talk x={540} y={400} w={400} h={170} tailX={590}>
        {/* Each reason */}
        {colours.map((colour, index) => <circle key={index} className={`fill-${colour}`} cx={620 + index * 120} cy="485" r={38 * Math.min(1.1, springAt(t, from + index * 0.22))} />)}
      </Talk>
    </g>
  );
}

// What a listener cares about: a thought bubble over their head holding their colour, ticked once your case speaks to it
function Cares({ x, y, colour, t, from, met }: { x: number; y: number; colour: string; t: number; from: number; met: boolean }) {
  // How far it has popped in
  const shown = Math.min(1.05, springAt(t, from));
  // The bubble, its dot and its tick
  return (
    <g transform={`translate(${x} ${y}) scale(${shown})`}>
      {/* Two little thought puffs leading down to them */}
      <circle className="fill-art-cream" cx="-6" cy="78" r="9" />
      {/* (the bigger one) */}
      <circle className="fill-art-cream" cx="8" cy="54" r="13" />
      {/* The bubble */}
      <rect className="fill-art-cream" x="-50" y="-50" width="110" height="88" rx="32" />
      {/* Their colour */}
      <circle className={`fill-${colour}`} cx="5" cy="-6" r="27" />
      {/* A tick once you speak to it */}
      {met && <path className="stroke-art-cream" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" d="M-8 -6l9 9 16 -17" />}
    </g>
  );
}

// The stage: you on a small podium making your case to three listeners in a row below. In the hook and the twist your reasons are your own colour and they look away bored, their own colours over their heads; in the fix your reasons take their colours and each lights up in turn
function ValuesStage({ t, scene, starts, talk }: { t: number; scene: "pitch" | "twist" | "fix" | "won"; starts: ReadonlyArray<number>; talk: number }) {
  // Whether your case is now made in their colours
  const theirs = scene === "fix" || scene === "won";
  // When each listener is won over: one after another through the fix
  const wonAt = [0, 1, 2].map((index) => starts[3]! + 0.6 + index * 0.35);
  // The listeners: who, where they sit, and the colour they care about
  const row = [{ who: "sam", x: 220 }, { who: "priya", x: 540 }, { who: "alex", x: 860 }] as const;
  // A small hop for each listener as they are won over
  const hop = (at: number) => { const through = (t - at) / 0.34; return through > 0 && through < 1 ? -Math.sin(through * Math.PI) * 26 : 0; };
  // The stage
  return (
    <>
      {/* One big soft circle behind you, as on the tiles */}
      <circle className="fill-art-cream opacity-15" cx={300} cy={580} r={330} />
      {/* You, behind the podium: keen, then worried at the twist, then pleased as they come round */}
      <You x={360} y={670} r={130} mood={scene === "won" ? "happy" : scene === "twist" ? "worried" : "ready"} open={scene === "won" ? 0 : talk} t={t} breath={1 + Math.sin(t * 2.4) * 0.012} />
      {/* The lectern in front of you: a dark body narrowing to the floor, a cream top, and a cream stripe across its front */}
      <path className="fill-on-warm opacity-60" d="M238 766H482L458 890H262Z" />
      {/* (its top) */}
      <rect className="fill-art-cream" x={214} y={748} width={292} height={30} rx={15} />
      {/* (its stripe) */}
      <rect className="fill-art-cream opacity-45" x={290} y={815} width={140} height={14} rx={7} />
      {/* Your reasons: your own colour, then theirs */}
      <Reasons t={t} from={theirs ? starts[3]! + 0.1 : 0.15} colours={theirs ? THEIR_COLOURS : ["warm", "warm", "warm"]} />
      {/* The floor the listeners sit on */}
      <ellipse className="fill-on-warm opacity-10" cx={540} cy={1250} rx={520} ry={70} />
      {/* Each listener */}
      {row.map((listener, index) => {
        // Whether they have been won over
        const won = theirs && t > wonAt[index]!;
        // Their mood: bored while it is your case, listening once it is theirs, pleased when won
        const mood: ColleagueMood = won ? "happy" : theirs ? "ready" : "bored";
        // The listener, their shadow and what they care about
        return (
          <g key={listener.who}>
            {/* Their shadow */}
            <ellipse className="fill-on-warm opacity-15" cx={listener.x} cy={1236} rx={92} ry={16} />
            {/* The listener: looking away while bored, up at you once you speak to them */}
            <Person who={listener.who} x={listener.x} y={1140 + (won ? hop(wonAt[index]!) : 0)} r={96} mood={mood} t={t} look={theirs ? (listener.x < 360 ? 1 : -1) : [1, -1, 1][index]!} lookUp={theirs ? 1 : 0} />
            {/* What they care about, from the twist on */}
            {scene !== "pitch" && <Cares x={listener.x + 30} y={960} colour={THEIR_COLOURS[index]!} t={t} from={starts[1]! + 0.15 + index * 0.15} met={won} />}
          </g>
        );
      })}
      {/* The praise, once they are won over */}
      {scene === "won" && <g transform={`translate(360 455) rotate(${(1 - Math.min(1, springAt(t, starts[4]!))) * -12}) scale(${springAt(t, starts[4]!)}) translate(-360 -455)`}><Tag x={360} y={455} text="Great point!" size={50} /></g>}
    </>
  );
}

// Where the 9 dots that used the other side's values sit in the grid of 100, scattered
const THEIRS_AT = [7, 18, 26, 39, 44, 58, 63, 77, 92];

// The study as 100 dots: they fill in your apricot (people who argued from their own values), then 9 light up in the others' colours as the count reaches 9%; the blob explains beside it
function DotChart({ m }: { m: Moment }) {
  // The card's place
  const [left, top, width, height] = [90, 380, 860, 860];
  // The grid's first dot and the gap between dots
  const [gx, gy, gap] = [left + width / 2 - 4.5 * 56, top + 290, 56];
  // How many dots have filled in (all within the first two fifths of the line)
  const filled = Math.min(100, Math.floor(m.through * 2.6 * 100));
  // How far the 9 have lit up: from halfway, one after another
  const lit = (rank: number) => Math.min(1, m.pop(0.5 + rank * 0.03));
  // The count shown: how many of the 9 have lit
  const count = THEIRS_AT.filter((_, rank) => lit(rank) > 0.5).length;
  // The card and the blob
  return (
    <>
      {/* The card, popping in */}
      <g transform={`translate(${left + width / 2} ${top + height / 2}) scale(${Math.min(1, m.pop(0))}) translate(${-(left + width / 2)} ${-(top + height / 2)})`}>
        {/* Its shadow */}
        <rect x={left} y={top + 14} width={width} height={height} rx="44" fill={tint("on-warm", 10)} />
        {/* The card */}
        <rect className="fill-art-cream" x={left} y={top} width={width} height={height} rx="44" />
        {/* Its title */}
        <text className="fill-on-warm" x={left + width / 2} y={top + 78} fontFamily={DISPLAY} fontWeight="700" fontSize="46" textAnchor="middle">Trying to win over the other side</text>
        {/* The count */}
        <text className="fill-accent" x={left + 70} y={top + 205} fontFamily={DISPLAY} fontWeight="700" fontSize="120">{count}%</text>
        {/* What the count is */}
        <text className="fill-on-warm" x={left + 330} y={top + 160} fontFamily={BODY} fontWeight="700" fontSize="32">used the other side's values</text>
        {/* The rest */}
        <g><circle className="fill-warm" cx={left + 344} cy={top + 194} r="12" /><text className="fill-on-warm" x={left + 366} y={top + 205} fontFamily={BODY} fontWeight="600" fontSize="28" opacity="0.75">the rest used their own</text></g>
        {/* The 100 dots */}
        {Array.from({ length: 100 }, (_, index) => {
          // Where it sits
          const [cx, cy] = [gx + (index % 10) * gap, gy + Math.floor(index / 10) * gap];
          // Whether it is one of the 9, and how far it has lit
          const rank = THEIRS_AT.indexOf(index);
          // How lit (0 for the rest)
          const glow = rank >= 0 ? lit(rank) : 0;
          // The dot: apricot once filled, one of their colours once lit, bigger as it lights
          return index < filled && <circle key={index} className={glow > 0.5 ? `fill-${THEIR_COLOURS[rank % 3]}` : "fill-warm opacity-60"} cx={cx} cy={cy} r={19 + glow * 7} />;
        })}
        {/* The study */}
        <text className="fill-on-warm" x={left + width / 2} y={top + height - 30} fontFamily={BODY} fontWeight="600" fontSize="26" textAnchor="middle" opacity="0.6">Feinberg &amp; Willer, 2015</text>
      </g>
      {/* The blob, beside the card, explaining */}
      <Narrator m={m} mood="ready" x={905} y={1215} r={72} />
    </>
  );
}

// The ad
export function TheirValues(): ReactNode {
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
      {valuesReady && <Audio src={staticFile(`ads/${VALUES_ID}.mp3`)} />}
      {/* The line's ground, the one before under it fading in over a fifth of a second */}
      <Backdrop ground={LINES[Math.max(0, index - 1)]!.ground} t={t} />
      {/* (the new one) */}
      <Backdrop ground={line.ground} t={t} opacity={index === 0 ? 1 : Math.min(1, Math.max(0, (t - start) / 0.2))} />
      {/* The scene: the stage, or the chart */}
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>{line.scene === "chart" ? <DotChart m={moment} /> : <ValuesStage t={t} scene={line.scene} starts={lineStarts} talk={loud} />}</svg>
      {/* The words at the top: the sting through the hook and the twist, then what the ad explains */}
      <Headline shown={1} text={index <= 1 ? HOOK_TEXT : HEADLINE} big={index <= 1} size={54} />
      {/* The caption */}
      {t <= timing.duration && <Caption text={line.text} said={said} pop={index === 0 ? 1 : springFrom(start, 15)} />}
      {/* The end card */}
      {closing > 0 && <EndCard shown={closing} strap={interpolate(t, [timing.duration + 0.3, timing.duration + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} line="Make your case in what they care about." tile="pitch-it" lesson="The run: pitch an idea" course="Explain it simply · Lesson 6" />}
    </AbsoluteFill>
  );
}
