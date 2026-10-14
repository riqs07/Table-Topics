// The prompt library: deeper prompts with angles for Record Response, light questions for Table Topic. DRAFT: approved at checkpoint C13 before shipping

// Load the calendar-day helpers
import { daysBetween } from "@/core/dates";

// One daily prompt
export interface Prompt {
  // Stable id stored with each session
  id: string;
  // The prompt as shown to the user
  text: string;
  // For a Record Response: two or three angles to help shape an answer (none for other kinds)
  angles?: ReadonlyArray<string>;
}

// One step of the structure hint shown while thinking about a Record Response
export interface StructureStep {
  // Short name of the step
  label: string;
  // What to say in this step
  detail: string;
}

// A simple structure that fits any Record Response. DRAFT: approved at checkpoint C13
export const STRUCTURE_HINT: ReadonlyArray<StructureStep> = [
  // Open with the answer
  { label: "Point", detail: "Say your answer in one sentence." },
  // Back it up
  { label: "Reason", detail: "Say why." },
  // Make it real
  { label: "Example", detail: "Tell one moment or detail that shows it." },
  // Close the loop
  { label: "Point again", detail: "Repeat your answer in new words, then stop." },
];

// Record Response prompts; ids never change once used, so old sessions keep their prompt
export const PROMPTS: ReadonlyArray<Prompt> = [
  // Prompt 1
  { id: "p001", text: "Describe a small thing that made your week better.", angles: ["What the small thing was, exactly", "Why it landed that week", "Whether you could make it happen again"] },
  // Prompt 2
  { id: "p002", text: "Tell me about a place you love going to.", angles: ["What it looks and sounds like when you arrive", "What you usually do there", "Why it matters to you more than other places"] },
  // Prompt 3
  { id: "p003", text: "What is something you changed your mind about?", angles: ["What you used to think", "The moment or person that changed it", "What you think now, and what it cost to change"] },
  // Prompt 4
  { id: "p004", text: "Describe your last really good meal.", angles: ["Where you were and who you were with", "The one dish you still remember", "What made it more than just food"] },
  // Prompt 5
  { id: "p005", text: "What is a skill you would like to learn, and why?", angles: ["The skill and when you first wanted it", "What has stopped you so far", "The first small step you could take"] },
  // Prompt 6
  { id: "p006", text: "Walk me through your ideal morning.", angles: ["The first thing you do after waking", "What you would cut from a normal morning", "How the rest of the day feels after it"] },
  // Prompt 7
  { id: "p007", text: "Tell me about a song you never skip.", angles: ["Where you first heard it", "The part you wait for every time", "What it brings back or makes you feel"] },
  // Prompt 8
  { id: "p008", text: "What is a piece of advice that stuck with you?", angles: ["Who said it and when", "What was happening in your life", "A time you actually used it"] },
  // Prompt 9
  { id: "p009", text: "Describe someone who made you laugh recently.", angles: ["Who they are to you", "What they said or did", "Why it was so funny in the moment"] },
  // Prompt 10
  { id: "p010", text: "What is a small habit that helps you?", angles: ["What the habit is", "How you started it", "What changes on days you skip it"] },
  // Prompt 11
  { id: "p011", text: "Tell me about a trip you would take tomorrow if you could.", angles: ["Where you would go", "What you would do on the first day", "Who you would bring, or why you would go alone"] },
  // Prompt 12
  { id: "p012", text: "What is something you are quietly proud of?", angles: ["What it is", "Why you have kept it quiet", "What it says about you"] },
  // Prompt 13
  { id: "p013", text: "Describe your favorite room and what is in it.", angles: ["Where the room is and what it is for", "Two or three things in it that matter", "How you feel when you are in it"] },
  // Prompt 14
  { id: "p014", text: "What would you teach a class on?", angles: ["The subject", "What the first lesson would be", "Why you would be the right person to teach it"] },
  // Prompt 15
  { id: "p015", text: "Tell me about a book, film or show you would recommend.", angles: ["What it is about, in one sentence", "The moment that won you over", "Who it is for"] },
  // Prompt 16
  { id: "p016", text: "What does a good weekend look like for you?", angles: ["How it starts on Saturday morning", "The one thing that has to happen", "How you want to feel by Sunday night"] },
  // Prompt 17
  { id: "p017", text: "Describe a problem you solved this month.", angles: ["What the problem was", "What you tried first", "What finally worked, and what you learned"] },
  // Prompt 18
  { id: "p018", text: "What is something you are looking forward to?", angles: ["What it is and when it happens", "Why you are looking forward to it", "How you will make the most of it"] },
  // Prompt 19
  { id: "p019", text: "Tell me about your first job.", angles: ["What the job was and how you got it", "A day you remember from it", "What it taught you that you still use"] },
  // Prompt 20
  { id: "p020", text: "What is a smell or sound that brings back a memory?", angles: ["The smell or sound", "The memory it brings back", "Why that memory stayed with you"] },
  // Prompt 21
  { id: "p021", text: "Explain how to make something you cook often.", angles: ["What you make and why you make it often", "The steps in order", "The one tip that makes it work"] },
  // Prompt 22
  { id: "p022", text: "What is one thing you would change about your town?", angles: ["What you would change", "Why it bothers you", "What the town would be like after"] },
  // Prompt 23
  { id: "p023", text: "Describe a time you tried something new.", angles: ["What you tried and why", "The moment it went right or wrong", "What you would tell someone about to try it"] },
  // Prompt 24
  { id: "p024", text: "What makes a good friend, in your view?", angles: ["The one quality that matters most", "A friend who shows it", "How you try to be that kind of friend"] },
  // Prompt 25
  { id: "p025", text: "Tell me about an object you have kept for years.", angles: ["What the object is", "How you came to have it", "Why you have never let it go"] },
  // Prompt 26
  { id: "p026", text: "What is a question you wish people asked you more?", angles: ["The question", "Why people do not ask it", "How you would answer it right now"] },
  // Prompt 27
  { id: "p027", text: "Describe the view from a window you know well.", angles: ["Where the window is", "What you see in the morning, then at night", "What the view means to you"] },
  // Prompt 28
  { id: "p028", text: "What is the best gift you have given?", angles: ["What the gift was and who it was for", "How you chose it", "How they reacted"] },
  // Prompt 29
  { id: "p029", text: "Tell me about a time you got lost.", angles: ["Where you were going", "The moment you realised you were lost", "How you found your way, and what you learned"] },
  // Prompt 30
  { id: "p030", text: "What is something you do differently from most people?", angles: ["What you do differently", "Where the habit came from", "Whether you would recommend it"] },
  // Prompt 31
  { id: "p031", text: "Describe a perfect rainy day.", angles: ["Where you would be", "What you would do, hour by hour", "Why rain makes it better"] },
  // Prompt 32
  { id: "p032", text: "What is a rule you think should exist?", angles: ["The rule", "The problem it would fix", "How people would react to it"] },
  // Prompt 33
  { id: "p033", text: "Tell me about a person you admire and why.", angles: ["Who they are", "One thing they did that shows why", "What you have taken from them"] },
  // Prompt 34
  { id: "p034", text: "What did you want to be when you were ten?", angles: ["What you wanted to be", "Why it appealed to you then", "What is left of that wish today"] },
  // Prompt 35
  { id: "p035", text: "Describe something you made with your hands.", angles: ["What you made", "How you went about it", "What you would do differently next time"] },
  // Prompt 36
  { id: "p036", text: "What would you do with a free afternoon today?", angles: ["What you would do first", "Who you would spend it with", "Why you do not do it more often"] },
];

// Easier prompts for 30-second warm-ups. DRAFT: approved at checkpoint C13 with the main prompts
export const WARMUP_PROMPTS: ReadonlyArray<Prompt> = [
  // Warm-up 1
  { id: "w001", text: "Describe what you can see right now." },
  // Warm-up 2
  { id: "w002", text: "What did you have for breakfast?" },
  // Warm-up 3
  { id: "w003", text: "Name three things you did yesterday." },
  // Warm-up 4
  { id: "w004", text: "What is the weather like where you are?" },
  // Warm-up 5
  { id: "w005", text: "Describe the last thing that made you smile." },
  // Warm-up 6
  { id: "w006", text: "What is your favorite snack, and why?" },
  // Warm-up 7
  { id: "w007", text: "Describe the shoes you are wearing." },
  // Warm-up 8
  { id: "w008", text: "What is one thing on your to-do list today?" },
  // Warm-up 9
  { id: "w009", text: "Tell me about the last place you walked to." },
  // Warm-up 10
  { id: "w010", text: "What sound can you hear right now?" },
  // Warm-up 11
  { id: "w011", text: "Describe your favorite mug or cup." },
  // Warm-up 12
  { id: "w012", text: "What is the last song you listened to?" },
  // Warm-up 13
  { id: "w013", text: "Name a color you like and where you see it." },
  // Warm-up 14
  { id: "w014", text: "What would you cook tonight if you could?" },
  // Warm-up 15
  { id: "w015", text: "Describe the room you are in." },
  // Warm-up 16
  { id: "w016", text: "What is one small thing you are looking forward to?" },
  // Warm-up 17
  { id: "w017", text: "Tell me about a plant, pet, or tree you know." },
  // Warm-up 18
  { id: "w018", text: "What did you do last Saturday?" },
  // Warm-up 19
  { id: "w019", text: "Describe your route to work or school." },
  // Warm-up 20
  { id: "w020", text: "What is your favorite time of day?" },
  // Warm-up 21
  { id: "w021", text: "What is something you bought recently?" },
  // Warm-up 22
  { id: "w022", text: "Describe a smell you like." },
  // Warm-up 23
  { id: "w023", text: "What app do you open first each morning?" },
  // Warm-up 24
  { id: "w024", text: "Tell me about the last film or show you watched." },
];

// Light questions for Table Topic: quick to grasp and easy to answer on the spot. DRAFT: approved at checkpoint C13
export const TABLE_TOPICS: ReadonlyArray<Prompt> = [
  // Table Topic 1
  { id: "t001", text: "Morning person or night person, and why?" },
  // Table Topic 2
  { id: "t002", text: "What food would you defend to anyone?" },
  // Table Topic 3
  { id: "t003", text: "Cats or dogs?" },
  // Table Topic 4
  { id: "t004", text: "What is the best season of the year?" },
  // Table Topic 5
  { id: "t005", text: "Which app could you not live without?" },
  // Table Topic 6
  { id: "t006", text: "What is your favourite way to spend a Sunday?" },
  // Table Topic 7
  { id: "t007", text: "Tea or coffee, and how do you take it?" },
  // Table Topic 8
  { id: "t008", text: "What would you name a boat?" },
  // Table Topic 9
  { id: "t009", text: "Which superpower would you choose?" },
  // Table Topic 10
  { id: "t010", text: "What is the best snack?" },
  // Table Topic 11
  { id: "t011", text: "Beach holiday or city break?" },
  // Table Topic 12
  { id: "t012", text: "What is a song you would sing at karaoke?" },
  // Table Topic 13
  { id: "t013", text: "Which era would you visit for one day?" },
  // Table Topic 14
  { id: "t014", text: "What is your go-to comfort film?" },
  // Table Topic 15
  { id: "t015", text: "Would you rather be early or exactly on time?" },
  // Table Topic 16
  { id: "t016", text: "What makes a perfect sandwich?" },
  // Table Topic 17
  { id: "t017", text: "What is the most overrated food?" },
  // Table Topic 18
  { id: "t018", text: "Books or audiobooks?" },
  // Table Topic 19
  { id: "t019", text: "What would your dream job be for one week?" },
  // Table Topic 20
  { id: "t020", text: "What is a hobby you would like to try?" },
  // Table Topic 21
  { id: "t021", text: "Which animal would make the best roommate?" },
  // Table Topic 22
  { id: "t022", text: "What is your favourite word?" },
  // Table Topic 23
  { id: "t023", text: "Sunrise or sunset?" },
  // Table Topic 24
  { id: "t024", text: "What is the best thing about rainy days?" },
  // Table Topic 25
  { id: "t025", text: "What would you do with an extra hour each day?" },
  // Table Topic 26
  { id: "t026", text: "What is a small luxury you love?" },
  // Table Topic 27
  { id: "t027", text: "Which fictional place would you visit?" },
  // Table Topic 28
  { id: "t028", text: "What is the best board game?" },
  // Table Topic 29
  { id: "t029", text: "Mountains or the sea?" },
  // Table Topic 30
  { id: "t030", text: "What is your favourite smell?" },
  // Table Topic 31
  { id: "t031", text: "Which household chore do you secretly enjoy?" },
  // Table Topic 32
  { id: "t032", text: "What is the best piece of clothing you own?" },
  // Table Topic 33
  { id: "t033", text: "What would your theme song be?" },
  // Table Topic 34
  { id: "t034", text: "Pizza toppings: what belongs and what does not?" },
  // Table Topic 35
  { id: "t035", text: "What is a skill everyone should have?" },
  // Table Topic 36
  { id: "t036", text: "What is the best way to spend a long train ride?" },
];

// Day the rotation counts from
const START = new Date(2026, 0, 1);

// Greatest common divisor, used to pick a step that visits every prompt
function gcd(a: number, b: number): number {
  // Euclid's method
  return b === 0 ? a : gcd(b, a % b);
}

// A step through the list that shares no factor with its length, so every prompt comes up before any repeats
function stride(count: number): number {
  // Start at 7 so neighboring days get unrelated prompts
  let step = 7;
  // Move up until the step shares no factor with the count
  while (gcd(step, count) !== 1) step += 1;
  // Hand back the step
  return step;
}

// Pick from a list for a given day, stepping so neighboring days get unrelated items; offset moves along the list
function pickForDay(list: ReadonlyArray<Prompt>, day: Date, offset: number): Prompt {
  // Count calendar days since the start of the rotation
  const dayNumber = daysBetween(START, day);
  // Number of items
  const count = list.length;
  // Step through the list, wrapping around, and keep the result positive
  const index = (((dayNumber * stride(count) + offset) % count) + count) % count;
  // Look up the item (always present because the index is in range)
  return list[index] as Prompt;
}

// The prompt for a given day; "choose another" asks for the next one along with offset 1, 2, ...
export function promptForDay(day: Date, offset = 0): Prompt {
  // Pick from the full prompts
  return pickForDay(PROMPTS, day, offset);
}

// The warm-up prompt for a given day
export function warmupPromptForDay(day: Date, offset = 0): Prompt {
  // Pick from the warm-up prompts
  return pickForDay(WARMUP_PROMPTS, day, offset);
}

// The Table Topic for a given day; "choose another" moves it along with the main prompt
export function tableTopicForDay(day: Date, offset = 0): Prompt {
  // Pick from the Table Topics
  return pickForDay(TABLE_TOPICS, day, offset);
}

// Find any prompt (Record Response, Table Topic, or warm-up) by its saved id
export function findPrompt(id: string): Prompt | undefined {
  // Look in every list
  return [...PROMPTS, ...TABLE_TOPICS, ...WARMUP_PROMPTS].find((prompt) => prompt.id === id);
}
