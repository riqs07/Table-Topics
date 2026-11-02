// The "quiet in meetings" social ad: a 1080 by 1920, roughly 28-second short for people who go quiet in meetings. The hook acts out an idea taken by someone else; two studies explain why (Anderson & Kilduff, 2009; McClean et al., 2018) and what to do instead. Its lines are timed from the voice's own pauses, as the lesson clips are

// Load React's node type
import type { ReactNode } from "react";
// Load Remotion's building blocks
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
// Load the app's course tiles
import { CourseTile } from "@/components/scenes/CourseTile";
// Load the drawing pieces shared with the hook storyboard
import { Backdrop, Bulb, Clock, Dots, Other, Table, Tag, Talk, You, type Ground } from "../hooks/HookStoryboard";
// Load the shared video pieces
import { BODY, DISPLAY, Synced } from "../kit";
// Load the theme as CSS, and the helpers for inline colours
import { THEME_CSS, role } from "../theme";
// Load the word timing
import { alignLines, syllables } from "../lessons/align";
// Load the app's scene animations as plain CSS (the tile's loops)
import "../generated/scene.css";
// Load every ad voiceover's timings, by ad id
import voices from "../generated/ads/index.json";

// The ad's id, which names its voiceover (public/ads/quiet-in-meetings.mp3)
export const AD_ID = "quiet-in-meetings";
// The end card's length in seconds, after the voice
const END_SECONDS = 3;
// The headline kept at the top, for viewers with the sound off
const HEADLINE = "Why your ideas don't get heard";

// The voiceover's lines in order, each with its ground (the second line changes ground halfway, when the bulb goes out), the source shown with it and whether you are the one speaking
const LINES: ReadonlyArray<{ text: string; ground: Ground; later?: Ground; source?: string; speaking?: boolean }> = [
  // The hook: your idea
  { text: "You had the idea.", ground: "art-sky" },
  // The hook: taken
  { text: "Then someone else said it.", ground: "art-bloom", later: "art-plum" },
  // The study
  { text: "Researchers watched groups solve problems.", ground: "art-sun", source: "Anderson & Kilduff, 2009" },
  // Its finding
  { text: "Whoever spoke first and most was rated the most competent.", ground: "art-bloom", source: "Anderson & Kilduff, 2009" },
  // Its twist
  { text: "Even when their answers were no better.", ground: "art-sky", source: "Anderson & Kilduff, 2009" },
  // The turn
  { text: "So it's not your idea that's losing.", ground: "art-plum" },
  // (its second half)
  { text: "It's your timing.", ground: "art-coral" },
  // The fix
  { text: "Say one thing early, even a question.", ground: "art-leaf", speaking: true },
  // The second study
  { text: "People who bring a way forward, not just problems, are more often seen as leaders.", ground: "art-bloom", source: "McClean et al., 2018", speaking: true },
  // The call to action
  { text: "Practise it in VoiceLab.", ground: "art-sky", speaking: true },
];

// A voiceover's timings
type Voice = { fps: number; duration: number; phrases: ReadonlyArray<{ start: number; end: number }>; loudness: ReadonlyArray<number> };

// Whether the ad's voiceover has been made and prepared
export const adReady = AD_ID in voices;
// The length the silent preview stands in for, in seconds (the two takes ran 25.4 and 25.6)
const PREVIEW_SECONDS = 25.4;
// The pause between lines in the silent preview, in seconds
const PREVIEW_PAUSE = 0.45;

// Stand-in timings for a silent preview before the voiceover is in: each line as long as its syllables at the voice's pace, a pause after each, and a mouth that opens and closes while a line is said
function previewVoice(): Voice {
  // Each line's syllables
  const counts = LINES.map((line) => line.text.split(" ").reduce((sum, word) => sum + syllables(word), 0));
  // Seconds a syllable, leaving room for the pauses
  const pace = (PREVIEW_SECONDS - PREVIEW_PAUSE * (LINES.length - 1)) / counts.reduce((sum, count) => sum + count, 0);
  // Each line's stretch, one after another
  let at = 0;
  // (worked out in order)
  const phrases = counts.map((count) => {
    // This line's stretch
    const phrase = { start: at, end: at + count * pace };
    // On past it and its pause
    at = phrase.end + PREVIEW_PAUSE;
    // Kept
    return phrase;
  });
  // A loudness for every frame: a soft wobble while a line is said, silence between
  const loudness = Array.from({ length: Math.ceil(PREVIEW_SECONDS * 30) }, (_, frame) => (phrases.some((phrase) => frame / 30 >= phrase.start && frame / 30 < phrase.end) ? 0.06 + 0.05 * Math.abs(Math.sin(frame * 0.9)) : 0));
  // The stand-in timings
  return { fps: 30, duration: PREVIEW_SECONDS, phrases, loudness };
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

// What a line's scene needs: how far through its line we are (0 to 1), a spring that starts at a point in the line, and the blob's breathing, blinking and talking
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

// The hook's first beat: the idea lights up over you
function SceneIdea({ m }: { m: Moment }) {
  // Sky: your bulb pops in, you look up at it
  return (
    <>
      {/* Your idea */}
      <Bulb t={m.t} x={360} y={560} s={1.3 * m.pop(0.2)} lit />
      {/* You, looking up */}
      <You t={m.t} x={360} y={990} r={150} mood="up" breath={m.breath} blink={m.blink} />
      {/* The other person, listening */}
      <Other t={m.t} x={780} y={1030} r={115} mood="ready" />
      {/* The table */}
      <Table y={1110} />
    </>
  );
}

// The hook's second beat: they say it, then get the credit while your bulb goes out
function SceneTaken({ m }: { m: Moment }) {
  // Whether the bulb has gone out yet
  const out = m.through > 0.5;
  // Bloom then plum
  return (
    <>
      {/* Their bubble with your idea in it, until the credit lands */}
      {!out && <g transform={`${grow(m, 0, 765, 800)}`}><Talk x={600} y={560} w={330} h={240} tailX={760}><Bulb t={m.t} x={765} y={670} s={0.7} lit /></Talk></g>}
      {/* The praise they get */}
      {out && <g transform={`${grow(m, 0.5, 780, 700)}`}><Tag x={780} y={700} text="Great idea!" size={50} /></g>}
      {/* Your bulb: lit, flickering as the credit lands, then out */}
      <Bulb t={m.t} x={330} y={620} s={0.9} lit={m.through < 0.5 || (m.through < 0.62 && Math.floor(m.t * 18) % 2 === 0)} />
      {/* You: surprised, then deflated */}
      <You t={m.t} x={330} y={out ? 1010 : 990} r={out ? 140 : 150} mood={out ? "worried" : "wow"} open={out ? 0 : 0.35} breath={m.breath} blink={m.blink} />
      {/* Them: talking, then pleased */}
      <Other t={m.t} x={780} y={out ? 1000 : 1010} r={out ? 135 : 125} mood={out ? "happy" : "talk"} />
      {/* The table */}
      <Table y={1110} />
    </>
  );
}

// The study: a group at a table, talk popping up
function SceneGroup({ m }: { m: Moment }) {
  // Where each person sits: you first, at the left
  const seats = [170, 400, 650, 900];
  // Sun: four at the table, bubbles popping over the others in turn
  return (
    <>
      {/* Bubbles over the other three, one after another */}
      {seats.slice(1).map((x, index) => <g key={x} transform={grow(m, 0.1 + index * 0.18, x, 840)}><Talk x={x - 95} y={index === 1 ? 600 : 680} w={190} h={120} tailX={x}><Dots x={x} y={index === 1 ? 660 : 740} /></Talk></g>)}
      {/* You, quiet */}
      <You t={m.t} x={seats[0]!} y={1020} r={100} mood="ready" breath={m.breath} blink={m.blink} />
      {/* The others, talking or listening */}
      {seats.slice(1).map((x, index) => <Other t={m.t} key={x} x={x} y={1025} r={95} mood={index === 1 ? "ready" : "talk"} />)}
      {/* The table */}
      <Table y={1110} />
    </>
  );
}

// The finding: the one who talks most gets the badge
function SceneBadge({ m }: { m: Moment }) {
  // Whether the badge has landed
  const landed = m.through > 0.72;
  // Bloom: bubbles stack over the talker, then the badge replaces them
  return (
    <>
      {/* Three bubbles stacking, until the badge lands */}
      {!landed && [[620, 400, 760, 740, 470], [700, 550, 800, 820, 620], [600, 700, 760, 720, 770]].map(([x, y, tail, dx, dy], index) => <g key={index} transform={grow(m, 0.05 + index * 0.16, tail!, y! + 140)}><Talk x={x!} y={y!} w={240} h={140} tailX={tail!}><Dots x={dx!} y={dy!} /></Talk></g>)}
      {/* The badge */}
      {landed && <g transform={`${grow(m, 0.72, 770, 720)}`}><Tag x={770} y={720} text="Most competent ✓" size={48} /></g>}
      {/* The talker: talking, then pleased */}
      <Other t={m.t} x={770} y={1010} r={135} mood={landed ? "happy" : "talk"} />
      {/* You: quiet, then surprised */}
      <You t={m.t} x={300} y={1010} r={135} mood={landed ? "wow" : "ready"} open={landed ? 0.35 : 0} breath={m.breath} blink={m.blink} />
      {/* The table */}
      <Table y={1110} />
    </>
  );
}

// The twist: their idea was no better than yours
function SceneEqual({ m }: { m: Moment }) {
  // Sky: two bulbs the same size, then the equals sign
  return (
    <>
      {/* Your idea */}
      <Bulb t={m.t} x={320} y={620} s={1.1 * m.pop(0.05)} lit />
      {/* The equals sign */}
      <g className="fill-art-cream" transform={`${grow(m, 0.45, 540, 620)}`}><rect x="500" y="590" width="80" height="18" rx="9" /><rect x="500" y="630" width="80" height="18" rx="9" /></g>
      {/* Their idea */}
      <Bulb t={m.t} x={760} y={620} s={1.1 * m.pop(0.25)} lit />
      {/* You, puzzled */}
      <You t={m.t} x={320} y={1010} r={135} mood="worried" breath={m.breath} blink={m.blink} />
      {/* Them */}
      <Other t={m.t} x={760} y={1010} r={135} mood="ready" />
      {/* The table */}
      <Table y={1110} />
    </>
  );
}

// The turn: both ideas just as bright
function SceneBoth({ m }: { m: Moment }) {
  // Plum: both bulbs lit, side by side
  return (
    <>
      {/* Your idea */}
      <Bulb t={m.t} x={320} y={600} s={1.2 * m.pop(0)} lit />
      {/* Their idea */}
      <Bulb t={m.t} x={760} y={600} s={1.2 * m.pop(0.15)} lit />
      {/* You */}
      <You t={m.t} x={320} y={1010} r={140} mood="ready" breath={m.breath} blink={m.blink} />
      {/* Them */}
      <Other t={m.t} x={760} y={1010} r={135} mood="ready" />
      {/* The table */}
      <Table y={1110} />
    </>
  );
}

// The turn's second half: the clock, and they went first
function SceneTiming({ m }: { m: Moment }) {
  // Coral: the clock's hand sweeping on, "1st" over them, your bulb gone dim
  return (
    <>
      {/* The clock */}
      <g transform={`${grow(m, 0, 540, 470)}`}><Clock x={540} y={470} r={150} minute={8 + m.through * 22} /></g>
      {/* "1st" over them */}
      <g transform={`${grow(m, 0.35, 790, 720)}`}><Tag x={790} y={720} text="1st" size={56} /></g>
      {/* Your bulb, waiting */}
      <Bulb t={m.t} x={300} y={720} s={0.8} lit={false} />
      {/* You, worried */}
      <You t={m.t} x={300} y={1010} r={135} mood="worried" breath={m.breath} blink={m.blink} />
      {/* Them, talking */}
      <Other t={m.t} x={790} y={1010} r={135} mood="talk" />
      {/* The table */}
      <Table y={1110} />
    </>
  );
}

// The fix: you say something early, a question
function SceneEarly({ m }: { m: Moment }) {
  // Leaf: your "?" bubble, the clock early, you talking
  return (
    <>
      {/* The clock, early in the meeting */}
      <g transform={`${grow(m, 0.3, 820, 470)}`}><Clock x={820} y={470} r={120} minute={3} /></g>
      {/* Your bubble with a question mark */}
      <g transform={`${grow(m, 0.05, 330, 800)}`}><Talk x={190} y={540} w={280} h={240} tailX={330}><text className="fill-accent" x="330" y="710" fontFamily={DISPLAY} fontWeight="700" fontSize="180" textAnchor="middle">?</text></Talk></g>
      {/* You, speaking */}
      <You t={m.t} x={340} y={1000} r={150} mood="ready" open={m.talk} breath={m.breath} blink={m.blink} />
      {/* Them, listening */}
      <Other t={m.t} x={790} y={1020} r={120} mood="ready" />
      {/* The table */}
      <Table y={1110} />
    </>
  );
}

// The second study: you bring a way forward, and the credit lands on you this time
function SceneLeader({ m }: { m: Moment }) {
  // Bloom: your "What if we…?" bubble, then "Great idea!" over you
  return (
    <>
      {/* Your bubble */}
      <g transform={`${grow(m, 0.05, 330, 800)}`}><Talk x={110} y={600} w={470} h={170} tailX={330}><text className="fill-on-warm" x="345" y="705" fontFamily={DISPLAY} fontWeight="700" fontSize="64" textAnchor="middle">What if we…?</text></Talk></g>
      {/* The praise, now yours */}
      <g transform={`${grow(m, 0.6, 345, 470)}`}><Tag x={345} y={470} text="Great idea!" size={50} /></g>
      {/* You, pleased and talking */}
      <You t={m.t} x={340} y={1000} r={150} mood="happy" open={m.talk} breath={m.breath} blink={m.blink} />
      {/* Them, pleased */}
      <Other t={m.t} x={790} y={1010} r={125} mood="happy" />
      {/* The table */}
      <Table y={1110} />
    </>
  );
}

// The call to action: your bulb glowing, you waving
function SceneWave({ m, seconds }: { m: Moment; seconds: number }) {
  // Sky: a big lit bulb over you, waving
  return (
    <>
      {/* Your idea, big */}
      <Bulb t={m.t} x={540} y={560} s={1.5 * m.pop(0)} lit />
      {/* You, waving and talking */}
      <You t={m.t} x={540} y={1000} r={160} mood="happy" open={m.talk} breath={m.breath} blink={m.blink} wave={0.5 + 0.5 * Math.sin(seconds * 9)} />
      {/* The table */}
      <Table y={1110} />
    </>
  );
}

// Each line's scene, in the lines' order
const SCENES: ReadonlyArray<(props: { m: Moment; seconds: number }) => ReactNode> = [SceneIdea, SceneTaken, SceneGroup, SceneBadge, SceneEqual, SceneBoth, SceneTiming, SceneEarly, SceneLeader, SceneWave];

// The headline at the top: a cream pill, clear of the apps' buttons
function Headline({ shown }: { shown: number }) {
  // Centred near the top
  return (
    <div style={{ position: "absolute", left: 60, right: 150, top: 170, display: "flex", justifyContent: "center", opacity: shown, transform: `translateY(${(1 - shown) * -30}px)` }}>
      {/* The pill */}
      <div style={{ padding: "22px 40px", borderRadius: 999, background: role("art-cream"), color: role("on-warm"), fontFamily: DISPLAY, fontWeight: 700, fontSize: 54, letterSpacing: -0.5, whiteSpace: "nowrap" }}>{HEADLINE}</div>
    </div>
  );
}

// The source of a study, small, under the headline
function Source({ text }: { text: string }) {
  // Small cream words
  return <div style={{ position: "absolute", left: 60, right: 150, top: 290, textAlign: "center", fontFamily: BODY, fontWeight: 700, fontSize: 36, color: role("art-cream") }}>{text}</div>;
}

// The caption: the line being said, its current word in the accent, in a cream box whose bottom sits clear of the apps' buttons
function Caption({ text, said, pop }: { text: string; said: number; pop: number }) {
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
  // The line's scene and the moment it is drawn at
  const [line, Scene] = [LINES[index]!, SCENES[index]!];
  // (the moment)
  const moment: Moment = { through: Math.min(1, Math.max(0, (seconds - start) / (end - start))), pop: (at) => springFrom(start + at * (end - start)), breath: 1 + Math.sin(seconds * 2.4) * 0.012, blink: frame % 137 < 4, talk: line.speaking ? loud : 0, t: seconds };
  // Every change of ground: each line's start, and a line's later ground halfway through it
  const changes = LINES.flatMap((each, at) => [{ from: lineStarts[at]!, ground: each.ground }, ...(each.later ? [{ from: (lineStarts[at]! + (lineStarts[at + 1] ?? timing.duration)) / 2, ground: each.later }] : [])]);
  // The latest change so far, and the one before it
  const latest = Math.max(0, changes.filter((change) => seconds >= change.from).length - 1);
  // (the grounds, and how far the new one has faded in, over a quarter of a second)
  const [ground, previous, fade] = [changes[latest]!.ground, changes[Math.max(0, latest - 1)]!.ground, Math.min(1, Math.max(0, (seconds - changes[latest]!.from) / 0.25))];
  // The camera: each line arrives with a quick push in from the right, then drifts slowly closer
  const arrive = springFrom(start, 15);
  // (its scale and slide)
  const [zoom, slide] = [(0.92 + 0.08 * Math.min(1, arrive)) * (1 + 0.04 * moment.through), (1 - arrive) * 90];
  // The word being said: the last in this line that has started
  const said = Math.max(0, words.filter((word) => word.line === index && word.start <= seconds).length - 1);
  // How far the end card has come in
  const closing = seconds > timing.duration ? springFrom(timing.duration + 0.1, 14) : 0;
  // The layers, back to front
  return (
    <AbsoluteFill style={{ fontFamily: BODY }}>
      {/* The theme's colours and classes, and the tile filling its box */}
      <style>{`${THEME_CSS}\n.tile-box svg { width: 100%; height: 100%; }`}</style>
      {/* The voice, once it is made */}
      {adReady && <Audio src={staticFile(`ads/${AD_ID}.mp3`)} />}
      {/* The ground before, under the new one fading in */}
      <Backdrop ground={previous} t={seconds} />
      {/* (the new one) */}
      <Backdrop ground={ground} t={seconds} opacity={fade} />
      {/* The line's scene, through the camera */}
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}><g transform={`translate(${540 + slide} 900) scale(${zoom}) translate(-540 -900)`}><Scene m={moment} seconds={seconds} /></g></svg>
      {/* The headline, in from the first frame */}
      <Headline shown={springFrom(0, 16)} />
      {/* The study's source, when the line cites one */}
      {line.source && <Source text={line.source} />}
      {/* The caption */}
      {seconds <= timing.duration && <Caption text={line.text} said={said} pop={springFrom(start, 15)} />}
      {/* The end card, once the voice is done */}
      {closing > 0 && <EndCard shown={closing} strap={interpolate(seconds, [timing.duration + 0.6, timing.duration + 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />}
    </AbsoluteFill>
  );
}
