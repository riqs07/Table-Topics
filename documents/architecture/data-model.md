# Data Model

**Purpose:** List what VoiceLab stores, where, and for how long.
**Last updated:** 2026-10-13

## Where data lives

Everything is stored in the user's browser (IndexedDB). There is no server database in v1. A "Delete all my data" button in settings wipes everything. Browsers can clear this storage on their own (see risks.md R7), so v1 includes an "Export my data" file (checkpoint C8, defaulted to yes).

Code: `src/data/records.ts` (record types), `src/data/repository.ts` (all reads and writes), `src/data/indexedDbStore.ts` (browser storage), `src/data/exportFile.ts` (export and import). Dates are stored as ISO text so exports round-trip exactly. The database is named "voicelab" and is opened at whatever version the browser already has; if any of the four collections are missing, it is reopened one version higher to add them, leaving anything else in it alone. (A user hit a "voicelab" database at version 10 left by another app on localhost, which a fixed version number could not open.)

## Stored records

### Session (one per recording)

| Field | Meaning |
|-------|---------|
| id | Unique identifier |
| createdAt | When the session started |
| promptId | Which prompt was used |
| isBaseline | True for the user's first full session (never a warm-up) |
| retryOf | Id of the session this one retries, or empty |
| mode | `talk` (Table Topic: 10-second countdown, then Toastmasters timing of 1:00 to 2:00, with under 1:00 or over 2:30 marked as not qualifying; stops itself at 3:00), `response` (Record Response: 2 minutes to think with hints, then a 3:00 goal; stops itself at 4:00), or the retired `standard` (one-minute session) and `warmup` (30 seconds). The baseline is the first `response` (or an old `standard`). Table Topics count for the streak and progress numbers (both are per-minute rates) but never become the baseline. Warm-ups count for the streak but are left out of the baseline, the trend, and progress numbers. Exports from before modes existed load as `standard` |
| durationSec | Length of the recording |
| transcript | Full text of what was said |
| wordsPerMinute | Computed from transcript and duration |
| fillersPerMinute | Computed from transcript and duration |
| focus | The weekly focus active at the time |
| feedback | Keep / change / retry cue, or empty if not yet received |
| feedbackStatus | pending, done, or failed |
| audioKey | Link to the saved audio, or empty if pruned |

### Challenge (one per week)

| Field | Meaning |
|-------|---------|
| id | Unique identifier |
| weekStart | Date the week began |
| text | The real-world task |
| completedAt | When the user marked it done, or empty |

### Settings (one record)

| Field | Meaning |
|-------|---------|
| focusIndex | Which weekly focus the user is on (position in the v1 focus list in `core/focus.ts`) |
| focusStartedOn | Date the current focus began |
| audioRetention | Number of recent sessions whose audio is kept (default 30) |

### Prompts

Prompts ship inside the app as fixed content. They are not user data.

## Derived, not stored

- **Streak:** calculated from session dates, so it can never get out of sync.
- **Trend lines and before/after numbers:** calculated from sessions on demand.

## Retention rules

| Data | Kept |
|------|------|
| Audio | Last 30 sessions, then deleted automatically. **The baseline (first) recording's audio is always kept** |
| Transcripts, metrics, feedback | Until the user deletes them |

## Export file

- A JSON file with every session, challenge, and the settings. **Audio is not included** (keeps the file small); sessions in the file have no audio link.
- Importing adds to what is on the device; a record with the same id is replaced, and the file's settings are used.
- A file that is not a VoiceLab export, is from a newer version, or has a damaged record is refused before anything is saved, with a plain message.

## What leaves the device

| Data | Sent to | When |
|------|---------|------|
| Transcript text | AI coach (via our server route) | After each session |
| Audio | The browser maker's speech service | During live transcription in most browsers; the user is told |
| Audio | Whisper (via our server route) | Only if browser transcription is unavailable, and the user is told |
