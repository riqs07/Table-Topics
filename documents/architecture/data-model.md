# Data Model

**Purpose:** List what VoiceLab stores, where, and for how long.
**Last updated:** 2026-10-21 (decision 102)

## Where data lives

Everything is stored in the user's browser (IndexedDB). There is no server database in v1. A "Delete all my data" button in settings wipes everything. Browsers can clear this storage on their own (see risks.md R7), so v1 includes an "Export my data" file (checkpoint C8, defaulted to yes).

Code: `src/data/records.ts` (record types), `src/data/repository.ts` (all reads and writes), `src/data/indexedDbStore.ts` (browser storage), `src/data/exportFile.ts` (export and import), `src/data/migrations.ts` (moving older records to the current layout), `src/core/retention.ts` and `src/data/housekeeping.ts` (what is kept, and the upkeep that applies it; decision 98). Dates are stored as ISO text so exports round-trip exactly. The database is named "voicelab-practice-journal", a name distinctive enough not to collide with another app run on the same address (one user's browser held a "voicelab" database from another project on localhost; sharing it failed twice, first on its higher version, then on its differently laid-out collections). It is opened at whatever version exists; missing collections and lookups are added one version higher; and if a collection with one of our names keeps its keys inside records, the app refuses to write and says the database belongs to something else.

### Layout and moving older data (decision 98)

- **Lookups:** one, on `sessions.feedbackStatus`, so the takes waiting for coach feedback are found without reading every session. No date lookups: the measurements did not need them once sessions became small (see performance.md).
- **Layout version:** the `meta` collection holds `{ schema, migratedAt }` under the key `schema`. The database's own version number cannot be trusted for this (another app on the same address may have raised it, bug B2), so the layout has its own number. Layout 1 is everything before decision 98; layout 2 keeps each take's readings in `signals`, saves `pitchRange` on the session, and stores analyses without their words.
- **The move** (`migrate` in `src/data/migrations.ts`) runs when the app is idle after a page has loaded, 100 records per transaction. Each session still carrying readings is split, and each analysis still carrying `raw.timedWords` is stored without them, inside one transaction per batch that reads each record as stored at that moment. Stopped half-way (a closed tab), every record is either moved or untouched, and the next start carries on; `schema` is written only at the end. Until then every read works on either layout: a session's page joins readings from wherever they are, and a session saved meanwhile has its readings split out on the way in.
- **Shared reads:** the repository reads all sessions (and all analyses) once and shares the result until something is saved, in this tab or another (a `BroadcastChannel` named `voicelab-practice-journal-changes` says so), so a page that asks two or three times makes one read.

## Stored records

### Session (one per recording)

| Field | Meaning |
|-------|---------|
| id | Unique identifier |
| createdAt | When the session started |
| promptId | Which prompt was used |
| isBaseline | True for the user's first full session (never a warm-up) |
| retryOf | Id of the session this one retries, or empty |
| mode | `talk` (Rapid Fire, called Table Topic until decision 85: 10-second countdown, then Toastmasters timing of 1:00 to 2:00, with under 1:00 or over 2:30 marked as not qualifying; stops itself at 3:00), `response` (prepared speech, once called Record Response: 2 minutes to plan with hints, then a 2:00 to 4:00 window with green, yellow and red lights and 30 seconds of grace; stops itself at 5:00; decision 35), `lesson` (a skill-path lesson; the prompt id is the lesson id; like `read`, never the baseline and left out of progress numbers), `pause` (pause drill: a marked passage, like `read`), `rehearse` (the user's own talk; up to 30 minutes; light only when the talk has a goal), `qa` (an answer to a likely audience question: one-minute goal, stops at 2:00; never the baseline and left out of progress numbers), `bookend` (an openings and closings drill: 45-second goal, stops at 1:00; never the baseline and left out of progress numbers), `smalltalk` (an answer to an everyday question, or a small-talk lesson's question; the prompt id is the question id `st01`... or the lesson id `stl1`..., or a drill or lesson of another unit: `sa`/`sal` asking, `sls`/`sll` listening, `sn`/`snl` news, and since decision 95 `sr01`–`sr12`/`srl1`–`srl6` reading the room (0:03 to 0:20), `se01`–`se12`/`sel1`–`sel6` starting and ending (0:05 to 0:30) and `sd01`–`sd12`/`sdl1`–`sdl6` going deeper (0:02 to 0:12, stops at 0:30); the unit is worked out from the prompt id, so nothing new is stored; an answer has a 0:20 to 0:45 window, stops at 1:00; kept apart from the speech practice: never the baseline, and left out of today's plan, the streak, History and progress numbers; decision 42), `moment` (a private "one moment a day" note; prompt id `moment`; stops at 1:00; saved with feedback status `done` and no listening step, so it is never sent to the coach; kept apart like `smalltalk`; decision 44), `read` (reading a passage aloud; no light, stops at 10 minutes; never the baseline and left out of progress numbers, since reading has fewer fillers by nature), `free` (free talk about anything; prompt id `free`; no light, stops at 10 minutes; decision 73), `outline` (a short speech the user planned; prompt id `outline`; its plan is in `outline`; a light against its own length, stops at 10 minutes; decision 73), `voice` (a voice drill or shadowing session; the prompt id is the drill id `c01`... `v01`... `p01`... `t01`... or the passage id `s01`...; its findings are in `voice`; saved with feedback status `done`, no audio and no coach; never the baseline and left out of progress numbers, but counted for the run, Your week and today's practice; decision 80), `conversation` (a spoken conversation with a persona; the prompt id is the persona's id `maya`, `theo`, `chris` or `priya`; the situation, twist and every turn are in `conversation`, and the transcript is your own words joined; about 3 minutes, with a goodbye at 3:00; no audio is kept; sent to the coach as a whole conversation; never the baseline and left out of progress numbers, but counted for the run and History; decisions 83 and 84), or the retired `standard` (one-minute session) and `warmup` (30 seconds). The baseline is the first `talk` or `response` (or an old `standard`); a Table Topic can be the baseline since decision 37, because new users' first week uses Table Topics. Table Topics count for the streak and progress numbers (both are per-minute rates). Warm-ups count for the streak but are left out of the baseline, the trend, and progress numbers. Exports from before modes existed load as `standard`; `story`, a told story: up to a minute to plan, then the timing lights of its length (short: green 0:45, yellow 1:00, red 1:15, stops at 2:00; full: green 2:00, yellow 2:30, red 3:00, stops at 4:00; decision 92) |
| durationSec | Length of the recording |
| transcript | Full text of what was said |
| wordsPerMinute | Computed from transcript and duration |
| fillersPerMinute | Computed from transcript and duration |
| focus | The weekly focus active at the time. Ids of focuses retired on 2026-10-15 (`start-and-finish`, `pace`, `structure`, `warmth-and-energy`) stay valid; `findFocus` in `core/focus.ts` still knows their names |
| feedback | Keep / change / retry cue, or empty if not yet received. A small-talk answer's feedback also has `smallTalk`: the moment, up to three hooks, the feeling and the question back, quoted from the speaker (empty when missing), and a livelier version using only what they said. A follow-up question or a reply to a story (asking and listening, decision 47), a response to news, and since decision 95 a reply in reading the room, an opener and goodbye, or an upgraded question, has `connection` instead: `found`, the beats the coach heard, each `{ beat, quote }`, and `better`, a better question or response. A conversation's feedback has `conversation`: `yours`, one of the speaker's turns quoted, and `better`, how it could sound (decision 83) |
| feedbackStatus | pending, done, or failed |
| selfReview | The user's notes after listening back (decision 30): what worked, what to change, quick tags, whether they skipped, and when. Empty while a new first try waits for notes; missing on older sessions and retries |
| questions | On a rehearsal or a response: likely audience questions for Q&A practice (removed, decision 61; kept on old sessions), suggested by the coach or typed by the user. Usually missing |
| question | On a Q&A answer (`mode` `qa`, whose `promptId` is the session the question came from): the question it answered |
| outline | On a short speech (`mode` `outline`): `{ topic, points, goalMinutes }`, the topic (up to 140 characters), one to four points and the length chosen (1, 2, 3 or 5 minutes). Sent to the coach fenced as data; a retry reads it from the first try. The last plan is also kept in this browser under `voicelab-outline-draft` (not exported) so the planning page can bring it back (decision 73) |
| story | On a told story (`mode` `story`, decision 92): `{ shape, focus, length }`: the shape shown while planning (`classic`, `but-therefore`, `then-now` or `small-moment`), the one focus or null (`middle`, `dialogue`, `detail`, `point`, `minute`) and the length (`short`, about a minute, or `full`, two to three). The story itself is the session's `promptId`: a prompt from the bank (`sp01` to `sp40`) or `moment-` and a moment note's session id. Every telling of the same seed is a version of the same story; a retelling also has `retryOf`, the telling before it. Its feedback may carry `story`: the beats the coach heard (`setting`, `stakes`, `turn`, `ending`, `meaning`, each with a quote), one of the speaker's lines (`yours`) and how it could sound (`better`) |
| (guided stories) | A guided story (decision 93) is stored exactly like a bank prompt's telling: its id (`gs01` to `gs24`) is the story's id and each telling's `promptId`, and the `stories` record takes its title. Its coach feedback may add `story.broughtToLife` (what was added beyond the facts); its rubric may add `story.alive` (0 to 3 with a quote); its analysis's `raw.story` adds `guided: { added, factsHeard, facts }`. All three are optional, so older records and files read as before. Nothing new is stored on the device for the facts themselves: they come from `src/content/guidedStories.ts` |
| sectionIndex | For a rehearsal of one section of a talk: which section (counted from 0). Missing or empty for a whole run and for every other mode |
| autoGain | Whether the browser's automatic levelling was on while recording (decision 81): false means changes in volume across the take are real. Missing when the browser could not say, and on older sessions |
| loudnessScale | For a recording made without the levelling: the one factor its loudness readings were multiplied by so typical speech reads 0.2 (decision 81). Playback is boosted by half of it, up to six times. Missing otherwise |
| conversation | On a conversation (`mode` `conversation`, decisions 83 and 84): `{ turns, scenarioId?, twist? }`. `scenarioId` is the situation (`party`, `monday`, `meeting`, `class`, `coffee`, `walk`, `station` or `lunch`) and `twist` which of its twists was used; both are missing on conversations from before decision 84, which were in the persona's own situation. Each turn is `{ who, text, lineId?, seconds }`: `who` is `you` or `them`; for their turns `text` is the words they said, written for the conversation or (without the coach) recorded, when `lineId` names the recording; for yours `text` is what the phone heard. The "say that again" lines and the listening sounds are not kept. Missing on every other kind of session |
| voice | On a voice session (`mode` `voice`, decision 80): `{ kind, headline, takes }`, the kind (`clear`, `volume`, `pitch`, `tone` or `shadow`), the results headline, and one `{ label, line }` per take, such as "Meeting room" and "A clear step up from the last take." The takes' audio, loudness and pitch readings are not kept |
| audioKey | Link to the saved audio, or empty once the retention rule deleted it (decision 98). Also empty when the user did not keep the recording after listening back (decision 32) |
| pitchRange | The take's pitch range in semitone steps, worked out from its pitch readings when it is saved (or moved, decision 98), so a later take's "usual range" needs no readings. Missing when there was too little voice |
| starred | Starred on the take's page (decision 98): its recording and readings are kept however old it is. Missing means not starred |
| marker | A marker take, kept whole like a starred one. Every weekly check-in take has it (decision 100; `saveRecording` sets it for a take with `checkIn`, or with `marker: true`). With "first, last 12, one a month" chosen, the other check-ins' takes are no longer treated as markers by the retention rule (the field stays). Missing means not a marker |
| checkIn | On a weekly check-in take (decision 100): `{ id, week, part }`. `id` is `ci-` and the day it was done (`ci-2026-10-21`), shared by the four parts; `week` is its number among check-ins with a take (1 is the first, worked out when saved); `part` is `read`, `pitch`, `story` or `surprise`. The take is an ordinary session of its kind: `read` with prompt `ci-read`, `outline` with prompt `ci-pitch` and the pitch's plan, `story` (short) with prompt `cis01`–`cis12`, `talk` with prompt `ciq01`–`ciq12`. It has no `selfReview` (no listening step). A check-in itself is not stored: it is worked out from its takes and the skipped parts each time (`groupCheckIns`). Missing on every other take |
| trimmedAt | When the take's detailed readings were dropped by the retention rule (decision 98). Its page then says "Detailed charts aren't kept for older takes" where a chart would be, and its analysis is no longer worked out again. Missing while the readings are kept |

A take's detailed readings (loudness, pitch and word times) are not on the session since decision 98: they are in `signals`, below.

### Readings (one per take that has them; decision 98)

In the `signals` collection, keyed by session id. Kept apart because they were about 85% of a session's size and every page read every session: a full read of a year's sessions took about 0.8 s on a slowed phone, and about a tenth of that without them. They are read only where they are drawn or measured: the take's page, the coach request for that take, and working its analysis out again.

| Field | Meaning |
|-------|---------|
| sessionId | The session they belong to |
| loudness | Loudness readings every tenth of a second while recording (0 to 1, two decimals), used to find pauses and for the volume lines (decision 81); missing on older sessions |
| pitch | Pitch readings taken with the loudness readings, in whole hertz, or empty where there was no voice (decision 81). Missing on older sessions |
| spokenTimes | Seconds from the start when each word of the transcript was first heard (a tenth of a second, approximate; decision 28). Missing on older sessions |
| scriptTimes | With text on screen: seconds when each word of that text was first read, or empty if never read. Missing on older sessions and sessions without text |

Dropped after 30 days unless the take is kept whole (see Retention rules).

### Analysis (one per take; added 2026-10-21, decision 90)

Each take's measures, in their own collection (`analyses`, keyed by session id) so the session stays small. Every measure is defined in `src/core/analysis/metrics.ts`; [measurements.md](measurements.md) lists them all and explains how they are worked out. Voice drills and moment notes have none.

| Field | Meaning |
|-------|---------|
| sessionId | The session it belongs to |
| schemaVersion | The version of the measure definitions (`ANALYSIS_SCHEMA_VERSION`); an older one is worked out again from the session, keeping the rubric |
| computedAt | When the measures were last worked out |
| engines | `{ device, transcript?, voice?, rubric? }`, each `{ name, version, at }`: which engines contributed. `transcript` and `voice` appear once deeper analysis has run (decision 91), with the transcription engine and the worker's version |
| metrics | Every measure by id, each `{ value, unit, source, engine }`: the number (or null when it could not be measured), its unit, where it came from (`device`, `transcript`, `voice` or `rubric`) and the exact engine (such as `device-loudness-v1` or `device-heuristic-v1`, or the coach model for rubric scores) |
| raw | What the phone measures are worked out from, so they can be worked out again without the audio: the mode, length and saved pause-word rate; `timedWords` (each word of the transcript, cleaned, with the time it was first heard and the next word's time, or null without word times; **not stored since decision 98**: it is rebuilt from the transcript and the take's word times when the measures are worked out again, and once the readings are dropped the phone's measures keep the values they have); `pauses` (each silence of 0.25 s or more, with the first word heard after it) and where they came from (`loudness`, `word-gaps` or `none`); the span of speech; summaries of loudness (average, coefficient of variation, thirds, whether the browser levelled it) and pitch (usual pitch, range and spread in semitones, phrase endings); fading phrase ends; the first 30 seconds against the rest; up to 300 content words with their counts; a conversation's measures; and a told story's checks (`story`: someone's words, details counted, a turn, "and then" counted, a start in the action, a feeling, an ending on the point; decision 92). The loudness and pitch readings are not copied: they stay in the take's readings record (`signals`, decision 98) |
| server | Deeper analysis (decision 91), when it ran: `{ transcript, voice }`, either may be null. `transcript` is `{ engine, text, words, at }` with every word as `{ text, w, s, e, conf }` (its written form with punctuation, the cleaned word, start and end in seconds, confidence 0 to 1); `voice` is the worker's numbers (jitter, shimmer, HNR, alpha ratio, Hammarberg, creak, syllables and rates, a pitch summary, the optional audEERING scores or null) with its engine and Praat version. Kept so its measures can be worked out again. Missing until deeper analysis runs |
| superseded | Phone values that a server value replaced, by measure id, in the same shape as `metrics`, so no phone value is ever lost (decision 91). Missing when none were replaced |
| deep | Where the take's deeper analysis stands (decision 91): `{ status, note, at }`, the status `running`, `done`, `partial`, `failed` or `skipped`, and the quiet note shown on the take's page. Missing when it was never sent |
| rubric | The coach's internal rubric, once it arrived: scores of 0 to 3, each with a quote, for point first, answers the question (or null), structure, ending, concrete example and word choice; the devices used; unneeded hedges; up to three word swaps `{ said, stronger, why }`; the model and when. Never shown as scores; the first word swap shows on the results page |

### Story (one per story told; added 2026-10-21, decision 92)

In the `stories` collection, keyed by the story's id, which is its seed's id (the same as its tellings' `promptId`): `title` (the prompt's short title, or the moment note's first eight words, until the user renames it; up to 80 characters), `createdAt` (first told) and `updatedAt` (when the title last changed). Made when a seed is first told (`ensureStory`, called by `saveRecording`; a failure there never stops the telling being saved, and the library then falls back to the starting title). How many times it was told, its latest telling and the takeaway are worked out from the sessions each time "Your stories" opens (`storyLibrary` in `src/core/storyLibrary.ts`), so nothing is stored twice. Chosen over a separate story id on each session because the seed already names the story: a prompt can only be one story, and so can a moment note.

### Weekly summary (added 2026-10-21, decision 90)

One per week, in the `summaries` collection, keyed by id: `createdAt`, the `headline`, `improved` (up to three lines), one `pattern`, next week's `focus`, a `suggestedDrill` or null, and the `model` that wrote it. Shown at the top of the speaking profile with its date.

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
| audioRetention | The old "keep the last N sessions" count (decision 88). No longer used since decision 98; still written (30) so the settings stay readable by an older copy of the app |
| recordingDays | How many days of recordings keep their audio: 7, 14 or 30, chosen in Settings → Your recordings (decision 98). Missing means 14; any other value is read as 14, so a damaged value can never delete more. Recordings are made at 32 kilobits a second, about 240 KB a minute |
| shareNotes | Whether the coach may read the user's notes after listening back (decision 31). Off unless chosen; missing on older settings |
| learn | Learn progress by card id (decision 45): when the card was first read (`readAt`). The recall fields (`box`, `dueAt`, `lastResult`, `recalledAt`) stay on older progress but are no longer used: cards have no quiz and no review since decision 67 |
| missions | Every mission try, oldest first (decision 52): the mission id (`m01` to `m19`; `m15` to `m19` were added in decision 95, between missions of the same level, so earlier tries keep their ids and still count), the day, the status (accepted, skipped or done), the prediction (1 to 5), whether it was tried, how it went (1 to 5), what the user noticed (text only, never sent anywhere), whether it felt like too much, and when it was debriefed. Missing until the first mission is answered |
| scenarios | Scenario questions by id (decision 54): the tier of the first reply chosen and of the latest, and when each was answered. Missing until the first scenario is answered |
| skipped | Steps of today's practice put off with "Can't speak now?" (decision 77): the day (YYYY-MM-DD) and each step's key (`kind:mode:promptId`). A list from another day counts for nothing. Missing until the first skip |
| hideStreak | Whether Today hides the practice days (the line, the squares and the week sentence; decision 78). Missing means shown |
| anchor | When the user practises, in their words, up to 60 characters, such as "after my morning coffee" (decision 78). Shown on Today and written into the calendar reminder. Missing until chosen |
| reminderTime | The daily reminder's time, "HH:MM", last used for the calendar file (decision 78). The reminder itself lives in the user's calendar, not in the app. Missing until chosen |
| showPauseWords | Whether pause-word counts, marks and headlines show (decision 79). Missing means shown |
| stammer | "I stammer" (decision 79): hides pause words, repeats and fluency judgements, and is sent to the coach as `stammer: true` so it leaves fluency alone. Missing means off |
| warmupDays | The days (YYYY-MM-DD) a one-minute warm-up was finished, the latest 60 (decision 80). Warm-ups record nothing, so this is how today's practice knows the warm-up step is done and how the voice modes take turns. Missing until the first warm-up |
| deepAnalysis | "Send my recordings for deeper analysis" (decision 91): each saved take's audio is sent once to the server for a verbatim transcript and voice measures. Missing means off |
| practiceFocus | What the user wants to get better at most (decision 97): one or two of `stories`, `conversation`, `spot` (thinking on my feet), `voice`, `work` and `talk` (a talk coming up), in the order picked. Asked at the welcome; changed in Settings; someone from before the question is asked once on Today. Missing means never asked (Today shows the question); an empty list means asked and left open (the usual daily mix). Read through `readPracticeFocus`, which drops unknown areas, repeats and anything past two. In exports like every setting; an import takes the file's when it has one and keeps this device's when it does not |
| checkIn | The weekly check-in (decision 100): `day`, the weekday chosen (0 Sunday to 6 Saturday; missing means the weekday of the first check-in); `skipped`, the parts put aside by check-in id (`{ id, parts }`, the latest 60); `seen`, the "Hear how far you've come" reminders put aside or opened, as days after the first check-in (7, 14, 30, 60…); `keep`, `all` (or missing) or `thinned` (the first, the last 12 and the first of each month keep their recordings). Read through `readCheckInSettings`, which drops unknown days, parts and choices. On import the file's day and choice win, and skipped parts and reminders are joined. Missing until first used |
| turnEnding | How a turn of yours ends in a conversation (decision 101): `"tap"` (tap Done) or `"auto"` (it ends when you stop talking; Done still works). Read through `turnEndingOf`: missing, or anything else, means automatic. Changed in Settings → Talk with someone. In exports like every setting |
| wordsToWatch | Words the clear-sounds drills could not catch, with a count each (decision 80): a miss adds one, a catch takes one away, and a word goes at nothing; the 30 most-missed are kept. The warm-up's line to say adds the top three. Missing until the first clear-sounds drill |

### Prompts

Prompts ship inside the app as fixed content. They are not user data.

The recordings of the fixed lines (small talk and shadowing, decision 82; the four conversation characters' lines, decision 83) ship as files in `public/clips/`. Once played, each is kept in the browser's cache store `voicelab-voice-v1` under its address, so it plays offline. That store also keeps any line fetched from `/api/voice`. It is not user data, is not exported, and the service worker leaves it alone when it updates (each release's worker deletes only older `voicelab-app-<build>` page caches and the old `voicelab-v<n>` ones; decision 88). Built scripts and fonts are kept in `voicelab-static`, shared across releases, with a note of which files the current and the previous release use; a file no longer used by either is removed when the next release takes over (decision 99).

## Derived, not stored

- **Practice days and the run:** calculated from session and mission dates (decision 78: days in the last seven, and a run that two rest days a week never break), so they can never get out of sync.
- **Trend lines and before/after numbers:** calculated from sessions on demand.
- **The speaking profile** (decision 90): usual and recent levels, trends, change flags, patterns and word habits are worked out from the analyses each time the profile opens (`src/core/analysis/profile.ts`).

## Retention rules

| Data | Kept |
|------|------|
| Audio | The last 14 days (7 or 30 if chosen in Settings), then deleted automatically. **Always kept:** starred takes, marker takes (every weekly check-in take, about 1.4 MB a check-in and 75 MB a year; with "first, last 12, one a month" chosen, only the first check-in, the latest twelve and the first of each month, about 30 MB after a year; decision 100) and the very first recording. Before decision 98 the rule was "the newest 30, the first recording, and the first takes of 20 prompts practised again"; at 32 kbit/s the new rule holds about 2 to 3 MB a week of practice plus the kept takes |
| Detailed readings (pitch and loudness ten times a second, each word's time) | 30 days, then dropped and the take marked `trimmedAt`; kept for starred takes, marker takes and the very first recording (decision 98) |
| Transcripts, metrics, feedback, notes | Until the user deletes them |
| Analyses (each take's measures, raw features and rubric) and weekly summaries | Until the user deletes them; an analysis outlives its take's audio (decision 90). Once a take's readings are dropped, its measures keep the values they have and are not worked out again after a change of definitions (decision 98) |
| Stories (titles) | Until the user deletes everything; a story's tellings follow the session rules above (decision 92) |

## Export file

- A JSON file with every session, the readings still kept, challenge, saved talk, analysis, weekly summary, story, and the settings (analyses and summaries since decision 90, stories since decision 92; older files without them still import).
- **Version 2** (decision 98): sessions without readings, a `signals` list with the readings still kept, and analyses without `raw.timedWords`. Written as compact JSON (no indentation, which made a year's file 80 MB instead of 33), a part at a time with a progress line, so the page never freezes on one big string. **Version 1** files (readings on each session, analyses with their words) still import: their readings are moved apart and the words left out on the way in. A take whose readings this device dropped on purpose does not get them back from an older file, and its `trimmedAt` stays.
- Import reads what is already here a chunk of 200 at a time and saves each chunk in one transaction (it used to be one transaction per record), with a progress line.
- A story already on the device is joined with the file's by `mergeStory`: the title changed most recently wins (by `updatedAt`) and the earlier first-told date is kept; a story new to the device is added. A session whose `story` set-up names an unknown shape, focus or length is refused as damaged. **Audio is not included** (keeps the file small); sessions in the file have no audio link.
- The weekly check-in (decision 100) adds only optional fields (`checkIn` on a take and in the settings), so the file stays version 2 and older files import unchanged; a take whose check-in tag names an unknown part, a malformed id or no number is refused as damaged.
- Importing adds to what is on the device without losing anything there (decision 86). A star or marker in the file is added to a take here that has none. A session, challenge or talk already on the device is kept and only gains what it lacks from the file (coach feedback with its status, your notes, any empty field); its recording link is never touched, and a challenge marked done stays done. An analysis already here is kept and only gains a rubric or a deeper analysis it lacks; a summary is added when its id is new. Settings take the file's choices but keep any the file does not have; Learn cards, scenario answers, missions, words to watch and warm-up days are joined, keeping the further-on entry for each (the more recently used card or answer, the mission try that got further, the higher count). The message says how many sessions were new.
- A file that is not a VoiceLab export, is from a newer version, or has a damaged record is refused before anything is saved, with a plain message.

## What leaves the device

Every request stays within limits the server checks, kept in one place (`src/core/requestLimits.ts`, decision 86): a length up to the longest any session records (1,800 seconds), a transcript up to 40,000 characters, notes up to 500 characters each (the notes box takes no more), and up to 60 conversation turns of up to 1,000 characters each, with no more than 45,000 characters of text in one feedback request in all (decision 87; the app shortens the transcript to fit). The app cuts what it sends to fit (at a whole word); what is saved on the device keeps every word and the real length.

| Data | Sent to | When |
|------|---------|------|
| Transcript text | AI coach (via our server route) | After each session. The reply now also carries an internal rubric (scores with quotes from your own words, and word swaps), kept on the device (decision 90) |
| The words of a conversation so far (yours and the persona's), with the persona, situation and twist (decision 84) | Claude Haiku (via our server route `/api/conversation`), to write the persona's next line; that line's words then go to ElevenLabs to be spoken in the persona's voice | After each of your turns, when the passphrase is set. Without it, the recorded script is used and nothing is sent. What goes to ElevenLabs is the line Claude wrote, which may repeat or reword something you said (a persona answering you often does). Each request also carries a random id for the conversation and the seconds since it began, so the server can hold one conversation to five minutes and count the month's conversation minutes (decision 102); the server keeps only those counts, for an hour and a month, never the words. The reply now streams back sentence by sentence; what is sent is unchanged. Whether a turn of yours has ended (decision 101) is worked out on the phone from the microphone level and the words already there; nothing extra is sent. VoiceLab sends no audio of you; your words reach the page through the browser's speech recognition, which in most browsers hears the audio (the Audio row below; corrected 2026-10-21, decision 97, from "No audio of you leaves the device") |
| A whole conversation: every turn's words and its situation (decisions 83 and 84) | AI coach (via our server route) | After the conversation, instead of a single transcript. No voice numbers are sent for a conversation |
| Voice numbers (pitch range, how phrases ended, phrases that faded, the last third's volume; decision 81) | AI coach (via our server route) | With the transcript, when pitch or loudness was recorded. The pitch and loudness readings themselves never leave the device |
| The session's details: its length, its kind, the prompt or passage id, and the id of this week's focus | AI coach (via our server route) | With every transcript |
| That you stammer (decision 79) | AI coach (via our server route) | With every transcript, only when you turned it on in Settings, so the coach leaves fluency alone |
| A compact table of your measures (per family of practice: usual and recent levels, trends and changes of the shown measures and any flagged internal ones), the patterns found, up to five short quotes of at most 200 characters (the coach's own rubric quotes from this week, otherwise the first 20 words of this week's takes), up to three word swaps, words you used far more than usual, and last week's focus (decision 90). Never whole transcripts, audio, pitch or loudness readings; at most 12,000 characters of text | AI coach (Claude Opus, via our server route `/api/summary`) | Once a week at most, when the speaking profile opens, the passphrase is set, and you made at least three takes that week. With two weekly check-ins or more it also carries the first against the latest as numbers only: each part's length and up to 14 measure rows with their verdicts (decision 100) |
| Your own notes after listening back (what worked, what you would change, and your tags) | AI coach (via our server route) | Only when "Let the coach read my notes" is on in Settings, and only notes you wrote |
| The question you answered in a Q&A session (written by the coach or typed by you) | AI coach (via our server route) | With that answer's transcript |
| The plan of a short speech: its topic, points and length (decision 73) | AI coach (via our server route) | With that speech's transcript |
| The change the coach gave last time | AI coach (via our server route) | With a retry's transcript, so the coach can say whether it showed up |
| Audio | The browser maker's speech recognition: Google in Chrome (desktop and Android), Apple in Safari (iPhone, iPad, Mac), Microsoft in Edge. VoiceLab never receives it | During every recording with a live transcript, and each conversation turn. Said plainly before the microphone is first used, in Settings → Your data, and on the conversation pages (decision 97). Chrome 139 and later can recognise on the device when a page asks (`processLocally`, after a language pack download); VoiceLab does not ask for it yet |
| Audio | Whisper (via our server route) | Only if browser transcription is unavailable, and the user is told |
| Each saved take's recording, as recorded (WebM/Opus or MP4/AAC, at most 4,000,000 bytes, about 16 minutes), with its length in seconds (decision 91) | Our server route `/api/analyse`, which passes it at once to **AssemblyAI** (transcription, US servers by default) and to **our own voice worker** (on Modal or Cloud Run). The route stores nothing; the worker keeps nothing (the audio stays in memory for the request); the app deletes the transcript at AssemblyAI as soon as it has read it (set the shortest data retention and the training opt-out in the AssemblyAI dashboard too). What comes back to the phone: the transcript's words with times and confidence, and voice numbers | Only when "Send my recordings for deeper analysis" is on in Settings (off by default), once per take, right after it is saved; never for conversations (no audio is kept) or voice drills. Offline takes are skipped, not queued. Nothing else about you is sent with it: no transcript from the phone, no notes, no settings |
