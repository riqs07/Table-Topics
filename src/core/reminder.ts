// A daily reminder as a calendar file the device makes itself (decision 78): no server and no notifications, just an event that repeats every day

// The calendar's line ending
const CRLF = "\r\n";

// What the reminder needs
export interface ReminderInput {
  // The time of day, "HH:MM"
  time: string;
  // The user's anchor, such as "after my morning coffee" (may be empty)
  anchor: string;
  // The app's address, to open from the event
  url: string;
  // Now, for the first day and the file's stamp
  now: Date;
}

// Two digits
function pad(value: number): string {
  // Zero in front when needed
  return String(value).padStart(2, "0");
}

// Text made safe for a calendar field (backslashes, commas, semicolons and line breaks escaped)
function escapeText(text: string): string {
  // Escape each special character
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// Fold a long line at 75 characters, as calendars expect (continuations start with a space)
function fold(line: string): string {
  // Short lines stay as they are
  if (line.length <= 75) return line;
  // Pieces of 75, then 74 after the leading space
  const pieces = [line.slice(0, 75)];
  // The rest, in pieces
  for (let index = 75; index < line.length; index += 74) pieces.push(` ${line.slice(index, index + 74)}`);
  // Joined with line breaks
  return pieces.join(CRLF);
}

// Whether a time is a valid "HH:MM"
export function isReminderTime(time: string): boolean {
  // Hours 00 to 23, minutes 00 to 59
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

// The calendar file's text: one event at the time each day, from the next time it comes round, with an alert at the start
export function reminderCalendar({ time, anchor, url, now }: ReminderInput): string {
  // The hour and minute (eight in the morning if the time is not valid)
  const [hour, minute] = isReminderTime(time) ? time.split(":").map(Number) : [8, 0];
  // Today at that time
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  // Tomorrow if that time has passed
  if (first <= now) first.setDate(first.getDate() + 1);
  // The start in the device's own time (no time zone, so it stays at that hour wherever the phone is)
  const start = `${first.getFullYear()}${pad(first.getMonth() + 1)}${pad(first.getDate())}T${pad(first.getHours())}${pad(first.getMinutes())}00`;
  // When the file was made, in UTC
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  // What the event says
  const description = `${anchor.trim() ? `${anchor.trim().replace(/^./, (letter) => letter.toUpperCase())}. ` : ""}Today's practice takes about ten minutes. ${url}`;
  // The lines
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VoiceLab//Daily practice//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:voicelab-daily-practice",
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    "DURATION:PT10M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:VoiceLab practice",
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:VoiceLab practice",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // Folded and joined, ending with a line break
  return lines.map(fold).join(CRLF) + CRLF;
}
