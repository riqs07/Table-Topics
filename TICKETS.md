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

---

## Epic 10 — Storytelling Mode

> Dedicated practice for narrative structure, hooks, emotional resonance, and delivering a story with a clear point.

### TT-043 · Storytelling Question Bank
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] 30+ built-in storytelling prompts in `data.js` under category `storytelling_deep`:
  - Personal anecdote prompts ("Tell me about a time you failed and what you learned")
  - Observation prompts ("Describe a stranger you've never forgotten")
  - Hypothetical narrative prompts ("Walk me through your perfect day")
  - Values-revealing prompts ("Tell a story that says something about who you are")
- [ ] Tag each prompt with sub-type: `personal`, `professional`, `creative`, `values`
- [ ] Difficulty tiered: Easy (happy/fun stories) → Hard (vulnerable, complex, or abstract)

---

### TT-044 · Storytelling Practice Mode
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] Add `STORYTELLING` entry to `PracticeModes` in `practiceModes.js`:
  - Duration: 180s, qualifyTime: 90s, warningTime: 150s
  - Icon: `book-open`, color: `amber`
  - Description: "Structure a personal story with a clear arc and point"
- [ ] Mode only surfaces `storytelling_deep` category questions
- [ ] Pre-session tip card: remind user of setup → conflict → resolution → lesson structure
- [ ] No hard stop — story should end naturally; timer is a guide only

---

### TT-045 · Story Structure Analysis (GPT)
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] Extend `speechAnalysis.js` GPT prompt when mode is `storytelling`:
  - Identify whether story has: **Hook**, **Setup**, **Conflict/Tension**, **Resolution**, **Lesson/Point**
  - Score each structural element present: 0–5 scale
  - Return `missingElements[]` array for elements not detected
- [ ] Overall story structure score (0–100)
- [ ] Flag stories that are purely a list of facts with no narrative arc

---

### TT-046 · Story Analysis Display
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Post-session panel shows story arc breakdown as a visual timeline (Hook → Setup → Conflict → Resolution → Lesson)
- [ ] Each arc element shown as filled (detected) or hollow (missing)
- [ ] "The Point" callout: GPT extracts the core takeaway of the story in one sentence
- [ ] Highlight emotionally vivid language used in the transcript
- [ ] Flag sections that were rushed (high WPM) vs. appropriately paced

---

### TT-047 · Narrative Technique Scoring
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] GPT evaluates presence of:
  - **Sensory details** — sights, sounds, smells, textures invoked
  - **Dialogue** — did user recreate actual speech from the story?
  - **Emotional honesty** — did user express how they felt, not just what happened?
  - **Specificity** — named people, places, dates vs. vague generalities
  - **Stakes** — was it clear why this story mattered?
- [ ] Each technique rated Present / Partial / Missing with a one-line tip

---

### TT-048 · STAR Method Mode
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Sub-mode within Storytelling: "Professional Story (STAR)"
- [ ] Pre-session overlay explains STAR: Situation → Task → Action → Result
- [ ] GPT post-session maps transcript to each STAR component
- [ ] Ideal for interview prep — scores whether the Result was quantified and concrete
- [ ] "Missing STAR components" callout with example phrasing to fill the gap

---

### TT-049 · Story Pacing & Length Feedback
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Detect if story ended before 60s (too brief — likely surface-level)
- [ ] Detect if story exceeded 3 min with no clear resolution (rambling)
- [ ] Flag sections where pace spiked (rushing through important moments)
- [ ] "Slow down here" markers on transcript timeline

---

## Epic 11 — Small Talk & Conversation Simulator

> Interactive two-way conversation practice where GPT plays a social partner. The user speaks; GPT responds as a realistic character in a specific scenario.

### TT-050 · Conversation Simulator Architecture
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] New module `conversationSimulator.js`:
  - Maintains `conversationHistory[]` array of `{ role, content }` pairs
  - `startConversation(scenario)` — seeds GPT with character + scenario system prompt
  - `userTurn(transcript)` — appends user turn, sends to GPT, returns AI response text
  - `endConversation()` — returns full history for analysis
- [ ] GPT character prompt instructs the AI to:
  - Respond naturally and briefly (1–3 sentences, like real small talk)
  - Occasionally ask follow-up questions
  - React authentically (show interest, mild disagreement, curiosity)
  - Never be unnaturally enthusiastic or robotic
- [ ] AI response displayed as text on screen (no TTS required initially)

---

### TT-051 · Scenario Library
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] 8 built-in conversation scenarios, each with a character description and context:

  | Scenario | Character | Context |
  |----------|-----------|---------|
  | Networking Event | Industry peer | Tech/business conference mixer |
  | Coffee Shop | Friendly stranger | Waiting for orders |
  | Work Party | New coworker | First time meeting |
  | First Date | Potential romantic interest | Casual dinner |
  | Neighbor | Just moved in next door | Seeing each other at mailbox |
  | Job Interview (Social) | Hiring manager | Pre-interview small talk |
  | Social Reunion | Old acquaintance | Running into someone after years |
  | Group Dinner | Friend of a friend | Seated next to a stranger |

- [ ] Each scenario stored as `{ id, name, icon, context, characterPersonality, systemPrompt }`
- [ ] Scenario selector UI card before starting conversation mode

---

### TT-052 · Conversation Mode Session Flow
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] Session flow differs from standard mode:
  1. User selects scenario
  2. GPT sends a brief opening line (displayed on screen) — the AI speaks first
  3. User speaks their response (recorded + transcribed via Whisper or Web Speech)
  4. Transcript sent to GPT → AI response generated and displayed
  5. Steps 3–4 repeat until user ends the session
- [ ] Minimum 4 turns to count as a complete session
- [ ] "End Conversation" button available after turn 2
- [ ] Turn counter displayed during session
- [ ] No hard timer — conversation ends when user decides

---

### TT-053 · Conversation Analysis (GPT)
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] Post-conversation, GPT analyzes full transcript with a social intelligence lens:
  - **Question quality** — ratio of open to closed questions asked by user
  - **Reciprocity** — did user share about themselves when appropriate, or only ask?
  - **Topic transitions** — were transitions natural or abrupt?
  - **Listening signals** — did user reference what the AI said in their responses?
  - **Warmth** — tone detected (distant / neutral / warm / over-eager)
  - **Conversation balance** — rough word count ratio (user vs. AI)
- [ ] Overall **Social Flow Score** (0–100)
- [ ] Top 2 strengths, top 2 growth areas
- [ ] "Most natural exchange" highlight — best turn in the conversation

---

### TT-054 · Conversation Analysis Display
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Post-session panel shows full conversation transcript (user turns + AI turns, visually differentiated)
- [ ] Social Flow Score badge
- [ ] Question quality breakdown: N open questions, N closed questions
- [ ] Warmth meter (visual scale)
- [ ] Balance bar showing user vs. AI speaking share
- [ ] "Highlight" card showing the most natural exchange

---

### TT-055 · Small Talk Conversation Starters Bank
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] 40+ small talk topic seeds in `data.js` under category `smalltalk`:
  - Safe openers: weather, environment, current events, shared experience
  - Depth escalators: opinions, preferences, light personal questions
  - Story invitations: "Have you ever...", "What's the most..."
  - Callback questions: follow-ups that show active listening
- [ ] Topics tagged by social risk level: `safe`, `moderate`, `vulnerable`
- [ ] Conversation simulator draws from these when AI needs to introduce a new topic

---

### TT-056 · Conversation Coaching Tips (Real-Time)
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] During conversation mode, show a small live tip card between turns:
  - After 2 closed questions in a row → "Try an open question next (What do you think about...?)"
  - If user turn > 3x longer than AI turn → "You're dominating — invite them to share"
  - If user hasn't asked a question in 3 turns → "Show curiosity — ask them something"
  - If user response is < 10 words → "Give a bit more — build on what they said"
- [ ] Tips are non-blocking (don't pause the session, just appear briefly)

---

### TT-057 · Conversation Difficulty Progression
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Three difficulty tiers that change the AI character's behavior:
  - **Easy** — AI is warm, asks follow-ups, keeps conversation alive
  - **Medium** — AI is neutral, gives short responses, doesn't volunteer information
  - **Hard** — AI is distracted/skeptical, gives one-word answers, user must work to engage them
- [ ] Difficulty selector in scenario picker UI
- [ ] Hard mode tip: "This is great practice — real conversations aren't always easy"

---

## Epic 12 — Conversation Intelligence Analysis

> A shared analysis layer used by both Conversation Simulator and Storytelling modes to score deeper communication skills.

### TT-058 · Question Quality Detector
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Identify questions in user transcript using punctuation + GPT classification
- [ ] Classify each question:
  - **Open** — invites elaboration ("What made you decide that?")
  - **Closed** — yes/no answer ("Did you enjoy it?")
  - **Follow-up** — references something just said ("And how did that make you feel?")
  - **Opinion** — invites personal perspective ("What do you think about...?")
- [ ] Surface counts per type in analysis panel
- [ ] Ideal ratio guidance: >60% open, at least 1 follow-up per 3 turns

---

### TT-059 · Active Listening Signal Detection
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] GPT flags presence of active listening language in user turns:
  - Reflective statements ("So what you're saying is...")
  - Validation statements ("That makes total sense", "I can see why you'd feel that way")
  - Callbacks ("Going back to what you said about...")
  - Emotional labeling ("It sounds like that was frustrating")
- [ ] Count signals per session
- [ ] Score: 0 signals = "Focus on listening", 1–2 = "Good start", 3+ = "Strong listener"

---

### TT-060 · Empathy & Warmth Scoring
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] GPT rates user's overall warmth across the session on a 5-point scale
- [ ] Flag specific cold patterns:
  - Jumping to advice without acknowledging feelings
  - Pivoting to self ("That happened to me too...") without validating first
  - One-word acknowledgments with no follow-through ("Cool.", "Interesting.")
- [ ] Flag specific warm patterns:
  - Named what the other person might be feeling
  - Expressed genuine curiosity
  - Matched emotional energy of the scenario

---

### TT-061 · Monologue / Turn-Balance Detector
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] In conversation mode: track word count per user turn
- [ ] Flag turns where user spoke >3x the AI's previous response length
- [ ] Post-session: display turn length bar chart (user vs. AI per turn)
- [ ] Ideal balance guidance: in small talk, no single turn should exceed ~45 seconds

---

### TT-062 · Topic Transition Quality
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] GPT identifies distinct topics discussed during the conversation
- [ ] Classify each transition: **smooth** (bridged naturally), **abrupt** (topic jumped without connection), **callback** (returned to earlier topic intentionally)
- [ ] Score: >70% smooth or callback transitions = "Natural flow"
- [ ] Tip for abrupt transitions: "Try bridging — connect the new topic to something just said"

---

### TT-063 · Vulnerability & Depth Meter
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Track whether user moved beyond surface-level responses during the session
- [ ] GPT rates depth of self-disclosure on a 3-level scale:
  - **Surface** — facts only (job, location, weather opinions)
  - **Personal** — preferences, experiences, opinions
  - **Vulnerable** — feelings, values, fears, meaningful stories
- [ ] Show depth progression over the conversation (did it deepen or stay flat?)
- [ ] Tip: "Real connection happens when you go from facts → feelings"

---

## Epic 13 — Social Scenario Content

> Question banks and scenario content that powers Epics 10–12.

### TT-064 · Social Scenario Questions
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Add 20+ role-play scenario openers to `data.js` under category `social_scenario`:
  - Icebreaker situations (first day at a job, being introduced to a friend's group)
  - Reconnection situations (running into someone after years)
  - Recovery situations (awkward silence, misunderstanding, saying the wrong thing)
  - Deeper conversation invitations ("I'd love to hear more about that...")
- [ ] Add scenario metadata: `{ difficulty, socialContext, commonMistakes[] }`

---

### TT-065 · Conversation Tip Library
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Create `conversationTips.js` with a curated bank of actionable micro-tips:
  - Categorized by skill: `question_asking`, `active_listening`, `topic_transitions`, `warmth`, `storytelling`
  - Each tip: `{ id, category, tip, example, whenToShow }`
  - 5+ tips per category (25+ total)
- [ ] Tips surfaced contextually in real-time coach and post-session analysis
- [ ] "Tip of the Session" card shown at session end based on the user's weakest dimension

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
| 10 · Storytelling Mode | 0 | 0 | 7 | 7 |
| 11 · Small Talk & Conversation Simulator | 0 | 0 | 8 | 8 |
| 12 · Conversation Intelligence Analysis | 0 | 0 | 6 | 6 |
| 13 · Social Scenario Content | 0 | 0 | 2 | 2 |
| **Total** | **24** | **2** | **33** | **59** |
