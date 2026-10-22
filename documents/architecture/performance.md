# Performance at a year of practice

**Purpose:** What VoiceLab's pages cost with a lot of saved practice, measured before and after decisions 98 and 99, so the next change can be checked against the same numbers.
**Last updated:** 2026-10-22 (decisions 98, 99 and 111)

## How it was measured (read this first)

- **Emulated, not a real phone.** Headless Chromium (Playwright 1.64) with phone emulation: 390 × 844 at 3×, touch, an Android Chrome user agent, the CPU slowed 4× and the network set to "slow 4G" (150 ms round trip, 1.6 Mbps down), the service worker's own fetches slowed too. No iPhone and no Safari were measured: WebKit's IndexedDB, its structured clone and an iPhone home-screen app's memory limit all differ, so the real-phone numbers will differ. The ratios between before and after are the dependable part, not the milliseconds.
- **Warm loads**: the service worker installed and its cache full. Medians of 3 runs at one year, 2 at 5,000 sessions.
- **Data:** a generated year of practice: 1,500 takes (mean 95 s), 1,185 analyses, 267 stories, 120 Learn cards read; and a stress set of 5,000 takes over about three years. Loudness and pitch ten times a second and a time for every word, as the app records them. The same takes before and after; after, they are stored as the app now stores them in steady state (readings kept for the last 30 days, recordings for the last 14).
- **Before** is commit `1af0c89`; **after** is the end of this series. The harness is the one from the October 2026 performance audit (its `scale.mjs`, `loads.mjs` and `bundles.mjs`), adapted to the new layout.
- "Data ready" is the last change to the page before 1.5 s of quiet with no database request open. TBT (total blocking time) sums each long task's time beyond 50 ms after the first paint. "Longest task" is the single longest main-thread task: the page cannot respond during it. "Full reads" are reads of a whole collection.

## Page loads

### One year (1,500 takes)

| Page | Before: data ready / LCP / TBT / longest task / heap | After | Full reads, before → after |
|---|---|---|---|
| Today | 2,821 / 2,788 / 1,098 / 542 ms / 68 MB | **817 / 752 / 39 / 84 ms / 11 MB** | sessions ×3 (2.8 s) → ×2 (0.3 s) |
| History | 3,691 / 3,268 / 2,442 / 834 ms / 55 MB | **785 / 736 / 54 / 76 ms / 12 MB** | sessions ×2 (2.2 s) → ×1 (0.2 s) |
| Profile | 5,546 / 532 / 3,461 / 862 ms / 66 MB | **2,136 / 380 / 1,239 / 831 ms / 19 MB** | sessions ×3, analyses ×2 (5.9 s) → sessions ×1, analyses ×1 (0.8 s) |
| Stories | 2,764 / 584 / 1,520 / 500 ms / 69 MB | **1,537 / 476 / 608 / 264 ms / 13 MB** | sessions ×2 (2.4 s) → ×1 (0.15 s) |
| A take's page | 2,927 / 2,160 / 788 / 437 ms / 41 MB | **1,402 / 636 / 44 / 73 ms / 11 MB** | sessions ×2 (1.3 s) → ×1 (0.09 s) |

First paint fell from about 280 ms to about 120 ms on every page, because the service worker now answers from the saved page at once (decision 99) instead of waiting for the network.

### 5,000 takes

| Page | Before: data ready / TBT / longest task / heap | After |
|---|---|---|
| Today | ≥692* / 3,739 / 2,006 ms / 201 MB | **1,036 / 220 / 153 ms / 6 MB** |
| History | 10,278 / 10,338 / 5,258 ms / 213 MB | **859 / 99 / 101 ms / 17 MB** |
| Profile | ≥672* / 6,113 / 2,846 ms / 207 MB | **4,937 / 3,976 / 2,509 ms / 54 MB** |
| Stories | 5,226 / 3,475 / 1,734 ms / 206 MB | **1,780 / 754 / 329 ms / 17 MB** |
| A take's page | 5,380 / 2,455 / 1,355 ms / 109 MB | **1,477 / 84 / 98 ms / 18 MB** |

\* The page was frozen long enough that the probe called it settled early; a lower bound.

**Still slow at 5,000:** the profile. Its reads are now small, but working out the profile itself (`buildProfile` over 3,915 analyses) is a 2.5 s task. Not fixed here; a worker or a stored summary per family would fix it.

## Interactions

| | 1 year: before → after | 5,000: before → after |
|---|---|---|
| History: tap a filter (event duration) | 616 ms → **56 to 72 ms** | 10,256 ms → **88 to 104 ms** |
| Today → Practice from the tab bar, until the data shows | 1,461 ms → **327 ms** | 4,305 ms → **426 ms** |
| Export my data: time / file / longest task | 8.6 s / 79.9 MB / 5.9 s → **1.9 s / 11.5 MB / 0.48 s** | 39.5 s / 262 MB / 32.7 s → **4.2 s / 35.4 MB / 1.2 s** |
| Import that file into an empty browser | 18.9 s → **2.6 s** | 57.7 s → **8.8 s** |
| Import it again over the same data | 18.5 s → **2.5 s** | 64.6 s → **7.5 s** |
| Profile when every analysis must be worked out again: time / TBT | 40.5 s / 3.7 s → **18.3 s / 0.7 s** | 129 s / 11.3 s → **54 s / 2.7 s** |
| Moving a year of takes from the old layout (decision 98), once, in the background | n/a | **17.3 s** for 1,500 takes, longest task 0.57 s (1 year only) |

The re-measuring row is not like for like: after, takes older than 30 days have no readings, so they are measured from the transcript alone (decision 98 keeps an existing analysis instead; the harness deleted every analysis to force the worst case).

## Download (first-load JavaScript per route, gzip KB, from each prerendered page's script tags; the polyfill only old browsers fetch is left out)

| Route | Before | After |
|---|---|---|
| Shared by every page | 210.1 | **135.5** |
| `/` Today | 250.7 | **187.2** |
| `/practice` | 272.6 | **211.0** |
| `/learn` | 294.1 | **222.5** |
| `/learn/card` | 289.5 | **219.5** |
| `/stories` | 227.2 | **178.6** |
| `/history` | 256.7 | **197.3** |
| `/profile` | 229.4 | 228.9 |
| `/sessions` (a take) | 275.6 | 278.2 |
| `/session` (recording) | 329.8 | **291.7** |
| `/settings` | 252.4 | 247.0 |

The shared part fell by 75 KB because the background work (the coach request with zod, the analysis engine, the small-talk content) is loaded only when the page is idle (decision 99). A take's page grew 2.6 KB (the star and the readings join). **Precache:** 87 files → 85, and the fonts saved at install fell from 13 files (about 750 KB) to the 2 the pages use (about 100 KB); but the build's scripts in all grew from 997 to 1,186 KB gzip (71 → 82 files), because the bundler copies shared content into each lazily loaded piece. The install still downloads less overall (about 1.75 MB → 1.3 MB), and an update now downloads only the files that changed.

### Pitch with your words (decision 111)

Measured the same way (gzip KB of each prerendered page's first-load scripts), before and after, on one build each:

| Route | Before | After |
|---|---|---|
| Shared by every page | 146.7 | 146.6 |
| `/sessions` (a take) | 281.0 | **282.5** |
| `/sessions/voice` (phrase rows, new) | n/a | 191.8 |
| `/session` (recording) | 296.0 | 296.3 |
| `/voice/drill` | 175.2 | 176.1 |
| `/voice/shadow` | 175.6 | 176.1 |
| `/check-in/compare` | 197.7 | 200.0 |
| All built scripts | 1,133.7 | 1,221.1 |

The take's page grows 1.5 KB because the voice section, the planned-stress card and the last-try card load only after the page is up, and only for takes that show them; the phrase rows are their own page. A first version that loaded them with the page added 9.6 KB, so they were split out. The model voice's pitch for shadowing (about 6 KB of numbers) loads with the comparison, after the first take. The readings are read only where these views draw them, and each take's phrases are worked out once (memoised); the phrase rows draw 40 phrases at a time.

## Storage

| | 1 year: before → after | 5,000: before → after |
|---|---|---|
| IndexedDB without audio | about 16 MB → **about 6 MB** | about 65 MB → **about 18 MB** |
| Recordings kept | 34 recordings, 12.2 MB → 58 recordings, 22.7 MB | 31, 11.2 MB → 55, 18.9 MB |

The recordings row is worth reading twice: at this data's pace (about four takes a day) the last 14 days hold more takes than the old "newest 30 plus first takes" rule. Audio no longer grows with the number of prompts practised, but it does grow with how much someone practises in a fortnight; 7 days halves it.

## What this does not show

- A real iPhone: memory (a 262 MB export string was the crash risk; it is now written in parts and is about 35 MB), Safari's IndexedDB speed, and whether the home-screen app keeps its storage.
- A cold first visit; this pass measured warm loads.
- A machine to itself: the runs shared four cores with nothing else this time, but timing in emulation varies run to run by 10 to 20%.
