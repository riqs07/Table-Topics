// The skill path: sixteen short lessons, each one practical public-speaking tip with a text built to practise it. All open from the start. DRAFT: approved at checkpoint C13

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
  // A long pause followed by more speech: recovering from a blank
  | "recovery"
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
  // What good looks like for this lesson and how the results will show it, in one plain line shown before starting (decision 117)
  goal: string;
  // Whether the *starred* words are where the voice should lift, so the results show planned stress (decision 111); missing on lessons whose stars mark something else, such as signposts
  plannedStress?: boolean;
}

// The lessons, in order
export const LESSONS: ReadonlyArray<Lesson> = [
  // Lesson 1
  { id: "l001", number: 1, title: "Pause before you start", text: "Pause before you start", goal: "Two seconds of silence before your first word. You’ll see how long you waited, and your pauses.", check: "opening-pause", tip: "Nervous speakers start talking before they have arrived. Stand still, look up, breathe in, and only then say your first word. Two seconds of silence looks confident, not lost.", body: "Good morning, everyone. Thank you for having me. I want to talk about one small habit that changed the way I speak, and I think it can change yours too." },
  // Lesson 2
  { id: "l002", number: 2, title: "Crisp consonants", text: "Crisp consonants", goal: "Every word ending comes through. You’ll see which words were not heard.", check: "clear-words", tip: "Audiences lose words when the endings get swallowed. Finish the last sound of each word, especially t, d and k. It feels exaggerated to you; it sounds clear to them.", body: "Clear speech starts with the ends of words. Practise saying the last letter of each word: the t in fact, the d in planned, the k in task. Try it with this line: the project's budget, timeline and key results were checked twice, signed off, and sent back by Tuesday." },
  // Lesson 3
  { id: "l003", number: 3, title: "Slow down for numbers and names", text: "Slow down for numbers and names", goal: "A steady, unhurried pace through the numbers and names. You’ll see your pace across the text.", check: "slow-pace", tip: "Listeners cannot reread a number. Slow down for figures, names and dates, and give each one a little room of its own.", body: "Our team grew from four people in 2019 to forty-two people today. We opened offices in Denver, Toronto, and Lisbon, and we now serve customers in eleven countries. Last year, revenue rose by thirty-eight percent. Maria Gonzalez leads operations, and David Okafor leads engineering." },
  // Lesson 4
  { id: "l004", number: 4, title: "Pause before the point", text: "Pause before the point", goal: "A pause at each mark, just before the point. You’ll see which marks had a pause.", check: "marked-pauses", tip: "A short silence before your key point tells the room to listen. Pause where the text shows ‖, then say the line that matters.", body: "We tried everything to fix the delays. / New software, / new schedules, / new staff. / None of it worked. / Then we asked the drivers. / And the answer was simple. / The trucks were leaving / ten minutes late / every single morning." },
  // Lesson 5
  { id: "l005", number: 5, title: "Land the ending", text: "Land the ending", goal: "Your voice holds up to each full stop. You’ll see which sentence endings faded.", check: "ending", tip: "Many speakers fade on the last words of a sentence, just where the meaning lands. Keep your voice up until the full stop, then pause.", body: "This plan saves us money. It saves us time. It keeps our customers happy. And it starts on Monday. I know change is hard. But this change is worth it. Let's make it work." },
  // Lesson 6
  { id: "l006", number: 6, title: "Stress the key word", text: "Stress the key word", goal: "Your highest pitch lands on the key word. You’ll see a circle on the target and a dot where your peak landed.", check: "coach", plannedStress: true, tip: "In most sentences one word carries the meaning. Lean on it a little and the sentence becomes easy to follow. Read the bold word a touch louder and slower.", body: "I never said *she* took the money. I never said she *took* the money. I never said she took *the* money. I never said she took the *money*. One sentence, four meanings, and only the stress changes." },
  // Lesson 7
  { id: "l007", number: 7, title: "Signposting", text: "Signposting", goal: "First, next and finally stand out. You’ll see your pitch in the words, with the peaks in bold.", check: "coach", tip: "Spoken arguments are hard to follow without a map. Say where you are going, then use words like first, next and finally so listeners always know where they are.", body: "I have three points today. *First*, why our sign-up page loses people. *Next*, the two changes we tested. *Finally*, what we will do this quarter. So, *first*: the sign-up page asks for too much, too early." },
  // Lesson 8
  { id: "l008", number: 8, title: "The rule of three", text: "The rule of three", goal: "Three items, the last with a little extra weight. You’ll see your pitch in the words, with the peaks in bold.", check: "coach", tip: "Lists of three sound complete and stick in memory. When you list reasons or examples, aim for three, and give the last one a little extra weight.", body: "Good teams share three things. They tell each other the truth. They finish what they start. And they take the blame together. Truth, follow-through, and loyalty. Get those three right, and the rest becomes easier." },
  // Lesson 9
  { id: "l009", number: 9, title: "Tongue-twister warm-up", text: "Tongue-twister warm-up", goal: "Clear before fast. You’ll see which words were not heard.", check: "clear-words", tip: "A minute of tongue twisters before a talk wakes up your lips and tongue. Start slowly and stay clear; speed comes later.", body: "Red lorry, yellow lorry. Red lorry, yellow lorry. Unique New York, unique New York. She sells seashells by the seashore. Toy boat, toy boat, toy boat. Six thick thistle sticks." },
  // Lesson 10
  { id: "l010", number: 10, title: "A strong close", text: "A strong close", goal: "End on the last line, then stop. You’ll see any pause words in your closing words.", check: "clean-close", tip: "End on your point, then stop. Skip the trailing extras like \"so, yeah, that's it\". Say your last line, pause, and say thank you.", body: "So here is what I hope you take away today. You do not need to be fearless to speak well. You only need to keep going while the fear is still there. Thank you." },
  // Lesson 11 (added 2026-10-15 for public speaking)
  { id: "l011", number: 11, title: "Open with a hook", text: "Open with a hook", goal: "A first line that makes people want the next. You’ll see your pitch in the words, and the coach’s note.", check: "coach", tip: "The first sentence decides whether people listen. Start with a question, a short story, or a surprising fact, not with \u201cHi, my name is\u201d or an apology. Then say why it matters to them.", body: "Last year our team spent four hundred hours in meetings that ended without a decision. / Four hundred hours. / That is ten full working weeks. / Today I want to show you how we won half of that time back, and how you can do the same." },
  // Lesson 12 (added 2026-10-15 for public speaking)
  { id: "l012", number: 12, title: "Tell a short story", text: "Tell a short story", goal: "Where you were, the turn and the point. You’ll see your pitch in the words, and the coach’s note.", check: "coach", tip: "A story beats a list of facts. Keep it short: where you were, what went wrong, the turn, and the point. One real detail lets the audience see it.", body: "Three years ago I gave my first talk at work. My hands were shaking and my notes were out of order. Halfway through I lost my place completely. I stopped, took a breath, and said: let me start that part again. Nobody minded. Afterwards a colleague told me that was the moment she started listening. The point is simple. A pause is not a failure. It is a chance to begin again." },
  // Lesson 13 (added 2026-10-15 for public speaking)
  { id: "l013", number: 13, title: "Bridges between points", text: "Bridges between points", goal: "Each bridge closes one point and opens the next. You’ll see your pitch in the words, and the coach’s note.", check: "coach", tip: "Listeners need to hear where one idea ends and the next begins. Close each point, then open the next with a bridge such as \u201cThat brings me to\u201d, \u201cSo what does this mean for us?\u201d or \u201cHere is the catch.\u201d", body: "Our first change was to cut the sign-up form from twelve fields to four. *That brings me to* the second change. We moved the price to the top of the page. *So what did this mean for us?* Sign-ups rose by a third in a month. *Here is the catch.* More sign-ups also meant more support calls, and that is where we need your help." },
  // Lesson 14 (added 2026-10-15 for public speaking)
  { id: "l014", number: 14, title: "Answer with point, reason, example", text: "Answer with point, reason, example", goal: "Your answer in the first sentence. You’ll see hedges and vague words underlined in what you said.", check: "coach", tip: "When someone asks you a question, answer it in your first sentence. Then give one reason and one example, and say your answer again. Stop there: a short answer sounds sure of itself.", body: "Should we move the launch to March? Yes, we should. The reason is that our biggest customer is busy until the end of February. Last year we launched in January, and half of our early users did not log in until spring. So yes, March gives us the better start." },
  // Lesson 15 (added 2026-10-15 for public speaking)
  { id: "l015", number: 15, title: "Recover from a blank", text: "Recover from a blank", goal: "A silent count of three, then carry on. You’ll see the long pause and whether you went on.", check: "recovery", tip: "Everyone loses their place sometimes. Do not apologise. Stop, breathe, say your last point again in a few words, and carry on. Where the text says so, stop and count to three in silence.", body: "Good afternoon. I want to share three things we learned this year. The first is that small teams move faster than big ones. [Stop here and count to three in silence.] Small teams move faster. The second is that customers forgive mistakes we fix quickly. The third is that the best ideas often came from the newest people on the team." },
  // Lesson 16 (added 2026-10-15 for public speaking)
  { id: "l016", number: 16, title: "Vocal variety", text: "Vocal variety", goal: "Pace, volume and pitch follow the meaning. You’ll see your pitch in the words, and your range.", check: "coach", tip: "A flat voice makes good words sound dull. Let your pace, volume and pitch follow the meaning: slower and lower for something serious, quicker and brighter for good news. Overdo it here; to listeners it will sound natural.", body: "I have some bad news, and some good news. The bad news first. We lost our biggest customer this month. That hurts, and it will hurt for a while. But here is the good news! Three new customers signed in the same week, and together they are bigger than the one we lost. So the year is not over. It is just getting interesting." },
];

// Find a lesson by its saved id
export function findLesson(id: string): Lesson | undefined {
  // Look it up
  return LESSONS.find((lesson) => lesson.id === id);
}
