// The measurement registry (decision 90): every measure VoiceLab records or will record, with its plain name, definition, unit, group, source, evidence and whether it is shown. The table is the full specification; stage-B measures are registered here before anything computes them. Prose version: documents/architecture/measurements.md

// Load the measure source type
import type { MetricSource } from "@/data/records";

// The group a measure belongs to on the profile page
export type MetricGroup = "language" | "vocabulary" | "fluency" | "voice" | "conversation" | "content" | "story";

// How strong the research behind a measure is (documents/research/speech-analysis-2026-10.md, section 3)
export type Evidence = "strong" | "moderate" | "weak";

// Which way is better: higher, lower, or neither (a measure to watch, not to push)
export type Direction = "higher" | "lower" | "neither";

// When a measure is computed: now on the phone or from the coach (stage A), or once transcription and the voice worker exist (stage B)
export type Stage = "A" | "B";

// One measure's definition
export interface MetricDefinition {
  // Its id, such as "flu.mlr_words"
  id: string;
  // Its plain name
  name: string;
  // What it is, in a sentence
  definition: string;
  // Its unit
  unit: string;
  // Its group
  group: MetricGroup;
  // Where it comes from today (stage B may replace a device measure with a transcript one)
  source: MetricSource;
  // How strong the evidence is
  evidence: Evidence;
  // Shown on the profile's headline cards, or kept internal (still listed under "All measures")
  shown: boolean;
  // Which way is better
  better: Direction;
  // When it is computed
  stage: Stage;
}

// Build one definition (keeps the table below to one line per measure)
function metric(id: string, name: string, definition: string, unit: string, group: MetricGroup, source: MetricSource, evidence: Evidence, shown: boolean, better: Direction, stage: Stage = "A"): MetricDefinition {
  // The definition
  return { id, name, definition, unit, group, source, evidence, shown, better, stage };
}

// Every measure, grouped as on the profile page
export const METRICS: ReadonlyArray<MetricDefinition> = [
  // Language: what was said, counted from the transcript
  metric("lang.wpm", "Speaking rate", "Words per minute over the whole take, pauses included.", "words/min", "language", "device", "strong", true, "neither"),
  metric("lang.fillers_per_min", "Pause words", "Pause words (um, uh, like and similar) per minute, as heard by the speech service, which drops many. With deeper analysis, counted from a verbatim transcript that keeps them.", "/min", "language", "device", "moderate", true, "lower"),
  metric("lang.hedges_per_100w", "Hedges", "Softening phrases (sort of, kind of, I think maybe, just, I guess, probably…) per 100 words; see lexicon.ts for the list.", "/100 words", "language", "device", "moderate", false, "lower"),
  metric("lang.tag_questions_per_100w", "Tag questions", "Statements closed with right, you know, isn't it and similar, per 100 words.", "/100 words", "language", "device", "moderate", false, "lower"),
  metric("lang.mean_clause_words", "Words between boundary pauses", "Average words between pauses that fall at a clause or sentence boundary: a rough sentence length.", "words", "language", "device", "weak", false, "neither"),
  metric("lang.pronoun_i_per_100w", "“I” rate", "Uses of I, me, my per 100 words. Counted, not coached: research does not back saying “you” more.", "/100 words", "language", "device", "moderate", false, "neither"),
  metric("lang.pronoun_we_per_100w", "“We” rate", "Uses of we, us, our per 100 words.", "/100 words", "language", "device", "moderate", false, "neither"),
  metric("lang.pronoun_you_per_100w", "“You” rate", "Uses of you, your per 100 words.", "/100 words", "language", "device", "moderate", false, "neither"),
  metric("lang.discourse_markers_per_min", "Discourse markers", "“Like”, “you know”, “so”, “I mean” used as fillers, per minute, from a verbatim transcript.", "/min", "language", "transcript", "weak", false, "lower", "B"),
  metric("lang.filler_source_ratio", "Filler recall check", "Pause words in the verbatim transcript divided by those in the browser's transcript (tracks risk R1).", "ratio", "language", "transcript", "weak", false, "neither", "B"),
  metric("lang.sentiment_arc", "Sentiment arc", "How positive the start, middle and end sounded, as a slope.", "-1 to 1", "language", "transcript", "weak", false, "neither", "B"),
  // Vocabulary and word choice (owner's request)
  metric("lang.mattr50", "Word variety", "Moving-average type-token ratio over 50-word windows: the share of different words.", "0–1", "vocabulary", "device", "strong", true, "higher"),
  metric("lang.vague_per_100w", "Vague words", "Thing, stuff, something, good, nice, a lot, kind of… per 100 words; see lexicon.ts for the list.", "/100 words", "vocabulary", "device", "weak", true, "lower"),
  metric("lang.intensifiers_per_100w", "Intensifiers", "Really, very, so, super, literally, totally… per 100 words.", "/100 words", "vocabulary", "device", "weak", true, "lower"),
  metric("lang.mean_word_length", "Word length", "Average letters per word: a rough sign of more precise words.", "letters", "vocabulary", "device", "weak", false, "neither"),
  metric("lang.long_word_share", "Long words", "Share of words with seven letters or more.", "%", "vocabulary", "device", "weak", false, "neither"),
  metric("lang.rare_word_share", "Less common words", "Share of words outside the 2,000 most common English words. Needs a word list licensed for this use; not bundled yet.", "%", "vocabulary", "transcript", "weak", false, "neither", "B"),
  metric("lang.concreteness_mean", "Concreteness", "Average concreteness rating of content words (Brysbaert norms or the coach).", "1–5", "vocabulary", "transcript", "moderate", false, "higher", "B"),
  metric("rub.word_choice", "Word choice", "The coach's score for precise, vivid words, 0 to 3, with a quote.", "0–3", "vocabulary", "rubric", "weak", true, "higher"),
  // Fluency and timing
  metric("flu.articulation_rate_wpm", "Speaking pace", "Words per minute of actual speaking time, with pauses of 0.25 seconds or more taken out.", "words/min", "fluency", "device", "strong", true, "neither"),
  metric("flu.articulation_rate", "Articulation rate (syllables)", "Syllables per second of sounding time, counted from loudness peaks in the audio (de Jong and Wempe 2009), so it does not depend on the transcript.", "syll/s", "fluency", "voice", "strong", false, "neither", "B"),
  metric("flu.speech_rate", "Speech rate (syllables)", "Syllables per second over the whole take, pauses included, from the same loudness peaks.", "syll/s", "fluency", "voice", "strong", false, "neither", "B"),
  metric("flu.phonation_ratio", "Time speaking", "Share of the time from first word to last spent speaking rather than pausing.", "%", "fluency", "device", "strong", false, "neither"),
  metric("flu.mlr_words", "Words per run", "Average words between pauses of 0.25 seconds or more (mean length of run).", "words", "fluency", "device", "strong", true, "higher"),
  metric("flu.pause_rate", "Pauses a minute", "Silences of 0.25 seconds or more per minute.", "/min", "fluency", "device", "strong", false, "neither"),
  metric("flu.pause_mean_s", "Average pause", "Average length of those pauses.", "s", "fluency", "device", "strong", false, "neither"),
  metric("flu.pause_median_s", "Typical pause", "Median length of those pauses.", "s", "fluency", "device", "strong", false, "neither"),
  metric("flu.pause_p90_s", "Long pause length", "The 90th percentile pause length.", "s", "fluency", "device", "strong", false, "neither"),
  metric("flu.long_pause_share", "Long pauses", "Share of pauses that last a second or more.", "%", "fluency", "device", "moderate", false, "neither"),
  metric("flu.midclause_pause_share", "Pauses mid-sentence", "Share of pauses that fall inside a clause rather than at a boundary. Approximated on the phone (see placement.ts); with deeper analysis, read from the punctuated transcript.", "%", "fluency", "device", "strong", true, "lower"),
  metric("flu.boundary_pause_share", "Pauses at boundaries", "Share of pauses at a clause or sentence boundary (the rest of the pauses).", "%", "fluency", "device", "strong", false, "higher"),
  metric("flu.filler_midclause_share", "Pause words mid-sentence", "Share of pause words (um, uh) inside a clause rather than at the start or after a clause ends, from the punctuated transcript.", "%", "fluency", "transcript", "moderate", false, "lower", "B"),
  metric("flu.rate_cv_thirds", "Pace variation", "Spread of the speaking pace across the three thirds of the take, as a share of the average.", "ratio", "fluency", "device", "weak", false, "neither"),
  metric("flu.pace_end_vs_start", "Pace at the end", "Words a minute in the last third divided by the first third (above 1 means you sped up).", "ratio", "fluency", "device", "weak", false, "neither"),
  metric("flu.repairs_per_min", "Repeats and restarts", "Repeated words (“I I”, “the the”), repeated pairs of words and restarts per minute. Rough: the browser drops many.", "/min", "fluency", "device", "moderate", false, "lower"),
  metric("flu.opening_latency_s", "Time to first word", "Silence before the first word.", "s", "fluency", "device", "weak", true, "neither"),
  metric("flu.keypoint_pause_s", "Pause before key points", "Median pause before sentences the coach marked as key.", "s", "fluency", "transcript", "weak", false, "higher", "B"),
  metric("flu.first30_wpm_vs_rest", "Opening pace", "Words a minute in the first 30 seconds divided by the rest of the take.", "ratio", "fluency", "device", "weak", false, "neither"),
  // Voice
  metric("pro.f0_range_st", "Pitch range", "Range from the 10th to the 90th percentile of pitch, in semitones.", "semitones", "voice", "device", "strong", true, "higher"),
  metric("pro.f0_sd_st", "Pitch spread", "Standard deviation of pitch, in semitones.", "semitones", "voice", "device", "strong", false, "higher"),
  metric("pro.f0_median_hz", "Usual pitch", "Median pitch, in hertz.", "Hz", "voice", "device", "weak", false, "neither"),
  metric("pro.loudness_cv", "Volume variety", "Spread of loudness while speaking, as a share of the average. Only meaningful without the browser's levelling.", "ratio", "voice", "device", "strong", false, "higher"),
  metric("pro.energy_drop_db", "Volume at the end", "Last third's loudness against the first third, in decibels (below zero means quieter).", "dB", "voice", "device", "weak", false, "higher"),
  metric("pro.ends_rise_share", "Rising endings", "Share of phrases whose pitch rose at the end.", "%", "voice", "device", "moderate", false, "lower"),
  metric("pro.fade_share", "Fading endings", "Share of phrases that faded at the end.", "%", "voice", "device", "weak", false, "lower"),
  metric("pro.alpha_ratio", "Projection (alpha ratio)", "How much of the voice's energy sits above 1 kHz against below it, while voiced; a projected voice has more up high.", "dB", "voice", "voice", "moderate", false, "higher", "B"),
  metric("pro.hammarberg", "Projection (Hammarberg)", "The strongest peak below 2 kHz against the strongest from 2 to 5 kHz, while voiced; a smaller gap usually means more effort.", "dB", "voice", "voice", "moderate", false, "neither", "B"),
  metric("pro.jitter_local", "Pitch steadiness (jitter)", "How much the pitch wobbles from one vibration of the vocal folds to the next; lower is steadier. Phone microphones and noise raise it.", "%", "voice", "voice", "weak", false, "lower", "B"),
  metric("pro.shimmer_local_db", "Loudness steadiness (shimmer)", "How much the loudness wobbles from one vibration to the next; lower is steadier.", "dB", "voice", "voice", "weak", false, "lower", "B"),
  metric("pro.hnr_db", "Voice clarity (HNR)", "How much of the voice is clear tone rather than breath or rasp (harmonics-to-noise ratio); higher is clearer.", "dB", "voice", "voice", "weak", false, "higher", "B"),
  metric("pro.creak_share", "Creaky voice (vocal fry)", "Share of voiced time in creak: very low, rough pitch. A rough guide, not a diagnosis (the rule is in voice-worker/README.md), and disputed as a fault.", "%", "voice", "voice", "moderate", false, "neither", "B"),
  metric("pro.arousal", "Vocal energy", "How energetic the voice sounds, from audEERING's open model (personal use only, optional).", "0–1", "voice", "voice", "moderate", false, "neither", "B"),
  metric("pro.dominance", "Vocal dominance", "How dominant the voice sounds, from audEERING's open model (personal use only, optional).", "0–1", "voice", "voice", "moderate", false, "neither", "B"),
  metric("pro.valence", "Vocal pleasantness", "How pleasant the voice sounds, from audEERING's open model (personal use only, optional).", "0–1", "voice", "voice", "weak", false, "neither", "B"),
  metric("pro.articulation_clarity", "Articulation clarity", "How sure the transcription was of your words, on average (pause words left out); higher usually means clearer speech, though accents, names and noise lower it too.", "%", "voice", "transcript", "weak", false, "higher", "B"),
  // Conversation
  metric("conv.talk_share", "Talk share", "Your share of the words in a conversation.", "%", "conversation", "device", "weak", true, "neither"),
  metric("conv.questions", "Questions asked", "Your turns that asked a question (spotted by how they start).", "count", "conversation", "device", "strong", true, "higher"),
  metric("conv.followups", "Follow-up questions", "Questions that picked up a word the other person had just said.", "count", "conversation", "device", "strong", true, "higher"),
  metric("conv.turns", "Your turns", "How many times you spoke.", "count", "conversation", "device", "weak", false, "neither"),
  metric("conv.reply_latency_median_s", "Reply gap", "Median time from the end of their line to your first word.", "s", "conversation", "transcript", "moderate", false, "neither", "B"),
  metric("conv.detail_pickups", "Details picked up", "Details from their turns you reused, judged by the coach.", "count", "conversation", "rubric", "moderate", false, "higher", "B"),
  metric("conv.self_disclosure", "Sharing", "Turns where you shared a personal detail.", "count", "conversation", "rubric", "moderate", false, "neither", "B"),
  // Content and structure: openings, closings and the coach's rubric
  metric("open.starts_with_filler", "Opens with a pause word", "1 when the first word is a pause word or a lead-in such as “so”, otherwise 0.", "yes/no", "content", "device", "weak", false, "lower"),
  metric("open.first10_fillers", "Pause words in the first ten words", "Pause words among the first ten words.", "count", "content", "device", "weak", false, "lower"),
  metric("close.weak_ending", "Trailing ending", "1 when the take ends on “and yeah”, “so yeah”, “that's it”, a pause word or similar, otherwise 0.", "yes/no", "content", "device", "weak", false, "lower"),
  metric("rub.point_first", "Point first", "The coach's score for stating the main point in the first sentence or two, 0 to 3.", "0–3", "content", "rubric", "weak", true, "higher"),
  metric("rub.answers_question", "Answers the question", "The coach's score for addressing the question asked, 0 to 3 (empty without a question).", "0–3", "content", "rubric", "weak", false, "higher"),
  metric("rub.structure", "Structure", "The coach's score for a clear opening, body and close, 0 to 3.", "0–3", "content", "rubric", "weak", true, "higher"),
  metric("rub.close_strength", "Ending", "The coach's score for ending on a clear last line, 0 to 3.", "0–3", "content", "rubric", "weak", true, "higher"),
  metric("rub.concrete_example", "Concrete example", "The coach's score for at least one specific example, number or story, 0 to 3.", "0–3", "content", "rubric", "moderate", true, "higher"),
  metric("rub.devices_count", "Devices used", "How many of contrast, rule of three, question and story the coach found.", "count", "content", "rubric", "weak", false, "neither"),
  metric("rub.unnecessary_hedges", "Unneeded hedges", "Hedges the coach judged unnecessary.", "count", "content", "rubric", "moderate", false, "lower"),
  metric("rub.coherence", "Coherence", "Stays on one line of thought, 0 to 3.", "0–3", "content", "rubric", "moderate", false, "higher", "B"),
  metric("rub.audience_orientation", "Speaks to the listener", "Speaks to the listener's needs, judged as a whole, 0 to 3.", "0–3", "content", "rubric", "weak", false, "higher", "B"),
  // Stories: the phone's story checks and the story coach's scores (decision 92)
  metric("story.starts_in_action", "Starts in the action", "1 when the first sentence starts in the story rather than a lead-in such as “so basically” or “let me tell you about”, otherwise 0.", "yes/no", "story", "device", "weak", true, "higher"),
  metric("story.dialogue", "Someone's words", "1 when someone's words were reported (“she said”, “I was like”, a quote), otherwise 0.", "yes/no", "story", "device", "moderate", true, "higher"),
  metric("story.details", "Specific details", "Numbers, times, names and places heard (capitalised words mid-sentence), up to five.", "count", "story", "device", "moderate", true, "higher"),
  metric("story.turn", "A turn", "1 when a turn was heard (“but”, “suddenly”, “until”, “turns out”), otherwise 0.", "yes/no", "story", "device", "weak", true, "higher"),
  metric("story.and_then", "“And then”", "How many times “and then” linked the events.", "count", "story", "device", "weak", false, "lower"),
  metric("story.feeling", "A feeling", "1 when a feeling word was heard, otherwise 0.", "yes/no", "story", "device", "weak", false, "higher"),
  metric("story.ends_on_point", "Ends on the point", "1 when the last sentence states a point or a change (“since then”, “I realised”, “now I”), otherwise 0.", "yes/no", "story", "device", "weak", true, "higher"),
  metric("rub.story_hook", "Story opening", "The story coach's score for an opening that makes you want to hear more, ideally in the action, 0 to 3.", "0–3", "story", "rubric", "weak", true, "higher"),
  metric("rub.story_stakes", "Stakes", "The story coach's score for something at stake: a want, a problem or a risk, 0 to 3.", "0–3", "story", "rubric", "moderate", true, "higher"),
  metric("rub.story_detail", "Vivid detail", "The story coach's score for specific detail a listener can picture, 0 to 3.", "0–3", "story", "rubric", "moderate", true, "higher"),
  metric("rub.story_dialogue", "Dialogue", "The story coach's score for someone's words said as they were said, 0 to 3.", "0–3", "story", "rubric", "weak", false, "higher"),
  metric("rub.story_turn", "The turn", "The story coach's score for a clear turn, a “but” or a moment things changed, 0 to 3.", "0–3", "story", "rubric", "moderate", true, "higher"),
  metric("rub.story_point", "The point", "The story coach's score for ending on the point or the change, then stopping, 0 to 3.", "0–3", "story", "rubric", "weak", true, "higher"),
  // Guided stories: the facts brought to life (decision 93)
  metric("story.added", "Added to the facts", "For a guided story: how many of a feeling, someone's words, a turn, details of your own and a point at the end were heard beyond the given facts, 0 to 5.", "count", "story", "device", "weak", true, "higher"),
  metric("story.facts_kept", "Facts kept", "For a guided story: the share of the given facts heard, each matched by at least half its content words.", "%", "story", "device", "weak", false, "higher"),
  metric("rub.story_alive", "Facts brought to life", "For a guided story: the story coach's score for how far the plain facts were brought to life, 0 to 3.", "0–3", "story", "rubric", "weak", true, "higher"),
];

// The definitions by id
const BY_ID: ReadonlyMap<string, MetricDefinition> = new Map(METRICS.map((definition) => [definition.id, definition]));

// One measure's definition, or undefined for an unknown id
export function findMetric(id: string): MetricDefinition | undefined {
  // Look it up
  return BY_ID.get(id);
}

// The groups in the order the profile shows them, with their names
export const METRIC_GROUPS: ReadonlyArray<{ id: MetricGroup; name: string }> = [
  // Fluency first: the best-evidenced measures
  { id: "fluency", name: "Pace and pauses" },
  // The voice
  { id: "voice", name: "Voice" },
  // Words said
  { id: "language", name: "Language" },
  // Word choice (owner's request)
  { id: "vocabulary", name: "Vocabulary and word choice" },
  // Openings, closings and the rubric
  { id: "content", name: "Content and structure" },
  // Conversations
  { id: "conversation", name: "Conversation" },
  // Told stories (decision 92)
  { id: "story", name: "Stories" },
];
