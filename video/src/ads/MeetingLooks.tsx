// Two ways to show the hook happens in a meeting (trials for choosing): (1) a meeting room, the spotlight hanging over the table; (2) a video call, the active-speaker highlight doing the spotlight's job. Each is drawn at a time t (seconds) along the hook, so the same drawing gives stills now and a clip later

// Load React's node type
import type { ReactNode } from "react";
// Load Remotion's frame and spring
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
// Load the characters and props shared with the storyboard
import { Bulb, Other, Tag, Talk, You } from "../hooks/HookStoryboard";
// Load the colleagues on the call
import { Person } from "./Cast";
// Load the headline and caption from the ad
import { Caption, Headline } from "./QuietInMeetings";
// Load the spotlight's lamp, cone, hop and the hook's timings
import { BULB_ON, BULB_OUT, Cone, LAMP, Lamp, PRAISE, SWING, THEY_TALK, hop } from "./SpotlightHook";
// Load the faces
import { BODY, DISPLAY } from "../kit";
// Load the theme as CSS, and the helpers for inline colours
import { THEME_CSS, role, tint } from "../theme";

// The headline that names the meeting
const HEADLINE = "Why your ideas don't get heard in meetings";

// A spring from a moment, at time t (a pure function, so a still can be drawn at any time)
function springAt(t: number, at: number, damping = 12): number {
  // Remotion's spring at that frame
  return spring({ frame: Math.round((t - at) * 30), fps: 30, config: { damping } });
}

// The caption at time t: the first line, then the second
function captionAt(t: number): { text: string; said: number } {
  // The second line, with its last word
  return t >= 1.9 ? { text: "Then someone else said it.", said: t > 3 ? 4 : t > 2.8 ? 3 : t > 2.5 ? 2 : t > 2.15 ? 1 : 0 } : { text: "You had the idea.", said: t > 0.85 ? 3 : t > 0.6 ? 2 : t > 0.35 ? 1 : 0 };
}

// Whether your bulb is lit at time t: on, flickering as the credit goes, then out
function bulbLit(t: number, out = BULB_OUT): boolean {
  // Lit before it goes out, flickering for a moment after
  return t < out || (t < out + 0.3 && Math.floor(t * 18) % 2 === 0);
}

// The calendar invite that opens the hook: a cream card with a date icon, sliding up and away once the idea lights
function Invite({ t }: { t: number }) {
  // In with a spring, out again after a second
  const [shown, gone] = [springAt(t, 0, 14), springAt(t, 1.15, 16)];
  // Nothing once it has gone
  if (gone > 0.99) return null;
  // Below the headline
  return (
    <div style={{ position: "absolute", left: 120, right: 170, top: 350, display: "flex", gap: 26, alignItems: "center", padding: "22px 30px", borderRadius: 34, background: role("art-cream"), boxShadow: `0 14px 0 ${tint("on-warm", 18)}`, opacity: 1 - gone, transform: `translateY(${(1 - Math.min(1, shown)) * -40 - gone * 80}px) scale(${0.9 + 0.1 * Math.min(1, shown)})` }}>
      {/* The date icon */}
      <div style={{ width: 96, height: 96, borderRadius: 22, background: role("paper"), border: `4px solid ${tint("on-warm", 15)}`, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Its coloured top */}
        <div style={{ width: "100%", height: 26, background: role("art-coral") }} />
        {/* The day */}
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 48, color: role("on-warm"), lineHeight: 1.3 }}>10</div>
      </div>
      {/* The words */}
      <div>
        {/* The meeting's name */}
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 46, color: role("on-warm") }}>Weekly team sync</div>
        {/* When and where */}
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 34, color: tint("on-warm", 65) }}>10:00 · Meeting room 2</div>
      </div>
    </div>
  );
}

// A laptop seen from across the table: its lid's back with a small logo, on a thin base
function Laptop({ x, y }: { x: number; y: number }) {
  // The lid and the base
  return (
    <g>
      {/* The lid */}
      <rect className="fill-ink-muted" x={x - 105} y={y - 120} width="210" height="128" rx="14" />
      {/* A highlight along its top */}
      <rect className="fill-art-cream opacity-15" x={x - 95} y={y - 112} width="190" height="10" rx="5" />
      {/* The logo */}
      <circle className="fill-art-cream opacity-45" cx={x} cy={y - 58} r="13" />
      {/* The base on the table */}
      <rect className="fill-ink-muted" x={x - 128} y={y + 4} width="256" height="14" rx="7" />
    </g>
  );
}

// A mug on the table at x, y (its base), with steam rising at time t
function Mug({ x, y, t, fill }: { x: number; y: number; t: number; fill: string }) {
  // The steam's rise
  const rise = (t * 26) % 26;
  // The mug and its steam
  return (
    <g>
      {/* The handle */}
      <rect className="stroke-current" style={{ color: fill }} x={x + 18} y={y - 52} width="30" height="30" rx="12" fill="none" strokeWidth="9" />
      {/* The body */}
      <rect style={{ fill }} x={x - 30} y={y - 66} width="56" height="66" rx="12" />
      {/* Its shine */}
      <rect className="fill-art-cream opacity-30" x={x - 22} y={y - 58} width="9" height="40" rx="4" />
      {/* Steam */}
      <path className="stroke-art-cream" opacity={0.5 * (1 - rise / 26)} strokeWidth="7" strokeLinecap="round" fill="none" d={`M${x - 4} ${y - 82 - rise}q-12 -14 0 -28t0 -28`} />
    </g>
  );
}

// The meeting room at time t: the screen on the wall, chairs, you and them behind the table with laptops and mugs, the lamp's light swinging from you to them
export function MeetingRoom({ t }: { t: number }): ReactNode {
  // The table's top edge, where the light lands
  const tableY = 1110;
  // Where the light aims: on you, then swinging to them
  const aim = 320 + (770 - 320) * springAt(t, SWING, 9) + Math.sin(t * 1.3) * 6;
  // Whether the light has left you
  const left = t > SWING + 0.15;
  // The caption now
  const caption = captionAt(t);
  // The layers, back to front
  return (
    <AbsoluteFill>
      {/* The theme's colours */}
      <style>{THEME_CSS}</style>
      {/* The wall */}
      <AbsoluteFill style={{ background: role("art-plum") }} />
      {/* The drawing */}
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          {/* Soft edges for the light */}
          <filter id="room-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16" /></filter>
          {/* The beam's glow */}
          <linearGradient id="room-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-art-cream)" stopOpacity="0.4" /><stop offset="1" stopColor="var(--color-art-cream)" stopOpacity="0.14" /></linearGradient>
          {/* The darkness everywhere but the light */}
          <mask id="room-dark"><rect width="1080" height="1920" fill="white" /><g fill="black" filter="url(#room-soft)"><Cone aim={aim} /></g></mask>
        </defs>
        {/* The lower wall, a shade darker */}
        <rect className="fill-on-warm opacity-10" y="880" width="1080" height="1040" />
        {/* The screen on the wall: its bezel */}
        <rect className="fill-on-warm opacity-75" x="560" y="440" width="400" height="270" rx="24" />
        {/* (its glowing face) */}
        <rect className="fill-art-cream" x="574" y="454" width="372" height="242" rx="14" />
        {/* The slide's title */}
        <text className="fill-on-warm" x="602" y="510" fontFamily={DISPLAY} fontWeight="700" fontSize="38">Q3 planning</text>
        {/* Two lines of notes */}
        {[546, 576].map((y, index) => <rect key={y} className="fill-on-warm opacity-20" x="602" y={y} width={[180, 140][index]} height="12" rx="6" />)}
        {/* A small bar chart */}
        {[["art-sky", 90], ["art-coral", 150], ["art-sun", 120], ["art-leaf", 190]].map(([fill, height], index) => <rect key={index} className={`fill-${fill}`} x={612 + index * 76} y={668 - (height as number) * 0.55} width="50" height={(height as number) * 0.55} rx="9" />)}
        {/* The chart's baseline */}
        <rect className="fill-on-warm opacity-30" x="600" y="668" width="320" height="5" rx="3" />
        {/* The light's glow, behind everyone so whoever sits in it keeps their colour */}
        <path fill="url(#room-beam)" d={`M${LAMP.x - 58} ${LAMP.y + 44}L${LAMP.x + 58} ${LAMP.y + 44}L${aim + 250} 1150L${aim - 250} 1150z`} filter="url(#room-soft)" />
        {/* Your chair's back */}
        <rect className="fill-on-warm opacity-45" x="175" y="820" width="290" height="300" rx="60" />
        {/* Their chair's back */}
        <rect className="fill-on-warm opacity-45" x="635" y="830" width="270" height="290" rx="60" />
        {/* Your idea over you */}
        <Bulb x={320} y={700} s={1.1 * springAt(t, BULB_ON)} lit={bulbLit(t)} t={t} />
        {/* Their bubble with your idea in it, while they say it */}
        {t > THEY_TALK && t < PRAISE && <g transform={`translate(770 830) scale(${springAt(t, THEY_TALK)}) translate(-770 -830)`}><Talk x={630} y={600} w={280} h={200} tailX={770}><Bulb x={770} y={692} s={0.56} lit /></Talk></g>}
        {/* The praise they get */}
        {t > PRAISE && <g transform={`translate(770 790) rotate(${(1 - Math.min(1, springAt(t, PRAISE))) * -16}) scale(${springAt(t, PRAISE)}) translate(-770 -790)`}><Tag x={770} y={790} text="Great idea!" size={52} /></g>}
        {/* You, behind the table */}
        <You x={320} y={985 + hop(t, BULB_ON)} r={150} mood={left ? "worried" : t > THEY_TALK ? "wow" : "up"} open={!left && t > THEY_TALK ? 0.3 : 0} t={t} breath={1 + Math.sin(t * 2.4) * 0.012} />
        {/* Them, behind the table */}
        <Other x={770} y={990 + hop(t, SWING + 0.25)} r={140} mood={t > PRAISE ? "happy" : t > THEY_TALK ? "talk" : "ready"} t={t} />
        {/* The table's top, wider at the front */}
        <path className="fill-art-cream" d={`M150 ${tableY}H930L1020 1220H60z`} />
        {/* Its front edge */}
        <rect className="fill-on-warm opacity-30" x="60" y="1220" width="960" height="44" rx="10" />
        {/* Your laptop */}
        <Laptop x={250} y={1196} />
        {/* Their laptop */}
        <Laptop x={840} y={1196} />
        {/* A mug between you */}
        <Mug x={545} y={1200} t={t} fill={role("art-coral")} />
        {/* The darkness over everything outside the light */}
        <rect className="fill-on-warm" width="1080" height="1920" opacity="0.45" mask="url(#room-dark)" />
        {/* The lamp over the table */}
        <Lamp aim={aim} />
      </svg>
      {/* The invite that sets the scene */}
      <Invite t={t} />
      {/* The headline */}
      <Headline shown={1} text={HEADLINE} />
      {/* The caption */}
      <Caption text={caption.text} said={caption.said} pop={1} />
    </AbsoluteFill>
  );
}

// The people on the call: their name, the tile's colour, and where the tile sits
const CALL = [
  // You, top left
  { name: "You", ground: "art-sky", x: 60, y: 430 },
  // Sam, who says your idea, top right
  { name: "Sam", ground: "art-leaf", x: 555, y: 430 },
  // Priya, bottom left
  { name: "Priya", ground: "art-sun", x: 60, y: 855 },
  // Alex, bottom right
  { name: "Alex", ground: "art-bloom", x: 555, y: 855 },
] as const;
// Where each colleague looks: at you while the idea is yours, then at Sam once he has the floor (Sam looks at you, then out at everyone)
function gaze(index: number, samTalking: boolean): { look: number; lookUp: number } {
  // Sam, top right: toward you on his left, then straight out
  if (index === 1) return samTalking ? { look: 0, lookUp: 0 } : { look: -1, lookUp: 0 };
  // Priya, bottom left: up at you, then up and right at Sam
  if (index === 2) return samTalking ? { look: 1, lookUp: 1 } : { look: 0, lookUp: 1 };
  // Alex, bottom right: up and left at you, then up at Sam
  return samTalking ? { look: 0, lookUp: 1 } : { look: -1, lookUp: 1 };
}

// A small muted microphone at x, y (its middle): the mic with a line through it
function MutedMic({ x, y }: { x: number; y: number }) {
  // The mic, its stand, and the slash
  return (
    <g className="stroke-art-cream" strokeWidth="4.5" strokeLinecap="round" fill="none">
      {/* The mic's head */}
      <rect x={x - 7} y={y - 15} width="14" height="20" rx="7" />
      {/* Its cradle and stand */}
      <path d={`M${x - 12} ${y}q0 12 12 12t12 -12M${x} ${y + 12}v6`} />
      {/* The slash */}
      <path className="stroke-art-coral" d={`M${x - 14} ${y - 16}l28 32`} />
    </g>
  );
}

// A tile's size
const [TILE_W, TILE_H] = [465, 395];

// The moments the call turns on, in seconds: your bulb lights, Sam starts talking, the highlight jumps to him, your bulb dies, the praise lands
export type CallBeats = { bulbOn: number; talk: number; swing: number; out: number; praise: number };
// The hook's own timings, for the stand-alone stills and clip
const HOOK_BEATS: CallBeats = { bulbOn: BULB_ON, talk: THEY_TALK, swing: SWING, out: BULB_OUT, praise: PRAISE };

// The video call at time t: four tiles, the active-speaker highlight on you, then jumping to Sam as he says your idea, with a quick zoom onto his tile; with its own headline and caption unless the ad draws them
export function VideoCall({ t, beats = HOOK_BEATS, chrome = true }: { t: number; beats?: CallBeats; chrome?: boolean }): ReactNode {
  // The moments, by name
  const { bulbOn: BULB_ON, talk: THEY_TALK, swing: SWING, out: BULB_OUT, praise: PRAISE } = beats;
  // The zoom onto Sam's tile as the highlight jumps: in quickly, held
  const zoom = 1 + 0.07 * Math.min(1, springAt(t, SWING, 14));
  // Who is lit as the speaker: you, then Sam once he takes your idea
  const speaker = t > SWING ? 1 : 0;
  // How far the highlight has popped onto its tile
  const ring = springAt(t, speaker === 1 ? SWING : 0, 10);
  // Whether the light has left you
  const left = t > SWING + 0.15;
  // The caption now
  const caption = captionAt(t);
  // The layers, back to front
  return (
    <AbsoluteFill>
      {/* The theme's colours */}
      <style>{THEME_CSS}</style>
      {/* The app's dark window */}
      <AbsoluteFill style={{ background: tint("on-warm", 92) }} />
      {/* The call's title bar, with a red recording dot */}
      <div style={{ position: "absolute", left: 60, right: 150, top: 352, display: "flex", alignItems: "center", gap: 16, fontFamily: BODY, fontWeight: 700, fontSize: 36, color: role("art-cream") }}>
        {/* The dot */}
        <div style={{ width: 22, height: 22, borderRadius: 11, background: role("art-coral") }} />
        {/* The meeting */}
        Weekly team sync · 10:02
      </div>
      {/* The tiles, zooming toward Sam's as he takes the floor */}
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "787px 627px" }}>
        <defs>
          {/* Each tile's shape, so the people are cut off at its edges */}
          {CALL.map((person) => <clipPath key={person.name} id={`tile-${person.name}`}><rect x={person.x} y={person.y} width={TILE_W} height={TILE_H} rx="30" /></clipPath>)}
        </defs>
        {/* Each person's tile */}
        {CALL.map((person, index) => (
          <g key={person.name}>
            {/* The tile and what is in it, cut to its shape */}
            <g clipPath={`url(#tile-${person.name})`}>
              {/* Their room's colour */}
              <rect className={`fill-${person.ground}`} x={person.x} y={person.y} width={TILE_W} height={TILE_H} />
              {/* A soft circle behind them, as on the tiles */}
              <circle className="fill-art-cream opacity-15" cx={person.x + TILE_W - 70} cy={person.y + 60} r="150" />
              {/* You, with your idea */}
              {index === 0 && <><Bulb x={person.x + TILE_W / 2} y={person.y + 105} s={0.72 * springAt(t, BULB_ON)} lit={bulbLit(t, BULB_OUT)} t={t} /><You x={person.x + TILE_W / 2} y={person.y + 300 + hop(t, BULB_ON, 20)} r={120} mood={left ? "worried" : t > THEY_TALK ? "wow" : "up"} open={!left && t > THEY_TALK ? 0.3 : 0} t={t} /></>}
              {/* The others, each their own character, their eyes on whoever is speaking */}
              {index > 0 && <Person who={(["sam", "priya", "alex"] as const)[index - 1]!} x={person.x + TILE_W / 2} y={person.y + 290 + (index === 1 ? hop(t, SWING + 0.2, 20) : 0)} r={112} mood={index === 1 ? (t > PRAISE ? "happy" : t > THEY_TALK ? "talk" : "ready") : t > PRAISE ? "happy" : "ready"} t={t} {...gaze(index, t > THEY_TALK)} />}
              {/* Your tile dims once the highlight leaves you */}
              {index === 0 && left && <rect className="fill-on-warm" opacity="0.4" x={person.x} y={person.y} width={TILE_W} height={TILE_H} />}
            </g>
            {/* Their name, bottom left */}
            <rect className="fill-on-warm opacity-60" x={person.x + 20} y={person.y + TILE_H - 66} width={person.name.length * 22 + (index === 0 ? 92 : 44)} height="48" rx="14" />
            {/* (the name itself) */}
            <text className="fill-art-cream" x={person.x + 42} y={person.y + TILE_H - 31} fontFamily={BODY} fontWeight="700" fontSize="32">{person.name}</text>
            {/* Your mic, muted: the quiet one on the call */}
            {index === 0 && <MutedMic x={person.x + 132} y={person.y + TILE_H - 42} />}
          </g>
        ))}
        {/* The active-speaker highlight */}
        <rect className="stroke-art-sun" fill="none" strokeWidth={10 + (1 - Math.min(1, ring)) * 10} x={CALL[speaker].x} y={CALL[speaker].y} width={TILE_W} height={TILE_H} rx="30" opacity={Math.min(1, ring)} />
        {/* Sam's bubble with your idea in it, while he says it */}
        {t > THEY_TALK && t < PRAISE && <g transform={`translate(1000 500) scale(${springAt(t, THEY_TALK)}) translate(-1000 -500)`}><Talk x={810} y={455} w={190} h={140} tailX={900}><Bulb x={905} y={516} s={0.4} lit /></Talk></g>}
        {/* The praise in the chat, over Priya and Alex */}
        {t > PRAISE && <g transform={`translate(790 905) rotate(${(1 - Math.min(1, springAt(t, PRAISE))) * -10}) scale(${springAt(t, PRAISE)}) translate(-790 -905)`}><Tag x={790} y={905} text="Great idea, Sam!" size={44} /></g>}
      </svg>
      {/* The headline and caption, unless the ad draws its own */}
      {chrome && <><Headline shown={1} text={HEADLINE} /><Caption text={caption.text} said={caption.said} pop={1} /></>}
    </AbsoluteFill>
  );
}

// The video-call hook as a clip (hook B): the call drawn at each frame's time
export function CallHook(): ReactNode {
  // This frame and the rate
  const [frame, { fps }] = [useCurrentFrame(), useVideoConfig()];
  // The call at this moment
  return <VideoCall t={frame / fps} />;
}
