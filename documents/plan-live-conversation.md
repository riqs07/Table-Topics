# Making "Talk with someone" feel live

**Purpose:** How conversations are made to feel live, step by step, why each choice was made, and what is not done yet.
**Status:** Steps 1 and 2 built, decisions 101 and 102 (2026-10-21). Step 3 approved on 2026-10-22 ("make a plan and let it rip"): 3a built as Live (beta), decision 119; 3b built as Phone call (beta), decision 121.

## What the user asked for

Conversations without tapping Done at the end of every turn, and replies that come sooner. The research (October 2026, "Making Talk with someone live") proposed three steps; the user approved steps 1 and 2 first, then step 3 on 2026-10-22, both live options behind Settings choices with monthly minute budgets.

| Step | What | Cost | Status |
|------|------|------|--------|
| 1 | Turns end by themselves, worked out on the phone; Done stays; "I wasn't finished"; tap to interrupt | Nothing | Built (decision 101) |
| 2 | Faster, cheaper replies: timings first, the persona's line streamed sentence by sentence into streaming speech, a listening sound at once, a faster voice model, minute budgets | Saves money with the faster voice model | Built (decision 102) |
| 3b | Phone call (beta): the ElevenLabs agent runs the whole call (speech-to-text, Claude Haiku 5.5, the voice, turn-taking and interruptions) with per-call instructions for the persona | About $0.08 a minute; 60 minutes a month by default | Built (decision 121) |
| 3a | Live (beta): AssemblyAI streaming speech-to-text decides when your turn ends; our own reply flow (streamed Claude and Turbo) is unchanged; talking over the persona with headphones | About $0.15 an hour of open socket; 150 minutes a month by default | Built (decision 119) |

## Step 1: turns that end by themselves

- **Settings → Talk with someone → Ending your turn:** Automatically (the default) or Tap when done. Saved as `turnEnding` in the settings record.
- **The signals,** all already on the phone: the microphone level (ten readings a second) against a noise floor that adapts to the room, and whether the words the speech service hears have stopped changing. Pure logic in `src/core/endOfTurn.ts`, tested with made-up timelines.
- **The waits:** 1.5 s of quiet with still words; 2.8 s when the words end on a word that carries on ("and", "so", "um", "the") or a comma; 1.2 s after 20 s of speaking; at least 1.2 s of speech first; 60 s at most.
- **iPhone, or no words:** Safari's continuous recognition stops by itself, so on an iPhone (and whenever the words do not arrive, or stop while you are still talking) the turn is judged on the level alone, with 2.4 s of quiet and at least 2 s of speech.
- **"I wasn't finished"** for 3 s after an automatic end: cancels the reply request, goes back to before that turn and listens again, joining your words.
- **Tap to interrupt:** tapping the persona while they talk stops them and starts your turn. No voice barge-in: the microphone stays closed while they talk.
- **Accessibility:** turn changes are announced politely; a key press or a screen reader moving focus holds an automatic end off for 5 s; the countdown is five marks and words, not movement.

## Step 2: faster, cheaper replies

- **Timings first:** the route logs the writer's, the voice's and the whole request's durations (never words) and sends them in a `Server-Timing` header. While developing, the conversation page shows how long the persona's first sound came after your turn.
- **Streaming:** the writer streams plain text (a `goodbye: yes/no` line, then the line). The first complete sentence is checked like a whole line and spoken at once on ElevenLabs' streaming endpoint; the rest follows when the writer finishes. The phone gets newline-separated JSON pieces, each with its audio, and plays them in order on the one shared audio player.
- **Fallbacks:** a piece whose streamed voice fails is spoken once more without streaming, then left to the phone's own voice; a stream that breaks before any piece is asked for again whole (the old path); one that breaks after a piece keeps what arrived.
- **Listening sound at once:** a recorded "Mm-hmm" from the persona plays the moment your turn ends, except before their first line, when asking you to say it again, or after your question.
- **Voice model:** the Turbo model by default (`CONVERSATION_VOICE_MODEL=turbo`), the expressive one with `v4`.
- **Caps:** five minutes (or 40 lines) per conversation, and 150 conversation minutes a month by default (`CONVERSATION_MINUTES_PER_MONTH`), counted on the server; Settings shows the minutes left. With none left, the people use their recorded lines.

## Step 3a: Live (beta), AssemblyAI streaming

- **Settings → Conversation turns → Ending your turn:** Tap when done, Automatically (the default) or **Live (beta)**. With Live, an "I'm using headphones" switch. Live needs the coach (a saved passphrase); without it, or whenever Live cannot connect, turns end automatically and one plain line says why.
- **Starting:** inside the Start tap the player is unlocked, then `POST /api/live` (passphrase, body, set up, rate limit, the month's live minutes, in that order) asks AssemblyAI for a single-use token (`GET /v3/token`, `expires_in_seconds` 60, `max_session_duration_seconds` the minutes reserved, at most 300) and reserves those minutes. The page opens `wss://streaming.assemblyai.com/v3/ws` with the token, 16 kHz 16-bit PCM, `universal-streaming-english`, and patient turn settings (`end_of_turn_confidence_threshold` 0.6, `min_turn_silence` 560 ms, `max_turn_silence` 2,400 ms; `format_turns` off). It waits up to 5 s for `Begin`.
- **One socket per conversation:** the microphone (echo cancellation on) goes through a 16 kHz audio graph in chunks of at least 100 ms. On your turn the microphone is sent; while the persona talks, silence (so a speaker's sound is never your words), or with headphones the microphone, where real words (not "mm-hm") stop the persona and start your turn. Tap to interrupt stays.
- **A turn:** its words come from the socket's `Turn` messages; a `Turn` with `end_of_turn` and words ends it (the same path as an automatic end, so "I wasn't finished" works). Done mid-sentence sends `ForceEndpoint` and waits up to 1.5 s for the last words. Then the usual reply: streamed Claude into Turbo (decision 102).
- **Closing** (billing stops): `Terminate` and close on the conversation's end or save, the page hiding or closing (which also ends and saves the conversation), the page closing mid-conversation, an error, the socket dropping, and the vendor's own cap at the reserved time. `POST /api/live/end` then hands back the reserved minutes not used, once.
- **Falling back:** over budget, not set up, offline, no passphrase, the token route or socket failing: one line ("This month's live minutes are used up, so turns end automatically.") and automatic turns. A drop mid-conversation ends the turn under way with what was heard and says "The live connection dropped, so turns now end automatically."

## Step 3b: Phone call (beta), the ElevenLabs agent

- **Settings → Conversation turns:** a fourth choice, **Phone call (beta)**. Needs the coach; without it, or whenever the call cannot start, one plain line and live turns (step 3a), or automatic turns if live cannot start either.
- **Starting:** `POST /api/live` with `kind: "b"` reserves call minutes (`LIVE_B_MINUTES_PER_MONTH`, default 60) and asks ElevenLabs for a WebRTC conversation token (`GET /v1/convai/conversation/token?agent_id=…`) or, with `LIVE_B_CONNECTION=websocket`, a signed address (`/get-signed-url`). The page loads `@elevenlabs/client` only now and starts the session with the agent's overrides (`src/core/liveCall.ts`): the instructions (the writer's house rules for a speaking agent, without bracketed directions, with the wind-down at 2:30 and goodbye by 3:00, then the persona, situation, twist and difficulty), the situation's first line (`opener`), English, and the persona's call voice (`liveVoiceId`: Maya uses Emma). The SDK has no override for the call's length, so the agent's own 300 s and the page's timer at the granted seconds hold it.
- **A refused voice:** if the call fails to start, or ends with an error before the agent has said anything, it starts once more without the voice override (the agent's own voice), reusing the same reservation; logged in the console.
- **During:** the latest line, yours or theirs, is the heading; the shape says whether they are talking ("talk over them any time") or listening; End call hangs up. Interruptions are the agent's own (WebRTC echo cancellation).
- **The transcript:** `CallTranscript` collects the SDK's events with the time each arrived: the agent's speaking and listening changes, voice-activity scores, your transcripts, its lines, interruptions and corrections, into the saved turn shape with `at`, `end` and `cut`. On hang-up, the agent ending the call, the time running out, or the page hiding or closing, the call is saved as a conversation (`turnMode: "call"`) and the coach reviews it as usual; the timing measures come from those times.

## Timing and difficulty (every mode, decision 120)

- **Turn times:** each turn saves when its speaking began and ended (`at`, `end`) and whether it was cut short (`cut`). Yours: the recording's start plus where the microphone first and last heard speech (or, live, the moment you talked over the persona); theirs: the first sound to the last, or the moment it was stopped.
- **Measures** (`src/core/conversationTiming.ts`, in the registry): the reply gap's median, cut-ins by you and by them, seconds talking at once, and listening sounds. On the results, the conversation timeline (chart 13) places turns at their real times, shades the stretches where both talked, and marks each cut-in; only sure findings show, the rest behind "See more". There is no scrubber on a conversation's page (no audio is kept), so there are no scrubber markers.
- **Difficulty:** Easy, Normal or Hard, picked before starting (with written lines), remembered, sent with each line request and saved. Each level's rule (`DIFFICULTIES` in `src/content/conversations.ts`) is added to the writer's message; Normal adds nothing. On Hard the persona also cuts in on a turn of yours that runs past 25 s, at most twice a conversation (in a phone call the agent's prompt carries the rule instead).

## What to measure (steps 1 to 3a)

- How often "I wasn't finished" is tapped (target: under one turn in ten), split by iPhone and computer.
- How long after the last word a turn ends.
- How often people still tap Done in automatic mode.
- The first-sound time from the server logs and the development readout: p50 and p90 (target p50 under 1.5 s).
- Whether the Turbo voice sounds as good as the expressive one on the persona lines (a blind comparison of about 20 lines).
- Live (beta): how often "I wasn't finished" is tapped after a live end of turn, against automatic; live minutes per conversation against the five reserved; the AssemblyAI bill against Settings' estimate; iPhone against computer.
