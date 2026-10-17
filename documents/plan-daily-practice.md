# Plan: today's practice

Agreed with the user on 2026-10-17. Today stops recommending one next step and serves a short practice the app plans each day: two or three steps, about 5 to 10 minutes including listening back, ready to start with one button. Practice and Skills stay for practising anything on your own.

## The steps

| Step | What | Chosen how |
|------|------|------------|
| 1. Warm up | The next one-minute part of the speech being worked through | The speech of the last reading (if it has parts still unread), otherwise the next speech in a starter order; the first part not yet read |
| 2. Skill | A short drill for this week's focus: a lesson, a pause drill, or a practice passage | A list per focus, taken in turn by day |
| 3. On the spot | A Table Topic, an opening or closing drill, or (one day a week) a prepared speech | Taken in turn by day; a talk with a date coming up takes this step |

New users (fewer than three practice days) get two steps: the warm-up and on the spot, which for them is always a Table Topic (short and light; decision 37). The first Table Topic or prepared speech becomes the first recording that progress is measured against.

The plan is worked out from the date and the sessions before today, so it stays the same all day and reopening the app never reshuffles it. A step is done when a session of that kind and prompt was recorded today.

## The flow

- A first visit: the welcome answers (other than "I have a talk coming up") and Skip open step 1 straight away, so the first win comes in about a minute.
- Today shows the steps with done and next marks, the total time, and one button: "Start today's practice", then "Continue: step 2", then a short summary when everything is done.
- Each step is the usual loop: speak, then listen back. The header says "Today's practice, step 2 of 3".
- Listening back comes after every step but never holds the next step back: the main button is "Next: step 3" from the start, and it saves any notes written.
- "Try it again" is offered at every step and never required. A retry stays inside the plan.
- The last step's button is "Finish today's practice", which leads back to Today and its summary.

## Decisions

- Retries: offered, never forced.
- Listening back: after each step, not a gate.
- Replaces "Next for you" on Today (the page will be reworked later).
- Streak: unchanged (any recording counts).
- Reminders: later, nearer an iPhone release.

## Stages

1. The plan itself (`src/core/dailyPlan.ts`) and loading it (`src/data/dailyPlan.ts`), with tests.
2. Today shows the plan.
3. The flow through recording, listening back, retries and the next step; a browser journey through a whole day.
4. Screenshots, design system, decision record.
