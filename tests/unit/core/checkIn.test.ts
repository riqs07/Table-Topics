// Checks for the weekly check-in's rules (decision 100): grouping takes into check-ins, when one is due (the first on day two to four, then the chosen weekday with two days of grace), the reminder to look back, keeping fewer check-in recordings, and reading and joining its settings
import { describe, expect, it } from "vitest";
// Load the rules being checked
import { checkInDayOf, checkInId, checkInSchedule, checkInTakesReleased, checkInWeekday, dayWords, firstUseOf, groupCheckIns, isFinished, mergeCheckInSettings, nextAfter, nextPart, partHref, partStatuses, readCheckInSettings, resurfaceDue, sinceWords, weekFor, withSeen, withSkip, type CheckIn } from "@/core/checkIn";
// Load the calendar helpers
import { addDays, dayKey } from "@/core/dates";
// Load the record types
import type { CheckInPart, SessionRecord } from "@/data/records";
// Load a sample session builder
import { makeSession } from "../../support/fixtures";

// A Tuesday: 13 October 2026, mid-morning
const TUESDAY = new Date(2026, 9, 13, 10);

// A take in a check-in on a day
function take(day: Date, part: CheckInPart, week = 1, extra: Partial<SessionRecord> = {}): SessionRecord {
  // A session tagged with its check-in
  return makeSession({ id: `${dayKey(day)}-${part}-${extra.id ?? ""}`, createdAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9).toISOString(), mode: part === "read" ? "read" : part === "pitch" ? "outline" : part === "story" ? "story" : "talk", checkIn: { id: checkInId(day), week, part }, marker: true, audioKey: "a", ...extra });
}

// A whole check-in's four takes on a day
function fullCheckIn(day: Date, week = 1): SessionRecord[] {
  // One take per part
  return (["read", "pitch", "story", "surprise"] as const).map((part) => take(day, part, week));
}

// The schedule on a day, with the given takes and choices
function scheduleOn(today: Date, sessions: SessionRecord[], day?: number) {
  // Grouped
  const checkIns = groupCheckIns(sessions, day === undefined ? undefined : { day });
  // Worked out
  return checkInSchedule({ today, firstUse: firstUseOf(sessions), checkIns, settings: day === undefined ? undefined : { day } });
}

// Group the checks about ids and grouping
describe("check-in grouping", () => {
  // Ids name the day
  it("names each check-in by its day and reads the day back", () => {
    // Confirm the id and the reading, and that other ids are not days
    expect([checkInId(TUESDAY), checkInDayOf("ci-2026-10-13"), checkInDayOf("sp01"), checkInDayOf("ci-13-10-2026")]).toEqual(["ci-2026-10-13", "2026-10-13", null, null]);
  });

  // Takes and skips make check-ins, numbered in order, the latest take of a part winning
  it("groups takes and skips into numbered check-ins", () => {
    // A first check-in with a part done twice, a second with one skip, and a third with every part skipped
    const later = addDays(TUESDAY, 7);
    // The sessions
    const sessions = [...fullCheckIn(TUESDAY), take(TUESDAY, "read", 1, { id: "again", createdAt: new Date(2026, 9, 13, 11).toISOString() }), take(later, "read", 2), take(later, "pitch", 2), take(later, "story", 2), makeSession({ id: "plain" })];
    // The skips
    const settings = { skipped: [{ id: checkInId(later), parts: ["surprise" as const] }, { id: checkInId(addDays(TUESDAY, 14)), parts: ["read" as const, "pitch" as const, "story" as const, "surprise" as const] }] };
    // Grouped
    const all = groupCheckIns(sessions, settings);
    // Confirm three check-ins, numbered 1, 2 and 0 (nothing recorded), the later read winning, and each finished
    expect([all.map((checkIn) => checkIn.week), all[0]!.takes.read!.id, all[1]!.skipped, all.map((checkIn) => isFinished(checkIn))]).toEqual([[1, 2, 0], "again", ["surprise"], [true, true, true]]);
  });

  // A skip never hides a part that has a take
  it("never counts a part as skipped once it has a take", () => {
    // A read take, and a skip of the read too
    const all = groupCheckIns([take(TUESDAY, "read")], { skipped: [{ id: checkInId(TUESDAY), parts: ["read", "pitch"] }] });
    // Confirm only the pitch is skipped, and the next part is the story
    expect([all[0]!.skipped, nextPart(all[0]), partStatuses(all[0]).map((item) => item.status)]).toEqual([["pitch"], "story", ["done", "skipped", "open", "open"]]);
  });

  // The number a new take gets: its check-in's, or one after those before
  it("numbers a new check-in one after the recorded ones before it", () => {
    // Two recorded check-ins and one fully skipped between them
    const all = groupCheckIns([take(TUESDAY, "read"), take(addDays(TUESDAY, 14), "read", 2)], { skipped: [{ id: checkInId(addDays(TUESDAY, 7)), parts: ["read", "pitch", "story", "surprise"] }] });
    // Confirm an existing one keeps its number, and a new one later is third
    expect([weekFor(all, checkInId(TUESDAY)), weekFor(all, checkInId(addDays(TUESDAY, 14))), weekFor(all, checkInId(addDays(TUESDAY, 21))), weekFor([], checkInId(TUESDAY))]).toEqual([1, 2, 3, 1]);
  });

  // The next part, and finished only when every part is accounted for
  it("knows the next part and when it is finished", () => {
    // Nothing yet, then the first two parts
    const two = groupCheckIns([take(TUESDAY, "read"), take(TUESDAY, "pitch")], undefined)[0];
    // Confirm the next part each time
    expect([nextPart(null), nextPart(two), isFinished(two), isFinished(null)]).toEqual(["read", "story", false, false]);
  });
});

// Group the checks about when a check-in is due
describe("check-in schedule", () => {
  // Day one keeps its short first step; the first check-in is due from day two to day four
  it("offers the first check-in on day two to four, never on day one", () => {
    // First used on Tuesday
    const sessions = [makeSession({ id: "first", createdAt: new Date(2026, 9, 13, 9).toISOString() })];
    // Day one to day five
    const days = [0, 1, 2, 3, 4].map((offset) => scheduleOn(addDays(TUESDAY, offset), sessions));
    // Confirm due on days two to four, late after day two, with the next day said on day one, all the baseline
    expect(days.map((day) => [day.due, day.late, day.next, day.baseline])).toEqual([[false, false, "2026-10-14", true], [true, false, null, true], [true, true, null, true], [true, true, null, true], [false, false, "2026-10-20", true]]);
  });

  // With no use at all there is nothing to schedule
  it("schedules nothing before the first day of use", () => {
    // Confirm nothing is due and no day is named
    expect(scheduleOn(TUESDAY, [])).toEqual({ due: false, baseline: true, late: false, next: null });
  });

  // After the first check-in, the same weekday each week, with two days of grace
  it("falls on the first check-in's weekday each week, open for two more days when missed", () => {
    // First used Monday, first check-in on Tuesday
    const sessions = [makeSession({ id: "first", createdAt: new Date(2026, 9, 12, 9).toISOString() }), ...fullCheckIn(TUESDAY)];
    // The days from the next Monday to the Saturday after
    const days = [6, 7, 8, 9, 10].map((offset) => scheduleOn(addDays(TUESDAY, offset), sessions));
    // Confirm due on Tuesday, Wednesday and Thursday only (late after Tuesday), and the next day named before
    expect(days.map((day) => [day.due, day.late, day.next])).toEqual([[false, false, "2026-10-20"], [true, false, null], [true, true, null], [true, true, null], [false, false, "2026-10-27"]]);
  });

  // The whole window missed: wait for the next week
  it("waits for the next week once the two days of grace have passed", () => {
    // A check-in on Tuesday 13th, then nothing
    const sessions = fullCheckIn(TUESDAY);
    // Confirm the 23rd (Friday) is not due and the 27th is, and the 30th is not
    expect([scheduleOn(new Date(2026, 9, 23, 10), sessions).next, scheduleOn(new Date(2026, 9, 27, 10), sessions).due, scheduleOn(new Date(2026, 9, 30, 10), sessions).due]).toEqual(["2026-10-27", true, false]);
  });

  // A check-in done late, on a grace day, still means the next one is on the usual weekday
  it("keeps the weekday after a late check-in, at least five days on", () => {
    // Tuesday's, then the next one done on Thursday
    const sessions = [...fullCheckIn(TUESDAY), ...fullCheckIn(addDays(TUESDAY, 9), 2)];
    // Confirm the Tuesday after is too soon (five days) and the one after that is due
    expect([scheduleOn(new Date(2026, 9, 27, 10), sessions).due, scheduleOn(new Date(2026, 9, 27, 10), sessions).next, scheduleOn(new Date(2026, 10, 3, 10), sessions).due]).toEqual([true, null, true]);
  });

  // A chosen day moves it, never closer than five days to the last
  it("moves to the chosen day, at least five days after the last", () => {
    // A check-in on Tuesday the 13th, and Thursday chosen
    const sessions = fullCheckIn(TUESDAY);
    // Confirm Thursday the 15th is too soon, the 22nd is due, and the weekday reads back
    expect([scheduleOn(new Date(2026, 9, 15, 10), sessions, 4).due, scheduleOn(new Date(2026, 9, 15, 10), sessions, 4).next, scheduleOn(new Date(2026, 9, 22, 10), sessions, 4).due, checkInWeekday({ day: 4 }, [], null)]).toEqual([false, "2026-10-22", true, 4]);
  });

  // The answer stays the same all day: a check-in started today never changes it
  it("works today out from the days before, so starting one never changes the plan", () => {
    // First used on Thursday the 1st, the first check-in window and its first Thursday missed, and a check-in started today (a Tuesday, not the weekday)
    const before = [makeSession({ id: "first", createdAt: new Date(2026, 9, 1, 9).toISOString() })];
    // Confirm today is not due before or after starting one
    expect([scheduleOn(TUESDAY, before).due, scheduleOn(TUESDAY, [...before, take(TUESDAY, "read")]).due]).toEqual([false, false]);
  });

  // A damaged chosen day is ignored
  it("ignores a chosen day that is not a weekday", () => {
    // Confirm the first check-in's weekday is used instead
    expect([checkInWeekday({ day: 9 }, groupCheckIns(fullCheckIn(TUESDAY), undefined), null), checkInWeekday(undefined, [], null), nextAfter(TUESDAY, 2)]).toEqual([2, null, "2026-10-20"]);
  });

  // Dates in words
  it("says days in words", () => {
    // Confirm a day and the reminder times
    expect([dayWords("2026-10-27"), [7, 14, 30, 60, 90].map(sinceWords)]).toEqual(["Tuesday 27 October", ["a week", "two weeks", "a month", "2 months", "3 months"]]);
  });

  // Each part's address carries its kind, its prompt for the week, and the check-in
  it("builds each part's recording address", () => {
    // Confirm the four addresses for check-in 2
    expect((["read", "pitch", "story", "surprise"] as const).map((part) => partHref(part, "ci-2026-10-20", 2))).toEqual(["/session?mode=read&prompt=ci-read&checkin=ci-2026-10-20&part=read", "/session?mode=outline&prompt=ci-pitch&checkin=ci-2026-10-20&part=pitch", "/session?mode=story&prompt=cis02&length=short&checkin=ci-2026-10-20&part=story", "/session?mode=talk&prompt=ciq02&checkin=ci-2026-10-20&part=surprise"]);
  });
});

// Group the checks about the reminder to look back
describe("resurfacing", () => {
  // Two check-ins a week apart
  const twoWeeks = [...fullCheckIn(TUESDAY), ...fullCheckIn(addDays(TUESDAY, 7), 2)];
  // Grouped
  const checkIns = groupCheckIns(twoWeeks, undefined);

  // A week, two weeks, a month, then monthly
  it("comes at 7, 14 and 30 days, then every month", () => {
    // The reminder due on a number of days after the first
    const on = (days: number, latestDays = days) => resurfaceDue({ today: addDays(TUESDAY, days), checkIns: groupCheckIns([...fullCheckIn(TUESDAY), ...fullCheckIn(addDays(TUESDAY, latestDays), 2)], undefined), settings: undefined })?.days ?? null;
    // Confirm none before a week, then each in turn
    expect([on(6, 6), on(7), on(13, 7), on(14), on(30), on(43, 30), on(60), on(95, 90)]).toEqual([null, 7, 7, 14, 30, 30, 60, 90]);
  });

  // Nothing to compare with one check-in
  it("waits for a second check-in", () => {
    // Confirm nothing with only the first
    expect(resurfaceDue({ today: addDays(TUESDAY, 7), checkIns: groupCheckIns(fullCheckIn(TUESDAY), undefined), settings: undefined })).toBeNull();
  });

  // Put aside, it does not come back; the next one still does
  it("does not nag once put aside", () => {
    // Seen at a week
    const seen = withSeen(undefined, 7);
    // Confirm the week's is gone and two weeks' comes
    expect([resurfaceDue({ today: addDays(TUESDAY, 8), checkIns, settings: seen }), resurfaceDue({ today: addDays(TUESDAY, 14), checkIns, settings: seen })?.days, withSeen(seen, 7).seen]).toEqual([null, 14, [7]]);
  });

  // Never lingers more than two weeks past its day
  it("goes quietly two weeks after its day", () => {
    // A month on, the reminder is the month's; 44 days on it has gone
    expect([resurfaceDue({ today: addDays(TUESDAY, 43), checkIns, settings: undefined })?.days, resurfaceDue({ today: addDays(TUESDAY, 44), checkIns, settings: undefined })]).toEqual([30, null]);
  });
});

// Group the checks about keeping fewer check-in recordings
describe("keeping fewer check-in recordings", () => {
  // Thirty weekly check-ins from the 13th of October
  const sessions = Array.from({ length: 30 }, (_, index) => take(addDays(TUESDAY, index * 7), "read", index + 1));

  // Every one kept unless chosen otherwise
  it("keeps every check-in by default", () => {
    // Confirm none released
    expect([checkInTakesReleased(sessions, undefined).size, checkInTakesReleased(sessions, { keep: "all" }).size]).toEqual([0, 0]);
  });

  // The first, the last twelve and the first of each month
  it("keeps the first, the latest twelve and one a month", () => {
    // Released
    const released = checkInTakesReleased(sessions, { keep: "thinned" });
    // The days kept
    const kept = sessions.filter((session) => !released.has(session.id)).map((session) => session.createdAt.slice(0, 10));
    // Confirm the first of each month from October to February, then the latest twelve (from 9 February 2027)
    expect([kept.slice(0, 5), kept.length, kept.at(-1)]).toEqual([["2026-10-13", "2026-11-03", "2026-12-01", "2027-01-05", "2027-02-02"], 17, "2027-05-04"]);
  });
});

// Group the checks about the settings
describe("check-in settings", () => {
  // Skips build up per check-in, once each, in order
  it("adds skipped parts once each", () => {
    // Two skips of one check-in and one of another
    const settings = withSkip(withSkip(withSkip(undefined, "ci-2026-10-13", "story"), "ci-2026-10-13", "read"), "ci-2026-10-20", "pitch");
    // Confirm the lists
    expect(settings.skipped).toEqual([{ id: "ci-2026-10-13", parts: ["read", "story"] }, { id: "ci-2026-10-20", parts: ["pitch"] }]);
  });

  // A damaged or edited record is made safe
  it("drops unknown days, parts and choices", () => {
    // Confirm the cleaned record, and nothing for nonsense
    expect([readCheckInSettings({ day: 8, skipped: [{ id: "ci-2026-10-13", parts: ["read", "dance"] }, { id: "nope", parts: ["read"] }], seen: [7, -1, "x"], keep: "some" }), readCheckInSettings("nonsense"), readCheckInSettings({ day: 3, keep: "thinned" })]).toEqual([{ skipped: [{ id: "ci-2026-10-13", parts: ["read"] }], seen: [7] }, undefined, { day: 3, keep: "thinned" }]);
  });

  // A backup joins: the file's day and choice, both lists of skips and reminders
  it("joins a backup's check-in settings with this device's", () => {
    // Here: a day, a skip and a reminder; there: another day, another skip of the same check-in, another reminder, a choice
    const joined = mergeCheckInSettings({ day: 2, skipped: [{ id: "ci-2026-10-13", parts: ["read"] }], seen: [7] }, { day: 4, skipped: [{ id: "ci-2026-10-13", parts: ["surprise"] }], seen: [14], keep: "thinned" });
    // Confirm the join, and nothing from nothing
    expect([joined, mergeCheckInSettings(undefined, undefined), mergeCheckInSettings({ day: 1 }, undefined)]).toEqual([{ day: 4, skipped: [{ id: "ci-2026-10-13", parts: ["read", "surprise"] }], seen: [7, 14], keep: "thinned" }, undefined, { day: 1 }]);
  });

  // The first day of use is the earliest take, whatever the order
  it("finds the first day of use", () => {
    // Two sessions out of order
    expect([firstUseOf([makeSession({ id: "b", createdAt: "2026-10-14T09:00:00.000Z" }), makeSession({ id: "a", createdAt: "2026-10-12T09:00:00.000Z" })])?.toISOString(), firstUseOf([])]).toEqual(["2026-10-12T09:00:00.000Z", null]);
  });

  // The type is used, so the grouping shape stays as documented
  it("hands back check-ins in the documented shape", () => {
    // One check-in
    const [one] = groupCheckIns([take(TUESDAY, "read")], undefined) as [CheckIn];
    // Confirm its fields
    expect(Object.keys(one).sort()).toEqual(["day", "id", "skipped", "takes", "week"]);
  });
});
