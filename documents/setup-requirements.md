# Setup Requirements: Accounts, Keys, and Tools

**Purpose:** Everything only you can set up, when it is needed, and what it costs.
**Last updated:** 2026-10-20

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
| 6 | **Access passphrase** | M6 | Free | Invent a passphrase of **at least 16 characters** (for example four random words). Put it in `APP_ACCESS_SECRET` (no quotes, and edit `.env.local` in a plain-text editor such as `nano` or VS Code: word processors like TextEdit can turn quotes into curly quotes that become part of the value) and type the same text into the app's Settings page (under "Coach (advanced)", then "Set up the coach"). Settings and `pnpm live-check` both show a short fingerprint of the passphrase; they must match. It gates the AI routes so strangers cannot use them |
| 7 | **Small shared store** for rate limits: **Upstash Redis**, added through the Vercel Marketplace | M6 (needed before deploying) | Free tier | Add the integration in Vercel; it sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Not needed for local use |
| 8 | **Vercel account**, connected to GitHub | M11 | Free tier | Create the project and enter the variables below |
| 9 | **Domain name** | M11, optional | About $10 to $15 per year | Only if you want a custom address |
| 11 | **ElevenLabs account, API key and a voice** | Not needed for the app's fixed lines, which ship as saved recordings (decision 82). Needed for the conversation personas' written lines (decision 84): each line is spoken in that persona's own voice with `eleven_v4`. Without the key their written lines are said by the phone's own voice. The four voices (Brittney, Eddy, Chris, Stacey; ids in `src/content/conversations.ts`) must be in the account's voices for the key to use them; add any that are missing from the Voice Library. Also used later for dynamic feedback | Your ElevenLabs plan (the saved recordings used about 6,000 credits once, and the conversation characters' lines 6,346) | When dynamic lines arrive: create an API key limited to **text to speech**, with a credit limit if you like. Put it in `ELEVENLABS_API_KEY`. Pick a voice in the voice library and put its ID in `ELEVENLABS_VOICE_ID` (not secret). Without them, lines with no saved recording use the phone's own voice |
| 10 | **App icon and name approval** | M2 and M11 | Free | You choose a direction; I can draft options |

## Environment variables

| Variable | Used for | Secret? | Set in |
|----------|----------|---------|--------|
| `ANTHROPIC_API_KEY` | Coach feedback, and picking a conversation character's next lines (decision 83) | Yes | `.env.local` and Vercel |
| `OPENAI_API_KEY` | Whisper fallback (only if chosen) | Yes | `.env.local` and Vercel |
| `APP_ACCESS_SECRET` | Gate on AI routes | Yes | `.env.local` and Vercel |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `_TOKEN`) | Rate-limit counters | Yes | Vercel (optional in `.env.local`) |
| `ELEVENLABS_API_KEY` | The conversation personas' written lines (decision 84), and lines with no saved recording | Yes | `.env.local` and Vercel |
| `ELEVENLABS_VOICE_ID` | Which ElevenLabs voice says those lines | No | `.env.local` and Vercel |

Rules:

- None of these may start with `NEXT_PUBLIC_`, because that would expose them in the browser.
- Set a spend limit in each provider's own dashboard, not only in our code.
- Rotate a key at once if it is ever pasted somewhere by mistake.

## What I cannot do for you

- Create accounts, add payment details, or generate keys.
- Run anything that needs a microphone or your phone.
- Call the live AI or Whisper from my workspace. You run `pnpm live-check` locally (it reads `.env.local`, checks the key and passphrase exactly as the app does, sends three sample sessions, and prints the feedback, timing, and estimated cost) and share the output (never the key). Keys from the Console's API keys page start with `sk-ant-api03-`.
