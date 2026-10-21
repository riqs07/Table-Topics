# VoiceLab voice worker

A small Python service that measures the voice in one recording and returns numbers. It is part of VoiceLab's deeper analysis (decision 91 in `documents/architecture/decisions.md`). The VoiceLab server calls it; the phone never does.

**Nothing is stored.** The recording is held in memory for the request, converted through ffmpeg pipes (no temporary files), measured, and dropped. The reply is numbers only. The worker writes no logs about the audio.

## What it measures

| Field | What it is | How |
|---|---|---|
| `jitter_local_pct` | Pitch wobble from one vocal-fold cycle to the next, % | Praat "Get jitter (local)", standard settings (0.0001, 0.02, 1.3) on a cross-correlation point process, 75 to 600 Hz |
| `shimmer_local_db` | Loudness wobble from cycle to cycle, dB | Praat "Get shimmer (local_dB)", standard settings (…, 1.3, 1.6) |
| `hnr_db` | Harmonics-to-noise ratio, dB | Praat cross-correlation harmonicity, averaged over voiced frames |
| `alpha_ratio_db` | Energy 1–5 kHz against 50 Hz–1 kHz, dB | Per voiced 25 ms frame (librosa STFT), averaged. eGeMAPS definition; usually negative; higher = more vocal effort |
| `hammarberg_db` | Strongest peak 0–2 kHz against strongest 2–5 kHz, dB | Per voiced frame, averaged; usually positive; smaller = more effort |
| `creak_pct` | Share of voiced time in creak (vocal fry), % | **Heuristic**, see below |
| `syllables`, `speech_rate_sps`, `articulation_rate_sps` | Syllable count, syllables per second over the whole take and over sounding time | de Jong and Wempe (2009) syllable nuclei, see below |
| `f0` | Median, 10th and 90th percentile pitch (Hz), range and spread (semitones) | Praat autocorrelation pitch, 75 to 600 Hz. Kept by the app as raw data; the phone's own pitch measures are not replaced |
| `emotion` | audEERING arousal, dominance, valence, or `null` | **Optional, personal use only**, see below |

Every voice measure is `null` when the take has less than a fifth of a second of voice.

**Creak heuristic.** A second pitch track with a 30 Hz floor finds voicing the ordinary track (75 Hz floor) misses. A voiced 10 ms frame counts as creaky when its pitch is under 60% of the speaker's median pitch, or under 85% of it while that frame's harmonics-to-noise ratio is below 5 dB. Pitch-halving errors land here too, so treat the number as a trend against your own takes, never a diagnosis. Creak is disputed as a fault in the research (see `documents/research/speech-analysis-2026-10.md`).

**Syllable nuclei.** Intensity every 10 ms (50 Hz minimum pitch). Silence threshold: 25 dB under the 99th percentile. Sounding stretches: above the threshold, silences under 0.3 s bridged, sounds under 0.1 s dropped. A syllable is an intensity peak above the threshold that falls at least 2 dB before the next peak, inside a sounding stretch, where Praat finds voicing. Speech rate divides by the whole take; articulation rate by the sounding time.

## The route

- `POST /analyse`: the recording as the body, with its `Content-Type` (`audio/webm`, `audio/mp4`, `audio/ogg`, `audio/wav`…), and the shared secret in `X-Worker-Secret`. Replies `200` with the numbers, `401` for a wrong or missing secret, `503` when the worker has no secret (or one under 16 characters), `413` over the size cap or 30 minutes, `415` when ffmpeg cannot read it, `400` when empty or under half a second.
- `GET /health`: `{ ok, version, emotion }`. No secret, no data.

The secret is compared in constant time (`secrets.compare_digest`).

## Settings

| Variable | Meaning |
|---|---|
| `VOICE_WORKER_SECRET` | Required. At least 16 characters; the same value as `VOICE_WORKER_SECRET` on the VoiceLab server (Vercel). `openssl rand -base64 32` makes a good one |
| `VOICE_WORKER_MAX_BYTES` | Largest upload, default 8,000,000 (the VoiceLab server itself sends at most 4,000,000) |
| `ENABLE_AUDEERING` | `1` loads the optional audEERING model. Anything else, or unset: off |
| `PORT` | Port to listen on (set by Cloud Run; default 8080 in the image) |

## Run and test locally

```sh
cd voice-worker
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt      # ffmpeg must be installed too (brew install ffmpeg / apt install ffmpeg)
pytest                                    # synthetic voices; the audEERING test is skipped unless ENABLE_AUDEERING=1
VOICE_WORKER_SECRET="$(openssl rand -base64 32)" uvicorn app.main:app --port 8080
```

Then, in VoiceLab's `.env.local`: `VOICE_WORKER_URL=http://localhost:8080` and the same `VOICE_WORKER_SECRET`. `pnpm analysis-check` (in the app folder) checks the settings and that the worker accepts the secret.

## Host it

It needs about 1 GB of memory (2 GB with audEERING) and a few seconds of CPU per take. It scales to zero between takes on both hosts below.

### Google Cloud Run

```sh
cd voice-worker
gcloud run deploy voicelab-voice-worker \
  --source . --region europe-west1 \
  --memory 1Gi --cpu 1 --timeout 300 --concurrency 2 --max-instances 2 \
  --allow-unauthenticated \
  --set-secrets VOICE_WORKER_SECRET=voicelab-worker-secret:latest
```

- Create the secret first: `printf '%s' "$(openssl rand -base64 32)" | gcloud secrets create voicelab-worker-secret --data-file=-` (and give the Cloud Run service account the Secret Accessor role).
- `--allow-unauthenticated` lets VoiceLab's server reach it over HTTPS; the shared secret is what keeps others out. `--max-instances 2` caps the cost.
- The printed service URL goes into `VOICE_WORKER_URL` in Vercel.
- Set a budget alert in Google Cloud Billing.

### Modal

`modal_app.py` wraps the same app:

```sh
pip install modal && modal setup
modal secret create voicelab-worker VOICE_WORKER_SECRET="$(openssl rand -base64 32)"
cd voice-worker && modal deploy modal_app.py
```

The printed `https://…modal.run` address goes into `VOICE_WORKER_URL`, and the same secret into `VOICE_WORKER_SECRET` in Vercel. Set a spending limit in Modal's workspace settings.

## Optional: audEERING (personal use only, removable)

`app/emotion.py` scores arousal, dominance and valence with [`audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim`](https://huggingface.co/audeering/wav2vec2-large-robust-12-ft-emotion-msp-dim). **The model is licensed CC BY-NC-SA 4.0: non-commercial use only.** It is for the owner's personal use and must be removed before any commercial launch.

- It loads only when `ENABLE_AUDEERING=1`, and needs `requirements-audeering.txt` (torch, transformers). Build the image with `--build-arg AUDEERING=1` and give it 2 GB of memory. The first start downloads about 1.2 GB from Hugging Face.
- To remove it: delete `app/emotion.py`, `tests/test_emotion.py`, `requirements-audeering.txt`, and the lines marked "OPTIONAL (personal use only)" in `app/main.py`. The app then shows no arousal, dominance or valence; everything else is unchanged.

## Licences

- librosa: ISC. numpy: BSD-3. FastAPI: MIT. Uvicorn: BSD-3. ffmpeg: LGPL/GPL (used as a separate program).
- praat-parselmouth and Praat: **GPL-3.0**. Running it as a separate network service, as here, does not make VoiceLab's app code GPL, but **have a lawyer check before a commercial launch**.
- audEERING model: CC BY-NC-SA 4.0, non-commercial (above).
