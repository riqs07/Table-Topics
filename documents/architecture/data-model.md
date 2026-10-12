# Data Model

**Purpose:** List what VoiceLab stores, where, and for how long.
**Last updated:** 2026-10-11

## Where data lives

Everything is stored in the user's browser (IndexedDB). There is no server database in v1. A "Delete all my data" button in settings wipes everything. Browsers can clear this storage on their own (see risks.md R7), so v1 may also include an "Export my data" file (checkpoint C8).

## Stored records

### Session (one per recording)

| Field | Meaning |
|-------|---------|
| id | Unique identifier |
| createdAt | When the session started |
| promptId | Which prompt was used |
| isBaseline | True for the user's first-ever session |
| retryOf | Id of the session this one retries, or empty |
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
| focusIndex | Which weekly focus the user is on |
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
| Audio | Last 30 sessions, then deleted automatically |
| Transcripts, metrics, feedback | Until the user deletes them |

## What leaves the device

| Data | Sent to | When |
|------|---------|------|
| Transcript text | AI coach (via our server route) | After each session |
| Audio | The browser maker's speech service | During live transcription in most browsers; the user is told |
| Audio | Whisper (via our server route) | Only if browser transcription is unavailable, and the user is told |
