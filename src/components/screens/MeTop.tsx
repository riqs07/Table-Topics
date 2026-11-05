"use client";
// The top of Me (second design pass, Desktop Screens "Me" and storyboards 28 and 30): "You, so far" with the blob, since when and the last seven days; "Then and now" (Rapid Fire's pause words on day 1 against this week, with both takes to hear) once there is a real day 1 and a real this week; four counts on coloured squares (takes, minutes spoken, stories told, best run: counts only, never scores); your latest takes with their tiles; and, beside them on a computer, the Settings rows and the weekly check-in. A new user with no takes sees a first-take prompt, never zeros

// Load React's state, ref, effect and node tools
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
// Load Next.js's link component
import Link from "next/link";
// Load the icons
import { CaretRightIcon, CheckIcon, ClockIcon, FireIcon, GearIcon, MicrophoneIcon, PlayIcon, SparkleIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
// Load the blob and the mode tiles
import { Buddy } from "@/components/scenes/Buddy";
import { ModeTile } from "@/components/scenes/ModeTile";
import { SCENE_TILES, type ModeTileLook } from "@/components/scenes/modeTileFor";
import type { SceneName } from "@/components/scenes/Scene";
// Load the shared looks
import { CARD, LAB, SECTION_HEADING } from "@/components/script/textStyles";
import { PRESS, PrimaryLink, SECONDARY, TEXT_LINK } from "@/components/script/Buttons";
// Load the take's name, as History names it
import { promptText } from "@/components/screens/HistoryScreen";
// Load the audio loader
import { useAudioUrl } from "@/components/screens/useAudioUrl";
// Load the rules
import { practiceSessions } from "@/core/sessionHome";
import { practiceRun } from "@/core/streak";
import { weekStrip } from "@/core/weekStrip";
import { dayLabel, formatRate } from "@/core/copy";
import { formatClock } from "@/core/recordingRules";
import { pauseWordsShown } from "@/core/pauseWords";
import { addDays, dayKey, startOfDay } from "@/core/dates";
import { focusAreas, readPracticeFocus } from "@/core/practiceFocus";
// Load the saved passphrase, for the coach row
import { readPassphrase } from "@/data/passphrase";
// Load the record and repository types
import type { SessionMode, SessionRecord, SettingsRecord } from "@/data/records";
import type { Repository } from "@/data/repository";

// Each kind of take's scene, for its tile
const MODE_SCENES: Partial<Record<SessionMode, SceneName>> = { talk: "rapid-fire", response: "prepared-speech", read: "read-aloud", free: "free-talk", rehearse: "your-talk", smalltalk: "conversation", conversation: "conversation", moment: "moment", story: "story", voice: "warm-up", outline: "short-speech", pause: "read-aloud" };

// A take's tile (History's rows use it too)
export function takeLook(session: SessionRecord): ModeTileLook {
  // Its kind's scene
  const scene = MODE_SCENES[session.mode];
  // That scene's tile, or a microphone
  return scene ? SCENE_TILES[scene] : { ground: "sky", prop: "mic", face: "ready" };
}

// The longest run of practice days so far, as the forgiving run counts it (decision 78)
export function bestRun(sessions: ReadonlyArray<SessionRecord>): number {
  // The times
  const times = sessions.map((session) => new Date(session.createdAt));
  // Each practice day, as the run would stand at its end
  const days = [...new Set(times.map(dayKey))].map((key) => new Date(`${key}T23:59:00`));
  // The longest
  return days.reduce((best, day) => Math.max(best, practiceRun(times.filter((time) => time <= day), day).runDays), 0);
}

// Rapid Fire's pause words on the first day against the last seven days, with a take from each to hear, or null without both
export function thenAndNow(sessions: ReadonlyArray<SessionRecord>, now: Date): { first: number; recent: number; firstTake: SessionRecord; latestTake: SessionRecord } | null {
  // Rapid Fire takes with a pause-word count, oldest first
  const takes = sessions.filter((session) => session.mode === "talk" && Number.isFinite(session.fillersPerMinute) && session.durationSec > 0).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // The first one
  const firstTake = takes[0];
  // None yet
  if (!firstTake) return null;
  // The first day's takes
  const day1 = takes.filter((take) => dayKey(new Date(take.createdAt)) === dayKey(new Date(firstTake.createdAt)));
  // The start of this week's window
  const since = addDays(startOfDay(now), -6);
  // This week's takes, when day 1 is before it
  const recent = new Date(firstTake.createdAt) < since ? takes.filter((take) => new Date(take.createdAt) >= since) : [];
  // The latest
  const latestTake = recent.at(-1);
  // Both needed
  if (!latestTake) return null;
  // The mean of some takes
  const mean = (list: ReadonlyArray<SessionRecord>) => list.reduce((sum, take) => sum + take.fillersPerMinute, 0) / list.length;
  // The two, and a take from each
  return { first: mean(day1), recent: mean(recent), firstTake, latestTake };
}

// Then and now: day 1 against this week, and the two takes to hear
function ThenAndNow({ repo, data }: { repo: Repository; data: NonNullable<ReturnType<typeof thenAndNow>> }) {
  // The two recordings, when kept
  const [before, after] = [useAudioUrl(repo, data.firstTake.audioKey), useAudioUrl(repo, data.latestTake.audioKey)];
  // The one player
  const player = useRef<HTMLAudioElement | null>(null);
  // Which is playing
  const [playing, setPlaying] = useState<"before" | "after" | "both" | null>(null);
  // Stop when leaving
  useEffect(() => () => player.current?.pause(), []);
  // Play one recording, then maybe another
  function play(which: "before" | "after" | "both") {
    // The player, made once
    const element = (player.current ??= new Audio());
    // The first address
    const url = which === "after" ? after.url : before.url;
    // Nothing to play
    if (!url) return;
    // Stop whatever was playing
    element.pause();
    // This one
    element.src = url;
    // At its end: the second of both, or done
    element.onended = () => {
      // Both: the latest next
      if (which === "both" && after.url) {
        // Its address
        element.src = after.url;
        // Only once
        element.onended = () => setPlaying(null);
        // Play it
        void element.play().catch(() => setPlaying(null));
      } else setPlaying(null);
    };
    // Marked
    setPlaying(which);
    // Played (the browser may refuse)
    void element.play().catch(() => setPlaying(null));
  }
  // A play button
  const button = (which: "before" | "after" | "both", words: string, url: string | null) => <button type="button" disabled={!url} aria-pressed={playing === which} onClick={() => play(which)} className={`${SECONDARY} flex-1`}><PlayIcon aria-hidden="true" weight="fill" className="size-4" />{words}</button>;
  // The card
  return (
    <section aria-labelledby="then-and-now" data-then-and-now className={`flex flex-col gap-4 p-4 md:gap-4.5 md:px-6.5 md:py-6 ${CARD}`}>
      {/* What it compares */}
      <h2 id="then-and-now" className={LAB}>Then and now · Rapid Fire</h2>
      {/* Day 1, an arrow, this week */}
      <div className="grid grid-cols-2 items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-4">
        {/* Day 1 */}
        <p className="flex flex-col gap-0.5 rounded-[18px] bg-paper px-4 py-3.5 md:px-5 md:py-4.5"><span className="text-footnote font-extrabold text-ink-muted">Day 1</span><b className="font-display text-4xl leading-none font-semibold md:text-6xl">{formatRate(data.first)}</b><span className="text-footnote font-bold text-ink-muted">pause words a minute</span></p>
        {/* The arrow */}
        <span aria-hidden="true" className="hidden text-3xl text-ink-muted md:block">→</span>
        {/* This week */}
        <p className="flex flex-col gap-0.5 rounded-[18px] bg-accent-tint px-4 py-3.5 text-accent-tint-ink md:px-5 md:py-4.5"><span className="text-footnote font-extrabold">This week</span><b className="font-display text-4xl leading-none font-semibold md:text-6xl">{formatRate(data.recent)}</b><span className="text-footnote font-bold">pause words a minute</span></p>
      </div>
      {/* The takes to hear: both on a phone, one each on a computer */}
      <div className="flex md:hidden">{button("both", "Hear both", before.url)}</div>
      {/* (one each) */}
      <div className="hidden gap-3 md:flex">
        {button("before", "Hear day 1", before.url)}
        {button("after", "Hear now", after.url)}
      </div>
    </section>
  );
}

// One Settings row: the name, the current value and a chevron
function SettingRow({ href, name, value }: { href: string; name: string; value: string }) {
  // The row
  return (
    <li>
      <Link href={href} className={`flex min-h-14 items-center gap-3 px-5 py-3 hover:text-accent ${PRESS}`}>
        {/* The name */}
        <span className="min-w-0 flex-1 font-bold">{name}</span>
        {/* The value */}
        <span className="max-w-[55%] text-right text-footnote font-bold text-ink-muted">{value}</span>
        {/* The chevron */}
        <CaretRightIcon aria-hidden="true" className="size-4 flex-none text-ink-muted" />
      </Link>
    </li>
  );
}

// Nothing to subscribe to: the values are read once per draw
const NO_CHANGES = () => () => undefined;

// The page's colour mode, in words
function readLook(): string {
  // The mode on the page
  const mode = document.documentElement.dataset.mode;
  // In words
  return mode === "dark" ? "Dark" : mode === "light" ? "Light" : "Auto";
}

// The Settings rows and the weekly check-in
function SettingsColumn({ settings }: { settings: SettingsRecord | null }) {
  // The look chosen, read from the page in the browser (nothing on the server)
  const look = useSyncExternalStore(NO_CHANGES, readLook, () => "");
  // The coach set up or not, the same way
  const coach = useSyncExternalStore(NO_CHANGES, () => (readPassphrase() ? "Set up" : "Not set up"), () => "");
  // What you are working on
  const focus = focusAreas(readPracticeFocus(settings?.practiceFocus) ?? []).map((area) => area.name).join(", ");
  // The reminder, as a time of day
  const reminder = settings?.reminderTime ? new Date(`2000-01-01T${settings.reminderTime}:00`).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }) : "None";
  // The column
  return (
    <aside aria-labelledby="settings" className="flex flex-col gap-3.5">
      {/* Heading */}
      <h2 id="settings" className={SECTION_HEADING}>Settings</h2>
      {/* The rows */}
      <ul className={`divide-y-2 divide-rule overflow-hidden ${CARD}`}>
        <SettingRow href="/settings#focus" name="What you’re working on" value={settings ? focus || "Not chosen" : ""} />
        <SettingRow href="/settings#practice-time" name="Reminder" value={settings ? reminder : ""} />
        <SettingRow href="/settings#group-appearance" name="Look" value={look} />
        <SettingRow href="/settings#your-data" name="Your data" value="On this device" />
        <SettingRow href="/settings#group-services" name="Coach" value={coach} />
      </ul>
      {/* Every setting */}
      <Link href="/settings" className={`${TEXT_LINK} self-start text-footnote`}>All settings</Link>
      {/* The weekly check-in */}
      <div className="flex flex-col gap-1.5 rounded-[22px] border-2 border-rule bg-paper px-5 py-4.5">
        {/* What it is */}
        <span className={LAB}>Weekly check-in</span>
        {/* Why */}
        <b className="text-lg leading-snug font-extrabold">The same four parts every week, so you can hear the change.</b>
        {/* Start it */}
        <Link href="/check-in" className={`${TEXT_LINK} self-start`}>This week’s · about 6 min<CaretRightIcon aria-hidden="true" weight="bold" className="ml-1 size-4" /></Link>
      </div>
    </aside>
  );
}

// One count on its coloured square
function Count({ value, label, colour, icon: CountIcon }: { value: string; label: string; colour: string; icon: Icon }) {
  // The tile
  return (
    <li className={`flex items-center gap-3 p-3.5 md:gap-2.5 md:p-3 xl:gap-3 xl:p-4 ${CARD}`}>
      {/* Its icon on its colour */}
      <span aria-hidden="true" className={`flex size-11 flex-none items-center justify-center rounded-[13px] ${colour}`}><CountIcon weight="fill" className="size-5.5" /></span>
      {/* The number and what it counts */}
      <span className="flex min-w-0 flex-col"><b className="font-display text-2xl leading-none font-semibold whitespace-nowrap">{value}</b><span className="text-footnote font-bold text-ink-muted">{label}</span></span>
    </li>
  );
}

// The top of Me, and the page's own content under its left column
export function MeTop({ repo, sessions, settings, now, children }: { repo: Repository; sessions: ReadonlyArray<SessionRecord> | null; settings: SettingsRecord | null; now: Date | null; children?: ReactNode }) {
  // The takes that count (private moment notes left out), newest first
  const takes = sessions ? practiceSessions(sessions).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : null;
  // The first take's day, when there is one
  const first = takes?.at(-1);
  // The last seven days
  const strip = takes && now ? weekStrip(takes.map((take) => new Date(take.createdAt)), now) : null;
  // How many had practice
  const lastSeven = strip ? strip.filter((day) => day.practised).length : 0;
  // Minutes spoken
  const minutes = takes ? Math.round(takes.reduce((sum, take) => sum + take.durationSec, 0) / 60) : 0;
  // Stories told
  const stories = takes ? takes.filter((take) => take.mode === "story").length : 0;
  // The best run
  const run = takes ? bestRun(takes) : 0;
  // Then and now, when there is a real day 1 and a real this week (and pause words are counted)
  const compare = takes && now && (!settings || pauseWordsShown(settings)) ? thenAndNow(takes, now) : null;
  // Whether pause words are counted
  const pauseWords = !settings || pauseWordsShown(settings);
  // The block
  return (
    <div data-wide className="mt-4 grid gap-6 md:-mt-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-8">
      {/* The left column's top */}
      <div className="flex min-w-0 flex-col gap-5 md:gap-6.5">
        {/* You, so far */}
        <div className="flex items-center gap-4 md:gap-4.5">
          {/* The blob, pleased */}
          <Buddy face="happy" className="size-18 flex-none md:size-22" />
          {/* The words */}
          <div className="min-w-0 flex-1">
            {/* The page's name */}
            <h1 className="font-display text-statement leading-none font-semibold">You, so far</h1>
            {/* Since when, and the last seven days */}
            <p className="mt-1 font-bold text-ink-muted">{first ? `Practising since ${new Date(first.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}` : "Your first take will show up here."}{first && <span className="hidden md:inline"> · {lastSeven} of the last 7 days</span>}</p>
          </div>
          {/* Settings, on a phone, as the gear */}
          <Link href="/settings" aria-label="Settings" className={`inline-flex size-11 flex-none items-center justify-center rounded-[14px] text-ink-muted hover:bg-paper hover:text-ink lg:hidden ${PRESS}`}><GearIcon aria-hidden="true" weight="bold" className="size-6" /></Link>
        </div>
        {/* The last seven days, on a phone (the rail shows them on a computer) */}
        {strip && first && (
          <ul aria-label="The last seven days" className={`grid grid-cols-7 gap-1.5 p-3 md:hidden ${CARD}`}>
            {/* Each day */}
            {strip.map((day) => (
              <li key={day.key} aria-label={`${day.name}: ${day.practised ? "practised" : day.isToday ? "still open" : "no practice"}`} className="flex flex-col items-center gap-1">
                {/* Its square */}
                <span aria-hidden="true" className={`flex size-8 items-center justify-center rounded-[9px] ${day.practised ? "bg-accent text-accent-ink" : day.isToday ? "border-2 border-dashed border-accent" : "bg-rule"}`}>{day.practised && <CheckIcon weight="bold" className="size-4" />}</span>
                {/* Its letter */}
                <span aria-hidden="true" className="text-xs font-extrabold text-ink-muted">{day.name.charAt(0)}</span>
              </li>
            ))}
          </ul>
        )}
        {/* A new user: the first take, never zeros */}
        {takes && takes.length === 0 && (
          <section aria-label="Your first take" className={`flex flex-wrap items-center gap-4 p-5 md:p-6 ${CARD}`}>
            {/* What will come */}
            <p className="min-w-0 flex-[1_1_16rem] text-lede font-bold">Record one take and this page starts: your takes, your minutes and, after a week, how you sounded then and now.</p>
            {/* The one thing to do */}
            <PrimaryLink href="/session?mode=free&prompt=free">Record your first take</PrimaryLink>
          </section>
        )}
        {/* Then and now */}
        {compare && <ThenAndNow repo={repo} data={compare} />}
        {/* The counts */}
        {takes && takes.length > 0 && (
          <ul aria-label="Your numbers" className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <Count value={String(takes.length)} label={takes.length === 1 ? "take" : "takes"} colour="bg-art-sky text-art-cream" icon={MicrophoneIcon} />
            <Count value={`${minutes} min`} label="spoken" colour="bg-art-leaf text-on-warm" icon={ClockIcon} />
            <Count value={String(stories)} label={stories === 1 ? "story told" : "stories told"} colour="bg-art-coral text-on-warm" icon={FireIcon} />
            <Count value={`${run} ${run === 1 ? "day" : "days"}`} label="best run" colour="bg-art-sun text-on-warm" icon={SparkleIcon} />
          </ul>
        )}
        {/* Your latest takes */}
        {takes && takes.length > 0 && now && (
          <section aria-labelledby="your-takes" className="flex flex-col gap-3">
            {/* Heading, and every take */}
            <div className="flex items-baseline justify-between gap-4">
              {/* Heading */}
              <h2 id="your-takes" className={SECTION_HEADING}>Your takes</h2>
              {/* Every take */}
              <Link href="/history" className={`${TEXT_LINK} text-footnote`}>See all<span className="sr-only"> your takes</span></Link>
            </div>
            {/* The latest three */}
            <ul className={`divide-y-2 divide-rule overflow-hidden ${CARD}`}>
              {takes.slice(0, 3).map((take) => {
                // Its tile
                const look = takeLook(take);
                // Pause words in it
                const count = Math.round((take.fillersPerMinute * take.durationSec) / 60);
                // The row
                return (
                  <li key={take.id}>
                    <Link href={`/sessions?id=${encodeURIComponent(take.id)}`} className={`flex min-h-16 items-center gap-3.5 px-4 py-2.5 hover:text-accent ${PRESS}`}>
                      {/* The tile */}
                      <ModeTile ground={look.ground} prop={look.prop} face={look.face} still className="size-12" />
                      {/* Its name, day and numbers */}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-extrabold">{promptText(take, new Map())}</span>
                        <span className="text-footnote font-bold text-ink-muted">{dayLabel(new Date(take.createdAt), now)} · {formatClock(take.durationSec)}{pauseWords && Number.isFinite(take.fillersPerMinute) ? ` · ${count} pause ${count === 1 ? "word" : "words"}` : ""}{take.starred ? <> · <StarIcon aria-hidden="true" weight="fill" className="inline size-3.5 align-[-2px] text-art-sun" /> kept</> : ""}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
      {/* Settings and the check-in (beside, on a computer) */}
      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <SettingsColumn settings={settings} />
      </div>
      {/* The rest of the page, under the left column */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
