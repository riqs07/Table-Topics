// Load the test helpers from the test runner
import { describe, expect, it } from "vitest";
// Load what is being checked
import { isReminderTime, reminderCalendar } from "@/core/reminder";

// Group the checks about the daily reminder file (decision 78)
describe("reminderCalendar", () => {
  // One event a day at the chosen local time, from the next time it comes round, with an alert
  it("makes a daily event from the next time it comes round", () => {
    // At 9 in the morning, asking for 8: the first is tomorrow
    const text = reminderCalendar({ time: "08:00", anchor: "after my morning coffee", url: "https://example.test", now: new Date(2026, 9, 13, 9) });
    // Its lines
    const lines = text.split("\r\n");
    // Confirm the start, the rule, the summary, the alert, the anchor at the start of the description, and the line endings
    expect([lines.includes("DTSTART:20261014T080000"), lines.includes("RRULE:FREQ=DAILY"), lines.includes("SUMMARY:VoiceLab practice"), lines.includes("TRIGGER:PT0M"), text.includes("DESCRIPTION:After my morning coffee. Today's practice"), text.endsWith("END:VCALENDAR\r\n")]).toEqual([true, true, true, true, true, true]);
  });

  // Later today when the time has not passed; commas escaped; long lines folded
  it("starts today when it can, escapes text, and folds long lines", () => {
    // At 7, asking for 18:30, with a comma in the anchor
    const text = reminderCalendar({ time: "18:30", anchor: "after work, before dinner", url: "https://example.test", now: new Date(2026, 9, 13, 7) });
    // Confirm the start, the escaped comma, and that no line is longer than 75 characters
    expect([text.includes("DTSTART:20261013T183000"), text.includes("work\\, before"), text.split("\r\n").every((line) => line.length <= 75)]).toEqual([true, true, true]);
  });

  // Only real times count
  it("checks times", () => {
    // Confirm
    expect(["08:00", "23:59", "24:00", "8:00", "ab"].map(isReminderTime)).toEqual([true, true, false, false, false]);
  });
});
