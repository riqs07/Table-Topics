// Wireframes of the core loop in the script-page direction, for approval at checkpoint C11 (sample content)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the type for components that wrap other content
import type { ReactNode } from "react";
// Load the desktop versions of the screens
import { DesktopWireframes } from "./desktop";

// Tab title for the wireframes page
export const metadata: Metadata = { title: "Wireframes · VoiceLab" };

// One phone-sized screen with a caption and a note explaining it
function Phone({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  // Draw the frame, the screen, and the caption
  return (
    // A figure keeps the screen and its caption together
    <figure className="w-full max-w-[360px]">
      {/* The phone screen: fixed height, dark frame, square-cornered content inside */}
      <div className="flex h-[740px] flex-col overflow-hidden rounded-[2.25rem] border-8 border-ink bg-paper-raised px-6 pt-6">{children}</div>
      {/* Screen name and what to look for */}
      <figcaption className="mt-4">
        {/* The screen's name */}
        <span className="block font-display text-xl">{name}</span>
        {/* What the screen is for */}
        <span className="mt-1 block italic text-ink-muted">{note}</span>
      </figcaption>
    </figure>
  );
}

// The masthead line at the top of every screen: name or title left, italic note right
function Masthead({ title, note }: { title: string; note: string }) {
  // A baseline-aligned row over a solid hairline
  return (
    // Row with the ink-colored rule underneath
    <div className="flex items-baseline justify-between border-b border-ink pb-2">
      {/* Title in small capitals */}
      <span className="text-lg tracking-wide [font-variant-caps:small-caps]">{title}</span>
      {/* Note in italic */}
      <span className="italic text-ink-muted">{note}</span>
    </div>
  );
}

// The full-width action band at the bottom of a screen
function ActionBand({ action, aside }: { action: string; aside: string }) {
  // A square-cornered band that runs edge to edge
  return (
    // Accent band, pulled out to the screen edges
    <div className="-mx-6 flex items-baseline justify-between bg-accent px-6 pb-8 pt-5 text-accent-ink">
      {/* The action, large italic */}
      <span className="whitespace-nowrap text-band italic">{action}</span>
      {/* A short aside */}
      <span className="whitespace-nowrap text-sm">{aside}</span>
    </div>
  );
}

// A footnote line above the action band, optionally with a square checkbox
function Footnote({ children, box = false }: { children: ReactNode; box?: boolean }) {
  // A ruled line of smaller text
  return (
    // Row with a thin rule above
    <div className="flex items-start gap-3 border-t border-rule py-3 text-footnote leading-snug">
      {/* The square checkbox, when asked for */}
      {box && <span className="mt-1 size-3.5 flex-none border-2 border-ink" />}
      {/* The note itself */}
      <span>{children}</span>
    </div>
  );
}

// A filler word, marked quietly
function Filler({ children }: { children: ReactNode }) {
  // Filler color with a dotted underline, never red
  return <span className="text-filler underline decoration-dotted underline-offset-4">{children}</span>;
}

// Flexible space that pushes the footer to the bottom
function Spacer() {
  // Take up all the remaining height
  return <div className="flex-1" />;
}

// Screen 1: home
function HomeScreen() {
  // Masthead, a sentence of context, the prompt, a footnote, the action band
  return (
    // Phone frame with caption
    <Phone name="Home" note="The prompt is the page. Streak and focus are one sentence, not widgets.">
      {/* Name and links */}
      <Masthead title="VoiceLab" note="History · Settings" />
      {/* Streak and focus as a sentence */}
      <p className="mt-5 text-lede text-ink-muted">
        Fourth day running. This week: <em className="text-ink">drop the ums</em> and let a pause do the work.
      </p>
      {/* The prompt, set like a headline with a hanging opening quote */}
      <h2 className="relative mt-9 font-display text-prompt tracking-tight">
        {/* Hanging quote mark in the accent color */}
        <span className="absolute -left-[0.42em] text-accent" aria-hidden="true">“</span>
        {/* The prompt text */}
        Describe a small thing that made your week better.
      </h2>
      {/* Swap the prompt */}
      <p className="mt-4 italic text-ink-muted">or choose another</p>
      {/* Push the footer down */}
      <Spacer />
      {/* Weekly challenge as a footnote */}
      <Footnote box>Off the page this week: ask one question in a meeting.</Footnote>
      {/* The one action */}
      <ActionBand action="Speak for a minute" aside="just you" />
    </Phone>
  );
}

// Heights of the level meter bars (sample of a voice), the first few lit
const LEVELS = [30, 55, 40, 70, 85, 60, 45, 25, 50, 35, 20, 15];

// Screen 2: recording
function RecordingScreen() {
  // Masthead with time, prompt reminder, level meter, running transcript, stop band
  return (
    // Phone frame with caption
    <Phone name="Recording" note="A moving level meter says it is listening; your words appear as running text.">
      {/* Title and elapsed time */}
      <Masthead title="Recording" note="0:42 of about a minute" />
      {/* Prompt reminder in italic */}
      <p className="mt-5 italic text-ink-muted">Describe a small thing that made your week better.</p>
      {/* Live level meter, borrowed from the tape-recorder direction */}
      <div className="mt-6 flex h-12 items-end gap-1.5" role="img" aria-label="Microphone level">
        {/* One bar per level sample: lit bars in the accent, the rest in the rule color */}
        {LEVELS.map((height, index) => (
          // A single bar
          <span key={index} className={`flex-1 ${index < 6 ? "bg-accent" : "bg-rule"}`} style={{ height: `${height}%` }} />
        ))}
      </div>
      {/* What has been heard so far, as running serif text */}
      <p className="mt-7 text-running">
        So I was walking home and, <Filler>um</Filler>, I saw this tiny dog wearing a raincoat. It was, <Filler>you know</Filler>, the best part of my
        {/* Words still being heard, lighter */}
        <span className="text-ink-muted"> week and I…</span>
      </p>
      {/* Push the footer down */}
      <Spacer />
      {/* Escape hatch as a footnote */}
      <Footnote>or discard this one without saving</Footnote>
      {/* Stop */}
      <ActionBand action="Stop" aside="0:42" />
    </Phone>
  );
}

// Screen 3: feedback
function FeedbackScreen() {
  // The focus number as a sentence, keep and change as paragraphs, the cue as a pull quote
  return (
    // Phone frame with caption
    <Phone name="Feedback" note="Feedback reads like a coach’s note: two short paragraphs and one line to carry into the retry.">
      {/* Title and secondary numbers */}
      <Masthead title="Your take" note="142 words a minute" />
      {/* The focus number, as a headline sentence */}
      <p className="mt-5 font-display text-3xl">4.2 fillers a minute.</p>
      {/* Keep, with a run-in italic heading */}
      <p className="mt-5 text-lede">
        <em>What to keep.</em> You ended strongly: “the best part of my week was the dog.”
      </p>
      {/* Change, with a run-in heading and the accent rule in the margin */}
      <p className="-ml-4 mt-4 border-l-2 border-accent pl-[14px] text-lede">
        <em>One change.</em> You opened with “Um, so I think, uh.” Take a breath and begin with “The best part…”
      </p>
      {/* The cue, set as a pull quote */}
      <div className="mt-6 border-y border-ink py-4">
        {/* Small italic heading */}
        <p className="italic text-ink-muted">Before you try again</p>
        {/* The cue itself, large */}
        <p className="mt-1 font-display text-cue">Breathe, then say your first word.</p>
      </div>
      {/* Push the footer down */}
      <Spacer />
      {/* Quieter options as a footnote */}
      <Footnote>Read what I said · or finish for today</Footnote>
      {/* Retry is the main action */}
      <ActionBand action="Try it again" aside="same prompt" />
    </Phone>
  );
}

// Screen 4: retry result
function RetryResultScreen() {
  // Before and after as a sentence, a short note, a footnote, finish
  return (
    // Phone frame with caption
    <Phone name="Retry result" note="Did the fix work? Said plainly, in one sentence, minutes after the first try.">
      {/* Title */}
      <Masthead title="Second try" note="Tuesday" />
      {/* The change, as a headline sentence with the new number emphasised */}
      <p className="mt-6 font-display text-statement tracking-tight">
        From 4.2 to <span className="text-accent">1.8</span> fillers a minute.
      </p>
      {/* Coach note */}
      <p className="mt-5 text-lede">
        You began with “The best part…” and no um before it. Keep that breath for tomorrow.
      </p>
      {/* Push the footer down */}
      <Spacer />
      {/* Streak as a footnote */}
      <Footnote>Five days running.</Footnote>
      {/* Finish */}
      <ActionBand action="Finish" aside="saved" />
    </Phone>
  );
}

// Sample filler rates over time for the history trend; the first value is the baseline
const TREND = [6.0, 5.2, 4.8, 4.9, 3.6, 3.1, 2.4];

// One line in the history list, with dotted leaders like a table of contents
function HistoryLine({ when, prompt, result }: { when: string; prompt: string; result: string }) {
  // Day and prompt on the left, the number on the right, dots between
  return (
    // A baseline-aligned row
    <li className="flex items-baseline gap-2 py-2">
      {/* Day in italic */}
      <span className="italic text-ink-muted">{when}</span>
      {/* Prompt */}
      <span>{prompt}</span>
      {/* Dotted leader filling the space */}
      <span className="flex-1 border-b border-dotted border-ink-muted" />
      {/* Result */}
      <span>{result}</span>
    </li>
  );
}

// Screen 5: history
function HistoryScreen() {
  // Width of the small chart
  const width = 300;
  // Height of the small chart
  const height = 80;
  // Highest value, for scaling
  const top = Math.max(...TREND);
  // Turn each value into an x,y point
  const points = TREND.map((value, index) => `${(index / (TREND.length - 1)) * width},${height - (value / top) * (height - 8)}`).join(" ");
  // Height of the baseline guide line
  const baselineY = height - ((TREND[0] ?? 0) / top) * (height - 8);
  // Standfirst, trend, list like a table of contents
  return (
    // Phone frame with caption
    <Phone name="History" note="One sentence of progress against your first recording, one line, then sessions like a contents page.">
      {/* Title */}
      <Masthead title="History" note="Fillers this focus" />
      {/* Progress as a sentence */}
      <p className="mt-5 font-display text-cue">
        Since your first recording on 2 October, fillers fell from 6.0 to 2.4 a minute.
      </p>
      {/* The trend line, in the accent color */}
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-5 w-full text-accent" role="img" aria-label="Fillers per minute falling from 6.0 to 2.4">
        {/* Dotted guide at the baseline value */}
        <line x1="0" x2={width} y1={baselineY} y2={baselineY} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="2 4" />
        {/* The trend line */}
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      {/* Past sessions */}
      <ul className="mt-5 border-t border-ink pt-2 text-base">
        {/* A session with a retry */}
        <HistoryLine when="Today" prompt="A small thing" result="4.2, then 1.8" />
        {/* A session without a retry */}
        <HistoryLine when="Mon" prompt="A place you love" result="3.1" />
        {/* An older session */}
        <HistoryLine when="Fri" prompt="Your last meal" result="3.6" />
        {/* The baseline */}
        <HistoryLine when="2 Oct" prompt="Your first recording" result="6.0" />
      </ul>
      {/* Push the footer down */}
      <Spacer />
      {/* Link to the first recording's audio */}
      <Footnote>Listen to your first recording.</Footnote>
      {/* Back to practice */}
      <ActionBand action="Back to today" aside="4 days" />
    </Phone>
  );
}

// The wireframes page: all five screens in the app theme
export default function WireframesPage() {
  // Heading, explanation, and the screens
  return (
    // The app theme, so the type and accent can be judged
    <main id="main" data-theme="calm-studio" className="min-h-dvh px-4 py-10">
      {/* Intro column */}
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <h1 className="font-display text-4xl">Wireframes</h1>
        {/* How to review */}
        <p className="mt-2 max-w-prose text-lg italic text-ink-muted">
          The core loop as a printed script: serif type, prose instead of widgets, square edges, one action band per screen. Sample content. Approve or redirect at checkpoint C11.
        </p>
        {/* The screens in loop order, wrapping on narrow screens */}
        <div className="mt-10 flex flex-wrap justify-center gap-12">
          <HomeScreen />
          <RecordingScreen />
          <FeedbackScreen />
          <RetryResultScreen />
          <HistoryScreen />
        </div>
        {/* Desktop versions of the same screens */}
        <section className="mt-20 border-t border-ink pt-10">
          {/* Section heading */}
          <h2 className="font-display text-3xl">On a computer</h2>
          {/* What changes on a wide screen */}
          <p className="mt-2 max-w-prose text-lg italic text-ink-muted">
            The same five screens on a wide window. The page gains a margin column, like a printed book: context and notes go there, the main column keeps the one thing that matters.
          </p>
          {/* The desktop screens */}
          <div className="mt-10">
            <DesktopWireframes />
          </div>
        </section>
      </div>
    </main>
  );
}
