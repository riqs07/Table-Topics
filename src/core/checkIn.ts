// The weekly check-in (decision 100): about six minutes, the same four parts in the same order every week, so the first and the latest can be heard and compared side by side. This file holds the rules: grouping takes into check-ins, when one is due, what each part records, the reminder to look back, and which check-in recordings are kept when the user keeps fewer

// Load the calendar-day helpers
import { addDays, dayKey, daysBetween, startOfDay } from "@/core/dates";
// Load the record types
import { CHECK_IN_PARTS, type CheckInPart, type CheckInSettings, type SessionMode, type SessionRecord } from "@/data/records";
// Load the check-in's content: the passage, the pitch's id and the two pools taken in turn
import { CHECK_IN_PASSAGE, CHECK_IN_PITCH_ID, checkInQuestion, checkInStory } from "@/content/checkIn";

// The check-in's parts as stored, for code that only loads this file
export { CHECK_IN_PARTS, type CheckInPart };

// The days after the missed check-in day on which it is still offered
export const GRACE_DAYS = 2;
// The fewest days between two check-ins, so changing the day never asks for two in one week
export const MIN_GAP_DAYS = 5;
// The days after the first day of use on which the first check-in is offered on Today (day two to day four; day one keeps its short free talk, decision 78)
export const BASELINE_FROM_DAY = 1;
// (the last of them)
export const BASELINE_TO_DAY = 3;
// About how long a check-in takes, in minutes
export const CHECK_IN_MINUTES = 6;
// The reminders to look back, as days after the first check-in: a week, two weeks, a month, then every month
export const RESURFACE_DAYS: ReadonlyArray<number> = [7, 14, 30];
// After the last fixed reminder, one every this many days
export const RESURFACE_EVERY = 30;
// How long a reminder stays offered once it is due, in days, so it never lingers
export const RESURFACE_WINDOW = 14;
// With fewer recordings kept: the latest check-ins kept whole
export const KEEP_LATEST = 12;
// Skipped parts kept in the settings, by check-in
const SKIPS_KEPT = 60;

// What one part records: its kind of session, its name, its length in words and minutes
export interface CheckInPartInfo {
  // The part
  part: CheckInPart;
  // The kind of session it is saved as, so it feeds History, the profile and its family like any take
  mode: SessionMode;
  // Its name
  name: string;
  // What it asks for, in a few words
  what: string;
  // About how long it takes, in minutes
  minutes: number;
}

// The four parts, in order
export const CHECK_IN_PART_INFO: Readonly<Record<CheckInPart, CheckInPartInfo>> = {
  // The same passage every week: the cleanest comparison of the voice
  read: { part: "read", mode: "read", name: "Read aloud", what: "the same short passage", minutes: 1 },
  // The same pitch every week, with a two-minute light
  pitch: { part: "pitch", mode: "outline", name: "Elevator pitch", what: "two minutes about you", minutes: 2 },
  // A short story from a matched pool
  story: { part: "story", mode: "story", name: "A story", what: "a minute or so", minutes: 2 },
  // A Rapid Fire question from a matched pool
  surprise: { part: "surprise", mode: "talk", name: "Surprise question", what: "one to two minutes", minutes: 2 },
};

// The id of the check-in done on a day
export function checkInId(day: Date): string {
  // "ci-" and the day
  return `ci-${dayKey(day)}`;
}

// The day (YYYY-MM-DD) in a check-in id, or null for anything else
export function checkInDayOf(id: string): string | null {
  // "ci-" and a day
  const match = /^ci-(\d{4}-\d{2}-\d{2})$/.exec(id);
  // The day, or nothing
  return match ? match[1]! : null;
}

// A day key as a local date at midnight
export function dateOfKey(key: string): Date {
  // Year, month and day
  const [year, month, day] = key.split("-").map(Number);
  // Midnight that day
  return new Date(year!, (month ?? 1) - 1, day ?? 1);
}

// One check-in, worked out from its takes and the parts skipped
export interface CheckIn {
  // Its id
  id: string;
  // The day it was done (YYYY-MM-DD)
  day: string;
  // Its number among check-ins with at least one take (1 is the first); 0 for one where every part was skipped
  week: number;
  // The take for each part done (the latest, if a part was done twice)
  takes: Partial<Record<CheckInPart, SessionRecord>>;
  // The parts skipped
  skipped: CheckInPart[];
}

// Whether every part of a check-in has a take or was skipped
export function isFinished(checkIn: CheckIn | null | undefined): boolean {
  // Each part accounted for
  return !!checkIn && CHECK_IN_PARTS.every((part) => !!checkIn.takes[part] || checkIn.skipped.includes(part));
}

// The next part still to do, or null when each part is done or skipped
export function nextPart(checkIn: CheckIn | null | undefined): CheckInPart | null {
  // The first part neither done nor skipped
  return CHECK_IN_PARTS.find((part) => !checkIn?.takes[part] && !checkIn?.skipped.includes(part)) ?? null;
}

// Every check-in, oldest first, from the takes that carry one and the parts skipped (kept in the settings)
export function groupCheckIns(sessions: ReadonlyArray<SessionRecord>, settings: CheckInSettings | undefined): CheckIn[] {
  // By id
  const byId = new Map<string, CheckIn>();
  // The check-in for an id, made when first seen (an id that names no day is ignored)
  const entry = (id: string): CheckIn | null => {
    // Its day
    const day = checkInDayOf(id);
    // Not a check-in id
    if (!day) return null;
    // Made once
    if (!byId.has(id)) byId.set(id, { id, day, week: 0, takes: {}, skipped: [] });
    // Handed back
    return byId.get(id)!;
  };
  // Each take in a check-in, oldest first, so a later take of the same part wins
  for (const session of [...sessions].filter((item) => item.checkIn).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    // Its check-in
    const checkIn = entry(session.checkIn!.id);
    // Added under its part
    if (checkIn) checkIn.takes[session.checkIn!.part] = session;
  }
  // Each skip
  for (const skip of settings?.skipped ?? []) {
    // Its check-in
    const checkIn = entry(skip.id);
    // The parts skipped, once each, in order, never one that has a take
    if (checkIn) checkIn.skipped = CHECK_IN_PARTS.filter((part) => (skip.parts.includes(part) || checkIn.skipped.includes(part)) && !checkIn.takes[part]);
  }
  // Oldest first
  const all = [...byId.values()].sort((a, b) => a.day.localeCompare(b.day));
  // Numbered among those with a take
  let week = 0;
  // Each in order
  for (const checkIn of all) checkIn.week = Object.keys(checkIn.takes).length > 0 ? (week += 1) : 0;
  // The list
  return all;
}

// The check-in number the next take of a check-in gets: its own number when it has takes, otherwise one after those before it
export function weekFor(checkIns: ReadonlyArray<CheckIn>, id: string): number {
  // The check-in itself, if it has takes
  const own = checkIns.find((checkIn) => checkIn.id === id && checkIn.week > 0);
  // Its number
  if (own) return own.week;
  // The day of this one
  const day = checkInDayOf(id) ?? "";
  // One more than those with takes before it
  return checkIns.filter((checkIn) => checkIn.week > 0 && checkIn.day < day).length + 1;
}

// The check-ins with at least one take, oldest first (a check-in where every part was skipped has nothing to compare)
export function recordedCheckIns(checkIns: ReadonlyArray<CheckIn>): CheckIn[] {
  // Those with takes
  return checkIns.filter((checkIn) => checkIn.week > 0);
}

// The day of the week check-ins fall on: the one chosen, else the day of the first check-in, else the day of first use
export function checkInWeekday(settings: CheckInSettings | undefined, checkIns: ReadonlyArray<CheckIn>, firstUse: Date | null): number | null {
  // The chosen day, when it is a real one
  if (typeof settings?.day === "number" && Number.isInteger(settings.day) && settings.day >= 0 && settings.day <= 6) return settings.day;
  // The first check-in's day
  const first = checkIns[0];
  // Its weekday
  if (first) return dateOfKey(first.day).getDay();
  // The day of first use, or none yet
  return firstUse ? firstUse.getDay() : null;
}

// What the schedule says about today
export interface CheckInSchedule {
  // Whether today is a check-in day (the day itself or one of the two after it); worked out from the days before today, so it stays the same all day
  due: boolean;
  // Whether this is the first check-in, the starting point
  baseline: boolean;
  // Whether the check-in day itself was missed and this is a day after it
  late: boolean;
  // The next check-in day after today (YYYY-MM-DD), or null before the first day of use
  next: string | null;
}

// The first day on or after a day that falls on a weekday
function onOrAfter(day: Date, weekday: number): Date {
  // Days to go forward
  return addDays(day, (weekday - day.getDay() + 7) % 7);
}

// When the check-in is due: the first one on day two to four of use (day one keeps its short first step), then the chosen weekday each week with two days of grace, at least five days after the last one. Only check-ins from before today are counted, so the answer stays the same all day
export function checkInSchedule(input: { today: Date; firstUse: Date | null; checkIns: ReadonlyArray<CheckIn>; settings: CheckInSettings | undefined }): CheckInSchedule {
  // Today at midnight
  const today = startOfDay(input.today);
  // Check-ins from before today
  const earlier = input.checkIns.filter((checkIn) => checkIn.day < dayKey(today));
  // The latest of them
  const last = earlier.at(-1);
  // The weekday it falls on (from earlier check-ins only, so one started today never moves it)
  const weekday = checkInWeekday(input.settings, earlier, input.firstUse);
  // Never used: nothing yet
  if (!input.firstUse || weekday === null) return { due: false, baseline: true, late: false, next: null };
  // The first day of use
  const first = startOfDay(input.firstUse);
  // No check-in yet: the first one on day two to four of use
  if (!last) {
    // Days since the first day of use
    const since = daysBetween(first, today);
    // Inside the first window
    if (since >= BASELINE_FROM_DAY && since <= BASELINE_TO_DAY) return { due: true, baseline: true, late: since > BASELINE_FROM_DAY, next: null };
    // Before it (day one): tomorrow
    if (since < BASELINE_FROM_DAY) return { due: false, baseline: true, late: false, next: dayKey(addDays(first, BASELINE_FROM_DAY)) };
    // Missed: then the weekly day, after the window
    return weeklySlot(today, addDays(first, BASELINE_TO_DAY + 1), weekday, true);
  }
  // After a check-in: the weekly day, at least five days on
  return weeklySlot(today, addDays(dateOfKey(last.day), MIN_GAP_DAYS), weekday, false);
}

// The weekly check-in day at or after a first allowed day: due on it and the two days after, otherwise the next one
function weeklySlot(today: Date, earliest: Date, weekday: number, baseline: boolean): CheckInSchedule {
  // The first check-in day allowed
  let slot = onOrAfter(earliest, weekday);
  // Move on a week at a time while a whole window has passed
  while (daysBetween(slot, today) > GRACE_DAYS) slot = addDays(slot, 7);
  // Days since that check-in day
  const since = daysBetween(slot, today);
  // Today is the day or one of the two after it
  if (since >= 0) return { due: true, baseline, late: since > 0, next: null };
  // Otherwise it is still to come
  return { due: false, baseline, late: false, next: dayKey(slot) };
}

// The next check-in day after one done today (for the finish screen and the check-in page)
export function nextAfter(day: Date, weekday: number): string {
  // At least five days on, on the weekday
  return dayKey(onOrAfter(addDays(startOfDay(day), MIN_GAP_DAYS), weekday));
}

// The first day the app was used: the earliest take
export function firstUseOf(sessions: ReadonlyArray<SessionRecord>): Date | null {
  // The earliest start (ISO text sorts in time order)
  const earliest = sessions.reduce<string | null>((first, session) => (first === null || session.createdAt < first ? session.createdAt : first), null);
  // As a date, or none
  return earliest ? new Date(earliest) : null;
}

// A check-in's parts with how each stands: done, skipped, or still to do
export function partStatuses(checkIn: CheckIn | null | undefined): Array<{ part: CheckInPart; status: "done" | "skipped" | "open" }> {
  // Each part in order
  return CHECK_IN_PARTS.map((part) => ({ part, status: checkIn?.takes[part] ? "done" : checkIn?.skipped.includes(part) ? "skipped" : "open" }));
}

// The skipped parts in the settings with one more part added for a check-in, keeping the latest 60 check-ins
export function withSkip(settings: CheckInSettings | undefined, id: string, part: CheckInPart): CheckInSettings {
  // The skips so far
  const skips = settings?.skipped ?? [];
  // This check-in's
  const own = skips.find((skip) => skip.id === id);
  // Its parts with this one, once, in order
  const parts = CHECK_IN_PARTS.filter((item) => item === part || !!own?.parts.includes(item));
  // The others, then this one, the latest kept
  return { ...settings, skipped: [...skips.filter((skip) => skip.id !== id), { id, parts }].sort((a, b) => a.id.localeCompare(b.id)).slice(-SKIPS_KEPT) };
}

// The reminder to look back that is due today, if any: the latest of 7, 14 and 30 days after the first check-in, then every 30, once there is a later check-in to compare with, not put aside, and for two weeks at most
export function resurfaceDue(input: { today: Date; checkIns: ReadonlyArray<CheckIn>; settings: CheckInSettings | undefined }): { days: number; first: CheckIn; latest: CheckIn } | null {
  // The check-ins with takes
  const recorded = recordedCheckIns(input.checkIns);
  // The first and the latest
  const [first, latest] = [recorded[0], recorded.at(-1)];
  // Nothing to compare yet
  if (!first || !latest || first.id === latest.id) return null;
  // Days since the first
  const since = daysBetween(dateOfKey(first.day), input.today);
  // The latest reminder reached
  const days = reminderReached(since);
  // None yet, or put aside already
  if (days === null || (input.settings?.seen ?? []).includes(days)) return null;
  // Past its time (so it never comes back weeks later)
  if (since - days >= RESURFACE_WINDOW) return null;
  // The reminder
  return { days, first, latest };
}

// The latest reminder reached after a number of days: 7, 14, 30, then 60, 90 and every 30 days
function reminderReached(since: number): number | null {
  // Before the first
  if (since < RESURFACE_DAYS[0]!) return null;
  // Among the fixed ones
  const last = RESURFACE_DAYS.at(-1)!;
  // The latest fixed one reached
  if (since < last + RESURFACE_EVERY) return [...RESURFACE_DAYS].reverse().find((days) => since >= days)!;
  // Monthly after that
  return last + Math.floor((since - last) / RESURFACE_EVERY) * RESURFACE_EVERY;
}

// The reminder put aside (or opened), so it does not come back
export function withSeen(settings: CheckInSettings | undefined, days: number): CheckInSettings {
  // The ones seen so far, with this one, in order
  return { ...settings, seen: [...new Set([...(settings?.seen ?? []), days])].sort((a, b) => a - b) };
}

// A time in plain words, such as "a week", "two weeks", "a month", "3 months"
export function sinceWords(days: number): string {
  // The fixed ones
  if (days === 7) return "a week";
  // (two weeks)
  if (days === 14) return "two weeks";
  // (a month)
  if (days === 30) return "a month";
  // Months after that
  return `${Math.round(days / 30)} months`;
}

// With fewer check-in recordings kept: the takes no longer kept whole as markers, so the usual recording days apply to them. Kept whole: the first check-in, the latest twelve, and the first check-in of each calendar month
export function checkInTakesReleased(sessions: ReadonlyArray<SessionRecord>, settings: CheckInSettings | undefined): Set<string> {
  // Every check-in kept unless chosen otherwise
  if (settings?.keep !== "thinned") return new Set();
  // The check-ins with takes, oldest first
  const recorded = recordedCheckIns(groupCheckIns(sessions, undefined));
  // Their ids to keep
  const keep = new Set<string>();
  // The first
  if (recorded[0]) keep.add(recorded[0].id);
  // The latest twelve
  for (const checkIn of recorded.slice(-KEEP_LATEST)) keep.add(checkIn.id);
  // The first of each month
  const months = new Set<string>();
  // Each in order
  for (const checkIn of recorded) {
    // Its month
    const month = checkIn.day.slice(0, 7);
    // The first of its month is kept
    if (!months.has(month)) keep.add(checkIn.id);
    // Seen
    months.add(month);
  }
  // Every take of a check-in not kept
  return new Set(sessions.filter((session) => session.checkIn && !keep.has(session.checkIn.id)).map((session) => session.id));
}

// Read the check-in settings safely from a saved or imported record: unknown parts, days and choices are dropped
export function readCheckInSettings(value: unknown): CheckInSettings | undefined {
  // Nothing, or not an object
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  // The fields
  const raw = value as Record<string, unknown>;
  // A real weekday
  const day = typeof raw.day === "number" && Number.isInteger(raw.day) && raw.day >= 0 && raw.day <= 6 ? raw.day : undefined;
  // Skips with a check-in id and known parts
  const skipped = Array.isArray(raw.skipped) ? raw.skipped.filter((skip): skip is { id: string; parts: unknown[] } => typeof skip === "object" && skip !== null && checkInDayOf(String((skip as { id?: unknown }).id)) !== null && Array.isArray((skip as { parts?: unknown }).parts)).map((skip) => ({ id: skip.id, parts: CHECK_IN_PARTS.filter((part) => skip.parts.includes(part)) })) : undefined;
  // Reminders seen, as whole days
  const seen = Array.isArray(raw.seen) ? raw.seen.filter((days): days is number => typeof days === "number" && Number.isInteger(days) && days > 0) : undefined;
  // A known choice
  const keep = raw.keep === "all" || raw.keep === "thinned" ? raw.keep : undefined;
  // Only what is there
  return { ...(day !== undefined ? { day } : {}), ...(skipped ? { skipped } : {}), ...(seen ? { seen } : {}), ...(keep ? { keep } : {}) };
}

// The check-in settings on this device joined with a backup's: the file's day and choice, and both lists of skips and reminders
export function mergeCheckInSettings(here: CheckInSettings | undefined, there: CheckInSettings | undefined): CheckInSettings | undefined {
  // Neither has any
  if (!here && !there) return undefined;
  // Skips joined by check-in, every part either skipped
  const skips = new Map<string, CheckInPart[]>();
  // Each from both
  for (const skip of [...(here?.skipped ?? []), ...(there?.skipped ?? [])]) skips.set(skip.id, CHECK_IN_PARTS.filter((part) => skip.parts.includes(part) || !!skips.get(skip.id)?.includes(part)));
  // Reminders seen on either
  const seen = [...new Set([...(here?.seen ?? []), ...(there?.seen ?? [])])].sort((a, b) => a - b);
  // The day and choice: the file's, else this device's
  const day = there?.day ?? here?.day;
  // (the choice)
  const keep = there?.keep ?? here?.keep;
  // Only what is there
  return { ...(day !== undefined ? { day } : {}), ...(skips.size > 0 ? { skipped: [...skips.entries()].map(([id, parts]) => ({ id, parts })).sort((a, b) => a.id.localeCompare(b.id)).slice(-SKIPS_KEPT) } : {}), ...(seen.length > 0 ? { seen } : {}), ...(keep ? { keep } : {}) };
}

// The days of the week, Sunday first, for the check-in day
export const WEEKDAY_NAMES: ReadonlyArray<string> = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// The months, for dates in words
const MONTH_NAMES: ReadonlyArray<string> = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// A day (YYYY-MM-DD) in words, such as "Tuesday 28 October"
export function dayWords(key: string): string {
  // The date
  const date = dateOfKey(key);
  // Weekday, day and month
  return `${WEEKDAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

// A day (YYYY-MM-DD) in a few words, such as "28 Oct", for lists and players
export function shortDay(key: string): string {
  // The date
  const date = dateOfKey(key);
  // Day and short month
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]!.slice(0, 3)}`;
}

// What a part asks this check-in: the passage's title, the pitch's topic, the story prompt, or (for the surprise question, which stays hidden until the countdown) nothing
export function partPrompt(part: CheckInPart, week: number): { id: string; text: string | null } {
  // Each part
  switch (part) {
    // The same passage every week
    case "read": return { id: CHECK_IN_PASSAGE.id, text: CHECK_IN_PASSAGE.title };
    // The same pitch every week
    case "pitch": return { id: CHECK_IN_PITCH_ID, text: "Who you are and what you do, in two minutes" };
    // This check-in's story
    case "story": return { id: checkInStory(week).id, text: checkInStory(week).text };
    // This check-in's question, kept a surprise
    case "surprise": return { id: checkInQuestion(week).id, text: null };
  }
}

// Where a part is recorded: the recording page with the part's kind, prompt and the check-in it belongs to
export function partHref(part: CheckInPart, id: string, week: number): string {
  // The prompt for this check-in
  const prompt = partPrompt(part, week).id;
  // The check-in and part, added to every address
  const tag = `checkin=${encodeURIComponent(id)}&part=${part}`;
  // A story is a short one (about a minute), with the usual shape and no focus
  return `/session?mode=${CHECK_IN_PART_INFO[part].mode}&prompt=${prompt}${part === "story" ? "&length=short" : ""}&${tag}`;
}
