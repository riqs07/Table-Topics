// The skill path: ten short lessons, each one practical public-speaking tip with a text built to practise it. All open from the start. DRAFT: approved at checkpoint C13

// What a lesson checks afterwards
export type LessonCheck =
  // The silence before the first word
  | "opening-pause"
  // How many words were heard clearly
  | "clear-words"
  // That the pace stayed under a target
  | "slow-pace"
  // Pauses taken against the marks in the text
  | "marked-pauses"
  // Stretches of speech whose ends faded
  | "ending"
  // Fillers in the last words
  | "clean-close"
  // Needs judgement: left to the coach
  | "coach";

// One lesson on the skill path
export interface Lesson {
  // Stable id stored with each session
  id: string;
  // Position on the path, from 1
  number: number;
  // Short title (also the prompt text in history)
  title: string;
  // Same as the title, so a lesson can stand in for a prompt
  text: string;
  // The tip: why it matters and what to do, in two or three plain sentences
  tip: string;
  // The practice text; " / " marks a pause and *word* marks a word to stress
  body: string;
  // What is checked afterwards
  check: LessonCheck;
}

// The lessons, in order
export const LESSONS: ReadonlyArray<Lesson> = [
  // Lesson 1
  { id: "l001", number: 1, title: "Pause before you start", text: "Pause before you start", check: "opening-pause", tip: "Nervous speakers start talking before they have arrived. Stand still, look up, breathe in, and only then say your first word. Two seconds of silence looks confident, not lost.", body: "Good morning, everyone. Thank you for having me. I want to talk about one small habit that changed the way I speak, and I think it can change yours too." },
  // Lesson 2
  { id: "l002", number: 2, title: "Crisp consonants", text: "Crisp consonants", check: "clear-words", tip: "Audiences lose words when the endings get swallowed. Finish the last sound of each word, especially t, d and k. It feels exaggerated to you; it sounds clear to them.", body: "Clear speech starts with the ends of words. Practise saying the last letter of each word: the t in fact, the d in planned, the k in task. Try it with this line: the project's budget, timeline and key results were checked twice, signed off, and sent back by Tuesday." },
  // Lesson 3
  { id: "l003", number: 3, title: "Slow down for numbers and names", text: "Slow down for numbers and names", check: "slow-pace", tip: "Listeners cannot reread a number. Slow down for figures, names and dates, and give each one a little room of its own.", body: "Our team grew from four people in 2019 to forty-two people today. We opened offices in Denver, Toronto, and Lisbon, and we now serve customers in eleven countries. Last year, revenue rose by thirty-eight percent. Maria Gonzalez leads operations, and David Okafor leads engineering." },
  // Lesson 4
  { id: "l004", number: 4, title: "Pause before the point", text: "Pause before the point", check: "marked-pauses", tip: "A short silence before your key point tells the room to listen. Pause where the text shows ‖, then say the line that matters.", body: "We tried everything to fix the delays. / New software, / new schedules, / new staff. / None of it worked. / Then we asked the drivers. / And the answer was simple. / The trucks were leaving / ten minutes late / every single morning." },
  // Lesson 5
  { id: "l005", number: 5, title: "Land the ending", text: "Land the ending", check: "ending", tip: "Many speakers fade on the last words of a sentence, just where the meaning lands. Keep your voice up until the full stop, then pause.", body: "This plan saves us money. It saves us time. It keeps our customers happy. And it starts on Monday. I know change is hard. But this change is worth it. Let's make it work." },
  // Lesson 6
  { id: "l006", number: 6, title: "Stress the key word", text: "Stress the key word", check: "coach", tip: "In most sentences one word carries the meaning. Lean on it a little and the sentence becomes easy to follow. Read the bold word a touch louder and slower.", body: "I never said *she* took the money. I never said she *took* the money. I never said she took *the* money. I never said she took the *money*. One sentence, four meanings, and only the stress changes." },
  // Lesson 7
  { id: "l007", number: 7, title: "Signposting", text: "Signposting", check: "coach", tip: "Spoken arguments are hard to follow without a map. Say where you are going, then use words like first, next and finally so listeners always know where they are.", body: "I have three points today. *First*, why our sign-up page loses people. *Next*, the two changes we tested. *Finally*, what we will do this quarter. So, *first*: the sign-up page asks for too much, too early." },
  // Lesson 8
  { id: "l008", number: 8, title: "The rule of three", text: "The rule of three", check: "coach", tip: "Lists of three sound complete and stick in memory. When you list reasons or examples, aim for three, and give the last one a little extra weight.", body: "Good teams share three things. They tell each other the truth. They finish what they start. And they take the blame together. Truth, follow-through, and loyalty. Get those three right, and the rest becomes easier." },
  // Lesson 9
  { id: "l009", number: 9, title: "Tongue-twister warm-up", text: "Tongue-twister warm-up", check: "clear-words", tip: "A minute of tongue twisters before a talk wakes up your lips and tongue. Start slowly and stay clear; speed comes later.", body: "Red lorry, yellow lorry. Red lorry, yellow lorry. Unique New York, unique New York. She sells seashells by the seashore. Toy boat, toy boat, toy boat. Six thick thistle sticks." },
  // Lesson 10
  { id: "l010", number: 10, title: "A strong close", text: "A strong close", check: "clean-close", tip: "End on your point, then stop. Skip the trailing extras like \"so, yeah, that's it\". Say your last line, pause, and say thank you.", body: "So here is what I hope you take away today. You do not need to be fearless to speak well. You only need to keep going while the fear is still there. Thank you." },
];

// Find a lesson by its saved id
export function findLesson(id: string): Lesson | undefined {
  // Look it up
  return LESSONS.find((lesson) => lesson.id === id);
}
