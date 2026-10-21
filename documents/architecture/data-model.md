# Data Model

**Purpose:** List what VoiceLab stores, where, and for how long.
**Last updated:** 2026-10-21 (decision 91)

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
| mode | `talk` (Rapid Fire, called Table Topic until decision 85: 10-second countdown, then Toastmasters timing of 1:00 to 2:00, with under 1:00 or over 2:30 marked as not qualifying; stops itself at 3:00), `response` (prepared speech, once called Record Response: 2 minutes to plan with hints, then a 2:00 to 4:00 window with green, yellow and red lights and 30 seconds of grace; stops itself at 5:00; decision 35), `lesson` (a skill-path lesson; the prompt id is the lesson id; like `read`, never the baseline and left out of progress numbers), `pause` (pause drill: a marked passage, like `read`), `rehearse` (the user's own talk; up to 30 minutes; light only when the talk has a goal), `qa` (an answer to a likely audience question: one-minute goal, stops at 2:00; never the baseline and left out of progress numbers), `bookend` (an openings and closings drill: 45-second goal, stops at 1:00; never the baseline and left out of progress numbers), `smalltalk` (an answer to an everyday question, or a small-talk lesson's question; the prompt id is the question id `st01`... or the lesson id `stl1`...; a 0:20 to 0:45 window, stops at 1:00; kept apart from the speech practice: never the baseline, and left out of today's plan, the streak, History and progress numbers; decision 42), `moment` (a private "one moment a day" note; prompt id `moment`; stops at 1:00; saved with feedback status `done` and no listening step, so it is never sent to the coach; kept apart like `smalltalk`; decision 44), `read` (reading a passage aloud; no light, stops at 10 minutes; never the baseline and left out of progress numbers, since reading has fewer fillers by nature), `free` (free talk about anything; prompt id `free`; no light, stops at 10 minutes; decision 73), `outline` (a short speech the user planned; prompt id `outline`; its plan is in `outline`; a light against its own length, stops at 10 minutes; decision 73), `voice` (a voice drill or shadowing session; the prompt id is the drill id `c01`... `v01`... `p01`... `t01`... or the passage id `s01`...; its findings are in `voice`; saved with feedback status `done`, no audio and no coach; never the baseline and left out of progress numbers, but counted for the run, Your week and today's practice; decision 80), `conversation` (a spoken conversation with a persona; the prompt id is the persona's id `maya`, `theo`, `chris` or `priya`; the situation, twist and every turn are in `conversation`, and the transcript is your own words joined; about 3 minutes, with a goodbye at 3:00; no audio is kept; sent to the coach as a whole conversation; never the baseline and left out of progress numbers, but counted for the run and History; decisions 83 and 84), or the retired `standard` (one-minute session) and `warmup` (30 seconds). The baseline is the first `talk` or `response` (or an old `standard`); a Table Topic can be the baseline since decision 37, because new users' first week uses Table Topics. Table Topics count for the streak and progress numbers (both are per-minute rates). Warm-ups count for the streak but are left out of the baseline, the trend, and progress numbers. Exports from before modes existed load as `standard` |
| durationSec | Length of the recording |
| transcript | Full text of what was said |
| wordsPerMinute | Computed from transcript and duration |
| fillersPerMinute | Computed from transcript and duration |
| focus | The weekly focus active at the time. Ids of focuses retired on 2026-10-15 (`start-and-finish`, `pace`, `structure`, `warmth-and-energy`) stay valid; `findFocus` in `core/focus.ts` still knows their names |
| feedback | Keep / change / retry cue, or empty if not yet received. A small-talk answer's feedback also has `smallTalk`: the moment, up to three hooks, the feeling and the question back, quoted from the speaker (empty when missing), and a livelier version using only what they said. A follow-up question or a reply to a story (asking and listening, decision 47) has `connection` instead: `found`, the beats the coach heard, each `{ beat, quote }`, and `better`, a better question or response. A conversation's feedback has `conversation`: `yours`, one of the speaker's turns quoted, and `better`, how it could sound (decision 83) |
| feedbackStatus | pending, done, or failed |
| loudness | Loudness readings every tenth of a second while recording (0 to 1, two decimals), used to find pauses and for the volume lines (decision 81); missing on older sessions |
| spokenTimes | Seconds from the start when each word of the transcript was first heard (a tenth of a second, approximate; decision 28). Missing on older sessions |
| scriptTimes | With text on screen: seconds when each word of that text was first read, or empty if never read. Missing on older sessions and sessions without text |
| selfReview | The user's notes after listening back (decision 30): what worked, what to change, quick tags, whether they skipped, and when. Empty while a new first try waits for notes; missing on older sessions and retries |
| questions | On a rehearsal or a response: likely audience questions for Q&A practice (removed, decision 61; kept on old sessions), suggested by the coach or typed by the user. Usually missing |
| question | On a Q&A answer (`mode` `qa`, whose `promptId` is the session the question came from): the question it answered |
| outline | On a short speech (`mode` `outline`): `{ topic, points, goalMinutes }`, the topic (up to 140 characters), one to four points and the length chosen (1, 2, 3 or 5 minutes). Sent to the coach fenced as data; a retry reads it from the first try. The last plan is also kept in this browser under `voicelab-outline-draft` (not exported) so the planning page can bring it back (decision 73) |
| sectionIndex | For a rehearsal of one section of a talk: which section (counted from 0). Missing or empty for a whole run and for every other mode |
| pitch | Pitch readings taken with the loudness readings, in whole hertz, or empty where there was no voice (decision 81). Missing on older sessions |
| autoGain | Whether the browser's automatic levelling was on while recording (decision 81): false means changes in volume across the take are real. Missing when the browser could not say, and on older sessions |
| loudnessScale | For a recording made without the levelling: the one factor its loudness readings were multiplied by so typical speech reads 0.2 (decision 81). Playback is boosted by half of it, up to six times. Missing otherwise |
| conversation | On a conversation (`mode` `conversation`, decisions 83 and 84): `{ turns, scenarioId?, twist? }`. `scenarioId` is the situation (`party`, `monday`, `meeting`, `class`, `coffee`, `walk`, `station` or `lunch`) and `twist` which of its twists was used; both are missing on conversations from before decision 84, which were in the persona's own situation. Each turn is `{ who, text, lineId?, seconds }`: `who` is `you` or `them`; for their turns `text` is the words they said, written for the conversation or (without the coach) recorded, when `lineId` names the recording; for yours `text` is what the phone heard. The "say that again" lines and the listening sounds are not kept. Missing on every other kind of session |
| voice | On a voice session (`mode` `voice`, decision 80): `{ kind, headline, takes }`, the kind (`clear`, `volume`, `pitch`, `tone` or `shadow`), the results headline, and one `{ label, line }` per take, such as "Meeting room" and "A clear step up from the last take." The takes' audio, loudness and pitch readings are not kept |
| audioKey | Link to the saved audio, or empty if pruned. Also empty when the user did not keep the recording after listening back (decision 32) |

### Analysis (one per take; added 2026-10-21, decision 90)

Each take's measures, in their own collection (`analyses`, keyed by session id) so the session stays small. Every measure is defined in `src/core/analysis/metrics.ts`; [measurements.md](measurements.md) lists them all and explains how they are worked out. Voice drills and moment notes have none.

| Field | Meaning |
|-------|---------|
| sessionId | The session it belongs to |
| schemaVersion | The version of the measure definitions (`ANALYSIS_SCHEMA_VERSION`); an older one is worked out again from the session, keeping the rubric |
| computedAt | When the measures were last worked out |
| engines | `{ device, transcript?, voice?, rubric? }`, each `{ name, version, at }`: which engines contributed. `transcript` and `voice` appear once deeper analysis has run (decision 91), with the transcription engine and the worker's version |
| metrics | Every measure by id, each `{ value, unit, source, engine }`: the number (or null when it could not be measured), its unit, where it came from (`device`, `transcript`, `voice` or `rubric`) and the exact engine (such as `device-loudness-v1` or `device-heuristic-v1`, or the coach model for rubric scores) |
| raw | What the phone measures are worked out from, so they can be worked out again without the audio: the mode, length and saved pause-word rate; `timedWords` (each word of the transcript, cleaned, with the time it was first heard and the next word's time, or null without word times); `pauses` (each silence of 0.25 s or more, with the first word heard after it) and where they came from (`loudness`, `word-gaps` or `none`); the span of speech; summaries of loudness (average, coefficient of variation, thirds, whether the browser levelled it) and pitch (usual pitch, range and spread in semitones, phrase endings); fading phrase ends; the first 30 seconds against the rest; up to 300 content words with their counts; and a conversation's measures. The loudness and pitch readings are not copied: they stay on the session |
| server | Deeper analysis (decision 91), when it ran: `{ transcript, voice }`, either may be null. `transcript` is `{ engine, text, words, at }` with every word as `{ text, w, s, e, conf }` (its written form with punctuation, the cleaned word, start and end in seconds, confidence 0 to 1); `voice` is the worker's numbers (jitter, shimmer, HNR, alpha ratio, Hammarberg, creak, syllables and rates, a pitch summary, the optional audEERING scores or null) with its engine and Praat version. Kept so its measures can be worked out again. Missing until deeper analysis runs |
| superseded | Phone values that a server value replaced, by measure id, in the same shape as `metrics`, so no phone value is ever lost (decision 91). Missing when none were replaced |
| deep | Where the take's deeper analysis stands (decision 91): `{ status, note, at }`, the status `running`, `done`, `partial`, `failed` or `skipped`, and the quiet note shown on the take's page. Missing when it was never sent |
| rubric | The coach's internal rubric, once it arrived: scores of 0 to 3, each with a quote, for point first, answers the question (or null), structure, ending, concrete example and word choice; the devices used; unneeded hedges; up to three word swaps `{ said, stronger, why }`; the model and when. Never shown as scores; the first word swap shows on the results page |

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
| audioRetention | Number of recent sessions whose audio is kept (default 30). Beyond those, audio is also kept for the very first recording (the baseline) and for the first take of up to 20 prompts recorded again on a later day, the 20 practised most recently, so "then and now" has a pair (a prompt's takes are matched as in `earlierTake`: same prompt, section and question). Everything else loses its audio when the next recording is saved; transcripts, numbers and notes are always kept (decision 88; `src/core/audioRetention.ts`). Recordings are made at 32 kilobits a second, about 240 KB a minute |
| shareNotes | Whether the coach may read the user's notes after listening back (decision 31). Off unless chosen; missing on older settings |
| learn | Learn progress by card id (decision 45): when the card was first read (`readAt`). The recall fields (`box`, `dueAt`, `lastResult`, `recalledAt`) stay on older progress but are no longer used: cards have no quiz and no review since decision 67 |
| missions | Every mission try, oldest first (decision 52): the mission id, the day, the status (accepted, skipped or done), the prediction (1 to 5), whether it was tried, how it went (1 to 5), what the user noticed (text only, never sent anywhere), whether it felt like too much, and when it was debriefed. Missing until the first mission is answered |
| scenarios | Scenario questions by id (decision 54): the tier of the first reply chosen and of the latest, and when each was answered. Missing until the first scenario is answered |
| skipped | Steps of today's practice put off with "Can't speak now?" (decision 77): the day (YYYY-MM-DD) and each step's key (`kind:mode:promptId`). A list from another day counts for nothing. Missing until the first skip |
| hideStreak | Whether Today hides the practice days (the line, the squares and the week sentence; decision 78). Missing means shown |
| anchor | When the user practises, in their words, up to 60 characters, such as "after my morning coffee" (decision 78). Shown on Today and written into the calendar reminder. Missing until chosen |
| reminderTime | The daily reminder's time, "HH:MM", last used for the calendar file (decision 78). The reminder itself lives in the user's calendar, not in the app. Missing until chosen |
| showPauseWords | Whether pause-word counts, marks and headlines show (decision 79). Missing means shown |
| stammer | "I stammer" (decision 79): hides pause words, repeats and fluency judgements, and is sent to the coach as `stammer: true` so it leaves fluency alone. Missing means off |
| warmupDays | The days (YYYY-MM-DD) a one-minute warm-up was finished, the latest 60 (decision 80). Warm-ups record nothing, so this is how today's practice knows the warm-up step is done and how the voice modes take turns. Missing until the first warm-up |
| deepAnalysis | "Send my recordings for deeper analysis" (decision 91): each saved take's audio is sent once to the server for a verbatim transcript and voice measures. Missing means off |
| wordsToWatch | Words the clear-sounds drills could not catch, with a count each (decision 80): a miss adds one, a catch takes one away, and a word goes at nothing; the 30 most-missed are kept. The warm-up's line to say adds the top three. Missing until the first clear-sounds drill |

### Prompts

Prompts ship inside the app as fixed content. They are not user data.

The recordings of the fixed lines (small talk and shadowing, decision 82; the four conversation characters' lines, decision 83) ship as files in `public/clips/`. Once played, each is kept in the browser's cache store `voicelab-voice-v1` under its address, so it plays offline. That store also keeps any line fetched from `/api/voice`. It is not user data, is not exported, and the service worker leaves it alone when it updates (each release's worker deletes only older `voicelab-app-<build>` caches and the old `voicelab-v<n>` ones; decision 88).

## Derived, not stored

- **Practice days and the run:** calculated from session and mission dates (decision 78: days in the last seven, and a run that two rest days a week never break), so they can never get out of sync.
- **Trend lines and before/after numbers:** calculated from sessions on demand.
- **The speaking profile** (decision 90): usual and recent levels, trends, change flags, patterns and word habits are worked out from the analyses each time the profile opens (`src/core/analysis/profile.ts`).

## Retention rules

| Data | Kept |
|------|------|
| Audio | Last 30 sessions, then deleted automatically. **Always kept:** the baseline (first) recording, and the first recording of each prompt or passage, so "then and now" can play it beside later takes |
| Transcripts, metrics, feedback | Until the user deletes them |
| Analyses (each take's measures, raw features and rubric) and weekly summaries | Until the user deletes them; an analysis outlives its take's audio, so measures can be worked out again (decision 90) |

## Export file

- A JSON file with every session, challenge, saved talk, analysis, weekly summary, and the settings (analyses and summaries since decision 90; older files without them still import). **Audio is not included** (keeps the file small); sessions in the file have no audio link.
- Importing adds to what is on the device without losing anything there (decision 86). A session, challenge or talk already on the device is kept and only gains what it lacks from the file (coach feedback with its status, your notes, any empty field); its recording link is never touched, and a challenge marked done stays done. An analysis already here is kept and only gains a rubric or a deeper analysis it lacks; a summary is added when its id is new. Settings take the file's choices but keep any the file does not have; Learn cards, scenario answers, missions, words to watch and warm-up days are joined, keeping the further-on entry for each (the more recently used card or answer, the mission try that got further, the higher count). The message says how many sessions were new.
- A file that is not a VoiceLab export, is from a newer version, or has a damaged record is refused before anything is saved, with a plain message.

## What leaves the device

Every request stays within limits the server checks, kept in one place (`src/core/requestLimits.ts`, decision 86): a length up to the longest any session records (1,800 seconds), a transcript up to 40,000 characters, notes up to 500 characters each (the notes box takes no more), and up to 60 conversation turns of up to 1,000 characters each, with no more than 45,000 characters of text in one feedback request in all (decision 87; the app shortens the transcript to fit). The app cuts what it sends to fit (at a whole word); what is saved on the device keeps every word and the real length.

| Data | Sent to | When |
|------|---------|------|
| Transcript text | AI coach (via our server route) | After each session. The reply now also carries an internal rubric (scores with quotes from your own words, and word swaps), kept on the device (decision 90) |
| The words of a conversation so far (yours and the persona's), with the persona, situation and twist (decision 84) | Claude Haiku (via our server route `/api/conversation`), to write the persona's next line; that line's words then go to ElevenLabs to be spoken in the persona's voice | After each of your turns, when the passphrase is set. Without it, the recorded script is used and nothing is sent. What goes to ElevenLabs is the line Claude wrote, which may repeat or reword something you said (a persona answering you often does). No audio of you leaves the device |
| A whole conversation: every turn's words and its situation (decisions 83 and 84) | AI coach (via our server route) | After the conversation, instead of a single transcript. No voice numbers are sent for a conversation |
| Voice numbers (pitch range, how phrases ended, phrases that faded, the last third's volume; decision 81) | AI coach (via our server route) | With the transcript, when pitch or loudness was recorded. The pitch and loudness readings themselves never leave the device |
| The session's details: its length, its kind, the prompt or passage id, and the id of this week's focus | AI coach (via our server route) | With every transcript |
| That you stammer (decision 79) | AI coach (via our server route) | With every transcript, only when you turned it on in Settings, so the coach leaves fluency alone |
| A compact table of your measures (per family of practice: usual and recent levels, trends and changes of the shown measures and any flagged internal ones), the patterns found, up to five short quotes of at most 200 characters (the coach's own rubric quotes from this week, otherwise the first 20 words of this week's takes), up to three word swaps, words you used far more than usual, and last week's focus (decision 90). Never whole transcripts, audio, pitch or loudness readings; at most 12,000 characters of text | AI coach (Claude Opus, via our server route `/api/summary`) | Once a week at most, when the speaking profile opens, the passphrase is set, and you made at least three takes that week |
| Your own notes after listening back (what worked, what you would change, and your tags) | AI coach (via our server route) | Only when "Let the coach read my notes" is on in Settings, and only notes you wrote |
| The question you answered in a Q&A session (written by the coach or typed by you) | AI coach (via our server route) | With that answer's transcript |
| The plan of a short speech: its topic, points and length (decision 73) | AI coach (via our server route) | With that speech's transcript |
| The change the coach gave last time | AI coach (via our server route) | With a retry's transcript, so the coach can say whether it showed up |
| Audio | The browser maker's speech service | During live transcription in most browsers; the user is told |
| Audio | Whisper (via our server route) | Only if browser transcription is unavailable, and the user is told |
| Each saved take's recording, as recorded (WebM/Opus or MP4/AAC, at most 4,000,000 bytes, about 16 minutes), with its length in seconds (decision 91) | Our server route `/api/analyse`, which passes it at once to **AssemblyAI** (transcription, US servers by default) and to **our own voice worker** (on Modal or Cloud Run). The route stores nothing; the worker keeps nothing (the audio stays in memory for the request); the app deletes the transcript at AssemblyAI as soon as it has read it (set the shortest data retention and the training opt-out in the AssemblyAI dashboard too). What comes back to the phone: the transcript's words with times and confidence, and voice numbers | Only when "Send my recordings for deeper analysis" is on in Settings (off by default), once per take, right after it is saved; never for conversations (no audio is kept) or voice drills. Offline takes are skipped, not queued. Nothing else about you is sent with it: no transcript from the phone, no notes, no settings |
