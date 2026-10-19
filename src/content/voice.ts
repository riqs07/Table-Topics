// The voice modes' content (decision 80; see documents/plan-voice-modes.md): warm-up moves, drills for clear sounds, volume, pitch and stress, and tone, and passages to shadow

// Which set a warm-up move belongs to: breath and body, face and mouth, or something to say aloud
export type WarmupSet = "breath" | "mouth" | "say";

// One warm-up move: done for about 20 seconds with its cue on screen, never recorded
export interface WarmupMove {
  // Stable id
  id: string;
  // Its set
  set: WarmupSet;
  // Its short name
  name: string;
  // What to do, in one or two short sentences
  cue: string;
}

// Every warm-up move, by set (a routine takes one from each)
export const WARMUP_MOVES: ReadonlyArray<WarmupMove> = [
  // Breath and body: let the shoulders and jaw go
  { id: "shoulders", set: "breath", name: "Shoulders down", cue: "Roll your shoulders back, let them drop, and unclench your jaw." },
  // A low, slow breath
  { id: "low-breath", set: "breath", name: "Low breath", cue: "Hand on your belly. Breathe in for 4, then out on a long “sss” for 8." },
  // Counting on one breath
  { id: "breath-count", set: "breath", name: "One breath count", cue: "Breathe in, then count out loud, steadily, as far as is comfortable. Stop before you squeeze." },
  // A sigh from high to low
  { id: "sigh", set: "breath", name: "Sigh it out", cue: "Breathe in, then sigh out on “haaa”, from high to low." },
  // Face and mouth: lip trills
  { id: "lip-trills", set: "mouth", name: "Lip trills", cue: "Blow through loose lips like a motorboat. Slide up and down." },
  // A big face, then a small one
  { id: "big-small", set: "mouth", name: "Big face, small face", cue: "Stretch your face wide, then scrunch it small. Three times." },
  // Tongue circles
  { id: "tongue", set: "mouth", name: "Tongue circles", cue: "Run your tongue around the front of your teeth, five times each way." },
  // Chewing while humming
  { id: "chew-hum", set: "mouth", name: "Chewing hum", cue: "Chew slowly with your mouth closed, humming as you go." },
  // A loose jaw
  { id: "jaw", set: "mouth", name: "Jaw drop", cue: "Let your jaw hang open, then close it gently. No forcing." },
  // Something to say: the classic articulation line
  { id: "tip", set: "say", name: "Tip of the tongue", cue: "Say “the tip of the tongue, the teeth, the lips”, three times, a little faster each time." },
  // Red leather
  { id: "leather", set: "say", name: "Red leather", cue: "Say “red leather, yellow leather”, crisply, five times." },
  // Unique New York
  { id: "new-york", set: "say", name: "Unique New York", cue: "Say “unique New York, you know you need unique New York”." },
  // Copper coffee pot
  { id: "copper", set: "say", name: "Copper coffee pot", cue: "Say “a proper copper coffee pot”, three times." },
  // Truly rural
  { id: "rural", set: "say", name: "Truly rural", cue: "Say “truly rural”, slowly, then faster." },
  // Thistle sticks
  { id: "thistle", set: "say", name: "Thistle sticks", cue: "Say “six thick thistle sticks”, three times." },
  // Humming into an open vowel
  { id: "hum-open", set: "say", name: "Hum to open", cue: "Hum “mmm”, then open into “mah”. Feel the buzz in your lips." },
  // A gentle siren
  { id: "siren", set: "say", name: "Siren", cue: "Slide “ooo” from low to high and back down, gently." },
  // A line to the back of the room
  { id: "ready-line", set: "say", name: "Ready line", cue: "Say your first line, or “Good morning, everyone”, as if to the back of the room." },
];

// The kinds of voice drill recorded take by take (warm-ups and shadowing have their own screens)
export type VoiceDrillKind = "clear" | "volume" | "pitch" | "tone";

// What a drill's results look at
export type VoiceMeasure =
  // Which words were hard to catch (clear sounds)
  | "words"
  // How much louder each take was than the one before (three rooms)
  | "steps"
  // Whether each take kept its strength to the last word
  | "endings"
  // Whether the second take was clearly quieter
  | "drop"
  // Whether each take ended falling or rising, as asked
  | "ends"
  // How wide each take's pitch range was
  | "range"
  // Which word was stressed, judged by guessing
  | "stress"
  // Three feelings, compared and guessed
  | "tone";

// One take of a drill
export interface VoiceTake {
  // Its short name, such as "Back of the hall"
  label: string;
  // What to say
  text: string;
  // How to say it
  cue: string;
  // For pitch drills: how the take should end
  expect?: "fall" | "rise";
}

// One voice drill
export interface VoiceDrill {
  // Stable id (the session's prompt id)
  id: string;
  // Its kind
  kind: VoiceDrillKind;
  // Its name
  title: string;
  // One line on what it trains
  intro: string;
  // What the results look at
  measure: VoiceMeasure;
  // The takes, in order
  takes: ReadonlyArray<VoiceTake>;
}

// The three rooms of the volume drill, in order
const ROOMS = [
  // A friend next to you
  { label: "Friend beside you", cue: "As if to one friend sitting next to you." },
  // A meeting room
  { label: "Meeting room", cue: "As if to eight people around a table." },
  // The back of a hall
  { label: "Back of the hall", cue: "As if to the back row of a hall. Louder, not shouting." },
];

// The three rooms for one line
const rooms = (text: string): VoiceTake[] => ROOMS.map((room) => ({ ...room, text }));

// Three feelings for one line, as a tone drill's takes
const feelings = (text: string, names: ReadonlyArray<string>): VoiceTake[] => names.map((name) => ({ label: name, text, cue: `Say it as if you feel ${name.toLowerCase()}.` }));

// The six words to stress in the classic stress drill
const STRESSED = ["I", "didn’t", "say", "she", "took", "money"];

// Every voice drill
export const VOICE_DRILLS: ReadonlyArray<VoiceDrill> = [
  // Clear sounds: word endings
  { id: "c01", kind: "clear", title: "Word endings", intro: "Finish every word, especially the last sound.", measure: "words", takes: [
    // Endings in -ed and -s
    { label: "Line 1", text: "She asked if the tests passed last Tuesday.", cue: "Land the t and the s at the end of each word." },
    // More endings
    { label: "Line 2", text: "He fixed the desks and checked the lists.", cue: "Steady pace. Every ending clear." },
    // And again
    { label: "Line 3", text: "The facts were clear, and the costs were fixed.", cue: "Don’t rush the last word." },
  ] },
  // Clear sounds: long words
  { id: "c02", kind: "clear", title: "Long words", intro: "Long words get squashed when rushed. Give every syllable its turn.", measure: "words", takes: [
    // A ladder of one word
    { label: "Ladder 1", text: "particular, particularly, particularity", cue: "Slowly. Every syllable." },
    // Another ladder
    { label: "Ladder 2", text: "responsible, responsibility, irresponsibility", cue: "Keep the middle syllables." },
    // And a third
    { label: "Ladder 3", text: "statistic, statistics, statistical", cue: "Crisp t and s." },
  ] },
  // Clear sounds: tongue twisters
  { id: "c03", kind: "clear", title: "Tongue twisters", intro: "Fast is not the point. Clear first, then a little faster.", measure: "words", takes: [
    // Seashells
    { label: "Twister 1", text: "She sells seashells by the seashore.", cue: "Clear before fast." },
    // Lorry
    { label: "Twister 2", text: "Red lorry, yellow lorry, red lorry, yellow lorry.", cue: "Keep the l and r apart." },
    // Unique New York
    { label: "Twister 3", text: "Unique New York, you know you need unique New York.", cue: "Light and quick, every word there." },
  ] },
  // Clear sounds: everyday tricky words (the first tricky-word list)
  { id: "c04", kind: "clear", title: "Everyday tricky words", intro: "Words people often blur in everyday speech.", measure: "words", takes: [
    // The list in two halves
    { label: "First half", text: "specific, statistics, particularly, February, library, probably", cue: "A short pause after each comma." },
    // The second half
    { label: "Second half", text: "recognize, comfortable, temperature, vegetable, sixth, clothes", cue: "Finish each word before the next." },
  ] },
  // Clear sounds: business words
  { id: "c05", kind: "clear", title: "Business words", intro: "Long work words that tend to lose their middle.", measure: "words", takes: [
    // The first half
    { label: "First half", text: "entrepreneur, quarterly, deliverables, prioritize, accessibility, infrastructure", cue: "Steady, one word at a time." },
    // The second half
    { label: "Second half", text: "regulatory, anonymity, preliminary, simultaneously, thoroughly, hierarchy", cue: "Every syllable." },
  ] },
  // Clear sounds: sound-alike pairs
  { id: "c06", kind: "clear", title: "Sound-alike pairs", intro: "Pairs that only one sound tells apart.", measure: "words", takes: [
    // The first pairs
    { label: "First pairs", text: "accept, except, affect, effect, then, than, quite, quiet", cue: "Make each pair clearly different." },
    // More pairs
    { label: "More pairs", text: "desert, dessert, specific, Pacific, conscience, conscious", cue: "Lean on the sound that differs." },
  ] },
  // Volume: three rooms, with a greeting
  { id: "v01", kind: "volume", title: "Three rooms: the greeting", intro: "One line at three levels. Make each step a clear jump.", measure: "steps", takes: rooms("Good morning, everyone. Let’s get started.") },
  // Volume: three rooms, with news
  { id: "v02", kind: "volume", title: "Three rooms: the news", intro: "One line at three levels, louder without shouting.", measure: "steps", takes: rooms("I have some news that changes everything.") },
  // Volume: to the last word
  { id: "v03", kind: "volume", title: "To the last word", intro: "Many speakers fade on the last word. Keep it as strong as the first.", measure: "endings", takes: [
    // A result
    { label: "Line 1", text: "We finished the project two weeks early.", cue: "The last word as strong as the first." },
    // A payoff
    { label: "Line 2", text: "This is the result we were all waiting for.", cue: "Land “waiting for”." },
    // A thank-you
    { label: "Line 3", text: "Thank you for everything you did this year.", cue: "Don’t let “this year” drop away." },
  ] },
  // Volume: drop for effect
  { id: "v04", kind: "volume", title: "Drop for effect", intro: "A quieter line makes people lean in. Say it once normally, then clearly quieter.", measure: "drop", takes: [
    // Normal
    { label: "Normal", text: "And then, the whole room went silent.", cue: "Your normal speaking voice." },
    // Quieter
    { label: "Quiet, for effect", text: "And then, the whole room went silent.", cue: "Clearly quieter, but every word still clear." },
  ] },
  // Pitch: statement or question
  { id: "p01", kind: "pitch", title: "Statement or question", intro: "The same words mean different things when the end goes down or up.", measure: "ends", takes: [
    // A statement
    { label: "Statement", text: "You finished the report.", cue: "End low: a fact.", expect: "fall" },
    // A question
    { label: "Question", text: "You finished the report?", cue: "End high: a real question.", expect: "rise" },
  ] },
  // Pitch: land it low
  { id: "p02", kind: "pitch", title: "Land it low", intro: "Ending a statement low makes it sound certain.", measure: "ends", takes: [
    // A plan
    { label: "Line 1", text: "This is the plan.", cue: "Step down on “plan”.", expect: "fall" },
    // A date
    { label: "Line 2", text: "We start on Monday.", cue: "Step down on “Monday”.", expect: "fall" },
    // Confidence
    { label: "Line 3", text: "I’m confident it will work.", cue: "Step down on “work”.", expect: "fall" },
  ] },
  // Pitch: stretch the range
  { id: "p03", kind: "pitch", title: "Stretch the range", intro: "Overdo the melody once, then say it normally. The normal take usually lands livelier than before.", measure: "range", takes: [
    // Too much
    { label: "Too much melody", text: "What a wonderful surprise this is.", cue: "Big ups and downs, like a children’s story." },
    // Normal
    { label: "Normal", text: "What a wonderful surprise this is.", cue: "Now say it naturally." },
  ] },
  // Pitch and stress: the classic stress drill
  { id: "p04", kind: "pitch", title: "Stress the key word", intro: "One sentence, six meanings. Stress a different word each time.", measure: "stress", takes: STRESSED.map((word) => ({ label: `Stress “${word}”`, text: "I didn’t say she took the money.", cue: `Lean on “${word}”: a little higher, louder or longer.` })) },
  // Tone: news
  { id: "t01", kind: "tone", title: "I have some news", intro: "One line, three feelings. Change pitch, volume and pace on purpose.", measure: "tone", takes: feelings("I have some news.", ["Excited", "Worried", "Calm"]) },
  // Tone: a thank-you
  { id: "t02", kind: "tone", title: "Thank you all for coming", intro: "One line, three feelings.", measure: "tone", takes: feelings("Thank you all for coming.", ["Warm", "Formal", "Moved"]) },
  // Tone: the budget
  { id: "t03", kind: "tone", title: "We need to talk about the budget", intro: "One line, three feelings.", measure: "tone", takes: feelings("We need to talk about the budget.", ["Calm", "Urgent", "Reassuring"]) },
  // Tone: an idea
  { id: "t04", kind: "tone", title: "That’s an interesting idea", intro: "One line, three feelings.", measure: "tone", takes: feelings("That’s an interesting idea.", ["Curious", "Doubtful", "Delighted"]) },
  // Tone: a win
  { id: "t05", kind: "tone", title: "We did it", intro: "One line, three feelings.", measure: "tone", takes: feelings("We did it.", ["Proud", "Relieved", "Amazed"]) },
  // Tone: an apology
  { id: "t06", kind: "tone", title: "I’m sorry, that was my mistake", intro: "One line, three feelings.", measure: "tone", takes: feelings("I’m sorry, that was my mistake.", ["Sincere", "Brisk", "Embarrassed"]) },
];

// The names of the voice modes, as Practice and today's plan show them
export const VOICE_MODE_NAMES = { warmup: "Warm-up", clear: "Clear sounds", volume: "Volume", pitch: "Pitch and stress", tone: "Tone", shadow: "Shadowing" } as const;

// One phrase to shadow: the words, and the thing to copy
export interface ShadowPhrase {
  // What is said
  text: string;
  // What to copy, in a few words
  copy: string;
}

// A passage to shadow, phrase by phrase (the model voice is the phone's own until the recorded library arrives; decision 80)
export interface ShadowPassage {
  // Stable id (the session's prompt id)
  id: string;
  // Its name
  title: string;
  // Where it comes from, or the style it is in
  source: string;
  // The phrases, in order
  phrases: ReadonlyArray<ShadowPhrase>;
}

// Every passage to shadow: lines from public-domain speeches already in the app, and short original ones in a few styles
export const SHADOW_PASSAGES: ReadonlyArray<ShadowPassage> = [
  // Kennedy, 1961
  { id: "s01", title: "Ask not", source: "John F. Kennedy, 1961", phrases: [
    // The address
    { text: "And so, my fellow Americans:", copy: "Slow down, and pause after “Americans”." },
    // The turn
    { text: "ask not what your country can do for you,", copy: "Lift on “for you”, then pause." },
    // The point
    { text: "ask what you can do for your country.", copy: "Stress “you”, and land “country” low." },
  ] },
  // Lincoln, 1865
  { id: "s02", title: "With malice toward none", source: "Abraham Lincoln, 1865", phrases: [
    // Two halves
    { text: "With malice toward none, with charity for all,", copy: "Two matching halves, a short pause between them." },
    // Firmness
    { text: "with firmness in the right as God gives us to see the right,", copy: "Even and steady, no rush." },
    // The close
    { text: "let us strive on to finish the work we are in.", copy: "Land “the work we are in” low and slow." },
  ] },
  // Roosevelt, 1933
  { id: "s03", title: "Fear itself", source: "Franklin D. Roosevelt, 1933", phrases: [
    // The set-up
    { text: "So, first of all, let me assert my firm belief", copy: "Calm and deliberate." },
    // The build
    { text: "that the only thing we have to fear", copy: "Slow down into it." },
    // The point
    { text: "is fear itself.", copy: "Pause before it, then drop your voice." },
  ] },
  // An energetic update
  { id: "s04", title: "The good news", source: "An energetic update", phrases: [
    // The opener
    { text: "Here’s the good news.", copy: "Bright and quick." },
    // The fact
    { text: "We shipped all three features on time.", copy: "Stress “all three” and “on time”." },
    // The question
    { text: "And the best part?", copy: "Lift at the end, then pause." },
    // The payoff
    { text: "Customers noticed.", copy: "Short, low and certain." },
  ] },
  // A warm toast
  { id: "s05", title: "A toast", source: "A warm toast", phrases: [
    // The friend
    { text: "I’ve known Sam since our first week at work.", copy: "Warm, unhurried." },
    // The pattern
    { text: "In that time, I’ve seen one thing again and again.", copy: "Slow down on “again and again”." },
    // The point
    { text: "When it matters, Sam shows up.", copy: "Pause after “matters”, then land it." },
    // The ask
    { text: "So please, raise your glasses.", copy: "Lift the energy, then smile." },
  ] },
  // Calm authority
  { id: "s06", title: "Get it right", source: "Calm authority", phrases: [
    // Clear
    { text: "Let me be clear about one thing.", copy: "Low and steady." },
    // No rush
    { text: "We will not rush this decision.", copy: "Even weight on every word." },
    // Right
    { text: "We will get it right.", copy: "Stress “right”, end low." },
    // Together
    { text: "And we will get it right together.", copy: "A pause before “together”." },
  ] },
];

// Find a voice drill by id
export function findVoiceDrill(id: string): VoiceDrill | undefined {
  // Look through every drill
  return VOICE_DRILLS.find((drill) => drill.id === id);
}

// Find a passage to shadow by id
export function findShadowPassage(id: string): ShadowPassage | undefined {
  // Look through every passage
  return SHADOW_PASSAGES.find((passage) => passage.id === id);
}
