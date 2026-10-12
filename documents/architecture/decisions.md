# Architecture Decisions

**Purpose:** Record why each technology was chosen, so a reader can challenge it.
**Last updated:** 2026-10-11

| # | Decision | Why | Revisit when |
|---|----------|-----|--------------|
| 1 | **Next.js with TypeScript** | API routes keep the AI key off the device; one codebase scales into a product | We outgrow serverless routes |
| 2 | **Installable web app (PWA), no native app** | Works on a phone, no app store, fastest to ship | Users ask for reminders iOS web cannot deliver |
| 3 | **Local-first storage (IndexedDB), no accounts** | Privacy matters for a vulnerable activity; no backend to run | Users want sync across devices |
| 4 | **Web Speech API for live transcript, Whisper as fallback** (provisional until spike C5) | Live words on screen feel good and cost nothing; Whisper covers unsupported browsers and later gives word timestamps | Web Speech accuracy proves too low |
| 5 | **Metrics from transcript only** | We only show numbers we can compute reliably | Audio analysis is added for tone and pitch |
| 6 | **Claude Sonnet for session feedback, Claude Opus for weekly summaries** | Sonnet is fast and cheap for short transcripts; Opus was chosen for the weekly view. Likely overkill, so measure it | Weekly summary quality shows no gain over Sonnet |
| 7 | **Model names live in one config file** | Models change; one edit updates everything | Always |
| 8 | **Access passphrase, rate limits, and a provider-side spend limit on every AI route** | A deployed route is public, and counters in server memory do not hold up on serverless hosting, so they need a small shared store | Usage grows past one user |
| 9 | **Vitest, Testing Library, Playwright** | Fast unit tests for logic, component tests for screens, a few end-to-end checks of the full loop | Tests become slow or flaky |
| 10 | **Hosting on Vercel** | Zero-config for Next.js, free tier suits one user | Costs or limits change |
| 11 | **All colors, fonts, and spacing live in theme files; components use named roles only** | You control the look, and a palette change is one file (see design/design-system.md) | Never; this is a principle |
| 12 | **Test the riskiest assumptions first with throwaway spikes on a real phone** | Transcription behavior (risks R1 to R3) can reshape the architecture, so we learn it before building on it | Spike results arrive (C5) |

## Not chosen

- **A server database:** conflicts with the privacy goal and adds ops work.
- **Five-dimension scoring:** transcripts cannot support it honestly (see PRD section 5).
