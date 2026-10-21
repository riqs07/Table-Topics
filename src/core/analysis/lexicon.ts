// The word lists the phone's language measures use (decision 90, from documents/research/speech-analysis-2026-10.md). Written for this app; no outside word list is bundled. Browser transcripts have no punctuation, so every list matches lower-case words

// Hedges (Hosman's studies): phrases that soften a claim, longest first so "i think maybe" is counted once, not as "i think" too
export const HEDGES: ReadonlyArray<string> = [
  // Three words or more
  "i think maybe", "i'm not sure", "i don't know", "sort of like", "kind of like", "more or less",
  // Two words
  "sort of", "kind of", "i guess", "i suppose", "i think", "i feel like", "a bit", "a little",
  // One word
  "maybe", "perhaps", "probably", "possibly", "somewhat", "just", "fairly", "basically", "apparently", "presumably",
].sort((a, b) => b.split(" ").length - a.split(" ").length);

// Tag questions at the end of a statement ("right?", "isn't it?"), matched as two- or one-word endings of a clause
export const TAG_QUESTIONS: ReadonlyArray<string> = [
  // Two words
  "isn't it", "don't you", "wasn't it", "aren't they", "doesn't it", "didn't i", "you know", "don't they", "won't it", "can't you",
  // One word, only at the very end of a clause
  "right", "yeah", "okay", "huh",
];

// Vague words (owner's request, decision 90): general words a listener cannot picture, longest first
export const VAGUE_WORDS: ReadonlyArray<string> = [
  // Phrases
  "a lot", "lots of", "kind of", "sort of", "and stuff", "or something", "and things", "all that", "that kind of thing",
  // Words
  "thing", "things", "stuff", "something", "somebody", "someone", "somewhere", "good", "nice", "bad", "great", "fine", "okay", "interesting", "whatever", "various", "many", "some",
].sort((a, b) => b.split(" ").length - a.split(" ").length);

// Intensifiers (owner's request): words that push a claim up without adding detail
export const INTENSIFIERS: ReadonlySet<string> = new Set(["really", "very", "so", "super", "literally", "totally", "absolutely", "extremely", "incredibly", "completely", "definitely", "seriously", "insanely", "awesome", "amazing"]);

// Words that usually start a new clause or sentence when they follow a pause (the boundary heuristic for pause placement, decision 90): joining words, relative words and the common subject pronouns
export const CLAUSE_STARTERS: ReadonlySet<string> = new Set([
  // Joining words
  "and", "but", "so", "or", "because", "then", "also", "yet", "though", "although", "however", "anyway", "plus",
  // Words that start a clause of their own
  "which", "who", "when", "where", "while", "if", "since", "after", "before", "until", "unless", "once", "that's", "what", "how", "why",
  // Subject pronouns that usually start a sentence
  "i", "i'm", "i've", "i'd", "i'll", "we", "we're", "we've", "you", "you're", "they", "they're", "he", "she", "it's", "there's", "there", "this", "my", "our",
  // Sentence starters in speech
  "now", "first", "second", "third", "finally", "next", "well", "okay", "yes", "no", "actually", "honestly",
]);

// Endings that close a statement, so a pause after them sits at a boundary
export const SENTENCE_ENDERS: ReadonlySet<string> = new Set(["yeah", "right", "okay", "too", "anyway", "though"]);

// Weak closing phrases, matched on the last words of a take
export const WEAK_CLOSINGS: ReadonlyArray<string> = ["and yeah", "so yeah", "that's it", "that's all", "that's about it", "i guess that's it", "or something", "and stuff", "so um", "and um", "yeah", "i don't know", "anyway"];

// Small, common words left out of the content-word counts (the "favourite words" and "new words" in the profile)
export const STOP_WORDS: ReadonlySet<string> = new Set([
  // Articles, joining words and prepositions
  "a", "an", "the", "and", "but", "or", "so", "if", "then", "than", "because", "as", "of", "to", "in", "on", "at", "by", "for", "with", "about", "from", "into", "over", "under", "up", "down", "out", "off", "through", "after", "before", "while", "when", "where", "which", "who", "whom", "what", "how", "why", "that", "this", "these", "those", "there", "here",
  // Pronouns
  "i", "me", "my", "mine", "we", "us", "our", "you", "your", "he", "him", "his", "she", "her", "it", "its", "they", "them", "their", "i'm", "i've", "i'd", "i'll", "you're", "we're", "they're", "it's", "that's", "there's", "he's", "she's", "what's",
  // Helping verbs and common verbs
  "is", "am", "are", "was", "were", "be", "been", "being", "do", "does", "did", "done", "have", "has", "had", "get", "got", "go", "going", "went", "will", "would", "can", "could", "should", "might", "must", "don't", "didn't", "doesn't", "can't", "won't", "isn't", "wasn't", "aren't", "say", "said", "know", "think", "want", "make", "made", "see", "come", "take",
  // Little words of speech
  "not", "no", "yes", "yeah", "just", "like", "really", "very", "also", "too", "all", "some", "any", "one", "more", "most", "much", "many", "lot", "well", "now", "um", "uh", "er", "ah", "oh", "okay", "ok", "kind", "sort", "actually", "basically", "thing", "things", "stuff", "something", "gonna", "wanna",
]);
