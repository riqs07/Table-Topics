# Table-Topics — Implementation Tickets

A living document tracking all work required to build and ship the Table-Topics speech practice application.
Each ticket has a status, priority, and acceptance criteria.

**Status legend:** `[ ]` Todo · `[~]` In Progress · `[x]` Done

---

## Epic 1 — Core Game Loop

> The foundational session flow: pick a question, start the timer, end the session.

### TT-001 · Question Display
**Priority:** P0 · **Status:** `[x]` Done

- [x] Randomly select a question from the question bank on session start
- [x] Display question prominently during the session
- [x] Support Words of the Day alongside each question
- [x] Prevent the same question from repeating back-to-back

---

### TT-002 · Timer System
**Priority:** P0 · **Status:** `[x]` Done

- [x] Configurable countdown per practice mode
- [x] Color-coded progress bar: Green (qualified) → Yellow (warning) → Red (final stretch) → Grey (over)
- [x] Qualification threshold per mode
- [x] Visual indicator when qualification time has been met
- [x] Allow session to continue beyond the timer limit

---

### TT-003 · Practice Modes
**Priority:** P1 · **Status:** `[x]` Done

- [x] **Quick Fire** — 30s total, qualifies at 20s
- [x] **Standard** — 120s total, qualifies at 60s
- [x] **Extended** — 300s total, qualifies at 180s
- [x] **Elevator Pitch** — 60s total, qualifies at 45s
- [x] **Interview Prep** — 120s total, qualifies at 60s
- [x] Mode selector UI before session start

---

### TT-004 · Session State Management
**Priority:** P0 · **Status:** `[x]` Done

- [x] Track session start/end timestamps
- [x] Track actual speaking duration
- [x] Track the question and word used
- [x] Expose session data to analysis modules

---

## Epic 2 — Questions & Content

> Managing the bank of practice questions and vocabulary words.

### TT-005 · Question Database
**Priority:** P0 · **Status:** `[x]` Done

- [x] 40+ built-in questions across 7 categories: impromptu, persuasive, storytelling, debate, professional, creative, reflection
- [x] Difficulty levels per question
- [x] Category metadata for filtering

---

### TT-006 · Words of the Day
**Priority:** P1 · **Status:** `[x]` Done

- [x] 20+ built-in vocabulary words with definitions and parts of speech
- [x] Random word selected per session
- [x] Display definition in-session

---

### TT-007 · Custom Questions Management
**Priority:** P1 · **Status:** `[x]` Done

- [x] Add custom questions via settings panel
- [x] Edit existing custom questions
- [x] Delete custom questions
- [x] Persist custom questions to localStorage

---

### TT-008 · Custom Words Management
**Priority:** P2 · **Status:** `[x]` Done

- [x] Add custom words of the day via settings panel
- [x] Edit and delete custom words
- [x] Persist to localStorage

---

### TT-009 · Question Filtering
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Filter question pool by category before session start
- [ ] Filter by difficulty (Easy / Medium / Hard)
- [ ] "Exclude recently used" toggle
- [ ] Persist filter preferences to localStorage

---

## Epic 3 — Voice Recording

> Capturing audio for post-session AI analysis.

### TT-010 · Audio Capture
**Priority:** P1 · **Status:** `[x]` Done

- [x] Request microphone permission gracefully
- [x] Record using MediaRecorder API
- [x] Apply echo cancellation and noise suppression constraints
- [x] Handle browser codec differences (webm, mp4, mpeg fallbacks)
- [x] Stop recording cleanly on session end

---

### TT-011 · Recording Controls UI
**Priority:** P1 · **Status:** `[x]` Done

- [x] Start/stop recording button tied to session lifecycle
- [x] Visual indicator that recording is active
- [x] Error toast when microphone access is denied

---

## Epic 4 — AI Speech Analysis

> Post-session analysis powered by OpenAI Whisper and GPT.

### TT-012 · OpenAI API Integration
**Priority:** P1 · **Status:** `[x]` Done

- [x] API key stored in localStorage
- [x] API key configuration via settings panel
- [x] `hasApiKey()` check before triggering analysis
- [x] Prompt user to set API key if missing

---

### TT-013 · Transcription (Whisper)
**Priority:** P1 · **Status:** `[x]` Done

- [x] Upload recorded audio blob to Whisper API
- [x] Return raw transcript text
- [x] Handle API errors with user-facing toast

---

### TT-014 · Analysis Report (GPT)
**Priority:** P1 · **Status:** `[x]` Done

- [x] Calculate WPM from transcript + duration
- [x] Detect filler words (um, uh, like, so, you know, etc.)
- [x] Generate delivery score
- [x] Identify top 3 strengths and top 3 areas for improvement
- [x] Return structured JSON for display

---

### TT-015 · Analysis Display
**Priority:** P1 · **Status:** `[x]` Done

- [x] Show transcript in post-session panel
- [x] WPM badge with contextual rating (Slow / Good / Fast)
- [x] Filler word count breakdown
- [x] Strengths list
- [x] Improvement suggestions list
- [x] Delivery score display

---

### TT-016 · Offline / No-API Fallback
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Detect when no API key is configured
- [ ] Provide local-only filler word count using regex on Web Speech transcript
- [ ] Display degraded analysis panel clearly marked as "Local Analysis"
- [ ] Prompt to set API key to unlock full analysis without blocking usage

---

## Epic 5 — Real-Time Speech Coach

> Live in-session feedback using the Web Speech API.

### TT-017 · Live Transcription
**Priority:** P1 · **Status:** `[x]` Done

- [x] Start Web Speech API recognition on session begin (if coach enabled)
- [x] Display rolling transcript in coach overlay
- [x] Handle recognition restart on silence timeout

---

### TT-018 · Real-Time Filler Word Detection
**Priority:** P1 · **Status:** `[x]` Done

- [x] Scan live transcript for filler words as speech is recognized
- [x] Display running filler count per word type
- [x] Visual highlight when filler rate is high

---

### TT-019 · Live Pace Indicator
**Priority:** P1 · **Status:** `[x]` Done

- [x] Calculate real-time WPM from rolling word count
- [x] Display speedometer-style indicator
- [x] Mark ideal range (120–150 WPM)

---

### TT-020 · Volume Monitor
**Priority:** P2 · **Status:** `[x]` Done

- [x] Analyze audio stream for volume level
- [x] Display volume bar with feedback (Too Quiet / Good / Too Loud)

---

### TT-021 · Pause Detection
**Priority:** P2 · **Status:** `[x]` Done

- [x] Detect silence periods during session
- [x] Track and display pause count
- [x] Flag unusually long pauses

---

### TT-022 · Coach Toggle
**Priority:** P1 · **Status:** `[x]` Done

- [x] Toggle switch to enable/disable coach overlay
- [x] Persist coach preference to localStorage
- [x] Coach overlay slides in/out cleanly

---

## Epic 6 — Session History & Progress

> Tracking improvement over time.

### TT-023 · Session Persistence
**Priority:** P1 · **Status:** `[x]` Done

- [x] Save each completed session to localStorage
- [x] Store: timestamp, question, word, duration, WPM, filler count, scores, strengths, improvements
- [x] Cap stored history at 100 sessions (rolling window)

---

### TT-024 · Session History UI
**Priority:** P1 · **Status:** `[x]` Done

- [x] Display list of past sessions in history panel
- [x] Show key metrics per session (date, mode, WPM, score)
- [x] Expand a session to see full analysis

---

### TT-025 · Aggregate Progress Statistics
**Priority:** P1 · **Status:** `[x]` Done

- [x] Total sessions completed
- [x] Average WPM across sessions
- [x] Average filler word rate
- [x] Average delivery score

---

### TT-026 · Progress Trend Visualization
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Line chart of WPM over last N sessions
- [ ] Line chart of filler word count over time
- [ ] Delivery score trend
- [ ] Use a lightweight charting library (e.g. Chart.js) or Canvas API
- [ ] "Improve since first session" delta callout

---

## Epic 7 — Data Management

> Import/export and data lifecycle.

### TT-027 · Export Data
**Priority:** P2 · **Status:** `[~]` In Progress

- [x] Export button exists in settings panel
- [ ] Serialize session history, custom questions, and custom words to JSON
- [ ] Trigger browser download of `.json` file with timestamp in filename

---

### TT-028 · Import Data
**Priority:** P2 · **Status:** `[~]` In Progress

- [x] Import button exists in settings panel
- [ ] Accept `.json` file upload
- [ ] Validate JSON structure before merging
- [ ] Merge imported sessions without duplicating existing records
- [ ] Surface import result toast (N sessions imported, N skipped)

---

### TT-029 · Clear All Data
**Priority:** P2 · **Status:** `[x]` Done

- [x] "Clear Data" button in settings
- [x] Confirmation dialog before wiping
- [x] Remove all localStorage keys for this app

---

## Epic 8 — Infrastructure & Quality

> Testing, performance, and app reliability.

### TT-030 · Unit Tests — Core Logic
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Set up a test runner (Vitest recommended for zero-config browser-env support)
- [ ] Tests for `speechAnalysis.js`: WPM calculation, filler detection
- [ ] Tests for `audioAnalysis.js`: pace scoring, pause counting
- [ ] Tests for `gameManager.js`: qualification logic, state transitions
- [ ] Tests for `storage.js`: read/write/clear operations

---

### TT-031 · Integration Tests — Session Flow
**Priority:** P3 · **Status:** `[ ]` Todo

- [ ] Simulate a full session: start → timer fires → end → analysis renders
- [ ] Verify session is saved to history after completion
- [ ] Test mode switching updates timer and qualification thresholds

---

### TT-032 · Progressive Web App (PWA)
**Priority:** P3 · **Status:** `[ ]` Todo

- [ ] Add `manifest.json` (name, icons, theme color, display: standalone)
- [ ] Add service worker for offline asset caching
- [ ] App installable from browser address bar
- [ ] Graceful offline message when OpenAI API is unavailable

---

### TT-033 · Accessibility (a11y)
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] All interactive elements keyboard navigable (Tab / Enter / Space)
- [ ] ARIA labels on icon-only buttons
- [ ] Sufficient color contrast on all timer states (WCAG AA)
- [ ] Screen reader announcements for timer milestones and analysis results

---

### TT-034 · Browser Compatibility
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Document minimum supported browser versions in README
- [ ] Graceful degradation message when Web Speech API is not supported (Firefox)
- [ ] Test on Chrome, Edge, Safari — note known limitations per browser
- [ ] Verify MediaRecorder codec fallback works on Safari (mp4)

---

## Epic 9 — Documentation

### TT-035 · Developer README
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Project overview and architecture diagram
- [ ] Module responsibilities table
- [ ] How to run locally (no build step needed — just open index.html)
- [ ] How to configure OpenAI API key
- [ ] localStorage key reference
- [ ] Contributing guide

---

### TT-036 · In-App Onboarding
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] First-launch welcome modal explaining the app in 3 steps
- [ ] Prompt to set OpenAI API key on first visit
- [ ] "Skip" option for returning users
- [ ] Mark onboarding complete in localStorage so it doesn't repeat

---

## Backlog (Unscoped / Future)

| ID | Title | Notes |
|----|-------|-------|
| TT-037 | Multi-language question support | Separate question banks per language |
| TT-038 | AI-generated questions | GPT generates a fresh question each session |
| TT-039 | Structured feedback rubric | Judge-style scoring per Table Topics criteria |
| TT-040 | Shareable session report | Generate a read-only permalink to share analysis |
| TT-041 | Dark mode | CSS custom property toggle, persist preference |
| TT-042 | Audio playback | Play back recorded session audio after completion |

---

## Completion Summary

| Epic | Done | In Progress | Todo | Total |
|------|------|-------------|------|-------|
| 1 · Core Game Loop | 4 | 0 | 0 | 4 |
| 2 · Questions & Content | 4 | 0 | 1 | 5 |
| 3 · Voice Recording | 2 | 0 | 0 | 2 |
| 4 · AI Analysis | 4 | 0 | 1 | 5 |
| 5 · Real-Time Coach | 6 | 0 | 0 | 6 |
| 6 · Session History | 3 | 0 | 1 | 4 |
| 7 · Data Management | 1 | 2 | 0 | 3 |
| 8 · Infrastructure | 0 | 0 | 5 | 5 |
| 9 · Documentation | 0 | 0 | 2 | 2 |
| **Total** | **24** | **2** | **10** | **36** |
