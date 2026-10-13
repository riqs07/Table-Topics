// Desktop wireframes in the script-page direction: the same five screens laid out like a printed page with a margin column

// Load the type for components that wrap other content
import type { ReactNode } from "react";

// A browser-window frame holding one desktop screen, with a caption
function Window({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  // Draw the window, its address line, and the caption
  return (
    // A figure keeps the screen and its caption together
    <figure className="w-full max-w-[1040px]">
      {/* The window: dark frame, square-cornered page inside */}
      <div className="overflow-hidden rounded-xl border-4 border-ink bg-paper-raised">
        {/* Address line, so it reads as a browser */}
        <div className="border-b border-rule px-5 py-2 text-footnote italic text-ink-muted">voicelab · {name.toLowerCase()}</div>
        {/* The page itself, fixed height like a laptop screen */}
        <div className="flex h-[620px] flex-col px-14 pt-10">{children}</div>
      </div>
      {/* Screen name and what to look for */}
      <figcaption className="mt-4">
        {/* The screen's name */}
        <span className="block font-display text-xl">{name}</span>
        {/* What the layout does */}
        <span className="mt-1 block italic text-ink-muted">{note}</span>
      </figcaption>
    </figure>
  );
}

// The masthead across the top of the page
function Masthead({ title, note }: { title: string; note: string }) {
  // Title left, italic note right, solid hairline under
  return (
    // Row with the ink rule underneath
    <div className="flex items-baseline justify-between border-b border-ink pb-3">
      {/* Title in small capitals */}
      <span className="text-xl tracking-wide [font-variant-caps:small-caps]">{title}</span>
      {/* Note in italic */}
      <span className="italic text-ink-muted">{note}</span>
    </div>
  );
}

// The two-column body: a narrow margin column and a wide main column, like a printed page
function Columns({ margin, main }: { margin: ReactNode; main: ReactNode }) {
  // Grid with the margin on the left
  return (
    // Fill the remaining height of the page
    <div className="grid flex-1 grid-cols-[240px_1fr] gap-14 pt-8">
      {/* Margin column, smaller text */}
      <aside className="flex flex-col text-footnote leading-relaxed text-ink-muted">{margin}</aside>
      {/* Main column */}
      <div className="flex flex-col">{main}</div>
    </div>
  );
}

// The action band, sized to its column on a computer rather than running edge to edge
function ActionBand({ action, aside }: { action: string; aside: string }) {
  // A square-cornered accent block
  return (
    // Accent block at the bottom of a column
    <div className="mb-10 flex items-baseline justify-between bg-accent px-6 py-5 text-accent-ink">
      {/* The action, large italic */}
      <span className="whitespace-nowrap text-band italic">{action}</span>
      {/* A short aside */}
      <span className="whitespace-nowrap text-sm">{aside}</span>
    </div>
  );
}

// A filler word, marked quietly
function Filler({ children }: { children: ReactNode }) {
  // Filler color with a dotted underline
  return <span className="text-filler underline decoration-dotted underline-offset-4">{children}</span>;
}

// A margin note with a thin rule above it
function MarginNote({ children }: { children: ReactNode }) {
  // Ruled block of margin text
  return <div className="mt-6 border-t border-rule pt-3">{children}</div>;
}

// Flexible space that pushes content to the bottom
function Spacer() {
  // Take up all the remaining height
  return <div className="flex-1" />;
}

// Home: context in the margin, the prompt as the page
function DesktopHome() {
  // Masthead, margin with streak, focus and challenge, the prompt and action in the main column
  return (
    // Window with caption
    <Window name="Home" note="The margin holds the context; the prompt fills the page.">
      {/* Masthead */}
      <Masthead title="VoiceLab" note="History · Settings" />
      {/* Two columns */}
      <Columns
        margin={
          <>
            {/* Streak */}
            <p>Fourth day running.</p>
            {/* Focus */}
            <MarginNote>This week, the second of four: <em className="text-ink">drop the ums</em> and let a pause do the work.</MarginNote>
            {/* Challenge with a square checkbox */}
            <MarginNote>
              {/* Checkbox and text */}
              <span className="flex gap-3"><span className="mt-1 size-3.5 flex-none border-2 border-ink" /><span>Off the page this week: ask one question in a meeting.</span></span>
            </MarginNote>
          </>
        }
        main={
          <>
            {/* The prompt with a hanging quote */}
            <h2 className="relative max-w-[16ch] font-display text-prompt-xl tracking-tight">
              {/* Hanging quote mark in the accent */}
              <span className="absolute -left-[0.42em] text-accent" aria-hidden="true">“</span>
              {/* Prompt text */}
              Describe a small thing that made your week better.
            </h2>
            {/* Swap the prompt */}
            <p className="mt-5 italic text-ink-muted">or choose another</p>
            {/* Push the action down */}
            <Spacer />
            {/* The one action, column width */}
            <div className="max-w-md"><ActionBand action="Speak for a minute" aside="just you" /></div>
          </>
        }
      />
    </Window>
  );
}

// Heights of the level meter bars (sample of a voice), the first several lit
const LEVELS = [30, 55, 40, 70, 85, 60, 45, 65, 50, 35, 20, 40, 55, 30, 25, 45, 20, 15, 35, 25];

// Recording: time and prompt in the margin, meter and words in the main column
function DesktopRecording() {
  // Masthead, margin with time and prompt, main with meter and transcript, stop action
  return (
    // Window with caption
    <Window name="Recording" note="Time and prompt stay in the margin; your words build up like a page being typed.">
      {/* Masthead */}
      <Masthead title="Recording" note="press space to stop" />
      {/* Two columns */}
      <Columns
        margin={
          <>
            {/* Elapsed time, large */}
            <p className="font-display text-statement text-ink">0:42</p>
            {/* Target */}
            <p className="mt-1">of about a minute</p>
            {/* Prompt reminder */}
            <MarginNote><em>Describe a small thing that made your week better.</em></MarginNote>
            {/* Push the escape hatch down */}
            <Spacer />
            {/* Escape hatch */}
            <p className="mb-10 italic">or discard this one without saving</p>
          </>
        }
        main={
          <>
            {/* Level meter */}
            <div className="flex h-14 items-end gap-1.5" role="img" aria-label="Microphone level">
              {/* One bar per sample: lit in the accent, the rest in the rule color */}
              {LEVELS.map((height, index) => (
                // A single bar
                <span key={index} className={`flex-1 ${index < 11 ? "bg-accent" : "bg-rule"}`} style={{ height: `${height}%` }} />
              ))}
            </div>
            {/* Running transcript */}
            <p className="mt-8 max-w-[34ch] font-display text-cue">
              So I was walking home and, <Filler>um</Filler>, I saw this tiny dog wearing a raincoat. It was, <Filler>you know</Filler>, the best part of my
              {/* Words still being heard */}
              <span className="text-ink-muted"> week and I…</span>
            </p>
            {/* Push the action down */}
            <Spacer />
            {/* Stop */}
            <div className="max-w-md"><ActionBand action="Stop" aside="0:42" /></div>
          </>
        }
      />
    </Window>
  );
}

// Feedback: the transcript as the script, the coach's notes in the margin beside it
function DesktopFeedback() {
  // On a wide screen the margin moves to the right so notes sit beside the words they refer to
  return (
    // Window with caption
    <Window name="Feedback" note="The idea a computer allows: your transcript is the script, and the coach writes in the margin beside it.">
      {/* Masthead */}
      <Masthead title="Your take" note="4.2 fillers a minute · 142 words a minute" />
      {/* Main column left, notes on the right */}
      <div className="grid flex-1 grid-cols-[1fr_300px] gap-14 pt-8">
        {/* The transcript as the script */}
        <div className="flex flex-col">
          {/* Small italic heading */}
          <p className="italic text-ink-muted">What you said</p>
          {/* The transcript with fillers marked and the opening highlighted for the change note */}
          <p className="mt-3 max-w-[38ch] text-running">
            <span className="border-l-2 border-accent pl-2">
              <Filler>Um</Filler>, so I think, <Filler>uh</Filler>,
            </span>{" "}
            the best part of my week was walking home. I saw this tiny dog wearing a raincoat, and it was, <Filler>you know</Filler>, just standing there in a puddle like it owned the street.{" "}
            {/* The part the keep note quotes, underlined in ink */}
            <span className="underline decoration-1 underline-offset-4">The best part of my week was the dog.</span>
          </p>
        </div>
        {/* The coach's margin notes */}
        <aside className="flex flex-col text-lede">
          {/* Keep */}
          <p><em>What to keep.</em> You ended strongly, on the underlined line.</p>
          {/* Change, tied to the marked opening */}
          <p className="mt-5 border-l-2 border-accent pl-3"><em>One change.</em> Your opening, marked in green. Take a breath and begin with “The best part…”</p>
          {/* The cue as a pull quote */}
          <div className="mt-6 border-y border-ink py-4">
            {/* Small heading */}
            <p className="text-footnote italic text-ink-muted">Before you try again</p>
            {/* The cue */}
            <p className="mt-1 font-display text-cue">Breathe, then say your first word.</p>
          </div>
          {/* Push the action down */}
          <Spacer />
          {/* Quieter option */}
          <p className="mb-3 text-footnote italic text-ink-muted">or finish for today</p>
          {/* Retry */}
          <ActionBand action="Try it again" aside="same prompt" />
        </aside>
      </div>
    </Window>
  );
}

// Retry result: the change as one large sentence, both tries side by side in the margin
function DesktopRetry() {
  // Masthead, margin with the two tries, main with the statement and note
  return (
    // Window with caption
    <Window name="Retry result" note="One sentence says whether the fix worked; the margin keeps the two tries for comparison.">
      {/* Masthead */}
      <Masthead title="Second try" note="Tuesday" />
      {/* Two columns */}
      <Columns
        margin={
          <>
            {/* First try */}
            <p><em>First try.</em> 0:58, 4.2 fillers a minute.</p>
            {/* Second try */}
            <MarginNote><em className="text-ink">Second try.</em> 0:54, 1.8 fillers a minute.</MarginNote>
            {/* Streak */}
            <MarginNote>Five days running.</MarginNote>
          </>
        }
        main={
          <>
            {/* The statement */}
            <p className="max-w-[18ch] font-display text-statement-xl tracking-tight">
              From 4.2 to <span className="text-accent">1.8</span> fillers a minute.
            </p>
            {/* Coach note */}
            <p className="mt-6 max-w-[48ch] text-lede">You began with “The best part…” and no um before it. Keep that breath for tomorrow.</p>
            {/* Push the action down */}
            <Spacer />
            {/* Finish */}
            <div className="max-w-md"><ActionBand action="Finish" aside="saved" /></div>
          </>
        }
      />
    </Window>
  );
}

// Sample filler rates over time; the first value is the baseline
const TREND = [6.0, 5.2, 5.5, 4.8, 4.9, 4.1, 3.6, 3.9, 3.1, 2.8, 2.4];

// One line of the history contents, with dotted leaders
function HistoryLine({ when, prompt, result }: { when: string; prompt: string; result: string }) {
  // Day, prompt, dots, result
  return (
    // A baseline-aligned row
    <li className="flex items-baseline gap-3 py-2">
      {/* Day in italic, fixed width so prompts line up */}
      <span className="w-16 italic text-ink-muted">{when}</span>
      {/* Prompt */}
      <span>{prompt}</span>
      {/* Dotted leader */}
      <span className="flex-1 border-b border-dotted border-ink-muted" />
      {/* Result */}
      <span>{result}</span>
    </li>
  );
}

// History: progress statement and trend in the margin, contents list in the main column
function DesktopHistory() {
  // Width of the chart
  const width = 240;
  // Height of the chart
  const height = 90;
  // Highest value, for scaling
  const top = Math.max(...TREND);
  // Turn each value into a point
  const points = TREND.map((value, index) => `${(index / (TREND.length - 1)) * width},${height - (value / top) * (height - 8)}`).join(" ");
  // Height of the baseline guide
  const baselineY = height - ((TREND[0] ?? 0) / top) * (height - 8);
  // Masthead, margin with progress, main with the session list
  return (
    // Window with caption
    <Window name="History" note="Progress in the margin; every session listed like a book’s contents.">
      {/* Masthead */}
      <Masthead title="History" note="Fillers, this focus" />
      {/* Two columns */}
      <Columns
        margin={
          <>
            {/* Progress sentence */}
            <p className="font-display text-cue text-ink">Fillers fell from 6.0 to 2.4 a minute since your first recording.</p>
            {/* Trend line */}
            <svg viewBox={`0 0 ${width} ${height}`} className="mt-5 w-full text-accent" role="img" aria-label="Fillers per minute falling from 6.0 to 2.4">
              {/* Baseline guide */}
              <line x1="0" x2={width} y1={baselineY} y2={baselineY} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="2 4" />
              {/* Trend */}
              <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            {/* Link to the first recording */}
            <MarginNote>Listen to your first recording.</MarginNote>
          </>
        }
        main={
          <ul className="text-lede">
            {/* Sessions, newest first */}
            <HistoryLine when="Today" prompt="A small thing that made your week better" result="4.2, then 1.8" />
            <HistoryLine when="Mon" prompt="A place you love" result="3.1" />
            <HistoryLine when="Sun" prompt="Something you changed your mind about" result="3.9" />
            <HistoryLine when="Fri" prompt="Your last good meal" result="3.6" />
            <HistoryLine when="Thu" prompt="A skill you want" result="4.1, then 3.0" />
            <HistoryLine when="Wed" prompt="Your morning" result="4.9" />
            <HistoryLine when="2 Oct" prompt="Your first recording" result="6.0" />
          </ul>
        }
      />
    </Window>
  );
}

// All five desktop screens, stacked
export function DesktopWireframes() {
  // One window per screen, in loop order
  return (
    // Stack with room between windows
    <div className="flex flex-col items-center gap-14">
      <DesktopHome />
      <DesktopRecording />
      <DesktopFeedback />
      <DesktopRetry />
      <DesktopHistory />
    </div>
  );
}
