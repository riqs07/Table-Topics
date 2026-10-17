// Small talk: the everyday questions, the four-beat recipe, and the six lessons (see documents/plan-small-talk.md)

// Load the calendar-day helper, for taking questions in turn
import { daysBetween } from "@/core/dates";

// One beat of a good answer
export interface Beat {
  // Stable id, also used as the listen-back tag
  id: BeatId;
  // Its short name, as on the strip
  name: string;
  // A one-line reminder while answering
  reminder: string;
  // Why it works, in one line
  why: string;
  // The listen-back question for it
  question: string;
}

// The four beats
export type BeatId = "moment" | "hook" | "feeling" | "hand-back";

// The recipe, in order
export const BEATS: ReadonlyArray<Beat> = [
  // One thing that happened
  { id: "moment", name: "Moment", reminder: "One thing that happened. Small is fine.", why: "One thing told well beats a list. Small moments make better stories than big events.", question: "Was there one clear moment?" },
  // Something to ask about
  { id: "hook", name: "Hook", reminder: "A detail they could ask about.", why: "People like those who ask follow-ups, so give them something to follow up on.", question: "Is there a detail someone could ask about?" },
  // Why it mattered
  { id: "feeling", name: "Feeling", reminder: "Why it mattered to you.", why: "Saying why it mattered is what makes it sound like you.", question: "Did you say how it felt, or sound like you enjoyed it?" },
  // A question back
  { id: "hand-back", name: "Hand back", reminder: "End with a real question.", why: "A question back turns your answer into a conversation.", question: "Did you end on a real question?" },
];

// Which kind of everyday question it is, easiest first
export type QuestionGroup = "recent" | "work" | "taste" | "plans";

// The groups' names, in order
export const QUESTION_GROUPS: ReadonlyArray<{ id: QuestionGroup; name: string }> = [
  // Things that just happened
  { id: "recent", name: "What you've been up to" },
  // Work
  { id: "work", name: "Work" },
  // Things you like
  { id: "taste", name: "Things you like" },
  // What's ahead
  { id: "plans", name: "What's coming up" },
];

// One everyday question
export interface SmallTalkQuestion {
  // Stable id stored with each answer
  id: string;
  // The question, as someone would say it
  text: string;
  // Its group
  group: QuestionGroup;
}

// The everyday questions, by group
export const SMALL_TALK_QUESTIONS: ReadonlyArray<SmallTalkQuestion> = [
  // Recent past
  { id: "st01", text: "How was your weekend?", group: "recent" },
  // Recent past
  { id: "st02", text: "What did you get up to this weekend?", group: "recent" },
  // Recent past
  { id: "st03", text: "How was your trip?", group: "recent" },
  // Recent past
  { id: "st04", text: "Anything fun lately?", group: "recent" },
  // Recent past
  { id: "st05", text: "How have you been?", group: "recent" },
  // Recent past
  { id: "st06", text: "What did you do yesterday?", group: "recent" },
  // Recent past
  { id: "st07", text: "How was your holiday?", group: "recent" },
  // Recent past
  { id: "st08", text: "So what's new with you?", group: "recent" },
  // Recent past
  { id: "st09", text: "How was your week?", group: "recent" },
  // Work
  { id: "st10", text: "How's work going?", group: "work" },
  // Work
  { id: "st11", text: "What are you working on these days?", group: "work" },
  // Work
  { id: "st12", text: "So what do you do?", group: "work" },
  // Work
  { id: "st13", text: "Busy week at work?", group: "work" },
  // Work
  { id: "st14", text: "How did you get into what you do?", group: "work" },
  // Work
  { id: "st15", text: "What's keeping you busy these days?", group: "work" },
  // Taste
  { id: "st16", text: "Seen anything good lately?", group: "taste" },
  // Taste
  { id: "st17", text: "Read anything good recently?", group: "taste" },
  // Taste
  { id: "st18", text: "What do you do for fun?", group: "taste" },
  // Taste
  { id: "st19", text: "Been anywhere good to eat lately?", group: "taste" },
  // Taste
  { id: "st20", text: "Listening to anything good?", group: "taste" },
  // Taste
  { id: "st21", text: "Got any hobbies at the moment?", group: "taste" },
  // Plans
  { id: "st22", text: "Anything fun coming up?", group: "plans" },
  // Plans
  { id: "st23", text: "Doing anything this weekend?", group: "plans" },
  // Plans
  { id: "st24", text: "Any plans for the holidays?", group: "plans" },
  // Plans
  { id: "st25", text: "Got any trips planned?", group: "plans" },
  // Plans
  { id: "st26", text: "What are you looking forward to this month?", group: "plans" },
  // Plans
  { id: "st27", text: "What's next for you?", group: "plans" },
];

// One lesson: an idea, a flat answer beside a good one, then your turn
export interface SmallTalkLesson {
  // Stable id, stored as the answer's prompt
  id: string;
  // Its place in the order
  number: number;
  // Its title
  title: string;
  // The idea, in a few lines
  idea: string;
  // The beat it teaches (none for the last, which puts them together)
  beat: BeatId | null;
  // A flat answer (none for the last)
  flat: string | null;
  // A good answer
  good: string;
  // The question you then answer
  question: string;
}

// The six lessons, in order
export const SMALL_TALK_LESSONS: ReadonlyArray<SmallTalkLesson> = [
  // Lesson 1
  { id: "stl1", number: 1, title: "The dead end", beat: null, idea: "“Good” or “Not much” gives the other person nothing to say next, so the conversation stops. Even a quiet weekend has one thing worth telling.", flat: "Good, pretty chill.", good: "Pretty quiet, but I finally fixed my bike, so that felt good.", question: "How was your weekend?" },
  // Lesson 2
  { id: "stl2", number: 2, title: "One moment", beat: "moment", idea: "Pick one thing and tell it, rather than listing everything you did. It does not need to be big: small moments make better stories.", flat: "I did some chores, watched TV, went to the store.", good: "I spent Saturday morning at the farmers’ market and found the best peaches I’ve had all year.", question: "What did you get up to yesterday?" },
  // Lesson 3
  { id: "stl3", number: 3, title: "Give a hook", beat: "hook", idea: "Add a detail someone could ask about: a name, a place, a number, something a little odd. Hooks are what let the other person keep the conversation going.", flat: "I watched a movie.", good: "I finally watched Dune. I saw it on the biggest screen I could find, and the sound alone was worth it.", question: "Seen anything good lately?" },
  // Lesson 4
  { id: "stl4", number: 4, title: "Say how it felt", beat: "feeling", idea: "Add one line on why it mattered to you: proud, relaxed, surprised, a bit obsessed. Events are facts; the feeling is what sounds like you.", flat: "Work’s fine. Busy.", good: "Busy, but in a good way. We shipped something I’ve been working on for months, and I was weirdly proud of it.", question: "How's work going?" },
  // Lesson 5
  { id: "stl5", number: 5, title: "Hand it back", beat: "hand-back", idea: "End with a real question, ideally about the same thing. It turns your answer into a conversation and shows you are interested in them too.", flat: "It was good. Anyway.", good: "We hiked to a lake with no one else around. It was such a good trip. Have you been anywhere this year?", question: "How was your trip?" },
  // Lesson 6
  { id: "stl6", number: 6, title: "All together", beat: null, idea: "Now all four in about thirty seconds: one moment, a hook, how it felt, and a question back.", flat: null, good: "Kind of a nerdy weekend: I built an app. It coaches me on public speaking, and I got it working on my phone on Sunday night. Way more fun than it sounds. Did you get up to anything good?", question: "So what's new with you?" },
];

// What an answer's prompt id stands for: the question, and the lesson when it was a lesson's turn
export function findSmallTalk(id: string): { question: string; lesson: SmallTalkLesson | null } | undefined {
  // A lesson's turn
  const lesson = SMALL_TALK_LESSONS.find((item) => item.id === id);
  // Its question, with the lesson
  if (lesson) return { question: lesson.question, lesson };
  // An everyday question
  const question = SMALL_TALK_QUESTIONS.find((item) => item.id === id);
  // Its text, or nothing
  return question ? { question: question.text, lesson: null } : undefined;
}

// The "one moment a day" note's question
export const MOMENT_PROMPT = { id: "moment", text: "What's one thing from today worth telling?" } as const;

// The lessons whose question is about what you have been up to (your moments help with these)
const RECENT_LESSONS = ["stl1", "stl2", "stl6"];

// Whether a prompt asks what you have been up to, where your recent moments are worth seeing first
export function asksWhatYouDid(promptId: string): boolean {
  // A recent-past question, or a lesson asking one
  return RECENT_LESSONS.includes(promptId) || SMALL_TALK_QUESTIONS.some((item) => item.id === promptId && item.group === "recent");
}

// Every small-talk prompt as id and text, so the app's prompt lookup finds them too
export const SMALL_TALK_PROMPTS: ReadonlyArray<{ id: string; text: string }> = [
  // The moment note's question
  MOMENT_PROMPT,
  // The everyday questions
  ...SMALL_TALK_QUESTIONS.map((item) => ({ id: item.id, text: item.text })),
  // The lessons' questions
  ...SMALL_TALK_LESSONS.map((item) => ({ id: item.id, text: item.question })),
];

// The everyday question for a day, taken in turn ("another question" moves it along)
export function smallTalkForDay(day: Date, offset = 0): SmallTalkQuestion {
  // Days since a fixed start, plus the offset
  const turn = daysBetween(new Date(2026, 0, 1), day) + offset;
  // Wrap around, keeping the index positive
  return SMALL_TALK_QUESTIONS[((turn % SMALL_TALK_QUESTIONS.length) + SMALL_TALK_QUESTIONS.length) % SMALL_TALK_QUESTIONS.length] as SmallTalkQuestion;
}
