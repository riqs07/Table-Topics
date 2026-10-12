# Design System

**Purpose:** How you control colors, fonts, and feel, and the rules that keep the look in one place.
**Last updated:** 2026-10-12
**Status:** Direction proposed; palette and fonts are chosen at checkpoint C6.

## Direction

VoiceLab should feel like a **private practice notebook**, not a tech dashboard. Calm, warm, one thing at a time. We deliberately avoid the common "generated app" look: default component-kit styling, Inter or Geist fonts, purple gradients, glow, frosted glass, and emoji used as icons.

## Tools

| Tool | Job | Why |
|------|-----|-----|
| Tailwind CSS v4 | Styling | Theme values are CSS variables in one file, so a palette change is one edit |
| React Aria Components | Buttons, dialogs, switches | Accessible and phone-friendly with no visual style of its own |
| Phosphor Icons | Icons | Less common than the default icon sets; has light and regular weights |

## Roles, not raw values

Components never use a raw color, font, or size. They use a **role** (a named purpose), and each theme fills in every role.

| Role | Used for |
|------|----------|
| `paper` | Page background |
| `paper-raised` | Slightly lifted surfaces (sheets, the record panel) |
| `ink` | Main text |
| `ink-muted` | Secondary text, captions |
| `rule` | Thin dividing lines and borders |
| `accent` | The record button and "your one fix" only |
| `accent-ink` | Text placed on the accent |
| `filler` | Filler words in a transcript (soft pencil gray, never red) |
| `focus-ring` | Keyboard focus outline |

Fonts use two roles: `font-body` and `font-display` (headings and the daily prompt).

Tailwind's built-in color palette is switched off, so a class like `bg-blue-500` does not exist. Only role classes such as `bg-paper` and `text-ink` work.

## Starter themes (choose at C6)

| Theme | Feel | Fonts |
|-------|------|-------|
| **Notebook** (recommended) | Warm off-white paper, ink text, one terracotta or deep-green accent; warm charcoal in dark mode | Atkinson Hyperlegible Next (body), Young Serif (display) |
| **Calm studio** | Cool stone grays, one sage accent, minimal | A modern sans for both |
| **Gray** | Neutral grayscale for building screens before a choice is made | System fonts |

Until C6 is answered the app uses **Gray** (the checkpoint default).

## Shape and layout

- Flat surfaces separated by thin rules, not shadowed cards. Modest corner rounding.
- Phone first. One main action per screen, generous spacing.
- Transcripts read like notes; fillers are marked quietly, not as errors.

## Tests that guard this (milestone 2)

- Every theme defines every role.
- Every text/background pair in every theme passes WCAG AA contrast (risk R13).
- No component file contains a raw color value or a built-in Tailwind color class.
