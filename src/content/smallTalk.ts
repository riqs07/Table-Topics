// Small talk: seven units (answering, asking, listening, news, reading the room, starting and ending, going deeper), each with four beats, lessons and a bank of drills (see documents/plan-small-talk.md and plan-daily-mix-and-connection.md)

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

// The seven units: answering a question, asking a follow-up, listening to a story, responding to news, reading the room, starting and ending, and going deeper (decision 95)
export type UnitId = "answering" | "asking" | "listening" | "news" | "room" | "starting" | "deeper";

// The four beats of an answer
export type AnsweringBeat = "moment" | "hook" | "feeling" | "hand-back";
// The four beats of a follow-up question
export type AskingBeat = "open" | "their-detail" | "about-them" | "one-question";
// The four beats of a listening response
export type ListeningBeat = "react" | "their-words" | "their-feeling" | "stay";
// The four beats of a response to news (React and Stay are the listening beats, checked the same way)
export type NewsBeat = "react" | "ask-moment" | "stay" | "no-buts";
// The four beats of reading the room
export type RoomBeat = "noticed" | "check" | "follow" | "no-blame";
// The four beats of an opener and a goodbye
export type StartingBeat = "around" | "ask-in" | "thanks" | "send-off";
// The four beats of a deeper question (Open, About them and Just one are the asking beats, checked the same way)
export type DeeperBeat = "open" | "depth" | "about-them" | "one-question";
// Any beat
export type BeatId = AnsweringBeat | AskingBeat | ListeningBeat | NewsBeat | RoomBeat | StartingBeat | DeeperBeat;

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

// The reading-the-room recipe, in order (decision 95)
export const ROOM_BEATS: ReadonlyArray<Beat> = [
  // Say what changed
  { id: "noticed", name: "Name it", reminder: "Say the change you noticed, kindly.", why: "One glance tells you little; a change is worth mentioning.", question: "Did you say what you noticed?" },
  // Ask rather than guess
  { id: "check", name: "Ask", reminder: "Treat it as a question, not an answer.", why: "People read feelings from faces barely better than chance, so ask.", question: "Did you ask or check in?" },
  // Go where their energy is
  { id: "follow", name: "Their lead", reminder: "More of what lit them up, or an easy out.", why: "Nobody can tell when the other wants to stop, so an easy out is kind.", question: "Did you follow their lead?" },
  // No guilt trip
  { id: "no-blame", name: "Keep it light", reminder: "No “Am I boring you?”", why: "Asking for reassurance hands them a job; a light line keeps it easy.", question: "Did you keep it light?" },
];

// The starting-and-ending recipe, in order: two beats for the opener, two for the goodbye (decision 95)
export const STARTING_BEATS: ReadonlyArray<Beat> = [
  // Something you share
  { id: "around", name: "Something here", reminder: "Open on something you can both see.", why: "A remark about the shared moment is easy to answer and asks nothing personal.", question: "Did you open on something around you?" },
  // An easy question
  { id: "ask-in", name: "Easy question", reminder: "Ask something light, about here and now.", why: "Chats with strangers go better than people expect; an easy question starts one.", question: "Did your opener ask an easy question?" },
  // What you enjoyed
  { id: "thanks", name: "What you enjoyed", reminder: "End on what you liked: “Great talking.”", why: "People underestimate how much a warm word lands.", question: "Did you say what you enjoyed?" },
  // A reason and a wish
  { id: "send-off", name: "Warm goodbye", reminder: "A reason to go, and a warm wish.", why: "Conversations run longer than people want; a warm exit is a kindness.", question: "Did you give a reason and a warm wish?" },
];

// The going-deeper recipe, in order (Open, About them and Just one are checked as in asking; decision 95)
export const DEEPER_BEATS: ReadonlyArray<Beat> = [
  // Open, not yes-or-no
  { id: "open", name: "Open", reminder: "Start with what, how or why.", why: "“Did you like it?” gets a yes. “What was the best part?” gets a story.", question: "Did it start with what, how or why?" },
  // Invites a real answer
  { id: "depth", name: "Real answer", reminder: "Ask what they enjoy, chose or found hard.", why: "Deeper questions go better than people expect, for both people.", question: "Does it invite more than facts?" },
  // About them
  { id: "about-them", name: "About them", reminder: "Keep the question on them.", why: "Asking just to tell your own (boomerasking) seems less sincere.", question: "Did it stay about them?" },
  // One question
  { id: "one-question", name: "Just one", reminder: "One question, then stop.", why: "One question is easy to answer; a pile of them feels like an interview.", question: "Was it one question?" },
];

// How a unit's drill reaches you: said aloud by the voice, or read on a card (a moment described, or a flat question to improve)
export type DrillKind = "heard" | "situation" | "question";

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
  // Above the drill on the recording screen (none when the drill speaks for itself)
  cue: string | null;
  // Above a lesson's example
  example: string;
  // Above the coach's better version
  better: string;
  // The next drill, after "Next one:"
  next: string;
  // The heading over every drill on the unit's page (none when the page lists them another way, or keeps them hidden)
  list: string | null;
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
  // How its drills reach you: heard (the voice says them first), or read on a card with no voice (decision 95)
  drill: DrillKind;
  // Its words on screen
  words: UnitWords;
}

// The units, in order
export const UNITS: ReadonlyArray<Unit> = [
  // Answering
  { id: "answering", name: "Answering", when: "When someone asks how your weekend was.", youDo: "Hear an everyday question, then answer it out loud.", beats: BEATS, drill: "heard", words: { practice: "Answer a question", kicker: "A question for you", start: "Answer it", another: "or another question", recipe: "A good answer", band: "Answer a question", hear: "Hear the question", then: "then answer", said: "The question", history: "Small talk", cue: null, example: "They say", better: "Livelier", next: "another question", list: null } },
  // Asking
  { id: "asking", name: "Asking", when: "When someone tells you something: ask the follow-up.", youDo: "Hear something someone says, then ask one follow-up question.", beats: ASKING_BEATS, drill: "heard", words: { practice: "Ask a follow-up", kicker: "Someone says", start: "Ask a follow-up", another: "or something else", recipe: "A good follow-up", band: "Ask a follow-up", hear: "Hear it", then: "then ask", said: "They said", history: "Follow-up", cue: "They say", example: "They say", better: "A better follow-up", next: "something else they say", list: "Things people say" } },
  // Listening
  { id: "listening", name: "Listening", when: "When someone tells you a story: show you heard it.", youDo: "Hear a short story (it is not shown), then respond to it out loud.", beats: LISTENING_BEATS, drill: "heard", words: { practice: "Listen to a story", kicker: "A short story, heard and not read", start: "Listen and respond", another: "or another story", recipe: "A good response", band: "Hear a story", hear: "Hear the story", then: "then respond", said: "Their story", history: "Listening", cue: null, example: "They say", better: "A better response", next: "another story", list: null } },
  // Responding to news
  { id: "news", name: "News", when: "When someone shares good or bad news: react, ask, no buts.", youDo: "Hear someone's news, then respond out loud.", beats: NEWS_BEATS, drill: "heard", words: { practice: "Respond to news", kicker: "Someone tells you", start: "Respond to it", another: "or other news", recipe: "A good response to news", band: "Respond to news", hear: "Hear their news", then: "then respond", said: "Their news", history: "News", cue: "They tell you", example: "They say", better: "A better response", next: "other news", list: "News people share" } },
  // Reading the room (decision 95)
  { id: "room", name: "Reading the room", when: "When their energy changes: notice it, then ask or adjust.", youDo: "Read a moment from a conversation, then say what you'd say.", beats: ROOM_BEATS, drill: "situation", words: { practice: "Read the room", kicker: "In a conversation", start: "Say what you'd say", another: "or another moment", recipe: "Reading the room", band: "Read the room", hear: "Answer it", then: "say what you'd say", said: "The moment", history: "Reading the room", cue: "The moment", example: "The moment", better: "A better response", next: "another moment", list: "Moments to read" } },
  // Starting and ending (decision 95)
  { id: "starting", name: "Starting and ending", when: "When you meet someone: open easily, leave warmly.", youDo: "Read a situation, then say an opener and a goodbye.", beats: STARTING_BEATS, drill: "situation", words: { practice: "Open and close", kicker: "The situation", start: "Say both", another: "or another situation", recipe: "An opener and a goodbye", band: "Open and close", hear: "Say both", then: "an opener, then a goodbye", said: "The situation", history: "Starting and ending", cue: "The situation", example: "The situation", better: "Could sound like", next: "another situation", list: "Situations" } },
  // Going deeper (decision 95)
  { id: "deeper", name: "Going deeper", when: "When small talk stays small: one question that invites a real answer.", youDo: "Read a flat question, then ask a better one out loud.", beats: DEEPER_BEATS, drill: "question", words: { practice: "Upgrade the question", kicker: "Upgrade this question", start: "Ask it better", another: "or another question", recipe: "A deeper question", band: "Upgrade a question", hear: "Ask it better", then: "one question, out loud", said: "The flat question", history: "Going deeper", cue: "Upgrade this question", example: "The flat question", better: "A better question", next: "another question", list: "Questions to upgrade" } },
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
  // What you then answer: a question, something someone says, a story, a moment, a situation or a flat question
  question: string;
  // Why it works, in one line from the research, with its source (the units added in decision 95 have one)
  why?: string;
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
  { id: "sal1", unit: "asking", number: 1, title: "Ask about what they said", beat: "their-detail", example: "I just got back from a week in Lisbon.", idea: "The best follow-up picks up a detail they just gave you. It shows you listened, and gives them an easy next step.", flat: "Cool. I went to Spain once.", good: "Lisbon! What was the best thing you ate there?", question: "I've been learning to make bread." },
  // Asking, lesson 2
  { id: "sal2", unit: "asking", number: 2, title: "Open, not yes-or-no", beat: "open", example: "We finally finished painting the house.", idea: "Questions that start with did, is or do get a yes or a no. Questions that start with what, how or why invite a story.", flat: "Did it take long?", good: "How did you pick the colour?", question: "I went to my first climbing class on Saturday." },
  // Asking, lesson 3
  { id: "sal3", unit: "asking", number: 3, title: "Don't boomerask", beat: "about-them", example: "I started running in the mornings.", idea: "Asking a question just so you can answer it yourself makes you seem less sincere. Ask because you want their answer.", flat: "How far do you go? I do ten k most days.", good: "What got you started?", question: "We adopted a dog last week." },
  // News, lesson 1
  { id: "snl1", unit: "news", number: 1, title: "Good news needs a real reaction", beat: "react", example: "I passed my driving test this morning!", idea: "How you meet someone's good news matters more than how you meet their bad news. A real reaction and a question about the moment build trust; a quick “nice” ends it.", flat: "Nice, well done.", good: "No way, you passed! How did it feel when they told you?", question: "We just found out we're having a baby." },
  // News, lesson 2
  { id: "snl2", unit: "news", number: 2, title: "Bad news: understood before advice", beat: "no-buts", example: "My flat fell through. We were meant to move on Friday.", idea: "Before any advice, show you understood, that the feeling makes sense, and that you care. Advice can wait until it is asked for.", flat: "Have you tried other agents? There are loads of flats around.", good: "Two days before the move? That's awful. How are you holding up?", question: "I didn't get into the course I applied for." },
  // News, lesson 3
  { id: "snl3", unit: "news", number: 3, title: "Their news, not yours", beat: "stay", example: "I got promoted to team lead!", idea: "“Same, I just got a raise” takes the spotlight just as they step into it. Stay with their news for a few turns.", flat: "Congrats! I'm actually up for promotion too.", good: "Team lead! What does that mean for your week?", question: "I finally finished my first marathon." },
  // Listening, lesson 1
  { id: "sll1", unit: "listening", number: 1, title: "React to the story", beat: "react", example: "My flight got cancelled, so I slept at the airport. At 3am a cleaner gave me her own blanket.", idea: "When listeners react to the specific moment, not just “mm-hmm”, storytellers tell their stories better.", flat: "Oh, okay.", good: "No way. She gave you her own blanket? That's so kind.", question: "I lost my phone at a concert on Saturday. Two days later a woman emailed me. She'd found it in the grass and posted it back with a little note." },
  // Listening, lesson 2
  { id: "sll2", unit: "listening", number: 2, title: "Say back the feeling", beat: "their-feeling", example: "I ran the marathon, but my legs gave out a mile from the end.", idea: "Repeating the facts is not the point. Saying how it must have felt shows you understood.", flat: "So you walked the last mile.", good: "After all that training? That must have been frustrating, and still good to finish.", question: "My best friend moved across the country last month. We used to get coffee every Sunday. Yesterday was the first Sunday I didn't know what to do with myself." },
  // Listening, lesson 3
  { id: "sll3", unit: "listening", number: 3, title: "Stay with them", beat: "stay", example: "I got lost hiking on Sunday and didn't get back to the car until after dark.", idea: "“That happened to me too” moves the talk to you. Stay on their story: ask what happened next.", flat: "Oh, I got lost once in Scotland.", good: "After dark? How did you find your way back?", question: "My little brother called me out of nowhere to ask for advice about a girl. He has never asked me for advice about anything." },
  // Reading the room, lesson 1 (decision 95)
  { id: "srl1", unit: "room", number: 1, title: "Notice changes, not signals", beat: "noticed", example: "Your friend's long stories have turned into “yeah” and “sure”.", idea: "One glance or crossed arms tell you little. A change tells you more: they light up, or their answers get shorter. Notice it, then say it kindly.", why: "Faces and poses are poor clues to feelings on their own; change and context say more (Barrett et al., 2019).", flat: "So anyway, then the landlord said…", good: "You've gone a bit quiet. Long day?", question: "Your coworker was chatty at lunch, but now answers in single words and stares at their screen." },
  // Reading the room, lesson 2
  { id: "srl2", unit: "room", number: 2, title: "Ask, don't guess", beat: "check", example: "They keep checking their phone while you talk.", idea: "A look at the phone could mean you're boring, or that they're waiting for news. You can't tell, so ask, or make it easy.", why: "People spot lies from body language 54% of the time, barely above chance (Bond & DePaulo, 2006).", flat: "Sorry, I'll be quick. So basically…", good: "Do you need to get that? Go ahead, I don't mind.", question: "They keep looking over your shoulder towards the door." },
  // Reading the room, lesson 3
  { id: "srl3", unit: "room", number: 3, title: "Go where they light up", beat: "follow", example: "Jo's face changes when she mentions her allotment, then she asks about your week.", idea: "When someone talks faster, leans in or smiles, you've found their topic. Stay there: ask one more thing about it.", why: "People who ask more follow-up questions are liked more (Huang et al., 2017).", flat: "Oh, my week was fine. Mostly work.", good: "Wait, go back. You lit up at the allotment. What are you growing?", question: "Your neighbour's face brightens as soon as you mention the street party." },
  // Reading the room, lesson 4
  { id: "srl4", unit: "room", number: 4, title: "Offer an easy out", beat: "follow", example: "They've put their coat on, but keep chatting at the door.", idea: "Shorter answers, a coat going on, a look at the clock: they may want to go. Make leaving easy and warm.", why: "Conversations almost never end when both people want, and we can't tell when the other wants to stop (Mastroianni et al., 2021).", flat: "Oh, and one more thing about my trip…", good: "I'll let you go. This was great, thanks for staying.", question: "Your coworker keeps glancing at the clock while you tell a story." },
  // Reading the room, lesson 5
  { id: "srl5", unit: "room", number: 5, title: "Looking away is normal", beat: "no-blame", example: "You ask what got them into teaching. They look away and go quiet.", idea: "Eye contact rises and falls: people look away to think. Don't fill the pause or ask if you're boring them. Wait, and keep it light.", why: "In real conversations, shared gaze peaks at moments of shared attention, then breaks so each person can think (Wohltjen & Wheatley, 2021).", flat: "Sorry, is that a weird question? Am I boring you?", good: "Take your time. I'm curious.", question: "Halfway through your question, they look out of the window and go quiet." },
  // Reading the room, lesson 6
  { id: "srl6", unit: "room", number: 6, title: "All together", beat: null, example: "Sam talks faster as he describes his new project, then glances at his watch.", idea: "Notice the change, name it kindly, ask, and follow their lead. A real smile and a nod show interest better than any pose.", why: "Real smiles read as more genuine and trustworthy (Gunnery & Ruben, 2016); copying body language on purpose did nothing in a careful test (Hale & Hamilton, 2016).", flat: null, good: "You really light up about this project. Tell me more, unless you need to head off?", question: "A quiet new colleague gives one-word answers, then perks up when you mention the music playing." },
  // Starting and ending, lesson 1 (decision 95)
  { id: "sel1", unit: "starting", number: 1, title: "Open on what's around you", beat: "around", example: "Waiting for the kettle in the office kitchen with a coworker you haven't met.", idea: "No clever line needed. Say something about what you're both seeing or doing, then ask an easy question about it.", why: "In a week of talk-to-a-stranger missions, most chats were with the first person approached, and the fear of rejection fell (Sandstrom et al.).", flat: "So… what do you do?", good: "This kettle takes forever, doesn't it? Are you on this floor too?", question: "At a friend's barbecue, you're next to someone you don't know, both holding paper plates." },
  // Starting and ending, lesson 2
  { id: "sel2", unit: "starting", number: 2, title: "An easy first question", beat: "ask-in", example: "At a conference, someone sits next to you before the first talk.", idea: "Keep the first question light, about here and now. Deeper can come later, once you're both talking.", why: "Pairs who shared a little more in turns liked each other more than pairs who went deep in one go (Sprecher et al., 2013).", flat: "So what's your life story?", good: "Have you been to one of these before? Which talk are you here for?", question: "In the queue at a café that has just changed its menu." },
  // Starting and ending, lesson 3
  { id: "sel3", unit: "starting", number: 3, title: "Names: give yours, ask theirs", beat: "ask-in", example: "You're early to a meeting, and one other person is already there.", idea: "Say your name early and ask theirs. Link it to something (“Priya, who runs on Sundays”), and use it once when you say goodbye.", why: "Linking a name to meaning and recalling it later makes it stick; saying it often to be liked has no research behind it.", flat: "Hi.", good: "Hi, I'm Sam. I don't think we've met. What's your name?", question: "At a wedding, you're seated next to a guest you don't know." },
  // Starting and ending, lesson 4
  { id: "sel4", unit: "starting", number: 4, title: "Leave while it's good", beat: "send-off", example: "You've been chatting at a party for a while, and it's still going well.", idea: "Conversations rarely end when both people want them to. Leave on a high point, with a reason and a warm wish.", why: "In two large studies, conversations ran past when at least one person wanted to stop, and people couldn't tell when the other did (Mastroianni et al., 2021).", flat: "Um… anyway… so yeah.", good: "I'll let you grab some food. Good luck with the move on Saturday!", question: "At the dog park, your chat with another owner is winding down." },
  // Starting and ending, lesson 5
  { id: "sel5", unit: "starting", number: 5, title: "Say what you enjoyed", beat: "thanks", example: "You've been talking with a new colleague about her bike trip.", idea: "Before you go, name one thing you liked about the chat. It shows you listened, and they leave feeling good.", why: "People underestimate how good a kind word makes others feel, and overestimate the awkwardness (Boothby & Bohns, 2021).", flat: "Okay, bye.", good: "I've really enjoyed this, especially the bike trip. I'll let you get on. Enjoy your day!", question: "You've been chatting with your new neighbour about their garden." },
  // Starting and ending, lesson 6
  { id: "sel6", unit: "starting", number: 6, title: "All together", beat: null, example: "Before a yoga class, someone puts their mat down next to yours.", idea: "Both ends in one go: an opener about something around you, with an easy question; then, a few minutes later, what you enjoyed and a warm goodbye.", why: "Talking to strangers goes better than people predict, and the worry drops with practice (Sandstrom et al.).", flat: null, good: "Is it always this busy on Mondays? … Great chatting. I'd better grab a spot, but enjoy the class!", question: "On a delayed train, the person opposite sighs at the announcement." },
  // Going deeper, lesson 1 (decision 95)
  { id: "sdl1", unit: "deeper", number: 1, title: "They like you more than you think", beat: null, example: "What do you do?", idea: "After a chat, most people think the other person liked them less than they did. So you can afford one question that's a bit more real.", why: "Strangers kept underestimating how much their partner liked them; people watching could see it (Boothby et al., 2018).", flat: "Oh nice. Do you like it?", good: "What's the best part of what you do?", question: "How was your weekend?" },
  // Going deeper, lesson 2
  { id: "sdl2", unit: "deeper", number: 2, title: "Open, not yes-or-no", beat: "open", example: "Did you have a good holiday?", idea: "Questions starting with did, is or do get a yes or a no. What, how and why invite a story.", why: "Questions that invite more get more to follow up on, and follow-ups are where liking grows (Huang et al., 2017).", flat: "Was the weather nice?", good: "What was the best moment of the trip?", question: "Are you enjoying the course?" },
  // Going deeper, lesson 3
  { id: "sdl3", unit: "deeper", number: 3, title: "Ask about meaning, not facts", beat: "depth", example: "How long have you lived here?", idea: "Facts are quick to give and quick to forget. Ask what they enjoy, why they chose it, or what surprised them.", why: "Across twelve experiments, deeper talk with strangers went better than people expected (Kardas, Kumar & Epley, 2022).", flat: "How many years?", good: "What made you choose this town?", question: "Where are you from?" },
  // Going deeper, lesson 4
  { id: "sdl4", unit: "deeper", number: 4, title: "Deeper goes better than you expect", beat: "depth", example: "How's the new job?", idea: "People expect deeper questions to feel awkward. Mostly they don't: both people feel closer and enjoy it more than they predicted.", why: "When people learned that others enjoy deeper talk, they chose deeper questions, and those talks went well (Kardas, Kumar & Epley, 2022).", flat: "Good so far?", good: "What's surprised you most about it?", question: "Do you have any hobbies?" },
  // Going deeper, lesson 5
  { id: "sdl5", unit: "deeper", number: 5, title: "Share a little first", beat: "about-them", example: "How's work?", idea: "Only asking feels like an interview. Share a little of your answer, then ask, and keep the question on them.", why: "We like people who open up to us, and taking turns to share builds closeness (Collins & Miller, 1994; Sprecher et al., 2013).", flat: "Busy? Mine's crazy, three deadlines this week.", good: "Mine's been a lot this week, honestly. What's been the best part of yours?", question: "How's the family?" },
  // Going deeper, lesson 6
  { id: "sdl6", unit: "deeper", number: 6, title: "All together", beat: null, example: null, idea: "One open question about what matters to them, with a little of you first if it fits. Then stop and listen.", why: "Deeper talk felt more connecting than people predicted, and small talk is still a fine way in (Kardas et al., 2022; Milek et al., 2018).", flat: null, good: "I've always wondered this about teaching. What keeps you in it?", question: "What do you do?" },
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

// Moments from a conversation, to read the room in: some changes mean "more of this", some "time to go", some only "they're thinking" (decision 95)
export const ROOM_DRILLS: ReadonlyArray<SmallTalkDrill> = [
  // Winding down
  { id: "sr01", text: "Their answers are getting shorter, and they keep checking their phone." },
  // Lighting up
  { id: "sr02", text: "At a party, Jo lights up when she mentions her allotment, then turns the talk back to you." },
  // Winding down
  { id: "sr03", text: "Your coworker keeps glancing at the clock while you tell a story." },
  // Thinking
  { id: "sr04", text: "Halfway through your question, they look away and go quiet for a few seconds." },
  // A change in a friend
  { id: "sr05", text: "A friend who is usually chatty says “fine” twice and stares into their coffee." },
  // Lighting up
  { id: "sr06", text: "Your neighbour's face brightens as soon as you mention the street party." },
  // One-sided
  { id: "sr07", text: "You've talked about your trip for a while, and they haven't asked anything back." },
  // Winding down
  { id: "sr08", text: "They keep looking over your shoulder towards the door." },
  // Lighting up
  { id: "sr09", text: "At a work event, someone talks faster and laughs as they describe their new project." },
  // A joke that missed
  { id: "sr10", text: "You joke about their team losing, and their smile drops a little." },
  // Winding down
  { id: "sr11", text: "They've put their coat on, but keep chatting at the door." },
  // Lighting up
  { id: "sr12", text: "A quiet new colleague gives one-word answers, then perks up when you mention the music playing." },
];

// Situations to open and close a conversation in (decision 95)
export const STARTING_DRILLS: ReadonlyArray<SmallTalkDrill> = [
  // Work
  { id: "se01", text: "Waiting for the kettle in the office kitchen with a coworker you haven't met." },
  // Home
  { id: "se02", text: "Your new neighbour is carrying boxes in from a van." },
  // A party
  { id: "se03", text: "At a friend's barbecue, you're next to someone you don't know, both holding paper plates." },
  // Out
  { id: "se04", text: "In the queue at a café that has just changed its menu." },
  // An event
  { id: "se05", text: "At a conference, someone sits next to you before the first talk." },
  // Out
  { id: "se06", text: "At the dog park, another owner's puppy runs straight up to you." },
  // Work
  { id: "se07", text: "You're early to a meeting, and one other person is already there." },
  // A party
  { id: "se08", text: "At a wedding, you're seated next to a guest you don't know." },
  // Travel
  { id: "se09", text: "On a delayed train, the person opposite sighs at the announcement." },
  // A group
  { id: "se10", text: "It's your first book club, and only one other person has arrived." },
  // A class
  { id: "se11", text: "Before a yoga class, someone puts their mat down next to yours." },
  // Work
  { id: "se12", text: "In the lift, you meet the colleague whose report you read yesterday." },
];

// Flat questions to upgrade into ones that invite a real answer (decision 95)
export const DEEPER_DRILLS: ReadonlyArray<SmallTalkDrill> = [
  // Work
  { id: "sd01", text: "What do you do?" },
  // Recent
  { id: "sd02", text: "How was your weekend?" },
  // Background
  { id: "sd03", text: "Where are you from?" },
  // Recent
  { id: "sd04", text: "Did you have a good holiday?" },
  // Work
  { id: "sd05", text: "How's the new job?" },
  // Learning
  { id: "sd06", text: "Are you enjoying the course?" },
  // Free time
  { id: "sd07", text: "Do you have any hobbies?" },
  // Background
  { id: "sd08", text: "How long have you lived here?" },
  // Work
  { id: "sd09", text: "Busy week?" },
  // Taste
  { id: "sd10", text: "Have you read anything good lately?" },
  // Family
  { id: "sd11", text: "How's the family?" },
  // A goal
  { id: "sd12", text: "Is the training going well?" },
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
  // Its text
  if (story) return { question: story.text, lesson: null, unit: "listening" };
  // A moment, situation or flat question from the units added in decision 95
  const card = CARD_BANKS.map((bank) => ({ unit: bank.unit, drill: bank.drills.find((item) => item.id === id) })).find((item) => item.drill);
  // Its text and unit, or nothing
  return card?.drill ? { question: card.drill.text, lesson: null, unit: card.unit } : undefined;
}

// The banks read on a card rather than heard, with their units (decision 95)
const CARD_BANKS: ReadonlyArray<{ unit: UnitId; drills: ReadonlyArray<SmallTalkDrill> }> = [
  // Moments to read the room in
  { unit: "room", drills: ROOM_DRILLS },
  // Situations to open and close in
  { unit: "starting", drills: STARTING_DRILLS },
  // Flat questions to upgrade
  { unit: "deeper", drills: DEEPER_DRILLS },
];

// How many words of a long drill (a story, or a moment or situation read on a card) a list shows
const LABEL_WORDS = 8;

// One line for a response in History: the unit's word and what was said, a long one cut short (null when the prompt is not small talk)
export function responseLabel(promptId: string): string | null {
  // What was said, and its unit
  const found = findSmallTalk(promptId);
  // Not small talk
  if (!found) return null;
  // The words
  const words = found.question.split(/\s+/);
  // Long ones (a story, or a moment or situation read on a card) cut short
  const text = (found.unit === "listening" || findUnit(found.unit).drill === "situation") && words.length > LABEL_WORDS ? `${words.slice(0, LABEL_WORDS).join(" ")}…` : found.question;
  // With the unit's word
  return `${findUnit(found.unit).words.history}: ${text}`;
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
  // The moments, situations and flat questions (decision 95)
  ...ROOM_DRILLS,
  ...STARTING_DRILLS,
  ...DEEPER_DRILLS,
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
  return { id: bank[(index + 1) % bank.length]!.id, label: findUnit(unitOf(promptId)).words.next };
}

// Each unit's drills: everyday questions, remarks, stories, news, moments, situations or flat questions (a record, so a new unit cannot be left out)
const DRILL_BANKS: Readonly<Record<UnitId, ReadonlyArray<SmallTalkDrill>>> = { answering: SMALL_TALK_QUESTIONS, asking: ASKING_DRILLS, listening: LISTENING_STORIES, news: NEWS_DRILLS, room: ROOM_DRILLS, starting: STARTING_DRILLS, deeper: DEEPER_DRILLS };

// A unit's drills
export function drillBank(unit: UnitId): ReadonlyArray<SmallTalkDrill> {
  // The unit's bank
  return DRILL_BANKS[unit];
}
