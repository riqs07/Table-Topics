# Human Checkpoints

**Purpose:** Every point where I stop and need you: accounts, taste, real-device tests, and approvals. You stay in control of the things that are yours.
**Last updated:** 2026-10-12

## Types

| Icon | Type | Meaning |
|------|------|---------|
| 🔑 | Setup | Only you can do it: accounts, keys, billing |
| 🎨 | Taste | A choice about look, feel, or wording that is yours |
| 🧪 | Device test | Needs a real microphone or phone, which I do not have |
| ✅ | Review | You approve or redirect my output before we build on it |

## How checkpoints work

- **Blocking:** I stop that line of work until you answer. I keep going on anything that does not depend on it.
- **Non-blocking:** I continue with the stated default and flag it clearly so you can change it later.
- At each checkpoint I post: what is done, what I need, the options with my recommendation, and the default.
- Once approved, a decision changes only through a written note in [architecture/decisions.md](architecture/decisions.md).

## The checkpoints

| ID | Milestone | Type | What I need from you | Blocking? | Default if you are away |
|----|-----------|------|----------------------|-----------|-------------------------|
| C1 | M0 | 🔑 | Private GitHub repo, how code should reach you (repo or download), and your phone and browser (iPhone or Android) | Yes | None |
| C2 | M0 | ✅ | Confirm the target user (PRD section 2) and the app name | Target user: yes. Name: no | Name stays "VoiceLab" |
| C3 | M1 | 🧪 | Run the spike page on your phone: speak 60 seconds with deliberate "ums", then tell me what the transcript shows | Yes | None |
| C4 | M1 | 🔑 | Optional OpenAI key to test whether Whisper keeps filler words | No | Test browser transcription only |
| C5 | M1 | ✅ | Choose the transcription approach and how strongly we promise privacy, based on the spike (R1, R2, R3) | Yes | None |
| C6 | M2 | 🎨 | Pick a palette from the style tile, choose fonts, and give an icon direction | Blocks screens only | Neutral gray theme |
| C7 | M3 | ✅ | Approve the list of words that count as fillers | No | Standard list, flagged |
| C8 | M4 | ✅ | Include "Export my data" in v1? (R7) | No | Yes, include it |
| C9 | M6 | 🔑 | Anthropic key, provider spend limit, access passphrase, and the shared store | Blocks live AI only | Fakes keep tests running |
| C10 | M6 | ✅ | Read about 10 coach responses on your own recordings: too harsh, too soft, useful? | Yes | None |
| C11 | M7 | ✅ | Approve grayscale wireframes of home, session, feedback, and history | Yes | None |
| C12 | M7 | 🧪 | Do the whole loop on your phone. Does the retry help or feel like homework? (R9) | Yes | None |
| C13 | M9 | ✅ | Approve the prompt library and weekly challenges (I draft them) | Before shipping | None |
| C14 | M10 | 🧪 | Install the app, go offline, record, reconnect, and confirm feedback arrives | Yes | None |
| C15 | M11 | 🔑 | Vercel account, environment variables, optional domain | Yes | None |
| C16 | M11 | 🧪 | Use it daily for two weeks and note what you skipped or ignored | Final gate | None |

## Where your involvement matters most

1. **C3 and C5:** real-phone tests decide the architecture. Nothing else is as risky.
2. **C6 and C11:** the look and feel is yours.
3. **C10:** coach quality is the product, and only you can judge how it lands.
4. **C13:** the prompts and challenges set the tone for the whole experience.
5. **C1, C9, C15:** accounts and keys. See [setup-requirements.md](setup-requirements.md).

## Answers log

| ID | Date | Answer |
|----|------|--------|
| C1 | 2026-10-12 | Private repo `riqs07/table-topics`; code reaches you through the repo. Test phone: iPhone (browser assumed Safari until confirmed) |
| C2 | 2026-10-12 | Target user confirmed. Name: default "VoiceLab" (flagged; change any time) |
| C7 | 2026-10-12 | (Superseded below.) Fillers counted: um, uh, er, ah, hmm (and stretched spellings like "ummm"), you know, I mean, kind of, sort of, like, basically, actually, literally. "So" is not counted. "Like" is counted even when used as a real verb; approve or change |
| C6 | 2026-10-12 | Calm studio, with the accent changed from sage to forest green (fonts later changed to Newsreader with the script-page direction). **Icon drafted 2026-10-13**: a Newsreader opening quote mark in paper on forest green (alternative: forest on paper with a hairline). Awaiting approval |
| C8 | 2026-10-12 | **Defaulted, flagged.** "Export my data" is in v1 (sessions, challenges, settings; no audio). Baseline audio is never auto-deleted |
| C11 | 2026-10-13 | First grayscale wireframes rejected as template-like. **Script-page direction chosen** (over tape recorder and instrument). Revised phone and desktop wireframes at `/wireframes`. **Approved 2026-10-13** |
| C13 | 2026-10-13 | **Open** (list updated 2026-10-15). Drafts to approve before shipping, all in `src/content/`: 31 Record Response prompts with three angles each (rewritten for public speaking on 2026-10-15: 18 new speaking tasks across explain, persuade, toast, update, story and opinion, 13 kept, 23 small-talk prompts retired), the four-step structure hint, 36 Table Topic questions, 24 read-aloud passages (18 speech excerpts to check against a published source, 6 practice passages; the 12 speeches added 2026-10-16 were written out by the agent because the session's network blocks the speech archives, and their key sentences were checked against web search results only), 5 pause drills, 4 tricky-word lists, the 16 skill-path lessons (tips and practice texts, `src/content/lessons.ts`; lessons 11 to 16 added 2026-10-15), 20 openings and closings drill prompts and their two tips (added 2026-10-15), and 14 weekly challenges (rewritten 2026-10-15 as real speaking moments: speaking first in a meeting, a 30-second update, a toast, visiting a speaking club). The 24 warm-up prompts are retired |
| C5 | 2026-10-13 | **Desktop decided**: browser speech recognition plus on-device audio (decision 17). **Phone still open** until the iPhone test (C3) |
| C7 | 2026-10-13 | **Answered: every filler counts.** Sounds (um, uh, er, ah, hmm, mm, mhm, eh and stretched spellings), crutch words (like, so, well, just, really, basically, actually, literally, totally, honestly, seriously, anyway, whatever, right, okay, yeah, kinda, sorta), and hedges (you know, I mean, you see, I guess, I suppose, kind of, sort of, or something, and stuff, or whatever, to be honest, you know what I mean, at the end of the day, if that makes sense). Known trade-off: crutch words also count in their ordinary sense (\"I really like it\"); trim if numbers look inflated |
