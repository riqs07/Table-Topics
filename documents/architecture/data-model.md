# Data Model

**Purpose:** List what VoiceLab stores, where, and for how long.
**Last updated:** 2026-10-13

## Where data lives

Everything is stored in the user's browser (IndexedDB). There is no server database in v1. A "Delete all my data" button in settings wipes everything. Browsers can clear this storage on their own (see risks.md R7), so v1 includes an "Export my data" file (checkpoint C8, defaulted to yes).

Code: `src/data/records.ts` (record types), `src/data/repository.ts` (all reads and writes), `src/data/indexedDbStore.ts` (browser storage), `src/data/exportFile.ts` (export and import). Dates are stored as ISO text so exports round-trip exactly. The database is named "voicelab-practice-journal", a name distinctive enough not to collide with another app run on the same address (one user's browser held a "voicelab" database from another project on localhost; sharing it failed twice, first on its higher version, then on its differently laid-out collections). It is opened at whatever version exists; missing collections are added one version higher; and if a collection with one of our names keeps its keys inside records, the app refuses to write and says the database belongs to something else.

## Stored records

### Session (one per recording)

| Field | Meaning |
|-------|---------|
| id | Unique identifier |
| createdAt | When the session started |
| promptId | Which prompt was used |
| isBaseline | True for the user's first full session (never a warm-up) |
| retryOf | Id of the session this one retries, or empty |
| mode | `talk` (Table Topic: 10-second countdown, then Toastmasters timing of 1:00 to 2:00, with under 1:00 or over 2:30 marked as not qualifying; stops itself at 3:00), `response` (prepared speech, once called Record Response: 2 minutes to plan with hints, then a 2:00 to 4:00 window with green, yellow and red lights and 30 seconds of grace; stops itself at 5:00; decision 35), `lesson` (a skill-path lesson; the prompt id is the lesson id; like `read`, never the baseline and left out of progress numbers), `pause` (pause drill: a marked passage, like `read`), `rehearse` (the user's own talk; up to 30 minutes; light only when the talk has a goal), `qa` (an answer to a likely audience question: one-minute goal, stops at 2:00; never the baseline and left out of progress numbers), `bookend` (an openings and closings drill: 45-second goal, stops at 1:00; never the baseline and left out of progress numbers), `smalltalk` (an answer to an everyday question, or a small-talk lesson's question; the prompt id is the question id `st01`... or the lesson id `stl1`...; a 0:20 to 0:45 window, stops at 1:00; kept apart from the speech practice: never the baseline, and left out of today's plan, the streak, History and progress numbers; decision 42), `moment` (a private "one moment a day" note; prompt id `moment`; stops at 1:00; saved with feedback status `done` and no listening step, so it is never sent to the coach; kept apart like `smalltalk`; decision 44), `read` (reading a passage aloud; no light, stops at 10 minutes; never the baseline and left out of progress numbers, since reading has fewer fillers by nature), or the retired `standard` (one-minute session) and `warmup` (30 seconds). The baseline is the first `talk` or `response` (or an old `standard`); a Table Topic can be the baseline since decision 37, because new users' first week uses Table Topics. Table Topics count for the streak and progress numbers (both are per-minute rates). Warm-ups count for the streak but are left out of the baseline, the trend, and progress numbers. Exports from before modes existed load as `standard` |
| durationSec | Length of the recording |
| transcript | Full text of what was said |
| wordsPerMinute | Computed from transcript and duration |
| fillersPerMinute | Computed from transcript and duration |
| focus | The weekly focus active at the time. Ids of focuses retired on 2026-10-15 (`start-and-finish`, `pace`, `structure`, `warmth-and-energy`) stay valid; `findFocus` in `core/focus.ts` still knows their names |
| feedback | Keep / change / retry cue, or empty if not yet received. A small-talk answer's feedback also has `smallTalk`: the moment, up to three hooks, the feeling and the question back, quoted from the speaker (empty when missing), and a livelier version using only what they said. A follow-up question or a reply to a story (asking and listening, decision 47) has `connection` instead: `found`, the beats the coach heard, each `{ beat, quote }`, and `better`, a better question or response |
| feedbackStatus | pending, done, or failed |
| loudness | Loudness readings every tenth of a second while recording (0 to 1, two decimals), used to find pauses; missing on older sessions |
| spokenTimes | Seconds from the start when each word of the transcript was first heard (a tenth of a second, approximate; decision 28). Missing on older sessions |
| scriptTimes | With text on screen: seconds when each word of that text was first read, or empty if never read. Missing on older sessions and sessions without text |
| selfReview | The user's notes after listening back (decision 30): what worked, what to change, quick tags, whether they skipped, and when. Empty while a new first try waits for notes; missing on older sessions and retries |
| questions | On a rehearsal or a response: likely audience questions for Q&A practice (removed, decision 61; kept on old sessions), suggested by the coach or typed by the user. Usually missing |
| question | On a Q&A answer (`mode` `qa`, whose `promptId` is the session the question came from): the question it answered |
| sectionIndex | For a rehearsal of one section of a talk: which section (counted from 0). Missing or empty for a whole run and for every other mode |
| audioKey | Link to the saved audio, or empty if pruned. Also empty when the user did not keep the recording after listening back (decision 32) |

### Challenge (one per week)

| Field | Meaning |
|-------|---------|
| id | Unique identifier |
| weekStart | Date the week began |
| text | The real-world task |
| completedAt | When the user marked it done, or empty |

### Talk (one per saved talk, for Rehearse my talk; added 2026-10-15)

| Field | Meaning |
|-------|---------|
| id | Unique id; also the prompt id of its rehearsals, so "then and now" pairs rehearsals of the same talk |
| title | Short title shown in lists |
| body | The words of the talk or notes (up to 50,000 characters) |
| goalMinutes | Target length in whole minutes, or empty |
| eventDate | The day the talk will be given ("2026-10-22"), or missing or empty for none. Drives the countdown plan |
| createdAt | When it was saved |

A talk's sections are not stored: they are worked out from blank lines in its text each time (`talkSections`), so editing the text never leaves stale sections behind.

Talks are stored in their own collection (added to existing databases by raising the version) and included in the export file; files made before talks existed still import.

### Settings (one record)

| Field | Meaning |
|-------|---------|
| focusIndex | Which weekly focus the user is on (position in the v1 focus list in `core/focus.ts`) |
| focusStartedOn | Date the current focus began |
| audioRetention | Number of recent sessions whose audio is kept (default 30) |
| shareNotes | Whether the coach may read the user's notes after listening back (decision 31). Off unless chosen; missing on older settings |
| learn | Learn progress by card id (decision 45): when the card was first read, how many recall answers in a row were right (`box`), when its recall question is next due, how the last one went, and when it was last answered (`recalledAt`, added for the daily review step, decision 50). Missing until the first card is read. Kept with the settings so it travels in exports |
| missions | Every mission try, oldest first (decision 52): the mission id, the day, the status (accepted, skipped or done), the prediction (1 to 5), whether it was tried, how it went (1 to 5), what the user noticed (text only, never sent anywhere), whether it felt like too much, and when it was debriefed. Missing until the first mission is answered |
| scenarios | Scenario questions by id (decision 54): the tier of the first reply chosen and of the latest, and when each was answered. Missing until the first scenario is answered |

### Prompts

Prompts ship inside the app as fixed content. They are not user data.

## Derived, not stored

- **Streak:** calculated from session dates, so it can never get out of sync.
- **Trend lines and before/after numbers:** calculated from sessions on demand.

## Retention rules

| Data | Kept |
|------|------|
| Audio | Last 30 sessions, then deleted automatically. **Always kept:** the baseline (first) recording, and the first recording of each prompt or passage, so "then and now" can play it beside later takes |
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
