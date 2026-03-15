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

---

## Epic 14 — The Science: Why This Matters

> Research-backed articles that answer the "why" — grounding every practice feature in real evidence. This is what makes someone believe the app is worth their time before they ever record a word.

### TT-066 · "Learn" Section Navigation
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] Add a **"Learn"** tab to the main app navigation alongside Practice and History
- [ ] Learn section renders a scrollable library of article cards
- [ ] Each card shows: title, category tag, estimated read time, and a one-line summary
- [ ] Articles stored as structured data in `learnContent.js`: `{ id, title, category, readTime, summary, body, researchCitations[], relatedPracticeMode }`
- [ ] Mark articles as "read" in localStorage; show read/unread state on cards
- [ ] Link articles to their related practice mode ("Read this before your next Storytelling session")

---

### TT-067 · Article: The Loneliness Epidemic & Why Social Skills Are a Life Skill
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - The U.S. Surgeon General's 2023 advisory declaring loneliness a public health crisis
  - Cigna's loneliness index: 58% of Americans report feeling lonely
  - **Holt-Lunstad meta-analysis (2010)**: social isolation is as deadly as smoking 15 cigarettes a day — a harder-hitting stat than almost any health message
  - Harvard Study of Adult Development (75+ years, the longest happiness study ever run): the quality of your relationships at 50 is the single strongest predictor of health and happiness at 80
  - The difference between being alone and feeling lonely — and how communication skills close that gap
- [ ] Ends with a clear call to action: "Social skills aren't personality — they're learnable. Start with one conversation."
- [ ] Links to Conversation Simulator mode

---

### TT-068 · Article: The Neuroscience of Storytelling
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - **Paul Zak's research** (Claremont Graduate University): narrative triggers oxytocin release — the trust and empathy hormone. Facts don't. Stories do.
  - **Neural coupling** (Uri Hasson, Princeton): when someone tells a compelling story, the listener's brain activity begins to mirror the speaker's — the mechanism of true connection
  - Why the brain processes stories differently from information: the "transportation effect" — people lose themselves in a story and lower their defenses
  - Why **specificity beats abstraction** — "Sarah, a 34-year-old nurse in Pittsburgh" creates more neural engagement than "a healthcare worker"
  - The "So what?" test: a story without a point wastes the brain's emotional investment
- [ ] Links to Storytelling Mode

---

### TT-069 · Article: Why Small Talk Isn't Small
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - **Sandstrom & Dunn (2014)**: people who talked to strangers (baristas, commuters) reported significantly higher well-being than those who didn't — even when they predicted they wouldn't enjoy it
  - **Epley & Schroeder (2014)**: we systematically underestimate how much strangers will enjoy talking to us and how much we'll enjoy talking to them — the "underestimation of conversation enjoyment"
  - Small talk as a skill progression: it's the on-ramp to every deep relationship you'll ever have. No one skips it.
  - The "weak ties" research (Mark Granovetter): your loose social connections — the people you barely know — are often more valuable for opportunities, ideas, and wellbeing than your close circle
  - How small talk builds social momentum: each brief positive interaction lowers anxiety for the next
- [ ] Links to Conversation Simulator mode (Networking Event scenario)

---

### TT-070 · Article: Active Listening — The Skill No One Taught You
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - Research showing the average person retains only 25–50% of what they hear
  - **Carl Rogers** and client-centered listening: feeling truly heard is a rare and powerful experience — it is the foundation of trust in any relationship
  - The difference between listening to respond vs. listening to understand — and why the former signals low interest
  - **Perceived understanding research**: people rate relationships as more satisfying when they feel their partner genuinely understands them, independent of whether the partner agrees
  - The three levels of listening: Level 1 (hearing words), Level 2 (understanding meaning), Level 3 (picking up on emotion and subtext)
  - Why asking follow-up questions is the single strongest behavioral signal of interest
- [ ] Links to Conversation Intelligence analysis features

---

### TT-071 · Article: Filler Words, Credibility & How Your Brain Betrays You
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - Research on filler word perception: high filler rates correlate with lower perceived competence, lower credibility, and less persuasive impact — even when the content is identical
  - **Why we use fillers**: Brennan & Schober research — fillers are cognitive buying signals (the brain is planning the next sentence). This is normal and human, but the frequency matters.
  - The paradox: pausing feels awkward to the speaker but reads as confidence to the audience. A deliberate 1-second pause is perceived as more authoritative than "um."
  - The difference between written fluency and spoken fluency — and why high-performers practice both
  - The 5% rule: reducing fillers by just 5% produces measurable increases in perceived competence
- [ ] Links to Real-Time Coach filler word feature

---

### TT-072 · Article: Communication Skills & Career — The Data
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - **LinkedIn's Global Talent Trends** (repeated annually): communication is the #1 most in-demand soft skill — above technical skills, above analytical skills
  - **Harvard Business Review**: executives who communicate clearly earn promotions faster and manage higher-performing teams
  - Research on persuasion: people are more persuaded by a confident, clear speaker than by better logical arguments alone (Petty & Cacioppo)
  - The "brilliant jerk" problem: technical skills get you hired, communication skills get you promoted and keep you employed
  - Self-employed and entrepreneur data: clients choose communicators they trust over experts they can't connect with
- [ ] Links to Elevator Pitch and Interview Prep modes

---

### TT-073 · Article: Social Anxiety Is Normal — And You Can Train Through It
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - ~40% of people identify as shy; social anxiety disorder affects 15 million Americans — this is one of the most common human experiences
  - **CBT research**: cognitive reframing is highly effective — the thoughts you have before a social situation ("they'll judge me", "I'll say something stupid") are systematically inaccurate
  - **Exposure therapy evidence**: gradual, repeated low-stakes social exposure reliably reduces anxiety over time — this is the science behind deliberate practice
  - Introversion vs. social anxiety: they are not the same. Introverts can be excellent communicators. Social anxiety is a fear pattern, not a personality type.
  - **Approach vs. avoidance motivation** research: every time you avoid a social situation, the anxiety grows. Every time you approach it, even imperfectly, it shrinks.
  - Reframe: you are not "bad at socializing" — you are undertrained. Every expert was once a beginner.
- [ ] This article appears in onboarding for users who identify as shy or introverted
- [ ] Links to Easy difficulty Conversation Simulator

---

## Epic 15 — Skill Playbooks: How to Actually Do It

> Step-by-step practical guides for each major communication skill. Short, actionable, memorable. These are the "how" to complement the science's "why."

### TT-074 · Playbook: The Small Talk Playbook
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] Content covers these frameworks with examples and practice prompts for each:
  - **The Conversation Arc**: Surface → Personal → Meaningful. Small talk is not the destination — it's the ramp. Most people stay on the surface forever. Moving up the arc is the skill.
  - **FORD Method**: Family, Occupation, Recreation, Dreams — four reliable topic anchors that work in almost any social context
  - **Topic Threading**: when someone mentions something in passing ("I just got back from..."), that's a thread — pull it. The best conversationalists always pull threads.
  - **The Gift of Go First**: share something slightly personal first — it gives the other person permission to match your depth. Vulnerability is contagious.
  - **The One-Question Rule**: never fire two questions back-to-back. Ask one, listen fully, respond to the answer, then ask another.
  - **Exiting Gracefully**: how to end a conversation without it feeling abrupt — the bridge ("I want to grab food but it was great meeting you"), the callback ("I'll let you get back to..."), the future ("Let's connect — I'd love to hear more about that")
- [ ] Each framework has a one-sentence summary card + a 3-line "try this now" exercise
- [ ] Links directly to Networking Event and Coffee Shop conversation scenarios

---

### TT-075 · Playbook: The Storytelling Playbook
**Priority:** P0 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - **The 5-Part Story Arc**: Hook → Setup → Conflict/Tension → Resolution → The Point. Every story that lands follows this or a variation of it.
  - **The Hook**: your first sentence determines whether anyone listens. Three types of hooks: the intriguing statement ("I once got lost in a city with no phone and $3"), the bold opinion, the vivid scene-setting detail.
  - **The Conflict is the Story**: without tension there is no story — there is only a report. The conflict doesn't need to be dramatic. A small obstacle is enough.
  - **Show, Don't Tell**: "I was nervous" is flat. "My hands were shaking and I rehearsed the first sentence seventeen times" is a story.
  - **The Point**: before you tell any story, ask yourself "what is this story about?" If you can't answer in one sentence, it's not ready to tell.
  - **The STAR Method** for professional contexts: Situation, Task, Action, Result — with emphasis on quantifying the Result
  - **Story length calibration**: social (60–90s), professional (90–120s), presentation (2–3 min). Most people tell 3x too much setup and rush the resolution.
- [ ] "Story Workshop" prompt at bottom: user picks a personal story and runs it through the 5-part arc checklist before recording
- [ ] Links to Storytelling practice mode

---

### TT-076 · Playbook: The Active Listening Playbook
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - **The HEAR Framework**: Halt (stop what you're doing), Engage (eye contact, open body), Anticipate (assume they have something valuable to say), Reflect (feed back what you heard)
  - **Reflective Listening phrases**: "So what you're saying is...", "It sounds like...", "If I understand correctly..." — why these work and when to use them
  - **Emotional Labeling**: naming what someone seems to be feeling before giving advice. "It sounds like that was really frustrating" does more relational work than "here's what I'd do."
  - **The Follow-Up Question**: the single most powerful listening signal. It proves you heard them. It shows you care. "What happened after that?" or "How did that make you feel?"
  - **The 80/20 rule** in conversations where someone needs to be heard: listen 80%, speak 20%.
  - **What NOT to do**: finishing sentences, pivoting to your own story immediately, checking your phone, giving unsolicited advice, one-upping
- [ ] Links to Conversation Simulator with a note: "In your next session, aim for at least 2 reflective statements"

---

### TT-077 · Playbook: Asking Better Questions
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - **Open vs. Closed**: closed questions close doors ("Did you like it?"), open questions open them ("What was that like for you?")
  - **The Follow-Up Question**: the most underused tool in conversation. "And then what happened?" "How did you feel about that?" "What made you decide that?"
  - **Opinion Questions**: inviting someone's perspective signals respect. "What do you make of that?" "I'm curious what you think about..."
  - **The Iceberg Question**: most people answer the surface of a question. A great follow-up digs to what's underneath.
  - **Question stacking (avoid)**: firing multiple questions before the person can answer. Choose one. The best one.
  - **Curious vs. interrogative tone**: the same question lands differently depending on tone. Practice genuine curiosity — it is audible.
  - 20 example open questions sorted by social context: casual, professional, first meeting, reconnecting
- [ ] Links to Question Quality Detector in analysis panel

---

### TT-078 · Playbook: Social Confidence — Rewiring the Inner Monologue
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - **The spotlight effect** (Gilovich et al.): people think others are watching and judging them far more than they actually are. Everyone is mostly thinking about themselves.
  - **Cognitive reframing**: replace "they'll think I'm weird" with "most people are glad someone talked to them" — backed by the Epley/Schroeder research from TT-069
  - **The "just as nervous" reminder**: in any social situation, assume the other person is at least as anxious as you. This changes the dynamic from performance to connection.
  - **The 3-second rule**: when the urge to speak arises, act within 3 seconds before the inner critic takes over (Mel Robbins 5-second rule, adapted for social contexts)
  - **Preparation as confidence**: knowing your conversation anchors (FORD), having 2-3 go-to stories, having opening lines ready — reduces the cognitive load that fuels anxiety
  - **Identity shift**: from "I'm an introvert / I'm bad at this" → "I'm someone who is practicing this skill." Behavior follows identity.
- [ ] Links to Easy difficulty scenarios and Social Anxiety article (TT-073)

---

### TT-079 · Playbook: Recovering From Social Awkwardness
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Content covers:
  - **The awkward silence**: it is almost never as long as it feels. The skill is to be comfortable enough to let it breathe, or to have a bridging line ready ("So how do you know [host]?" / "What do you do outside of work?")
  - **When you say the wrong thing**: acknowledge quickly, don't over-apologize, move forward. "That came out wrong — what I meant was..." is graceful. Spiraling is not.
  - **When someone doesn't respond warmly**: it is almost never about you. Mood, distraction, bad day. Don't internalize. Move the conversation, or move on.
  - **The graceful exit from a boring conversation**: "I want to let you mingle" / "I'm going to grab a drink but it was great talking to you" — kind, clear, non-awkward
  - **When you blank on someone's name**: own it with lightness. "I'm so sorry — your name has escaped me." People respect honesty more than a pretend-I-remember spiral.
- [ ] Links to Hard difficulty Conversation Simulator scenarios

---

## Epic 16 — Personalized Learning Path

> Connect the educational content to the practice data. The app should know what the user struggles with and guide them through a structured path — not just random drills.

### TT-080 · Communication Skills Assessment
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] 10-question self-assessment quiz shown to new users (and available on demand):
  - Questions across 5 skill dimensions: small talk, storytelling, active listening, public speaking, social confidence
  - Each answer maps to a skill rating: Needs Work / Developing / Strong
  - Example: "When meeting someone new, do you find it easy to keep the conversation going?" → maps to small talk confidence
- [ ] Results stored in localStorage as `skillProfile { smallTalk, storytelling, activeListening, delivery, confidence }`
- [ ] Assessment results page shows skill radar chart (5-axis spider diagram)
- [ ] "Your starting point" framing — not a judgment, a baseline

---

### TT-081 · Personalized Curriculum Generator
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Based on skill profile, generate a prioritized learning path:
  - Weakest skill → read the relevant science article first → then read the playbook → then do 3 practice sessions
  - Next weakest skill → repeat
- [ ] Curriculum displayed as a visual roadmap: Step 1 (Read) → Step 2 (Practice) → Step 3 (Review progress)
- [ ] Each step marked complete when: article marked read + N practice sessions logged
- [ ] Curriculum regenerates if skill profile improves significantly

---

### TT-082 · "Today's Focus" Dashboard Card
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Home screen shows a "Today's Focus" card:
  - One concept (pulled from the learning path) with a 2-sentence summary
  - One recommended practice session (mode + duration)
  - One specific micro-goal ("Try asking at least 2 open questions today")
- [ ] Focus refreshes daily
- [ ] Dismissable — user can say "already practiced today" to log it without opening a session
- [ ] Streak indicator: N days in a row with a completed focus

---

### TT-083 · Article ↔ Practice Linking
**Priority:** P1 · **Status:** `[ ]` Todo

- [ ] Every article has a "Practice This Now" button at the bottom that launches the most relevant mode
- [ ] Post-session analysis panel has a "Learn More" link to the article most relevant to the user's weakest metric that session
  - Low question quality → links to Asking Better Questions playbook
  - High filler rate → links to Filler Words article
  - Missing story arc → links to Storytelling Playbook
  - Low warmth score → links to Active Listening playbook
- [ ] This creates a closed feedback loop: practice → see weakness → read the why/how → practice again

---

### TT-084 · Skill Progress Over Time
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Track each of the 5 skill dimensions over sessions (not just overall WPM)
- [ ] Each post-session analysis maps results to skill dimensions and updates running averages
- [ ] Progress screen shows per-skill trend charts (sparklines per dimension)
- [ ] "Most improved" callout: the skill that has moved the most since the user's first session
- [ ] "Still developing" callout: the skill with the least improvement — links to its article and playbook

---

### TT-085 · Milestone & Achievement System
**Priority:** P2 · **Status:** `[ ]` Todo

- [ ] Milestones trigger on meaningful events — not arbitrary points:
  - **"First Story Told"** — complete first Storytelling session
  - **"Conversation Starter"** — complete first Conversation Simulator session
  - **"Thread Puller"** — score 3+ follow-up questions in a single conversation session
  - **"The Pauser"** — complete a session with 0 filler words
  - **"Deep Diver"** — reach Vulnerable depth level in a Conversation session
  - **"Consistent"** — 7-day practice streak
  - **"Well-Read"** — read all 7 science articles
  - **"Polyglot of Modes"** — complete a session in every practice mode
- [ ] Milestone notification toast on unlock
- [ ] Milestone gallery in profile/progress screen
- [ ] Milestones are descriptive achievements, not gamification points — each milestone explains why it matters

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
| 14 · The Science: Why This Matters | 0 | 0 | 8 | 8 |
| 15 · Skill Playbooks | 0 | 0 | 6 | 6 |
| 16 · Personalized Learning Path | 0 | 0 | 6 | 6 |
| **Total** | **24** | **2** | **53** | **79** |
