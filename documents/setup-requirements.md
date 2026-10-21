# Setup Requirements: Accounts, Keys, and Tools

**Purpose:** Everything only you can set up, when it is needed, and what it costs.
**Last updated:** 2026-10-21 (decision 102)

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
| 6 | **Access passphrase** | M6 | Free | Make a random passphrase of **at least 16 characters**: `openssl rand -base64 24` in a terminal prints a good one (32 characters). Four random words also work, but a made-up phrase is easier to guess. A caller who sends 20 wrong passphrases in an hour is refused for the rest of that hour (decision 87). Put it in `APP_ACCESS_SECRET` (no quotes, and edit `.env.local` in a plain-text editor such as `nano` or VS Code: word processors like TextEdit can turn quotes into curly quotes that become part of the value) and type the same text into the app's Settings page (under "Coach (advanced)", then "Set up the coach"). Settings and `pnpm live-check` both show a short fingerprint of the passphrase; they must match. It gates the AI routes so strangers cannot use them |
| 7 | **Small shared store** for rate limits: **Upstash Redis**, added through the Vercel Marketplace | M6 (needed before deploying) | Free tier | Add the integration in Vercel; it sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Not needed for local use |
| 8 | **Vercel account**, connected to GitHub | M11 | Free tier | Create the project and enter the variables below |
| 9 | **Domain name** | M11, optional | About $10 to $15 per year | Only if you want a custom address |
| 11 | **ElevenLabs account, API key and a voice** | Not needed for the app's fixed lines, which ship as saved recordings (decision 82). Needed for the conversation personas' written lines (decision 84): each line is spoken in that persona's own voice, with ElevenLabs' faster Turbo model unless `CONVERSATION_VOICE_MODEL=v4` (decision 102), streamed sentence by sentence. Without the key their written lines are said by the phone's own voice. The four voices (Brittney, Eddy, Chris, Stacey; ids in `src/content/conversations.ts`) must be in the account's voices for the key to use them; add any that are missing from the Voice Library. Also used later for dynamic feedback | Your ElevenLabs plan (the saved recordings used about 6,000 credits once, and the conversation characters' lines 6,346) | When dynamic lines arrive: create an API key limited to **text to speech**, with a credit limit if you like. Put it in `ELEVENLABS_API_KEY`. Pick a voice in the voice library and put its ID in `ELEVENLABS_VOICE_ID` (not secret). Without them, lines with no saved recording use the phone's own voice |
| 12 | **AssemblyAI account and API key** (deeper analysis, decision 91; optional) | Only if you switch on "Send my recordings for deeper analysis" | Pay per use: about $0.21 to $0.26 an hour of audio plus about $0.05 an hour for keeping "um"s, so under a cent for a two-minute take; the app's cap (40 a day, at most about 16 minutes each) holds the worst day to about $3.60 | Create an account at assemblyai.com, add billing, **set a spend cap / usage alert in the AssemblyAI dashboard**, and (on a paid plan) opt out of model training and set the shortest data-retention time offered. Create a key and put it in `ASSEMBLYAI_API_KEY`. The app deletes each transcript as soon as it has read it. Run `pnpm bakeoff` with about 10 of your own takes to see how many "um"s it keeps (instructions at the top of `scripts/filler-bakeoff.ts`) |
| 13 | **Voice worker hosting** (deeper analysis, decision 91; optional) | Only for the voice measures of deeper analysis | Modal or Google Cloud Run: a few seconds of CPU per take, usually inside the free tier; set a budget alert | Deploy `voice-worker/` as its README says (Cloud Run: `gcloud run deploy … --source .`; Modal: `modal deploy modal_app.py`). Make one random secret of at least 16 characters (`openssl rand -base64 32`) and set it as `VOICE_WORKER_SECRET` on **both** the worker and Vercel. Put the worker's https address in `VOICE_WORKER_URL`. Then run `pnpm analysis-check` locally: it reads the same settings as the app, checks the AssemblyAI key with a free request, and sends the worker a test tone. The optional audEERING model (`ENABLE_AUDEERING=1` on the worker) is **personal use only** (CC BY-NC-SA) |
| 10 | **App icon and name approval** | M2 and M11 | Free | You choose a direction; I can draft options |

## Environment variables

| Variable | Used for | Secret? | Set in |
|----------|----------|---------|--------|
| `ANTHROPIC_API_KEY` | Coach feedback (with its internal rubric), picking a conversation character's next lines (decision 83), and the weekly coach summary on the speaking profile (decision 90; no new setting) | Yes | `.env.local` and Vercel |
| `OPENAI_API_KEY` | Whisper fallback (only if chosen) | Yes | `.env.local` and Vercel |
| `APP_ACCESS_SECRET` | Gate on AI routes | Yes | `.env.local` and Vercel |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `_TOKEN`) | Rate-limit counters | Yes | Vercel (optional in `.env.local`) |
| `ELEVENLABS_API_KEY` | The conversation personas' written lines (decision 84), and lines with no saved recording | Yes | `.env.local` and Vercel |
| `ELEVENLABS_VOICE_ID` | Which ElevenLabs voice says those lines | No | `.env.local` and Vercel |
| `CONVERSATION_MINUTES_PER_MONTH` | Optional (decision 102). Conversation minutes allowed a month, a whole number such as `150` (the default). Each minute of a conversation that asks for a written line counts once; with none left, the people use their recorded lines until the next month (UTC). `0` turns written lines off. Settings shows how many are left. A value that is not a whole number stops conversations with a message naming this setting | No | `.env.local` and Vercel |
| `CONVERSATION_VOICE_MODEL` | Optional (decision 102). Which ElevenLabs model speaks the conversation lines: `turbo` (the default: faster and about half the price) or `v4` (the expressive model the recordings used; try it if Turbo makes the lines sound flat). Anything else stops conversations with a message naming this setting | No | `.env.local` and Vercel |
| `ASSEMBLYAI_API_KEY` | Deeper analysis: the verbatim transcript (decision 91). Optional; without it the transcript part is "not set up" | Yes | `.env.local` and Vercel |
| `VOICE_WORKER_URL` | Deeper analysis: the voice worker's address, `https://…` (`http://localhost…` only locally). Optional | No | `.env.local` and Vercel |
| `VOICE_WORKER_SECRET` | Deeper analysis: the shared secret the worker checks, at least 16 characters; the same value on the worker | Yes | `.env.local`, Vercel and the worker's host |
| `DEV_TUNNEL_HOST` | Development only: the tunnel host name the development server accepts requests from (for example `my-name.trycloudflare.com`; several separated by commas). Empty means none. `pnpm phone` allows Cloudflare quick tunnels by itself while it runs, since their names change every time (decision 87) | No | `.env.local` only |

Rules:

- None of these may start with `NEXT_PUBLIC_`, because that would expose them in the browser.
- Deeper analysis (decision 91) needs neither key to be set: with none, the setting says the server is not set up and nothing is sent. With only one, only that part runs. **Set a spend cap in the AssemblyAI dashboard** and a budget alert on the worker's host before switching it on.
- Set a **monthly spend limit in the Anthropic Console and in ElevenLabs** (a credit limit on the key, or on the plan), not only in our code. The app's own daily caps hold a leaked passphrase to at most about $31 a day, the weekly summary's 3 calls and deeper analysis's 40 included (worked out in `src/config/limits.ts`); the dashboard limit is the stop that holds if something else goes wrong.
- Rotate a key at once if it is ever pasted somewhere by mistake.

## What I cannot do for you

- Create accounts, add payment details, or generate keys.
- Run anything that needs a microphone or your phone.
- Call the live AI or Whisper from my workspace. You run `pnpm live-check` locally (it reads `.env.local`, checks the key and passphrase exactly as the app does, sends three sample sessions, and prints the feedback, timing, and estimated cost) and share the output (never the key). Keys from the Console's API keys page start with `sk-ant-api03-`.
