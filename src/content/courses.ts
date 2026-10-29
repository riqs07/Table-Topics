// Guided courses (decisions 131 and 144): a course for each focus, made of lessons, each lesson made of short parts, each part a few steps (learn, see it when there is something to see, try, wrap up) that use the modes the app already has. The outlines are in documents/course-outlines.md

// Load the focus areas a course belongs to
import type { FocusAreaId } from "@/core/practiceFocus";
// Load the kinds of session a part can record, and a story's set-up
import type { SessionMode, StoryTake } from "@/data/records";

// What a part's practice is compared on between tries, and when its prompt comes back: pause words, pace or length (more measures, such as time to the point, come with the real content)
export type CourseMeasure = "fillers" | "pace" | "length";

// The idea a part teaches, read first
export interface PartLearn {
  // The idea in one line, large
  headline: string;
  // A few sentences on it
  body: string;
  // A weaker way to say it (optional)
  instead?: string;
  // The better way (optional)
  tryThis?: string;
  // The Learn card with the research behind the idea, by its id (optional; shown as a link under the idea)
  card?: string;
  // A practice the course cannot record itself, such as a voice drill or a conversation, to open from the idea (optional)
  link?: { href: string; label: string };
}

// Something to see before trying: a short video, a model answer, or both (optional on a part)
export interface PartSee {
  // A YouTube video, shown through YouTube's privacy-enhanced player, with the stretch to watch in seconds (optional)
  video?: { youtubeId: string; title: string; start?: number; end?: number };
  // A model answer: the question, the answer, and the words in it to highlight (optional)
  model?: { question: string; answer: string; highlight: string; notice: string };
}

// The kinds of session a part can record: each opens the usual recording page, which saves the take with the course part and goes back to the course
export type CoursePracticeMode = Extract<SessionMode, "talk" | "response" | "free" | "story" | "read" | "pause" | "smalltalk" | "lesson">;

// A part's practice: a kind of session the app already has, on a fixed prompt (so it can come back later), with one goal
export interface PartPractice {
  // The kind of session
  mode: CoursePracticeMode;
  // The prompt it uses: a question, a story prompt, a passage, a small-talk question or a lesson, by its id
  promptId: string;
  // For a story: its template or shape, a focus and its length (optional; the story's suggested template otherwise)
  story?: StoryTake;
  // The one thing to do
  goal: string;
  // One try, or two when a second try helps
  tries: 1 | 2;
  // What the tries are compared on
  measure: CourseMeasure;
}

// One part of a lesson, a few minutes long
export interface CoursePart {
  // Stable id, unique across every course (kept in saved progress)
  id: string;
  // Its name
  title: string;
  // The idea
  learn: PartLearn;
  // Something to see, when there is something
  see?: PartSee;
  // The practice, when the part has some
  practice?: PartPractice;
}

// One lesson: one skill, in a few parts
export interface CourseLesson {
  // Stable id within its course
  id: string;
  // Its name
  title: string;
  // One line on it
  blurb: string;
  // Its parts, in order
  parts: ReadonlyArray<CoursePart>;
}

// One course
export interface Course {
  // Stable id (kept in saved progress through its parts)
  id: string;
  // The focus it belongs to
  focus: FocusAreaId;
  // Its name
  title: string;
  // One line on what it does
  blurb: string;
  // What you can do by the end
  outcomes: ReadonlyArray<string>;
  // Whether its words are still a draft (shown on the course page until the real lessons are written)
  draft: boolean;
  // Its lessons, in order
  lessons: ReadonlyArray<CourseLesson>;
}

// The courses, in the order Practice shows them: one for each focus area (decision 144)
export const COURSES: ReadonlyArray<Course> = [
  // Thinking on your feet: the first course (decisions 131 and 144)
  {
    id: "stop-freezing",
    focus: "spot",
    title: "Stop freezing",
    blurb: "Answer anything out of the blue in a minute, without the ums.",
    outcomes: ["Start within two seconds, with a breath instead of an “um”", "Say your answer in the first sentence", "Fill a minute with point, reason, example", "End on purpose, then stop", "Get going again after a blank"],
    draft: false,
    lessons: [
      // Lesson 1
      {
        id: "beat",
        title: "Buy a beat",
        blurb: "Breathe, then start. A pause sounds sure.",
        parts: [
          // A pause instead of a filler
          { id: "sf-beat-1", title: "Pause, don’t fill", learn: { headline: "A pause sounds sure. An “um” sounds lost.", body: "When a question surprises you, silence feels long to you and short to everyone listening. Take one breath before your first word. Later, when you reach for “um”, close your mouth and pause instead. Listeners use the pause to catch up.", instead: "“Um, so, uh, I think…”", tryThis: "(a breath) “I think…”", card: "voice-silent-pause" }, practice: { mode: "talk", promptId: "t003", goal: "Take a breath before your first word, and pause instead of saying “um”.", tries: 2, measure: "fillers" } },
          // Starting before the whole answer is ready
          { id: "sf-beat-2", title: "Start within two seconds", learn: { headline: "Start with the first true thing.", body: "You don’t need the whole answer before you begin. Say the first honest thing you think (“Sundays? Slow ones.”) and build from there. The rest of the answer arrives while you speak, and you look far calmer than you feel.", card: "nerves-show" }, practice: { mode: "talk", promptId: "t006", goal: "Start speaking within a couple of seconds of seeing the topic.", tries: 1, measure: "fillers" } },
          // An honest line that buys time
          { id: "sf-beat-3", title: "Buy time honestly", learn: { headline: "Need a moment? Say the question back.", body: "Repeating the question in a few words gives you three seconds, checks you heard it right, and sounds thoughtful. Then pause, and answer. Skip the long stall (“That’s a really, really interesting question”): one short line is enough.", instead: "“Um, so, that’s, uh, a really interesting question, um…”", tryThis: "“The perfect sandwich? (a breath) Simple: good bread, one thing done well.”", card: "point-repeat-question" }, practice: { mode: "talk", promptId: "t016", goal: "Say the question back in a few words, pause, then answer.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 2
      {
        id: "point",
        title: "Point first",
        blurb: "Say your answer in the first sentence.",
        parts: [
          // The answer before the reasons
          { id: "sf-point-1", title: "Answer first", learn: { headline: "Say your answer first. Explain after.", body: "When a question surprises you, the instinct is to warm up out loud: background, context, “so basically…”. Listeners decide what you think from your first sentence. Put the answer there, then give your reasons.", instead: "“So, um, I guess it kind of depends, there are a lot of things to think about…”", tryThis: "“Autumn. The light is better, and nobody expects much of you.”", card: "point-prep" }, see: { model: { question: "Should everyone learn to cook?", answer: "Yes, the basics. Five meals you can make without a recipe saves money and gets you through any week. My dad taught me one each birthday, and I still cook all five.", highlight: "Yes, the basics.", notice: "The answer is three words long and comes before any reason." } }, practice: { mode: "talk", promptId: "t004", goal: "Say your answer in the first sentence.", tries: 2, measure: "fillers" } },
          // Choosing a side
          { id: "sf-point-2", title: "Pick a side", learn: { headline: "Pick a side, even a small one.", body: "“It depends” is a way of not answering. Choose the side you lean towards, say it plainly, and let your reasons carry the nuance. Keep “I think” for what you’re really unsure of.", instead: "“Hmm, it depends, both are nice really.”", tryThis: "“City break. A beach is lovely, but I’m bored by day two.”", card: "words-hedges" }, practice: { mode: "talk", promptId: "t011", goal: "Pick a side in your first sentence.", tries: 1, measure: "fillers" } },
          // The first sentence as the headline
          { id: "sf-point-3", title: "The headline test", learn: { headline: "Your first sentence is the headline.", body: "If someone heard only your first sentence, would they know your answer? A newspaper puts the news in the headline, not in the fourth paragraph. Do the same, then use the rest of the minute to make it interesting." }, practice: { mode: "talk", promptId: "t012", goal: "Make your first sentence the whole answer in short.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 3
      {
        id: "pre",
        title: "Point, reason, example",
        blurb: "Three beats fill a minute without wandering.",
        parts: [
          // The three beats
          { id: "sf-pre-1", title: "Three beats", learn: { headline: "Point, reason, example.", body: "Say what you think, say why, then give one example from your own life. Three beats are enough for a minute, and they keep you from wandering. Finish by saying your point again.", card: "point-prep" }, see: { model: { question: "What would you name a boat?", answer: "Second Wind. Boats are for people who finally have time again. My uncle bought his the year he retired and called it exactly that.", highlight: "Second Wind.", notice: "Point, then a reason, then one real example." } }, practice: { mode: "talk", promptId: "t008", goal: "Point, then a reason, then one example.", tries: 2, measure: "length" } },
          // The example as the place time comes from
          { id: "sf-pre-2", title: "Make it a minute", learn: { headline: "An example buys you time.", body: "When you run dry, go back into your example and slow it down: where you were, who was there, what happened, what someone said. A real example with a name, a place or a number fills the time, and it’s the part people remember.", card: "point-concrete" }, practice: { mode: "talk", promptId: "t009", goal: "Keep going to a minute with one detailed example.", tries: 1, measure: "length" } },
          // Other shapes for other questions
          { id: "sf-pre-3", title: "Other shapes", learn: { headline: "When it doesn’t fit, try then, now, next.", body: "Some questions want a different shape. For “how has it changed?”, try then, now, next. For “what would you change?”, try problem, fix, result. Pick a shape in your first breath and follow it.", tryThis: "“An extra hour? I used to waste them. Now I’d read. Next year, I want to finish twelve books.”" }, practice: { mode: "talk", promptId: "t025", goal: "Pick a shape (then, now, next, or problem, fix, result) and follow it.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 4
      {
        id: "land",
        title: "Land it",
        blurb: "End on purpose, not with “so, yeah”.",
        parts: [
          // The point again at the end
          { id: "sf-land-1", title: "End on purpose", learn: { headline: "Finish where you started.", body: "Say your point once more in a few words, then stop. Trailing off with “so, yeah” undoes a good answer. Know your last line before you need it.", instead: "“…so yeah, I don’t know, that’s kind of it.”", tryThis: "“So: crisps. Every time.”", card: "skills-close" }, practice: { mode: "talk", promptId: "t010", goal: "Say your point again at the end, then stop.", tries: 2, measure: "fillers" } },
          // Silence after the end
          { id: "sf-land-2", title: "Then stop", learn: { headline: "Silence after the end is fine.", body: "Once you have said your last line, stop talking. The quiet that follows feels long to you and sounds like a full stop to them. Let it mark the end.", card: "nerves-silence" }, practice: { mode: "talk", promptId: "t005", goal: "Stop cleanly after your last line.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 5
      {
        id: "back",
        title: "Back on track",
        blurb: "Going blank happens. Getting going again is a skill.",
        parts: [
          // Saying the point again to get going
          { id: "sf-back-1", title: "Go back to your point", learn: { headline: "Blank? Say your point again.", body: "When your mind goes blank, don’t search in silence for the next new thing. Breathe, say your last point again in a few words, and the next sentence usually follows. To listeners it sounds like emphasis.", instead: "“And… um… sorry, I’ve lost it.”", tryThis: "“So: a week as a lighthouse keeper. A week of quiet.”", card: "skills-blank" }, practice: { mode: "talk", promptId: "t019", goal: "If you stall, say your point again and carry on.", tries: 2, measure: "length" } },
          // An example as a way out
          { id: "sf-back-2", title: "The example rescue", learn: { headline: "“For example…” opens a door.", body: "Saying “for example” commits you to a story before you’ve found one, and your memory nearly always supplies one. It also turns a thin answer into a minute." }, practice: { mode: "talk", promptId: "t035", goal: "Say “for example” at least once, and tell the example in detail.", tries: 1, measure: "length" } },
          // A stumble is smaller than it feels
          { id: "sf-back-3", title: "Nobody minds", learn: { headline: "A stumble is smaller than it feels.", body: "People notice your slips far less than you think, and most forget them within seconds. If you lose your place, a calm “Where was I? Right…” sounds human, not lost. Then carry on, without apologising.", card: "nerves-spotlight" }, practice: { mode: "talk", promptId: "t021", goal: "Keep going after any stumble, without apologising.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 6
      {
        id: "run",
        title: "The run",
        blurb: "Everything at once, twice in a row.",
        parts: [
          // Two in a row
          { id: "sf-run-1", title: "Two in a row", learn: { headline: "Breathe, point, reason, example, land.", body: "Put it all together on a new topic, then do it again straight away. The second go is usually the better one: notice what changed." }, practice: { mode: "talk", promptId: "t007", goal: "Breathe, point first, one example, then land it.", tries: 2, measure: "fillers" } },
          // A weightier question with time to think
          { id: "sf-run-2", title: "A bigger question", learn: { headline: "Bigger questions, same shape.", body: "Now a question with more weight, and a little time to think first. Use the time to choose your point and your example, not to write a script. Then speak it." }, practice: { mode: "response", promptId: "p003", goal: "Point first, one real example, then land it.", tries: 1, measure: "fillers" } },
        ],
      },
    ],
  },
  // Speaking at work (decision 144)
  {
    id: "explain-it-simply",
    focus: "work",
    title: "Explain it simply",
    blurb: "Updates, explanations and ideas that land the first time.",
    outcomes: ["Give an update that leads with the bottom line", "Explain your work to someone outside it", "Speak up early in a meeting, and disagree kindly", "Say “I don’t know” well", "Pitch an idea in a minute"],
    draft: false,
    lessons: [
      // Lesson 1
      {
        id: "bottom",
        title: "Bottom line first",
        blurb: "Lead with where it stands, or what you need.",
        parts: [
          // The status or the ask first
          { id: "ex-bottom-1", title: "Lead with the news", learn: { headline: "Where it stands, then what you need.", body: "Busy listeners decide in your first sentence whether to keep listening. Put the status or the ask first, then the detail, and only as much detail as they ask for.", instead: "“So on Monday we met the supplier, and they mentioned some issues with the parts, and then on Tuesday…”", tryThis: "“We’re a week late. I need one more tester to catch up. Here’s why.”", card: "work-update" }, see: { model: { question: "Your manager asks how the launch is going.", answer: "We’re on track for the 14th. The one risk is the payment screen, and I’ll know by Thursday if it needs another day. Everything else is done.", highlight: "We’re on track for the 14th.", notice: "The status comes first, then the one risk, with a date." } }, practice: { mode: "response", promptId: "cw12", goal: "Say where it stands in your first sentence.", tries: 2, measure: "length" } },
          // Short, then stop
          { id: "ex-bottom-2", title: "Stop when it’s said", learn: { headline: "Thirty seconds, then stop.", body: "An update isn’t a diary. Say where it stands, what you need, and stop. If they want more, they’ll ask, and a question means they’re listening." }, practice: { mode: "talk", promptId: "cw01", goal: "Answer in under 30 seconds, bottom line first.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 2
      {
        id: "update",
        title: "The 60-second update",
        blurb: "Done, next, need: three slots that fit any update.",
        parts: [
          // Three slots
          { id: "ex-update-1", title: "Done, next, need", learn: { headline: "Done, next, need.", body: "Most updates fit three slots: what’s done, what’s next, and what you need from whom. Naming the slots out loud (“Three things: done, next, need”) gives your listeners a map, and keeps you on it.", card: "skills-signpost" }, see: { model: { question: "Give a quick update at the team meeting.", answer: "Three things. Done: the new form is live, and 40 people used it on day one. Next: fixing the two bugs they found, by Friday. Need: ten minutes with Priya to check the wording.", highlight: "Three things.", notice: "It names the slots, uses one number, and ends on a clear ask." } }, practice: { mode: "response", promptId: "cw11", goal: "Use done, next, need, and name the slots out loud.", tries: 2, measure: "length" } },
          // Numbers and names
          { id: "ex-update-2", title: "Numbers need room", learn: { headline: "Give numbers and names room.", body: "Figures, dates and names are the part people need, and the part they miss when you rush. Slow down a touch for each one, and leave a short pause after it.", card: "skills-numbers" }, practice: { mode: "lesson", promptId: "l003", goal: "Slow down for every number and name.", tries: 1, measure: "pace" } },
        ],
      },
      // Lesson 3
      {
        id: "simple",
        title: "Explain it to a friend",
        blurb: "Plain words, one picture, and a check it landed.",
        parts: [
          // Plain words
          { id: "ex-simple-1", title: "Plain words", learn: { headline: "If a shorter word works, use it.", body: "Jargon feels precise to you and sounds like fog to everyone else. Plain words don’t make you sound simple: in studies, people judged plainly written work as coming from someone more intelligent. If a word needs explaining, swap it.", instead: "“We’re leveraging cross-functional synergies to optimise throughput.”", tryThis: "“Two teams now share one queue, so orders go out a day sooner.”", card: "words-plain" }, practice: { mode: "response", promptId: "p037", goal: "No word a ten-year-old wouldn’t know.", tries: 2, measure: "fillers" } },
          // One comparison
          { id: "ex-simple-2", title: "Give it a picture", learn: { headline: "One comparison does the explaining.", body: "Find one thing they already know that works like yours: “It’s like a library card, but for the office printers.” A good comparison saves a paragraph of explaining, and it’s what people repeat later.", card: "charisma-metaphor" }, see: { model: { question: "What does a project manager do?", answer: "I’m a bit like a wedding planner for software. I don’t build anything myself, but I make sure the cake, the band and the venue all turn up on the same day.", highlight: "a bit like a wedding planner for software", notice: "One comparison carries the whole explanation." } }, practice: { mode: "talk", promptId: "cw06", goal: "Use one comparison: “It’s like…”.", tries: 1, measure: "fillers" } },
          // Checking it landed
          { id: "ex-simple-3", title: "Check it landed", learn: { headline: "You hear the tune. They hear the taps.", body: "Once you know something, it’s hard to imagine not knowing it, so your explanation sounds clearer to you than to them. End with a check that invites a real answer: “Which part should I say more about?”", card: "point-curse" }, practice: { mode: "response", promptId: "cw13", goal: "End with a question that checks it landed.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 4
      {
        id: "meetings",
        title: "Speak up in meetings",
        blurb: "Say something early, bring a way forward, disagree kindly.",
        parts: [
          // Early, with a way forward
          { id: "ex-meet-1", title: "Say something early", learn: { headline: "Speak in the first few minutes.", body: "The longer you wait, the higher the bar feels. A question or a short “Yes, and…” in the first few minutes gets you into the room. When you raise a problem, bring a way forward with it.", instead: "“The handover is really slow.”", tryThis: "“The handover is slow. What if we kept one shared checklist?”", card: "work-speak-up" }, practice: { mode: "talk", promptId: "cw02", goal: "Give your view and one suggestion in your first two sentences.", tries: 2, measure: "fillers" } },
          // Disagreeing without a fight
          { id: "ex-meet-2", title: "Disagree kindly", learn: { headline: "Show you heard it, then push back.", body: "Start with what you understand of their view, say “I think” rather than “obviously”, then give yours with one reason. People who disagree this way come across as better to work with, and their point is more likely to be heard.", instead: "“No, that won’t work.”", tryThis: "“I can see Monday helps with planning. I think 8am will clash with the school run for half the team, though.”", card: "hard-disagree" }, practice: { mode: "talk", promptId: "cw05", goal: "Say what you understand of their view before you give yours.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 5
      {
        id: "dontknow",
        title: "When you don’t know",
        blurb: "Say so, say when, and answer the part you can.",
        parts: [
          // Admitting the gap well
          { id: "ex-know-1", title: "Say so, then say when", learn: { headline: "“I don’t know yet. I’ll find out by Friday.”", body: "Guessing to fill a silence is how small mistakes become big ones. A plain “I don’t know” with a date, and the part you do know, sounds more capable than a vague answer, not less." }, see: { model: { question: "“How many customers will this affect?”", answer: "I don’t know the exact number yet. What I do know is it’s only people on the old plan, which is under ten per cent. I’ll have the real figure by Thursday.", highlight: "What I do know is", notice: "It admits the gap, answers the part it can, and gives a date." } }, practice: { mode: "talk", promptId: "cw03", goal: "Say what you don’t know, what you do, and when you’ll know more.", tries: 2, measure: "fillers" } },
          // Saying the question back
          { id: "ex-know-2", title: "Say the question back", learn: { headline: "In Q&A, say the question back first.", body: "Repeating or rephrasing the question gives you a moment to think, makes sure everyone heard it, and keeps you answering the question that was asked rather than the one you feared.", card: "point-repeat-question" }, practice: { mode: "talk", promptId: "cw07", goal: "Rephrase the question in a few words, then answer it directly.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 6
      {
        id: "run",
        title: "The run: pitch an idea",
        blurb: "Problem, idea, ask, in a minute.",
        parts: [
          // The pitch shape
          { id: "ex-run-1", title: "Problem, idea, ask", learn: { headline: "Problem, idea, ask.", body: "To get a yes, say the problem in a line people feel, your idea in a line they can picture, and exactly what you’re asking for. Three strong reasons are plenty; a fourth, weaker one makes people doubt the rest.", card: "minds-three-claims" }, see: { model: { question: "Pitch an idea to your team.", answer: "Every Monday we lose an hour hunting for last week’s notes. If we keep them on one shared page, that hour comes back. Can we try it for a month, starting next week?", highlight: "Can we try it for a month, starting next week?", notice: "Problem, idea and a small, specific ask, in three sentences." } }, practice: { mode: "response", promptId: "cw14", goal: "Problem, idea, then a clear ask.", tries: 2, measure: "length" } },
          // A bigger case, with the objection
          { id: "ex-run-2", title: "Make the case", learn: { headline: "Name their best objection, then answer it.", body: "Now a bigger ask. Say the strongest objection in fair words (“You might think it’ll slow us down”), then answer it. People trust a case more when it has looked at the other side.", card: "minds-two-sided" }, practice: { mode: "response", promptId: "p040", goal: "Bottom line first, one objection answered, then your ask.", tries: 1, measure: "length" } },
        ],
      },
    ],
  },
  // A talk coming up (decision 144)
  {
    id: "ready-by-the-day",
    focus: "talk",
    title: "Ready by the day",
    blurb: "Get a toast, talk or pitch ready for a set date.",
    outcomes: ["Say your talk’s message in one sentence", "Open without “Hi, I’m… today I’ll talk about…”", "Close on a line people remember", "Give a talk from keywords, then from nothing", "Handle the nerves on the day"],
    draft: false,
    lessons: [
      // Lesson 1
      {
        id: "message",
        title: "One message",
        blurb: "Know the one thing they should remember.",
        parts: [
          // The one sentence
          { id: "rd-msg-1", title: "The one sentence", learn: { headline: "If they remember one thing, what is it?", body: "Before slides or jokes, write your message as one sentence a friend could repeat. Everything in the talk either supports it or goes. If you can’t say it in a sentence, the talk isn’t ready to write yet.", instead: "“My talk is about our year.”", tryThis: "“This year we learned that small, fast tests beat big launches.”", link: { href: "/rehearse", label: "Have a talk coming up? Add it to Rehearse my talk" } }, practice: { mode: "response", promptId: "ct01", goal: "Say your message in one sentence, then why it matters.", tries: 2, measure: "length" } },
          // Three points at most
          { id: "rd-msg-2", title: "Three points at most", learn: { headline: "Three points, then stop.", body: "Three strong points are plenty; a fourth, weaker one makes people doubt the rest. Choose the three that best support your message and cut the others, however good they are.", card: "minds-three-claims" }, practice: { mode: "lesson", promptId: "l008", goal: "Three items, the last with a little extra weight.", tries: 1, measure: "pace" } },
        ],
      },
      // Lesson 2
      {
        id: "open",
        title: "Open strong",
        blurb: "A hook first; your name can wait.",
        parts: [
          // A hook, not throat-clearing
          { id: "rd-open-1", title: "Skip the throat-clearing", learn: { headline: "Open with a hook, not your name.", body: "“Hi, I’m Sam, and today I’ll be talking about…” spends your best moment on nothing. Start with a question, a moment or a number, then say why it matters to them. You can introduce yourself after.", instead: "“Hi everyone, thanks for having me. So today I’m going to talk about sleep.”", tryThis: "“Last night, a third of you slept less than six hours. Here’s why that matters more than coffee.”", card: "skills-hook" }, practice: { mode: "response", promptId: "ct02", goal: "Make your first line a question, a moment or a number.", tries: 2, measure: "fillers" } },
          // The first lines by heart
          { id: "rd-open-2", title: "The first 30 seconds, by heart", learn: { headline: "Learn the start and the end word for word.", body: "Nerves peak in the first minute. With your opening learned word for word, you can say it on autopilot while your body settles. Learn your last line too, and speak the middle from your points.", card: "point-not-script" }, practice: { mode: "lesson", promptId: "l011", goal: "A first line that makes people want the next.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 3
      {
        id: "close",
        title: "Close on purpose",
        blurb: "End on a line they keep.",
        parts: [
          // A callback to the opening
          { id: "rd-close-1", title: "Come back to the start", learn: { headline: "End where you began.", body: "Bring back your opening (the question, the moment, the number) at the end. It tells the audience the talk is complete, and makes the ending feel planned, because it was." }, see: { model: { question: "Close a talk that opened with: “Last night, a third of you slept less than six hours.”", answer: "So tonight, before the extra episode, remember that third of the room. Be in the other two thirds. Sleep well.", highlight: "remember that third of the room", notice: "The close brings back the opening’s number, then gives one thing to do." } }, practice: { mode: "response", promptId: "ct03", goal: "End on a line that echoes your opening or asks for one thing.", tries: 2, measure: "fillers" } },
          // Questions before the last line
          { id: "rd-close-2", title: "Questions before the close", learn: { headline: "Take questions, then give your last line.", body: "Ending on “Any questions?” hands the last word to whoever asks the oddest one. Take questions before your close, then finish with your planned last line, a pause, and “Thank you.”", card: "skills-close" }, practice: { mode: "lesson", promptId: "l010", goal: "End on the last line, then stop.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 4
      {
        id: "ladder",
        title: "Off the page",
        blurb: "Full script, then keywords, then nothing.",
        parts: [
          // The memory ladder
          { id: "rd-ladder-1", title: "The memory ladder", learn: { headline: "Full script, keywords, nothing.", body: "Reading a script sounds like reading. Climb down a ladder instead: rehearse once from the full text, then from a few keywords per section, then from nothing. Each rung is harder, and that effort is what makes it stick.", card: "practise-recall", link: { href: "/rehearse", label: "Use the memory ladder on your own talk in Rehearse my talk" } }, practice: { mode: "response", promptId: "ct04", goal: "Pick three keywords, then give it from those alone.", tries: 2, measure: "fillers" } },
          // Signposts
          { id: "rd-ladder-2", title: "Signposts", learn: { headline: "Give them a map.", body: "Say how many points you have, then mark each one as you reach it: “First… The second thing… Finally…”. Signposts keep the audience with you, and keep you on track when nerves hit.", card: "skills-signpost" }, practice: { mode: "lesson", promptId: "l007", goal: "First, next and finally stand out.", tries: 1, measure: "pace" } },
        ],
      },
      // Lesson 5
      {
        id: "nerves",
        title: "Nerves on the day",
        blurb: "What to do in the hour before, and if it wobbles.",
        parts: [
          // Nerves are mostly invisible
          { id: "rd-nerves-1", title: "They can’t see most of it", learn: { headline: "You look far less nervous than you feel.", body: "Speakers rate their own nerves far higher than audiences do. In one study, simply being told this made speakers calmer, and their talks were rated better. Your racing heart is mostly invisible. Arrive, breathe, then begin.", card: "nerves-show" }, practice: { mode: "lesson", promptId: "l001", goal: "Two seconds of silence before your first word.", tries: 1, measure: "fillers" } },
          // A warm-up before going on
          { id: "rd-nerves-2", title: "Warm up", learn: { headline: "Two minutes to warm up.", body: "Before you go on, drop your shoulders, take a few low breaths, do some lip trills, and say your first line out loud once. Then coach yourself by name, the way you would a friend: “Sam, you know this.”", card: "nerves-own-name", link: { href: "/voice/warmup", label: "Open the voice warm-up" } }, practice: { mode: "lesson", promptId: "l009", goal: "Clear before fast.", tries: 1, measure: "pace" } },
          // Recovering on the day
          { id: "rd-nerves-3", title: "If it wobbles", learn: { headline: "Pause, find your place, carry on.", body: "If you lose your place, stop, breathe, look at your keywords, and say your last point again. The pause feels huge to you and barely registers with them. Most people won’t remember it, and many won’t notice.", card: "skills-blank" }, practice: { mode: "lesson", promptId: "l015", goal: "A silent count of three, then carry on.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 6
      {
        id: "dress",
        title: "The dress rehearsal",
        blurb: "Give it the way you will on the day.",
        parts: [
          // A full, timed run
          { id: "rd-dress-1", title: "Stand up and time it", learn: { headline: "Rehearse it the way you’ll give it.", body: "Stand up, use your full voice, and time the whole thing. Talks run longer on the day than in your head, so if it’s over now, cut a point rather than plan to speak faster.", link: { href: "/rehearse", label: "Rehearse your own talk, start to finish" } }, practice: { mode: "response", promptId: "ct06", goal: "A hook, three points and a planned close, inside the time.", tries: 2, measure: "length" } },
          // One trusted listener
          { id: "rd-dress-2", title: "One trusted listener", learn: { headline: "One dry run, with one person.", body: "Before the day, give the talk once to someone you trust. Ask them only two things: what they remember, and where they drifted. What they remember tells you whether your message landed; where they drifted tells you what to cut." } },
        ],
      },
    ],
  },
  // Telling stories (decision 144)
  {
    id: "stories-that-land",
    focus: "stories",
    title: "Stories that land",
    blurb: "Turn what happened into a story people want to hear.",
    outcomes: ["Find stories in your own week", "Start in the middle of the action", "Join the beats with “but” and “so”", "Bring a moment to life with one detail and one line someone said", "End on the point, in under a minute"],
    draft: false,
    lessons: [
      // Lesson 1
      {
        id: "find",
        title: "You have stories",
        blurb: "Small moments count.",
        parts: [
          // Small moments
          { id: "sl-find-1", title: "Small moments count", learn: { headline: "Good stories come from small moments.", body: "You don’t need a shipwreck. A story is a moment when something changed, however small: the stranger who helped with the car, the recipe that failed, the call you kept putting off. Look for the moment, not the drama.", card: "story-small-moments" }, practice: { mode: "story", promptId: "sp06", story: { length: "full" }, goal: "Tell one small moment, and say what changed.", tries: 1, measure: "length" } },
          // One thing, not a list
          { id: "sl-find-2", title: "One thing, told well", learn: { headline: "Pick one thing and tell it well.", body: "Asked about your weekend, the list (“Saw friends, did some chores, watched a film”) closes the topic. One moment, told well, opens it.", instead: "“Oh, you know, saw some friends, did some chores.”", tryThis: "“I finally fixed the bike. It took three videos and one very patient neighbour.”", card: "story-one-thing" }, practice: { mode: "smalltalk", promptId: "st02", goal: "Pick one thing from your weekend and tell it as a moment.", tries: 2, measure: "length" } },
        ],
      },
      // Lesson 2
      {
        id: "middle",
        title: "Start in the middle",
        blurb: "Open in the action; the background can wait.",
        parts: [
          // Open in the action
          { id: "sl-mid-1", title: "Skip the run-up", learn: { headline: "Open in the action.", body: "Most stories start too early: the alarm, the commute, the weather. Start where things were happening, and fill in only the background people need, after.", instead: "“So I’d been meaning to go camping for ages, and on Saturday we got up quite early…”", tryThis: "“The tent was already floating when I woke up.”", card: "story-start-middle" }, see: { model: { question: "Tell me about a time a plan fell apart.", answer: "Three minutes before the speeches, the best man realised he’d left his notes in the taxi. I had the only other copy, on my phone, at four per cent battery.", highlight: "Three minutes before the speeches", notice: "The first sentence drops you into the moment; the background comes after." } }, practice: { mode: "story", promptId: "sp01", story: { focus: "middle", length: "full" }, goal: "Make your first sentence the moment things were happening.", tries: 2, measure: "length" } },
          // Stakes early
          { id: "sl-mid-2", title: "Something has to go wrong", learn: { headline: "No problem, no story.", body: "A story needs something at stake: something that could go wrong, or did. Before you tell it, ask yourself what the problem was, and say it early.", card: "story-stakes" }, practice: { mode: "story", promptId: "sp04", story: { length: "full" }, goal: "Say what could go wrong in your first few lines.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 3
      {
        id: "turns",
        title: "But, and so",
        blurb: "Tension keeps them listening.",
        parts: [
          // But and so
          { id: "sl-but-1", title: "“But” and “so”, not “and then”", learn: { headline: "Join the beats with “but” and “so”.", body: "“And then… and then…” is a list. “But” adds a problem; “so” shows what it caused. If a step only fits with “and then”, it can probably go.", card: "story-but-therefore" }, see: { model: { question: "Tell me about a recipe that went wrong.", answer: "I was baking my gran’s bread for her birthday, but I used salt instead of sugar. So I had an hour to start again, but the shops were shut. So we had pancakes, and she says it’s still the best birthday bread she never had.", highlight: "but I used salt instead of sugar", notice: "Every step is joined with “but” or “so”, so each one pushes the next." } }, practice: { mode: "story", promptId: "sp03", story: { shape: "but-therefore", length: "full" }, goal: "Join your steps with “but” and “so”.", tries: 2, measure: "length" } },
          // The before, so the change lands
          { id: "sl-but-2", title: "Show the before", learn: { headline: "A story is about a change.", body: "The ending lands only if the start shows how things were. Find your moment of change, then make sure your opening shows the before.", card: "story-turn" }, practice: { mode: "story", promptId: "sp09", story: { template: "turning-point", length: "full" }, goal: "How it was, the moment it changed, how it is now.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 4
      {
        id: "alive",
        title: "Bring it to life",
        blurb: "One detail and one line someone said.",
        parts: [
          // One vivid detail
          { id: "sl-alive-1", title: "One vivid detail", learn: { headline: "One small, true detail.", body: "What someone was holding, the song playing, the exact time. One small detail people can see or hear makes the rest of the story believable. One is enough; five is a list.", card: "story-detail" }, practice: { mode: "story", promptId: "sp14", story: { focus: "detail", length: "full" }, goal: "Add one small detail people could see or hear.", tries: 2, measure: "length" } },
          // One line of dialogue
          { id: "sl-alive-2", title: "Say what they said", learn: { headline: "Quote one line.", body: "At the key moment, swap “she said no” for the words she used, in her voice. One line of what someone said turns a summary into a scene.", instead: "“My boss said it wasn’t good enough.”", tryThis: "“My boss slid it back across the desk: ‘Again. Shorter.’”", card: "story-dialogue" }, practice: { mode: "story", promptId: "sp12", story: { focus: "dialogue", length: "full" }, goal: "Quote one line someone said, in their words.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 5
      {
        id: "point",
        title: "End on the point",
        blurb: "Say why it mattered, then stop.",
        parts: [
          // The last line
          { id: "sl-end-1", title: "Why you’re telling it", learn: { headline: "Say why it mattered, then stop.", body: "Know your last line before you start: the change, the lesson or the laugh. Say it, pause, and stop. A story that trails off (“so yeah, that was that”) undoes its own ending.", card: "story-end-point" }, practice: { mode: "story", promptId: "sp08", story: { focus: "point", length: "full" }, goal: "End on why it mattered, then stop.", tries: 2, measure: "length" } },
          // The lesson-learned shape for work
          { id: "sl-end-2", title: "Stories for work", learn: { headline: "A lesson learned, in four beats.", body: "In interviews and talks, the most useful shape is the lesson learned: the situation, what went wrong, what you did, what you learned. Tell the mistake plainly, without making yourself the joke.", card: "story-vulnerable" }, practice: { mode: "story", promptId: "sp02", story: { template: "lesson", length: "full" }, goal: "The situation, what went wrong, what you did, what you learned.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 6
      {
        id: "run",
        title: "The run: tell it shorter",
        blurb: "Keep the good part; cut the rest.",
        parts: [
          // Under a minute
          { id: "sl-run-1", title: "Under a minute", learn: { headline: "In conversation, under a minute.", body: "Cut the background; keep the detail, the turn and the last line. Most stories get better when they get shorter, because what’s left is the good part.", card: "story-length" }, practice: { mode: "story", promptId: "sp10", story: { focus: "minute", length: "short" }, goal: "Under a minute: the detail, the turn, the last line.", tries: 2, measure: "length" } },
          // 4/3/2
          { id: "sl-run-2", title: "Three times, shorter each time", learn: { headline: "Tell it three times, shorter each time.", body: "Tell one story three times in a row: about a minute, then 45 seconds, then 30. Keep the detail and the ending; cut the rest. The repeats are where it becomes easy to tell.", card: "story-retell", link: { href: "/practice/four-three-two", label: "Open the 4/3/2 drill" } } },
        ],
      },
    ],
  },
  // Small talk and conversations (decision 144)
  {
    id: "beyond-good-you",
    focus: "conversation",
    title: "Beyond “good, you?”",
    blurb: "Keep a conversation going, and let it go somewhere.",
    outcomes: ["Answer with something people can ask about", "Ask a follow-up about what they said", "Show you’re listening, out loud", "Go one level deeper", "Start and leave a conversation warmly"],
    draft: false,
    lessons: [
      // Lesson 1
      {
        id: "hook",
        title: "Answer with a hook",
        blurb: "Give them something to ask about.",
        parts: [
          // Past the one-word answer
          { id: "bg-hook-1", title: "The dead end", learn: { headline: "“Good, you?” closes the door.", body: "A one-word answer hands all the work back. Add one thing that happened, and a detail someone could ask about: a name, a place, a number.", instead: "“Good, you?”", tryThis: "“Good, actually. I finally tried the climbing wall on King Street.”", card: "story-hook" }, practice: { mode: "smalltalk", promptId: "st01", goal: "Answer with one moment and a detail they could ask about.", tries: 2, measure: "length" } },
          // Handing it back
          { id: "bg-hook-2", title: "Hand it back", learn: { headline: "Share, then hand it back.", body: "End your answer with a real question, ideally one linked to what you just said: “Have you ever tried it?” Sharing a little, then handing over, is how people get closer.", card: "warm-share" }, practice: { mode: "smalltalk", promptId: "st12", goal: "Answer in a few lines, then hand it back with a question.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 2
      {
        id: "ask",
        title: "Ask the second question",
        blurb: "The follow-up is in what they just said.",
        parts: [
          // Following their detail
          { id: "bg-ask-1", title: "Follow their detail", learn: { headline: "Your next question is in what they just said.", body: "People who ask follow-up questions are liked more, and the follow-up is usually sitting in the other person’s last sentence. “I just got back from Lisbon” hands you Lisbon.", card: "talk-follow-ups" }, see: { model: { question: "“I just got back from a week in Lisbon.”", answer: "Oh, nice! What took you to Lisbon?", highlight: "What took you to Lisbon?", notice: "The question picks up their detail, and it can’t be answered with yes or no." } }, practice: { mode: "smalltalk", promptId: "sa01", goal: "Ask one open question about the detail they gave you.", tries: 2, measure: "fillers" } },
          // Not turning it back to you
          { id: "bg-ask-2", title: "Don’t boomerask", learn: { headline: "Stay with their answer one more turn.", body: "Asking “How was your weekend?” only so you can talk about yours is a boomerask, and it backfires. Stay with their answer for one more question before you share.", card: "talk-boomerask" }, practice: { mode: "smalltalk", promptId: "sa03", goal: "Ask about them, and don’t bring it back to you.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 3
      {
        id: "listen",
        title: "Listen out loud",
        blurb: "React, then ask about the moment.",
        parts: [
          // Reacting to a story
          { id: "bg-listen-1", title: "React to the story", learn: { headline: "React, and they’ll tell it better.", body: "Listeners shape a story. A wince, a laugh, a “wait, really?” at the right moment makes the teller better at telling it. React to their story, not with one of your own.", card: "talk-co-narrators" }, practice: { mode: "smalltalk", promptId: "sls03", goal: "React to their story before you say anything about yourself.", tries: 2, measure: "fillers" } },
          // Good news
          { id: "bg-listen-2", title: "Good news, a real reaction", learn: { headline: "React, then ask about the moment.", body: "When someone shares good news, a flat “nice” or a quick “but…” lets the air out. React for real, then ask about the moment itself: “When did they call you?”", card: "warm-good-news" }, practice: { mode: "smalltalk", promptId: "sn01", goal: "React for real, then ask about the moment.", tries: 1, measure: "fillers" } },
          // Hard news
          { id: "bg-listen-3", title: "Name the feeling", learn: { headline: "Understood, makes sense, cares.", body: "For hard news, hold the advice. Show you heard one detail, say back how it sounds (“That sounds exhausting”), and ask one question before you offer any fix.", card: "warm-responsive" }, practice: { mode: "smalltalk", promptId: "sn04", goal: "Say back the feeling, then ask one question. No advice yet.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 4
      {
        id: "deeper",
        title: "One level deeper",
        blurb: "From what to why.",
        parts: [
          // Meaning, not facts
          { id: "bg-deep-1", title: "From what to why", learn: { headline: "Ask about meaning, not facts.", body: "“How long have you lived here?” gets a number. “What made you choose here?” gets a story. Deeper questions go better than people expect, for both people.", card: "talk-deeper" }, practice: { mode: "smalltalk", promptId: "sd08", goal: "Turn the fact question into one about why, or how it felt.", tries: 2, measure: "fillers" } },
          // Sharing a little first
          { id: "bg-deep-2", title: "Share a little first", learn: { headline: "Opening up invites opening up.", body: "Only asking can feel like an interview. Match their depth, add a little of your own (a real feeling, not a boast), then hand it back.", tryThis: "“Honestly? Exciting and a bit terrifying. Have you ever switched jobs mid-year?”" }, practice: { mode: "smalltalk", promptId: "sd05", goal: "Answer with one real feeling, then ask them something back.", tries: 1, measure: "length" } },
        ],
      },
      // Lesson 5
      {
        id: "edges",
        title: "Start and leave well",
        blurb: "An easy way in, and a warm way out.",
        parts: [
          // Opening on what's around
          { id: "bg-edge-1", title: "Open on what’s around you", learn: { headline: "Start with what you can both see.", body: "The easiest opener is something you share right now: the slow kettle, the new menu, the puppy. It needs no wit, and it gives the other person an easy reply. Small talk is the on-ramp, not the destination.", card: "warm-small-talk" }, practice: { mode: "smalltalk", promptId: "se01", goal: "Open with something you can both see, then ask one easy question.", tries: 2, measure: "fillers" } },
          // A warm exit
          { id: "bg-edge-2", title: "Leave while it’s good", learn: { headline: "A warm exit is a kindness.", body: "Most conversations go on longer than either person wants. Leave on a high point: say one thing you enjoyed, give a reason to go, and leave the door open.", tryThis: "“This was great. I’m going to grab some food, but let’s pick this up.”", card: "talk-endings" }, practice: { mode: "smalltalk", promptId: "sel4", goal: "One thing you enjoyed, a reason to go, a hope to talk again.", tries: 1, measure: "fillers" } },
        ],
      },
      // Lesson 6
      {
        id: "run",
        title: "The run",
        blurb: "All of it, in one answer and one conversation.",
        parts: [
          // All four beats, then a real conversation
          { id: "bg-run-1", title: "All together", learn: { headline: "Moment, hook, feeling, hand it back.", body: "Put the answer together in about thirty seconds: one moment, a detail to ask about, how it felt, and a question back. Then try a whole conversation with a partner, and listen for their details.", link: { href: "/conversations", label: "Then have a whole conversation in Talk with someone" } }, practice: { mode: "smalltalk", promptId: "stl6", goal: "One moment, a hook, how it felt, and a question back.", tries: 2, measure: "length" } },
        ],
      },
    ],
  },
  // How I sound (decision 144)
  {
    id: "voice-lean-in",
    focus: "voice",
    title: "A voice they lean in for",
    blurb: "Sound clear, steady and like you mean it.",
    outcomes: ["Breathe low and warm up in two minutes", "Finish every word clearly", "Slow down and pause on purpose", "Lean on the word that matters", "Let statements fall, and fill a room without shouting"],
    draft: false,
    lessons: [
      // Lesson 1
      {
        id: "breath",
        title: "Breath first",
        blurb: "A steady voice starts low.",
        parts: [
          // Low breath
          { id: "vo-breath-1", title: "Low breath", learn: { headline: "Breathe low, shoulders down.", body: "When nerves rise, breathing climbs into the chest and the voice goes thin. Drop your shoulders, breathe in so your belly moves, and start speaking on the way out.", link: { href: "/voice/warmup", label: "Open the two-minute voice warm-up" } }, practice: { mode: "read", promptId: "r007", goal: "Breathe low before each sentence, and read it steadily.", tries: 1, measure: "pace" } },
          // Air for the ending
          { id: "vo-breath-2", title: "Air for the ending", learn: { headline: "Give your endings air.", body: "Sentences that creak or fade at the end have run out of breath. Breathe a little sooner, at the comma, so your last words have air to land.", card: "voice-fry-mixed" }, practice: { mode: "read", promptId: "r010", goal: "Breathe at the commas, so the last words are as strong as the first.", tries: 1, measure: "pace" } },
        ],
      },
      // Lesson 2
      {
        id: "clear",
        title: "Clear sounds",
        blurb: "Finish every word.",
        parts: [
          // Word endings
          { id: "vo-clear-1", title: "Finish every word", learn: { headline: "Finish the ends of your words.", body: "The t in “fact”, the d in “planned”, the k in “task”: endings carry meaning, and they’re the first thing lost when you rush or speak quietly.", card: "skills-consonants" }, practice: { mode: "lesson", promptId: "l002", goal: "Every word ending comes through.", tries: 2, measure: "pace" } },
          // Clear before fast
          { id: "vo-clear-2", title: "Clear first, fast later", learn: { headline: "Slowly first. Speed comes later.", body: "Tricky words and tongue twisters are a warm-up, not a test. Say them slowly and precisely first; speed comes once every sound is clean.", card: "skills-twister" }, practice: { mode: "read", promptId: "k001", goal: "Say every word clearly, at an easy pace.", tries: 1, measure: "pace" } },
        ],
      },
      // Lesson 3
      {
        id: "pace",
        title: "Pace and pauses",
        blurb: "Lively, with room for what matters.",
        parts: [
          // Brisk, then slow
          { id: "vo-pace-1", title: "Brisk, then slow", learn: { headline: "Keep it lively; slow down for what matters.", body: "A brisk pace sounds capable, but the line that matters needs room. Slow down for your key sentence, and for numbers and names, and let the rest move.", card: "voice-pace" }, practice: { mode: "read", promptId: "r009", goal: "Slow down for each name and number, with a short pause after it.", tries: 2, measure: "pace" } },
          // Where to pause
          { id: "vo-pace-2", title: "Pause on purpose", learn: { headline: "Pause between sentences, not inside them.", body: "Where you pause matters more than how often. A pause between sentences sounds sure; one in the middle of a sentence sounds lost. Plan the next phrase in the gap, then say it in one go.", card: "profile-pause-place" }, practice: { mode: "pause", promptId: "d001", goal: "A pause at each mark, and none in the middle of a sentence.", tries: 2, measure: "pace" } },
        ],
      },
      // Lesson 4
      {
        id: "stress",
        title: "Stress the key word",
        blurb: "One word carries the meaning.",
        parts: [
          // One word per line
          { id: "vo-stress-1", title: "Lean on one word", learn: { headline: "Lean on the word that matters.", body: "“I didn’t say she took it” means something different depending on the word you lean on. Before a key line, pick its one word and give it a little more: louder, longer or higher.", card: "skills-stress", link: { href: "/voice/drill?id=p05", label: "Try the drill: Same sentence, different stress" } }, practice: { mode: "lesson", promptId: "l006", goal: "Your highest pitch lands on the key word.", tries: 2, measure: "pace" } },
          // Following the meaning
          { id: "vo-stress-2", title: "Follow the meaning", learn: { headline: "Slower for serious, brighter for good news.", body: "A flat voice usually isn’t your voice; it’s your voice talking to nobody. Picture one person who would want to hear this, and let your pace, volume and pitch follow what the words mean.", card: "voice-flat-situational", link: { href: "/voice/drill?id=t01", label: "Try the tone drill: I have some news" } }, practice: { mode: "lesson", promptId: "l016", goal: "Pace, volume and pitch follow the meaning.", tries: 1, measure: "pace" } },
        ],
      },
      // Lesson 5
      {
        id: "low",
        title: "Land it low",
        blurb: "Fall to state; rise to invite.",
        parts: [
          // Falling at the end
          { id: "vo-low-1", title: "Fall to state", learn: { headline: "Fall to state; rise to invite.", body: "Rising at the end of a statement can make a decision sound like a question. For your key point or a decision, keep your voice up through the last word, then let it fall. Keep rises for when you want a reply.", card: "voice-uptalk", link: { href: "/voice/drill?id=p02", label: "Try the pitch drill: Land it low" } }, practice: { mode: "lesson", promptId: "l005", goal: "Your voice holds up through the last word, then falls.", tries: 2, measure: "pace" } },
          // Relaxed, not forced
          { id: "vo-low-2", title: "Relaxed, not forced", learn: { headline: "A calm voice settles lower on its own.", body: "Lower voices are often heard as more confident, but pushing your pitch down sounds strained. Breathe out, relax your shoulders, and let each sentence fall to its full stop.", card: "voice-pitch" }, practice: { mode: "read", promptId: "r008", goal: "Breathe out first, then let each sentence fall to its full stop.", tries: 1, measure: "pace" } },
        ],
      },
      // Lesson 6
      {
        id: "room",
        title: "Fill the room",
        blurb: "More breath, not more throat.",
        parts: [
          // Volume from breath
          { id: "vo-room-1", title: "Loud is not shouting", learn: { headline: "More breath, not more throat.", body: "A louder voice, with variety on top, sounds more confident. The volume comes from breath: breathe low, speak to the farthest person, and let it rise and fall with what matters.", card: "voice-project", link: { href: "/voice/drill?id=v01", label: "Try the drill: Three rooms, the greeting" } }, practice: { mode: "read", promptId: "r005", goal: "Read it to the back of a big room: full voice, never shouting.", tries: 1, measure: "pace" } },
        ],
      },
      // Lesson 7
      {
        id: "run",
        title: "The run",
        blurb: "A great speech, with all of it.",
        parts: [
          // A speech with everything
          { id: "vo-run-1", title: "A speech, with all of it", learn: { headline: "Read a great speech like you mean it.", body: "Put it together: breathe low, finish your words, slow down for the key lines, pause between sentences, and let the endings fall. Speeches written to be heard make the best practice.", link: { href: "/voice/shadow?id=s01", label: "Then shadow it: speak along with a recording" } }, practice: { mode: "read", promptId: "r004", goal: "Low breath, clear endings, pauses between sentences, endings that fall.", tries: 2, measure: "pace" } },
        ],
      },
    ],
  },
];
