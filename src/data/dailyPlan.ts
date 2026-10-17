// Loads today's practice: the steps, which are done, and today's sessions (used by Today, the recording page and the session page)

// Load the filter that keeps small talk apart
import { speechSessions } from "@/core/sessionHome";
// Load the plan rules
import { dailyPlan, planProgress, type PlanStep } from "@/core/dailyPlan";
// Load the weekly focus rules
import { currentFocus } from "@/core/focus";
// Load the event-prep rules, for a talk coming up
import { daysUntil, eventPlan, prepHeadline } from "@/core/eventPrep";
// Load the calendar-day helper
import { dayKey } from "@/core/dates";
// Load the record types
import type { SessionRecord, TalkRecord } from "@/data/records";
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
  // Today's sessions, newest first
  today: SessionRecord[];
}

// Load today's practice (reads only; the weekly focus is worked out without saving it)
export async function loadDailyPlan(repository: Repository, now: Date): Promise<LoadedPlan> {
  // Every session of the speech practice (small talk is kept apart)
  const sessions = speechSessions(await repository.listSessions());
  // The settings, for the weekly focus
  const settings = await repository.getSettings(now);
  // This week's focus
  const focus = currentFocus({ focusIndex: settings.focusIndex, focusStartedOn: new Date(settings.focusStartedOn) }, now).focus;
  // A talk coming up
  const talk = nextTalkFrom(await repository.listTalks(), now);
  // The steps
  const steps = dailyPlan({ day: now, sessions, focusId: focus.id, nextTalk: talk ? { id: talk.talk.id, title: talk.talk.title, headline: talk.headline } : null });
  // Hand back the steps, what is done, and today's sessions
  return { steps, done: planProgress(steps, sessions, now), today: sessions.filter((session) => dayKey(new Date(session.createdAt)) === dayKey(now)) };
}
