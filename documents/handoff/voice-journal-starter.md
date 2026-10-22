# Starter brief: a voice journal app, with lessons from VoiceLab

**For:** the AI coding session that starts the new voice journal project.
**From:** the sessions that built VoiceLab, a phone-first, local-first speaking-practice web app (repo `Table-Topics`).
**Written:** 2026-10-22.
**How to use it:** read the ten-line summary, then section 2 before writing any code. Paths and decision numbers point into the VoiceLab repo (`documents/architecture/decisions.md` is "D", the playbook's bug table is "B", its rules are "T" and "S"). If you cannot open VoiceLab, everything you need to act on is written here.

## The app, as the user described it

- The user talks for 1 to 5 minutes a day. The talk is transcribed (the phone's speech recognition, or AssemblyAI).
- Claude makes an entry: a summary, a mood the user confirms, topics, people, wins, worries, intentions, and a one-line reflection.
- Next day's prompts follow up on earlier entries. A weekly reflection letter is written by Claude and read aloud by ElevenLabs.
- A mood calendar, "on this day", and search by meaning.
- Voice trends (pace, energy, pitch) shown as observations, never as diagnoses.
- Local-first and private: a Face ID lock, an option to delete audio after transcription, the strictest retention settings at every provider.
- Safety: it is not therapy; crisis language gets kind wording and helplines.

## If you read nothing else (ten lessons)

1. The browser's own speech recognition sends the audio to Apple or Google. Never write "your voice never leaves the device" unless it is true (D97, risk R3).
2. On iPhone, continuous speech recognition is unreliable. For a 1 to 5 minute monologue, record audio and transcribe it afterwards (D101).
3. Every async action needs a visible failure state and a test where the fake fails or never answers. VoiceLab's first bug was a save stuck on "Saving…" forever (B1, T1, T2).
4. Give browser storage an app-specific name, and never assume it starts empty. Another app on `localhost:3000` broke VoiceLab twice (B2, B4, S1, T3).
5. Keep bulky data (audio, readings, embeddings) in its own store. Read each list once per page, and page long lists (D98, D99).
6. Service worker releases must keep the previous release's built files, or open tabs break (D99).
7. Every paid route needs a passphrase, rate limits in a shared store that fail closed, no automatic retries, and a spend cap in each provider's dashboard (D8, D15, D87).
8. Check model ids, voice ids and API field names against the provider's current SDK or docs, and never quote prices or retention terms from memory (D102, D91).
9. Tests that depend on today's date or the time of day fail on some days only. Fix the clock in every test that renders dates (D113, commit `a2767f3`).
10. When the user finds a bug, the fix is not done until a "Bugs that reached you" row says why the tests missed it.

---

## 1. What to reuse from VoiceLab

Copy the idea first and the code second. VoiceLab's code has a comment above nearly every line. That rule was dropped as too costly (S6), so strip comments that only restate the code when you port.

### Recording and audio

| Path | What it does | Caveat for the journal |
|---|---|---|
| `src/audio/services.ts` | Small interfaces for the live transcriber, audio capture and microphone permission, so screens take fakes in tests | Copy the shape as-is. Add `pause()` and `resume()` from the start |
| `src/audio/browserServices.ts` | MediaRecorder at 32 kbit/s, a Web Audio level meter, pitch read ten times a second, and speech recognition that restarts when the browser stops listening by itself | Recording at 32 kbit/s keeps 5 minutes at about 1.2 MB (D88). Turn automatic gain control off for loudness trends, and record whether the browser honoured it (`autoGain`, D81) |
| `src/audio/transcriptAssembler.ts` | Joins the speech service's partial and final results into one transcript across restarts | Only needed if you show live words |
| `src/audio/wakeLock.ts` | Keeps the screen on while recording (D76) | iOS still stops the mic when the app goes to the background (section 2) |
| `src/audio/questionVoice.ts` | One shared `<audio>` element, unlocked by a short silent play inside a tap, so later playback started by code is allowed (D83, D84) | Use this pattern for the weekly letter's playback |
| `src/core/pitch.ts` | Pitch detection (`detectPitch`), the speaker's usual pitch, semitone steps, phrase endings | Pure and tested. Good enough for trends, not for clinical use |
| `src/core/pitchClean.ts` | Cleans pitch readings (octave slips, lone readings, gaps); `smoothForDrawing` makes curves that look like a voice (D114) | Draw from the smoothed track, measure from the cleaned one |
| `src/core/voiceLevels.ts`, `src/core/pauses.ts` | Loudness scaling for unlevelled recordings; pauses judged against the speaker's own loudness | Useful for "energy" and "pace" trends |
| `src/core/endOfTurn.ts` | Decides when someone has stopped talking from the level and the words; longer waits on iPhone (D101) | Only if you add a hands-free "I'm done" |
| `src/audio/timingTones.ts`, `src/core/reminder.ts` | Soft tones made inside a tap; a daily `.ics` calendar reminder built on the device (D78) | The `.ics` reminder is the easiest daily nudge for a home-screen web app with no server |

### Data on the device

| Path | What it does | Caveat |
|---|---|---|
| `src/data/store.ts`, `src/data/memoryStore.ts`, `src/data/indexedDbStore.ts` | One store interface; an in-memory fake for tests; the IndexedDB version | Port all three. The IndexedDB store opens at whatever version exists, adds missing collections one version higher, refuses a same-named collection laid out differently (B2, B4), and reopens after Safari closes an idle connection (`onclose`, then one retry on `InvalidStateError`, D86) |
| `src/data/repository.ts` | All reads and writes; reads each collection once and shares the result until something is saved, in this tab or another (`BroadcastChannel`, D99) | Callers get their own copy of the list. Keep that, or a screen will mutate the shared copy |
| `src/data/migrations.ts` | Layout version kept in a `meta` record (not the database version, which another app can raise); moves records 100 per transaction, re-reading each inside it; safe to stop and resume (D98) | Start the journal at layout 1 with this machinery already in place |
| `src/core/retention.ts`, `src/data/housekeeping.ts` | What audio and detailed readings to keep, and the idle-time tidy that applies it in batches of 20, re-checking each record inside its transaction | See "Retention" in section 2. Never prune while saving |
| `src/data/exportFile.ts` | Versioned export (v1 and v2 both import), compact JSON written in parts into a `Blob`, chunked import with progress, damaged records refused before anything is saved | Audio is not exported. For the journal, encrypt the export (section 4) |
| `src/core/importMerge.ts` | Import adds without losing anything: a record already here only gains fields it lacks; the audio link is never touched; per-key "further-on wins" joins for progress maps | The rule that fixed "a re-imported backup replaced newer data" (D86) |
| `src/core/storageSafety.ts`, `src/data/storageSafety.ts` | Asks for persistent storage after a save; one reminder at a time: add to Home Screen (iPhone Safari), or save a copy | Copy as-is (D64) |
| `src/data/records.ts` | Record types, with dates stored as ISO text so exports round-trip exactly | Same habit for entries |

### Server routes and providers

| Path | What it does | Caveat |
|---|---|---|
| `src/server/guard.ts` | `checkAccess` then `admit`: passphrase (with a lockout of 20 wrong guesses per caller per hour, checked before comparing) → the other settings → body shape and size → shared rate limit. Nothing costs money until every check passes (D87) | Setup details are explained only to someone with the passphrase or while developing. Strangers get 401 or "The server is not set up." |
| `src/server/accessGate.ts` | Constant-time passphrase comparison (SHA-256 then `timingSafeEqual`) | Uses `node:crypto`: keep it server-only, or the build pulls it into the browser |
| `src/server/rateLimit.ts` | Per-minute and per-day counters per route scope, in Upstash Redis over REST, with an in-memory fake; any store error is thrown | Fail closed: if the counter store is down, paid calls stop (503) (D15) |
| `src/server/env.ts` | Reads server-only settings; each error names the variable and the rule, never the value; the passphrase must be 16 characters or more | Half-set optional services report what is wrong (T13, B6) |
| `src/core/requestLimits.ts` | One set of size limits read by both the app and the server, a total-characters cap so per-field caps cannot stack, and `withinLimit` to cut text at a whole word | Fixed sessions the app could make but the server refused (D86) |
| `src/config/limits.ts` | Every route's caps, with the worst day worked out in a comment | Redo the arithmetic with current prices before launch |
| `src/config/models.ts` | Every model id in one file (D7) | Confirm each id against the SDK when you copy it |
| `src/config/securityHeaders.ts` | Content-Security-Policy and HSTS on every page | Next.js inline data scripts force `'unsafe-inline'` for scripts on static pages; a hash makes browsers block them (D87) |
| `src/server/coach.ts`, `summary.ts`, `conversationWriter.ts` | Claude behind small interfaces (`Coach`, `Summarizer`), structured output, the system prompt cached, `maxRetries: 0`, a timeout per call | `max_tokens` must leave room for the model's thinking: 4,000 cut replies off mid-way (commit `cec8b14`) |
| `src/server/transcriber.ts` | AssemblyAI behind a `Transcriber` interface: upload, submit, poll, read, then delete the transcript at AssemblyAI | Field names were checked against the docs on 2026-10-21. Check again |
| `src/server/voice.ts` | ElevenLabs text-to-speech behind `Voice` and `PersonaVoice`, plain and streaming | The journal's weekly letter can use the plain form |
| `src/server/voiceWorker.ts`, `voice-worker/` | A Python service (FastAPI, Praat through parselmouth, librosa) for voice-quality measures, behind a shared secret | Parselmouth and Praat are GPL; get a lawyer's view before any commercial launch. The optional audEERING model is non-commercial only (D91) |
| `scripts/live-check.ts`, `scripts/analysis-check.ts` | Run locally with the real keys: checks every setting exactly as the app does, sends a sample, prints timing and cost | Build one on day one. The agent cannot call live APIs; the user runs it |

### Analysis, trends and the weekly summary

| Path | What it does | Caveat |
|---|---|---|
| `src/core/analysis/metrics.ts` | A registry of measures, each with a plain name, unit, source, evidence level, shown or internal, and which way is better | Mark most voice measures "neither": no direction is better for a journal |
| `src/core/analysis/stats.ts`, `profile.ts`, `profileRules.ts` | "Usual" is the median of the first 5 entries; "recent" the median of the latest 7; spread is 1.4826 × the median absolute deviation; a trend needs 6 entries and a move of more than half a spread; a change flag needs 8 entries and the latest 3 all beyond median ± one spread | This is the right maths for "observations, not diagnoses": compared only with yourself |
| `src/core/usualZone.ts` | A band of usual ± spread (at least 5% of usual) and a dot for the latest, with neutral words ("faster than usual", "inside your usual") | Same colour for every dot; no colour means good or bad (D90, D115) |
| `src/core/changeNoise.ts`, `src/core/checkInCompare.ts` | A change counts only when it is bigger than that measure's usual wobble; never say "worse" (D103) | Use for "your pace this week" |
| `src/core/weeklySummary.ts`, `src/server/summary.ts` | The weekly summary: a compact table of numbers and at most five short quotes go to Claude, never whole transcripts; structured reply; at most 12,000 characters in | The journal's letter needs the entries' text, so it will be larger. Set a cap and say what is sent |
| `src/core/analysis/language.ts`, `lexicon.ts` | Word variety, hedges, vague words, intensifiers | Optional for a journal |

### Offline, theme and fonts

| Path | What it does | Caveat |
|---|---|---|
| `src/serviceWorker/sw.template.js`, `scripts/build-sw.mjs`, `src/components/ServiceWorkerRegister.tsx` | A hand-written service worker (no plugin, D16) stamped at build time with the build id and the built-file list; saves every main page and its in-app navigation data; stale-while-revalidate; a 3-second network timeout; built files shared across releases, keeping the previous release's (D88, D99) | `pnpm build` must run the stamping step. The worker is only registered in production builds |
| `src/theme/roles.ts`, `themes.ts`, `themeCss.ts`, `contrast.ts`, `src/app/globals.css` | Colours and fonts as named roles; Tailwind's built-in palette switched off; a test fails on any raw colour outside the theme; every text and background pair passes WCAG AA in light and dark | Keep the rule and the tests from the first commit (D11) |
| `src/data/colorMode.ts` and the early script in the layout | Light, dark or follow the device; set on `<html>` before first paint so dark never flashes light (D60, D89) | Needs `suppressHydrationWarning` on the root for that one attribute |
| `src/theme/fonts/AtkinsonHyperlegibleNext-OpenZero.woff2`, `scripts/fonts/open-zero.py` | The body font with its slashed zero redrawn as a plain oval (the font has no OpenType switch for it) (D89) | OFL licence: keep `OFL.txt` beside it. Fonts are self-hosted, so no requests go to Google from the phone |

### Tests and checks worth copying

- `tests/e2e/support/fixtures.ts`: the list of every page. A new page joins it, and the browser suite loads each one directly, fails on any console error and checks for sideways scrolling at phone width (T5, T8, T11).
- `tests/e2e/wordBudget.spec.ts`: the first phone screen of each page holds 100 words or fewer, with the page clock fixed (D63, D113).
- `tests/e2e/storage.spec.ts`: storage left by "another app" with a different shape (T3).
- `tests/unit/app/internalLinks.test.ts`: every quoted internal address in the source must be a real page, route or file (D105).
- `playwright.config.ts`: `fullyParallel: true`, `workers: process.env.CI ? 2 : 4`, its own server on its own port, no retries (D112).

---

## 2. Mistakes we hit, and how to avoid them from day one

### Privacy and speech recognition

| Mistake | What to do instead | Source |
|---|---|---|
| The app said "your recordings stay on this device" while the browser's speech recognition sent the audio to Google (Chrome), Apple (Safari) or Microsoft (Edge) | Say exactly who hears the audio, before the mic is first used and in Settings. Recent Chrome can recognise on the device if the page asks (`processLocally`, after a language download); Safari has no such switch. Check current support | D17, D97, risk R3 |
| Privacy wording was correct in the docs but not in the app's own strings | Search the UI strings for "stays on", "never leaves" and "private" whenever a data flow changes | D97 |
| The coach was given text that came back from the browser (the last change) without fencing | Wrap anything user-written or browser-returned in tags, strip those tags from the text, and tell the model it is data, not instructions. A journal is entirely user-written | D31, D87 |

### iPhone Safari and installed web apps

| Mistake | What to do instead | Source |
|---|---|---|
| Continuous recognition on iPhone stops by itself and cannot tell a thinking pause from the end | For a 1 to 5 minute entry, record with MediaRecorder and transcribe afterwards. Treat live words as optional | D101 |
| The mic stops when the screen locks or the app goes to the background; a network error from the speech service threw the whole take away | Hold a wake lock while recording, and save what was recorded and heard whenever recording stops on its own, with a plain note | D76, D86 |
| Sound started by code (after a network reply) is blocked on phones | Unlock one shared audio element with a short silent play inside the user's tap, and play everything on it | D83, D84 |
| Safari clears the storage of sites not used for a while unless the app is on the Home Screen; any browser can clear storage when space is low | Ask for persistent storage after the first save, nudge iPhone Safari users to add to the Home Screen, and remind people to export a copy now and then | D64, risk R7 |
| An installed app left open overnight kept showing yesterday | When the page becomes visible on a new day, move every screen to the new day | D86 |
| iOS web push needs the app installed to the Home Screen and a server | Use a calendar reminder (`.ics`) first; add web push only if needed | D78 |
| The microphone permission prompt was easy to refuse and hard to undo | Explain the mic in your own words before the browser asks; after a refusal, show the steps to allow it on iPhone, Android and desktop | D38 |

### Storage and speed

| Mistake | What to do instead | Source |
|---|---|---|
| A database named after the app collided with another project on `localhost:3000`, first on its version number, then on its layout | Name storage `appname-purpose` (`voicejournal-entries`), keep a layout version in your own `meta` record, refuse to write to a collection laid out differently | B2, B4, S1, S2 |
| Pages read every session two or three times, each with ten-a-second readings inside; a year of data made History take 10 s at 5,000 records | Keep bulky readings (and, for the journal, embeddings and audio) in their own stores keyed by entry id; read each collection once per page; page long lists (50 at a time); memoise | D98, D99, performance.md |
| Pairing records sorted the whole list again for each row | One pass with a map | D99 |
| A pretty-printed export of a year was 80 MB with a 5.9 s freeze; at 5,000 records, 262 MB (a crash risk on iPhone) | Compact JSON written a part at a time into a `Blob`, with progress; chunked import (200 records a transaction) | D99 |
| Re-importing a backup replaced newer data and unlinked recordings; Settings then wrote a stale copy back | Merge on import (fill gaps, never touch the audio link) and reload any screen's data after import or delete | D86, playbook "caught before" |
| Audio pruning ran inside save, and kept "the first take of every prompt", which grew without end | Retention: keep audio for a window (7, 14 or 30 days, default 14), plus starred items, markers and the very first recording; keep detailed readings 30 days on the same terms; prune at idle in small batches, deciding again inside each transaction | D88, D98 |
| Safari closes idle database connections and every later save failed until a reload | Forget a closed connection (`onclose`) and reopen once when a transaction cannot start | D86 |

### Service worker and offline

| Mistake | What to do instead | Source |
|---|---|---|
| The cache name was numbered by hand and the worker file never changed, so browsers never installed a new one and old files piled up | Stamp the build id and file list into the worker at build time, so every release is a new worker | D88 |
| A new release deleted scripts that an open tab of the previous release still needed | Keep built files in one shared cache keyed by their hashed names, with a note of which files the current and previous release use; delete only files neither uses | D99 |
| In-app navigation fetches page data (RSC requests), not pages, so most pages were never saved for offline | Save each page's data under its own key, never mixed with its HTML | D88 |
| A refresh from a newer release was saved into the old release's cache | Save a fetched page only if every script it names belongs to this build | D99 |
| Playwright's offline switch does not reach a service worker's own fetches | Test offline by stopping the server | D88 |

### Server, cost and limits

| Mistake | What to do instead | Source |
|---|---|---|
| A passphrase shorter than 16 characters made every request fail, and the screen said only "the server is missing a setting" | Health checks run the same setting checks as the app; errors name the setting and the rule, never the value; any rule the user must follow is in the setup steps and checked where they type it | B6, T13 |
| Rate-limit counters in server memory reset on every serverless start | A small shared store (Upstash Redis); if it is down, paid calls stop | D8, D15 |
| The SDK's automatic retries billed each failed call again; per-field size caps stacked into one costly request | `maxRetries: 0`; one total-characters cap per request; work out the worst day in the limits file | D87 |
| A timer could call the same "say that again" path a person does; at zero time it looped forever, each loop a paid call | When a timer can call a user action, test it firing at zero, and make every retry path end | D86, playbook "caught before" |
| The app and the server each had their own copy of a limit, so long sessions were refused for good | One limits module read by both sides; test the app's longest case against the real server check | D86 |
| Uploads through a Vercel function are capped at 4.5 MB per request | Record at 32 kbit/s (about 16 minutes fits under a 4,000,000-byte cap) and count bytes as they arrive; for longer audio, upload straight to storage | D91 |
| A model id or voice model was nearly used from memory | Confirm every model id, voice id and API field in the provider's SDK or docs, and write the version you checked in the config comment | D102, D91 |
| Prices, data-retention terms and features change (an emotion API VoiceLab's research recommended had shut down by the time it was checked) | Never quote them from memory; check the provider's page on the day and write the date beside the number | speech-analysis research, D84 |
| Research sources were found through search but not opened | Mark such claims as unconfirmed until someone opens the source | D94 |

### Tests that lied

| Mistake | What to do instead | Source |
|---|---|---|
| Every fake always succeeded, so the save had no error path | Every fake gets a test where it throws and one where it never answers | B1, T1, T2 |
| A page asked "is speech supported?" during server rendering and the server always said no | Never decide the first render from browser-only facts (window, storage, the date) | B3, T4 |
| Browser checks always clicked in from the home page | Load every page directly at least once, and fail on any console error | B3, T5 |
| Screens were approved one at a time and nothing linked back | A check that every screen reaches every section | B5, T11 |
| A word-budget check failed on some days only, because the page showed the day's content; another failed ten minutes after 6 pm | Fix the page clock in every browser check (`page.clock.setFixedTime`); never mix a fixed test date with the real clock | D113, commit `a2767f3` |
| Pitch curves drawn from per-word medians looked like stepped plateaus, and the seeded voice held each word at one pitch | Draw from a smoothed track; make seeded data behave like a real voice; test the shape (largest jump between neighbouring points) and compare screenshots with the mockup for shape, not only layout | B7, D114, T14 |
| A budget check listed its pages by hand and missed 21 of them | Build "every page of a kind" from the content itself | playbook "caught before" |
| A test file that failed to load dropped its tests from the total silently | Read the "Test Files" count, not only "Tests" | playbook section 4 |
| A commit command piped the test output through `grep`, so a failing test was pushed | Gate commits on the check's own exit code (`set -o pipefail`, or `pnpm check` on its own) | playbook "caught before" |

### Design and wording

| Mistake | What to do instead | Source |
|---|---|---|
| First phone screens carried 80 to 136 words | A screen says what to do; the why is one tap away. Check a 100-word budget in the browser suite | D63 |
| A change from 15 to 16 a minute was called "Worse" | Count a change only beyond the measure's usual wobble; use neutral words; never "worse" | D103 |
| A broken streak was shown, and broken streaks lower future practice | Count days in the last seven; let rest days not break a run; never show a broken one | D78 |
| Dense results pages on short takes | Focus first: decide what to show by the item's length and purpose; depth behind "Look closer" | D115 |
| Uppercase labels and cheerleading copy came in from mockups | Plain sentence-case labels; strengths say what happened, no "Nice!" | D111, D115 |

---

## 3. Rules that worked

| Rule | In practice |
|---|---|
| **Logic in `src/core` as pure functions** | No browser APIs, no React, no dates read inside (pass `now`). These got thorough unit tests and caught the most breakage (T12) |
| **Interfaces with fakes for every outside thing** | Microphone, speech, storage, clock, Claude, ElevenLabs, AssemblyAI, the counter store. Inject them, and keep at least one test that uses the real default (T7) |
| **Plain comments, strict TypeScript** | Comments say why, not what (S6). `strict`, no `any`, and the `no-floating-promises` lint rule (S3: B1 began as `void save()`). Pin tool versions with a lockfile (D13) |
| **A decision log, written in the same commit** | `documents/architecture/decisions.md`: number, decision, why, revisit when. Include what was not chosen and what was not verified. Docs change in the same commit as the code |
| **Definition of done** (playbook section 4) | Tests for new logic, including the failure path; a bug fix starts with a test that reproduces the user's exact error (T6, T9); lint, typecheck, unit tests and the build pass on every commit; the change run in a real browser with each touched page loaded directly and a clean console; screenshots at 375 px and desktop; the report says exactly what was verified and with what ("stand-in microphone, desktop Chromium"), and what still needs the user (a real voice, a phone, a key) |
| **A "Bugs that reached you" row** | Whenever the user finds a bug: date, what they saw, the real cause, why the tests missed it, the rule it produced. Same commit as the fix |
| **Word budgets on screens** | 100 words on the first phone screen, checked by a browser test built from the page list (D63) |
| **Design rules** | Colours and fonts only through theme roles; no uppercase labels; no cheerleading; one change at a time (the one thing to try next, D40); feedback chosen by the item's length and purpose (D115); talk about what was said and done, never judge the person (D53); 44-pixel tap targets; every motion behind `motion-safe:` |
| **Keys server-only** | No `NEXT_PUBLIC_` on any secret; keys only in `.env.local` and the hosting dashboard, never in chat; `.env.example` lists names only |
| **Spend caps at the providers** | A monthly limit in the Anthropic Console, an ElevenLabs credit limit on the key, an AssemblyAI cap or alert. The app's own caps are the first stop; the dashboard is the one that holds |
| **Testing speed** | Playwright `fullyParallel` on 4 workers (2 on CI); each commit runs the browser specs that touch what changed; one full browser run before the final push; the browser run and screenshots reuse one build; no retries (D112). Unit and screen tests ran in about 16 s |
| **Working with agents** | One building agent at a time on the machine (they share the dev server, the port, the build folder and browser storage). Research agents that only read and search can run alongside. Each agent commits its own work with a clear message |
| **Spikes on a real phone first** | Throwaway experiments answer one question (does recognition work on this phone?); keep only the findings, in the decision log (D12) |
| **Product habits** | Say where an idea comes from early; confirm understanding of multi-part requests before building; unanswered questions get recorded defaults; mark MVP compromises as temporary (playbook section 6) |

---

## 4. Suggestions for the journal app

### Privacy and encryption at rest

- **An app lock is not encryption.** A Face ID prompt over unencrypted IndexedDB stops a casual glance, not someone with the unlocked phone and developer tools. Decide which you are promising, and word it exactly.
- **Encrypt entries with Web Crypto.** Make a random data key (AES-GCM, 256-bit). Encrypt each entry's text, summary, tags and audio with a fresh 12-byte IV. Store only ciphertext in IndexedDB.
- **Wrap the data key, two ways:**
  - With a key derived from a passphrase (PBKDF2 with a high iteration count; check current guidance on the count).
  - With a passkey: WebAuthn's PRF extension returns a secret only after Face ID or Touch ID, which can derive a wrapping key. Support varies by browser and version, so check it and keep the passphrase as the fallback.
  - On iPhone, a WebAuthn platform credential is how a web app gets Face ID. There is no other Face ID API for the web.
- **What stays unencrypted** should be listed: probably dates, mood (if the calendar must draw while locked), and settings. Decide early (section 6).
- **Lost passphrase and passkey means lost data.** Say so at setup, and offer an encrypted export as the backup.
- **Keep decrypted text out of the service worker caches, logs and error reports.** Keep entries out of URLs.
- **Audio:** offer "delete audio after transcription" as the default. When audio is kept, apply VoiceLab's window rule (section 2) with starred entries kept.
- **Server routes store nothing.** Log durations and status codes only, never text. VoiceLab's routes followed this (D102).
- **What leaves the device** gets its own table in the docs, as VoiceLab's `data-model.md` "What leaves the device" does, and the same words appear in the app.
- **Regulation:** journal entries are likely to contain health information, a special category under GDPR. Get proper advice before offering it to others.

### Mood as self-report first

- The user picks the mood. Claude may suggest one from the words, shown as a suggestion ("Sounds like: tired, hopeful. Is that right?"); the stored mood is what the user confirms or picks.
- Never infer mood or emotion from the voice. Voice trends are acoustic measures (pace, loudness, pitch range) against the person's own usual, in neutral words ("slower than your usual"), with no colour meaning good or bad (D90, D103).
- Skip the mood question on a hard day: a "prefer not to say" option, and never nag.
- Store the mood scale's version with each entry, so the scale can change later without corrupting the calendar.

### Safety and crisis

- **Say it is not therapy** in the welcome and the about page, in one plain line: "This is a journal, not therapy or medical advice."
- **Two layers of detection:**
  - A short on-device phrase list that works offline and before any network call.
  - A field in Claude's structured reply (`safety: none | concern | crisis`), with the instructions written for it.
- **When crisis language is detected:**
  - Save the entry as normal, never block it, and never contact anyone on the user's behalf.
  - Show a calm card first, in fixed, human-written wording, not model-written. For example: "It sounds like things are really hard right now. You don't have to go through this alone. If you might act on thoughts of harming yourself, please reach out now:" and then helplines for the user's region, and "If you are in immediate danger, call your local emergency number."
  - Do not write a cheerful reflection on that entry. Leave it out of next-day prompts unless the user chooses, and do not read it aloud in the weekly letter.
- **Helplines in a content file, checked by a test**, keyed by region, each with a "checked on" date. Examples to verify before shipping: 988 in the US (call or text), Samaritans 116 123 in the UK and Ireland, and findahelpline.com as a directory.
- **The weekly letter** follows the feedback rules: about what was said and done, never a judgement of the person, no diagnosis words (depressed, anxious, disorder), no advice to stop or change medication, and no promises.
- **Test it:** fixed transcripts with crisis phrases, phrases that only look like crisis language ("this deadline is killing me"), and the model failing or timing out. The card must still show from the local list.

### The EU AI Act

- Emotion recognition from biometric data (voice included) is banned in workplaces and education (Article 5(1)(f)), with medical and safety exceptions. A personal journal is not either of those.
- Outside those settings it is not banned. It is listed as high-risk (Annex III), and anyone exposed to it must be told (Article 50(3)). Check the current text and timelines, which have been changing.
- **The simplest path:** do not infer emotions from the voice at all. Mood is self-reported; voice trends are pace, loudness and pitch, described as measurements. A mood suggested from the user's own words is not biometric, but keep it a suggestion the user confirms.
- **Careful with claims:** never "detects your emotions", "knows how you feel", "spots depression" or "mental health tracking". Use "notices patterns in what you said and how you said it", "compared only with you".
- Get legal advice before launching to EU users or selling to employers or schools.

### Search by meaning

| Option | Notes |
|---|---|
| A hosted embeddings API | Anthropic does not offer an embeddings model (check this); its docs point to a partner. The entry text leaves the device, so add it to "What leaves the device" and check that provider's retention terms |
| On the device | A small sentence-embedding model run in the browser (for example with transformers.js), tens of MB downloaded once and cached. Nothing leaves the phone. Test speed on a real mid-range phone |
| Both | Keyword search on the device first (fast, private, works offline), meaning search second |

- Embed the summary plus each paragraph, not the whole entry as one vector.
- Store vectors in their own store, keyed by entry id (the D98 lesson). At a few entries a day, comparing against every vector stays fast for years.
- Store the model name and version with each vector, and re-embed in the background when either changes (the migration pattern above).
- Encrypt vectors too: an embedding can leak what the text was about.

### Cost per daily entry (check current prices before using any number)

| Driver | Grows with | Notes |
|---|---|---|
| Transcription | Minutes of audio | Zero with the browser's recognition (which sends audio to Apple or Google). AssemblyAI is billed per hour of audio; keeping "um"s may cost extra |
| Entry generation | Input tokens (the instructions plus the transcript: 5 minutes is about 750 words) and output tokens, including the model's thinking | Cache the fixed instructions. A smaller model is likely enough; measure quality before choosing a bigger one |
| Next-day prompts | Tokens of the few recent summaries sent, not whole entries | Can be part of the entry call |
| Embeddings | Characters embedded | Tiny if hosted; free on the device |
| Weekly letter text | A week of summaries in, a letter out | One call a week |
| Weekly letter voice | Characters spoken by ElevenLabs | Likely the biggest weekly cost. Cap the letter's length, and only voice it when the user presses play |
| Voice trends | Nothing | Measured on the phone |

- Write the arithmetic as a comment in `src/config/limits.ts`, as VoiceLab did, with the date the prices were checked: a typical day, a worst day (every cap used, as if the passphrase leaked), and a month.
- Then set every provider's dashboard limit at or a little above the worst month.

### Data retention at providers (check the current terms; these change)

| Provider | What to set or check |
|---|---|
| AssemblyAI | Opt out of model training (paid plans) and choose the shortest retention offered. Delete each transcript through the API as soon as it is read (`src/server/transcriber.ts` does). Check where the audio is processed (US by default) |
| ElevenLabs | The letter's text is sent to be spoken. Check whether your plan offers a no-logging or zero-retention mode, and whether it is on by default. Limit the key to text-to-speech only, with a credit limit |
| Anthropic | Check the current API data-retention period and training policy, and whether zero data retention is available to you (it has been offered by arrangement). Send summaries rather than whole entries where you can |
| The browser's speech recognition | Governed by Apple's or Google's terms, not yours. Say so plainly |

### What to build first, and what later

| MVP, in this order | Later |
|---|---|
| 1. Record an entry: audio in IndexedDB, transcript (one path only, chosen after a phone spike), a save that can never hang | Next-day follow-up prompts |
| 2. Entry generation through one guarded route: summary, suggested mood, topics, people, wins, worries, intentions, one-line reflection, safety field | The weekly letter, then its voice |
| 3. Mood confirmed by the user, and a mood calendar | Search by meaning |
| 4. The crisis card and helplines, with tests | Voice trends with a usual zone |
| 5. Encryption at rest and the lock | "On this day" |
| 6. Export and import (encrypted), delete everything, delete audio after transcription | Sync between devices (would change the privacy story) |
| 7. Offline app shell and the service worker | Native wrapper, if web limits bite (section 6) |
| 8. A live-check script, a spend cap at each provider, the browser suite in CI | |

- Keep the first week to items 1 to 4 and the browser suite.
- Test the riskiest assumption first, on the user's real phone: does a 3-minute recording survive a screen lock, and which transcription path is good enough?

---

## 5. Setup checklist for the new repo

### Accounts (the user creates them; the agent never sees a key)

- [ ] GitHub private repository.
- [ ] Vercel project connected to it.
- [ ] Upstash Redis through the Vercel Marketplace (it sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`).
- [ ] Anthropic Console: billing, a monthly spend limit, an API key. The Claude chat subscription does not include API use.
- [ ] AssemblyAI, if used: billing, a spend cap or alert, the training opt-out, the shortest retention.
- [ ] ElevenLabs: a key limited to text-to-speech with a credit limit; a voice chosen from the library.
- [ ] Optional: an embeddings provider, with a spend limit.
- [ ] The user's phone and browser named early. iPhone Safari changes several answers.

### Environment variables (`.env.example` holds names only)

| Variable | Secret | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Entry generation and the weekly letter |
| `APP_ACCESS_SECRET` | Yes | At least 16 characters (`openssl rand -base64 24`). Edit `.env.local` in a plain-text editor: curly quotes become part of the value |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Yes | Required in production; the server refuses to start paid calls without them |
| `ASSEMBLYAI_API_KEY` | Yes | Optional |
| `ELEVENLABS_API_KEY` | Yes | The weekly letter's voice |
| `ELEVENLABS_VOICE_ID` | No | |
| Embeddings key, if hosted | Yes | |

None may start with `NEXT_PUBLIC_`. A missing or wrong setting fails with a message that names it.

### Day-one project setup

- [ ] Read `AGENTS.md` and the Next.js docs in `node_modules/next/dist/docs/`. The Next.js version is newer than most training data.
- [ ] Pin Node, pnpm, TypeScript and ESLint versions; commit the lockfile.
- [ ] TypeScript strict, `no-floating-promises`, ESLint with `--max-warnings=0`.
- [ ] App-specific names for the database, local-storage keys and caches; a dev port of its own (not 3000).
- [ ] Copy the playbook into the new repo, with an empty "Bugs that reached you" table, and a `CLAUDE.md` that points to it.
- [ ] Start `documents/architecture/decisions.md` with "Not chosen" and "Revisit when" columns.
- [ ] Theme roles, the raw-colour test and the contrast test before the first screen.
- [ ] Vitest with fakes; Playwright with a page list, direct loads, console-error failure, phone-width checks, a fixed clock and a word budget; CI on every push.

### Order to wire things in

1. Recording to IndexedDB with fakes, and the failure paths.
2. The guard: passphrase, settings, body, rate limit (with the in-memory store locally).
3. The entry-generation route with a fake Claude, then the real one behind `pnpm live-check`, run by the user.
4. Transcription: one path, then the other behind the same interface.
5. Encryption and the lock, before any real entries exist (a later migration of plaintext data is harder).
6. Upstash and the deploy, with spend caps already set.
7. The service worker, last among the basics (it caches whatever is broken).
8. ElevenLabs for the weekly letter, after the letter's text is good.

---

## 6. Open questions for the user to decide early

1. **Web app or native?** A home-screen web app is fastest to ship (VoiceLab's choice, D2), but iOS limits background recording, reminders and Face ID access. A native wrapper (such as Capacitor) gives Keychain storage, real Face ID and local notifications. Decide before building the lock.
2. **Where does transcription happen?** The browser (free, live, audio to Apple or Google), AssemblyAI (accurate, keeps "um"s, audio to AssemblyAI), or on the device (most private, heavy on a phone). One default, chosen after a phone spike.
3. **Keep audio at all?** Delete after transcription by default, or keep for a window (7, 14 or 30 days) with starred entries kept?
4. **What is encrypted, and how is it unlocked?** A passphrase, a passkey, or both; whether mood and dates stay readable for the calendar while locked; and accepting that a lost passphrase means lost data.
5. **What may Claude see?** Whole entries for the entry itself, but only summaries for next-day prompts and the weekly letter? People named in entries: send names, or replace them with initials first?
6. **Mood scale:** words, a 1 to 5 scale, or both? Can the user skip it?
7. **Safety wording and regions:** which countries' helplines, and who reviews the crisis wording? A person, ideally someone with clinical experience, should sign it off.
8. **Weekly letter voice:** which ElevenLabs voice, how long a letter, generated automatically or only when the user asks, and kept as audio or spoken fresh each time?
9. **Search by meaning:** on the device (private, a download) or hosted (better quality, text leaves the phone)?
10. **Who is it for?** Only the user (as VoiceLab was: one passphrase, no accounts), or others later? Accounts, sync and a privacy policy change the whole design.
11. **Monthly budget:** the most the user will spend a month at each provider, which sets every cap.
12. **Voice trends on or off by default,** and which three measures to show first.
