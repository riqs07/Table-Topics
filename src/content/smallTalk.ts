// Small talk: three units (answering, asking, listening), each with four beats, lessons and a bank of drills (see documents/plan-small-talk.md and plan-daily-mix-and-connection.md)

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

// The four units: answering a question, asking a follow-up, listening to a story, and responding to news
export type UnitId = "answering" | "asking" | "listening" | "news";

// The four beats of an answer
export type AnsweringBeat = "moment" | "hook" | "feeling" | "hand-back";
// The four beats of a follow-up question
export type AskingBeat = "open" | "their-detail" | "about-them" | "one-question";
// The four beats of a listening response
export type ListeningBeat = "react" | "their-words" | "their-feeling" | "stay";
// The four beats of a response to news (React and Stay are the listening beats, checked the same way)
export type NewsBeat = "react" | "ask-moment" | "stay" | "no-buts";
// Any beat
export type BeatId = AnsweringBeat | AskingBeat | ListeningBeat | NewsBeat;

// The answering recipe, in order
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

// The asking recipe, in order
export const ASKING_BEATS: ReadonlyArray<Beat> = [
  // Open, not yes-or-no
  { id: "open", name: "Open", reminder: "Start with what, how or why.", why: "“Did it take long?” gets a yes. “How did you pick the colour?” gets a story.", question: "Did it start with what, how or why?" },
  // About what they said
  { id: "their-detail", name: "Their detail", reminder: "Pick up something they just said.", why: "A follow-up on their own words shows you listened, and people like those who ask follow-ups.", question: "Did you ask about something they said?" },
  // About them
  { id: "about-them", name: "About them", reminder: "Keep it on them, not you.", why: "Asking just to tell your own story (boomerasking) makes you seem less sincere.", question: "Did it stay about them?" },
  // One short question
  { id: "one-question", name: "Just one", reminder: "One short question, then stop.", why: "One short question is easy to answer. A pile of them feels like an interview.", question: "Was it one short question?" },
];

// The listening recipe, in order
export const LISTENING_BEATS: ReadonlyArray<Beat> = [
  // React to it
  { id: "react", name: "React", reminder: "Show it landed: “No way!” or “Oh no.”", why: "When listeners react to the moment, storytellers tell it better.", question: "Did you react to the story?" },
  // Use their words
  { id: "their-words", name: "Their words", reminder: "Mention something from their story.", why: "Using their details is how they know you heard them.", question: "Did you mention something from their story?" },
  // Their feeling
  { id: "their-feeling", name: "Their feeling", reminder: "Say how it must have felt.", why: "Saying back the feeling, not just the facts, is what makes people feel understood.", question: "Did you say how it must have felt?" },
  // Stay with them
  { id: "stay", name: "Stay", reminder: "No story of your own yet. Ask what happened next.", why: "“That happened to me too” moves the talk to you. Staying keeps their story going.", question: "Did it stay on their story?" },
];

// The responding-to-news recipe, in order (decision 55)
export const NEWS_BEATS: ReadonlyArray<Beat> = [
  // React to it
  { id: "react", name: "React", reminder: "A real reaction first: “No way!” or “Oh no.”", why: "Enthusiastic replies to good news go with more trust and closeness; quiet ones do not.", question: "Did you react before anything else?" },
  // Ask about it
  { id: "ask-moment", name: "Ask about it", reminder: "Ask about the moment or how they are.", why: "A question about their news shows you want to hear more of it.", question: "Did you ask about their news?" },
  // Stay with them
  { id: "stay", name: "Stay", reminder: "Their news, not yours.", why: "Bringing up your own news takes the spotlight as they step into it.", question: "Did it stay on their news?" },
  // No buts
  { id: "no-buts", name: "No buts", reminder: "No downside, no advice yet.", why: "A downside reads as doubt, and advice before understanding makes people feel less heard.", question: "Did you leave out downsides and advice?" },
];

// The words a unit uses on screen
export interface UnitWords {
  // The practice box's name
  practice: string;
  // What is said, in small italic above it
  kicker: string;
  // Starting it
  start: string;
  // Another one
  another: string;
  // The recipe's heading
  recipe: string;
  // The main action when its lessons are done
  band: string;
  // The button that plays it
  hear: string;
  // After it plays
  then: string;
  // On the results, above what was said
  said: string;
  // In History
  history: string;
}

// One unit: its name, what it is for, and its beats
export interface Unit {
  // Stable id
  id: UnitId;
  // Its name
  name: string;
  // When you would use it, in one line
  when: string;
  // What you do in a drill
  youDo: string;
  // Its recipe
  beats: ReadonlyArray<Beat>;
  // Its words on screen
  words: UnitWords;
}

// The units, in order
export const UNITS: ReadonlyArray<Unit> = [
  // Answering
  { id: "answering", name: "Answering", when: "When someone asks how your weekend was.", youDo: "Hear an everyday question, then answer it out loud.", beats: BEATS, words: { practice: "Answer a question", kicker: "A question for you", start: "Answer it", another: "or another question", recipe: "A good answer", band: "Answer a question", hear: "Hear the question", then: "then answer", said: "The question", history: "Small talk" } },
  // Asking
  { id: "asking", name: "Asking", when: "When someone tells you something: ask the follow-up.", youDo: "Hear something someone says, then ask one follow-up question.", beats: ASKING_BEATS, words: { practice: "Ask a follow-up", kicker: "Someone says", start: "Ask a follow-up", another: "or something else", recipe: "A good follow-up", band: "Ask a follow-up", hear: "Hear it", then: "then ask", said: "They said", history: "Follow-up" } },
  // Listening
  { id: "listening", name: "Listening", when: "When someone tells you a story: show you heard it.", youDo: "Hear a short story (it is not shown), then respond to it out loud.", beats: LISTENING_BEATS, words: { practice: "Listen to a story", kicker: "A short story, heard and not read", start: "Listen and respond", another: "or another story", recipe: "A good response", band: "Hear a story", hear: "Hear the story", then: "then respond", said: "Their story", history: "Listening" } },
  // Responding to news
  { id: "news", name: "News", when: "When someone shares good or bad news: react, ask, no buts.", youDo: "Hear someone's news, then respond out loud.", beats: NEWS_BEATS, words: { practice: "Respond to news", kicker: "Someone tells you", start: "Respond to it", another: "or other news", recipe: "A good response to news", band: "Respond to news", hear: "Hear their news", then: "then respond", said: "Their news", history: "News" } },
];

// A unit by id
export function findUnit(id: UnitId): Unit {
  // Every id is listed
  return UNITS.find((unit) => unit.id === id) as Unit;
}

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
  // Its unit
  unit: UnitId;
  // Its place in its unit's order
  number: number;
  // Its title
  title: string;
  // The idea, in a few lines
  idea: string;
  // The beat it teaches (none for the last, which puts them together)
  beat: BeatId | null;
  // What the other person said in the example, for asking and listening (an answering lesson's examples answer an everyday question)
  example: string | null;
  // A flat answer (none for the last)
  flat: string | null;
  // A good answer
  good: string;
  // What you then answer: a question, something someone says, or a story
  question: string;
}

// The lessons, unit by unit, in order
export const SMALL_TALK_LESSONS: ReadonlyArray<SmallTalkLesson> = [
  // Lesson 1
  { id: "stl1", unit: "answering", number: 1, title: "The dead end", beat: null, example: null, idea: "“Good” or “Not much” gives the other person nothing to say next, so the conversation stops. Even a quiet weekend has one thing worth telling.", flat: "Good, pretty chill.", good: "Pretty quiet, but I finally fixed my bike, so that felt good.", question: "How was your weekend?" },
  // Lesson 2
  { id: "stl2", unit: "answering", number: 2, title: "One moment", beat: "moment", example: null, idea: "Pick one thing and tell it, rather than listing everything you did. It does not need to be big: small moments make better stories.", flat: "I did some chores, watched TV, went to the store.", good: "I spent Saturday morning at the farmers’ market and found the best peaches I’ve had all year.", question: "What did you get up to yesterday?" },
  // Lesson 3
  { id: "stl3", unit: "answering", number: 3, title: "Give a hook", beat: "hook", example: null, idea: "Add a detail someone could ask about: a name, a place, a number, something a little odd. Hooks are what let the other person keep the conversation going.", flat: "I watched a movie.", good: "I finally watched Dune. I saw it on the biggest screen I could find, and the sound alone was worth it.", question: "Seen anything good lately?" },
  // Lesson 4
  { id: "stl4", unit: "answering", number: 4, title: "Say how it felt", beat: "feeling", example: null, idea: "Add one line on why it mattered to you: proud, relaxed, surprised, a bit obsessed. Events are facts; the feeling is what sounds like you.", flat: "Work’s fine. Busy.", good: "Busy, but in a good way. We shipped something I’ve been working on for months, and I was weirdly proud of it.", question: "How's work going?" },
  // Lesson 5
  { id: "stl5", unit: "answering", number: 5, title: "Hand it back", beat: "hand-back", example: null, idea: "End with a real question, ideally about the same thing. It turns your answer into a conversation and shows you are interested in them too.", flat: "It was good. Anyway.", good: "We hiked to a lake with no one else around. It was such a good trip. Have you been anywhere this year?", question: "How was your trip?" },
  // Lesson 6
  { id: "stl6", unit: "answering", number: 6, title: "All together", beat: null, example: null, idea: "Now all four in about thirty seconds: one moment, a hook, how it felt, and a question back.", flat: null, good: "Kind of a nerdy weekend: I built an app. It coaches me on public speaking, and I got it working on my phone on Sunday night. Way more fun than it sounds. Did you get up to anything good?", question: "So what's new with you?" },
  // Asking, lesson 1
  { id: "sal1", unit: "asking", number: 1, title: "Ask about what they said", beat: "their-detail", example: "I just got back from a week in Lisbon.", idea: "The best follow-up picks up a detail they just gave you. It shows you listened, and it gives them an easy thing to say next.", flat: "Cool. I went to Spain once.", good: "Lisbon! What was the best thing you ate there?", question: "I've been learning to make bread." },
  // Asking, lesson 2
  { id: "sal2", unit: "asking", number: 2, title: "Open, not yes-or-no", beat: "open", example: "We finally finished painting the house.", idea: "Questions that start with did, is or do get a yes or a no. Questions that start with what, how or why invite a story.", flat: "Did it take long?", good: "How did you pick the colour?", question: "I went to my first climbing class on Saturday." },
  // Asking, lesson 3
  { id: "sal3", unit: "asking", number: 3, title: "Don't boomerask", beat: "about-them", example: "I started running in the mornings.", idea: "Asking a question just so you can answer it yourself (“How far do you go? I do ten kilometres”) makes you seem less sincere. Ask because you want their answer, then let them talk.", flat: "Nice, how far do you go? I've been doing ten k most days.", good: "What got you started?", question: "We adopted a dog last week." },
  // News, lesson 1
  { id: "snl1", unit: "news", number: 1, title: "Good news needs a real reaction", beat: "react", example: "I passed my driving test this morning!", idea: "How you meet someone's good news matters more than how you meet their bad news. A real reaction and a question about the moment build trust; a quick “nice” ends it.", flat: "Nice, well done.", good: "No way, you passed! How did it feel when they told you?", question: "We just found out we're having a baby." },
  // News, lesson 2
  { id: "snl2", unit: "news", number: 2, title: "Bad news: understood before advice", beat: "no-buts", example: "My flat fell through. We were meant to move on Friday.", idea: "Before any advice, show you understood, that the feeling makes sense, and that you care. Advice can wait until it is asked for.", flat: "Have you tried other agents? There are loads of flats around.", good: "Two days before the move? That's awful. How are you holding up?", question: "I didn't get into the course I applied for." },
  // News, lesson 3
  { id: "snl3", unit: "news", number: 3, title: "Their news, not yours", beat: "stay", example: "I got promoted to team lead!", idea: "“Same, I just got a raise” takes the spotlight just as they step into it. Stay with their news for a few turns before you share any of yours.", flat: "Congrats! I'm actually up for promotion too.", good: "Team lead! What does that mean for your week?", question: "I finally finished my first marathon." },
  // Listening, lesson 1
  { id: "sll1", unit: "listening", number: 1, title: "React to the story", beat: "react", example: "My flight got cancelled, so I slept in the airport. At three in the morning a cleaner gave me her own blanket.", idea: "When listeners react to the specific moment, storytellers tell their stories better. “Mm-hmm” is fine; “No way, she gave you her blanket?” is better.", flat: "Oh, okay.", good: "No way. She gave you her own blanket? That's so kind.", question: "I lost my phone at a concert on Saturday. Two days later a woman emailed me. She'd found it in the grass and posted it back with a little note." },
  // Listening, lesson 2
  { id: "sll2", unit: "listening", number: 2, title: "Say back the feeling", beat: "their-feeling", example: "I finally ran the marathon. My legs gave out a mile from the end, so I walked the rest.", idea: "Repeating the facts is not the point. Saying how it must have felt shows you understood.", flat: "So you walked the last mile.", good: "After all that training? That must have been so frustrating, and still so good to finish.", question: "My best friend moved across the country last month. We used to get coffee every Sunday. Yesterday was the first Sunday I didn't know what to do with myself." },
  // Listening, lesson 3
  { id: "sll3", unit: "listening", number: 3, title: "Stay with them", beat: "stay", example: "I got lost hiking on Sunday and didn't get back to the car until after dark.", idea: "“That happened to me too” moves the talk to you. Stay on their story a little longer: ask what happened next, or how it ended.", flat: "Oh, I got lost once in Scotland. It was awful.", good: "After dark? How did you find your way back?", question: "My little brother called me out of nowhere to ask for advice about a girl. He has never asked me for advice about anything." },
];

// One drill: something said to you, by id
export interface SmallTalkDrill {
  // Stable id stored with each response
  id: string;
  // What they say
  text: string;
}

// Things people say, to ask a follow-up about
export const ASKING_DRILLS: ReadonlyArray<SmallTalkDrill> = [
  // Travel
  { id: "sa01", text: "I just got back from a week in Lisbon." },
  // Home
  { id: "sa02", text: "We finally finished painting the house." },
  // A habit
  { id: "sa03", text: "I started running in the mornings." },
  // Family
  { id: "sa04", text: "My sister's getting married next month." },
  // A hobby
  { id: "sa05", text: "I've been teaching myself to play the piano." },
  // Work
  { id: "sa06", text: "Work's been a lot. We're moving offices." },
  // Something new
  { id: "sa07", text: "I went to my first pottery class on Saturday." },
  // A pet
  { id: "sa08", text: "We got a kitten last week." },
  // A book
  { id: "sa09", text: "I'm reading this book about octopuses." },
  // A change
  { id: "sa10", text: "I just switched teams at work." },
  // A trip
  { id: "sa11", text: "We drove up the coast for the weekend." },
  // Cooking
  { id: "sa12", text: "I've been trying to cook something new every week." },
];

// News people share, good and bad, to respond to
export const NEWS_DRILLS: ReadonlyArray<SmallTalkDrill> = [
  // Good
  { id: "sn01", text: "I got the job! The one I interviewed for last month." },
  // Bad
  { id: "sn02", text: "My dog's been really sick this week. We're at the vet again tomorrow." },
  // Good
  { id: "sn03", text: "We just bought our first house." },
  // Bad
  { id: "sn04", text: "My project got cancelled. Six months of work, gone." },
  // Good
  { id: "sn05", text: "My sister had her baby last night. I'm an aunt!" },
  // Bad
  { id: "sn06", text: "I failed my driving test again." },
  // Good
  { id: "sn07", text: "I got into the masters programme I applied for." },
  // Bad
  { id: "sn08", text: "We broke up last week. It's been a lot." },
  // Good
  { id: "sn09", text: "My book club picked the novel I wrote. They actually liked it." },
  // Bad
  { id: "sn10", text: "I hurt my knee, so I have to pull out of the race I trained for." },
];

// Short stories people tell, to respond to
export const LISTENING_STORIES: ReadonlyArray<SmallTalkDrill> = [
  // The train
  { id: "sls01", text: "So I was on the train this morning, and the man next to me fell asleep on my shoulder. I didn't want to wake him, so I missed my stop. I got to work twenty minutes late, and my boss was the one waiting in the lobby." },
  // A phone call
  { id: "sls02", text: "I finally called my grandmother last night. I'd been putting it off for weeks. She talked for an hour about her garden, and at the end she said it was the best part of her week. I felt terrible for waiting so long." },
  // A breakdown
  { id: "sls03", text: "My car broke down on the highway on Friday. I was stuck on the shoulder for two hours in the rain. A stranger pulled over and waited with me until the tow truck came. He wouldn't even tell me his name." },
  // A presentation
  { id: "sls04", text: "I gave my first presentation to the whole company on Tuesday. I was so nervous I barely slept. Halfway through, the slides froze. I just kept talking, and afterwards three people came up to say it was the best talk of the day." },
  // Camping
  { id: "sls05", text: "We tried to take the kids camping. It rained the entire time, the tent leaked, and we ended up sleeping in the car. But the kids keep saying it was the best trip we've ever done." },
  // An old teacher
  { id: "sls06", text: "I ran into my old teacher at the grocery store. She remembered my name, and the essay I wrote in her class twenty years ago. I didn't know what to say. I just stood there holding a bag of onions." },
  // The job
  { id: "sls07", text: "I finally got the job. Six interviews, a take-home project, and two months of waiting. They called while I was in the dentist's chair, so I had to accept with a numb mouth." },
  // The cat
  { id: "sls08", text: "My neighbour knocked on my door at midnight because her cat was stuck on my roof. We spent an hour out there with a ladder and a flashlight. In the end the cat jumped down by itself and walked straight past us." },
];

// What a prompt id stands for in small talk
export interface FoundSmallTalk {
  // What is said to you: a question, a remark, or a story
  question: string;
  // The lesson, when it was a lesson's turn
  lesson: SmallTalkLesson | null;
  // Its unit
  unit: UnitId;
}

// What an answer's prompt id stands for: what was said, its unit, and the lesson when it was a lesson's turn
export function findSmallTalk(id: string): FoundSmallTalk | undefined {
  // A lesson's turn
  const lesson = SMALL_TALK_LESSONS.find((item) => item.id === id);
  // Its question, with the lesson
  if (lesson) return { question: lesson.question, lesson, unit: lesson.unit };
  // An everyday question
  const question = SMALL_TALK_QUESTIONS.find((item) => item.id === id);
  // Its text
  if (question) return { question: question.text, lesson: null, unit: "answering" };
  // Something said, to follow up on
  const remark = ASKING_DRILLS.find((item) => item.id === id);
  // Its text
  if (remark) return { question: remark.text, lesson: null, unit: "asking" };
  // News to respond to
  const news = NEWS_DRILLS.find((item) => item.id === id);
  // Its text
  if (news) return { question: news.text, lesson: null, unit: "news" };
  // A story to respond to
  const story = LISTENING_STORIES.find((item) => item.id === id);
  // Its text, or nothing
  return story ? { question: story.text, lesson: null, unit: "listening" } : undefined;
}

// The unit a prompt belongs to (answering when it is not known)
export function unitOf(promptId: string): UnitId {
  // Looked up
  return findSmallTalk(promptId)?.unit ?? "answering";
}

// The beats for a prompt's unit
export function beatsFor(unit: UnitId): ReadonlyArray<Beat> {
  // The unit's recipe
  return findUnit(unit).beats;
}

// A unit's lessons, in order
export function lessonsFor(unit: UnitId): ReadonlyArray<SmallTalkLesson> {
  // Filtered
  return SMALL_TALK_LESSONS.filter((lesson) => lesson.unit === unit);
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
  // The remarks to follow up on
  ...ASKING_DRILLS,
  // The stories to respond to
  ...LISTENING_STORIES,
  // The news to respond to
  ...NEWS_DRILLS,
];

// The everyday question for a day, taken in turn ("another question" moves it along)
export function smallTalkForDay(day: Date, offset = 0): SmallTalkQuestion {
  // Days since a fixed start, plus the offset
  const turn = daysBetween(new Date(2026, 0, 1), day) + offset;
  // Wrap around, keeping the index positive
  return SMALL_TALK_QUESTIONS[((turn % SMALL_TALK_QUESTIONS.length) + SMALL_TALK_QUESTIONS.length) % SMALL_TALK_QUESTIONS.length] as SmallTalkQuestion;
}

// A unit's drill for a day, taken in turn ("another" moves it along): an everyday question, a remark, or a story
export function drillForDay(unit: UnitId, day: Date, offset = 0): SmallTalkDrill {
  // Answering uses the everyday questions
  if (unit === "answering") return smallTalkForDay(day, offset);
  // The bank
  const bank = drillBank(unit);
  // Days since a fixed start, plus the offset
  const turn = daysBetween(new Date(2026, 0, 1), day) + offset;
  // Wrap around, keeping the index positive
  return bank[((turn % bank.length) + bank.length) % bank.length] as SmallTalkDrill;
}

// The one after a prompt in its unit, for "Next one": the next lesson (then the unit's first drill after the last), or the next drill in the bank (wrapping round)
export function nextInUnit(promptId: string): { id: string; label: string } {
  // A lesson
  const lesson = SMALL_TALK_LESSONS.find((item) => item.id === promptId);
  // Its unit's lessons
  if (lesson) {
    // The next lesson in the unit
    const next = lessonsFor(lesson.unit).find((item) => item.number === lesson.number + 1);
    // That lesson, or the unit's first drill
    return next ? { id: next.id, label: `Lesson ${next.number}: ${next.title}` } : { id: drillBank(lesson.unit)[0]!.id, label: "now practise it" };
  }
  // The bank this prompt is in
  const bank = drillBank(unitOf(promptId));
  // Its place there
  const index = bank.findIndex((item) => item.id === promptId);
  // The next, wrapping round
  return { id: bank[(index + 1) % bank.length]!.id, label: NEXT_LABELS[unitOf(promptId)] };
}

// What the next drill is, by unit
const NEXT_LABELS: Record<UnitId, string> = { answering: "another question", asking: "something else they say", listening: "another story", news: "other news" };

// A unit's drills: everyday questions, remarks, or stories
function drillBank(unit: UnitId): ReadonlyArray<SmallTalkDrill> {
  // The unit's bank
  return unit === "answering" ? SMALL_TALK_QUESTIONS : unit === "asking" ? ASKING_DRILLS : unit === "news" ? NEWS_DRILLS : LISTENING_STORIES;
}
