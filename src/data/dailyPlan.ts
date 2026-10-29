// Loads today's practice: the steps, which are done, today's sessions, and more to do afterwards (used by Today, the recording page and the session page)

// Load the filter that leaves out private moment notes
import { practiceSessions } from "@/core/sessionHome";
// Load the plan rules
import { dailyPlan, moreToDo, planProgress, planSkipped, stepKey, todaysFocusSuggestion, type PlanStep } from "@/core/dailyPlan";
// Load the weekly focus rules
import { currentFocus } from "@/core/focus";
// Load the event-prep rules, for a talk coming up
import { daysUntil, eventPlan, prepHeadline } from "@/core/eventPrep";
// Load the calendar-day helper
import { dayKey } from "@/core/dates";
// Load the reader for the user's focus (decision 97)
import { readPracticeFocus } from "@/core/practiceFocus";
// Load the check-in rules (decision 100)
import { checkInId, checkInSchedule, firstUseOf, groupCheckIns, isFinished, partStatuses, readCheckInSettings, weekFor } from "@/core/checkIn";
// Load the record types
import type { CheckInPart, SessionRecord, TalkRecord } from "@/data/records";
// Load the guided course rules: progress read safely, and prompts due to come back (decision 131)
import { practicePromptText, readCourseProgress, revisitsDue, takeHref } from "@/core/courses";
// Load the repository type
import type { Repository } from "@/data/repository";

// The soonest talk whose date is today or later, with its days left and today's step
export function nextTalkFrom(talks: ReadonlyArray<TalkRecord>, now: Date): { talk: TalkRecord; daysLeft: number; headline: string } | null {
  // Dated talks still to come, soonest first
  const coming = talks
    .filter((talk) => talk.eventDate)
    .map((talk) => ({ talk, daysLeft: daysUntil(talk.eventDate ?? "", now) }))
    .filter((entry) => entry.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  // The soonest
  const soonest = coming[0];
  // Today's step for it
  const step = soonest ? eventPlan(soonest.daysLeft)?.[0] : undefined;
  // Hand it back with its sentence, or nothing
  return soonest && step ? { ...soonest, headline: prepHeadline(soonest.daysLeft, step) } : null;
}

// Today's practice as loaded
export interface LoadedPlan {
  // The steps
  steps: PlanStep[];
  // Which are done
  done: boolean[];
  // Which were put off today with "Can't speak now?" (decision 77)
  skipped: boolean[];
  // Today's sessions, newest first
  today: SessionRecord[];
  // More to do once the steps are done
  more: PlanStep[];
  // With a focus, the one thing Today suggests once the steps are done (decision 97)
  suggestion: { action: string; href: string; phrase: string } | null;
  // On a check-in day: today's check-in, its number, whether it is the first or the day after a missed one, and how each part stands (decision 100)
  checkIn: { id: string; week: number; baseline: boolean; late: boolean; parts: Array<{ part: CheckInPart; status: "done" | "skipped" | "open" }> } | null;
  // A course part's prompt due to come back, with where to answer it (decision 131; null when none is due)
  revisit: { partId: string; question: string; from: string; href: string } | null;
}

// Load today's practice (reads only; the weekly focus is worked out without saving it)
export async function loadDailyPlan(repository: Repository, now: Date): Promise<LoadedPlan> {
  // Every session that counts (private moment notes are left out)
  const sessions = practiceSessions(await repository.listSessions());
  // The settings, for the weekly focus
  const settings = await repository.getSettings(now);
  // This week's focus
  const focus = currentFocus({ focusIndex: settings.focusIndex, focusStartedOn: new Date(settings.focusStartedOn) }, now).focus;
  // A talk coming up
  const talk = nextTalkFrom(await repository.listTalks(), now);
  // The check-ins so far, from the sessions already read (decision 100)
  const checkInSettings = readCheckInSettings(settings.checkIn);
  // (grouped)
  const checkIns = groupCheckIns(sessions, checkInSettings);
  // Whether today is a check-in day (worked out from the days before today, so it stays the same all day)
  const schedule = checkInSchedule({ today: now, firstUse: firstUseOf(sessions), checkIns, settings: checkInSettings });
  // Today's check-in id, and the check-in itself once started
  const id = checkInId(now);
  // (started)
  const started = checkIns.find((checkIn) => checkIn.id === id);
  // Today's check-in, on a check-in day
  const checkIn = schedule.due ? { id, week: weekFor(checkIns, id), baseline: schedule.baseline, late: schedule.late, parts: partStatuses(started) } : null;
  // The steps
  const input = { day: now, sessions, focusId: focus.id, nextTalk: talk ? { id: talk.talk.id, title: talk.talk.title, headline: talk.headline } : null, learn: settings.learn ?? {}, warmupDays: settings.warmupDays ?? [], practiceFocus: readPracticeFocus(settings.practiceFocus) ?? [], checkIn, courses: readCourseProgress(settings.courses) };
  // The steps
  const steps = dailyPlan(input);
  // Hand back the steps, what is done, today's sessions, more to do afterwards, and the check-in (only when it is in the steps: never on day one)
  return { steps, done: planProgress(steps, sessions, now, settings.learn ?? {}, settings.scenarios ?? {}, settings.warmupDays ?? [], isFinished(started), input.courses), skipped: planSkipped(steps, settings.skipped, now), today: sessions.filter((session) => dayKey(new Date(session.createdAt)) === dayKey(now)), more: moreToDo(input, steps), suggestion: todaysFocusSuggestion(input), checkIn: steps.some((step) => step.kind === "checkin") ? checkIn : null, revisit: revisitFor(input.courses, now) };
}

// The course prompt due to come back today, the oldest first, with its question and where to answer it (decision 131)
export function revisitFor(courses: Parameters<typeof revisitsDue>[0], now: Date): LoadedPlan["revisit"] {
  // The oldest due
  const due = revisitsDue(courses, now)[0];
  // Its question, where it comes from, and the recorder's address
  return due?.part.practice ? { partId: due.part.id, question: practicePromptText(due.part.practice) ?? due.part.title, from: `${due.course.title}, lesson ${due.lessonNumber}`, href: takeHref(due.part, 1, true)! } : null;
}

// Put a step off for today ("Can't speak now?"): it is not done, it is just not offered next; another day's skips are dropped (decision 77)
export async function skipStepToday(repository: Repository, step: PlanStep, now: Date): Promise<void> {
  // The settings, where skips are kept
  const settings = await repository.getSettings(now);
  // Today's date as text
  const day = dayKey(now);
  // Today's skips so far (none if the list is from another day)
  const steps = settings.skipped?.day === day ? settings.skipped.steps : [];
  // Add this one, once
  await repository.saveSettings({ ...settings, skipped: { day, steps: steps.includes(stepKey(step)) ? steps : [...steps, stepKey(step)] } });
}

// Note a finished warm-up routine for today (warm-ups record nothing, so their days are kept in the settings; the latest 60; decision 80)
export async function markWarmupDone(repository: Repository, now: Date): Promise<void> {
  // The settings
  const settings = await repository.getSettings(now);
  // Today
  const day = dayKey(now);
  // Earlier days, without today
  const earlier = (settings.warmupDays ?? []).filter((item) => item !== day);
  // Today added, the latest kept
  await repository.saveSettings({ ...settings, warmupDays: [...earlier, day].slice(-60) });
}
