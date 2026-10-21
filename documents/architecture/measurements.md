# Measurements

**Purpose:** Every measure VoiceLab records about a take, where it comes from, how strong the evidence is, and how measures are turned into the speaking profile and the weekly summary.
**Last updated:** 2026-10-21 (decision 91: stage B, deeper analysis on the server)
**Source of truth:** the registry in `src/core/analysis/metrics.ts`. The tables below are generated from it; if they disagree, the code wins and this file is out of date (a unit test, `tests/unit/core/analysis/registryDoc.test.ts`, fails when a row here differs from the registry). The research behind the choices is in [../research/speech-analysis-2026-10.md](../research/speech-analysis-2026-10.md) (sections 3, 5, 6 and 7).

## How a take is measured

1. **When a take is saved** (`src/data/saveRecording.ts`, `src/data/conversationSessions.ts`), `analyseSession` builds its analysis and saves it in the `analyses` collection under the session id. A failure there is logged and never stops the take being saved. Voice drills and moment notes are not analysed.
2. **Raw features first** (`extractRaw` in `src/core/analysis/device.ts`): every word of the transcript with the time it was first heard and the next word's time (from `spokenTimes`), every pause of 0.25 seconds or more with the first word heard after it, the span of speech, summaries of loudness (average, coefficient of variation, thirds, whether the browser levelled it) and pitch (usual pitch, 10th-to-90th percentile range and spread in semitones, phrase endings), fading phrase ends, the first 30 seconds against the rest, and up to 300 content words with their counts. The loudness and pitch readings themselves stay on the session and are not copied.
3. **Measures from raw features only** (`deviceMetrics`): every phone measure can be worked out again from the raw features without the session or audio (`recomputeFromRaw`). Each value is stored as `{ value, unit, source, engine }`, so stage B can replace a value with a better engine's without mixing definitions.
4. **The coach's rubric** arrives with the feedback (`src/core/coachPrompt.ts`, `RUBRIC_RULES`, `RubricSchema`) and is saved into the analysis before the feedback (`saveRubric`), with the coach model as its engine.
5. **Older takes** are measured when the profile opens (`backfillAnalyses`), eight at a time with a pause for the page in between. An analysis whose `schemaVersion` is older than `ANALYSIS_SCHEMA_VERSION` is worked out again, keeping its rubric and any server analysis.
6. **Deeper analysis on the server (stage B, decision 91; off unless "Send my recordings for deeper analysis" is on in Settings).** Right after a take is saved, `requestDeepAnalysis` (`src/data/deepAnalysisClient.ts`) uploads its audio once to `POST /api/analyse`. The route sends it, at the same time, to AssemblyAI for a verbatim transcript and to the voice worker (`voice-worker/`) for voice measures; either may fail on its own. What comes back is kept in the analysis as `server` (`ServerAnalysis` in `src/data/records.ts`: every word with its punctuation, start and end in seconds and confidence; the worker's numbers), and `serverMetrics` (`src/core/analysis/server.ts`) turns it into measures. `mergeMetrics` puts the phone's, the rubric's and the server's measures together: a server value replaces a phone value only when it has a number, and the phone value it replaced is kept in `superseded`, so no phone value is ever lost. Because the raw server data is kept, the server's measures are worked out again with everything else. The take's page shows a quiet note when the analysis is under way, failed, was skipped (offline, too long, no passphrase) or came back in part (`src/core/analysis/deep.ts`). Offline takes are skipped, not queued: the simpler option, chosen and documented in decision 91.

## Engines

| Engine name | What it is |
|---|---|
| `device-v1` | Plain phone measures from the transcript, word times, loudness and pitch |
| `device-loudness-v1` | Pause-based measures, with pauses found in the loudness readings (silence under 30% of the speaker's typical level, 0.25 s or more) |
| `device-word-gaps-v1` | The same measures for takes without loudness readings, with gaps of 0.8 s or more between word times standing in for pauses (rougher) |
| `device-none-v1` | Pause-based measures on takes with neither; their values are empty |
| `device-wordlist-v1` | Word-list measures: hedges, tag questions, vague words, intensifiers, pronouns, repeats, openings and closings (lists in `src/core/analysis/lexicon.ts`) |
| `device-heuristic-v1` | Pause placement and words between boundary pauses (see below) |
| `device-browser-transcript-v1` | Pause words per minute as saved on the session, from the browser's transcript, which drops many |
| the coach model id | Rubric scores |
| `assemblyai-universal-3-pro` | Stage B, source `transcript`: measures from AssemblyAI's verbatim transcript (Universal-3 Pro, `disfluencies`, punctuation and word times on; model name in `src/config/models.ts`) |
| `assemblyai-universal-3-pro-punctuation-v1` | Stage B: pause placement, words between boundary pauses and pause-word placement, read from that transcript's punctuation (see below) |
| `voice-worker-1+praat-6.1.38` | Stage B, source `voice`: the voice worker's measures (its version and the Praat inside parselmouth). Definitions in `voice-worker/README.md` |
| `audeering-w2v2-msp-dim` | Stage B, optional and **personal use only** (CC BY-NC-SA): arousal, dominance and valence from audEERING's open model, only when the worker runs with `ENABLE_AUDEERING=1` |

## Measures the server computes (stage B, decision 91)

| Measure | Engine | How |
|---|---|---|
| `lang.fillers_per_min` (replaces the phone's) | `assemblyai-universal-3-pro` | The app's own filler counter (`countFillers`) over the verbatim text, which keeps the "um"s the browser drops. For readings, lessons, pause drills and rehearsals (read from a text), the phone's count plus only the hesitation sounds it missed, since words in the text are never pause words |
| `lang.filler_source_ratio` | `assemblyai-universal-3-pro` | That count divided by the phone's (risk R1); empty when the phone heard none |
| `lang.discourse_markers_per_min` | `assemblyai-universal-3-pro` | "Like", "you know", "so" and "I mean" counted as fillers, per minute; empty for takes read from a text |
| `flu.midclause_pause_share`, `flu.boundary_pause_share`, `lang.mean_clause_words` (replace the phone's) | `assemblyai-universal-3-pro-punctuation-v1` | A pause is a gap of 0.25 s or more from one word's end to the next word's start. It is at a boundary when the last real word before it (hesitation sounds looked through) ends in `. , ; : ? ! …` or a dash; otherwise mid-clause. A trailing hyphen (a word cut off) is not a boundary |
| `flu.filler_midclause_share` | `assemblyai-universal-3-pro-punctuation-v1` | Hesitation sounds (um, uh, er…) at the start of the take or after a clause ends are at a boundary; others are mid-clause |
| `pro.articulation_clarity` | `assemblyai-universal-3-pro` | The average confidence of the real words (hesitation sounds left out), as a percentage; empty under five words |
| `pro.jitter_local`, `pro.shimmer_local_db`, `pro.hnr_db` | `voice-worker-1+praat-…` | Praat's standard settings |
| `pro.alpha_ratio`, `pro.hammarberg` | `voice-worker-1+praat-…` | Per voiced frame with librosa, averaged |
| `pro.creak_share` | `voice-worker-1+praat-…` | A documented heuristic (low pitch against the speaker's median, with low harmonics-to-noise) |
| `flu.articulation_rate`, `flu.speech_rate` | `voice-worker-1+praat-…` | de Jong and Wempe (2009) syllable nuclei from intensity peaks |
| `pro.arousal`, `pro.dominance`, `pro.valence` | `audeering-w2v2-msp-dim` | Optional, personal use only; missing when the module is off |

The worker also returns its own pitch summary (median, 10th and 90th percentiles, range and spread). It is kept in the analysis's raw server data but does **not** replace the phone's pitch measures, so the shown pitch-range trend stays continuous whether or not deeper analysis is on.

**Not computed yet, and why:**
- `lang.rare_word_share`: still needs an English frequency list whose licence clearly allows bundling it in the app. The obvious candidates are share-alike (`wordfreq`'s data is CC BY-SA 4.0) or have unclear terms (lists derived from the Google Web corpus, SUBTLEX); none was confirmed as permissive, so nothing is bundled.
- `conv.reply_latency_median_s`: conversations keep no audio (decision 83), so there is nothing to send.
- `lang.sentiment_arc`, `lang.concreteness_mean`, `flu.keypoint_pause_s` and the stage-B rubric scores: not part of this stage.

## How pause placement is approximated

Browser transcripts have no punctuation, so whether a pause falls inside a clause is guessed (`src/core/analysis/placement.ts`):

- A pause is placed on the first word **heard** at or after the pause's end (word times lag a little behind speech, so a tenth of a second early still counts).
- It is at a **boundary** when that word usually starts a clause or sentence: joining words (and, but, so, or, because, then, also, yet, though, although, however, anyway, plus), clause words (which, who, when, where, while, if, since, after, before, until, unless, once, that's, what, how, why), common subject pronouns and starters (I, I'm, I've, I'd, I'll, we, we're, we've, you, you're, they, they're, he, she, it's, there's, there, this, my, our) and speech starters (now, first, second, third, finally, next, well, okay, yes, no, actually, honestly).
- It is also at a boundary when the word before it usually ends a statement (yeah, right, okay, too, anyway, though).
- Otherwise it is **mid-clause**. A pause before the first word cannot be placed and is left out.

This over-counts boundaries before "I" or "this" used mid-sentence and under-counts boundaries after a sentence that ends on an ordinary word. It is labelled `device-heuristic-v1` so stage B's punctuated, timed transcript can replace it: with deeper analysis on, the three placement measures come from the transcript's punctuation instead (engine `assemblyai-universal-3-pro-punctuation-v1`, table above), and the heuristic value is kept in the analysis's `superseded`.

## Evidence notes that shape the coaching

- Pauses in the middle of a clause and pace are the best-evidenced fluency signals; pause words (fillers) are weaker evidence, so `lang.fillers_per_min` is shown as a habit trend, not a verdict.
- Pronoun rates are counted but not coached: research does not support "say you more" (Packard et al. 2018).
- Rule of three and other devices are tagged by the rubric as devices used, never scored.
- Every comparison is against the speaker's own takes; phone microphones are not calibrated, so there are no population norms. Loudness measures are left empty when the browser levelled the sound.

## Vocabulary and word choice (owner's request)

- **Per take, on the phone:** word variety (`lang.mattr50`), vague words and intensifiers per 100 words, average word length and share of words of seven letters or more, and the content-word counts kept in the raw features.
- **Per take, from the coach:** a word-choice score (0 to 3, with a quote) and up to three word swaps `{ said, stronger, why }` that never invent facts. The first swap shows on the results page as "One word swap"; the rest stay internal.
- **In the profile:** variety, vague-word and intensifier trends per family; words said far more than usual in the last 14 days (at least four times, at three times the usual rate); content words first said in the last 14 days (only once there is history from before); and the coach's recent swaps.
- **Not computed: less common words** (`lang.rare_word_share`). It needs a frequency list of the most common English words under a licence that allows this use. None was confirmed as permissive in stage B either (see "Not computed yet" above), so nothing is bundled.
- **Articulation clarity** (`pro.articulation_clarity`, the other meaning of diction) comes with deeper analysis: the average confidence the transcription had in your words, as a percentage. Checking it against the words the clear-sounds drills missed (`wordsToWatch`) is left for later.

## The profile (`src/core/analysis/profile.ts`, page `/profile`)

- **Families:** speaking on the spot (talk, response, bookend, free, outline, qa, and the retired standard and warm-up), reading aloud (read, pause, lesson), rehearsing (rehearse), small talk, conversations. Voice drills and moment notes are left out. Families are never compared as if they were the same kind of speech.
- **Like with like** (decision 91): for each measure, only takes whose value came from the same source as the latest take's (phone, transcript or voice) are summed up, so a take measured on the server is never set against phone guesses. Turning deeper analysis on therefore starts a fresh history for the pause-word count and pause placement; the per-take table compares the same way and marks server values "deeper analysis". The voice group lists the server's voice measures under "From deeper analysis", each with its plain meaning.
- **Usual:** the median of the first five takes. **Recent:** the median of the latest seven. **Spread:** 1.4826 × the median absolute deviation over the family's takes.
- **Trend** (six takes or more): up or down when recent and usual differ by more than half a spread and by more than 5% of the usual; otherwise steady. The registry's "better" direction turns it into better, worse, or just changed.
- **Change flag** (eight takes or more): the latest three takes all sit beyond the median ± one spread of the takes before them, on the same side. A flat history uses a tenth of its level as the spread, so tiny wobbles never count.
- **Best take:** the highest or lowest value, for measures with a better side.
- **Patterns** (15 takes or more in a family), each a plain sentence with its numbers: a shown measure differs between this family and another (gap larger than the family's spread, the other family with five takes or more); the first 30 seconds against the rest (at least 10 takes, and 70% of them agreeing on faster or slower, or more or fewer pauses); early in the week (Monday to Wednesday) against later (five takes or more on each side, gap larger than the spread).
- **Per take** (`/profile?session=ID`): every measure of that take with the median of the family's other takes, linked from the results page as "See all measures for this take".

## The weekly summary (`src/core/weeklySummary.ts`, route `POST /api/summary`)

When the profile opens, the passphrase is set, the latest summary is seven days old or more (or there is none), and at least three analysed takes were made in the last seven days, the app sends a compact table: per family, the shown measures and any flagged internal ones (usual, recent, trend, verdict, flag, evidence), the patterns, up to five short quotes (the rubric's own quotes from this week, otherwise the first 20 words of this week's takes, each at most 200 characters), up to three word swaps, favourite words, and last week's focus. No whole transcripts. Limits are in `SUMMARY_SIZE` (`src/core/requestLimits.ts`, 12,000 characters of text in all) and checked by the server with the same schema. The reply is a headline, up to three improvements, one pattern, one focus for next week and an optional practice to try, saved in the `summaries` collection and shown at the top of the profile with its date.

## The registry

Stage A measures are computed on the phone or by the coach's rubric. Stage B measures come from deeper analysis on the server (decision 91) when it is switched on and set up; those not computed yet are listed above with the reason.

### Pace and pauses

| id | Name | Definition | Unit | Source | Evidence | Shown | Better | Stage |
|---|---|---|---|---|---|---|---|---|
| `flu.articulation_rate_wpm` | Speaking pace | Words per minute of actual speaking time, with pauses of 0.25 seconds or more taken out. | words/min | device | strong | shown | neither | A |
| `flu.articulation_rate` | Articulation rate (syllables) | Syllables per second of sounding time, counted from loudness peaks in the audio (de Jong and Wempe 2009), so it does not depend on the transcript. | syll/s | voice | strong | internal | neither | B |
| `flu.speech_rate` | Speech rate (syllables) | Syllables per second over the whole take, pauses included, from the same loudness peaks. | syll/s | voice | strong | internal | neither | B |
| `flu.phonation_ratio` | Time speaking | Share of the time from first word to last spent speaking rather than pausing. | % | device | strong | internal | neither | A |
| `flu.mlr_words` | Words per run | Average words between pauses of 0.25 seconds or more (mean length of run). | words | device | strong | shown | higher | A |
| `flu.pause_rate` | Pauses a minute | Silences of 0.25 seconds or more per minute. | /min | device | strong | internal | neither | A |
| `flu.pause_mean_s` | Average pause | Average length of those pauses. | s | device | strong | internal | neither | A |
| `flu.pause_median_s` | Typical pause | Median length of those pauses. | s | device | strong | internal | neither | A |
| `flu.pause_p90_s` | Long pause length | The 90th percentile pause length. | s | device | strong | internal | neither | A |
| `flu.long_pause_share` | Long pauses | Share of pauses that last a second or more. | % | device | moderate | internal | neither | A |
| `flu.midclause_pause_share` | Pauses mid-sentence | Share of pauses that fall inside a clause rather than at a boundary. Approximated on the phone (see placement.ts); with deeper analysis, read from the punctuated transcript. | % | device | strong | shown | lower | A |
| `flu.boundary_pause_share` | Pauses at boundaries | Share of pauses at a clause or sentence boundary (the rest of the pauses). | % | device | strong | internal | higher | A |
| `flu.filler_midclause_share` | Pause words mid-sentence | Share of pause words (um, uh) inside a clause rather than at the start or after a clause ends, from the punctuated transcript. | % | transcript | moderate | internal | lower | B |
| `flu.rate_cv_thirds` | Pace variation | Spread of the speaking pace across the three thirds of the take, as a share of the average. | ratio | device | weak | internal | neither | A |
| `flu.pace_end_vs_start` | Pace at the end | Words a minute in the last third divided by the first third (above 1 means you sped up). | ratio | device | weak | internal | neither | A |
| `flu.repairs_per_min` | Repeats and restarts | Repeated words (“I I”, “the the”), repeated pairs of words and restarts per minute. Rough: the browser drops many. | /min | device | moderate | internal | lower | A |
| `flu.opening_latency_s` | Time to first word | Silence before the first word. | s | device | weak | shown | neither | A |
| `flu.keypoint_pause_s` | Pause before key points | Median pause before sentences the coach marked as key. | s | transcript | weak | internal | higher | B |
| `flu.first30_wpm_vs_rest` | Opening pace | Words a minute in the first 30 seconds divided by the rest of the take. | ratio | device | weak | internal | neither | A |

### Voice

| id | Name | Definition | Unit | Source | Evidence | Shown | Better | Stage |
|---|---|---|---|---|---|---|---|---|
| `pro.f0_range_st` | Pitch range | Range from the 10th to the 90th percentile of pitch, in semitones. | semitones | device | strong | shown | higher | A |
| `pro.f0_sd_st` | Pitch spread | Standard deviation of pitch, in semitones. | semitones | device | strong | internal | higher | A |
| `pro.f0_median_hz` | Usual pitch | Median pitch, in hertz. | Hz | device | weak | internal | neither | A |
| `pro.loudness_cv` | Volume variety | Spread of loudness while speaking, as a share of the average. Only meaningful without the browser's levelling. | ratio | device | strong | internal | higher | A |
| `pro.energy_drop_db` | Volume at the end | Last third's loudness against the first third, in decibels (below zero means quieter). | dB | device | weak | internal | higher | A |
| `pro.ends_rise_share` | Rising endings | Share of phrases whose pitch rose at the end. | % | device | moderate | internal | lower | A |
| `pro.fade_share` | Fading endings | Share of phrases that faded at the end. | % | device | weak | internal | lower | A |
| `pro.alpha_ratio` | Projection (alpha ratio) | How much of the voice's energy sits above 1 kHz against below it, while voiced; a projected voice has more up high. | dB | voice | moderate | internal | higher | B |
| `pro.hammarberg` | Projection (Hammarberg) | The strongest peak below 2 kHz against the strongest from 2 to 5 kHz, while voiced; a smaller gap usually means more effort. | dB | voice | moderate | internal | neither | B |
| `pro.jitter_local` | Pitch steadiness (jitter) | How much the pitch wobbles from one vibration of the vocal folds to the next; lower is steadier. Phone microphones and noise raise it. | % | voice | weak | internal | lower | B |
| `pro.shimmer_local_db` | Loudness steadiness (shimmer) | How much the loudness wobbles from one vibration to the next; lower is steadier. | dB | voice | weak | internal | lower | B |
| `pro.hnr_db` | Voice clarity (HNR) | How much of the voice is clear tone rather than breath or rasp (harmonics-to-noise ratio); higher is clearer. | dB | voice | weak | internal | higher | B |
| `pro.creak_share` | Creaky voice (vocal fry) | Share of voiced time in creak: very low, rough pitch. A rough guide, not a diagnosis (the rule is in voice-worker/README.md), and disputed as a fault. | % | voice | moderate | internal | neither | B |
| `pro.arousal` | Vocal energy | How energetic the voice sounds, from audEERING's open model (personal use only, optional). | 0–1 | voice | moderate | internal | neither | B |
| `pro.dominance` | Vocal dominance | How dominant the voice sounds, from audEERING's open model (personal use only, optional). | 0–1 | voice | moderate | internal | neither | B |
| `pro.valence` | Vocal pleasantness | How pleasant the voice sounds, from audEERING's open model (personal use only, optional). | 0–1 | voice | weak | internal | neither | B |
| `pro.articulation_clarity` | Articulation clarity | How sure the transcription was of your words, on average (pause words left out); higher usually means clearer speech, though accents, names and noise lower it too. | % | transcript | weak | internal | higher | B |

### Language

| id | Name | Definition | Unit | Source | Evidence | Shown | Better | Stage |
|---|---|---|---|---|---|---|---|---|
| `lang.wpm` | Speaking rate | Words per minute over the whole take, pauses included. | words/min | device | strong | shown | neither | A |
| `lang.fillers_per_min` | Pause words | Pause words (um, uh, like and similar) per minute, as heard by the speech service, which drops many. With deeper analysis, counted from a verbatim transcript that keeps them. | /min | device | moderate | shown | lower | A |
| `lang.hedges_per_100w` | Hedges | Softening phrases (sort of, kind of, I think maybe, just, I guess, probably…) per 100 words; see lexicon.ts for the list. | /100 words | device | moderate | internal | lower | A |
| `lang.tag_questions_per_100w` | Tag questions | Statements closed with right, you know, isn't it and similar, per 100 words. | /100 words | device | moderate | internal | lower | A |
| `lang.mean_clause_words` | Words between boundary pauses | Average words between pauses that fall at a clause or sentence boundary: a rough sentence length. | words | device | weak | internal | neither | A |
| `lang.pronoun_i_per_100w` | “I” rate | Uses of I, me, my per 100 words. Counted, not coached: research does not back saying “you” more. | /100 words | device | moderate | internal | neither | A |
| `lang.pronoun_we_per_100w` | “We” rate | Uses of we, us, our per 100 words. | /100 words | device | moderate | internal | neither | A |
| `lang.pronoun_you_per_100w` | “You” rate | Uses of you, your per 100 words. | /100 words | device | moderate | internal | neither | A |
| `lang.discourse_markers_per_min` | Discourse markers | “Like”, “you know”, “so”, “I mean” used as fillers, per minute, from a verbatim transcript. | /min | transcript | weak | internal | lower | B |
| `lang.filler_source_ratio` | Filler recall check | Pause words in the verbatim transcript divided by those in the browser's transcript (tracks risk R1). | ratio | transcript | weak | internal | neither | B |
| `lang.sentiment_arc` | Sentiment arc | How positive the start, middle and end sounded, as a slope. | -1 to 1 | transcript | weak | internal | neither | B |

### Vocabulary and word choice

| id | Name | Definition | Unit | Source | Evidence | Shown | Better | Stage |
|---|---|---|---|---|---|---|---|---|
| `lang.mattr50` | Word variety | Moving-average type-token ratio over 50-word windows: the share of different words. | 0–1 | device | strong | shown | higher | A |
| `lang.vague_per_100w` | Vague words | Thing, stuff, something, good, nice, a lot, kind of… per 100 words; see lexicon.ts for the list. | /100 words | device | weak | shown | lower | A |
| `lang.intensifiers_per_100w` | Intensifiers | Really, very, so, super, literally, totally… per 100 words. | /100 words | device | weak | shown | lower | A |
| `lang.mean_word_length` | Word length | Average letters per word: a rough sign of more precise words. | letters | device | weak | internal | neither | A |
| `lang.long_word_share` | Long words | Share of words with seven letters or more. | % | device | weak | internal | neither | A |
| `lang.rare_word_share` | Less common words | Share of words outside the 2,000 most common English words. Needs a word list licensed for this use; not bundled yet. | % | transcript | weak | internal | neither | B |
| `lang.concreteness_mean` | Concreteness | Average concreteness rating of content words (Brysbaert norms or the coach). | 1–5 | transcript | moderate | internal | higher | B |
| `rub.word_choice` | Word choice | The coach's score for precise, vivid words, 0 to 3, with a quote. | 0–3 | rubric | weak | shown | higher | A |

### Content and structure

| id | Name | Definition | Unit | Source | Evidence | Shown | Better | Stage |
|---|---|---|---|---|---|---|---|---|
| `open.starts_with_filler` | Opens with a pause word | 1 when the first word is a pause word or a lead-in such as “so”, otherwise 0. | yes/no | device | weak | internal | lower | A |
| `open.first10_fillers` | Pause words in the first ten words | Pause words among the first ten words. | count | device | weak | internal | lower | A |
| `close.weak_ending` | Trailing ending | 1 when the take ends on “and yeah”, “so yeah”, “that's it”, a pause word or similar, otherwise 0. | yes/no | device | weak | internal | lower | A |
| `rub.point_first` | Point first | The coach's score for stating the main point in the first sentence or two, 0 to 3. | 0–3 | rubric | weak | shown | higher | A |
| `rub.answers_question` | Answers the question | The coach's score for addressing the question asked, 0 to 3 (empty without a question). | 0–3 | rubric | weak | internal | higher | A |
| `rub.structure` | Structure | The coach's score for a clear opening, body and close, 0 to 3. | 0–3 | rubric | weak | shown | higher | A |
| `rub.close_strength` | Ending | The coach's score for ending on a clear last line, 0 to 3. | 0–3 | rubric | weak | shown | higher | A |
| `rub.concrete_example` | Concrete example | The coach's score for at least one specific example, number or story, 0 to 3. | 0–3 | rubric | moderate | shown | higher | A |
| `rub.devices_count` | Devices used | How many of contrast, rule of three, question and story the coach found. | count | rubric | weak | internal | neither | A |
| `rub.unnecessary_hedges` | Unneeded hedges | Hedges the coach judged unnecessary. | count | rubric | moderate | internal | lower | A |
| `rub.coherence` | Coherence | Stays on one line of thought, 0 to 3. | 0–3 | rubric | moderate | internal | higher | B |
| `rub.audience_orientation` | Speaks to the listener | Speaks to the listener's needs, judged as a whole, 0 to 3. | 0–3 | rubric | weak | internal | higher | B |

### Conversation

| id | Name | Definition | Unit | Source | Evidence | Shown | Better | Stage |
|---|---|---|---|---|---|---|---|---|
| `conv.talk_share` | Talk share | Your share of the words in a conversation. | % | device | weak | shown | neither | A |
| `conv.questions` | Questions asked | Your turns that asked a question (spotted by how they start). | count | device | strong | shown | higher | A |
| `conv.followups` | Follow-up questions | Questions that picked up a word the other person had just said. | count | device | strong | shown | higher | A |
| `conv.turns` | Your turns | How many times you spoke. | count | device | weak | internal | neither | A |
| `conv.reply_latency_median_s` | Reply gap | Median time from the end of their line to your first word. | s | transcript | moderate | internal | neither | B |
| `conv.detail_pickups` | Details picked up | Details from their turns you reused, judged by the coach. | count | rubric | moderate | internal | higher | B |
| `conv.self_disclosure` | Sharing | Turns where you shared a personal detail. | count | rubric | moderate | internal | neither | B |

