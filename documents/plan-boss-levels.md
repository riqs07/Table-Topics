# Plan: Boss Levels (working name)

**Purpose:** A live voice challenge at the end of a course: a 2 to 3 minute call with the ElevenLabs agent, built to draw out the exact skills the course taught, scored strictly, gated so it costs little and means something.
**Last updated:** 2026-10-31
**Status:** Agreed in outline with the user on 2026-10-31; not built. The name is a placeholder to settle later.

## 1. What the user decided

| Decision | Detail |
|---|---|
| **Name** | "Boss level" for now; a final name later |
| **First three** | Stop freezing, Beyond "good, you?", Explain it simply. Other courses may get one later; not every course needs one |
| **Unlock** | Only after **every lesson** in the course is done |
| **Length** | 2 to 3 minutes, set per boss |
| **The agent has a goal** | Each call is designed to **draw out specific responses** from the user. The agent knows what it is testing for, and the user's answers are scored strictly against it |
| **Losing** | A boss not beaten is locked until **tomorrow** (the next calendar day on the device): it should feel hard |
| **Winning** | A big moment: a celebration, a **badge**, and the course marked complete |

## 2. Why it works

- **Cost is gated and predictable.** At roughly $0.08 a minute for the agent (setup-requirements.md), an attempt costs about $0.20 to $0.30 with the coach's scoring. At most one attempt a day per boss, and only after a whole course, so the live voice feature is exposed without being used at whim.
- **Built on what exists.** The phone-call agent (decision 121) already takes a persona, situation, twist, difficulty, first line and voice per call; caps calls at 300 seconds; keeps nothing; and saves the transcript with times as a conversation for the coach. A boss is new content, a prompt builder, gating, scoring and a celebration, not new plumbing.
- **A known target makes scoring rigorous.** Because the agent sets up each test on purpose ("ask a surprise question now"), the coach knows exactly where to look in the transcript, and the call's times let the app measure things like how fast the user started.

## 3. How a boss level runs

1. **Locked tile** at the end of the course page ("Finish every lesson to unlock"), then **unlocked** once the last part is done.
2. **Briefing** (one screen): who you will meet, the situation, the three goals in plain words, the length, and "One try a day. Beat it to earn the badge." What leaves the device is said, as for every call.
3. **The call**, on the existing call screen: a timer counting down, the three goals as small chips (no live scoring during the call, so it stays a conversation). The user can end at any time.
4. **Scoring:** the transcript (with times) goes to the coach with the boss's tests; the coach answers per test: **hit** or **not yet**, a quote from the user's own words, and one line on why. The phone's own measures add timing and pause words.
5. **Result:**
   - **Beaten:** the celebration (full screen, the blob celebrating, confetti, the badge landing), the badge saved, the course marked complete.
   - **Not yet:** each test with its quote, the one change to try, and "Back tomorrow". No harsh words: the difficulty is in the lock, not the tone.

**What counts as an attempt:** a call that ran at least 60 seconds and was not cut off by a technical failure. A dropped connection, a microphone problem or the vendor being down never costs the day's try.

## 4. The first three bosses

Each boss has a persona, a situation, a length, and **three tests**. Each test pairs an instruction for the agent (the moment it must create) with what the coach checks.

### 4.1 Stop freezing: "The interviewer" (about 2½ minutes)

A friendly but quick radio host doing a "rapid questions" segment: three surprise questions, one after another.

| # | The agent's move | The test |
|---|---|---|
| 1 | Asks a surprise question with no warning, then waits | **Buy a beat:** the first word comes within about 3 seconds (from the call's times), and the first sentence has no "um" or "uh" |
| 2 | Asks an opinion question ("Should school start later?") | **Point first:** the first sentence states a side or an answer, before any reasons |
| 3 | Asks a third question, and lets the user finish without stepping in | **Land it:** the answer ends by restating the point, then stops (no "so yeah", no trailing off), within about a minute |

### 4.2 Beyond "good, you?": "The party" (about 3 minutes)

A stranger at a friend's party, friendly but not pushy, who has one interesting thing going on (just back from building a canoe, say) that they mention only in passing.

| # | The agent's move | The test |
|---|---|---|
| 1 | Opens with "So how's your week been?" | **More than "good":** the answer has one real detail and hands a question back |
| 2 | Drops the hint once, briefly, then moves on ("…anyway, been a busy month") | **Catch the hook:** within the next two turns, the user asks about the hint |
| 3 | Answers the follow-up with real enthusiasm and a detail | **Stay with them:** the user asks at least one more follow-up about it before turning the talk back to themselves (no boomerasking) |

### 4.3 Explain it simply: "The curious skeptic" (2 to 3 minutes)

Someone bright from a different field, at a dinner, genuinely curious and quick to interrupt. Before the call, the user picks what they will explain: their job, or a topic from a short list.

| # | The agent's move | The test |
|---|---|---|
| 1 | "So what do you actually do?" (or "So what is it?") | **One plain sentence:** the first sentence says it without jargon, in words a twelve-year-old would follow |
| 2 | Interrupts on the first term of art ("Wait, what's a pipeline?") | **Make it concrete:** the user explains that term with an everyday comparison or an example |
| 3 | "Okay, but why should I care?" | **The so-what:** the answer names a benefit to a real person, not a feature |

## 5. Rules still to settle

- **What beats a boss.** Recommended: all three tests hit. It is a boss, and the lock until tomorrow makes "not yet" gentle enough. An alternative is two of three, including the boss's key move (test 1 for the interviewer, test 2 for the party, test 2 for the skeptic).
- **A free warm-up.** Recommended: an optional practice round with automatic turns and recorded lines (no live minutes) that never counts as an attempt.
- **Badges.** A badge per boss in the course-tile style (the blob with that boss's prop: the microphone, the party hat, the curious glasses), shown on the profile with the date it was beaten.
- **Difficulty after winning.** Recommended: a "rematch, harder" option using the existing hard difficulty (decision 120), still one a day.
- **When minutes run out.** The monthly call minutes (`LIVE_B_MINUTES_PER_MONTH`) still apply. With none left, the boss says it will be back next month rather than falling back to a weaker mode, so a boss is always a live call.

## 6. How it would be built

| Part | Where | Notes |
|---|---|---|
| The bosses | `src/content/bosses.ts` | Per boss: course id, persona, situation, first line, voice, length, the three tests (agent instruction, coach check, any timing rule) |
| The agent's instructions | `src/core/bossPrompt.ts` | Builds the per-call prompt override from the boss: stay in character, create the three moments in order, keep to the time, never coach during the call |
| Gating and attempts | `src/core/bosses.ts`, saved with the settings | Unlocked when every part of the course is done; one counted attempt a day; the attempt rule in section 3; beaten date and badge |
| Scoring | The conversation coach route, with a boss schema | Per test: hit or not yet, a quote, a reason; the timing test from the call's times on the device |
| Screens | Briefing, the existing call screen, the result | The celebration and the badge drawings follow `design/art-style.md` |
| Tests | Unit tests for gating, attempts and the prompt; screen tests for the briefing, both results and the failure paths (call drops, no minutes) | As every change |

**Later, with accounts:** count attempts on the server, so the daily lock cannot be undone by clearing the browser (today the server's monthly minute caps still protect the bill).
