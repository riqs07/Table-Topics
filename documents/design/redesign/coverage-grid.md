# Coverage grid: the UI rewrite, second pass, by screen and state

**Made:** 2026-11-05, for the handoff's process (section 5) and playbook rule T16. Every route in `ROUTES` (`tests/e2e/support/fixtures.ts`), grouped by the screen that draws it, with every state of each: as you land, before start, countdown, live, saving, the result (good and rough), a second try, empty for a new user, failed to load, not found.

**Columns:** *Reference* is the artboard (`desk-…`, Desktop Screens) or storyboard phone (`story-NN`) it follows, or `extrapolate from …` (rule 1: no picture of this state, so it is built from the nearest one). *Before* is how it looked at the start of this pass, *After* after the build. The marks: MATCHES, NEW-BUT-OFF (new parts, old layout or off from the reference), OLD (the old app), NOT-BUILT (the feature does not exist). *Shots* names the screenshots (1440 × 1000 and 390 × 844, taken by loading the route directly and walking it with a stand-in microphone in desktop Chromium); they were kept outside the repository.

**Review:** see the section at the end. Cells a builder marked MATCHES are only accepted once the reviewer, who wrote none of the code, agrees.

## Group A: Recording and the result after a take

Shots: `scratchpad/after/A/<name>.{d,m}.png` (1440×1000 and 390×844), taken by `flowsA.mjs` (stand-in microphone and speech, page clock run forward). "Before" = `shots/<route>.{d,m}.png` for the landing state; mid-take states were read from the code and the landing shots (the same StartBlob / StatusBlob / margin layout).

| Screen (component) | Route | State | Reference | Before | After | Shots |
|---|---|---|---|---|---|---|
| RecordingScreen | /session?mode=talk&prompt=t001 | as you land (before start) | extrapolate from desk-Recording + story-06 | OLD (Aim-for margin note, lilac banner, giant blob button) | MATCHES | talk-1land |
| RecordingScreen | talk | topic draw (motion on) | story-06 | NEW-BUT-OFF (left-aligned quote headline over old margin) | MATCHES | talk-draw |
| RecordingScreen | talk | 10-second think | story-06 | NEW-BUT-OFF (ring, but old margin layout, no ✕) | MATCHES (✕ = leave) | talk-2countdown |
| RecordingScreen | talk | recording | desk-Recording | NEW-BUT-OFF (✕ hidden; phone row scrolled sideways) | MATCHES (✕ discards with undo; row wraps) | talk-3recording, discard-1recording-x |
| RecordingScreen | talk | saving | extrapolate from desk-Recording | OLD (StatusBlob "Saving…") | MATCHES | talk-4saving |
| RecordingScreen | free | discarded (undo) | extrapolate from desk-Recording | OLD (plain grey box + blob button) | MATCHES | discard-2discarded |
| RecordingScreen | free | save failed | extrapolate from desk-Recording | OLD (flat tint + blob button) | MATCHES | savefail |
| RecordingScreen | response / read | microphone blocked | extrapolate from desk-Recording / desk-ReadAloud | OLD (plain text + list + blob) | MATCHES | blocked, blocked-read |
| RecordingScreen | lesson | too short / nothing heard | extrapolate from desk-ReadAloud | OLD | MATCHES | tooshort-lesson |
| RecordingScreen | talk (first ever take) | microphone primer | extrapolate from desk-Recording | OLD (masthead page + sticky band) | MATCHES | primer |
| RecordingScreen | talk&plan=1 | inside today's practice (skip, step) | desk-Recording | OLD | MATCHES | plan-talk |
| RecordingScreen | /session?mode=response&prompt=p001 | before start | extrapolate from desk-Recording | OLD | MATCHES | response-1land, good-1land |
| RecordingScreen | response | two-minute prepare (Ready) | extrapolate from story-06 | OLD (big clock in margin, hints below) | MATCHES | response-2think, good-2think |
| RecordingScreen | response | recording | desk-Recording | MATCHES | MATCHES | response-3recording |
| RecordingScreen | /session?mode=response&prompt=p008&loop=missing&round=2 | 4/3/2 round 2 before start | extrapolate from desk-Recording | OLD | MATCHES | loop-missing-r2 |
| RecordingScreen | /session?mode=story&prompt=sp01&shape=but-therefore… | before start | desk-StoryTell (its set-up) | OLD (margin note, plan card under the quote headline, blob button) | MATCHES | story-1land |
| RecordingScreen | story | planning minute (Ready) | extrapolate from story-06 + desk-StoryTell | OLD | MATCHES | story-2think |
| RecordingScreen | story | telling | desk-StoryTell | MATCHES | MATCHES | story-3recording |
| RecordingScreen | story gs13 (guided) | before / planning / telling | desk-StoryTell | OLD / OLD / MATCHES | MATCHES | guided-* |
| RecordingScreen | story &loop=new&round=1 → round 2 | round 1, round 2 before start | desk-StoryTell | OLD | MATCHES | loop-1land … loop-5result (round 2's opening) |
| RecordingScreen | story &course=sl-but-1&try=1 | course try before start | desk-StoryTell | OLD | MATCHES | course-story-1land |
| RecordingScreen | talk &course=sf-point-1&try=1 | course try before / think / recording | desk-Recording + story-06 | OLD | MATCHES | course-talk-* |
| RecordingScreen | /session?mode=read&prompt=r001 (+ jfk-inaugural-2) | before start | desk-ReadAloud | OLD (lilac/leaf banner, compact blob button, Aim-for margin note) | MATCHES | read-1land, readjfk-1land |
| RecordingScreen | read | reading | desk-ReadAloud | MATCHES | MATCHES | read-3recording |
| RecordingScreen | read | saving | extrapolate from desk-ReadAloud | OLD | MATCHES | read-4saving |
| RecordingScreen | /session?mode=pause&prompt=d001 | before / reading | desk-ReadAloud | OLD / MATCHES | MATCHES | pause-* |
| RecordingScreen | /session?mode=lesson&prompt=l001 | before / reading | desk-ReadAloud | OLD (border-left tip, blob button) / MATCHES | MATCHES | lesson-* |
| RecordingScreen | /session?mode=rehearse&prompt=missing | talk not on this device | extrapolate from desk-ReadAloud | OLD | MATCHES (bar, sr-only h1, no text; the talk page owns the explanation) | rehearse-missing |
| RecordingScreen | /session?mode=smalltalk&prompt=st01 / se01 / sr01 / sd01 / sn01 / srl5 / stl3 | before start (question, recipe, lesson) | extrapolate from desk-Recording | OLD (margin note, quote headline, flat recipe strip, blob button) | MATCHES | smalltalk-*-1land, se01, sr01 |
| RecordingScreen | smalltalk | question being said / answering | desk-Recording | OLD / NEW-BUT-OFF (recipe gone while speaking) | MATCHES | smalltalk-st01-3recording |
| RecordingScreen | /session?mode=moment&prompt=moment | before / recording | extrapolate from desk-Recording | OLD / MATCHES | MATCHES | moment-* |
| RecordingScreen | /session?mode=outline&prompt=ci-pitch&checkin=…&part=pitch | check-in outline before / recording | extrapolate from desk-Recording | OLD (points as flat tiles under the topic) | MATCHES | outline-* |
| RecordingScreen | free | before start | extrapolate from desk-Recording | OLD | MATCHES | free |
| SessionScreen (FeedbackView) | /sessions?id=<take> | result, rough take | desk-Result | MATCHES | MATCHES (verdict panel checked frame by frame: opacity 0→1 in ~500 ms, then 1; the faded still was the slide-in mid-move) | talk-5result, talk-5result-midslide, fade-* |
| SessionScreen (FeedbackView) | /sessions?id=<take> | result, good take | desk-Result | MATCHES | MATCHES | good-5result |
| SessionScreen (FeedbackView) | read / pause / lesson / smalltalk / response results | result | desk-Result | MATCHES | MATCHES | read-5result, pause-5result, lesson-5result, smalltalk-st01-5result, response-5result |
| SessionScreen (RetryView) | /sessions?id=<second try> | second-try result | desk-Result | OLD (masthead page, plain headline, small table, sticky band "Done") | MATCHES | talk-7retry-result(-full) |
| RecordingScreen | /session?…&retryOf=<id> | second try before start | desk-Recording | OLD (warm "Before you start" box under old layout) | MATCHES ("Before you start" goal card) | talk-6retry-land |
| SessionScreen | /sessions?id=missing | not found | extrapolate from desk-Result (verdict card) + Rail | OLD (one line of text) | MATCHES | sessions-missing |
| SessionScreen | /sessions?id=… (storage error) | could not be loaded | extrapolate from desk-Result | OLD | MATCHES (same card, role=alert; component test) | — (component test) |
| SessionScreen | voice / conversation takes | result | other groups (VoiceSessionView, ConversationSessionView) | — | not in group A | — |

## Group B: Conversations, Scenes, Active listening, a saved talk

Shots: `scratchpad/after/B/<name>.d.png` (1440 × 1000, full page) and `.m.png` (390 × 844, full page). Before: `scratchpad/shots/<route>.d.png` / `.m.png`. Every after shot: no sideways scroll at 390, no console errors (logged by `scratchpad/B/shoot.mjs`). Live states walked with the fake microphone and a stand-in speech recogniser (as `tests/e2e/support/fixtures.ts` `useStandIns`), no coach passphrase, so Maya speaks her recorded lines.

| Screen (component) | Route | State | Reference | Before | After | Shots |
|---|---|---|---|---|---|---|
| ConversationScreen | /conversations/talk?id=maya | Before the call (as you land) | desk-TalkCall (before the first turn) | OLD (plain set-up page, small Maya card, Start) | MATCHES (Maya in the call, situation in her bubble, dark "You" stage with round Start where Done goes, goal + how hard + voices on the right) | conversations_talk_id_maya |
| ConversationScreen | /conversations/talk?id=maya | Before the call, coach set up (difficulty picker, Another situation) | desk-TalkCall | OLD | MATCHES (picker in a side card, Another situation under Start; read from code + component tests, needs a passphrase) | (code) |
| ConversationScreen | /conversations/talk?id=maya | Before the call, AI unavailable (coach unreachable / minutes used up: recorded lines) | extrapolate from desk-TalkCall | OLD | MATCHES (status line under the bubble; code read, needs a failing coach route) | (code) |
| ConversationScreen | /conversations/talk?id=maya | Before the call, browser can't transcribe | extrapolate from desk-TalkCall | OLD | MATCHES (stage says "Not in this browser" with the alert, no Start; code read) | (code) |
| ConversationScreen | after Start | Connecting / friend speaking / about to speak | desk-TalkCall | MATCHES | MATCHES (unchanged) | talk_them |
| ConversationScreen | after Start | Your turn (recording, level bars, turn cue) | desk-TalkCall | MATCHES | MATCHES (Done shares the new round-button constant) | talk_you |
| ConversationScreen | after Done | Second turn | desk-TalkCall | MATCHES | MATCHES | talk_second |
| ConversationScreen | End conversation | Saving | desk-TalkCall | MATCHES | MATCHES | talk_saving |
| ConversationScreen | live / call | Live note, call note, microphone blocked, "I wasn't finished", phone call phase | desk-TalkCall | MATCHES | MATCHES (unchanged TalkCall skeleton; needs AssemblyAI / ElevenLabs, read from code and the e2e stubs) | (code) |
| ConversationScreen | End before speaking | Ended, nothing heard / connection lost | extrapolate from desk-Result verdict card | OLD (bare heading, floating friend) | MATCHES (StopCard: friend on a tint, label, heading, Start again + Back) | talk_empty |
| ConversationScreen | saving failed | Could not be saved | extrapolate from desk-Result | OLD | MATCHES (StopCard, alert, Try saving again; code read, needs a failing store) | (code) |
| ConversationScreen | /conversations/talk?id=missing | Not found | extrapolate from desk-Result | OLD (plain text) | MATCHES (StopCard + chunky "See everyone to talk with") | conversations_talk_id_missing |
| ConversationSessionView | /sessions?id=… after a conversation | How it went | desk-TalkResult | MATCHES | MATCHES (unchanged) | talk_result |
| ConversationsScreen | /conversations | Hub (new user and returning) | extrapolate from desk-Practice, story-12 | NEW-BUT-OFF (flat tinted ScenePanel banner, select list) | MATCHES ("‹ Practice", title with you + friend, Quick play as the sky band with a white button, situations as tile cards grouped by skill) | conversations |
| ConversationsScreen | /conversations | Loading | extrapolate from desk-Practice | OLD ("Getting ready…" in a card) | MATCHES (band says Getting ready…, no button) | (code) |
| TalkScreen | /talk?id=… (dated, 3 days out) | Today's step + coming days | extrapolate from desk-CoursePath, desk-Main | OLD (plain text page, thin rows) | MATCHES (talk card with tile + date field, Today card with pills, parts as numbered rows, coming days card) | talk_dated |
| TalkScreen | /talk?id=… with whole runs | Run-throughs | Chart Kit (ChartCard frame) | OLD (bare table) | MATCHES (ChartCard, headline from the last run, latest bar chart-well, earlier chart-ghost, dashed goal) | talk_runs |
| TalkScreen | /talk?id=… no date / date passed | No plan | extrapolate from desk-Main (Sage's bubble) | OLD | MATCHES (Sage with the note in a bubble) | talk_undated |
| TalkScreen | /talk?id=missing | Not on this device | extrapolate from desk-Result | OLD | MATCHES (StopCard) | talk_id_missing |
| TalkScreen | /talk?id=… storage fails | Could not be loaded | extrapolate from desk-Result | OLD | MATCHES (StopCard with the alert; component test) | (code) |
| ScenesScreen | /scenes | Hub (+ progress unreadable alert) | extrapolate from desk-Practice | NEW-BUT-OFF (tinted banner, plain link list) | MATCHES (sky band "Next up", tile cards with the skill's tile and the face from the best mood) | scenes |
| ScenePlayScreen | /scenes/play?id=sn-lisbon | Before start | extrapolate from desk-SceneReply | NEW-BUT-OFF (left-over set-up text + small Start) | MATCHES (three steps where the replies go, Start in the card the spoken turn uses, scenes tile carried over) | scenes_play_id_sn_lisbon |
| ScenePlayScreen | after Start | Choosing (choice 1 / 2) | desk-SceneReply | MATCHES | MATCHES | scene_choose |
| ScenePlayScreen | a reply chosen | Reveal (tier, why) | desk-SceneReply | MATCHES | MATCHES | scene_picked |
| ScenePlayScreen | after two choices | Your turn out loud | desk-SceneReply | NEW-BUT-OFF (small outline Answer button) | MATCHES (round green microphone) | scene_speak, scene_recording |
| ScenePlayScreen | after the reply | Result (warm / not) | extrapolate from desk-Result + desk-TalkResult | NEW-BUT-OFF (bare headline) | MATCHES (headline on the verdict colour; checks card; move/example) | scene_result |
| ScenePlayScreen | /scenes/play?id=missing | Not found | extrapolate from desk-Result | OLD | MATCHES (StopCard) | scenes_play_id_missing |
| ListeningScreen | /listening | Hub by level | extrapolate from desk-Practice | NEW-BUT-OFF (tinted banner, plain lists) | MATCHES (sky band "Next up", tile cards by level, ear on the level's ground) | listening |
| ListenPlayScreen | /listening/play?id=ls-five-k | Before start | desk-Listening | NEW-BUT-OFF (no answer button place) | MATCHES (the round mic's place, grey until the story ends; listening tile beside Listen) | listening_play_id_ls_five_k |
| ListenPlayScreen | after Listen | Playing | desk-Listening | MATCHES | MATCHES (playback position not reported by the app, so "Playing" instead of 0:11 / 0:17) | listen_playing |
| ListenPlayScreen | story ended | Answering | desk-Listening | NEW-BUT-OFF (small outline Answer) | MATCHES (round green mic, Hear it once more, Show the words) | listen_answer |
| ListenPlayScreen | after the answer | Result | extrapolate from desk-Result | NEW-BUT-OFF (bare headline) | MATCHES (headline on the verdict colour) | listen_result |
| ListenPlayScreen | /listening/play?id=missing | Not found | extrapolate from desk-Result | OLD | MATCHES (StopCard) | listening_play_id_missing |
| QuickRecorder (shared: Mission, Card, Quick scenarios) | /learn/scenarios ("Say it") | Ready / recording / done | extrapolate from desk-Recording | OLD (small outline button) | MATCHES (chunky green with a mic; recording: blob singing in rings + dark chunky Stop; done: white Try again). Mission uses the same props; its page could not be reached without a pending mission record, checked by missions.test | sayit_ready, sayit_recording, sayit_done |

Left out: none. Every state above is a feature the app has. The boss call and "take a breath" are not in this group.

## Group C: Stories, Read aloud, 4/3/2, your talks, the mission, a job's ways

Before shots: `scratchpad/before/C/<state>.{d,m}.png` (and the lead's `shots/`). After shots: `scratchpad/after/C/<state>.{d,m}.png`, 1440×1000 and 390×844, all states loaded directly and clicked through with `scratchpad/shootC.mjs` (seeds story, moment and reading sessions into IndexedDB; missions accepted through Learn as a user would). Every after shot: no sideways scroll at 390, clean console.

| Screen (component) | Route | State | Reference | Before | After | Shots |
|---|---|---|---|---|---|---|
| StoriesScreen | /stories | as you land, new user (no stories, no moments) | extrapolate from desk-Practice, desk-Courses ("Keep going"), story-13 | OLD (plain text page, outline Tell it, link lists) | MATCHES | stories-new |
| StoriesScreen | /stories | stories told + moments | extrapolate from desk-Practice, desk-Courses | OLD | MATCHES | stories-told |
| StoriesScreen | /stories | a fold opened (guided level) | extrapolate from desk-Practice | NEW-BUT-OFF (folds with no tiles) | MATCHES | stories-fold |
| StoriesScreen | /stories | stories failed to load | extrapolate from story-23 (Sage + bubble) | OLD (plain alert line) | MATCHES (Sage bubble + Try again; covered by component test, not shot) | — |
| TellStoryScreen | /stories/tell?prompt=sp01 | set-up, picking | desk-StoryTell, story-13 | NEW-BUT-OFF (no "One thing to try") | MATCHES | tell-sp01 |
| TellStoryScreen | /stories/tell?prompt=sp01 | all templates shown | story-13 | NEW-BUT-OFF | MATCHES | tell-sp01-all |
| TellStoryScreen | /stories/tell?prompt=sp01 | a focus picked | story-13 | NOT-BUILT (picker missing, data existed) | MATCHES (built) | tell-sp01-focus |
| TellStoryScreen | /stories/tell?prompt=gs13, gs31, gs43 | guided story set-up (facts, nudges) | story-14 | MATCHES | MATCHES (+ focus pills, guided focus pre-picked) | tell-gs13, tell-gs31, tell-gs43 |
| TellStoryScreen | /stories/tell?prompt=sp53 | story you'll need (toast) | desk-StoryTell | MATCHES | MATCHES | tell-sp53 |
| TellStoryScreen | /stories/tell?prompt=sp04&shape=then-now&focus=middle | Learn card's focus carried in | story-13 | NEW-BUT-OFF (focus invisible) | MATCHES (its pill is picked) | tell-sp04-focus |
| TellStoryScreen | /stories/tell?prompt=sp01&plan=2 | inside today's plan | desk-StoryTell | MATCHES | MATCHES | tell-plan |
| TellStoryScreen | /stories/tell?moment=m1 | from a moment | desk-StoryTell | MATCHES | MATCHES | tell-moment |
| TellStoryScreen | /stories/tell?moment=missing | not found | extrapolate from story-23 | OLD (one plain line) | MATCHES | tell-missing |
| (RecordingScreen, group A) | /session?mode=story…&loop=… | planning, telling, 4/3/2 between rounds | desk-StoryTell, story-06 | OLD ("Aim for 3:00 this round" in the margin, blob button) | MATCHES (built in group A's pass of RecordingScreen) | 432-round2 |
| SpeechScreen | /speech?id=jfk-inaugural | new (nothing read) | extrapolate from desk-CoursePath, desk-ReadAloud | OLD (plain list, sr-only h1) | MATCHES | speech-new |
| SpeechScreen | /speech?id=jfk-inaugural | some parts read | extrapolate from desk-CoursePath | OLD | MATCHES (chunky bar in parts, Up next) | speech-progress |
| SpeechScreen | /speech?id=jfk-inaugural | all read | extrapolate from desk-CoursePath | OLD | MATCHES ("Read it again") | speech-allread |
| SpeechScreen | /speech?id=missing | not found | extrapolate from story-23 | OLD | MATCHES | speech-missing |
| FourThreeTwoScreen | /practice/four-three-two | new user | extrapolate from desk-Practice | OLD (link list) | MATCHES | 432-new |
| FourThreeTwoScreen | /practice/four-three-two | with your stories | extrapolate from desk-Practice | OLD | MATCHES | 432-stories |
| RehearseScreen | /rehearse | new user (none saved) | extrapolate from desk-Practice, story-23 | OLD (plain text, bare form) | MATCHES (Sage points at the first step) | rehearse-new |
| RehearseScreen | /rehearse | talks saved | extrapolate from desk-Practice | OLD | MATCHES | rehearse-saved |
| RehearseScreen | /rehearse | delete confirmation | extrapolate | OLD (raw square button) | MATCHES | rehearse-delete |
| SkillsScreen | /skills | as you land | extrapolate from desk-Courses, desk-ReadAloud | NEW-BUT-OFF (plain row for up next, bare folds) | MATCHES | skills-new |
| SkillsScreen | /skills#readings | a group open, progress | extrapolate from desk-Courses | NEW-BUT-OFF | MATCHES | skills-fold |
| SkillsScreen | /skills | every whole speech read | extrapolate from story-23 | NOT shown before (empty card) | MATCHES (Sage line; not shot, needs ~400 seeded parts) | — |
| OutlineScreen | /practice/outline | as you land, empty | extrapolate from desk-StoryTell | NEW-BUT-OFF (one plain column, filled green length buttons) | MATCHES | outline-new |
| OutlineScreen | /practice/outline | filled | extrapolate from desk-StoryTell | NEW-BUT-OFF | MATCHES | outline-filled |
| MissionScreen | /mission?id=missing | not found | extrapolate from story-23 | OLD | MATCHES | mission-missing |
| MissionScreen | /mission?id=<real try> | debrief, before answering | story-23 | OLD (square outline buttons) | MATCHES | mission-debrief |
| MissionScreen | /mission?id=<real try> | tried: scale + note | story-23 | OLD | MATCHES | mission-tried |
| MissionScreen | /mission?id=<real try> | debriefed (how it went) | story-23 | OLD | MATCHES | mission-done |
| PracticeWaysScreen | /practice/ways?job=stories, on-the-spot, conversation, voice, role-play | as you land | desk-Practice, story-12 | NEW-BUT-OFF (flat tinted banner, no ledge) | MATCHES | ways-* |
| PracticeWaysScreen | /practice/ways?job=nothing | not found | extrapolate from story-23 | OLD | MATCHES | ways-missing |
| PracticeScreen | /practice | as you land, new user | desk-Practice, story-12 | MATCHES | MATCHES (unchanged) | practice-new |
| WeeklyChallenge | /practice | challenge ticked | desk-Practice | MATCHES | MATCHES (unchanged) | practice-challenge |

## Group D: Your voice

Shots: before in `scratchpad/before/D/`, after in `scratchpad/after/D/` (`<name>.d.png` 1440x1000, `<name>.m.png` 390x844; `-full` = full page). Route shots as landed are also in `scratchpad/shots/`. Click-through: `scratchpad/statesD.mjs` (stand-in mic whose pitch lifts mid-take, stand-in speech); seeded takes: `scratchpad/seedShootD.ts` (run with `npx tsx` from the worktree, uses `tests/e2e/support/seed.ts` + `pitchSeeds.ts`).

| Screen (component) | Route | State | Reference | Before | After | Shots |
|---|---|---|---|---|---|---|
| VoiceScreen | /voice | as you land (hub) | extrapolate from desk-Practice + `/practice/ways` job page (story-12) | OLD (plain title, plain rows) | MATCHES ("‹ Practice", leaf job header with tile, warm-up WayRow with tile, folds with mode tiles) | hub, hub-full |
| VoiceScreen | /voice#pitch | a mode's fold open | extrapolate from desk-Practice rows | OLD | MATCHES | hub-open |
| VoiceDrillScreen | /voice/drill?id=p04 | before start | extrapolate from desk-PitchDrill + desk-Recording | OLD (giant orange blob button "Record") | MATCHES (blob waiting + chunky RECORD TAKE 1, goal tint, take list) | drill-p04-before |
| VoiceDrillScreen | /voice/drill?id=p04 | recording | desk-Recording | OLD (giant blob with clock inside) | MATCHES (singing blob in rings, clock, level bars, round Stop) | drill-p04-recording |
| VoiceDrillScreen | /voice/drill?id=p04 | take just recorded, rough | desk-PitchDrill | NOT-BUILT state (went straight to next take) | MATCHES (card "Did the key word get the lift?", chart, warm verdict band, NEXT TAKE + Hear it, side list with Hmm/This take/Up next) | drill-p04-after1, drill-p04-after2 |
| VoiceDrillScreen | /voice/drill?id=p04 | take just recorded, good | desk-PitchDrill | NOT-BUILT state | MATCHES (green band, "That one landed.") — reached when the lift lands; same code path, tone from the planned-stress verdict | (covered by after2 layout; good tone shows in the results' take lines) |
| VoiceDrillScreen | /voice/drill?id=p04 | results (stress, guessing game) | desk-Result + desk-PitchDrill | NEW-BUT-OFF (plain right column, band button, flat guess card) | MATCHES (headline, take cards with charts, verdict panel with blob, NEXT DRILL, friend on the guessing card) | drill-p04-results, drill-p04-results-full |
| VoiceDrillScreen | /voice/drill?id=p05 | before start (sentence set, "Another sentence") | extrapolate from desk-PitchDrill | OLD | MATCHES | drill-p05-before |
| VoiceDrillScreen | /voice/drill?id=p06&set=2 | before start | extrapolate from desk-PitchDrill | OLD | MATCHES | drill-p06-before |
| VoiceDrillScreen | /voice/drill?id=p06&set=2 | results (dial back curves) | desk-Result + Chart Kit | NEW-BUT-OFF | MATCHES | drill-p06-results(-full) |
| VoiceDrillScreen | /voice/drill?id=v01 | results (volume bars + thickness) | desk-Result + Chart Kit | NEW-BUT-OFF | MATCHES | drill-v01-results |
| VoiceDrillScreen | /voice/drill?id=c01 | clear sounds, browser cannot hear words | extrapolate from desk-Recording | OLD | MATCHES (warm alert, no start) — with the stand-in speech the start shows | drill-c01-before |
| VoiceDrillScreen | any drill | too short / nothing heard / mic blocked | extrapolate from desk-Result rough (warm amber) | OLD (plain text) | MATCHES (warm-tint notes, puzzled blob, chunky Try again) | component tests |
| VoiceDrillScreen | any drill | starting / measuring | extrapolate from desk-Recording | OLD (faded blob) | MATCHES (blob listening + status words) | — (transient) |
| VoiceDrillScreen | clear drill results | slow round | extrapolate from desk-Result | OLD | MATCHES (card inside the verdict panel; the round itself uses the take stage) | component tests |
| VoiceDrillScreen | any | saving / save failed | extrapolate from desk-Result | OLD | MATCHES (inside the verdict panel) | component tests |
| VoiceDrillScreen | /voice/drill?id=missing | not found | extrapolate from desk-Result card | OLD (plain heading + link) | MATCHES (card, puzzled blob, chunky way back) | drill-missing |
| ShadowScreen | /voice/shadow?id=s01 | before start | extrapolate from desk-PitchDrill / desk-Recording | OLD (plain rows, no ledge) | MATCHES (two columns, numbered rows card, goal tint) | shadow-before |
| ShadowScreen | /voice/shadow?id=s01 | a phrase: listen first | extrapolate from desk-Listening / desk-PitchDrill | OLD | MATCHES (chunky Listen, take stage, side list of phrases) | shadow-step |
| ShadowScreen | /voice/shadow?id=s01 | recording | desk-Recording | OLD (giant blob) | MATCHES | shadow-recording |
| ShadowScreen | /voice/shadow?id=s01 | compare (your curve over the model's) | desk-PitchDrill + Chart Kit | OLD (white box no ledge) | MATCHES | shadow-compare |
| ShadowScreen | /voice/shadow?id=s01 | done | desk-Result | OLD | MATCHES (take cards + verdict panel, NEXT PASSAGE) | shadow-done |
| ShadowScreen | /voice/shadow?id=missing | not found | extrapolate from desk-Result card | OLD | MATCHES | shadow-missing |
| WarmupScreen | /voice/warmup | before start | extrapolate from desk-PitchDrill + Sage bubble (desk-Main) | NEW-BUT-OFF (flat tinted banner, plain rows) | MATCHES (tile carried from Today, numbered rows card, Sage bubble) | warmup-before |
| WarmupScreen | /voice/warmup | a move counting down | story-06 (countdown ring) | OLD (giant orange blob button) | MATCHES (leaf ring running down round the blob, Next move, side list) | warmup-move |
| WarmupScreen | /voice/warmup | done | desk-Result | OLD (plain text + band) | MATCHES (verdict panel, chunky next) | warmup-done |
| PhraseRowsScreen | /sessions/voice?id=seeded-zoo | the phrase rows | Chart Kit + desk-Result layout | NEW-BUT-OFF (one narrow column, key as loose text) | MATCHES (two columns: player + rows card; "How to read it" card) | phrase-rows(-full) |
| PhraseRowsScreen | /sessions/voice?id=seeded-old | older take, no readings | extrapolate from desk-Result card | OLD (plain note) | MATCHES (card with puzzled blob) | phrase-old |
| PhraseRowsScreen | /sessions/voice?id=missing | not found | extrapolate from desk-Result card | OLD | MATCHES | phrase-missing |
| PhraseRowsScreen | any | loading / failed to load | extrapolate | OLD | MATCHES (skeleton; warm alert) | — |
| VoiceSessionView | /sessions?id=<voice take> | a saved drill from History | desk-Result | OLD (plain rows, band at the foot) | MATCHES (take cards + verdict panel, DO IT AGAIN) | voice-session-saved(-full) |
| VoiceSection | /sessions?id=seeded-zoo | "Your voice" card on a take | Chart Kit | MATCHES (label now LAB) | MATCHES | voice-section |

Left out: nothing. Every state above exists in the app and has the new design; the "good" take-verdict and the slow round were checked in component tests and by code path, not by a dedicated screenshot (the stand-in microphone cannot aim its lift at a chosen word).

## Group E: Courses, a lesson's parts, Learn, small talk

Shots: `scratchpad/after/E/<name>.d.png` (1440×1000) and `.m.png` (390×844). Route shots use the route slug; click-through shots come from `clickE.mjs`, seeded shots (takes, progress, answers) from `seedE.mjs`. Before = `scratchpad/shots/<slug>`. No sideways scroll at 390 and no console errors in any shot; axe (WCAG AA + best practices) clean on every route at 390 and 1440 (`axeE.mjs`). Phone first-screen word counts all under 100 (`wordsE.mjs`).

| Screen (component) | Route | State | Reference | Before | After | Shots |
|---|---|---|---|---|---|---|
| CoursesScreen | /courses | new user (no course started: "All courses", no zeros) | desk-Courses, story-19 | MATCHES | MATCHES (untouched) | courses |
| CoursesScreen | /courses | started (Keep going) | desk-Courses | MATCHES | MATCHES (untouched) | seeded_courses_keep_going |
| CoursesScreen / CourseScreen | /courses, /courses/course?… | failed to load (`CourseLoadFailed`) | extrapolate from desk-CoursePath (Sage + card) | OLD (plain text + small button) | MATCHES (white card, Sage thinking, Try again) | component test only (needs storage blocked) |
| CourseScreen | /courses/course?id=missing | not found | extrapolate from desk-CoursePath | OLD (plain text page) | MATCHES (‹ All courses, card with puzzled blob, chunky Back) | courses_course_id_missing |
| CourseScreen | /courses/course?id=stop-freezing | started | desk-CoursePath | MATCHES | MATCHES (untouched) | seeded_course_started |
| CoursePartScreen | /courses/part?id=…(learn) | learn step | story-21 + desk-Recording (focus mode, 2 columns) | OLD | MATCHES (PracticeBar, Sage in filled bubble with the idea, Instead-of / Try as picked reply, part card with tile + steps + Why it works) | courses_part_id_sf_point_1, courses_part_id_rd_msg_1 |
| CoursePartScreen | …&step=see (model answer + clip) | see step | story-21 | OLD | MATCHES (Sage says the idea, your blob gives the model answer in a right-tail bubble, Sage's "Notice", clip in the side column) | courses_part_id_sf_point_1_step_see |
| CoursePartScreen | /courses/part?id=sl-find-1&step=see | see step, clip only | extrapolate from story-21 | OLD | MATCHES (clip in main column at phone width) | courses_part_id_sl_find_1_step_see |
| CoursePartScreen | …&step=try | try 1 | desk-Recording (before start) | OLD | MATCHES (blob waiting in its ring, "Your turn", goal on accent-tint, chunky Start) | courses_part_id_sf_point_1_step_try |
| CoursePartScreen | …&step=try&try=2 | second try | desk-Recording | OLD | MATCHES (first try's value on a card, Try again, Skip) | seeded_try_second |
| CoursePartScreen | …&step=wrap (no take) | empty for a new user | extrapolate from desk-Result | OLD | MATCHES (card with puzzled blob, Try it band, part card) | courses_part_id_sf_point_1_step_wrap |
| CoursePartScreen | …&step=wrap (two tries) | result | desk-Result | OLD | MATCHES (green panel: blob, "Part 1 of 3 done", what changed, Next part; goal, results link, Sage on the comeback) | seeded_wrap_two_tries |
| CoursePartScreen | …&step=wrap | loading / failed | extrapolate | OLD | MATCHES (skeleton / CourseLoadFailed card) | component test |
| CoursePartScreen | /courses/part?id=missing | not found | extrapolate from desk-Result focus mode | OLD | MATCHES (PracticeBar, puzzled blob card, Back to Courses) | courses_part_id_missing |
| CourseRevisitScreen | /courses/revisit?…&take=missing | not found | extrapolate | OLD | MATCHES | courses_revisit_id_sf_beat_1_take_missing |
| CourseRevisitScreen | /courses/revisit?id=sf-beat-1&take=r1 | with a take | desk-Result | OLD | MATCHES (question + both answers card; green panel with what changed, goal, Done) | seeded_revisit_with_take |
| LearnScreen (+ MissionCard) | /learn | as you land (mission offered) | desk-Courses ("Quick reads"), story-23 | OLD (flat tinted banner, warm icon rows) | MATCHES (‹ Courses, mission card with you + friend on pink, Sage's tip, chunky I'll try it; Quick scenarios with tile; sets as rows with coloured icon squares) | learn |
| LearnScreen | /learn | some cards read, mission taken on | desk-Courses | OLD | MATCHES (slim mission card, Next up chip, bars) | seeded_learn_started |
| LearnSetScreen | /learn/set?id=… | as you land / started | extrapolate from desk-CoursePath | OLD | MATCHES (band on set colour, numbered rows like a lesson's parts, Next chip, chunky Next card) | learn_set_id_warmth/stories/words/skills, seeded_learn_set_started |
| LearnSetScreen | /learn/set?id=missing | not found | extrapolate | OLD | MATCHES | learn_set_id_missing |
| CardScreen (+ SwipeDeck) | /learn/card?id=… | question, before guess | story-22 | OLD | MATCHES (PracticeBar with set · Myth or fact?, claim on set colour, big Myth/Fact choices) | card_guess_before, learn_card_id_body_93 |
| CardScreen | /learn/card | guess right / wrong | story-22 | OLD | MATCHES (picked choice green with tick, or warm; answer edged green; verdict on tint) | card_guess_right, card_guess_wrong |
| CardScreen | /learn/card | finding, meaning, do this, practise it | story-22 | OLD | MATCHES (white "What the research found" card, Sage saying the meaning, "Do this" card, Practise it row with the practice's mode tile, full-width chunky Next card) | card_finding, card_meaning, card_do, learn_card_id_voice_fry, learn_card_id_profile_trends, learn_card_id_warm_good_news |
| CardScreen | /learn/card?id=missing | not found | extrapolate | OLD | MATCHES | card_missing |
| ScenariosScreen (+ ScenarioItem) | /learn/scenarios | before choosing | desk-SceneReply | NEW-BUT-OFF (bar only, plain text and rows) | MATCHES (situation on warm tint, blob + question, replies as soft bubbles) | scenarios_before, learn_scenarios |
| ScenariosScreen | /learn/scenarios | answered | desk-SceneReply | OLD | MATCHES (pick lifted and edged green, tier chips, verdict on tint, The move card, Say it card, chunky Next) | scenarios_answered |
| ScenariosScreen | /learn/scenarios | round result | desk-Result | OLD | MATCHES (green panel with blob) | scenarios_result |
| UnitsScreen | /small-talk | as you land | extrapolate from Practice ways list | OLD (icon rows) | MATCHES (title on conversation tint with tile, each unit with its own mode tile) | small_talk, seeded_units |
| SmallTalkScreen (+ FoldCard, PathMark) | /small-talk/unit?id=… | as you land, new user | extrapolate from Practice ways + desk-CoursePath | OLD | MATCHES (unit tile band, drill card with the friend saying it in a bubble, partner card with the friend, beats and lessons as numbered rows, missions with ticks) | small_talk_unit_id_news/room/starting/deeper/answering |
| SmallTalkScreen | /small-talk/unit?id=answering | with answers and a lesson done | same | OLD | MATCHES ("Your answers" card, lesson 1 ticked, 2 next) | seeded_unit_answers |
| GuessGame | (VoiceDrillScreen, not a route of this group) | — | — | — | not changed: used only by the voice drill (another group's screen) | — |

Left out: nothing in this group lacks a feature except the boss (storyboard 20/24's "boss" lesson tiles and brief), which does not exist and was not invented.

## Group F: Today's other states, Me, History, Settings, the check-in, dev pages

Shots: before in `scratchpad/shots/` (as landed) and `scratchpad/beforeF/`; after in `scratchpad/after/F/`, each `.d.png` (1440x1000, full page) and `.m.png` (390x844, full page). Scenarios from `scratchpad/shootF.mjs`: `new` (empty), `data` (11 takes over three weeks, two check-ins), `mid` (data + today's check-in 2 of 4 parts), `done` (data + today's check-in finished), `notday` (check-ins 10 and 3 days ago), `fail` (IndexedDB open throws). No sideways scroll at 390 and no console errors in any scenario.

| Screen (component) | Route | State | Reference | Before | After | Shots |
|---|---|---|---|---|---|---|
| HomeScreen | `/` | brand-new user (plan, focus question at the foot) | extrapolate from desk-Main + story-02 | NEW-BUT-OFF (focus card: plain name buttons; footer plain text) | MATCHES (Sage asks in a bubble, choices with tiles, facts as pills) | new-home |
| HomeScreen | `/` | with data, check-in day (look-back reminder, backup note, footer) | desk-Main | NEW-BUT-OFF (flat unledged backup note, plain-text footer, reminder plain card) | MATCHES (backup note and reminder as tile cards with ledge, pills) | data-home, done-home |
| HomeScreen | `/` | load failure | extrapolate from desk-Main (Sage + bubble) | OLD (plain text, outline button) | MATCHES (Sage thinking with the heading in a bubble, reason card, chunky Try again) | fail-home |
| HomeScreen | `/` | day done | story-11 | MATCHES (built earlier: DoneBurst, ticks, Sage bubble, chunky button); "Keep going" list now has tiles | MATCHES | not shot: needs every step of a real day done in the browser (learn card, scene, warm-up); checked in code and component tests |
| HomeScreen | `/` | nothing left (steps put off) | extrapolate from desk-Main | MATCHES (Sage bubble, faded step cards, action band) | MATCHES | not shot: needs steps skipped from inside each practice; checked in code |
| MeTop / ProfileScreen | `/profile` | new user | story-28 / desk-Me | top MATCHES; speaking-profile part NEW-BUT-OFF (plain "No takes measured" text, link list) | MATCHES (label + heading, check-in card with tile and buttons, blob card) | new-profile |
| MeTop / ProfileScreen | `/profile` | with data | desk-Me | top MATCHES; profile part NEW-BUT-OFF (segmented family control, chips, link list) | MATCHES (pill filters, CHIP days, tile on check-ins, secondary buttons) | data-profile |
| ProfileScreen | `/profile` | failed to load | extrapolate from desk-Me | OLD (plain text) | MATCHES (card) | fail-profile |
| ProfileFromAddress / ProfileScreen | `/profile?session=missing` | take not found | extrapolate from desk-Me | OLD (plain line) | MATCHES (Sage thinking in a card, secondary button) | new-profile_session_missing |
| HistoryScreen | `/history` | empty, new user | story-30 | OLD-ish (sleepy blob floating, plain text) | MATCHES (blob title; card with sleeping blob, label, chunky button) | new-history |
| HistoryScreen | `/history` | with data | story-30 | NEW-BUT-OFF (trend chart not Chart Kit, plain row names) | MATCHES (Chart Kit OverWeeks line with ghost, display-face names, star when kept, "Since day 1" label) | data-history |
| HistoryScreen | `/history` | filtered (Reading aloud) | story-30 | NEW-BUT-OFF | MATCHES | data-history-filtered |
| HistoryScreen | `/history` | failed to load | extrapolate | n/a (the list waits on the store; the masthead and title show) | MATCHES | fail-history |
| SettingsScreen | `/settings` | every section, new user | extrapolate from desk-Me (Settings column) | NEW-BUT-OFF (underline selects and inputs, outline anchor chips, thin bar, plain page title, large body text) | MATCHES (blob title, groups under coloured icon squares, cream fields, pill anchors, chunky export bar, display headings) | new-settings |
| SettingsScreen | `/settings` | with data (Your week card) | desk-Me + Chart Kit | NEW-BUT-OFF | MATCHES | data-settings |
| SettingsScreen | `/settings` | sub-states: delete confirmation, coach set-up open, export running | extrapolate | NEW-BUT-OFF (same controls) | MATCHES by the shared fields/buttons (not each shot) | new-settings |
| CheckInScreen | `/check-in` | first ever | extrapolate from story-27 + desk-Me | OLD (text card + band) | MATCHES (tile title, Sage bubble over the four part tiles, band) | new-check_in |
| CheckInScreen | `/check-in` | due, with history | story-27 | OLD (outline button, plain list) | MATCHES (then-and-now card with two blobs, rows with tiles) | data-check_in |
| CheckInScreen | `/check-in` | done today / not due | story-27 | OLD | MATCHES | done-check_in, notday-check_in |
| CheckInScreen | `/check-in` | failed to load | extrapolate | OLD (plain text) | MATCHES (card) | fail-check_in |
| CheckInRunScreen | `/check-in/run` | first check-in, before any part | story-27 | OLD (masthead, number list, yellow row) | MATCHES (PracticeBar with cross, Sage bubble, part picture cards, Next chip, part card, band) | new-check_in_run |
| CheckInRunScreen | `/check-in/run` | part 3 of 4 (two done) | story-27 | OLD | MATCHES (ticks, bar 2/4) | mid-check_in_run |
| CheckInRunScreen | `/check-in/run` | finished | extrapolate from story-11 | OLD (plain list) | MATCHES (blob with confetti, rows with tiles, compare buttons, band) | done-check_in_run |
| CheckInRunScreen | `/check-in/run` | not a check-in day | extrapolate from story-27 | OLD | MATCHES (Sage bubble with the date, secondary button) | notday-check_in_run |
| CheckInRunScreen | `/check-in/run` | failed to load or save | extrapolate | OLD (plain text, no h1) | MATCHES (Sage, bubble as the h1, reason card, chunky Try again) | fail-check_in_run |
| CheckInCompareScreen | `/check-in/compare` | fewer than two check-ins | extrapolate from story-29 | OLD (plain sentence) | MATCHES (blobs then and now over the title, Sage's card, secondary button) | new-check_in_compare |
| CheckInCompareFromAddress | `/check-in/compare?a=ci-1999-01-01&b=missing` | unknown ids | extrapolate from story-29 | OLD | MATCHES (same as above; with two check-ins it falls back to first and latest) | new-check_in_compare_a_ci_1999_01_01_b_missing |
| CheckInCompareScreen | `/check-in/compare` | two check-ins | story-29 | NEW-BUT-OFF (cards but plain players, bullet list, grey A/B pills) | MATCHES (part tiles in headings, Then on cream and Now on green tint, pill A/B, ruled change rows, Sage's "That's N days of practice") | data-check_in_compare |
| CheckInCompareScreen | `/check-in/compare` | three or more (pair chooser) | story-29 | OLD (underline selects) | MATCHES by code (pills + selects on cards; not shot: data has two) | — |
| CheckInCompareScreen | `/check-in/compare` | failed to load | extrapolate | OLD | MATCHES (card) | fail-check_in_compare |
| DevModesScreen | `/dev/modes` | as landed | extrapolate | NEW-BUT-OFF (plain tags) | MATCHES (LAB, CHIP/CHIP_GOOD tags, setting on a card) | new-dev_modes |
| DevTilesScreen | `/dev/tiles` | as landed | Illustration Study | MATCHES (gallery of the lit tiles) | MATCHES (unchanged) | new-dev_tiles |

Left out: none for a missing feature in this group. Real data only: the compare page's Sage line uses the real gap in days; no numbers were added that the app does not have.

