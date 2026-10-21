# Making "Talk with someone" feel live

**Purpose:** How conversations are made to feel live, step by step, why each choice was made, and what is not done yet.
**Status:** Step 1 built, decision 101 (2026-10-21). Step 2 approved. Step 3 not approved.

## What the user asked for

Conversations without tapping Done at the end of every turn, and replies that come sooner. The research (October 2026, "Making Talk with someone live") proposed three steps; the user approved steps 1 and 2 only.

| Step | What | Cost | Status |
|------|------|------|--------|
| 1 | Turns end by themselves, worked out on the phone; Done stays; "I wasn't finished"; tap to interrupt | Nothing | Built (decision 101) |
| 2 | Faster, cheaper replies: timings first, the persona's line streamed sentence by sentence into streaming speech, a listening sound at once, a faster voice model, minute budgets | Saves money with the faster voice model | Approved |
| 3 | Fully live: streaming speech-to-text (AssemblyAI) or ElevenLabs Agents, voice barge-in | $0.30 to $10 a month for one user | **Not approved; not to be built** |

## Step 1: turns that end by themselves

- **Settings → Talk with someone → Ending your turn:** Automatically (the default) or Tap when done. Saved as `turnEnding` in the settings record.
- **The signals,** all already on the phone: the microphone level (ten readings a second) against a noise floor that adapts to the room, and whether the words the speech service hears have stopped changing. Pure logic in `src/core/endOfTurn.ts`, tested with made-up timelines.
- **The waits:** 1.5 s of quiet with still words; 2.8 s when the words end on a word that carries on ("and", "so", "um", "the") or a comma; 1.2 s after 20 s of speaking; at least 1.2 s of speech first; 60 s at most.
- **iPhone, or no words:** Safari's continuous recognition stops by itself, so on an iPhone (and whenever the words do not arrive, or stop while you are still talking) the turn is judged on the level alone, with 2.4 s of quiet and at least 2 s of speech.
- **"I wasn't finished"** for 3 s after an automatic end: cancels the reply request, goes back to before that turn and listens again, joining your words.
- **Tap to interrupt:** tapping the persona while they talk stops them and starts your turn. No voice barge-in: the microphone stays closed while they talk.
- **Accessibility:** turn changes are announced politely; a key press or a screen reader moving focus holds an automatic end off for 5 s; the countdown is five marks and words, not movement.

## What to measure before step 3 (not built yet)

- How often "I wasn't finished" is tapped (target: under one turn in ten), split by iPhone and computer.
- How long after the last word a turn ends.
- How often people still tap Done in automatic mode.
