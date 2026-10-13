# Roadmap

**Purpose:** The order VoiceLab is built in. Every milestone starts with tests, and every milestone lists where you step in.
**Last updated:** 2026-10-13

Checkpoint IDs (C#) are defined in [checkpoints.md](checkpoints.md). The riskiest assumptions are tested first (milestone 1), because their answers can reshape later milestones, especially 5 and 10.

| # | Milestone | First tests written | Done when | Your checkpoints |
|---|-----------|---------------------|-----------|------------------|
| 0 | **Project setup** | A trivial passing test proves the runner works | Repo, strict TypeScript, lint, test runner, and CI all run clean; `.env.example` exists | C1, C2 |
| 1 | **Feasibility spikes** (throwaway) | None; these are experiments. Findings are written into decisions.md | We know if browser transcription works on your phone, if "um" survives transcription, and if recording and recognition can share the microphone | C3, C4, C5 |
| 2 | **Design foundations** | Every theme defines every role; every theme passes contrast; no raw colors in components | Token system, three starter themes, and the style tile page exist, and you picked a direction | C6 |
| 3 | **Core logic** | Filler counting, words per minute, streaks, weekly focus rotation | All pure logic in `core/` is tested and passing | C7 |
| 4 | **Data layer** | Save, load, and prune against an in-memory fake; export file round-trips (if C8 is yes) | Repository works and audio past the last 30 sessions is removed | C8 |
| 5 | **Recording and live transcript** | A fake recorder produces a transcript and duration | Works on your phone using the approach chosen at C5 | None |
| 6 | **Feedback API, access gate, cost guard** | Response must have keep, change, and retry cue; calls without the passphrase are rejected; limits survive across server instances (fake store); a missing variable fails with a clear message | Real coach feedback comes back for a real transcript | C9, C10 |
| 7 | **Session loop screens** | Component tests for prompt, record, feedback, retry; built in the gray theme first | One full loop works end to end in your chosen theme | C11, C12 |
| 8 | **Baseline, history, trend** | First session is marked baseline; before and after numbers are correct | You can see progress against your first recording | None |
| 9 | **Weekly focus and challenge** | Focus advances weekly; a challenge can be completed once | Both appear on the home screen | C13 |
| 10 | **Offline, PWA, fallback** | Offline sessions are queued and sent later; the fallback triggers when browser transcription is missing | Installable on your phone and usable without a connection | C14 |
| 11 | **Deploy and daily use** | End-to-end test of the full loop at phone size | Deployed, installed, and used daily for two weeks | C15, C16 |

## While waiting on you

Work continues on anything that does not depend on the open checkpoint. For example, core logic (M3) can proceed while the palette (C6) is undecided. Non-blocking checkpoints use their stated default.

## To do: voice features (added 2026-10-13)

Ideas agreed for later, in order. Each sends audio or text to ElevenLabs, so each needs an ElevenLabs API key (`ELEVENLABS_API_KEY`, server only) and a plain notice to the user about what leaves the device.

| # | Feature | What it does | Cost and notes |
|---|---------|--------------|----------------|
| V1 | **The coach speaks** | The coach reads the one fix and the retry cue aloud in a calm voice; "Hear it smoothly" reads the user's own sentence back without the fillers, so they hear the target before retrying. Optional later: the user's own cloned voice, opt-in only | ElevenLabs text-to-speech, priced per character. Text leaves the device, not audio (unless the voice is cloned) |
| V2 | **Live conversation practice** | A new mode: a real-time voice partner for small talk, interviews, or ordering coffee, with Claude as its brain and feedback afterwards | ElevenLabs Agents: plans from about $99 a month plus about $0.08 a minute plus AI usage (third-party figures, to be confirmed). Audio leaves the device during the call |

Not chosen for now: ElevenLabs Scribe as the transcriber (would keep filler words and time every word, but sends audio to ElevenLabs). Revisit if browser transcription drops too many fillers (risk R1).

## After launch

Use it daily for two to four weeks before adding anything from the PRD's deferred list. Watch which prompts get skipped, whether feedback gets read, and whether the retry helps. Let real use decide what comes next.
