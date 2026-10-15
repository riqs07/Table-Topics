# Design System

**Purpose:** How you control colors, fonts, and feel, and the rules that keep the look in one place.
**Last updated:** 2026-10-13
**Status:** Built in milestone 2. **Calm studio with a forest green accent was chosen at C6 (2026-10-12).** All three themes stay on the style page (`/style`) for comparison.

## Direction: the script page (chosen 2026-10-13)

VoiceLab reads like a **printed speech script or a magazine page**, not an app dashboard. It was chosen over a tape-recorder look and a monospaced "instrument" look after the first wireframes read as template-made. One idea is borrowed from the tape recorder: a live level meter while recording.

Rules for every screen:

- **Serif type throughout** (Newsreader). The daily prompt is set like a headline, with a hanging opening quote in the accent.
- **Prose instead of widgets.** Streak, focus, and progress are written as sentences ("Fourth day running."). Numbers appear inside sentences ("From 4.2 to 1.8 fillers a minute.").
- **Main navigation** above the masthead on every screen (added 2026-10-15): Home · Lessons · Library · Rehearse · History · Settings in small type (wrapping to a second line on a narrow phone), the current section in ink without an underline. It is hidden while recording, counting down, or saving, so a stray click cannot lose a take.
- **A masthead line** on every screen: title in small capitals on the left, an italic note on the right, a solid hairline underneath.
- **Run-in italic headings** ("*What to keep.*") instead of labels above blocks.
- **One full-width action band** at the bottom of a screen, square-cornered, with the action in large italic. Secondary actions are footnotes above it.
- **Footnotes** (a thin rule, smaller text) for anything secondary: the weekly challenge, "or choose another", "Listen to your first recording."
- **Left-aligned, square edges, hairline rules.** Lists use dotted leaders like a table of contents.

Never: pill-shaped buttons, uppercase letter-spaced micro-labels, rounded cards with borders, centered stacks of widgets, emoji, gradients, or cheerleading copy. A test fails if the wireframes use pill buttons or uppercase labels.

Type sizes are named in `src/app/globals.css` (`text-footnote`, `text-lede`, `text-running`, `text-cue`, `text-band`, `text-statement`, `text-prompt`); components use the names, not pixel values.

## Tools

| Tool | Job | Why |
|------|-----|-----|
| Tailwind CSS v4 | Styling | Theme values are CSS variables in one file, so a palette change is one edit |
| React Aria Components (added in milestone 7) | Buttons, dialogs, switches | Accessible and phone-friendly with no visual style of its own |
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
| `light-green` | Table Topics timing light from 1:00: the minimum is met |
| `light-yellow` | Table Topics timing light from 1:30: start wrapping up |
| `light-red` | Table Topics timing light from 2:00: finish now (stays on; past 2:30 the lamp gains a heavy ring) |

Fonts use two roles: `font-body` and `font-display` (headings and the daily prompt).

Tailwind's built-in color palette is switched off, so a class like `bg-blue-500` does not exist. Only role classes such as `bg-paper` and `text-ink` work.

## Starter themes

| Theme | Feel | Fonts |
|-------|------|-------|
| **Notebook** | Warm off-white paper, ink text, one terracotta accent; warm charcoal in dark mode | Atkinson Hyperlegible Next (body), Young Serif (display) |
| **Calm studio** (chosen) | Cool stone grays, one forest green accent | Newsreader (an editorial serif) for both |
| **Gray** | Neutral grayscale for building screens before a choice is made | System fonts |

The app uses **Calm studio**. Switching is one line (`DEFAULT_THEME` in `src/theme/themes.ts`).

## Where things live

| File | What it holds |
|------|---------------|
| `src/theme/themes.ts` | **Every color and font stack.** To change the look, edit this one file |
| `src/theme/roles.ts` | The role list and the contrast rules every theme must pass |
| `src/theme/fonts.ts` | Loads the web fonts (downloaded at build time and served from our own site, so no font requests go to Google from the user's phone) |
| `src/theme/themeCss.ts` | Turns the themes into CSS variables, switched by `data-theme` (and `data-mode` to force light or dark) |
| `src/app/globals.css` | Exposes each role to Tailwind (`bg-paper`, `text-ink`, ...) and switches off Tailwind's built-in palette |

Dark mode follows the phone's setting automatically.

## Shape and layout

- Flat surfaces separated by thin rules, not shadowed cards. Square corners.
- Phone first. One main action per screen, generous spacing.
- Transcripts read like notes; fillers are marked quietly, not as errors.

## Tests that guard this

- Every theme defines every role.
- Every text/background pair in every theme passes WCAG AA contrast (risk R13).
- No file in `src/` outside `src/theme/` contains a raw color, a color function, a built-in Tailwind color class, an arbitrary color or font value, or an inline font.
- Page-wide defaults read theme variables directly, so a themed area inside another (like the style page previews) gets its own colors.
