# Design System

**Purpose:** How you control colors, fonts, and feel, and the rules that keep the look in one place.
**Last updated:** 2026-10-16
**Status:** Built in milestone 2. **Calm studio with a forest green accent was chosen at C6 (2026-10-12).** All three themes stay on the style page (`/style`) for comparison.

## Direction: the script page (chosen 2026-10-13)

VoiceLab reads like a **printed speech script or a magazine page**, not an app dashboard. It was chosen over a tape-recorder look and a monospaced "instrument" look after the first wireframes read as template-made. One idea is borrowed from the tape recorder: a live level meter while recording.

Rules for every screen:

- **Serif type throughout** (Newsreader). The daily prompt is set like a headline, with a hanging opening quote in the accent.
- **Prose instead of widgets.** Streak, focus, and progress are written as sentences ("Fourth day running."). Numbers appear inside sentences ("From 4.2 to 1.8 fillers a minute."); the one exception is the compact row of numbers on a session's page.
- **Main navigation** (changed 2026-10-16, decision 26): Today · Talks · Practice · Skills · History · Settings. On a phone it is a tab bar fixed to the bottom of the screen, an icon over a small label, the current section filled in the accent. On a computer it is a quiet row of text links above the masthead. It is hidden while recording, counting down, or saving, so a stray click cannot lose a take.
- **A masthead line** on every screen: title in small capitals on the left, an italic note on the right, a solid hairline underneath.
- **Run-in italic headings** ("*What to keep.*") instead of labels above blocks.
- **One full-width action band** for the main action, square-cornered, with the action in large italic. On a phone it is fixed to the bottom of the screen, just above the tab bar, so it is always in reach (`ActionBand`, `ActionButton`; the page leaves room for it). Secondary actions are footnotes above it.
- **Recording looks like recording** (added 2026-10-16). While the microphone is on, the Stop band turns ink (`ActionButton variant="stop"`), a red dot marked "Recording" pulses under the clock (still when the user asks for reduced motion), the clock grows to `text-prompt-xl`, and the timing lamp and level meter are larger. The prompt stays in view above any how-this-works note, so the note never pushes the prompt off a phone screen.
- **A session's page leads with the next step** (added 2026-10-16). Under the headline comes the one change and the cue for the next try, together in a block with a thick accent rule on the left. Then the numbers in one compact row (fillers a minute, words a minute, length, and pauses when measured; `src/core/resultNumbers.ts`). Then the timing notes, the player, and what to keep. The headline sentence still carries the focus number; the row is for glancing.
- **Recordings play from the app's own player** (`src/components/script/Player.tsx`): one large square play button in the accent, a bar to move through the recording, and the time against the length that was saved with the session, because recorded audio often cannot report its own length.
- **Progress you can see at a glance** (added 2026-10-16). Today shows the last seven days as seven squares under the streak sentence, filled in the accent where there was practice, with today outlined (`src/core/weekStrip.ts`). The lessons on Skills read as a path: a filled square with a tick for a lesson done, the number in an accent outline with "Next" above the title for the first lesson not yet done, a quiet outline for the rest, joined by a thin line (`src/core/lessonPath.ts`). The trend on History has a caption saying what it measures, and its first and latest values at either end; a flat trend sits in the middle, not along the top edge.
- **An empty page offers one thing to do**, as a filled button: History's empty state leads to "Record your first session".
- **Tap targets are at least 44 pixels tall on a phone** (added 2026-10-16). Inside a page, use the shared styles in `src/components/script/Buttons.tsx`: `PrimaryLink` (filled accent), `SecondaryLink` (outlined in ink), and `RowLink` (a whole row with a chevron). A browser check measures every control on every main page; links inside running sentences carry `data-inline` and are exempt.
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
| `filler` | Filler words in a transcript: gray text on a faint gray highlight, never red and never underlined (an underline reads as a link) |
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
