# Retros

**Purpose:** One file per piece of work, written so an agent can read every retro and learn from them. A person reads them too, but the shape is fixed for the agent.
**Read with:** [ai-development-playbook.md](../ai-development-playbook.md). Its "Bugs that reached you" table is the short, rule-shaped version; a retro is the whole story of one piece of work.

## How a retro is shaped

Every retro uses the same front matter and the same headings, in this order, so a reader (human or agent) can compare them and pull one section across all of them.

```yaml
---
id: 2026-11-04-ui-rewrite        # date the work started, then a short slug
title: The UI rewrite             # what the work was
dates: [2026-11-04, 2026-11-05]   # first and last day
branch: ui-rewrite                # where the work lives
commits: [4a597af, ea0fd57, 2bd91dd]
outcome: partial                  # done | partial | abandoned
agent: Claude Code                # who did the work with you
sources_read: [...]               # what the agent actually read, in full
sources_skipped: [...]            # what it was given or could have read, and did not
blog: null                        # the post that tells this story, once there is one
---
```

| Heading | What goes in it |
| --- | --- |
| `## Goal` | What was asked, in one or two sentences, in the person's words where possible |
| `## What happened` | The steps in order, each with its outcome |
| `## Went well` | What worked and *why*, one line each |
| `## Went wrong` | Each problem as **what · cause · cost** |
| `## Calls made without asking` | Decisions the agent took on its own, so the person can overrule them |
| `## Rules` | What to do next time, written as imperative rules an agent can follow ("Before X, do Y") |
| `## Open` | What is left, as tasks |

## Rules for writing one

- Facts from the work itself: git, test output, the conversation. A number without a source is left out.
- Causes, not blame. "I read 4 of 18 boards" is useful; "I was careless" is not.
- Every problem ends in a rule, or says why it needs none.
- Keep the person's voice out of it. Their voice belongs in the blog post, which links here.

## Retros

| Date | Retro | Outcome |
| --- | --- | --- |
| 2026-11-04 | [The UI rewrite](2026-11-04-ui-rewrite.md) | partial |
