// Grayscale wireframes of the core loop, for approval at checkpoint C11 (layout only; sample content)

// Load the type for page metadata
import type { Metadata } from "next";
// Load the type for components that wrap other content
import type { ReactNode } from "react";
// Load the icons used in the wireframes (server-safe versions)
import { ArrowCounterClockwiseIcon, ClockCounterClockwiseIcon, GearSixIcon, MicrophoneIcon, StopIcon } from "@phosphor-icons/react/dist/ssr";

// Tab title for the wireframes page
export const metadata: Metadata = { title: "Wireframes · VoiceLab" };

// One phone-sized screen with a caption and a note explaining it
function Phone({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  // Draw the frame, the screen, and the caption
  return (
    // A figure keeps the screen and its caption together
    <figure className="w-full max-w-[360px]">
      {/* The phone screen: fixed height, rounded border */}
      <div className="flex h-[700px] flex-col overflow-hidden rounded-3xl border-2 bg-paper">{children}</div>
      {/* Screen name and what to look for */}
      <figcaption className="mt-3">
        {/* The screen's name */}
        <span className="font-display text-lg">{name}</span>
        {/* What the screen is for */}
        <span className="mt-1 block text-sm text-ink-muted">{note}</span>
      </figcaption>
    </figure>
  );
}

// The thin bar at the top of most screens
function TopBar({ title }: { title: string }) {
  // App name or screen title on the left, history and settings on the right
  return (
    // A row with a dividing line underneath
    <div className="flex items-center justify-between border-b px-5 py-4">
      {/* Title */}
      <span className="font-display text-lg">{title}</span>
      {/* Shortcuts to history and settings */}
      <span className="flex gap-4 text-ink-muted">
        {/* History icon, labeled for screen readers */}
        <ClockCounterClockwiseIcon size={22} aria-label="History" />
        {/* Settings icon, labeled for screen readers */}
        <GearSixIcon size={22} aria-label="Settings" />
      </span>
    </div>
  );
}

// A small label above a block of content
function Label({ children }: { children: ReactNode }) {
  // Small, spaced-out, muted text
  return <p className="text-xs uppercase tracking-widest text-ink-muted">{children}</p>;
}

// Sample transcript with fillers marked, shared by several screens
function SampleTranscript() {
  // Words with fillers in the quiet filler style
  return (
    // Lifted panel holding the transcript
    <p className="rounded-md bg-paper-raised p-4 leading-relaxed">
      {/* Opening words */}
      So I was walking home and, <span className="text-filler underline decoration-dotted underline-offset-4">um</span>, I saw this tiny dog wearing a raincoat. It was,{" "}
      {/* A phrase filler */}
      <span className="text-filler underline decoration-dotted underline-offset-4">you know</span>, the best part of my
      {/* Words still being heard, shown lighter */}
      <span className="text-ink-muted"> week and I…</span>
    </p>
  );
}

// Screen 1: home
function HomeScreen() {
  // Streak, focus, prompt, one record button, weekly challenge
  return (
    // Phone frame with caption
    <Phone name="Home" note="One action: record. Focus and streak are context, not homework.">
      {/* Top bar */}
      <TopBar title="VoiceLab" />
      {/* Main content */}
      <div className="flex flex-1 flex-col px-5 py-6">
        {/* Showing-up streak */}
        <p className="text-sm text-ink-muted">4 days in a row</p>
        {/* This week's focus */}
        <div className="mt-4 border-l-4 border-accent pl-3">
          {/* Week number */}
          <Label>This week · 2 of 4</Label>
          {/* Focus name and one-line explanation */}
          <p className="mt-1">Cut filler words. Replace um and uh with a short pause.</p>
        </div>
        {/* Today's prompt, the visual centre of the screen */}
        <div className="mt-10">
          {/* Label */}
          <Label>Today’s prompt</Label>
          {/* The prompt in the display font */}
          <h2 className="mt-2 font-display text-3xl leading-tight">Describe a small thing that made your week better.</h2>
          {/* Option to swap the prompt */}
          <p className="mt-3 text-sm text-ink-muted underline underline-offset-4">Different prompt</p>
        </div>
        {/* Push the button to the lower third, within thumb reach */}
        <div className="flex-1" />
        {/* The one main action */}
        <button type="button" className="flex items-center justify-center gap-2 rounded-full bg-accent py-4 text-lg text-accent-ink">
          {/* Microphone icon */}
          <MicrophoneIcon size={22} weight="fill" aria-hidden="true" />
          {/* Button text */}
          Start speaking
        </button>
        {/* About a minute */}
        <p className="mt-2 text-center text-sm text-ink-muted">About a minute. Only you will hear it.</p>
        {/* Weekly real-world challenge */}
        <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm">
          {/* The challenge */}
          <span>This week: ask one question in a meeting.</span>
          {/* Mark it done */}
          <span className="rounded-full border px-3 py-1">Done</span>
        </div>
      </div>
    </Phone>
  );
}

// Screen 2: recording
function RecordingScreen() {
  // Prompt reminder, timer, live transcript, stop button
  return (
    // Phone frame with caption
    <Phone name="Recording" note="Live words appear as you speak. Fillers are marked quietly, never red.">
      {/* Main content */}
      <div className="flex flex-1 flex-col px-5 py-6">
        {/* Prompt reminder, small */}
        <p className="text-sm text-ink-muted">Describe a small thing that made your week better.</p>
        {/* Timer, large */}
        <p className="mt-6 text-center font-display text-6xl tabular-nums">0:42</p>
        {/* Gentle target */}
        <p className="mt-1 text-center text-sm text-ink-muted">Aim for about a minute. Stop whenever you’re done.</p>
        {/* Live transcript */}
        <div className="mt-8">
          {/* Label */}
          <Label>What I’m hearing</Label>
          {/* The transcript */}
          <div className="mt-2">
            <SampleTranscript />
          </div>
        </div>
        {/* Push the button down */}
        <div className="flex-1" />
        {/* Stop button */}
        <button type="button" className="flex items-center justify-center gap-2 rounded-full bg-accent py-4 text-lg text-accent-ink">
          {/* Stop icon */}
          <StopIcon size={22} weight="fill" aria-hidden="true" />
          {/* Button text */}
          Stop
        </button>
        {/* Escape hatch */}
        <p className="mt-3 text-center text-sm text-ink-muted underline underline-offset-4">Cancel and don’t save</p>
      </div>
    </Phone>
  );
}

// Screen 3: feedback
function FeedbackScreen() {
  // Focus number, keep, change, retry cue, two buttons
  return (
    // Phone frame with caption
    <Phone name="Feedback" note="One number for this week’s focus, then keep / change / cue. Retry is the main action.">
      {/* Top bar */}
      <TopBar title="Your feedback" />
      {/* Main content */}
      <div className="flex flex-1 flex-col px-5 py-5">
        {/* The focus number, with the second number quieter */}
        <div className="flex items-end gap-6 border-b pb-4">
          {/* Focus number */}
          <div>
            {/* The value */}
            <p className="font-display text-4xl">4.2</p>
            {/* What it is */}
            <p className="text-sm text-ink-muted">fillers / min</p>
          </div>
          {/* Secondary number */}
          <p className="pb-1 text-sm text-ink-muted">142 words / min · 0:58</p>
        </div>
        {/* Keep */}
        <div className="mt-5">
          {/* Label */}
          <Label>Keep</Label>
          {/* The thing done well, quoting the user */}
          <p className="mt-1">You ended strongly: “the best part of my week was the dog.”</p>
        </div>
        {/* Change, marked with the accent */}
        <div className="mt-5 border-l-4 border-accent pl-3">
          {/* Label */}
          <Label>Change</Label>
          {/* The one fix with an example */}
          <p className="mt-1">You opened with “Um, so I think, uh.” Take a breath and start with “The best part…”</p>
        </div>
        {/* Retry cue */}
        <div className="mt-5 rounded-md bg-paper-raised p-4">
          {/* Label */}
          <Label>Before you retry</Label>
          {/* The cue */}
          <p className="mt-1 font-display text-xl">Breathe, then say your first word.</p>
        </div>
        {/* Link to the full transcript */}
        <p className="mt-4 text-sm text-ink-muted underline underline-offset-4">Show what I said</p>
        {/* Push the buttons down */}
        <div className="flex-1" />
        {/* Retry: main action */}
        <button type="button" className="flex items-center justify-center gap-2 rounded-full bg-accent py-4 text-lg text-accent-ink">
          {/* Retry icon */}
          <ArrowCounterClockwiseIcon size={22} aria-hidden="true" />
          {/* Button text */}
          Try it again
        </button>
        {/* Finish: quieter */}
        <p className="mt-3 text-center text-sm text-ink-muted underline underline-offset-4">Done for today</p>
      </div>
    </Phone>
  );
}

// Screen 4: retry result
function RetryResultScreen() {
  // Before and after, short note, done
  return (
    // Phone frame with caption
    <Phone name="Retry result" note="The payoff: did the fix work? Before and after, in minutes.">
      {/* Top bar */}
      <TopBar title="Second try" />
      {/* Main content */}
      <div className="flex flex-1 flex-col px-5 py-6">
        {/* Before and after */}
        <Label>Fillers per minute</Label>
        {/* The two numbers side by side */}
        <div className="mt-3 flex items-end gap-4">
          {/* Before */}
          <div>
            {/* Value */}
            <p className="font-display text-3xl text-ink-muted">4.2</p>
            {/* Label */}
            <p className="text-sm text-ink-muted">first try</p>
          </div>
          {/* Arrow between */}
          <p className="pb-6 text-2xl text-ink-muted">→</p>
          {/* After */}
          <div>
            {/* Value */}
            <p className="font-display text-5xl">1.8</p>
            {/* Label */}
            <p className="text-sm text-ink-muted">this try</p>
          </div>
        </div>
        {/* Plain verdict */}
        <p className="mt-6 font-display text-2xl">The pause worked.</p>
        {/* Short coach note */}
        <p className="mt-2 text-ink-muted">You started with “The best part…” with no um before it. Keep that breath.</p>
        {/* Streak update */}
        <p className="mt-8 border-t pt-4 text-sm text-ink-muted">5 days in a row. See you tomorrow.</p>
        {/* Push the button down */}
        <div className="flex-1" />
        {/* Finish */}
        <button type="button" className="rounded-full border py-4 text-lg">
          {/* Button text */}
          Done
        </button>
      </div>
    </Phone>
  );
}

// Sample filler rates over time for the history trend, first value is the baseline
const TREND = [6.0, 5.2, 4.8, 4.9, 3.6, 3.1, 2.4];

// Screen 5: history
function HistoryScreen() {
  // Width and height of the small chart
  const width = 300;
  // Chart height
  const height = 90;
  // Highest value, for scaling
  const top = Math.max(...TREND);
  // Turn each value into an x,y point
  const points = TREND.map((value, index) => `${(index / (TREND.length - 1)) * width},${height - (value / top) * (height - 10)}`).join(" ");
  // Height of the baseline guide line
  const baselineY = height - ((TREND[0] ?? 0) / top) * (height - 10);
  // Trend, then past sessions
  return (
    // Phone frame with caption
    <Phone name="History" note="One trend line against your first recording, then past sessions.">
      {/* Top bar */}
      <TopBar title="History" />
      {/* Main content */}
      <div className="flex flex-1 flex-col px-5 py-5">
        {/* Trend label */}
        <Label>Fillers per minute · this focus</Label>
        {/* Headline change */}
        <p className="mt-2 font-display text-2xl">Down 60% since your first recording</p>
        {/* The trend line, drawn in the ink color */}
        <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full text-ink" role="img" aria-label="Fillers per minute falling from 6.0 to 2.4">
          {/* Dashed guide at the baseline value */}
          <line x1="0" x2={width} y1={baselineY} y2={baselineY} stroke="currentColor" strokeOpacity="0.3" strokeDasharray="4 4" />
          {/* The trend line */}
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        {/* Past sessions */}
        <ul className="mt-6 divide-y border-y">
          {/* A session with a retry */}
          <li className="flex justify-between py-3">
            {/* Day and prompt */}
            <span>Today · A small thing…</span>
            {/* First and retry numbers */}
            <span className="text-ink-muted">4.2 → 1.8</span>
          </li>
          {/* A session without a retry */}
          <li className="flex justify-between py-3">
            {/* Day and prompt */}
            <span>Mon · A place you love</span>
            {/* Number */}
            <span className="text-ink-muted">3.1</span>
          </li>
          {/* The baseline, labeled */}
          <li className="flex justify-between py-3">
            {/* Day and label */}
            <span>Oct 2 · First recording</span>
            {/* Number */}
            <span className="text-ink-muted">6.0</span>
          </li>
        </ul>
        {/* Link to the first recording's audio */}
        <p className="mt-4 text-sm text-ink-muted underline underline-offset-4">Listen to your first recording</p>
      </div>
    </Phone>
  );
}

// The wireframes page: all five screens in the gray theme
export default function WireframesPage() {
  // Heading, explanation, and the screens
  return (
    // Gray theme for a layout-only review
    <main data-theme="gray" className="min-h-dvh px-4 py-10">
      {/* Narrow intro column */}
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <h1 className="font-display text-3xl">Wireframes</h1>
        {/* How to review */}
        <p className="mt-2 max-w-prose text-ink-muted">
          The core loop, in gray so the review is about layout and wording, not color. Sample content only. Approve or redirect at checkpoint C11.
        </p>
        {/* The screens in loop order, wrapping on narrow screens */}
        <div className="mt-10 flex flex-wrap justify-center gap-10">
          <HomeScreen />
          <RecordingScreen />
          <FeedbackScreen />
          <RetryResultScreen />
          <HistoryScreen />
        </div>
      </div>
    </main>
  );
}
