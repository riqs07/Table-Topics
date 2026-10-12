# Setup Requirements: Accounts, Keys, and Tools

**Purpose:** Everything only you can set up, when it is needed, and what it costs.
**Last updated:** 2026-10-11

## Rule for keys

**Never paste a key into this chat.** You put keys in two places yourself: a local file named `.env.local` (never committed) and the hosting dashboard's environment settings. I only refer to variable names. The repo contains `.env.example` with names and no values, and the app fails with a clear message if a required variable is missing (this is tested).

## What you need to set up

| # | Item | Needed by | Cost | What to do |
|---|------|-----------|------|------------|
| 1 | **GitHub account and a private repo** | M0 | Free | Create an empty private repo. We decide at C1 how code gets from my workspace to you |
| 2 | **Current Node.js LTS and pnpm** on your computer | M0, if you run the app locally | Free | Install and confirm versions |
| 3 | **A real phone for testing** | M1 | Free | Tell me iPhone or Android and which browser you use. Several risks depend on this |
| 4 | **OpenAI API account** (for Whisper transcription) | M1 optional, M5/M10 if Whisper is chosen | Pay per use, small | Create an account, add billing, set a monthly spend limit, create a key |
| 5 | **Anthropic API account** (Anthropic Console) | M6 | Pay per use, about a cent or two per session (to be verified) | Create a Console account, add billing, set a monthly spend limit, create a key. The Claude chat subscription does **not** include API access; the API is billed separately |
| 6 | **Access passphrase** | M6 | Free | Invent a long passphrase. It gates the AI routes so strangers cannot use them |
| 7 | **Small shared store** for rate limits (a free-tier key-value store, for example through Vercel) | M6 | Free tier | Add the integration when we reach M6. The provider names its own variables |
| 8 | **Vercel account**, connected to GitHub | M11 | Free tier | Create the project and enter the variables below |
| 9 | **Domain name** | M11, optional | About $10 to $15 per year | Only if you want a custom address |
| 10 | **App icon and name approval** | M2 and M11 | Free | You choose a direction; I can draft options |

## Environment variables

| Variable | Used for | Secret? | Set in |
|----------|----------|---------|--------|
| `ANTHROPIC_API_KEY` | Coach feedback | Yes | `.env.local` and Vercel |
| `OPENAI_API_KEY` | Whisper fallback (only if chosen) | Yes | `.env.local` and Vercel |
| `APP_ACCESS_SECRET` | Gate on AI routes | Yes | `.env.local` and Vercel |
| Store variables (names set by the provider) | Rate-limit counters | Yes | `.env.local` and Vercel |

Rules:

- None of these may start with `NEXT_PUBLIC_`, because that would expose them in the browser.
- Set a spend limit in each provider's own dashboard, not only in our code.
- Rotate a key at once if it is ever pasted somewhere by mistake.

## What I cannot do for you

- Create accounts, add payment details, or generate keys.
- Run anything that needs a microphone or your phone.
- Call the live AI or Whisper from my workspace. You run a live-check script locally and share the result (never the key).
