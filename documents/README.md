# VoiceLab Documentation

**Purpose:** One place for every decision about what VoiceLab is, how it is built, and the rules we build by.
**Audience:** A human inspector. Each file is short and can be read on its own.
**Last updated:** 2026-10-29

## What VoiceLab is (30 seconds)

A private, practice-alone app for public speaking. The user answers a topic, rehearses a talk, or works on one skill, gets one specific fix, retries with it, and sees whether it worked.

## Reading order

| # | File | What it answers | Read time |
|---|------|-----------------|-----------|
| 1 | [prd.md](prd.md) | Who is it for, what does it do, what is cut? | 5 min |
| 2 | [architecture/overview.md](architecture/overview.md) | How is it built and how does data flow? | 3 min |
| 3 | [architecture/data-model.md](architecture/data-model.md) | What do we store and where? | 2 min |
| 4 | [architecture/decisions.md](architecture/decisions.md) | Why did we choose each technology? | 2 min |
| 4a | [architecture/performance.md](architecture/performance.md) | How fast are the pages with a year of practice, before and after decisions 98 and 99? | 3 min |
| 5 | [design/design-system.md](design/design-system.md) | How do you control colors, fonts, and feel? | 2 min |
| 5a | [design/art-style.md](design/art-style.md) | How are the blob, scenes, course tiles and videos drawn and animated, and how do you add one that fits? | 5 min |
| 6 | [standards/coding-standards.md](standards/coding-standards.md) | How must code be written and tested? | 3 min |
| 7 | [roadmap.md](roadmap.md) | In what order is it built, and where do you step in? | 3 min |
| 8 | [checkpoints.md](checkpoints.md) | Exactly what do I need from you, and when? | 3 min |
| 9 | [setup-requirements.md](setup-requirements.md) | Which accounts and keys must you set up? | 2 min |
| 10 | [risks.md](risks.md) | What do we expect to go wrong, and what is the plan? | 3 min |
| 11 | [ai-development-playbook.md](ai-development-playbook.md) | What have we learned about building with an AI agent, and which rules carry over to the next project? | 5 min |
| 12 | [plan-public-speaking.md](plan-public-speaking.md) | What is being built next to make VoiceLab a public-speaking app, and in what order? | 6 min |
| 13 | [plan-daily-practice.md](plan-daily-practice.md) | How does today's practice work, and what did the user decide? | 2 min |
| 14 | [content-sources.md](content-sources.md) | Where do the speech texts come from, and how were they checked? | 2 min |
| 15 | [research/ux-research-2026-10.md](research/ux-research-2026-10.md) | What did the UX review and research find, and how strong is the evidence? | 6 min |
| 16 | [design/ux-improvements-plan.md](design/ux-improvements-plan.md) | Which design changes follow from the UX research, in what order? | 4 min |
| 17 | [plan-small-talk.md](plan-small-talk.md) | How will VoiceLab train small talk and storytelling, and what did the user decide? | 6 min |
| 18 | [research/charisma-conversation-duolingo-2026-10.md](research/charisma-conversation-duolingo-2026-10.md) | What does research say about charisma, body language, conversation, and how Duolingo works? | 8 min |
| 19 | [plan-daily-mix-and-connection.md](plan-daily-mix-and-connection.md) | How will the daily mix, the conversation curriculum, missions and learning cards work? | 7 min |
| 20 | [plan-learn.md](plan-learn.md) | What will the Learn cards teach, how are they built, and how do they come back for review? | 8 min |
| 21 | [research/charisma-connection-deep-dive-2026-10.md](research/charisma-connection-deep-dive-2026-10.md) | What builds warmth and connection in conversation, how are these skills trained, and how should text scenario questions work in VoiceLab? | 15 min |
| 22 | [plan-research-applied.md](plan-research-applied.md) | How does the charisma and connection research change the app: missions, feedback, Learn, Connect? | 5 min |
| 23 | [plan-voice-modes.md](plan-voice-modes.md) | What do the voice modes (warm-ups, clear sounds, volume, pitch, tone, pausing, shadowing) do, and where will shadowing audio come from? (Built, decision 80) | 8 min |
| 24 | [plan-storytelling.md](plan-storytelling.md) | How does the Storytelling mode work (prompts, shapes, telling it again, the story coach), and what research is it built on? (Built, decision 92) | 5 min |
| 25 | [plan-weekly-check-in.md](plan-weekly-check-in.md) | How does the weekly check-in work (four fixed parts, when it is due, the comparison, the reminders, storage), and what was not built? (Built, decision 100) | 4 min |
| 26 | [plan-live-conversation.md](plan-live-conversation.md) | How do conversations feel live: turns that end by themselves, faster replies, and what was not approved? (Steps 1 and 2 built, decisions 101 and 102) | 4 min |
| 27 | [handoff/voice-journal-starter.md](handoff/voice-journal-starter.md) | Starting a new voice journal app: what to reuse from VoiceLab, the mistakes to avoid from day one, and what to decide first? (For the next project's AI session) | 10 min |
| 28 | [research/competitors-2026-10.md](research/competitors-2026-10.md) | Who does VoiceLab compete with, where are the holes in the market, who is the ICP, and how should it be pitched? | 15 min |
| 29 | [research/flirting-dynamics-2026-10.md](research/flirting-dynamics-2026-10.md) | What does the science say about flirting (signals, attraction, misreading interest, rejection, myths), how does it relate to deeper connection, and what could VoiceLab teach without a dating persona? | 12 min |
| 30 | [plan-courses.md](plan-courses.md) | How do guided courses work (courses, lessons, parts, the prompt that comes back), what did the user decide, and what is still draft? | 4 min |
| 31 | [plan-launch-and-scale.md](plan-launch-and-scale.md) | What has to change for 1,000 users and the App Store: accounts, the database and cloud storage, security, privacy and retention, licences, cost? (Draft for later) | 10 min |

## Inspector checklist

- Does every feature in the PRD trace to a problem the user actually has?
- Does every code change have a test that was written first? (see standards)
- Does every line of code carry a plain-language comment? (see standards)
- Do the architecture docs still match the code? (they must be updated in the same change)
- Is every open checkpoint either answered or defaulted and flagged? (see checkpoints)
- Does any component contain a raw color or font? (it must not; see design system)
- Has any key been committed or pasted anywhere? (it must not; see setup requirements)
- Did any bug reach the user without a row in the playbook saying why the tests missed it? (it must not; see the AI development playbook)

## Maintenance rules

- Docs change in the same commit as the code they describe.
- Keep each file under about two pages. If it grows, split it.
- Write for a reader who has not seen the code. No jargon without a one-line definition.
