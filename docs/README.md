# VoiceLab Documentation

**Purpose:** One place for every decision about what VoiceLab is, how it is built, and the rules we build by.
**Audience:** A human inspector. Each file is short and can be read on its own.
**Last updated:** 2026-10-11

## What VoiceLab is (30 seconds)

A private, practice-alone-at-home app that helps people who struggle to speak well become more articulate and outgoing. The user speaks for about a minute, gets one specific fix, retries with it, and sees whether it worked.

## Reading order

| # | File | What it answers | Read time |
|---|------|-----------------|-----------|
| 1 | [prd.md](prd.md) | Who is it for, what does it do, what is cut? | 5 min |
| 2 | [architecture/overview.md](architecture/overview.md) | How is it built and how does data flow? | 3 min |
| 3 | [architecture/data-model.md](architecture/data-model.md) | What do we store and where? | 2 min |
| 4 | [architecture/decisions.md](architecture/decisions.md) | Why did we choose each technology? | 2 min |
| 5 | [design/design-system.md](design/design-system.md) | How do you control colors, fonts, and feel? | 2 min |
| 6 | [standards/coding-standards.md](standards/coding-standards.md) | How must code be written and tested? | 3 min |
| 7 | [roadmap.md](roadmap.md) | In what order is it built, and where do you step in? | 3 min |
| 8 | [checkpoints.md](checkpoints.md) | Exactly what do I need from you, and when? | 3 min |
| 9 | [setup-requirements.md](setup-requirements.md) | Which accounts and keys must you set up? | 2 min |
| 10 | [risks.md](risks.md) | What do we expect to go wrong, and what is the plan? | 3 min |

## Inspector checklist

- Does every feature in the PRD trace to a problem the user actually has?
- Does every code change have a test that was written first? (see standards)
- Does every line of code carry a plain-language comment? (see standards)
- Do the architecture docs still match the code? (they must be updated in the same change)
- Is every open checkpoint either answered or defaulted and flagged? (see checkpoints)
- Does any component contain a raw color or font? (it must not; see design system)
- Has any key been committed or pasted anywhere? (it must not; see setup requirements)

## Maintenance rules

- Docs change in the same commit as the code they describe.
- Keep each file under about two pages. If it grows, split it.
- Write for a reader who has not seen the code. No jargon without a one-line definition.
