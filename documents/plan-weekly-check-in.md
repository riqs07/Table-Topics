# The weekly check-in

**Purpose:** How the weekly check-in works, why each choice was made, and what is not done yet.
**Status:** Built, decision 100 (2026-10-21).

## What the user asked for

"A weekly routine assessment where we ask them the same questions like, hey, give a 2-minute elevator pitch. Tell us a story about X, Y, or Z. That way, when we resurface to the user at 7 or 14-day intervals, they're able to more clearly compare and contrast where they started compared to where they are now."

## What it is

About six minutes, four parts in a fixed order. Each part can be skipped; the check-in can be left and picked up again the same day.

| Part | What | Recorded as | Same every week? |
|---|---|---|---|
| Read aloud | "The Saturday walk", a 120-word passage written for the app (about 50 seconds): statements, a list, a question, an exclamation, someone's words, numbers | `read`, prompt `ci-read` | Yes: the cleanest comparison of the voice |
| Elevator pitch | "Your two-minute pitch: who you are and what you do", three points to cover | a short speech (`outline`, prompt `ci-pitch`) with a two-minute goal and its light (yellow at 1:15, red after 2:00) | Yes |
| A story | One of 12 matched "Tell us about…" prompts (`cis01`–`cis12`), a short story: up to a minute to plan, lights at 0:45, 1:00, 1:15 | `story`, short length, the usual story checks | No: taken in turn, so none repeats for 12 weeks |
| Surprise question | One of 12 matched Rapid Fire questions (`ciq01`–`ciq12`), hidden until the 10-second countdown, 1:00 to 2:00 | `talk` (Rapid Fire) | No: taken in turn |

Every take is saved with `marker: true` (kept whole by decision 98's rules) and `checkIn: { id, week, part }` linking the four. Takes are ordinary sessions of their kind, so they feed History, the speaking profile, the coach and "then and now" like any take. A check-in take skips the listening step (no notes are asked for) so the check-in moves straight on to its next part; the coach's feedback still arrives on the take's page.

Content lives in `src/content/checkIn.ts`, the rules in `src/core/checkIn.ts`, the comparison in `src/core/checkInCompare.ts`, reads and writes in `src/data/checkIns.ts`.

## When it happens

- **The first check-in (the starting point)** is due on day two to day four of use. Day one keeps its short free talk (decision 78): asking for six minutes before the first minute has been enjoyed would lose people. It can also be started from `/check-in` on any day before the first one exists.
- **After that,** on one day of the week: the day chosen in Settings → Weekly check-in, or else the weekday of the first check-in. Missed, it stays open for the next two days, then waits for the next week. Two check-ins are always at least five days apart, so changing the day never asks for two in a week.
- **Today on a check-in day** leads with it ("Check-in day." or "Your first check-in."), and the plan gets lighter: the check-in takes the place of the warm-up reading and both picks; the Learn card stays (one minute, no speaking). The check-in already reads aloud, speaks on the spot and tells a story, so adding the usual steps would make the day 10 to 12 minutes. "Can't speak now?" works as for any step; it is offered again on the grace days.
- Whether today is a check-in day is worked out from the days before today, so the plan stays the same all day (as decision 51 requires).
- Everything works with no network and no keys: nothing in the check-in needs the server.

## The comparison (`/check-in/compare`)

- First and latest by default; quick choices for "First and latest" and "Last two", and two lists to pick any two.
- For each part: both recordings (stacked on a phone, side by side on a computer), each with what that week asked; A/B buttons switch between them at the same point (for the passage, the same words).
- A table per part: time against its window, speaking pace, pause words (left out when pause words are hidden or "I stammer" is on), pauses a minute, pauses mid-sentence, pitch range, volume variety, articulation clarity when deeper analysis ran, and for the story the phone's story checks.
- **Like with like** (as the profile does): two values from the same kind of engine; when one take had deeper analysis, the phone's own values for both (kept aside by decision 91); otherwise the row is shown with "measured differently" and not judged. Volume variety is only judged when the browser levelled neither take (decision 81). A change under a twentieth of the earlier value is "About the same".
- Up to three plain lines per part, biggest change first ("Pitch range: 5 semitones → 8 semitones, wider."), led by a line about time when it moved into or out of its window.
- A recording that is not on this device (deleted, or brought in from a backup, which carries no audio) is said plainly and the numbers still show. A part skipped in either check-in says there is nothing to compare.
- The page reads the sessions once and the analyses of just the eight takes compared (`getAnalyses`), never every analysis (decision 99).

## Looking back ("Hear how far you've come")

On Today, 7, 14 and 30 days after the first check-in, then every 30 days, once there is a later check-in to compare with. "Compare" opens the first against the latest; opening it or "Not now" puts that reminder aside for good (`checkIn.seen` in the settings). Each reminder stays offered at most two weeks and is held back while today's check-in is still waiting, so Today asks one thing at a time.

## The coach

The weekly summary (`/api/summary`) now also gets the first check-in against the latest, as numbers only: each part's time and its measure rows with the like-with-like verdicts, at most 14 rows a part. No transcripts or audio. Without a passphrase nothing is sent, as before. **Not built:** "Ask the coach what changed" on the comparison page. It would need either a new paid route or a summary outside its once-a-week limit; the weekly summary already carries the comparison, so it was left out.

## The profile

A "Weekly check-ins" card under the weekly summary: how many, the latest six days, and "Compare first and latest". Worked out from the sessions the profile already reads.

## Data and export

- Fields, not a new collection: `checkIn` on each take; `checkIn` in the settings (`day`, `skipped` parts by check-in, reminders `seen`, and `keep`). A check-in is worked out from its takes each time, so nothing is stored twice and no database upgrade was needed.
- Export stays version 2: the new fields are optional, so older files (versions 1 and 2) import unchanged. A damaged check-in tag refuses the file. On import a take already here keeps its recording link and marker; the settings take the file's day and choice, and join both lists of skipped parts and reminders.

## Storage

At 32 kbit/s a check-in is about 6 minutes, about 1.4 MB; kept whole, that is about 75 MB a year. Settings → Your recordings offers "first, last 12, one a month": the first check-in, the latest twelve and the first check-in of each month stay kept whole; the others' recordings then follow the usual 7, 14 or 30 days. That is about 21 check-ins (about 30 MB) after a year, then about 12 more a year (about 17 MB). The detailed readings follow the same rule.

## Not verified

- A real voice and a real phone: the check-in was run end to end in desktop Chromium with the stand-in microphone and speech, with the page's clock moved a week on.
- Whether the matched pools are equally hard in practice: they were written to the same length and weight, not measured.
