# Speech analysis research for VoiceLab

**Purpose:** Choose what VoiceLab should measure in each recording, which services should measure it, how to store it, and how to turn it into a speaker profile, cross-session patterns and a weekly coach summary.
**Researched:** 2026-10-21. Nothing in the repository was changed.
**Scope:** One user, the owner. Cost is fine. Audio may go to APIs.

## How to read this

- **How the research was done.** The research tool could not open web pages directly; the sandbox blocks vendor sites. Every fact below comes from web search results. Search results show only parts of a page, and many come from third parties.
- **Labels.** I mark each price or claim with one of these:
  - **[official]**: seen on the vendor's own docs or pricing page.
  - **[3rd-party]**: from a pricing aggregator, a blog or a competitor.
  - **[unconfirmed]**: sources disagree, or the claim comes from my own knowledge and I did not re-check it.
- **Before you build anything on a price, open the vendor's pricing page.**
- **Jargon** is defined when it first appears. A short glossary is at the end.

---

## 1. The short answer

### Recommended stack, per recording

| Layer | Choice | What it adds | Cost for a 2-minute recording |
|---|---|---|---|
| 1. On the phone (already built, can be extended) | Web Audio: loudness and pitch at 10 Hz, pauses | Live numbers. Works offline. The baseline every other layer is checked against | $0 |
| 2. Transcript with disfluencies (filler words, repeats, restarts) | **AssemblyAI Universal-3 Pro**, with `disfluencies` on and a "verbatim" prompt. Second choice: Deepgram Nova-3 with `filler_words=true`. Third: ElevenLabs Scribe v2 (the app already uses ElevenLabs) | Keeps "um" and "uh" (fixes risk R1). Gives a start and end time for every word, so pause placement, runs, articulation rate and repairs become measurable | about $0.007 to $0.012 |
| 3. Voice analysis on a small server | One Python function: **Praat through `parselmouth`**, **openSMILE eGeMAPS**, and audEERING's open **wav2vec2 arousal/valence/dominance** model. Run it on a serverless host such as Modal or Cloud Run | Jitter, shimmer, HNR, spectral tilt, vocal fry, uptalk shape, syllable-based speech rate, and vocal energy (arousal) | under $0.005 in compute |
| 4. An AI model that listens to the audio (optional, experimental) | **Gemini Flash** audio understanding | Judgements that need ears: "sounds flat", "sounds rushed", "warm". Use only as a second opinion, never as a count | about $0.002 to $0.01 **[unconfirmed]** |
| 5. Content rubric (scoring against fixed criteria) | **Claude Sonnet 5.5**, reading the transcript, the timed words and the numbers, scoring a fixed rubric into structured JSON | Structure, answering the question, concreteness, rhetorical devices, hedges, arc | about $0.02 to $0.03 |
| Weekly | **Claude Opus 5.5** reads a compact table of the week's numbers | Speaker profile update, patterns, weekly coach summary | about $0.15 to $0.25 a week |

### Per-recording cost

- **Each recording:** about **$0.04 to $0.06**, all layers included.
- **At 2 recordings a day:** about **$2.50 to $3.50 a month**.
- **Weekly summaries:** about **$1 a month** on top.
- **Total:** roughly **$4 to $5 a month**.
- **The rubric is most of the cost.** Moving the rubric to Haiku 5.5 brings the total under $1 a month. Moving it to Opus 5.5 roughly doubles it.

### Strongest evidence-backed metrics

1. **Pauses and speed predict how fluent a speaker sounds.** This means articulation rate, mean length of run and silent pauses, especially pauses in the middle of a clause. Repairs (corrections) barely matter to listeners. ([Bosker et al. 2013](https://research-portal.uu.nl/en/publications/what-makes-speech-sound-fluent-the-contributions-of-pauses-speed-/))
2. **Varied pitch and loudness sound more charismatic and more confident.**
   - Pitch variation goes with charisma ([Rosenberg & Hirschberg 2005](https://www.isca-archive.org/interspeech_2005/rosenberg05_interspeech.html); [Niebuhr et al. 2016 on Steve Jobs](https://cris.fau.de/publications/108648804/)).
   - Louder, more varied delivery reads as more confident, and that makes the speaker more persuasive ([Van Zant & Berger, JPSP](https://faculty.wharton.upenn.edu/wp-content/uploads/2019/01/Voice-Persuades.pdf)).
3. **Follow-up questions in conversation make people like you more.** ([Huang et al. 2017](https://www.hks.harvard.edu/centers/cpl/publications/it-doesnt-hurt-ask-question-asking-increases-liking))
4. **Hedges and hesitations lower how authoritative a speaker seems.** The effect is real but depends on context. ([Hosman's studies](https://aquila.usm.edu/fac_pubs/16291))

### Surprises

- **Hume's Expression Measurement API is gone.** This was the obvious prosody and emotion API, and it has been shut down. The last day to use the API was **June 14, 2026**. ([Hume FAQ](https://dev.hume.ai/docs/expression-measurement/faq))
  - The open audEERING model is the practical replacement.
  - Its tiny MobileNetV4 version could even run on the phone.
- **Claude still cannot take audio as input.** The current API docs list text, images and PDFs only. Claude can coach from numbers and transcripts but cannot listen. Gemini or GPT audio models are needed for any listening pass.
- **"Um" is not clearly bad.**
  - Clark & Fox Tree (2002) show that "uh" and "um" are signals: "uh" announces a short delay and "um" a longer one. ([summary](https://en.wikipedia.org/wiki/Jean_E._Fox_Tree))
  - Reviews call the effect of fillers on perceived fluency "inconclusive".
  - Silent pauses inside a clause are the better-evidenced problem.
  - So the app's headline number (fillers per minute) has weaker evidence than pause placement.
- **"Say 'you' more" is folk wisdom.** In the best study on pronouns in service talk, customer-directed "you" had little effect and sometimes hurt. Agents saying "I" instead of "we" helped. ([Packard, Moore & McFerran 2018](https://summit.sfu.ca/item/17767))
- **The "rule of three" has one good study, and it is narrow.** It was about written ads where readers knew someone was trying to persuade them. A fourth claim made people sceptical of all of them. ([Shu & Carlson 2014](https://marginalrevolution.com/marginalrevolution/2014/05/make-three-claims-when-trying-to-persuade.html))
- **The vocal fry penalty is disputed.** In the well-known study, the speakers imitating fry also spoke lower and slower. ([Anderson et al. 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4037169/); [Language Log critique](https://languagelog.ldc.upenn.edu/nll/?p=12774))

---

## 2. APIs that analyse speech audio

### 2a. Transcription that keeps disfluencies and gives word times

**Why this matters for VoiceLab.** The browser's speech recognizer (Web Speech API) drops "um" (risk R1). Its word times are only approximate, at about a tenth of a second (decision 28). Most fluency metrics need exact word start and end times, plus the fillers and restarts.

| Service | Keeps "um"/"uh"? | Word timestamps | Extras that matter here | Price (batch, pay as you go) | Privacy and retention |
|---|---|---|---|---|---|
| **AssemblyAI Universal-3 Pro** (also Universal-2) | Yes. Set `disfluencies=true` **[official]** ([guide](https://www.assemblyai.com/docs/guides/disfluencies)). Universal-3 Pro can also be *prompted* for verbatim output covering "um, uh, false starts, repetitions, stutters" **[official]** ([prompting docs](https://www.assemblyai.com/docs/pre-recorded-audio/universal-3-pro/prompting)). Name each type in the prompt: the docs say a bare "disfluencies" is ambiguous | Yes (word-level start, end, confidence) | Sentiment per sentence, speaker labels, topic detection, LLM gateway | About **$0.21/hour** (about $0.0035/min) **[3rd-party; AssemblyAI blog]**. Prompting add-on about **+$0.05/hour** **[3rd-party]**. Add-on prices are unclear ([Gladia review](https://www.gladia.io/blog/assemblyai-review)) | Training opt-out on paid plans. Set a TTL (time-to-live, after which the data is deleted) of 1 to 30 days. Transcripts are kept 30 days by default **[official]** ([data controls](https://assemblyai.com/docs/data-retention-and-model-training)) |
| **Deepgram Nova-3** | Yes with `filler_words=true`, English only. Tokens: uh, um, mhmm, mm-mm, uh-uh, uh-huh, nuh-uh **[official]** ([docs](https://developers.deepgram.com/docs/filler-words)). Deepgram's own page names only Nova and Nova-2 general, but Cloudflare's copy of the Nova-3 docs lists the option. **Test on Nova-3** | Yes | "Audio intelligence": sentiment, intents, topics, summary **[official]** ([docs](https://developers.deepgram.com/docs/audio-intelligence)). There is **no paralinguistic (tone of voice) output**: its sentiment is read from the text | About **$0.0043/min** **[3rd-party, several agree]** ([Cartesia](https://www.cartesia.ai/learn/deepgram-pricing)). Add-on prices not found | A Model Improvement Program may use your audio to train its models. Opt out per request with `mip_opt_out=true`, which may cost more **[official page, details 3rd-party]** ([MIP](https://developers.deepgram.com/docs/the-deepgram-model-improvement-partnership-program)) |
| **ElevenLabs Scribe v2** | Example output shows "um" and tags like "[nervous laugh]". `tag_audio_events` is on by default **[3rd-party SDK docs]**. Whether every filler is kept is **unconfirmed**; test it | Yes (word level) | Audio-event tags (laughter, breaths). Diarization (marking who spoke when) | **$0.22/hour**. Keyterms +$0.05/hour, entity detection +$0.07/hour **[3rd-party]** ([Cekura](https://www.cekura.ai/blogs/elevenlabs-pricing)) | Not checked. The app already sends conversation lines to ElevenLabs |
| **OpenAI whisper-1** | Usually *cleans out* fillers. Its default style is "intended" (cleaned up) speech ([CrisperWhisper paper](https://arxiv.org/html/2408.16589v1)). Prompting with "um, uh" helps somewhat **[unconfirmed]** | Yes (`timestamp_granularities=["word"]`) | None | **$0.006/min** **[3rd-party, many agree]**. One source says whisper-1 is deprecated from **Feb 26, 2027** **[unconfirmed]** ([source](https://www.developersdigest.tech/blog/whisper-1-gpt-4o-transcribe-deprecation)). The app's fallback route uses Whisper, so check this | My understanding is that API data is not used for training by default and is kept up to 30 days for abuse checks **[unconfirmed]** |
| **OpenAI gpt-4o-transcribe / mini** | Tends to clean up **[unconfirmed]** | Reported as **not** giving word timestamps; only whisper-1 does **[3rd-party]** | Diarize variant | About $0.006/min (4o) and $0.003/min (mini). A newer "gpt-transcribe" is about $0.0045/min **[3rd-party]** ([CostGoat](https://costgoat.com/pricing/openai-transcription)) | As above |
| **Rev.ai (Reverb)** | It has a verbatim mode. Its handling of fillers is **unconfirmed** | Yes | Rev's open Reverb model is free to self-host | About $0.20/hour **[3rd-party, a competitor]** ([Sonix](https://sonix.ai/resources/de/rev-pricing/)) | Not checked |
| **Google Chirp 3 (Speech-to-Text v2)** | Unconfirmed | Unconfirmed | None | $0.016/min standard, $0.003/min "dynamic batch" (delayed, cheaper processing) **[official pricing page, via search]** ([pricing](https://cloud.google.com/speech-to-text/pricing)) | Google Cloud terms |
| **Azure Speech** | Unconfirmed | Yes | **Pronunciation assessment** (see 2c) | About $1 to $1.32/hour standard **[3rd-party; Microsoft Q&A]** | Microsoft terms |
| **CrisperWhisper** (open model, self-host) | **Built for this.** Verbatim transcripts with timed fillers. Authors report "near perfect filled pause detection" ([paper](https://arxiv.org/abs/2408.16589v1), [repo](https://github.com/nyrahealth/CrisperWhisper)) | Yes, tuned for accuracy around pauses | Version 2.0 has Verbatim and Intended modes | Free model. You pay for a GPU host, or about cents per run on [Replicate](https://replicate.com/collectiveai-team/crisperwhisper) | Licence CC-BY-NC (no commercial use). Fine for a personal app. Audio stays on your own host |

**Accuracy notes.**
- No neutral benchmark I found compares filler recall across these services. Filler recall means the share of real "um"s that get transcribed. Vendor claims are self-reported.
- **Test them yourself.** Record 10 takes. Count the "um"s by ear. Send each take through AssemblyAI, Deepgram and Scribe. Keep the service with the best filler recall *and* good word times. Risk R1's own test ("say 20 ums") is the right shape.

**Latency.** Batch transcription of a 2-minute file usually takes seconds. It is fast enough to finish before the user reaches the feedback screen. No figures were confirmed this session.

### 2b. Prosody and emotion APIs

**Prosody** is the melody and rhythm of speech: pitch, loudness, timing.

| Option | Status | What it returns | Cost |
|---|---|---|---|
| **Hume Expression Measurement (prosody model)** | **Shut down.** Last day for jobs in the Playground was May 14, 2026. Last day for the API was June 14, 2026 **[official FAQ]** ([FAQ](https://dev.hume.ai/docs/expression-measurement/faq)) | It returned 48 emotion scores per utterance | It cost about $0.064/min. No longer available |
| **audEERING devAIce** (commercial SDK and API) | Live. Pitched as Hume's replacement ([audEERING](https://www.audeering.com/after-humes-expression-measurement-api-what-matters/)) | Arousal (energy), valence (pleasant or unpleasant), dominance, and voice features | Ask sales. Not found |
| **audEERING open model `wav2vec2-large-robust-12-ft-emotion-msp-dim`** | Free, CC BY-NC-SA, fine for personal use ([model card](https://github.com/audeering/w2v2-how-to), [Zenodo](https://zenodo.org/records/6221127)) | Arousal, dominance, valence (about 0 to 1), plus an embedding (a list of numbers summing up the voice) | Compute only. About 0.7 s per 10 s of audio on a CPU |
| **audEERING `mobilenetv4-emotion`** | Small, fast version ([HF](https://huggingface.co/audeering/mobilenetv4-emotion)). Commercial use needs a licence | The same three numbers. About 7 ms per 10 s on a CPU | Free for personal use. Could run on the phone through ONNX in the browser **[unconfirmed; not tested]** |
| **Gemini audio understanding** | Live | Free-form answers. The docs show "emotion detection" and "segments with timestamps" through structured output ([docs](https://ai.google.dev/gemini/docs/audio)) | See 2d |

**Recommendation for prosody and emotion.**
- Use the open audEERING model for **arousal**, as a "vocal energy" trend.
- Keep it **internal**. Emotion recognition from voice is noisy for one person. It is useful as a trend against your own baseline, not as a verdict.

### 2c. Pronunciation and fluency scoring

| Service | What it scores | Fit for VoiceLab | Cost |
|---|---|---|---|
| **Azure Pronunciation Assessment**, unscripted mode | Accuracy, fluency and **prosody** scores ("stress, intonation, speaking speed and rhythm"). In unscripted mode also **vocabulary, grammar and topic** **[official]** ([tool docs](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/pronunciation-assessment-tool)) | Built for language learners. A native speaker will mostly score near the top, so it tells you little. One user reported every score coming back as 100 ([Q&A](https://learn.microsoft.com/en-us/answers/questions/1680083/cognitive-services-pronunciation-assessment-always)). Useful only for the clear-sounds drills (decision 80), if at all | Speech-to-text about $1 to $1.32/hour, plus about $0.30/hour per add-on, real time only. It may not work with fast or batch transcription **[3rd-party / Q&A, conflicting]** |
| **Speechace** | Fluency (speaking rate, "good/bad pauses", articulation rate). Its Score Speech endpoint handles spontaneous speech and scores grammar, vocabulary, coherence, fluency and pronunciation, with estimated IELTS and CEFR bands **[official docs]** ([docs](https://api-docs.speechace.com/features/scripted-activities/fluency-scoring)) | Aimed at learners, like Azure. Its "pause quality" idea is worth copying | From about $40/month **[3rd-party]** |
| **ELSA** | Pronunciation for learners | Nothing found on API pricing | Unknown |

**Recommendation.** Skip these for now. Compute the fluency parts yourself from word timestamps. That is cheaper and transparent, and it gives the same things these services measure.

### 2d. AI models that can listen to audio

| Model | Can it take audio? | Price | Use in VoiceLab |
|---|---|---|---|
| **Claude** (Opus 5.5, Sonnet 5.5, Haiku 5.5) | **No.** Inputs are text, images and PDFs (current Anthropic API docs). Prices: Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50 per million tokens (input/output) **[official, skill reference dated 2026-10-06]** | Text only | Keep Claude as the coach and the rubric judge, working from text and numbers |
| **Gemini** (Flash family) | Yes. It can "describe, summarize, answer questions" about audio, detect emotion and return timestamped segments **[official]** ([docs](https://ai.google.dev/gemini-api/docs/generate-content/audio)) | Audio is billed at about 32 tokens per second (25 in some sources). A 2-minute clip is about 3,000 to 4,000 tokens. Audio input rates for 2026 models are reported at $0.50 to $1.00 per million tokens. That is **under $0.01 per recording** **[unconfirmed; check ai.google.dev/pricing]** | A "listening" second opinion: does it sound flat, rushed, tense or warm? Ask for structured output with quotes and times. Do not trust its counts (fillers, seconds) over the measured ones |
| **OpenAI gpt-audio** (released Jan 2026) | Yes | Audio input about $32 per million tokens **[3rd-party, OpenRouter]**. Per minute probably a few cents **[unconfirmed]** | An alternative to Gemini |

**About the listening pass.**
- Research on such models shows they are good at broad judgements of emotion and style. They are weak at exact timing and counting.
- I found no published accuracy figures for "coach my delivery" tasks. Treat this as an experiment.
- Log what the model says alongside the measured numbers. After a month, see whether it adds anything.

### 2e. Voice-quality analysis (self-hosted, free software)

- **Praat** is the standard free phonetics program.
- **`parselmouth`** is a Python library that runs Praat inside Python.
- **openSMILE** is a feature extractor. Its **eGeMAPS** set is 88 standard features designed for voice and emotion research ([Eyben et al. 2016](https://msp.utdallas.edu/publications/Eyben_2016.pdf)). It includes:
  - pitch (F0, the fundamental frequency, heard as how high the voice is): mean, spread and slope
  - **jitter**: tiny cycle-to-cycle wobble in pitch, heard as roughness
  - **shimmer**: tiny cycle-to-cycle wobble in loudness
  - **HNR** (harmonics-to-noise ratio): how clear versus breathy the voice is
  - loudness, and the rate of loudness peaks (a proxy for syllables per second)
  - **spectral tilt**: alpha ratio, Hammarberg index and spectral slope. These measure how much energy sits in high versus low frequencies. A "pressed" or "projected" voice has more high-frequency energy than a soft one
  - formants (the resonances that shape vowels)
  - lengths of voiced and unvoiced stretches
- **Syllable-nuclei speech rate.** This counts syllables from loudness peaks, with no transcript needed ([de Jong & Wempe 2009](https://www.fon.hum.uva.nl/archive/2009/2009-brm-JongWempe.pdf)). Version 3 of the script also counts filled pauses ([script page](https://sites.google.com/site/speechrate/)). It gives an articulation rate that does not depend on the transcriber.
- **Licences.** openSMILE is free for non-commercial use, and Praat is GPL. Both are fine here.
- **Where to run it.** Neither runs in the browser in any maintained form; I found no openSMILE WebAssembly build. So this means a small Python server function.

---

## 3. What research says about delivery metrics

**Evidence levels.**
- **Strong:** several studies agree, including perception experiments.
- **Moderate:** one or two good studies, or a narrow context.
- **Weak / folk:** coaching lore with little direct evidence.

**Caveat.** Much fluency research studies second-language speakers. Bosker et al. (2014) found native and non-native speech rated in a similar way when pauses and speed were manipulated. So the measures carry over to native speakers, but the thresholds may not.

### Fluency and timing

| Metric | What it is | Evidence | Notes |
|---|---|---|---|
| **Speech rate** | Syllables (or words) per minute, *including* pauses | Strong as a measure ([Kormos & Dénes 2004](https://ideals.illinois.edu/items/129233/bitstreams/431191/data.pdf)) | VoiceLab already has words per minute. It mixes up talking fast with pausing little |
| **Articulation rate** | Syllables per second while actually speaking, *excluding* pauses | Strong. Tracks proficiency, and the "speed" part of fluency loads on it ([IRAL 2022](https://www.degruyterbrill.com/document/doi/10.1515/iral-2022-0125/html)) | Splitting speech rate into articulation rate and pause time tells "slow talker" apart from "pauses a lot" |
| **Mean length of run (MLR)** | Average syllables between pauses of 250 ms or more | Strong ([Kormos & Dénes 2004](https://ideals.illinois.edu/items/129233/bitstreams/431191/data.pdf)) | Use a pause threshold of about 250 ms, following [de Jong & Bosker 2013](https://ideals.illinois.edu/items/129233/bitstreams/431191/data.pdf) on choosing one |
| **Phonation time ratio** | Share of time spent speaking | Strong | Easy to get from the loudness readings |
| **Silent pause rate and length** | Pauses per minute, and median length | Strong. Pauses and speed are what listeners use ([Bosker et al. 2013](https://research-portal.uu.nl/en/publications/what-makes-speech-sound-fluent-the-contributions-of-pauses-speed-/)) | |
| **Pause placement: mid-clause vs between clauses** | Share of pauses *inside* a clause rather than at clause or sentence boundaries | Strong. Mid-clause pauses are the key "breakdown" sign; end-of-clause pauses are normal ([IRAL 2022](https://www.degruyterbrill.com/document/doi/10.1515/iral-2022-0125/html); [Applied Psycholinguistics on pause location](https://resolve.cambridge.org/core/journals/applied-psycholinguistics/article/abs/effect-of-pause-location-on-perceived-fluency/D8EF194FCD2C5FBF0D6BA49EF6F0624E)) | **Best new metric for VoiceLab.** Needs word times plus clause boundaries. An LLM or a parser can mark the boundaries on the timed transcript |
| **Filled pauses** ("um", "uh") | Per minute, and where they fall | Moderate as a habit measure. **Weak** as a quality signal. Fillers signal a delay to come ([Clark & Fox Tree 2002](https://en.wikipedia.org/wiki/Jean_E._Fox_Tree)), and their effect on perceived fluency is "inconclusive" ([review](https://jfs.ulis.vnu.edu.vn/index.php/fs/article/view/5428)) | Keep it as a personal trend. A filler at a clause boundary is mostly harmless; one mid-phrase is worse |
| **Repairs: restarts, repetitions, self-corrections** | Per minute | Moderate. Real, but listeners weigh them little ([Bosker et al. 2013](https://research-portal.uu.nl/en/publications/what-makes-speech-sound-fluent-the-contributions-of-pauses-speed-/)) | Needs a verbatim transcript (AssemblyAI prompt or CrisperWhisper). Keep internal. Already hidden for the stammer setting |
| **Speech rate variability** | Spread of articulation rate across phrases | Weak to moderate. Part of "expressiveness", but not well studied alone | Keep internal |
| **Pause before key points** | Longer pauses before important words or ends of points | Folk, but plausible | The LLM can tag key sentences, then measure the pause before each one |

### Prosody and voice

| Metric | Evidence | Notes |
|---|---|---|
| **Pitch variability** (F0 range and spread, in semitones) | Strong for charisma and liveliness. Rosenberg & Hirschberg studied charisma ratings of political speech ([2005](https://www.isca-archive.org/interspeech_2005/rosenberg05_interspeech.html)). Niebuhr's group: charismatic speakers have a fairly high pitch, a **large pitch range** and fast-but-not-too-fast speech ([DAGA 2017](https://pub.dega-akustik.de/DAGA_2017/data/articles/000256.pdf); [Jobs study](https://cris.fau.de/publications/108648804/)). In manipulation experiments, pitch variability had the strongest perceptual effect ([Strangert & Gustafson, cited in Tsai 2015](https://www.isca-archive.org/interspeech_2015/tsai15b_interspeech.pdf)) | VoiceLab already measures pitch range in semitones. Good. I found no confirmed description of "PASCAL"; the searches found Niebuhr's charisma work but not that name **[unconfirmed]** |
| **Loudness level and variation** | Strong for perceived confidence. In Van Zant & Berger, speakers trying to persuade got louder and varied their volume; listeners heard this as confidence, which drove persuasion ([paper](https://faculty.wharton.upenn.edu/wp-content/uploads/2019/01/Voice-Persuades.pdf)) | Phone microphones are not calibrated, so compare only against the speaker's own recordings (as decision 81 already does). Record whether automatic levelling was on |
| **Phrase-final fall vs rise** (uptalk: statements that rise at the end) | Moderate and context-dependent. Rises can lower perceived confidence, and the shape matters ([GLOW paper](https://glowlinguistics.org/43/wp-content/uploads/sites/5/2020/02/GLOW_43Pros_paper_22-Heim.pdf)). Effects vary with listener age and speaker gender ([Frontiers 2023](https://doaj.org/article/0641c336a09b4d69b8a105cf31fcd3b9)). Rises also signal inclusiveness | Already measured. Keep it, but frame it as "statements that rose", not as a fault |
| **Fading at phrase ends; last-third volume** | Practitioner wisdom, plausible. Linked to audibility | Already measured |
| **Vocal fry** (a low, creaky voice) | Moderate but disputed ([Anderson et al. 2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC4037169/); [critique](https://languagelog.ldc.upenn.edu/nll/?p=12774)) | Detect as low-HNR, irregular, very low-F0 stretches in Praat. Keep **internal**. Mention it only if it rises sharply against your own baseline |
| **Jitter, shimmer, HNR** | Strong as measures of voice quality (eGeMAPS); weak as speaking-skill signals | **Internal only.** Useful for spotting tiredness or strain over time ("your voice was rougher this week") |
| **Spectral tilt** (alpha ratio, Hammarberg index) | Moderate. Tracks vocal effort and projection | Internal. A cleaner "projection" signal than raw loudness on an uncalibrated mic |
| **Arousal** (vocal energy, from the audEERING model) | Moderate as a model output | Internal trend, "energy versus your usual" |

### Language and content

| Metric | Evidence | Notes |
|---|---|---|
| **Hedges, tag questions, hesitations** ("sort of", "I think maybe", "right?") | Moderate. Low levels of hedges and hesitations gave the best authority ratings; effects on persuasion depend on context ([Hosman & Wright 1987](https://aquila.usm.edu/fac_pubs/16292); [Hosman 1989](https://aquila.usm.edu/fac_pubs/16291); [Blankenship & Craig 2007](https://www.uky.edu/~ngrant/CJT780/readings/Day%206/BlankenshipCraig2007.pdf)) | Word-list count on the device, plus an LLM check (some hedges are honest and right) |
| **Concreteness** | Moderate (service conversations): concrete wording made customers feel listened to ([Packard & Berger 2021](https://knowledge.wharton.upenn.edu/article/how-language-boosts-customer-satisfaction/)) | Compute with the Brysbaert concreteness word norms on the device **[norms not re-checked this session]**, or have the LLM score it |
| **Lexical diversity: MATTR** (moving-average type-token ratio, the share of different words in a sliding window) | Strong as a *measure*: the most stable across text lengths ([Covington & McFall 2010](https://pdxscholar.library.pdx.edu/sphr_fac/38); comparisons). Weak as a sign of good speaking | Internal. Use a 50-word window. Useful for spotting "stuck" vocabulary over months |
| **Sentence or clause length** | Weak for speaking quality | Internal. Very long run-on clauses are worth flagging |
| **Pronouns** ("I", "we", "you") | Moderate, but **opposite to folk wisdom**: "I" beat "we"; customer-directed "you" had little or negative effect ([Packard et al. 2018](https://summit.sfu.ca/item/17767)) | Count them internally. Do not coach "say 'you' more" as if it were proven |
| **Rule of three** | Moderate, narrow ([Shu & Carlson 2014](https://marginalrevolution.com/marginalrevolution/2014/05/make-three-claims-when-trying-to-persuade.html)) | The LLM can tag it. Show it as a device used, not a score |
| **Contrasts and three-part lists drawing applause** | Moderate, from conversation analysis of political speeches (Atkinson 1984; Heritage & Greatbatch 1986). Not re-checked this session **[unconfirmed]** | The LLM can tag contrasts |
| **Point-first structure** (main point in the first sentence or two) | Folk and practitioner advice (BLUF, "bottom line up front"; Toastmasters PREP). Plausible but not directly tested for talks | Rubric item. Keep it, labelled as practice advice |
| **Answers the question** | Face-valid (obviously relevant), but untested as a metric | Rubric item, especially for `qa` and `talk` |
| **Emotional or sentiment arc** | Weak for 2-minute talks. TED-scale studies predict ratings from transcripts and prosody together ([Tanveer et al. 2019](https://arxiv.org/abs/1906.03940v1)) but do not isolate the arc | Internal only. Sentence-level sentiment from AssemblyAI or Deepgram, or from the LLM |
| **Topic coherence** | Moderate as an assessment construct (Azure and Speechace both score it) | Rubric item |

### Conversation

| Metric | Evidence | Notes |
|---|---|---|
| **Follow-up questions** | **Strong.** They raise liking, through perceived responsiveness. People underestimate this effect ([Huang et al. 2017](https://www.hks.harvard.edu/centers/cpl/publications/it-doesnt-hurt-ask-question-asking-increases-liking)) | Already counted roughly (`conversationMeasures.ts`). An LLM judge can sharpen it |
| **Talk-time share** | Weak to moderate. No clear study found this session | Already measured |
| **Response latency** (gap before your reply) | Moderate as a norm. Across 10 languages, people avoid overlap and keep gaps short; the median is about +100 ms for yes/no answers ([Stivers et al. 2009](https://forms.mpi.nl/node/50939)) | Measure from the end of the persona's line to your first word. Turn-taking with an app is not the same as with a person, so keep it internal |
| **Picking up details** (reusing the other person's words) | Moderate. Linked to perceived responsiveness | Already measured |

---

## 4. On the phone vs on a server

| Can run in the browser (no cost, offline) | Needs a server or an API |
|---|---|
| Loudness and pitch at 10 Hz (already built). Pauses, phonation time ratio, pause length spread | **Exact word timestamps with fillers and repairs.** The browser recognizer drops them. On-device Whisper through transformers.js with WebGPU *can* give word timestamps ([Remotion docs](https://remotion.dev/docs/whisper-webgpu)), but it is heavy on a phone, and normal Whisper also drops fillers |
| Pitch range in semitones, phrase-end direction, fading, last-third volume (already built) | Jitter, shimmer, HNR, spectral tilt, formants (Praat, openSMILE) |
| Spectral features (centroid, rolloff, energy bands) with **Meyda**, or **Essentia.js** (WebAssembly, many algorithms including pitch; [paper](https://repositori.upf.edu/handle/10230/45451)). A rough spectral tilt is possible | Vocal fry detection (needs voice-quality analysis) |
| Text metrics from the transcript: MATTR, hedge and pronoun counts, concreteness from a word list, sentence length | Arousal, valence and dominance: the wav2vec2 model is too big for a phone. The MobileNetV4 version *might* fit in ONNX Runtime Web **[untested]** |
| Pause placement, once word times and clause marks exist | Clause boundaries (LLM or parser), rubric scores, the listening pass |

**Practical split.**
1. Keep the live, on-device layer for instant feedback.
2. After saving, upload the audio once to a single server route. That route runs transcription, the Python voice function and the LLM rubric in parallel, then returns one metrics object.

---

## 5. Recommended measurement schema

**Columns.**
- **Show**: shown to the user, or internal only.
- **Cost**: per 2-minute recording, counted once per *source* (all metrics from one API call share its cost).
- **Evidence**: Strong, Moderate or Weak, as defined in section 3.

**Sources.**
- **D**: on the phone (device)
- **T**: transcription API (AssemblyAI or Deepgram)
- **P**: Python voice worker (Praat, openSMILE, audEERING)
- **G**: Gemini listening pass
- **L**: Claude rubric
- **X**: derived by combining others

### A. Transcript and language

| id | Definition | Source | Unit | Evidence | Show |
|---|---|---|---|---|---|
| `lang.wpm` | Words per minute, whole take | D/T | words/min | Strong (measure) | Show |
| `lang.fillers_per_min` | "um", "uh", "er", "erm", "mm" per minute, from the verbatim transcript | T | /min | Moderate (habit) | Show (unless the user turned it off or set stammer) |
| `lang.discourse_markers_per_min` | "like", "you know", "so", "I mean" used as fillers | T+L | /min | Weak | Internal |
| `lang.filler_source_ratio` | Fillers in the API transcript ÷ fillers in the browser transcript | X | ratio | n/a (calibration) | Internal (tracks risk R1) |
| `lang.hedges_per_100w` | Hedges and tag questions | D (word list) + L check | per 100 words | Moderate | Show when high against baseline |
| `lang.mattr50` | MATTR with a 50-word window | D | 0 to 1 | Strong measure / Weak link | Internal |
| `lang.concreteness_mean` | Mean concreteness rating of content words | D (norms) or L | 1 to 5 | Moderate | Internal, can surface |
| `lang.pronoun_i_we_you` | Counts per 100 words | D | per 100 words | Moderate (mixed) | Internal |
| `lang.mean_sentence_words` | Words per sentence or clause (from L segmentation) | L | words | Weak | Internal |
| `lang.sentiment_arc` | Sentiment per sentence → start, middle, end means and slope | T or L | −1 to 1 | Weak | Internal |

### B. Fluency and timing (needs word timestamps)

| id | Definition | Source | Unit | Evidence | Show |
|---|---|---|---|---|---|
| `flu.articulation_rate` | Syllables ÷ speaking time (pauses of 250 ms or more removed) | T (+P syllable nuclei as a check) | syll/s | Strong | Show, as "speaking pace" |
| `flu.speech_rate` | Syllables ÷ total time | T | syll/s | Strong | Internal (wpm is shown) |
| `flu.phonation_ratio` | Speaking time ÷ total time | D/T | % | Strong | Internal |
| `flu.mlr` | Mean syllables per run between pauses of 250 ms or more | T | syllables | Strong | Show as "words per breath" or "run length" |
| `flu.pause_rate` | Silent pauses of 250 ms or more per minute | D/T | /min | Strong | Internal |
| `flu.pause_median_s` / `flu.pause_p90_s` | Typical and long pause length | D/T | s | Strong | Internal |
| `flu.midclause_pause_share` | Share of pauses of 250 ms or more that fall inside a clause | T + L (clause marks) | % | **Strong** | **Show**. The best "pause in the right place" signal |
| `flu.boundary_pause_share` | Share at sentence or clause ends | T+L | % | Strong | Internal |
| `flu.filler_midclause_share` | Fillers inside a clause vs at boundaries | T+L | % | Moderate | Internal |
| `flu.repairs_per_min` | Restarts, repeats, self-corrections | T (verbatim prompt) or L | /min | Moderate | Internal (hidden for stammer) |
| `flu.rate_cv` | Spread of per-run articulation rate (coefficient of variation: standard deviation ÷ mean) | T | ratio | Weak | Internal |
| `flu.opening_latency_s` | Silence before the first word (already computed) | D | s | Folk | Show (Rapid Fire) |
| `flu.keypoint_pause_s` | Median pause before sentences the LLM tagged as key | T+L | s | Folk | Internal |

### C. Prosody and voice

| id | Definition | Source | Unit | Evidence | Show |
|---|---|---|---|---|---|
| `pro.f0_range_st` | Range from the 10th to the 90th percentile of pitch, in semitones (already built) | D (and P as a check) | semitones | Strong | Show |
| `pro.f0_sd_st` | Pitch spread | D/P | semitones | Strong | Internal |
| `pro.f0_median_hz` | Usual pitch | D/P | Hz | n/a | Internal (baseline) |
| `pro.loudness_cv` | Variation in loudness while voiced | D/P | ratio | Strong (confidence) | Internal, can surface as "volume variety" |
| `pro.ends_fall_level_rise` | Counts of phrase endings (already built) | D | counts | Moderate | Show |
| `pro.fade_share` / `pro.last_third` | Already built | D | % / step | Folk to Moderate | Show |
| `pro.alpha_ratio` / `pro.hammarberg` | Spectral tilt (projection and effort) | P | dB | Moderate | Internal |
| `pro.jitter_local` / `pro.shimmer_local_db` / `pro.hnr_db` | Voice quality | P | % / dB / dB | Strong measure, weak skill link | Internal (strain and tiredness trends) |
| `pro.creak_share` | Share of voiced time in creak (fry) | P | % | Moderate (disputed) | Internal |
| `pro.arousal` / `pro.valence` / `pro.dominance` | audEERING model outputs | P | 0 to 1 | Moderate | Internal ("energy vs usual" could surface) |
| `pro.listen` | Gemini's structured judgement: flat/varied, rushed/steady, tense/relaxed, each with time-stamped examples | G | labels | Unvalidated | Internal for the first month; then decide |

### D. Conversation (mode `conversation`, `smalltalk`)

| id | Definition | Source | Unit | Evidence | Show |
|---|---|---|---|---|---|
| `conv.talk_share` | Your share of words (built) | D | % | Weak to Moderate | Show |
| `conv.questions` / `conv.followups` | Built; refine with L | D+L | count | **Strong** | Show |
| `conv.reply_latency_median_s` | From the end of their line to your first word | D/T | s | Moderate | Internal |
| `conv.detail_pickups` | Reused details from their turn | D/L | count | Moderate | Show |
| `conv.self_disclosure` | Turns sharing a personal detail | L | count | Moderate (rapport literature; not checked this session) | Internal |

### E. Content and structure (LLM rubric)

Each item is scored **0 to 3**. A **quote must back each score** (the rubric requires it), so scores can be checked. Use Claude structured output.

| id | Rubric item | Evidence | Show |
|---|---|---|---|
| `rub.point_first` | Main point stated in the first 2 sentences | Folk/practice | Show |
| `rub.answers_question` | Addresses the prompt or question asked | Face-valid | Show (qa, talk) |
| `rub.structure` | Clear opening, body, close; signposting ("first...", "so the point is...") | Practice | Show |
| `rub.close_strength` | Ends on a clear final line rather than trailing off | Practice | Show |
| `rub.concrete_example` | At least one specific example, number or story | Moderate | Show |
| `rub.devices` | Tags: contrast, list of three, rhetorical question, callback, story | Moderate/Weak | Internal (counts) |
| `rub.coherence` | Stays on one line of thought | Moderate | Internal |
| `rub.audience_orientation` | Speaks to the listener's needs (judged as a whole, not by counting "you") | Weak | Internal |
| `rub.key_sentences` | Indexes of the 1 to 3 key sentences (used by `flu.keypoint_pause_s`) | n/a | Internal |
| `rub.clauses` | Clause boundaries over word indexes (used by the pause placement metrics) | n/a | Internal |

### Cost per source (2-minute recording)

| Source | Cost per recording |
|---|---|
| D (on the phone) | $0 |
| T (AssemblyAI U3 Pro plus prompt) | about $0.0087 (`0.26 $/h × 2/60`). Deepgram is about $0.0086 |
| P (Python worker, about 5 to 10 s of CPU on a serverless host) | under $0.002 **[estimate]** |
| G (Gemini Flash audio) | about $0.002 to $0.01 **[unconfirmed]** |
| L (Claude Sonnet 5.5) | about $0.025 |

**How the Claude cost was worked out.** Input is about 4,000 tokens: the rubric and system prompt (about 2,500, cached after the first call), the transcript with word indexes (about 1,000) and the metrics (about 500). Output is about 1,500 tokens of JSON. That is 4k × $2/M + 1.5k × $10/M ≈ $0.023.

**This can replace or merge with today's coach call.** One Sonnet call can return both the rubric JSON and the user-facing coaching. That avoids paying twice.

---

## 6. How to store it

**Keep three layers per session.** Store them in a new IndexedDB collection, for example `analyses`, keyed by session id, so the Session record stays small.

```ts
interface SessionAnalysis {
  sessionId: string;
  schemaVersion: number;          // bump when a definition changes
  computedAt: string;             // ISO
  sources: {                      // exact engines and versions, for recompute and comparison
    asr?: { vendor: "assemblyai"; model: "universal-3-pro"; params: Record<string, unknown>; at: string };
    voice?: { worker: string; praat: string; opensmile: "eGeMAPSv02"; emotionModel: string };
    listen?: { model: string };
    rubric?: { model: string; rubricVersion: number };
  };
  metrics: Record<string, { v: number | string | null; unit?: string; n?: number; conf?: number }>; // section 5 ids
  raw: {
    words: { w: string; s: number; e: number; conf: number; kind?: "word" | "filler" | "repeat" | "restart" }[];
    clauses?: [number, number][]; // word-index ranges
    keySentences?: number[];
    frames10hz?: { loud: number[]; f0: (number | null)[] }; // already stored on the session today
    egemaps?: Record<string, number>;   // the 88 functionals
    asrJson?: string;                   // original response, gzipped (CompressionStream), for re-parsing
    listen?: unknown; rubric?: unknown; // original LLM JSON
  };
}
```

**Rules.**

1. **Metrics are a cache; raw data is the truth.**
   - Recompute every metric from `raw` whenever `schemaVersion` changes. Write one pure function per metric in `src/core/`, in the style of the existing modules, with tests.
   - Store the version on each value, so trend lines never mix two definitions.
2. **Keep raw data even when the audio is deleted.**
   - Word timings, frames and eGeMAPS cost about 50 to 100 KB per session.
   - Audio is deleted after 30 sessions (decision 88). Raw features let you recompute without the audio.
3. **Include `analyses` in the export file.** Gzipped `asrJson` may be left out to keep the file small.
4. **Record the context of each take**, because it moves the numbers: mode, prompt id, duration, retry or not, `autoGain`, time of day, and (if added) a quick "how did you feel?" rating from 1 to 5.

**Privacy and documentation changes this would need.** The data model's "What leaves the device" table says pitch and loudness readings never leave the device. Audio currently leaves only for browser recognition and the Whisper fallback. Sending every recording to AssemblyAI, a Python worker and Gemini changes that promise. It needs:
- a decision record
- an update to that table and to risks R3 and R4 (daily spending caps for the new routes)
- a training opt-out and a short TTL at each vendor

---

## 7. How to aggregate

### Speaker profile (per mode family)

1. **Group modes that behave alike.**
   - **Spontaneous:** `talk`, `qa`, `bookend`, `free`
   - **Prepared:** `response`, `outline`, `rehearse`
   - **Reading:** `read`, `pause`
   - **Conversational:** `smalltalk`, `conversation`
   - Never compare reading-aloud numbers with Rapid Fire numbers.
2. **Baseline.** Take the median of the first 5 sessions in each family. Store the spread as the **MAD**: the median of how far each value sits from the median, a spread measure that ignores outliers. Use the scaled form 1.4826 × MAD.
3. **Current level.** Use the median of the last 7 sessions in the family. A rolling median is steadier than a mean, which one odd take can swing.
4. **Robust z-score** for each new session: `(x − rolling median) / (1.4826 × MAD)`. Label the result as follows:
   - within ±1 → "usual"
   - from 1 to 2 → "a bit higher" or "a bit lower"
   - beyond 2 → "unusual"
5. **Profile card (internal).** For each metric: baseline, current, trend direction, and a percentile within your own history. Pick the 3 strongest and the 2 weakest *relative to your own baseline*. Never compare against population norms, because phone microphones and spontaneous prompts differ too much.

### Change detection

- **Real change:** flag it when 3 sessions in a row land on the same side beyond 1 robust SD (standard deviation). Or use an **EWMA** (exponentially weighted moving average) chart with λ = 0.3.
- **Steady drift:** use **CUSUM** (a running sum of small deviations) for slow drift such as speaking pace creeping up.
- **Noise.** Retries give a natural test-retest pair (same prompt, same day). The median absolute difference between a first try and its retry is the **smallest change worth reporting** for that metric.

### Pattern mining (cross-session)

- Once there are about 30 sessions, compute **Spearman correlations** (correlations based on rank order, robust to outliers) between metrics and context. Examples:
  - long opening silence ↔ more fillers in the first 20 s
  - time of day ↔ articulation rate
  - prepared vs spontaneous ↔ mid-clause pauses
  - "felt nervous" rating ↔ pitch range
- **Within-session patterns:** first third vs last third for pace, fillers, pitch range and loudness. This extends the existing last-third volume measure.
- **Guard against false alarms.** Report a pattern only when |ρ| ≥ 0.4 (ρ is the correlation) with at least 20 sessions, and it holds in both halves of the history. With many metrics, some correlations will appear by chance.
- **Word-level habits.** Find the most frequent filler-plus-word pairs ("so um", "and like"). Find the phrases you repeat often across sessions, using n-grams (runs of 2 or 3 words) over all transcripts.

### Weekly coach summary

- **Input to Claude Opus 5.5:** a compact table, not raw transcripts. It covers:
  - this week vs your baseline for about 15 metrics (value, z-score, arrow)
  - the patterns detected
  - 3 short transcript excerpts chosen by the code (best and worst on the focus metric)
  - the weekly focus
- **Output (structured):**
  - one strength, with evidence
  - one pattern
  - one focus for next week, with a drill id
  - one sentence on what changed
- **Rule in the prompt:** mention only metrics marked "Show", unless an internal metric explains the focus (for example "your voice sounded more strained" from HNR).
- **Cost:** about 15k tokens in and 1.5k out on Opus 5.5 ≈ $0.09 per week. Include a few past summaries for continuity and it is about $0.15 to $0.25.

---

## 8. Per-recording cost estimate (2 min, 2 a day)

| Item | Per recording | Per month (60 recordings) |
|---|---|---|
| AssemblyAI U3 Pro, disfluencies and prompt | $0.009 | $0.52 |
| Python voice worker (serverless CPU) | ≤ $0.002 | ≤ $0.12 (likely inside a free tier) |
| Gemini Flash listening pass (optional) | ≤ $0.01 **[unconfirmed]** | ≤ $0.60 |
| Claude Sonnet 5.5 rubric and coaching (one call) | $0.025 | $1.50 |
| **Subtotal per recording** | **≈ $0.035 to $0.046** | **≈ $2.10 to $2.75** |
| Weekly summary (Opus 5.5) | | ≈ $0.60 to $1.00 |
| **Total** | | **≈ $3 to $4 a month** |

**Variations.**
- **With Azure Pronunciation Assessment added:** about +$0.05 per recording, which is +$3 a month.
- **With Deepgram instead of AssemblyAI:** the cost is about the same.
- **With CrisperWhisper on a rented GPU instead of a paid API:** cheaper per run, but cold starts are slower. It is only worth it if the bake-off shows better filler recall.

---

## 9. Suggested order of work

1. **Run the filler bake-off** (fixes R1). Record 10 takes with known "um" counts. Run them through AssemblyAI (with the verbatim prompt), Deepgram Nova-3 (`filler_words`) and ElevenLabs Scribe v2. Pick the best on filler recall and word-time accuracy.
2. **Add the server route and the `analyses` store.** Compute timing metrics from the words: articulation rate, MLR, pause rate, pause placement once clauses exist, and repairs.
3. **Extend the Claude coach call to return the rubric JSON**, including clause boundaries and key sentences. This unlocks the pause placement metrics.
4. **Add the Python voice worker** (parselmouth, openSMILE, audEERING).
5. **Build the aggregation layer**: baselines per mode family, robust z-scores, change detection. Then the weekly summary.
6. **Experiment: the Gemini listening pass** for a month, internal only. Then decide whether to keep it.

---

## Glossary

- **Arousal / valence / dominance:** three emotion scales. Arousal is energy (calm to excited). Valence is pleasant to unpleasant. Dominance is submissive to in control.
- **Articulation rate:** speed while actually talking, with pauses removed.
- **Disfluency:** a break in smooth speech: a filler ("um"), a repeat, a restart or a correction.
- **eGeMAPS:** a standard set of 88 voice measurements used in research.
- **F0:** the fundamental frequency of the voice; what we hear as pitch.
- **HNR:** harmonics-to-noise ratio. Higher means a clearer voice; lower means a breathier or rougher one.
- **Jitter / shimmer:** tiny cycle-to-cycle wobble in pitch or loudness.
- **MAD:** median absolute deviation, a spread measure that ignores outliers.
- **MATTR:** the share of different words in a sliding window of words; a measure of vocabulary variety.
- **MLR:** mean length of run, the average syllables between pauses.
- **Prosody:** the melody and rhythm of speech: pitch, loudness, timing.
- **Semitone:** one musical half-step. Pitch range in semitones compares fairly across low and high voices.
- **Spectral tilt:** how much voice energy sits in high versus low frequencies. A projected voice has more high-frequency energy.
- **TTL:** time-to-live, how long a vendor keeps your data before deleting it.
- **Uptalk:** a statement that rises in pitch at the end, like a question.
- **Vocal fry:** a low, creaky voice quality.
